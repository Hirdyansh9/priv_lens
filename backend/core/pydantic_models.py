from pydantic import BaseModel, Field
from typing import List

class DataSharingClause(BaseModel):
    recipient_category: str = Field(description="Category of the entity data is shared with, e.g., 'Service Provider', 'Advertising Partner', 'Affiliate'.")
    data_types_shared: List[str] = Field(description="Specific PII types shared with this category.")
    purpose: str = Field(description="The stated purpose for sharing the data.")

class PrivacyAnalysis(BaseModel):
    company_name: str = Field(description="The name of the company derived from the policy text.")
    domain_name: str = Field(description="The domain name of the company (e.g., 'company.com').")
    pii_collected: List[str] = Field(description="A comprehensive list of all Personal Identifiable Information (PII) types identified.")
    data_retention_summary: str = Field(description="A summary of the company's data retention policy. Note if a policy is not mentioned.")
    sharing_clauses: List[DataSharingClause] = Field(description="A list of all data sharing clauses found.")
    overall_risk_score: int = Field(description="The final calculated quantitative risk score (1-10) for the policy.")
    summary: str = Field(description="A concise, high-level summary of the privacy policy for a non-technical user.")