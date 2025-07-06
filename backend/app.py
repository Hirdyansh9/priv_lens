import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_login import LoginManager, login_user, logout_user, login_required, current_user, UserMixin
from dotenv import load_dotenv
from werkzeug.security import check_password_hash
import traceback

load_dotenv()

# --- Local Imports ---
from backend.core.graph import build_analysis_graph
from backend.core.qa_agent import create_qna_agent
from backend.utils.db import (
    get_db_connection, save_analysis_results, get_all_chats,
    get_chat_history, save_chat_message, rename_chat, delete_chat,
    create_user, get_user_by_username, get_user_by_id, check_and_update_message_count
)
from backend.utils.parser import get_text_from_url

# --- App Initialization ---
app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'a_default_secret_key_for_development_12345')
CORS(app, supports_credentials=True)

# --- Flask-Login Configuration ---
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

class User(UserMixin):
    """User model for Flask-Login."""
    def __init__(self, id, username, role):
        self.id = id
        self.username = username
        self.role = role

@login_manager.user_loader
def load_user(user_id):
    """Loads a user from the database for the session."""
    user_data = get_user_by_id(user_id)
    if user_data:
        return User(id=user_data['user_id'], username=user_data['username'], role=user_data['role'])
    return None

@login_manager.unauthorized_handler
def unauthorized():
    """Handles unauthorized access attempts."""
    return jsonify({"error": "Login required"}), 401

# --- Caching and Startup ---
agent_cache = {}

def create_default_admin():
    """Creates a default admin user if one doesn't exist on startup."""
    with app.app_context():
        if not get_user_by_username('hirdy'):
            create_user('hirdy', '12345', 'admin')
            print("Default admin user 'hirdy' created successfully.")

# --- Authentication Routes ---
@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400
    if get_user_by_username(username):
        return jsonify({"error": "Username already exists"}), 409
    create_user(username, password)
    return jsonify({"message": "User created successfully"}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    user_data = get_user_by_username(username)
    if user_data and check_password_hash(user_data['password_hash'], password):
        user = User(id=user_data['user_id'], username=user_data['username'], role=user_data['role'])
        login_user(user, remember=True)
        return jsonify({"message": "Logged in successfully", "user": {"username": user.username, "role": user.role}})
    return jsonify({"error": "Invalid username or password"}), 401

@app.route('/api/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({"message": "Logged out successfully"})

@app.route('/api/session', methods=['GET'])
def session_status():
    """Checks if a user is currently logged in."""
    if current_user.is_authenticated:
        return jsonify({"isLoggedIn": True, "user": {"username": current_user.username, "role": current_user.role}})
    return jsonify({"isLoggedIn": False})

# --- Core Application Routes ---
@app.route('/api/analyze', methods=['POST'])
@login_required
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
    except Exception as e:
        return jsonify({"error": f"Failed to process source: {e}"}), 400
    
    try:
        analysis_app = build_analysis_graph()
        final_state = analysis_app.invoke({"policy_text": policy_text})
        analysis = final_state.get("structured_analysis")

        if not analysis:
            return jsonify({"error": "The AI model could not structure the output. The provided text may be too short or not a valid policy."}), 500
        
        policy_id = save_analysis_results(policy_text, analysis, current_user.id)
        agent_cache[policy_id] = create_qna_agent(policy_id)

        return jsonify({"policy_id": policy_id})
    except Exception as e:
        traceback.print_exc()
        error_message = str(e)
        
        # Check for the specific output parsing error from LangChain
        if "Invalid json output" in error_message or "OutputParsingError" in error_message:
            user_friendly_error = "The provided input does not appear to be a valid privacy policy. Please paste the full text of a policy to continue."
            return jsonify({"error": user_friendly_error}), 400 # for Bad Request
        
        return jsonify({"error": "An unexpected server error occurred during analysis. Please try again later."}), 500

# --- Chat History Management Routes ---
@app.route('/api/chat', methods=['POST'])
@login_required
def chat():
    can_send, message = check_and_update_message_count(current_user.id)
    if not can_send:
        return jsonify({"error": message}), 429
    data = request.json
    question, policy_id = data.get('question'), data.get('policy_id')
    if not question or policy_id is None: 
        return jsonify({"error": "Missing 'question' or 'policy_id'"}), 400
    if policy_id not in agent_cache: 
        agent_cache[policy_id] = create_qna_agent(policy_id)
    qna_agent = agent_cache[policy_id]
    try:
        save_chat_message(policy_id, current_user.id, True, question)
        result = qna_agent.invoke({"question": question})
        save_chat_message(policy_id, current_user.id, False, result)
        return jsonify({"reply": result})
    except Exception as e: 
        traceback.print_exc()
        return jsonify({"error": f"An error occurred during chat: {e}"}), 500

@app.route('/api/chats', methods=['GET'])
@login_required
def fetch_all_chats():
    try:
        chats = get_all_chats(current_user.id)
        return jsonify(chats)
    except Exception as e:
        return jsonify({"error": f"Failed to fetch chats: {e}"}), 500

@app.route('/api/chats/<int:policy_id>', methods=['GET'])
@login_required
def fetch_chat_history(policy_id):
    try:
        chat_history = get_chat_history(policy_id, current_user.id)
        if chat_history:
            return jsonify(chat_history)
        return jsonify({"error": "Chat not found or access denied"}), 404
    except Exception as e:
        return jsonify({"error": f"Failed to fetch chat history: {e}"}), 500

@app.route('/api/chats/<int:policy_id>', methods=['PUT'])
@login_required
def update_chat_title(policy_id):
    data = request.json
    new_title = data.get('title')
    if not new_title:
        return jsonify({"error": "New title is required"}), 400
    if rename_chat(policy_id, current_user.id, new_title):
        return jsonify({"message": "Chat renamed successfully"})
    return jsonify({"error": "Chat not found or update failed"}), 404

@app.route('/api/chats/<int:policy_id>', methods=['DELETE'])
@login_required
def remove_chat(policy_id):
    if delete_chat(policy_id, current_user.id):
        if policy_id in agent_cache:
            del agent_cache[policy_id]
        return jsonify({"message": "Chat deleted successfully"})
    return jsonify({"error": "Chat not found or deletion failed"}), 404
    

# --- Main Execution ---
if __name__ == '__main__':
    create_default_admin()
    app.run(host='0.0.0.0', port=5001, debug=True)
