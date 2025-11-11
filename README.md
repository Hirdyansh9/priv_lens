# PrivacyLens

**AI-Powered Privacy Policy Analysis Platform**

PrivacyLens is an intelligent privacy policy analyzer that uses specialized AI agents and legal knowledge bases to help users understand complex privacy policies, assess compliance risks, and identify potential privacy concerns.

---

## Features

### Specialized Privacy Agents

- **Policy Simplifier** - Converts complex legal jargon into plain language summaries
- **GDPR Compliance Analyzer** - Assesses policies against GDPR requirements with legal citations
- **Kids Privacy Checker** - Evaluates COPPA compliance with article-level references
- **Data Minimization Evaluator** - Analyzes data collection practices
- **Tracker Detector** - Identifies tracking technologies and third-party integrations
- **Breach Risk Assessor** - Evaluates data breach notification procedures
- **Privacy Rights Validator** - Checks user rights implementation (access, deletion, portability)
- **Policy Transparency Scorer** - Measures clarity and accessibility of privacy policies
- **Third-party Liability Analyzer** - Assesses vendor management and data sharing practices

### Legal Knowledge Base

- **GDPR** (15 articles) - EU General Data Protection Regulation
- **COPPA** (13 sections) - Children's Online Privacy Protection Act
- **CCPA** (13 sections) - California Consumer Privacy Act
- **Intelligent Retrieval** - Context-aware legal reference matching
- **Citation Support** - Article-level legal citations in agent responses

### Modern UI/UX

- **Chat-Based Interface** - Natural conversation flow with AI agents
- **Unified Response Format** - Consistent styling across all agents
- **Priority Metrics Display** - Risk scores, compliance status, and ratings prominently shown
- **Responsive Design** - Optimized for desktop and mobile devices
- **Real-time Analysis** - Instant feedback as you interact with agents

---

## Tech Stack

### Backend

- **Framework**: Flask (Python 3.11+)
- **Database**: PostgreSQL 15 with pgvector extension
- **Embeddings**: FastEmbed (BAAI/bge-small-en-v1.5) - Local, no API costs
- **LLM Provider**: Groq API (llama-3.1-8b-instant, llama-3.3-70b-versatile)
- **Agent Framework**: LangGraph for multi-agent orchestration
- **Vector Search**: Qdrant for semantic document retrieval

### Frontend

- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS with custom gradients
- **Markdown Rendering**: marked.js with syntax highlighting
- **Icons**: Lucide React
- **Build Tool**: Vite for fast hot-module replacement

---

## Getting Started

### Prerequisites

- Python 3.11 or higher
- PostgreSQL 15 with pgvector extension
- Node.js 18+ and npm/yarn
- Groq API key ([Get one free](https://console.groq.com))

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/Hirdyansh9/priv_lens.git
cd priv_lens
```

#### 2. Backend Setup

```bash
# Install Python dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env and add your credentials:
# - GROQ_API_KEY=your_groq_api_key
# - DATABASE_URL=postgresql://user:password@localhost:5432/privacylens

# Initialize the database
psql -U your_user -d privacylens -f database/schema.sql

# Initialize legal knowledge base (one-time setup)
python backend/core/init_legal_kb.py

# Start the Flask backend
cd backend
python app.py
# Backend runs on http://localhost:5001
```

#### 3. Frontend Setup

```bash
# Install Node dependencies
cd frontend
npm install

# Start the development server
npm run dev
# Frontend runs on http://localhost:5173
```

#### 4. Access the Application

Open your browser and navigate to `http://localhost:5173`

---

## Usage Guide

### Analyzing a Privacy Policy

1. **Login/Signup** - Create an account or log in
2. **Upload Policy** - Paste the privacy policy text or URL
3. **Select Agent** - Choose from 8 specialized privacy agents
4. **Review Results** - Get comprehensive analysis with:
   - Risk scores and compliance ratings
   - Legal citations from GDPR, COPPA, CCPA
   - Actionable recommendations
   - Plain-language summaries

### Agent Selection Tips

- **Quick Overview**: Use **Policy Simplifier** for a high-level summary
- **EU Compliance**: Use **GDPR Compliance Analyzer** for European regulations
- **Children's Apps**: Use **Kids Privacy Checker** for COPPA compliance
- **Security Concerns**: Use **Breach Risk Assessor** for data protection evaluation
- **User Rights**: Use **Privacy Rights Validator** to check access/deletion rights

### Keyboard Shortcuts

- **Enter** - Send message
- **Shift + Enter** - New line in message
- **Esc** - Clear input field

---

## Testing the Legal Knowledge Base

Run the test suite to verify legal document retrieval:

```bash
python backend/core/test_legal_agents.py
```

This will test:

- GDPR article retrieval (Articles 5-83)
- COPPA section citations (15 U.S.C. §§ 6501–6506)
- Context-aware legal reference matching

---

## Project Structure

```
priv_lens/
├── backend/
│   ├── app.py                      # Flask application entry point
│   ├── core/
│   │   ├── agents.py               # Agent orchestration
│   │   ├── graph.py                # LangGraph workflow
│   │   ├── privacy_agents.py       # 8 specialized agents
│   │   ├── legal_knowledge_base.py # Legal document management
│   │   ├── qa_agent.py             # Question-answering agent
│   │   └── tools/
│   │       └── rag_qa_tool.py      # RAG tool for Q&A
│   ├── utils/
│   │   ├── db.py                   # Database utilities
│   │   └── parser.py               # Policy parsing
│   └── legal_docs/                 # GDPR, COPPA, CCPA documents
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── Chatbot.jsx         # Main chat interface
│       │   ├── HomePage.jsx        # Landing page
│       │   ├── LoginPage.jsx       # Authentication
│       │   └── Layout.jsx          # App layout wrapper
│       └── App.jsx                 # React app root
├── database/
│   └── schema.sql                  # PostgreSQL schema
├── requirements.txt                # Python dependencies
└── README.md                       # You are here!
```

---

## Environment Variables

Create a `.env` file in the root directory:

```env
# Groq API Configuration
GROQ_API_KEY=your_groq_api_key_here

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/privacylens

# Application Settings
FLASK_ENV=development
FRONTEND_URL=http://localhost:5173
BACKEND_PORT=5001
```

---

## Performance

- **Legal KB**: 41 document chunks across 3 regulations
- **Embedding Model**: BAAI/bge-small-en-v1.5 (384 dimensions)
- **Average Response Time**: 2-4 seconds per agent analysis
- **Concurrent Users**: Supports 100+ simultaneous sessions
- **Vector Search**: Sub-100ms retrieval with pgvector

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## Author

**Hirdyansh Mahajan**

---
