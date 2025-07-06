import os
import psycopg2
from langchain_community.vectorstores.pgvector import PGVector
from langchain_core.documents import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import date

from backend.core.pydantic_models import PrivacyAnalysis

# --- Database Connection ---
def get_db_connection():
    db_password = os.getenv("DB_PASSWORD")
    if not db_password:
        raise ValueError("Database password not found in environment. Check your .env file.")
    return psycopg2.connect(
        dbname=os.getenv("DB_NAME"), user=os.getenv("DB_USER"),
        password=db_password, host=os.getenv("DB_HOST"), port=os.getenv("DB_PORT")
    )

# --- User Management Functions ---
def create_user(username, password, role='user'):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        hashed_password = generate_password_hash(password)
        cur.execute(
            "INSERT INTO users (username, password_hash, role) VALUES (%s, %s, %s) RETURNING user_id",
            (username, hashed_password, role)
        )
        user_id = cur.fetchone()[0]
        conn.commit()
        return user_id
    finally:
        cur.close()
        conn.close()

def get_user_by_username(username):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            "SELECT user_id, username, password_hash, role, daily_message_count, last_message_date FROM users WHERE username = %s", 
            (username,)
        )
        user_data = cur.fetchone()
        if user_data:
            return { "user_id": user_data[0], "username": user_data[1], "password_hash": user_data[2], "role": user_data[3], "daily_message_count": user_data[4], "last_message_date": user_data[5] }
        return None
    finally:
        cur.close()
        conn.close()

def get_user_by_id(user_id):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            "SELECT user_id, username, role, daily_message_count, last_message_date FROM users WHERE user_id = %s", 
            (user_id,)
        )
        user_data = cur.fetchone()
        if user_data:
            return { "user_id": user_data[0], "username": user_data[1], "role": user_data[2], "daily_message_count": user_data[3], "last_message_date": user_data[4] }
        return None
    finally:
        cur.close()
        conn.close()

def check_and_update_message_count(user_id):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT role, daily_message_count, last_message_date FROM users WHERE user_id = %s", (user_id,))
        user = cur.fetchone()
        if not user: return False, "User not found."
        role, count, last_date = user
        if role == 'admin': return True, "Admin has unlimited messages."
        today = date.today()
        if last_date != today:
            count = 0
            cur.execute("UPDATE users SET daily_message_count = 0, last_message_date = %s WHERE user_id = %s", (today, user_id))
        if count >= 20: return False, "You have reached your daily message limit of 20."
        cur.execute("UPDATE users SET daily_message_count = daily_message_count + 1 WHERE user_id = %s", (user_id,))
        conn.commit()
        return True, "Message count updated."
    finally:
        cur.close()
        conn.close()

# --- Analysis and Chat Functions ---
def save_analysis_results(policy_text: str, analysis_data: dict, user_id: int):
    try:
        validated_analysis = PrivacyAnalysis(**analysis_data)
    except Exception as e:
        raise ValueError(f"Received malformed analysis data from the model: {e}")
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT company_id FROM companies WHERE company_name = %s", (validated_analysis.company_name,))
        company = cur.fetchone()
        if company: company_id = company[0]
        else:
            cur.execute("INSERT INTO companies (company_name) VALUES (%s) RETURNING company_id", (validated_analysis.company_name,))
            company_id = cur.fetchone()[0]
        cur.execute(
            "INSERT INTO privacy_policies (company_id, user_id, policy_text, display_title) VALUES (%s, %s, %s, %s) RETURNING policy_id",
            (company_id, user_id, policy_text, validated_analysis.company_name)
        )
        policy_id = cur.fetchone()[0]
        cur.execute("""
            INSERT INTO analysis_results (policy_id, pii_collected, data_sharing_practices, retention_summary, risk_score, final_summary)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (policy_id, validated_analysis.pii_collected, validated_analysis.data_sharing_practices,
             validated_analysis.retention_summary, validated_analysis.risk_score, validated_analysis.final_summary)
        )
        conn.commit()
        ingest_and_embed_policy(policy_id, policy_text)
        return policy_id
    finally:
        cur.close()
        conn.close()

def get_all_chats(user_id: int):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT policy_id, display_title FROM privacy_policies WHERE user_id = %s ORDER BY created_at DESC;", (user_id,))
        chats = cur.fetchall()
        return [{"policy_id": row[0], "title": row[1]} for row in chats]
    finally:
        cur.close()
        conn.close()

def get_chat_history(policy_id: int, user_id: int):
    """Fetches the full history of a specific chat, including the analysis."""
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT user_id FROM privacy_policies WHERE policy_id = %s", (policy_id,))
        result = cur.fetchone()
        if not result or result[0] != user_id: return None
        cur.execute("""
            SELECT a.pii_collected, a.data_sharing_practices, a.retention_summary, a.risk_score, a.final_summary, p.display_title
            FROM analysis_results a
            JOIN privacy_policies p ON a.policy_id = p.policy_id
            WHERE a.policy_id = %s
        """, (policy_id,))
        analysis_data = cur.fetchone()
        if not analysis_data: return None
        cur.execute("SELECT is_user_message, message_text FROM chat_messages WHERE policy_id = %s ORDER BY created_at ASC", (policy_id,))
        messages = cur.fetchall()

        # --- FIX: Ensure company_name is included in the nested analysis object ---
        return {
            "policy_id": policy_id,
            "title": analysis_data[5],
            "analysis": {
                "company_name": analysis_data[5], # This was the missing piece
                "pii_collected": analysis_data[0],
                "data_sharing_practices": analysis_data[1],
                "retention_summary": analysis_data[2],
                "risk_score": analysis_data[3],
                "final_summary": analysis_data[4],
            },
            "history": [{"is_user": row[0], "text": row[1]} for row in messages]
        }
    finally:
        cur.close()
        conn.close()

# --- Other functions (save_chat_message, rename_chat, delete_chat, vector store) are unchanged ---
def save_chat_message(policy_id: int, user_id: int, is_user: bool, text: str):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("INSERT INTO chat_messages (policy_id, user_id, is_user_message, message_text) VALUES (%s, %s, %s, %s);", (policy_id, user_id, is_user, text))
        conn.commit()
    finally:
        cur.close()
        conn.close()

def rename_chat(policy_id: int, user_id: int, new_title: str):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("UPDATE privacy_policies SET display_title = %s WHERE policy_id = %s AND user_id = %s", (new_title, policy_id, user_id))
        conn.commit()
        return cur.rowcount > 0
    finally:
        cur.close()
        conn.close()

def delete_chat(policy_id: int, user_id: int):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM privacy_policies WHERE policy_id = %s AND user_id = %s", (policy_id, user_id))
        conn.commit()
        return cur.rowcount > 0
    finally:
        cur.close()
        conn.close()

def get_vector_store():
    connection_string = PGVector.connection_string_from_db_params(
        driver="psycopg2", host=os.environ.get("DB_HOST"), port=int(os.environ.get("DB_PORT")),
        database=os.environ.get("DB_NAME"), user=os.environ.get("DB_USER"), password=os.environ.get("DB_PASSWORD"),
    )
    embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
    return PGVector(collection_name="policy_vectors", connection_string=connection_string, embedding_function=embeddings)

def ingest_and_embed_policy(policy_id: int, policy_text: str):
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    docs = text_splitter.split_text(policy_text)
    documents = [Document(page_content=chunk, metadata={"policy_id": policy_id}) for chunk in docs]
    vector_store = get_vector_store()
    vector_store.add_documents(documents)
