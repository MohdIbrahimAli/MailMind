# ============================================
# MAILMIND BACKEND - FastAPI Server
# Updated to use email_fetcher.py and email_agent.py
# ============================================

from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict
import os
from datetime import datetime, timedelta
import json
import firebase_admin
from firebase_admin import credentials, firestore, auth
from dotenv import load_dotenv

# Import our custom modules
from email_fetcher import EmailFetcher
from email_agent import EmailAgent

# Load environment variables
load_dotenv()

# ============================================
# FIREBASE INITIALIZATION
# ============================================

# Initialize Firebase Admin SDK (only if not already initialized)
try:
    firebase_admin.get_app()
except ValueError:
    cred = credentials.Certificate(os.getenv('FIREBASE_SERVICE_ACCOUNT_KEY_PATH'))
    firebase_admin.initialize_app(cred)

db = firestore.client()

# ============================================
# AI AGENT INITIALIZATION
# ============================================

# Initialize Email Agent (Gemini AI)
try:
    email_agent = EmailAgent()
except Exception as e:
    print(f"WARNING: Could not initialize Email Agent: {e}")
    email_agent = None

# ============================================
# FASTAPI APP INITIALIZATION
# ============================================

app = FastAPI(
    title="MailMind API",
    description="AI-Powered Email Summarization Service",
    version="1.0.0"
)

# Configure CORS - MUST BE BEFORE ROUTES
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:3000",
        "*"  # Allow all for development
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Handle preflight OPTIONS requests
@app.options("/{rest_of_path:path}")
async def preflight_handler(rest_of_path: str):
    return {"status": "ok"}

# ============================================
# PYDANTIC MODELS
# ============================================

class EmailSummaryRequest(BaseModel):
    email_body: str
    email_subject: str
    email_sender: str = "Unknown"
    summary_length: str = "Medium"  # Short, Medium, Detailed

class EmailSummaryResponse(BaseModel):
    summary: str
    urgency: str  # High, Medium, Low
    tone: str  # Formal, Neutral, Informal
    category: str  # Work, Personal, Promotion, Other
    key_points: List[str] = []
    action_items: List[str] = []

class GmailAuthRequest(BaseModel):
    user_id: str
    
class EmailFetchRequest(BaseModel):
    user_id: str
    max_results: int = 10

class UserPreferences(BaseModel):
    summary_length: str = "Medium"
    theme: str = "light"

class ReplyRequest(BaseModel):
    email_id: str
    email_subject: str
    email_body: str
    email_sender: str
    tone: str = "professional"

# ============================================
# AUTHENTICATION MIDDLEWARE
# ============================================

async def verify_firebase_token(authorization: str = Header(None)):
    """Verify Firebase authentication token"""
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    
    token = authorization.split('Bearer ')[1]
    
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

# ============================================
# HELPER FUNCTIONS
# ============================================

def map_urgency(gemini_urgency: str) -> str:
    """Map Gemini urgency to our format"""
    urgency_map = {
        "low": "Low",
        "medium": "Medium",
        "high": "High",
        "unknown": "Medium"
    }
    return urgency_map.get(gemini_urgency.lower(), "Medium")

def map_category(gemini_category: str) -> str:
    """Map Gemini category to our format"""
    category_map = {
        "work": "Work",
        "personal": "Personal",
        "newsletter": "Promotion",
        "promotional": "Promotion",
        "unknown": "Other"
    }
    return category_map.get(gemini_category.lower(), "Other")

def map_tone(gemini_sentiment: str) -> str:
    """Map Gemini sentiment to tone"""
    tone_map = {
        "positive": "Informal",
        "neutral": "Neutral",
        "negative": "Formal"
    }
    return tone_map.get(gemini_sentiment.lower(), "Neutral")

# ============================================
# API ENDPOINTS
# ============================================

