import os
import psycopg2
from ..core.pydantic_models import PrivacyAnalysis


def get_db_connection():
    return psycopg2.connect(
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        dbname=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD")
    )


def save_analysis_results(policy_text: str, analysis_result: PrivacyAnalysis):
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            # 1. Get or create company
            cur.execute(
                "INSERT INTO companies (name, domain) VALUES (%s, %s) ON CONFLICT (domain) DO UPDATE SET name = EXCLUDED.name RETURNING company_id;",
                (analysis_result.company_name, analysis_result.domain_name)
            )
            company_id = cur.fetchone()[0]

            # 2. Insert policy
            cur.execute(
                "INSERT INTO privacy_policies (company_id, policy_text) VALUES (%s, %s) RETURNING policy_id;",
                (company_id, policy_text)
            )
            policy_id = cur.fetchone()[0]

            # 3. Insert analysis result
            analysis_json = analysis_result.json()
            cur.execute(
                "INSERT INTO analysis_results (policy_id, llm_model_used, structured_analysis_json, overall_risk_score) VALUES (%s, %s, %s, %s);",
                (policy_id, 'gemini-1.5-flash-latest', analysis_json, analysis_result.overall_risk_score)
            )

            conn.commit()
            return policy_id
    finally:
        conn.close()