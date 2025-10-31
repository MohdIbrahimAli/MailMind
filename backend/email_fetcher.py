import os
import base64
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
import pickle
from email.mime.text import MIMEText
from bs4 import BeautifulSoup

SCOPES = ['https://www.googleapis.com/auth/gmail.modify']

class EmailFetcher:
    def __init__(self):
        self.service = None
        self.authenticate()
    
    def authenticate(self):
        """Authenticate with Gmail API"""
        creds = None
        
        # Token.pickle stores the user's access and refresh tokens
        if os.path.exists('token.pickle'):
            with open('token.pickle', 'rb') as token:
                creds = pickle.load(token)
        
        # If there are no valid credentials, let the user log in
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                flow = InstalledAppFlow.from_client_secrets_file(
                    'credentials.json', SCOPES)
                creds = flow.run_local_server(port=0)
            
            # Save the credentials for the next run
            with open('token.pickle', 'wb') as token:
                pickle.dump(creds, token)
        
        self.service = build('gmail', 'v1', credentials=creds)
        print("✅ Successfully authenticated with Gmail!")
    
    def fetch_emails(self, max_results=5):
        """Fetch recent unread emails"""
        try:
            results = self.service.users().messages().list(
                userId='me',
                q='is:unread',
                maxResults=max_results
            ).execute()
            
            messages = results.get('messages', [])
            
            if not messages:
                print("No unread emails found.")
                return []
            
            emails = []
            for message in messages:
                email_data = self.get_email_details(message['id'])
                emails.append(email_data)
            
            return emails
        
        except Exception as e:
            print(f"Error fetching emails: {e}")
            return []
    
    def get_email_details(self, msg_id):
        """Get detailed information about an email"""
        try:
            message = self.service.users().messages().get(
                userId='me',
                id=msg_id,
                format='full'
            ).execute()
            
            headers = message['payload']['headers']
            
            # Extract headers
            subject = next((h['value'] for h in headers if h['name'] == 'Subject'), 'No Subject')
            sender = next((h['value'] for h in headers if h['name'] == 'From'), 'Unknown')
            date = next((h['value'] for h in headers if h['name'] == 'Date'), 'Unknown')
            
            # Extract body
            body = self.extract_body(message['payload'])
            
            return {
                'id': msg_id,
                'subject': subject,
                'sender': sender,
                'date': date,
                'body': body
            }
        
        except Exception as e:
            print(f"Error getting email details: {e}")
            return None
    
    def extract_body(self, payload):
        """Extract email body from payload"""
        body = ""
        
        if 'parts' in payload:
            for part in payload['parts']:
                if part['mimeType'] == 'text/plain':
                    if 'data' in part['body']:
                        body = base64.urlsafe_b64decode(part['body']['data']).decode('utf-8')
                        break
                elif part['mimeType'] == 'text/html':
                    if 'data' in part['body']:
                        html_body = base64.urlsafe_b64decode(part['body']['data']).decode('utf-8')
                        body = BeautifulSoup(html_body, 'html.parser').get_text()
        else:
            if 'body' in payload and 'data' in payload['body']:
                body = base64.urlsafe_b64decode(payload['body']['data']).decode('utf-8')
        
        # Clean up body
        body = ' '.join(body.split())
        return body[:2000]  # Limit to first 2000 chars
    
    def mark_as_read(self, msg_id):
        """Mark email as read"""
        try:
            self.service.users().messages().modify(
                userId='me',
                id=msg_id,
                body={'removeLabelIds': ['UNREAD']}
            ).execute()
            print(f"✅ Marked email {msg_id} as read")
        except Exception as e:
            print(f"Error marking email as read: {e}")
    
    def send_reply(self, to_email, subject, body):
        """Send an email reply"""
        try:
            message = MIMEText(body)
            message['to'] = to_email
            message['subject'] = f"Re: {subject}"
            
            raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
            
            self.service.users().messages().send(
                userId='me',
                body={'raw': raw}
            ).execute()
            
            print(f"✅ Reply sent to {to_email}")
            return True
        except Exception as e:
            print(f"Error sending reply: {e}")
            return False