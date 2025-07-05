from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq
from .pydantic_models import PrivacyAnalysis

def create_policy_parsing_agent():
    """
    Creates an agent to analyze and parse a complete privacy policy document.
    """
    parsing_prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                """You are an expert privacy policy analyst. Your task is to carefully read the provided privacy policy text and extract key information.

                You must format your response according to the provided JSON schema.
                - company_name: Identify the company name.
                - pii_collected: List all types of personally identifiable information (PII) mentioned.
                - data_sharing_practices: Summarize who the company shares data with.
                - retention_summary: Summarize how long the data is kept.
                - risk_score: Provide a risk score from 1-10 (1=low risk, 10=high risk).
                - final_summary: Provide a final summary that also justifies the risk score.
                """
            ),
            (
                "user",
                "Here is the privacy policy text:\n\n{policy_text}"
            ),
        ]
    )
    
    # Use the powerful model for the single analysis call
    llm = ChatGroq(model="llama3-70b-8192", temperature=0)
    
    structured_llm = llm.with_structured_output(PrivacyAnalysis)
    
    return parsing_prompt | structured_llm