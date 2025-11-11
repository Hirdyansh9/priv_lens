#!/usr/bin/env python3
"""
Initialize the Legal Knowledge Base
Run this script once to populate the legal reference documents
"""
from backend.core.legal_knowledge_base import ingest_legal_documents, is_legal_kb_initialized, query_legal_knowledge
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set database connection (same as backend/app.py)
os.environ['DB_HOST'] = 'localhost'
os.environ['DB_PORT'] = '5432'
os.environ['DB_NAME'] = 'privacy_lens_db'
os.environ['DB_USER'] = 'hirdyanshmahajan'
os.environ['DB_PASSWORD'] = ''


def main():
    print("="*60)
    print("LEGAL KNOWLEDGE BASE INITIALIZATION")
    print("="*60)
    print()

    # Check if already initialized
    print("Checking if legal knowledge base is already initialized...")
    if is_legal_kb_initialized():
        print("✓ Legal knowledge base already contains data")
        response = input(
            "\nDo you want to reingest documents? This will add duplicate data. (y/N): ")
        if response.lower() != 'y':
            print("\nSkipping ingestion. Exiting.")
            return

    print("\n" + "-"*60)
    print("Starting ingestion of legal reference documents...")
    print("-"*60 + "\n")

    try:
        ingest_legal_documents()
        print("\n" + "="*60)
        print("✓ SUCCESS: Legal knowledge base populated successfully!")
        print("="*60)

        # Run test queries
        print("\n" + "-"*60)
        print("Testing legal knowledge base with sample queries...")
        print("-"*60 + "\n")

        test_queries = [
            ("GDPR", "What are the data subject rights under GDPR?"),
            ("COPPA", "What are the requirements for parental consent?"),
            ("CCPA", "What is the right to opt-out?")
        ]

        for regulation, query in test_queries:
            print(f"\n📋 Testing {regulation}: {query}")
            results = query_legal_knowledge(query, regulation=regulation, k=1)
            if results:
                print(f"✓ Found {len(results)} result(s)")
                print(f"Preview: {results[0].page_content[:200]}...")
            else:
                print("✗ No results found")

        print("\n" + "="*60)
        print("Legal knowledge base is ready for use!")
        print("="*60)

    except Exception as e:
        print(f"\n✗ ERROR: Failed to initialize legal knowledge base")
        print(f"Error details: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
