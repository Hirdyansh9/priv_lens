from typing import TypedDict, Optional

from langgraph.graph import StateGraph, END

from .agents import PolicyParsingAgent
from .pydantic_models import PrivacyAnalysis


class GraphState(TypedDict):
    policy_text: str
    structured_analysis: Optional[PrivacyAnalysis]


def run_policy_parser(state: GraphState):
    print("---RUNNING POLICY PARSER---")
    parser = PolicyParsingAgent()
    analysis_result = parser.invoke({"policy_text": state["policy_text"]})
    return {"structured_analysis": analysis_result}


def build_analysis_graph():
    workflow = StateGraph(GraphState)
    workflow.add_node("policy_parser", run_policy_parser)
    workflow.set_entry_point("policy_parser")
    workflow.add_edge("policy_parser", END)
    return workflow.compile()