@app.get("/")
async def root():
    """Health check endpoint"""
    gemini_status = "active" if email_agent is not None else "unavailable"
    return {
        "status": "active",
        "service": "MailMind API",
        "version": "1.0.0",
        "gemini_status": gemini_status,
        "model": email_agent.model if email_agent else "N/A",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.post("/api/summarize")
async def summarize_email(
    request: EmailSummaryRequest,
    user_data: dict = Depends(verify_firebase_token)
):
    """
    Summarize an email using Gemini AI
    Requires: Firebase authentication token
    """
    try:
        if not email_agent:
            raise HTTPException(status_code=503, detail="AI service not available")
        
        # Prepare email data for agent
        email_data = {
            'sender': request.email_sender,
            'subject': request.email_subject,
            'body': request.email_body,
            'date': datetime.utcnow().isoformat()
        }
        
        # Get AI analysis
        analysis = email_agent.summarize_email(email_data)
        
        # Map to our response format
        summary_response = EmailSummaryResponse(
            summary=analysis.get('summary', 'Unable to generate summary'),
            urgency=map_urgency(analysis.get('urgency', 'medium')),
            tone=map_tone(analysis.get('sentiment', 'neutral')),
            category=map_category(analysis.get('category', 'unknown')),
            key_points=analysis.get('key_points', []),
            action_items=analysis.get('action_items', [])
        )
        
        # Save to Firestore
        user_id = user_data['uid']
        db.collection('summaries').add({
            'user_id': user_id,
            'subject': request.email_subject,
            'sender': request.email_sender,
            'summary': summary_response.summary,
            'urgency': summary_response.urgency,
            'tone': summary_response.tone,
            'category': summary_response.category,
            'key_points': summary_response.key_points,
            'action_items': summary_response.action_items,
            'created_at': firestore.SERVER_TIMESTAMP
        })
        
        return summary_response
        
    except Exception as e:
        print(f"Error in summarize_email: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating summary: {str(e)}")

@app.post("/api/gmail/authorize")
async def authorize_gmail(
    request: GmailAuthRequest,
    user_data: dict = Depends(verify_firebase_token)
):
    """
    Initialize Gmail OAuth flow
    This will trigger the OAuth flow when EmailFetcher is instantiated
    """
    try:
        user_id = user_data['uid']
        
        # Store user preference to connect Gmail
        user_ref = db.collection('users').document(user_id)
        user_ref.set({
            'gmail_auth_requested': True,
            'gmail_auth_timestamp': firestore.SERVER_TIMESTAMP
        }, merge=True)
        
        return {
            "success": True,
            "message": "Gmail authorization initiated. Please complete OAuth flow in terminal/browser.",
            "note": "Run the backend to complete the OAuth flow if not already authenticated."
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error initiating Gmail auth: {str(e)}")

@app.post("/api/gmail/fetch")
async def fetch_emails(
    request: EmailFetchRequest,
    user_data: dict = Depends(verify_firebase_token)
):
    """
    Fetch latest emails from Gmail and generate summaries
    Requires: Gmail authorization completed
    """
    try:
        user_id = user_data['uid']
        
        # Limit max results to prevent timeouts
        max_results = min(request.max_results, 5)  # Process max 5 emails at a time
        
        print(f"📧 Fetching up to {max_results} emails for user {user_id}")
        
        # Initialize EmailFetcher (will use existing token.pickle)
        try:
            fetcher = EmailFetcher()
        except Exception as e:
            print(f"❌ Gmail auth error: {str(e)}")
            raise HTTPException(
                status_code=401, 
                detail=f"Gmail not authorized. Please complete OAuth flow in backend terminal. Error: {str(e)}"
            )
        
        # Fetch emails
        print(f"🔍 Fetching emails from Gmail...")
        emails = fetcher.fetch_emails(max_results=max_results)
        
        if not emails:
            print("📭 No unread emails found")
            return {
                "success": True,
                "emails_processed": 0,
                "emails": [],
                "message": "No unread emails found"
            }
        
        print(f"📬 Found {len(emails)} emails, processing...")
        processed_emails = []
        
        for idx, email in enumerate(emails, 1):
            try:
                print(f"  [{idx}/{len(emails)}] Processing: {email.get('subject', 'No subject')[:50]}")
                
                # Generate AI summary if agent is available
                if email_agent:
                    try:
                        analysis = email_agent.summarize_email(email)
                        
                        # Prepare processed email data for Firestore
                        email_doc_firestore = {
                            'user_id': user_id,
                            'email_id': email['id'],
                            'from': email['sender'],
                            'subject': email['subject'],
                            'date': email['date'],
                            'body_preview': email['body'][:200],
                            'summary': analysis.get('summary', 'Unable to generate summary'),
                            'urgency': map_urgency(analysis.get('urgency', 'medium')),
                            'tone': map_tone(analysis.get('sentiment', 'neutral')),
                            'category': map_category(analysis.get('category', 'unknown')),
                            'key_points': analysis.get('key_points', []),
                            'action_items': analysis.get('action_items', []),
                            'created_at': firestore.SERVER_TIMESTAMP,
                            'unread': True
                        }
                        
                        # Prepare email data for API response (without SERVER_TIMESTAMP)
                        email_doc_response = {
                            'user_id': user_id,
                            'email_id': email['id'],
                            'from': email['sender'],
                            'subject': email['subject'],
                            'date': email['date'],
                            'body_preview': email['body'][:200],
                            'summary': analysis.get('summary', 'Unable to generate summary'),
                            'urgency': map_urgency(analysis.get('urgency', 'medium')),
                            'tone': map_tone(analysis.get('sentiment', 'neutral')),
                            'category': map_category(analysis.get('category', 'unknown')),
                            'key_points': analysis.get('key_points', []),
                            'action_items': analysis.get('action_items', []),
                            'created_at': datetime.utcnow().isoformat(),
                            'unread': True
                        }
                        print(f"  ✅ AI summary generated")
                    except Exception as ai_error:
                        print(f"  ⚠️ AI error: {str(ai_error)}, using fallback")
                        email_doc_firestore, email_doc_response = create_fallback_email_doc(user_id, email)
                else:
                    print(f"  ⚠️ AI agent unavailable, using fallback")
                    email_doc_firestore, email_doc_response = create_fallback_email_doc(user_id, email)
                
                # Save to Firestore
                db.collection('emails').add(email_doc_firestore)
                processed_emails.append(email_doc_response)
                print(f"  💾 Saved to Firestore")
                
            except Exception as e:
                print(f"  ❌ Error processing email {email.get('id')}: {str(e)}")
                continue
        
        print(f"✅ Successfully processed {len(processed_emails)} emails")
        
        return {
            "success": True,
            "emails_processed": len(processed_emails),
            "emails": processed_emails,
            "message": f"Processed {len(processed_emails)} out of {len(emails)} emails"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in fetch_emails: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching emails: {str(e)}")

def create_fallback_email_doc(user_id: str, email: dict):
    """Create fallback email document without AI analysis - returns both Firestore and response versions"""
    firestore_doc = {
        'user_id': user_id,
        'email_id': email['id'],
        'from': email['sender'],
        'subject': email['subject'],
        'date': email['date'],
        'body_preview': email['body'][:200],
        'summary': email['body'][:300] + '...' if len(email['body']) > 300 else email['body'],
        'urgency': 'Medium',
        'tone': 'Neutral',
        'category': 'Other',
        'key_points': [],
        'action_items': [],
        'created_at': firestore.SERVER_TIMESTAMP,
        'unread': True
    }
    
    response_doc = {
        'user_id': user_id,
        'email_id': email['id'],
        'from': email['sender'],
        'subject': email['subject'],
        'date': email['date'],
        'body_preview': email['body'][:200],
        'summary': email['body'][:300] + '...' if len(email['body']) > 300 else email['body'],
        'urgency': 'Medium',
        'tone': 'Neutral',
        'category': 'Other',
        'key_points': [],
        'action_items': [],
        'created_at': datetime.utcnow().isoformat(),
        'unread': True
    }
    
    return firestore_doc, response_doc

@app.post("/api/gmail/reply")
async def generate_reply(
    request: ReplyRequest,
    user_data: dict = Depends(verify_firebase_token)
):
    """
    Generate an AI-powered reply to an email
    """
    try:
        if not email_agent:
            raise HTTPException(status_code=503, detail="AI service not available")
        
        # Prepare email data
        email_data = {
            'sender': request.email_sender,
            'subject': request.email_subject,
            'body': request.email_body,
            'date': datetime.utcnow().isoformat()
        }
        
        # Generate reply
        draft_reply = email_agent.generate_reply(email_data, tone=request.tone)
        
        return {
            "success": True,
            "draft_reply": draft_reply,
            "tone": request.tone
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating reply: {str(e)}")

@app.get("/api/summaries/{user_id}")
async def get_user_summaries(
    user_id: str,
    limit: int = 50,
    user_data: dict = Depends(verify_firebase_token)
):
    """
    Get all summaries for a user
    """
    try:
        # Verify user is accessing their own data
        if user_data['uid'] != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Query Firestore
        summaries = db.collection('emails')\
            .where('user_id', '==', user_id)\
            .order_by('created_at', direction=firestore.Query.DESCENDING)\
            .limit(limit)\
            .stream()
        
        results = []
        for doc in summaries:
            data = doc.to_dict()
            data['id'] = doc.id
            # Convert timestamp to ISO format
            if 'created_at' in data and data['created_at']:
                data['created_at'] = data['created_at'].isoformat()
            results.append(data)
        
        return {
            "success": True,
            "count": len(results),
            "summaries": results
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_user_summaries: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching summaries: {str(e)}")

@app.get("/api/analytics/{user_id}")
async def get_user_analytics(
    user_id: str,
    user_data: dict = Depends(verify_firebase_token)
):
    """
    Get email analytics for a user
    """
    try:
        # Verify user is accessing their own data
        if user_data['uid'] != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Query all emails
        emails = db.collection('emails')\
            .where('user_id', '==', user_id)\
            .stream()
        
        total = 0
        urgency_counts = {"High": 0, "Medium": 0, "Low": 0}
        category_counts = {"Work": 0, "Personal": 0, "Promotion": 0, "Other": 0}
        
        for doc in emails:
            data = doc.to_dict()
            total += 1
            urgency_counts[data.get('urgency', 'Medium')] += 1
            category_counts[data.get('category', 'Other')] += 1
        
        return {
            "success": True,
            "total_emails": total,
            "urgency_breakdown": urgency_counts,
            "category_breakdown": category_counts,
            "estimated_time_saved_hours": round(total * 0.015, 1)  # 54 seconds per email
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_user_analytics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching analytics: {str(e)}")

@app.post("/api/user/preferences")
async def update_user_preferences(
    preferences: UserPreferences,
    user_data: dict = Depends(verify_firebase_token)
):
    """
    Update user preferences
    """
    try:
        user_id = user_data['uid']
        
        # Update or create user preferences in Firestore
        user_ref = db.collection('users').document(user_id)
        user_ref.set({
            'preferences': preferences.dict(),
            'updated_at': firestore.SERVER_TIMESTAMP
        }, merge=True)
        
        return {
            "success": True,
            "message": "Preferences updated successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating preferences: {str(e)}")

@app.delete("/api/summaries/{user_id}")
async def clear_user_summaries(
    user_id: str,
    user_data: dict = Depends(verify_firebase_token)
):
    """
    Clear all summaries for a user
    """
    try:
        # Verify user is accessing their own data
        if user_data['uid'] != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Delete all emails for user
        emails = db.collection('emails').where('user_id', '==', user_id).stream()
        deleted_count = 0
        
        for doc in emails:
            doc.reference.delete()
            deleted_count += 1
        
        return {
            "success": True,
            "deleted_count": deleted_count,
            "message": f"Cleared {deleted_count} summaries"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error clearing summaries: {str(e)}")

@app.get("/api/test-cors")
async def test_cors():
    """Test endpoint to verify CORS is working"""
    return {
        "message": "CORS is working!",
        "timestamp": datetime.utcnow().isoformat(),
        "origin": "Backend is accessible"
    }

# ============================================
# RUN SERVER
# ============================================

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting MailMind API Server...")
    print(f"📧 Email Agent Status: {'✅ Active' if email_agent else '❌ Unavailable'}")
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )