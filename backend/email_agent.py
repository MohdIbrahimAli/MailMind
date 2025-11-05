import os
import json
import re
import requests

class EmailAgent:
    def __init__(self):
        self.api_key = os.getenv('GOOGLE_API_KEY')
        if not self.api_key:
            raise ValueError("GOOGLE_API_KEY not found in environment variables")
        
        # Try different models in order of preference
        self.models = [
            "gemini-2.0-flash-lite",
            "gemini-2.0-flash",
            "gemini-1.5-flash",
            "gemini-pro"
        ]
        self.model = self.models[0]
        
        print(f"✅ Connected to Google Gemini AI (Model: {self.model})")
    
    def _call_gemini(self, prompt):
        """Call Gemini API directly via REST"""
        headers = {
            'Content-Type': 'application/json',
        }
        
        data = {
            "contents": [{
                "parts": [{
                    "text": prompt
                }]
            }]
        }
        
        for model in self.models:
            api_url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
            
            try:
                print(f"  Trying model: {model}...")
                response = requests.post(
                    f"{api_url}?key={self.api_key}",
                    headers=headers,
                    json=data,
                    timeout=30
                )
                
                if response.status_code == 200:
                    result = response.json()
                    self.model = model
                    
                    # Extract text from response
                    if 'candidates' in result and len(result['candidates']) > 0:
                        return result['candidates'][0]['content']['parts'][0]['text']
                    else:
                        return None
                elif response.status_code == 404:
                    continue  # Try next model
                else:
                    response.raise_for_status()
            
            except requests.exceptions.Timeout:
                print(f"  Timeout with {model}, trying next...")
                continue
            except Exception as e:
                print(f"  Error with {model}: {str(e)[:50]}")
                continue
        
        print(f"⚠️  Could not reach any Gemini model")
        return None
    
    def summarize_email(self, email_data):
        """Generate summary and analysis of email"""
        prompt = f"""Analyze this email and provide a structured response.

Email Details:
From: {email_data['sender']}
Subject: {email_data['subject']}
Date: {email_data['date']}

Body:
{email_data['body']}

Provide your analysis in the following JSON format:
{{
    "summary": "2-3 sentence summary of the email",
    "key_points": ["point 1", "point 2"],
    "action_items": ["action 1", "action 2"],
    "urgency": "low|medium|high",
    "category": "work|personal|newsletter|promotional",
    "sentiment": "positive|neutral|negative"
}}

Respond ONLY with the JSON, no additional text."""

        try:
            response_text = self._call_gemini(prompt)
            
            if response_text:
                # Extract JSON from response (handle markdown code blocks)
                response_text = re.sub(r'```json\s*', '', response_text)
                response_text = re.sub(r'```\s*', '', response_text)
                
                # Find JSON object
                start = response_text.find('{')
                end = response_text.rfind('}') + 1
                
                if start != -1 and end > start:
                    json_str = response_text[start:end]
                    analysis = json.loads(json_str)
                    return analysis
                else:
                    raise ValueError("No JSON found in response")
            else:
                raise ValueError("No response from API")
        
        except Exception as e:
            print(f"⚠️  Error in summarization: {e}")
            return {
                "summary": "Error generating summary. Please try again.",
                "key_points": [],
                "action_items": [],
                "urgency": "unknown",
                "category": "unknown",
                "sentiment": "neutral"
            }
    
    def generate_reply(self, email_data, tone="professional"):
        """Generate a draft reply to the email"""
        prompt = f"""Generate a {tone} email reply to the following email.

Original Email:
From: {email_data['sender']}
Subject: {email_data['subject']}
Body: {email_data['body']}

Generate a clear, concise, and appropriate response. Include:
1. Proper greeting
2. Acknowledgment of the email
3. Response to key points
4. Professional closing

Keep it under 150 words. Respond with ONLY the email body, no subject line or additional formatting."""

        try:
            response_text = self._call_gemini(prompt)
            
            if response_text:
                reply = response_text.strip()
                return reply
            else:
                raise ValueError("No response from API")
        
        except Exception as e:
            print(f"⚠️  Error generating reply: {e}")
            return "Error generating reply. Please try again."
    
    def batch_process(self, emails):
        """Process multiple emails and return summaries"""
        results = []
        
        for idx, email in enumerate(emails, 1):
            print(f"\n📧 Processing email {idx}/{len(emails)} with Gemini AI...")
            
            summary = self.summarize_email(email)
            draft_reply = self.generate_reply(email)
            
            results.append({
                'email': email,
                'summary': summary,
                'draft_reply': draft_reply
            })
        
        return results