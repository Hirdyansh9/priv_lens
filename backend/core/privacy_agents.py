"""
Specialized Privacy-Centric AI Agents
Each agent handles a specific privacy-related task
"""
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser, JsonOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_groq import ChatGroq
from langchain_community.embeddings.fastembed import FastEmbedEmbeddings
from langchain_community.vectorstores.pgvector import PGVector
from pydantic import BaseModel, Field
from typing import List, Optional
import os

# Import legal knowledge base
from backend.core.legal_knowledge_base import get_legal_retriever, format_legal_context


def get_llm(model_type="fast"):
    """Get appropriate LLM based on task complexity"""
    if model_type == "fast":
        return ChatGroq(model="llama-3.1-8b-instant", temperature=0)
    else:  # quality
        return ChatGroq(model="llama-3.3-70b-versatile", temperature=0)


def get_retriever(policy_id: int, k: int = 5):
    """Get a retriever configured for a specific policy with RAG"""
    embeddings = FastEmbedEmbeddings(model_name="BAAI/bge-small-en-v1.5")
    connection_string = PGVector.connection_string_from_db_params(
        driver="psycopg2",
        host=os.getenv("DB_HOST"),
        port=int(os.getenv("DB_PORT", 5432)),
        database=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD")
    )
    vectorstore = PGVector(
        connection_string=connection_string,
        embedding_function=embeddings,
        collection_name="policy_vectors",
        pre_delete_collection=False
    )
    return vectorstore.as_retriever(
        search_kwargs={'filter': {'policy_id': policy_id}, 'k': k}
    )


# ===== 1. GDPR Compliance Checker Agent =====
class GDPRCompliance(BaseModel):
    """GDPR compliance assessment model"""
    is_compliant: bool = Field(
        description="Whether the policy appears GDPR compliant")
    missing_elements: List[str] = Field(
        description="List of missing GDPR requirements")
    compliant_elements: List[str] = Field(
        description="List of present GDPR requirements")
    recommendations: List[str] = Field(
        description="Specific recommendations to improve compliance")
    compliance_score: int = Field(description="Compliance score from 1-10")


def create_gdpr_compliance_agent(policy_id: int = None):
    """Analyzes privacy policies for GDPR compliance using RAG and legal knowledge base"""
    llm = get_llm("quality")
    parser = JsonOutputParser(pydantic_object=GDPRCompliance)

    if policy_id:
        # Use RAG for policy text + legal knowledge base for GDPR requirements
        policy_retriever = get_retriever(policy_id, k=8)
        legal_retriever = get_legal_retriever(regulation_filter="GDPR", k=6)

        prompt = ChatPromptTemplate.from_template(
            """You are a GDPR compliance expert. Analyze the following privacy policy sections for GDPR compliance.

Use the official GDPR requirements provided below as your authoritative reference.

=== OFFICIAL GDPR REQUIREMENTS ===
{legal_context}

=== PRIVACY POLICY SECTIONS TO ANALYZE ===
{policy_context}

Based on the official GDPR requirements and the retrieved policy sections, provide a comprehensive compliance assessment.

Check for these key GDPR requirements (as detailed in the legal references above):
1. Legal basis for processing (Article 6)
2. Data subject rights (Articles 15-22: access, rectification, erasure, portability, restriction, objection)
3. Data retention periods (Article 5)
4. Data breach notification procedures (Articles 33-34)
5. Data Protection Officer (DPO) contact information (Articles 37-39)
6. International data transfers safeguards (Articles 44-46)
7. Automated decision-making information (Article 22)
8. Cookie consent mechanisms (Article 7)
9. Age restrictions and child data protection (Article 8)
10. Clear and plain language (Article 12)

Cite specific GDPR articles when identifying missing or present elements.

{format_instructions}
"""
        )

        def get_contexts(x):
            policy_query = x["policy_text"]
            # Get relevant GDPR legal requirements
            legal_docs = legal_retriever.invoke(
                "GDPR compliance requirements data subject rights consent processing")
            # Get relevant policy sections
            policy_docs = policy_retriever.invoke(policy_query)

            return {
                "policy_text": policy_query,
                "legal_context": format_legal_context(legal_docs),
                "policy_context": "\n\n---\n\n".join([f"Section {i+1}:\n{doc.page_content}" for i, doc in enumerate(policy_docs)])
            }

        return (
            RunnablePassthrough.assign(**get_contexts)
            | prompt.partial(format_instructions=parser.get_format_instructions())
            | llm
            | parser
        )
    else:
        # Fallback: still use legal knowledge base even without policy_id
        legal_retriever = get_legal_retriever(regulation_filter="GDPR", k=6)

        prompt = ChatPromptTemplate.from_template(
            """You are a GDPR compliance expert. Analyze the following privacy policy for GDPR compliance.

Use the official GDPR requirements provided below as your authoritative reference.

=== OFFICIAL GDPR REQUIREMENTS ===
{legal_context}

=== PRIVACY POLICY TEXT ===
{policy_text}

Based on the official GDPR requirements, provide a comprehensive compliance assessment.

Check for these key GDPR requirements (as detailed in the legal references above):
1. Legal basis for processing (Article 6)
2. Data subject rights (Articles 15-22)
3. Data retention periods (Article 5)
4. Data breach notification procedures (Articles 33-34)
5. Data Protection Officer (DPO) contact information (Articles 37-39)
6. International data transfers safeguards (Articles 44-46)
7. Automated decision-making information (Article 22)
8. Cookie consent mechanisms (Article 7)
9. Age restrictions and child data protection (Article 8)
10. Clear and plain language (Article 12)

Cite specific GDPR articles when identifying missing or present elements.

{format_instructions}
"""
        )

        def get_legal_refs(x):
            legal_docs = legal_retriever.invoke(
                "GDPR compliance requirements data subject rights consent processing")
            return format_legal_context(legal_docs)

        return (
            RunnablePassthrough.assign(legal_context=get_legal_refs)
            | prompt.partial(format_instructions=parser.get_format_instructions())
            | llm
            | parser
        )


