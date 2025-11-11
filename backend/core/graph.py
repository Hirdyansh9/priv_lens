import os
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq
from langgraph.graph import StateGraph, END
from typing import TypedDict, List

from .agents import create_analysis_agent
from .pydantic_models import PrivacyAnalysis

class AgentState(TypedDict):
    """
    Represents the state of our graph.

    Attributes:
        policy_text: The raw text of the privacy policy.
        structured_analysis: The structured data extracted from the policy.
        question: The user's question for the Q&A agent.
        chat_history: The history of the conversation.
        generation: The latest response from an LLM.
    """
    policy_text: str
    structured_analysis: PrivacyAnalysis
    question: str
    chat_history: List[str]
    generation: str

def get_llm():
    """
    Selects and initializes the appropriate language model based on environment variables.
    The default is Groq's Llama3 70b model for its speed and performance.
    """
    llm = ChatGroq(
        temperature=0, 
        model_name="llama-3.3-70b-versatile",
        api_key=os.environ.get("GROQ_API_KEY")
    )
    return llm

def run_analysis_agent(state):
    """
    Runs the analysis agent to extract structured information from the policy text.
    
    Args:
        state (AgentState): The current graph state.

    Returns:
        dict: A dictionary with the structured analysis results.
    """
    print("\n---RUNNING ANALYSIS AGENT---")
    llm = get_llm()
    analysis_agent = create_analysis_agent(llm)
    structured_analysis = analysis_agent.invoke(state["policy_text"])
    return {"structured_analysis": structured_analysis}

def build_analysis_graph():
    """
    Builds the main state graph for the initial policy analysis process.
    This graph has a single step: running the analysis agent.
    """
    workflow = StateGraph(AgentState)
    workflow.add_node("analysis_agent", run_analysis_agent)
    workflow.set_entry_point("analysis_agent")
    workflow.add_edge("analysis_agent", END)

    return workflow.compile()