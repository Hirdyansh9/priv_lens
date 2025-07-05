from langchain_core.pydantic_v1 import BaseModel, Field
from typing import List

class PrivacyAnalysis(BaseModel):
    """Structured data model for privacy policy analysis results."""
    company_name: str = Field(description="The name of the company that the privacy policy belongs to.")
    pii_collected: List[str] = Field(description="A list of all types of Personally Identifiable Information (PII) the policy says the company collects.")
    data_sharing_practices: str = Field(description="A summary of with whom the company shares user data (e.g., third parties, affiliates, advertisers).")
    retention_summary: str = Field(description="A brief summary of the company's data retention policy, explaining how long they keep user data.")
    risk_score: int = Field(description="An integer score from 1 (very low risk) to 10 (very high risk) based on the policy's terms. Justify the score in the final summary.")
    final_summary: str = Field(description="A concise, overall summary of the privacy policy's key points, including a justification for the risk score.")