-- Enable the pgvector extension if it's not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Table for users
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(80) UNIQUE NOT NULL,
    password_hash VARCHAR(256) NOT NULL, 
    role VARCHAR(20) NOT NULL DEFAULT 'user', -- 'user' or 'admin'
    daily_message_count INTEGER DEFAULT 0,
    last_message_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- Table for companies
CREATE TABLE IF NOT EXISTS companies (
    company_id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table for privacy policies
CREATE TABLE IF NOT EXISTS privacy_policies (
    policy_id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    policy_text TEXT NOT NULL,
    display_title VARCHAR(255), 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies (company_id),
    FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
);

-- Table for analysis results
CREATE TABLE IF NOT EXISTS analysis_results (
    analysis_id SERIAL PRIMARY KEY,
    policy_id INTEGER NOT NULL UNIQUE,
    pii_collected TEXT[],
    data_sharing_practices TEXT,
    retention_summary TEXT,
    risk_score INTEGER,
    final_summary TEXT,
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (policy_id) REFERENCES privacy_policies (policy_id) ON DELETE CASCADE
);

-- Table for policy text vectors for RAG
CREATE TABLE IF NOT EXISTS policy_vectors (
    uuid UUID PRIMARY KEY,
    embedding vector(768),
    document TEXT,
    cmetadata JSONB
);

-- Table for storing chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
    message_id SERIAL PRIMARY KEY,
    policy_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    is_user_message BOOLEAN NOT NULL,
    message_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (policy_id) REFERENCES privacy_policies (policy_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
