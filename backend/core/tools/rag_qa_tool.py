import os
from langchain.retrievers import ContextualCompressionRetriever
from langchain.retrievers.document_compressors import EmbeddingsFilter
from langchain_community.vectorstores.pgvector import PGVector
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_core.prompts import ChatPromptTemplate

CONNECTION_STRING = "postgresql+psycopg2://{user}:{password}@{host}:{port}/{dbname}".format(
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    host=os.getenv("DB_HOST"),
    port=os.getenv("DB_PORT"),
    dbname=os.getenv("DB_NAME"),
)

def get_vectorstore(collection_name="policy_vectors"):
    embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
    return PGVector(
        collection_name=collection_name,
        connection_string=CONNECTION_STRING,
        embedding_function=embeddings,
    )

def ingest_and_embed_policy(policy_id: int, policy_text: str):
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    chunks = text_splitter.split_text(policy_text)

    vectorstore = get_vectorstore()
    vectorstore.add_texts(
        texts=chunks,
        metadatas=[{"policy_id": policy_id} for _ in chunks],
    )
    print(f"Embedded {len(chunks)} chunks for policy_id {policy_id}.")


def create_rag_chain(policy_id: int):
    llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash-latest", temperature=0)
    vectorstore = get_vectorstore()
    base_retriever = vectorstore.as_retriever(
        search_kwargs={'filter': {'policy_id': policy_id}}
    )

    embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
    embeddings_filter = EmbeddingsFilter(embeddings=embeddings, similarity_threshold=0.76)
    compression_retriever = ContextualCompressionRetriever(
        base_compressor=embeddings_filter, base_retriever=base_retriever
    )

    template = """
    You are an assistant for question-answering tasks.
    Use ONLY the following pieces of retrieved context from the privacy policy to answer the question.
    If the context does not contain the answer, say that the information is not found in the document.

    Question: {question}
    Context: {context}
    Answer:
    """
    prompt = ChatPromptTemplate.from_template(template)

    rag_chain = (
        {"context": compression_retriever, "question": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )
    return rag_chain


