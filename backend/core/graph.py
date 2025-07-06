from langgraph.graph import StateGraph, END
from typing import TypedDict
from .agents import create_policy_parsing_agent
from .pydantic_models import PrivacyAnalysis

class AnalysisState(TypedDict):
    policy_text: str
    structured_analysis: PrivacyAnalysis

def analyze_policy_node(state: AnalysisState):
    """Node that runs the policy parsing agent on the entire document."""
    print("--- ANALYZING FULL POLICY ---")
    parser_agent = create_policy_parsing_agent()
    result = parser_agent.invoke({"policy_text": state["policy_text"]})
    print("--- ANALYSIS COMPLETE ---")
    return {"structured_analysis": result}

def build_analysis_graph():
    """Builds the simple LangGraph for policy analysis."""
    workflow = StateGraph(AnalysisState)

    workflow.add_node("analyze_policy", analyze_policy_node)
    workflow.set_entry_point("analyze_policy")
    workflow.add_edge("analyze_policy", END)

    return workflow.compile()