# ===== 2. Privacy Rights Assistant Agent =====
def create_privacy_rights_agent():
    """Helps users understand and exercise their privacy rights"""
    llm = get_llm("quality")

    prompt = ChatPromptTemplate.from_template(
        """You are a privacy rights advocate helping users understand their data rights.

Based on the following privacy policy and user's jurisdiction, explain:
1. What rights they have (access, deletion, portability, etc.)
2. How to exercise those rights
3. Expected response timeframes
4. Any potential limitations or exceptions

Policy Text:
{policy_text}

User's Jurisdiction: {jurisdiction}
User's Question: {question}

Provide clear, actionable guidance in plain language with specific steps they can take.

Format your response using markdown with bullet points (using - for bullets) to organize information clearly.
Each bullet point should start with a capital letter.
"""
    )

    return prompt | llm | StrOutputParser()


# ===== 3. Data Minimization Advisor Agent =====
class DataMinimizationReport(BaseModel):
    """Data minimization assessment"""
    excessive_data_points: List[str] = Field(
        description="Data points that seem excessive")
    necessary_data_points: List[str] = Field(
        description="Data points that appear necessary")
    optional_data_points: List[str] = Field(
        description="Data points users could avoid sharing")
    minimization_score: int = Field(
        description="Data minimization score from 1-10, where 10 is best")
    recommendations: str = Field(
        description="Recommendations for users to minimize data sharing")


def create_data_minimization_agent(policy_id: int = None):
    """Advises on minimizing data collection and sharing using RAG"""
    llm = get_llm("quality")
    parser = JsonOutputParser(pydantic_object=DataMinimizationReport)

    if policy_id:
        # Use RAG for better context retrieval
        retriever = get_retriever(policy_id, k=6)

        prompt = ChatPromptTemplate.from_template(
            """You are a data minimization expert. Analyze these privacy policy sections to identify:
1. What data is collected
2. Which data collection is truly necessary vs excessive
3. What data users can avoid sharing

Evaluate based on:
- Purpose limitation (is data collected only for stated purposes?)
- Data necessity (is all data truly needed?)
- User control (can users limit data sharing?)

Relevant Policy Sections:
{context}

Based on the retrieved sections, provide a comprehensive data minimization assessment.

{format_instructions}
"""
        )

        return (
            RunnablePassthrough.assign(
                context=lambda x: retriever.invoke(x["policy_text"]))
            | prompt.partial(format_instructions=parser.get_format_instructions())
            | llm
            | parser
        )
    else:
        # Fallback to full text analysis
        prompt = ChatPromptTemplate.from_template(
            """You are a data minimization expert. Analyze this privacy policy to identify:
1. What data is collected
2. Which data collection is truly necessary vs excessive
3. What data users can avoid sharing

Evaluate based on:
- Purpose limitation (is data collected only for stated purposes?)
- Data necessity (is all data truly needed?)
- User control (can users limit data sharing?)

Policy Text:
{policy_text}

{format_instructions}
"""
        )

        return prompt.partial(format_instructions=parser.get_format_instructions()) | llm | parser


