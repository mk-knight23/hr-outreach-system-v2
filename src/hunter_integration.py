"""
Hunter.io Email Verification Integration
"""
import requests
import os

HUNTER_API_KEY = os.getenv('HUNTER_API_KEY', '')
HUNTER_BASE_URL = 'https://api.hunter.io/v2'

def verify_email(email):
    """Verify email using Hunter.io"""
    if not HUNTER_API_KEY:
        return {'valid': None, 'score': 0, 'error': 'No API key'}
    
    try:
        response = requests.get(
            f'{HUNTER_BASE_URL}/email-verifier',
            params={'email': email, 'api_key': HUNTER_API_KEY},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json().get('data', {})
            return {
                'valid': data.get('result') == 'deliverable',
                'score': data.get('score', 0),
                'status': data.get('result'),
                'regexp': data.get('regexp', False),
                'gibberish': data.get('gibberish', False),
                'disposable': data.get('disposable', False),
                'webmail': data.get('webmail', False),
                'mx_records': data.get('mx_records', False),
                'smtp_server': data.get('smtp_server', False),
                'smtp_check': data.get('smtp_check', False),
                'accept_all': data.get('accept_all', False),
                'sources': data.get('sources', [])
            }
        else:
            return {'valid': None, 'score': 0, 'error': f'API Error: {response.status_code}'}
            
    except Exception as e:
        return {'valid': None, 'score': 0, 'error': str(e)}

def find_email(first_name, last_name, domain):
    """Find email using Hunter.io Email Finder"""
    if not HUNTER_API_KEY:
        return {'email': None, 'score': 0, 'error': 'No API key'}
    
    try:
        response = requests.get(
            f'{HUNTER_BASE_URL}/email-finder',
            params={
                'domain': domain,
                'first_name': first_name,
                'last_name': last_name,
                'api_key': HUNTER_API_KEY
            },
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json().get('data', {})
            return {
                'email': data.get('email'),
                'score': data.get('score', 0),
                'sources': data.get('sources', [])
            }
        else:
            return {'email': None, 'score': 0, 'error': f'API Error: {response.status_code}'}
            
    except Exception as e:
        return {'email': None, 'score': 0, 'error': str(e)}

def domain_search(domain, limit=10):
    """Search for all emails in a domain"""
    if not HUNTER_API_KEY:
        return {'emails': [], 'error': 'No API key'}
    
    try:
        response = requests.get(
            f'{HUNTER_BASE_URL}/domain-search',
            params={
                'domain': domain,
                'limit': limit,
                'api_key': HUNTER_API_KEY
            },
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json().get('data', {})
            return {
                'domain': data.get('domain'),
                'emails': data.get('emails', []),
                'pattern': data.get('pattern')
            }
        else:
            return {'emails': [], 'error': f'API Error: {response.status_code}'}
            
    except Exception as e:
        return {'emails': [], 'error': str(e)}

if __name__ == "__main__":
    print("Hunter.io integration ready")
