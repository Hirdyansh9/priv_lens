import os
import psycopg2
from langchain_community.vectorstores.pgvector import PGVector
from langchain_core.documents import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings

def get_db_connection():
    db_password = os.getenv("DB_PASSWORD")
    if not db_password:
        raise ValueError("Database password not found in environment. Check your .env file.")
    return psycopg2.connect(
        dbname=os.getenv("DB_NAME"), user=os.getenv("DB_USER"),
        password=db_password, host=os.getenv("DB_HOST"), port=os.getenv("DB_PORT")
    )

def get_all_chats():
    """Fetches all past analysis sessions to populate the sidebar."""
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT policy_id, display_title FROM privacy_policies ORDER BY created_at DESC;")
        chats = cur.fetchall()
        return [{"policy_id": row[0], "title": row[1]} for row in chats]
    finally:
        cur.close()
        conn.close()

def get_chat_history(policy_id: int):
    """Fetches the message history for a specific chat."""
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT is_user_message, message_text FROM chat_messages WHERE policy_id = %s ORDER BY created_at ASC;", (policy_id,))
        history = cur.fetchall()
        return [{"user": row[0], "text": row[1]} for row in history]
    finally:
        cur.close()
        conn.close()

def save_chat_message(policy_id: int, is_user: bool, text: str):
    """Saves a new chat message to the database."""
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("INSERT INTO chat_messages (policy_id, is_user_message, message_text) VALUES (%s, %s, %s);", (policy_id, is_user, text))
        conn.commit()
    finally:
        cur.close()
        conn.close()

def rename_chat(policy_id: int, new_title: str):
    """Renames a chat by updating its display_title."""
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("UPDATE privacy_policies SET display_title = %s WHERE policy_id = %s;", (new_title, policy_id))
        conn.commit()
    finally:
        cur.close()
        conn.close()

def delete_chat(policy_id: int):
    """Deletes a chat and all its related data."""
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM privacy_policies WHERE policy_id = %s;", (policy_id,))
        conn.commit()
    finally:
        cur.close()
        conn.close()

def ingest_and_embed_policy(policy_id, policy_text):
    """Splits policy, creates Documents with metadata, and adds them to PGVector."""
    print(f"\nEmbedding policy ID: {policy_id}...")
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    chunks = text_splitter.split_text(policy_text)
    documents = [Document(page_content=chunk, metadata={"policy_id": policy_id}) for chunk in chunks]
    embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
    connection_string = PGVector.connection_string_from_db_params(
        driver="psycopg2", host=os.getenv("DB_HOST"), port=int(os.getenv("DB_PORT", 5432)),
        database=os.getenv("DB_NAME"), user=os.getenv("DB_USER"), password=os.getenv("DB_PASSWORD")
    )
    PGVector.from_documents(embedding=embeddings, documents=documents, collection_name="policy_vectors", connection_string=connection_string)
    print(f"Successfully embedded {len(documents)} chunks.")

def save_analysis_results(policy_text, analysis_data):
    """Saves the structured analysis results and sets the initial display_title."""
    print("\nSaving analysis to database...")
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT company_id FROM companies WHERE company_name = %s", (analysis_data.company_name,))
        company = cur.fetchone()
        if company: company_id = company[0]
        else:
            cur.execute("INSERT INTO companies (company_name) VALUES (%s) RETURNING company_id", (analysis_data.company_name,))
            company_id = cur.fetchone()[0]
        
        # Insert policy and set the display_title in one go
        cur.execute(
            "INSERT INTO privacy_policies (company_id, policy_text, display_title) VALUES (%s, %s, %s) RETURNING policy_id",
            (company_id, policy_text, analysis_data.company_name)
        )
        policy_id = cur.fetchone()[0]

        cur.execute("""
            INSERT INTO analysis_results (policy_id, pii_collected, data_sharing_practices, retention_summary, risk_score, final_summary)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (policy_id, analysis_data.pii_collected, analysis_data.data_sharing_practices,
             analysis_data.retention_summary, analysis_data.risk_score, analysis_data.final_summary)
        )
        conn.commit()
        print(f"Analysis saved. Policy ID: {policy_id}")
        ingest_and_embed_policy(policy_id, policy_text)
        return policy_id
    finally:
        cur.close()
        conn.close()