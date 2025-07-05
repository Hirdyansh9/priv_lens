from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnableBranch, RunnableLambda, RunnablePassthrough
from langchain_groq import ChatGroq
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores.pgvector import PGVector
from tavily import TavilyClient
import os

def create_qna_agent(policy_id: int):
    """Creates the main Q&A agent with improved routing and formatting."""

    # --- Setup ---
    fast_llm = ChatGroq(model="llama3-8b-8192", temperature=0)
    quality_llm = ChatGroq(model="llama3-70b-8192", temperature=0)
    embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
    connection_string = PGVector.connection_string_from_db_params(
        driver="psycopg2", host=os.getenv("DB_HOST"), port=int(os.getenv("DB_PORT", 5432)),
        database=os.getenv("DB_NAME"), user=os.getenv("DB_USER"), password=os.getenv("DB_PASSWORD")
    )
    vectorstore = PGVector(
        connection_string=connection_string, embedding_function=embeddings,
        collection_name="policy_vectors", pre_delete_collection=False
    )
    retriever = vectorstore.as_retriever(search_kwargs={'filter': {'policy_id': policy_id}})
    tavily_search = TavilyClient(api_key=os.environ["TAVILY_API_KEY"])

    # --- Classifier Chain ---
    classifier_prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a classification model. Your job is to determine the category of the user's question. Respond with *only* the category name. The categories are: 'policy', 'greeting', 'farewell', 'general'."),
        ("user", "{question}")
    ])
    classifier_chain = classifier_prompt | fast_llm | StrOutputParser()

    # --- RAG, Search, and Conversational Chains ---
    policy_rag_prompt = ChatPromptTemplate.from_template(
        "You are a helpful assistant. Use the following context from a privacy policy to answer the user's question. "
        "Format your answer clearly using paragraphs and bold markdown for emphasis on key terms or headings. Do not use asterisks for top-level headings.\n\n"
        "Context:\n{context}\n\n"
        "Question:\n{question}"
    )
    policy_rag_chain = (
        RunnablePassthrough.assign(context=(lambda x: x["question"]) | retriever)
        | policy_rag_prompt | quality_llm | StrOutputParser()
    )

    general_search_chain = (
        RunnablePassthrough.assign(search_results=lambda x: tavily_search.search(query=x["question"], max_results=3)["results"])
        | ChatPromptTemplate.from_template("Synthesize the web search results into a coherent answer.\n\nSearch Results:\n{search_results}\n\nQuestion:\n{question}")
        | quality_llm | StrOutputParser()
    )
    greeting_chain = RunnableLambda(lambda x: "Hello! I'm PrivacyLens. How can I help you today?")
    farewell_chain = RunnableLambda(lambda x: "You're welcome! Feel free to ask if you have more questions. Goodbye!")

    # --- Router ---
    router = RunnableBranch(
        (lambda x: "greeting" in x["topic"], greeting_chain),
        (lambda x: "farewell" in x["topic"], farewell_chain),
        (lambda x: "policy" in x["topic"], policy_rag_chain),
        general_search_chain,
    )

    # --- Full Agent ---
    full_qna_agent = (RunnablePassthrough.assign(topic=classifier_chain) | router)

    print(f"\nQ&A Agent ready for Policy ID: {policy_id}")
    return full_qna_agent