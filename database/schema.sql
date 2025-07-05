-- Enables vector similarity search capabilities in PostgreSQL.
CREATE EXTENSION IF NOT EXISTS vector;

-- Table to store company information.
CREATE TABLE companies (
    company_id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    domain VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table to store privacy policy versions and their text.
CREATE TABLE privacy_policies (
    policy_id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(company_id),
    policy_text TEXT,
    ingested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table to store the JSONB output from the analysis agent.
CREATE TABLE analysis_results (
    result_id SERIAL PRIMARY KEY,
    policy_id INTEGER NOT NULL REFERENCES privacy_policies(policy_id) UNIQUE,
    ran_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    llm_model_used VARCHAR(100),
    structured_analysis_json JSONB,
    overall_risk_score INTEGER
);

-- Table for the RAG vector store using pgvector.
CREATE TABLE policy_vectors (
    vector_id SERIAL PRIMARY KEY,
    policy_id INTEGER NOT NULL REFERENCES privacy_policies(policy_id),
    text_chunk TEXT,
    -- The dimension (768) must match the output of the Google embedding model.
    embedding VECTOR(768)
);

-- Create an index for efficient vector similarity search.
CREATE INDEX ON policy_vectors USING HNSW (embedding vector_l2_ops);