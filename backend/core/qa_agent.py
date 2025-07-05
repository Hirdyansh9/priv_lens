from langchain.agents import AgentExecutor, create_react_agent, tool
from langchain_tavily import TavilySearch
from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
# from langchain_community.chat_models import ChatOllama
# from langchain_groq import ChatGroq


from .tools.rag_qa_tool import create_rag_chain


def create_qna_agent(policy_id: int):
    # --- Tool Definitions ---
    @tool
    def policy_document_qa(question: str) -> str:
        """
        Use this tool to answer questions specifically about the contents
        of the privacy policy document that has been analyzed.
        """
        print(f"--- Using Policy Document Q&A Tool for policy_id: {policy_id} ---")
        rag_chain = create_rag_chain(policy_id)
        return rag_chain.invoke(question)

    internet_search = TavilySearch()
    tools = [policy_document_qa, internet_search]

    # --- Agent Definition ---
    prompt_template = """
    You are a helpful assistant. Your primary goal is to answer a user's question.

    First, determine if the user's input is a greeting (like "hi", "hello"), a simple conversational remark, or a question that requires using a tool.

    If the input is a simple greeting or conversation, respond directly and conversationally without using a tool.

    If the user asks a question, you must use one of the following tools:

    - Use the 'policy_document_qa' tool ONLY when the user asks a question about "this policy", "the document", "the company", or other questions that are clearly about the specific privacy policy provided.
    - For all other general questions about privacy, laws (like GDPR), cybersecurity, or other topics, use the 'internet_search' tool.

    When you have the answer from a tool, provide a final, direct answer to the user.

    TOOLS:
    ------
    You have access to the following tools:

    {tool_names}

    {tools}

    USER'S QUESTION:
    --------------------
    {input}

    SCRATCHPAD (Your thought process):
    --------------------
    {agent_scratchpad}
    """
    prompt = ChatPromptTemplate.from_template(prompt_template)
    llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash-latest", temperature=0)
    # llm = ChatOllama(model="llama3:8b", temperature=0)
    # llm = ChatGroq(model="llama3-8b-8192", temperature=0)
    agent = create_react_agent(llm, tools, prompt)

    return AgentExecutor(
        agent=agent,
        tools=tools,
        verbose=True,
        handle_parsing_errors=True
    )