# ===== 4. Third-Party Tracker Detector Agent =====
class TrackerAnalysis(BaseModel):
    """Third-party tracking analysis"""
    advertising_trackers: List[str] = Field(
        description="Advertising/marketing trackers mentioned")
    analytics_trackers: List[str] = Field(
        description="Analytics trackers mentioned")
    social_media_trackers: List[str] = Field(
        description="Social media trackers mentioned")
    unknown_trackers: List[str] = Field(
        description="Other third-party services mentioned")
    tracking_risk_level: str = Field(
        description="Risk level: Low, Medium, High, or Critical")
    user_options: str = Field(
        description="Options users have to limit tracking")


def create_tracker_detector_agent(policy_id: int = None):
    """Identifies third-party trackers and data sharing using RAG"""
    llm = get_llm("quality")
    parser = JsonOutputParser(pydantic_object=TrackerAnalysis)

    if policy_id:
        # Use RAG for better context retrieval
        retriever = get_retriever(policy_id, k=6)

        prompt = ChatPromptTemplate.from_template(
            """You are a privacy tracker detection expert. Analyze these privacy policy sections to identify:

1. All third-party services that receive user data
2. Advertising and marketing trackers
3. Analytics and measurement tools
4. Social media integrations
5. What data each receives
6. User's ability to opt-out

Relevant Policy Sections:
{context}

Based on the retrieved sections, provide a comprehensive tracker analysis.

{format_instructions}
"""
        )

        return (
            RunnablePassthrough.assign(
                context=lambda x: retriever.invoke(x["policy_text"]))
            | prompt.partial(format_instructions=parser.get_format_instructions())
            | llm
            | parser
        )
    else:
        # Fallback to full text analysis
        prompt = ChatPromptTemplate.from_template(
            """You are a privacy tracker detection expert. Analyze this privacy policy to identify:

1. All third-party services that receive user data
2. Advertising and marketing trackers
3. Analytics and measurement tools
4. Social media integrations
5. What data each receives
6. User's ability to opt-out

Policy Text:
{policy_text}

{format_instructions}
"""
        )

        return prompt.partial(format_instructions=parser.get_format_instructions()) | llm | parser


# ===== 5. Privacy Policy Simplifier Agent =====
def create_policy_simplifier_agent():
    """Simplifies complex privacy policies into plain language"""
    llm = get_llm("quality")

    prompt = ChatPromptTemplate.from_template(
        """You are an expert at translating legal jargon into simple, clear language.

Take this privacy policy section and explain it as if talking to a 12-year-old:
- Use simple words
- Use short sentences
- Use concrete examples
- Highlight the most important points
- Explain why it matters to the user

Policy Section:
{policy_text}

Specific Question (if any): {question}

Provide a clear, friendly explanation that anyone can understand.
"""
    )

    return prompt | llm | StrOutputParser()


# ===== 6. Data Breach Risk Assessor Agent =====
class DataBreachRisk(BaseModel):
    """Data breach risk assessment"""
    security_measures: List[str] = Field(
        description="Security measures mentioned in policy")
    breach_notification: str = Field(
        description="How breaches are handled and users notified")
    data_at_risk: List[str] = Field(
        description="Types of data that could be compromised")
    risk_level: str = Field(
        description="Overall risk level: Low, Medium, High, or Critical")
    risk_factors: List[str] = Field(
        description="Specific risk factors identified")
    mitigation_advice: List[str] = Field(
        description="Advice for users to protect themselves")


