from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnableBranch, RunnableLambda, RunnablePassthrough
from langchain_groq import ChatGroq
from langchain_community.embeddings.fastembed import FastEmbedEmbeddings
from langchain_community.vectorstores.pgvector import PGVector
from tavily import TavilyClient
import os


def create_qna_agent(policy_id: int):
    """Creates the main Q&A agent with improved RAG, routing and formatting."""

    # --- Setup ---
    fast_llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0)
    quality_llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0)
    # Use FastEmbed (local embeddings) instead of Google API to avoid quota limits
    embeddings = FastEmbedEmbeddings(model_name="BAAI/bge-small-en-v1.5")
    connection_string = PGVector.connection_string_from_db_params(
        driver="psycopg2", host=os.getenv("DB_HOST"), port=int(os.getenv("DB_PORT", 5432)),
        database=os.getenv("DB_NAME"), user=os.getenv("DB_USER"), password=os.getenv("DB_PASSWORD")
    )
    vectorstore = PGVector(
        connection_string=connection_string, embedding_function=embeddings,
        collection_name="policy_vectors", pre_delete_collection=False
    )
    # Increase k for better coverage and use MMR for diversity
    retriever = vectorstore.as_retriever(
        search_type="mmr",  # Maximum Marginal Relevance for diverse results
        search_kwargs={
            'filter': {'policy_id': policy_id},
            'k': 8,  # Retrieve more documents
            'fetch_k': 20,  # Consider more candidates before MMR
            'lambda_mult': 0.5  # Balance between relevance and diversity
        }
    )
    tavily_search = TavilyClient(api_key=os.environ["TAVILY_API_KEY"])

    # --- Classifier Chain ---
    classifier_prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a classification model. Your job is to determine the category of the user's question. Respond with *only* the category name. The categories are: 'policy', 'greeting', 'farewell', 'general'."),
        ("user", "{question}")
    ])
    classifier_chain = classifier_prompt | fast_llm | StrOutputParser()

    # --- RAG, Search, and Conversational Chains ---
    policy_rag_prompt = ChatPromptTemplate.from_template(
        "You are a helpful privacy policy assistant. Use ONLY the following context from the privacy policy to answer the user's question accurately. "
        "If the context doesn't contain enough information to answer the question, say so clearly. "
        "Format your answer clearly using paragraphs and bold markdown for emphasis on key terms or headings. Do not use asterisks for top-level headings.\n\n"
        "Retrieved Policy Sections:\n{context}\n\n"
        "User's Question:\n{question}\n\n"
        "Instructions:\n"
        "1. Base your answer strictly on the retrieved sections above\n"
        "2. Quote specific parts when relevant\n"
        "3. If multiple sections are relevant, synthesize them coherently\n"
        "4. If the answer is unclear or not found, state that explicitly\n"
        "5. Use clear, plain language while being accurate"
    )

    # Custom function to format retrieved documents
    def format_docs(docs):
        return "\n\n---\n\n".join([f"Section {i+1}:\n{doc.page_content}" for i, doc in enumerate(docs)])

    policy_rag_chain = (
        RunnablePassthrough.assign(
            context=(lambda x: format_docs(retriever.invoke(x["question"]))))
        | policy_rag_prompt | quality_llm | StrOutputParser()
    )

    general_search_chain = (
        RunnablePassthrough.assign(search_results=lambda x: tavily_search.search(
            query=x["question"], max_results=3)["results"])
        | ChatPromptTemplate.from_template("Synthesize the web search results into a coherent answer.\n\nSearch Results:\n{search_results}\n\nQuestion:\n{question}")
        | quality_llm | StrOutputParser()
    )
    greeting_chain = RunnableLambda(
        lambda x: "Hello! I'm PrivacyLens. How can I help you today?")
    farewell_chain = RunnableLambda(
        lambda x: "You're welcome! Feel free to ask if you have more questions. Goodbye!")

    # --- Router ---
    router = RunnableBranch(
        (lambda x: "greeting" in x["topic"], greeting_chain),
        (lambda x: "farewell" in x["topic"], farewell_chain),
        (lambda x: "policy" in x["topic"], policy_rag_chain),
        general_search_chain,
    )

    # --- Full Agent ---
    full_qna_agent = (RunnablePassthrough.assign(
        topic=classifier_chain) | router)

    print(f"\nQ&A Agent ready for Policy ID: {policy_id}")
    return full_qna_agent
