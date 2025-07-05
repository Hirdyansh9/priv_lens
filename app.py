from dotenv import load_dotenv
from backend.core.graph import build_analysis_graph
from backend.core.qa_agent import create_qna_agent
from backend.utils.db import save_analysis_results

load_dotenv()

def run_local_privacy_lens():
    print("--- PrivacyLens Local Runner ---")

    # 1. Load the sample privacy policy
    try:
        with open("sample_policy.txt", "r", encoding="utf-8") as f:
            policy_text = f.read()
    except FileNotFoundError:
        print("\nERROR: 'sample_policy.txt' not found. Please create this file.")
        return

    # 2. Run the initial analysis graph
    app = build_analysis_graph()
    initial_state = {"policy_text": policy_text}
    final_state = app.invoke(initial_state)

    analysis = final_state.get("structured_analysis")

    # 3. Print the report
    print("\n--- ANALYSIS REPORT ---")
    if analysis:
        print(f"Company: {analysis.company_name}")
        print(f"Domain: {analysis.domain_name}")
        print(f"Risk Score: {analysis.overall_risk_score}/10")
        print(f"Summary: {analysis.summary}")
    else:
        print("\nAnalysis failed. Cannot proceed.")
        return

    # 4. Save results to DB and get policy_id
    print("\n--- SAVING TO DATABASE ---")
    policy_id = save_analysis_results(policy_text, analysis)
    print(f"Results saved. Policy ID: {policy_id}")

    # 5. Create the Q&A Agent (This part is new)
    print("\n--- INITIALIZING Q&A AGENT ---")
    # Instead of embedding here, the agent will handle it via its tool.
    qna_agent = create_qna_agent(policy_id)

    # 6. Interactive Q&A loop with the new agent
    print("\n--- INTERACTIVE Q&A ---")
    print("Ask questions about the policy OR general privacy topics. Type 'exit' to quit.")
    while True:
        question = input("> ")
        if question.lower() == 'exit':
            break
        if question:
            # The agent decides which tool to use
            result = qna_agent.invoke({"input": question})
            print(f"Answer: {result['output']}\n")


if __name__ == "__main__":
    run_local_privacy_lens()