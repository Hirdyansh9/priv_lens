"""
Legal Knowledge Base for Privacy Regulations
Loads and indexes legal reference documents for accurate compliance assessments
"""
import os
from pathlib import Path
from langchain_community.embeddings.fastembed import FastEmbedEmbeddings
from langchain_community.vectorstores.pgvector import PGVector
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter


def get_legal_vector_store():
    """Get vector store for legal reference documents"""
    embeddings = FastEmbedEmbeddings(model_name="BAAI/bge-small-en-v1.5")
    connection_string = PGVector.connection_string_from_db_params(
        driver="psycopg2",
        host=os.getenv("DB_HOST"),
        port=int(os.getenv("DB_PORT", 5432)),
        database=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD")
    )
    return PGVector(
        connection_string=connection_string,
        embedding_function=embeddings,
        collection_name="legal_knowledge_base",
        pre_delete_collection=False
    )


def ingest_legal_documents():
    """
    Ingest legal reference documents into vector database
    Call this once to populate the legal knowledge base
    """
    legal_docs_dir = Path(__file__).parent.parent / "legal_docs"

    if not legal_docs_dir.exists():
        print(f"Legal docs directory not found: {legal_docs_dir}")
        return

    # Define document metadata
    legal_files = {
        "gdpr_requirements.txt": {
            "regulation": "GDPR",
            "jurisdiction": "EU",
            "full_name": "General Data Protection Regulation",
            "type": "regulation"
        },
        "coppa_requirements.txt": {
            "regulation": "COPPA",
            "jurisdiction": "USA",
            "full_name": "Children's Online Privacy Protection Act",
            "type": "law"
        },
        "ccpa_requirements.txt": {
            "regulation": "CCPA",
            "jurisdiction": "California, USA",
            "full_name": "California Consumer Privacy Act",
            "type": "law"
        }
    }

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=150,
        separators=["\n\n=====", "\n\n", "\n", " ", ""]
    )

    all_documents = []

    for filename, metadata in legal_files.items():
        file_path = legal_docs_dir / filename

        if not file_path.exists():
            print(f"Warning: {filename} not found")
            continue

        # Read file content
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Split into chunks
        chunks = text_splitter.split_text(content)

        # Create documents with metadata
        for chunk in chunks:
            doc = Document(
                page_content=chunk,
                metadata={
                    **metadata,
                    "source_file": filename
                }
            )
            all_documents.append(doc)

        print(f"Loaded {filename}: {len(chunks)} chunks")

    # Add to vector store
    if all_documents:
        vector_store = get_legal_vector_store()
        vector_store.add_documents(all_documents)
        print(
            f"\nTotal: Ingested {len(all_documents)} legal document chunks into knowledge base")
    else:
        print("No documents found to ingest")


def get_legal_retriever(regulation_filter=None, k=5):
    """
    Get a retriever for legal reference documents

    Args:
        regulation_filter: Filter by specific regulation (e.g., "GDPR", "COPPA", "CCPA")
        k: Number of documents to retrieve

    Returns:
        Configured retriever for legal knowledge base
    """
    vector_store = get_legal_vector_store()

    search_kwargs = {'k': k}

    if regulation_filter:
        search_kwargs['filter'] = {'regulation': regulation_filter}

    return vector_store.as_retriever(
        search_type="mmr",  # Maximum Marginal Relevance for diverse results
        search_kwargs={
            **search_kwargs,
            'fetch_k': k * 3,  # Consider more candidates
            'lambda_mult': 0.7  # Favor relevance over diversity for legal text
        }
    )


def query_legal_knowledge(query: str, regulation: str = None, k: int = 5):
    """
    Query the legal knowledge base

    Args:
        query: The question or topic to search for
        regulation: Optional filter by regulation (GDPR, COPPA, CCPA)
        k: Number of results to return

    Returns:
        List of relevant document chunks
    """
    retriever = get_legal_retriever(regulation_filter=regulation, k=k)
    results = retriever.invoke(query)
    return results


def format_legal_context(docs):
    """
    Format retrieved legal documents for inclusion in prompts

    Args:
        docs: List of Document objects

    Returns:
        Formatted string with legal references
    """
    if not docs:
        return "No specific legal references found."

    formatted = []
    for i, doc in enumerate(docs):
        regulation = doc.metadata.get('regulation', 'Unknown')
        full_name = doc.metadata.get('full_name', regulation)

        formatted.append(
            f"Legal Reference {i+1} ({regulation}):\n"
            f"Source: {full_name}\n"
            f"{doc.page_content}\n"
        )

    return "\n---\n\n".join(formatted)


# Check if legal KB is initialized
def is_legal_kb_initialized():
    """Check if legal knowledge base has been populated"""
    try:
        vector_store = get_legal_vector_store()
        # Try a simple query to see if data exists
        test_retriever = vector_store.as_retriever(search_kwargs={'k': 1})
        results = test_retriever.invoke("privacy policy requirements")
        return len(results) > 0
    except Exception as e:
        print(f"Error checking legal KB: {e}")
        return False


if __name__ == "__main__":
    """Run this script to populate the legal knowledge base"""
    print("Ingesting legal reference documents...")
    ingest_legal_documents()
    print("\nLegal knowledge base setup complete!")

    # Test query
    print("\n" + "="*50)
    print("Testing legal knowledge base...")
    test_results = query_legal_knowledge(
        "What are the requirements for obtaining consent?", regulation="GDPR", k=2)
    print(f"\nFound {len(test_results)} results for GDPR consent requirements")
    if test_results:
        print("\nSample result:")
        print(test_results[0].page_content[:300] + "...")
