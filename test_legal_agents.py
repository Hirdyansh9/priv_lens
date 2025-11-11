#!/usr/bin/env python3
"""
Test the legal-enhanced privacy agents
"""
from backend.core.privacy_agents import create_gdpr_compliance_agent, create_kids_privacy_agent
from dotenv import load_dotenv
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment variables first
load_dotenv()

# Set database connection
os.environ['DB_HOST'] = 'localhost'
os.environ['DB_PORT'] = '5432'
os.environ['DB_NAME'] = 'privacy_lens_db'
os.environ['DB_USER'] = 'hirdyanshmahajan'
if not os.environ.get('DB_PASSWORD'):
    os.environ['DB_PASSWORD'] = ''


def test_gdpr_agent():
    """Test GDPR agent with legal references (no policy)"""
    print("="*70)
    print("TEST 1: GDPR Compliance Agent (with legal references)")
    print("="*70)
    print()

    agent = create_gdpr_compliance_agent(policy_id=None)

    test_policy = """
    Our Company Privacy Policy
    
    We collect name, email, and location data from users. 
    Users can contact us at support@example.com to request data.
    We share data with third-party advertisers for marketing purposes.
    Data is stored indefinitely.
    """

    result = agent.invoke({"policy_text": test_policy})

    print("GDPR COMPLIANCE ASSESSMENT:")
    print("-" * 70)
    print(result)
    print()


def test_kids_privacy_agent():
    """Test Kids Privacy agent with COPPA legal references"""
    print("="*70)
    print("TEST 2: Kids Privacy Guardian (with COPPA legal references)")
    print("="*70)
    print()

    agent = create_kids_privacy_agent(policy_id=None)

    test_policy = """
    Children's App Privacy Policy
    
    Our app is designed for children ages 6-12.
    We collect username, profile pictures, and gameplay data.
    Parents can email us to review their child's data.
    """

    result = agent.invoke({"policy_text": test_policy})

    print("COPPA COMPLIANCE ASSESSMENT:")
    print("-" * 70)
    print(result)
    print()


def main():
    print("\n" + "="*70)
    print("TESTING LEGAL-ENHANCED PRIVACY AGENTS")
    print("="*70 + "\n")

    try:
        test_gdpr_agent()
        test_kids_privacy_agent()

        print("="*70)
        print("✓ All tests completed successfully!")
        print("="*70)

    except Exception as e:
        print(f"\n✗ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
