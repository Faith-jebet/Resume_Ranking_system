import base64
import pickle
from googleapiclient.discovery import build
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from datetime import datetime, timedelta
import os
import PyPDF2
from io import BytesIO

AGENT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CREDENTIALS_PATH = os.path.join(AGENT_DIR, 'my_agent', 'config', 'credentials.json')
TOKEN_PATH = os.path.join(AGENT_DIR, 'my_agent', 'tools', 'token.pickle')

def extract_text_from_pdf(pdf_bytes):
    try:
        reader = PyPDF2.PdfReader(BytesIO(pdf_bytes))
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text
    except Exception as e:
        print(f"Error extracting PDF: {e}")
        return ""

def extract_text_from_docx(docx_bytes):
    try:
        from docx import Document
        doc = Document(BytesIO(docx_bytes))
        return "\n".join([para.text for para in doc.paragraphs])
    except ImportError:
        print("python-docx not installed. Install with: pip install python-docx")
        return ""
    except Exception as e:
        print(f"Error extracting DOCX: {e}")
        return ""

SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']

def get_attachment(service, msg_id, attach_id):
    attachment = service.users().messages().attachments().get(
        userId="me",
        messageId=msg_id,
        id=attach_id
    ).execute()
    data = attachment.get("data")
    return base64.urlsafe_b64decode(data)

_gmail_service = None

def get_gmail_service():
    global _gmail_service
    if _gmail_service is not None:
        return _gmail_service

    creds = None

    if os.path.exists(TOKEN_PATH):
        try:
            with open(TOKEN_PATH, "rb") as token:
                creds = pickle.load(token)
        except EOFError:
            os.remove(TOKEN_PATH)
            creds = None

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
           try:
            creds.refresh(Request())
           except Exception as e:
               print(f"Error refreshing token: {e}, re-authenticating")
               os.remove(TOKEN_PATH)
               creds = None
               _gmail_service = None
        if not creds:
            flow = InstalledAppFlow.from_client_secrets_file(
                CREDENTIALS_PATH,
                SCOPES
            )
            creds = flow.run_local_server(
                port=0,
                access_type='offline',
                prompt='consent'   #forces Google to re-issue a refresh token
                                          
          )

        with open(TOKEN_PATH, "wb") as token:
            pickle.dump(creds, token)

    print("Gmail credentials are set up.")
    service = build("gmail", "v1", credentials=creds)

    try:
        profile = service.users().getProfile(userId='me').execute()
        print(f"📧 Authenticated as: {profile.get('emailAddress')}")
    except:
        pass

    _gmail_service = service
    return _gmail_service


def get_parts_text(parts, service, msg_id, depth=0):
    texts = []
    indent = "  " * depth

    for idx, part in enumerate(parts, 1):
        filename = part.get("filename", "")
        body = part.get("body", {})
        mime_type = part.get("mimeType", "")

        print(f"{indent}Part {idx}: filename='{filename}', mimeType='{mime_type}'")

        if "parts" in part:
            print(f"{indent}  → Nested parts found, recursing...")
            texts.extend(get_parts_text(part["parts"], service, msg_id, depth + 1))
            continue

        text = None
        raw_bytes = None          # ← NEW: keep raw bytes
        detected_mime = "application/octet-stream"

        if filename.endswith(".txt") and "data" in body:
            raw_bytes = base64.urlsafe_b64decode(body["data"])
            text = raw_bytes.decode("utf-8", errors="ignore")
            detected_mime = "text/plain"
            print(f"{indent}   Extracted TXT: {filename}")

        elif filename.endswith(".pdf") and "attachmentId" in body:
            attach_id = body["attachmentId"]
            raw_bytes = get_attachment(service, msg_id, attach_id)
            text = extract_text_from_pdf(raw_bytes)
            detected_mime = "application/pdf"
            print(f"{indent}  Extracted PDF: {filename}")

        elif (filename.endswith(".docx") or filename.endswith(".doc")) and "attachmentId" in body:
            attach_id = body["attachmentId"]
            raw_bytes = get_attachment(service, msg_id, attach_id)
            text = extract_text_from_docx(raw_bytes)
            detected_mime = (
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                if filename.endswith(".docx") else "application/msword"
            )
            print(f"{indent}  Extracted DOCX: {filename}")

        else:
            if filename:
                print(f"{indent}  ⏭️  Skipped: {filename} (unsupported format)")
            continue

        if text and text.strip():
            texts.append({
                "filename": filename,
                "resume_text": text,
                "raw_bytes": raw_bytes,       # ← NEW: PDF/DOCX bytes for storage
                "mime_type": detected_mime,   # ← NEW: correct MIME type
                "source": "gmail",
            })
        else:
            print(f"{indent}    Warning: Extracted empty text from {filename}")

    return texts


