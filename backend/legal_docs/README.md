# Legal Knowledge Base for PrivacyLens

This directory contains reference documents for major privacy regulations used by PrivacyLens to provide accurate, legally-grounded compliance assessments.

## Overview

The legal knowledge base enables AI agents to reference **official regulatory requirements** when analyzing privacy policies, significantly improving accuracy and credibility over relying solely on LLM training data.

## Included Regulations

### 1. GDPR (General Data Protection Regulation)

**File:** `gdpr_requirements.txt`

- **Jurisdiction:** European Union
- **Reference:** Regulation (EU) 2016/679
- **Coverage:** Comprehensive GDPR articles and requirements including:
  - Principles of data processing (Article 5)
  - Lawfulness of processing (Article 6)
  - Consent requirements (Article 7)
  - Data subject rights (Articles 15-22)
  - Controller obligations (Articles 24-39)
  - Data breach notification (Articles 33-34)
  - International transfers (Articles 44-46)
  - Special categories of data (Articles 8-9)

### 2. COPPA (Children's Online Privacy Protection Act)

**File:** `coppa_requirements.txt`

- **Jurisdiction:** United States
- **Reference:** 15 U.S.C. §§ 6501–6506 and 16 CFR Part 312
- **Coverage:** Complete COPPA requirements including:
  - Definitions and scope
  - Privacy policy requirements
  - Parental notice and consent
  - Verifiable parental consent methods
  - Parental rights
  - Data security and retention
  - Conditional access prohibitions
  - Safe harbor programs

### 3. CCPA/CPRA (California Consumer Privacy Act)

**File:** `ccpa_requirements.txt`

- **Jurisdiction:** California, United States
- **Reference:** Cal. Civ. Code §§ 1798.100-1798.199
- **Coverage:** CCPA and CPRA requirements including:
  - Consumer rights (know, delete, correct, opt-out, limit)
  - Business obligations
  - Privacy policy requirements
  - Notice requirements
  - Sensitive personal information
  - Minors' information protections
  - Service provider contracts
  - Enforcement and penalties

## How It Works

### 1. Document Ingestion

Legal documents are:

- Split into 1000-character chunks with 150-character overlap
- Embedded using FastEmbed (BAAI/bge-small-en-v1.5)
- Stored in PostgreSQL with pgvector extension
- Tagged with metadata (regulation, jurisdiction, source)

### 2. Retrieval During Analysis

When agents analyze policies:

1. **Query Formation:** Agent formulates query for relevant legal requirements
2. **Vector Search:** System retrieves most relevant legal document chunks
3. **Context Assembly:** Retrieved legal text combined with policy sections
4. **Analysis:** LLM analyzes policy against official legal requirements
5. **Citation:** Results reference specific articles/sections

### 3. RAG Pipeline

```
User Policy → Agent Triggered
    ↓
Policy Chunks Retrieved (from policy_vectors)
    +
Legal Requirements Retrieved (from legal_knowledge_base)
    ↓
Combined Context Sent to LLM
    ↓
Compliance Assessment with Legal Citations
```

## Setup Instructions

### Initial Setup (One-Time)

```bash
# From project root
python init_legal_kb.py
```

This will:

1. Read all legal documents from `backend/legal_docs/`
2. Chunk and embed the content
3. Store in `legal_knowledge_base` collection
4. Run test queries to verify

### Verification

```python
from backend.core.legal_knowledge_base import is_legal_kb_initialized, query_legal_knowledge

# Check if initialized
if is_legal_kb_initialized():
    print("Legal KB ready!")

# Test query
results = query_legal_knowledge(
    "What are the data subject rights?",
    regulation="GDPR",
    k=3
)
```

## Database Schema

### Collection: `legal_knowledge_base`

- **uuid:** Unique identifier
- **embedding:** 768-dimensional vector
- **document:** Legal text chunk
- **cmetadata:** JSON with:
  - `regulation`: GDPR, COPPA, or CCPA
  - `jurisdiction`: Geographic scope
  - `full_name`: Complete regulation name
  - `type`: regulation or law
  - `source_file`: Origin file