def create_breach_risk_agent(policy_id: int = None):
    """Assesses data breach risks and security measures using RAG"""
    llm = get_llm("quality")
    parser = JsonOutputParser(pydantic_object=DataBreachRisk)

    if policy_id:
        # Use RAG for better context retrieval
        retriever = get_retriever(policy_id, k=6)

        prompt = ChatPromptTemplate.from_template(
            """You are a cybersecurity expert analyzing privacy policies for data breach risks.

Assess:
1. What security measures are in place
2. How breaches are detected and handled
3. User notification procedures
4. What sensitive data could be at risk
5. Historical breach information (if mentioned)

Relevant Policy Sections:
{context}

Based on the retrieved sections, provide a comprehensive breach risk assessment.

{format_instructions}
"""
        )

        return (
            RunnablePassthrough.assign(
                context=lambda x: retriever.invoke(x["policy_text"]))
            | prompt.partial(format_instructions=parser.get_format_instructions())
            | llm
            | parser
        )
    else:
        # Fallback to full text analysis
        prompt = ChatPromptTemplate.from_template(
            """You are a cybersecurity expert analyzing privacy policies for data breach risks.

Assess:
1. What security measures are in place
2. How breaches are detected and handled
3. User notification procedures
4. What sensitive data could be at risk
5. Historical breach information (if mentioned)

Policy Text:
{policy_text}

{format_instructions}
"""
        )

        return prompt.partial(format_instructions=parser.get_format_instructions()) | llm | parser


# ===== 7. Privacy vs. Functionality Advisor =====
def create_privacy_functionality_agent():
    """Helps users balance privacy with app functionality"""
    llm = get_llm("quality")

    prompt = ChatPromptTemplate.from_template(
        """You are a privacy consultant helping users make informed trade-offs.

Analyze this privacy policy to explain:
1. What data is needed for core functionality
2. What data is used for optional features
3. What features users can disable to improve privacy
4. Alternative privacy-friendly options
5. The real-world impact of various privacy choices

Policy Text:
{policy_text}

User's Concern: {concern}

Help them understand the trade-offs and make an informed decision.

Format your response using markdown with bullet points (using - for bullets) to organize information clearly.
Each bullet point should start with a capital letter.
"""
    )

    return prompt | llm | StrOutputParser()


# ===== 8. Kids' Privacy Guardian Agent =====
class ChildPrivacyAssessment(BaseModel):
    """Children's privacy assessment"""
    coppa_compliant: bool = Field(
        description="Whether policy appears COPPA compliant")
    age_restrictions: str = Field(
        description="Age restrictions and verification methods")
    parental_consent: str = Field(description="Parental consent mechanisms")
    child_data_collected: List[str] = Field(
        description="Data collected from children")
    safety_concerns: List[str] = Field(
        description="Safety concerns for children")
    recommendations: List[str] = Field(
        description="Recommendations for parents")


