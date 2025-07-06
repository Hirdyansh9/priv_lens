import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import traceback

load_dotenv()

from backend.core.graph import build_analysis_graph
from backend.core.qa_agent import create_qna_agent
from backend.utils.db import (
    get_db_connection, save_analysis_results, get_all_chats,
    get_chat_history, save_chat_message, rename_chat, delete_chat
)
from backend.utils.parser import get_text_from_url

app = Flask(__name__)
CORS(app)
agent_cache = {}

@app.errorhandler(Exception)
def handle_global_exception(e):
    """Catches all unhandled exceptions and returns a JSON response."""
    print("--- A GLOBAL EXCEPTION WAS CAUGHT ---")
    traceback.print_exc()
    print("------------------------------------")
    response = { "error": "An unexpected server error occurred.", "details": str(e) }
    return jsonify(response), 500

@app.route('/api/analyze', methods=['POST'])
def analyze():
    data = request.json
    source_type = data.get('source_type')
    source_data = data.get('data')

    if not source_type or not source_data:
        return jsonify({"error": "Missing 'source_type' or 'data'"}), 400

    try:
        if source_type == 'text':
            policy_text = source_data
        elif source_type == 'url':
            policy_text = get_text_from_url(source_data)
        else:
            return jsonify({"error": "Invalid source_type specified"}), 400
    except (ConnectionError, ValueError) as e:
        return jsonify({"error": str(e)}), 400
    
    analysis_app = build_analysis_graph()
    final_state = analysis_app.invoke({"policy_text": policy_text})
    analysis = final_state.get("structured_analysis")

    if not analysis:
        return jsonify({"error": "AI analysis failed. The model could not structure the output."}), 500
    
    policy_id = save_analysis_results(policy_text, analysis)
    agent_cache[policy_id] = create_qna_agent(policy_id)

    return jsonify({"policy_id": policy_id})

@app.route('/api/chats', methods=['GET'])
def fetch_all_chats():
    try:
        chats = get_all_chats()
        return jsonify(chats)
    except Exception as e:
        return jsonify({"error": f"Failed to fetch chats: {e}"}), 500

def get_full_analysis_summary(policy_id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT p.display_title, a.pii_collected, a.data_sharing_practices, a.retention_summary, a.risk_score, a.final_summary
        FROM analysis_results a
        JOIN privacy_policies p ON a.policy_id = p.policy_id
        WHERE a.policy_id = %s
    """, (policy_id,))
    data = cur.fetchone()
    cur.close()
    conn.close()
    if not data: return None
    return {
        "company_name": data[0], "pii_collected": data[1], "data_sharing_practices": data[2],
        "retention_summary": data[3], "risk_score": data[4], "final_summary": data[5],
    }

@app.route('/api/chats/<int:policy_id>', methods=['GET'])
def fetch_chat_details(policy_id):
    try:
        analysis_summary = get_full_analysis_summary(policy_id)
        if not analysis_summary: return jsonify({"error": "Analysis not found"}), 404
        messages = get_chat_history(policy_id)
        return jsonify({"policy_id": policy_id, "analysis_summary": analysis_summary, "messages": messages})
    except Exception as e:
        return jsonify({"error": f"Failed to fetch chat history: {e}"}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    question, policy_id = data.get('question'), data.get('policy_id')
    if not question or policy_id is None: return jsonify({"error": "Missing 'question' or 'policy_id'"}), 400
    if policy_id not in agent_cache: agent_cache[policy_id] = create_qna_agent(policy_id)
    qna_agent = agent_cache[policy_id]
    try:
        save_chat_message(policy_id, True, question)
        result = qna_agent.invoke({"question": question})
        save_chat_message(policy_id, False, result)
        return jsonify({"reply": result})
    except Exception as e: return jsonify({"error": f"An error occurred during chat: {e}"}), 500

@app.route('/api/chats/<int:policy_id>', methods=['DELETE'])
def remove_chat(policy_id):
    try:
        delete_chat(policy_id)
        agent_cache.pop(policy_id, None)
        return jsonify({"success": True})
    except Exception as e: return jsonify({"error": f"Failed to delete chat: {e}"}), 500

@app.route('/api/chats/<int:policy_id>', methods=['PUT'])
def update_chat_title(policy_id):
    data = request.json
    new_title = data.get('title')
    if not new_title: return jsonify({"error": "New title not provided"}), 400
    try:
        rename_chat(policy_id, new_title)
        return jsonify({"success": True})
    except Exception as e: return jsonify({"error": f"Failed to rename chat: {e}"}), 500

if __name__ == '__main__':
    print("--- PRIVACYLENS API SERVER RUNNING (Rolled Back Version) ---")
    app.run(debug=True, port=5000)