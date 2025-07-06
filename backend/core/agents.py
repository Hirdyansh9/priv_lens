from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers.json import JsonOutputParser
from pydantic.v1 import BaseModel

from .pydantic_models import PrivacyAnalysis

def create_analysis_agent(llm):
    """
    Creates an agent that analyzes a privacy policy and extracts structured data.
    """
    parser = JsonOutputParser(pydantic_object=PrivacyAnalysis)

    prompt = ChatPromptTemplate.from_messages([
        ("system", """
            You are a specialized legal AI assistant. Your task is to analyze a given privacy policy text 
            and extract key information based on a predefined JSON schema. 
            
            Analyze the following sections carefully:
            1.  **Company Name**: Identify the name of the company or service this policy belongs to.
            2.  **Personally Identifiable Information (PII)**: List all types of PII collected (e.g., name, email, IP address, location data).
            3.  **Data Sharing Practices**: Summarize with whom the data is shared (e.g., third parties, affiliates, for legal reasons).
            4.  **Data Retention**: Summarize the policy's statements on how long user data is stored.
            5.  **Risk Score**: Assign a risk score from 1 (very low risk) to 10 (very high risk) based on the amount and sensitivity of PII collected and the breadth of data sharing. Justify the score briefly.
            6.  **Final Summary**: Provide a concise, easy-to-understand summary of the entire policy.

            {format_instructions}
        """),
        ("human", "Here is the privacy policy text:\n\n{policy_text}")
    ]).partial(format_instructions=parser.get_format_instructions())

    return (
        {"policy_text": RunnablePassthrough()}
        | prompt
        | llm
        | parser
    )
