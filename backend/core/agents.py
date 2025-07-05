from langchain.output_parsers import PydanticOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
# from langchain_community.chat_models import ChatOllama
# from langchain_groq import ChatGroq


from .pydantic_models import PrivacyAnalysis


def PolicyParsingAgent():
    llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash-latest", temperature=0)
    # llm = ChatOllama(model="llama3:8b", temperature=0)
    # llm = ChatGroq(model="llama3-8b-8192", temperature=0)
    pydantic_parser = PydanticOutputParser(pydantic_object=PrivacyAnalysis)
    format_instructions = pydantic_parser.get_format_instructions()

    prompt_template = """
    You are an expert privacy analyst. Your task is to conduct a rigorous analysis of the provided privacy policy. Your analysis must be based solely on the text of the policy.

    **Instructions:**
    1.  **Identify Company:** Extract the company name and its primary domain name (e.g., 'company.com').
    2.  **PII Collection:** List all types of Personal Identifiable Information (PII) mentioned.
    3.  **Data Retention:** Summarize the company's data retention policy. If it's not mentioned, state that clearly.
    4.  **Data Sharing:** Identify all clauses about sharing data with third parties. For each, categorize the recipient (e.g., 'Advertising Partner') and list the data types shared.
    5.  **Risk Score:** Calculate an overall risk score from 1 (low risk) to 10 (high risk) based on factors like data sensitivity, sharing practices, and policy clarity.
    6.  **Summarize:** Write a concise, high-level summary for a non-technical user.

    **Output Format:** You MUST provide your response in the following JSON format.
    {format_instructions}

    **Privacy Policy Text to Analyze:**
    {policy_text}
    """
    prompt = ChatPromptTemplate.from_template(template=prompt_template)
    prompt = prompt.partial(format_instructions=format_instructions)
    return prompt | llm | pydantic_parser


