from .gmail_tool import fetch_resumes_from_gmail


def email_ingestion_tool(subject: str):
    """
    Tool: Fetch resumes from Gmail inbox.
    """
    try:
        resumes = fetch_resumes_from_gmail(subject)

        return {
            "status": "ok",
            "message": f"Fetched {len(resumes)} resumes from Gmail",
            "data": resumes
        }

    except Exception as e:
        return {
            "status": "error",
            "message": "Failed to fetch resumes from Gmail",
            "error": str(e),
            "data": []
        }


__all__ = ["email_ingestion_tool"]