## Agents Using Legal KB

### 1. GDPR Compliance Checker

- Retrieves: 6 relevant GDPR document chunks
- References: Specific articles (e.g., Article 15, Article 33)
- Cites: Legal basis for each compliance point

### 2. Kids' Privacy Guardian

- Retrieves: 5 relevant COPPA document chunks
- References: USC sections and CFR parts
- Cites: Specific COPPA requirements

### Future Integration

- Data Minimization Agent (GDPR Article 5)
- Breach Risk Agent (GDPR Articles 32-34)
- Rights Assistant (GDPR Articles 15-22, CCPA rights)

## Benefits

### Accuracy

✅ References official legal text, not just LLM knowledge
✅ Cites specific articles and sections
✅ Reduces hallucinations about legal requirements

### Credibility

✅ Backed by actual regulations
✅ Provides legal citations
✅ Auditable compliance assessments

### Coverage

✅ Comprehensive regulation coverage
✅ Up-to-date legal requirements
✅ Multi-jurisdiction support

### Maintainability

✅ Easy to update when regulations change
✅ Add new regulations by adding files
✅ Centralized legal reference management

## Adding New Regulations

To add a new regulation:

1. **Create Reference Document**

   ```
   backend/legal_docs/new_regulation.txt
   ```

2. **Update legal_knowledge_base.py**
   Add to `legal_files` dict in `ingest_legal_documents()`:

   ```python
   "new_regulation.txt": {
       "regulation": "NEW_REG",
       "jurisdiction": "Region",
       "full_name": "Full Regulation Name",
       "type": "regulation"
   }
   ```

3. **Reingest**

   ```bash
   python init_legal_kb.py
   ```

4. **Create Agent** (optional)
   Reference new regulation in agent prompts

## Suggested Additions

Future regulations to add:

- **PIPEDA** (Canada)
- **LGPD** (Brazil)
- **POPIA** (South Africa)
- **HIPAA** (US Healthcare)
- **FERPA** (US Education)
- **GLBA** (US Financial)
- **UK GDPR** (Post-Brexit UK)
- **Privacy Shield** (US-EU transfers)
- **State Privacy Laws** (Virginia, Colorado, Connecticut, Utah)

## Technical Details

### Embedding Model

- **Model:** BAAI/bge-small-en-v1.5
- **Type:** Local (no API calls)
- **Dimensions:** 768
- **Speed:** Fast inference
- **Quality:** High semantic accuracy

### Retrieval Strategy

- **Method:** Maximum Marginal Relevance (MMR)
- **k:** 5-8 documents retrieved
- **fetch_k:** 3x k candidates considered
- **lambda:** 0.7 (favors relevance for legal text)
- **Filtering:** By regulation when specified

### Storage

- **Database:** PostgreSQL with pgvector
- **Collection:** `legal_knowledge_base`
- **Isolation:** Separate from policy vectors
- **Persistence:** Permanent reference data

## Maintenance

### Updating Documents

When regulations change:

1. Update relevant `.txt` file
2. Clear old entries (optional)
3. Reingest: `python init_legal_kb.py`

### Monitoring

Check if KB is populated:

```python
from backend.core.legal_knowledge_base import is_legal_kb_initialized
print(is_legal_kb_initialized())
```

### Troubleshooting

**Issue:** Legal KB not initialized

```bash
python init_legal_kb.py
```

**Issue:** Agents not using legal references

- Check `legal_knowledge_base.py` import in agents
- Verify `get_legal_retriever()` calls
- Confirm prompt includes `{legal_context}`

**Issue:** Poor retrieval quality

- Adjust `k` parameter (more docs)
- Modify `lambda_mult` (balance relevance/diversity)
- Refine query strings in agents

## License & Compliance

These documents contain publicly available legal and regulatory information:

- GDPR: Official EU regulation (public domain)
- COPPA: US federal law (public domain)
- CCPA: California state law (public domain)

Use of these materials for legal compliance tools is permitted under fair use and public interest provisions.

**Disclaimer:** These are reference materials for AI analysis. Not legal advice. Consult qualified legal counsel for compliance matters.
