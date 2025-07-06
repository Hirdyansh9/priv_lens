from langchain_community.document_loaders import WebBaseLoader

def get_text_from_url(url: str) -> str:
    """
    Fetches and extracts clean text content from a URL using LangChain's WebBaseLoader.
    """
    try:
        loader = WebBaseLoader(
            web_path=url,
            header_template={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        )

        documents = loader.load()

        if not documents or not documents[0].page_content:
            raise ValueError("The loader could not extract any meaningful content from the URL. The page might be empty or rendered with complex JavaScript.")
            
        # Combine the page content from all loaded documents (usually there's only one for a single URL)
        full_text = "\n\n".join([doc.page_content for doc in documents])

        if len(full_text) < 100:
            raise ValueError("Extracted text is too short. This might not be a valid privacy policy page.")

        return full_text

    except Exception as e:
        # Catch any error from the loader (e.g., network issues, 404s) 
        # and re-raise as a more generic error for the frontend.
        print(f"WebBaseLoader failed for URL {url}: {e}")
        raise ConnectionError(f"Could not load content from the provided URL. Please check the link and try again.")