def create_kids_privacy_agent(policy_id: int = None):
    """Specializes in children's privacy protection (COPPA compliance) using RAG and legal knowledge base"""
    llm = get_llm("quality")
    parser = JsonOutputParser(pydantic_object=ChildPrivacyAssessment)

    if policy_id:
        # Use RAG for policy text + legal knowledge base for COPPA requirements
        policy_retriever = get_retriever(policy_id, k=6)
        legal_retriever = get_legal_retriever(regulation_filter="COPPA", k=5)

        prompt = ChatPromptTemplate.from_template(
            """You are a children's privacy protection expert. Analyze these policy sections for COPPA compliance.

Use the official COPPA requirements provided below as your authoritative reference.

=== OFFICIAL COPPA REQUIREMENTS ===
{legal_context}

=== PRIVACY POLICY SECTIONS TO ANALYZE ===
{policy_context}

Based on the official COPPA requirements and the retrieved policy sections, provide a comprehensive children's privacy assessment.

Check for these key COPPA requirements (as detailed in the legal references above):
1. COPPA compliance (15 U.S.C. §§ 6501–6506)
2. Age verification and restrictions (under 13)
3. Verifiable parental consent mechanisms
4. What personal information is collected from children
5. How children's data is protected and secured
6. Parental rights (review, delete, refuse further collection)
7. Educational vs commercial use
8. Third-party data sharing involving children
9. Conditional access prohibitions
10. Data retention and deletion policies for children's data

Reference specific COPPA requirements when identifying compliance issues or gaps.

{format_instructions}
"""
        )

        def get_contexts(x):
            policy_query = x["policy_text"]
            # Get relevant COPPA legal requirements
            legal_docs = legal_retriever.invoke(
                "COPPA children privacy parental consent age verification personal information")
            # Get relevant policy sections
            policy_docs = policy_retriever.invoke(policy_query)

            return {
                "policy_text": policy_query,
                "legal_context": format_legal_context(legal_docs),
                "policy_context": "\n\n---\n\n".join([f"Section {i+1}:\n{doc.page_content}" for i, doc in enumerate(policy_docs)])
            }

        return (
            RunnablePassthrough.assign(**get_contexts)
            | prompt.partial(format_instructions=parser.get_format_instructions())
            | llm
            | parser
        )
    else:
        # Fallback: still use legal knowledge base even without policy_id
        legal_retriever = get_legal_retriever(regulation_filter="COPPA", k=5)

        prompt = ChatPromptTemplate.from_template(
            """You are a children's privacy protection expert. Analyze this policy for COPPA compliance.

Use the official COPPA requirements provided below as your authoritative reference.

=== OFFICIAL COPPA REQUIREMENTS ===
{legal_context}

=== PRIVACY POLICY TEXT ===
{policy_text}

Based on the official COPPA requirements, provide a comprehensive children's privacy assessment.

Check for these key COPPA requirements (as detailed in the legal references above):
1. COPPA compliance (15 U.S.C. §§ 6501–6506)
2. Age verification and restrictions (under 13)
3. Verifiable parental consent mechanisms
4. What personal information is collected from children
5. How children's data is protected and secured
6. Parental rights (review, delete, refuse further collection)
7. Educational vs commercial use
8. Third-party data sharing involving children
9. Conditional access prohibitions
10. Data retention and deletion policies for children's data

Reference specific COPPA requirements when identifying compliance issues or gaps.

{format_instructions}
"""
        )

        def get_legal_refs(x):
            legal_docs = legal_retriever.invoke(
                "COPPA children privacy parental consent age verification personal information")
            return format_legal_context(legal_docs)

        return (
            RunnablePassthrough.assign(legal_context=get_legal_refs)
            | prompt.partial(format_instructions=parser.get_format_instructions())
            | llm
            | parser
        )


# ===== Agent Registry =====
PRIVACY_AGENTS = {
    "gdpr_compliance": {
        "name": "GDPR Compliance Checker",
        "description": "Analyzes policies for GDPR compliance and provides recommendations",
        "creator": create_gdpr_compliance_agent,
        "icon": "shield-check"
    },
    "privacy_rights": {
        "name": "Privacy Rights Assistant",
        "description": "Helps you understand and exercise your data rights",
        "creator": create_privacy_rights_agent,
        "icon": "user-check"
    },
    "data_minimization": {
        "name": "Data Minimization Advisor",
        "description": "Identifies excessive data collection and how to minimize sharing",
        "creator": create_data_minimization_agent,
        "icon": "minimize"
    },
    "tracker_detector": {
        "name": "Third-Party Tracker Detector",
        "description": "Reveals all third-party trackers and data sharing",
        "creator": create_tracker_detector_agent,
        "icon": "eye"
    },
    "policy_simplifier": {
        "name": "Policy Simplifier",
        "description": "Translates complex legal text into plain language",
        "creator": create_policy_simplifier_agent,
        "icon": "file-text"
    },
    "breach_risk": {
        "name": "Data Breach Risk Assessor",
        "description": "Evaluates security measures and breach risks",
        "creator": create_breach_risk_agent,
        "icon": "alert-triangle"
    },
    "privacy_functionality": {
        "name": "Privacy vs. Functionality Advisor",
        "description": "Helps balance privacy with app features",
        "creator": create_privacy_functionality_agent,
        "icon": "scale"
    },
    "kids_privacy": {
        "name": "Kids' Privacy Guardian",
        "description": "Assesses COPPA compliance and children's data protection",
        "creator": create_kids_privacy_agent,
        "icon": "baby"
    }
}