def fetch_resumes_from_gmail(subject=None, start_date=None, end_date=None):
    """
    start_date, end_date: strings in 'YYYY-MM-DD' format (from a date picker).
    Gmail's `before:` is exclusive, so we bump end_date by 1 day to make the
    range inclusive of the deadline day itself.
    """
    service = get_gmail_service()

    query_parts = ['has:attachment (filename:pdf OR filename:doc OR filename:docx OR filename:txt)']

    if subject:
        query_parts.append(f'subject:"{subject}"')
        print(f"🔍 Searching for emails with subject: '{subject}'")
    else:
        query_parts.append('(resume OR cv OR "curriculum vitae")')
        print(f"🔍 Searching for emails with resume attachments")

    if start_date:
        gmail_after = datetime.strptime(start_date, "%Y-%m-%d").strftime("%Y/%m/%d")
        query_parts.append(f'after:{gmail_after}')

    if end_date:
        end_dt = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
        gmail_before = end_dt.strftime("%Y/%m/%d")
        query_parts.append(f'before:{gmail_before}')

    query = ' '.join(query_parts)
    print(f"Gmail query: {query}")

    try:
        results = service.users().messages().list(
            userId='me',
            q=query,
            maxResults=50
        ).execute()
    except Exception as e:
        print(f" Error fetching emails: {e}")
        return []


    messages = results.get('messages', [])
    print(f" Found {len(messages)} email(s) matching search criteria")

    if not messages:
        return []

    resumes = []

    for idx, msg in enumerate(messages, 1):
        print(f"\n{'='*60}")
        print(f"Processing Email {idx}/{len(messages)}")
        print(f"{'='*60}")

        try:
            message = service.users().messages().get(
                userId="me",
                id=msg["id"],
                format='full'
            ).execute()

            headers = message.get("payload", {}).get("headers", [])
            subject_header = next((h["value"] for h in headers if h["name"].lower() == "subject"), "No Subject")
            from_header = next((h["value"] for h in headers if h["name"].lower() == "from"), "Unknown")

            print(f"From: {from_header}")
            print(f"Subject: {subject_header}")

            payload = message.get("payload", {})
            parts = payload.get("parts", [])

            if not parts:
                print("⚠️  No parts found - checking main body")
                if "body" in payload and "attachmentId" in payload.get("body", {}):
                    parts = [payload]
                    print("Found attachment in main body")

            if parts:
                print(f"Found {len(parts)} part(s) in email")
                email_resumes = get_parts_text(parts, service, msg["id"])
                print(f"Extracted {len(email_resumes)} resume(s) from this email")
                resumes.extend(email_resumes)
            else:
                print("  No attachments found in this email")

        except Exception as e:
            print(f" Error processing email {idx}: {e}")
            continue

    print(f"\n{'='*60}")
    print(f"SUMMARY: Extracted {len(resumes)} total resume(s) from {len(messages)} email(s)")
    print(f"{'='*60}\n")

    return resumes


if __name__ == "__main__":
    print("Starting Gmail authentication test...")
    service = get_gmail_service()
    resumes = fetch_resumes_from_gmail()
    print(f"\nFetched {len(resumes)} resumes.")