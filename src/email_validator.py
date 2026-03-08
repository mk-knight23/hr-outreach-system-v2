#!/usr/bin/env python3
"""
Email Validation & Verification System
Prevents bounces by validating emails before sending
"""
import re
import socket
import smtplib
import dns.resolver
from typing import Tuple, Optional
import requests

class EmailValidator:
    """Validates email addresses using multiple methods"""
    
    def __init__(self, hunter_api_key: Optional[str] = None):
        self.hunter_api_key = hunter_api_key
        self.results_cache = {}
    
    def validate(self, email: str) -> Tuple[bool, str, dict]:
        """
        Comprehensive email validation
        Returns: (is_valid, status, details)
        """
        if email in self.results_cache:
            return self.results_cache[email]
        
        details = {
            'syntax_valid': False,
            'domain_valid': False,
            'mx_valid': False,
            'mailbox_valid': False,
            'disposable': False,
            'role_based': False,
            'score': 0
        }
        
        # 1. Syntax validation
        if not self._check_syntax(email):
            result = (False, 'invalid_syntax', details)
            self.results_cache[email] = result
            return result
        details['syntax_valid'] = True
        details['score'] += 20
        
        # 2. Extract domain
        domain = email.split('@')[1].lower()
        
        # 3. Check disposable email
        if self._is_disposable(domain):
            details['disposable'] = True
            result = (False, 'disposable_email', details)
            self.results_cache[email] = result
            return result
        
        # 4. Check role-based email
        if self._is_role_based(email):
            details['role_based'] = True
            details['score'] -= 10  # Penalty but still usable
        
        # 5. Domain validation
        if not self._check_domain(domain):
            result = (False, 'invalid_domain', details)
            self.results_cache[email] = result
            return result
        details['domain_valid'] = True
        details['score'] += 20
        
        # 6. MX record validation
        mx_record = self._get_mx_record(domain)
        if not mx_record:
            result = (False, 'no_mx_record', details)
            self.results_cache[email] = result
            return result
        details['mx_valid'] = True
        details['score'] += 30
        
        # 7. SMTP verification (optional - can be slow)
        # smtp_valid = self._verify_smtp(email, mx_record)
        # if smtp_valid:
        #     details['mailbox_valid'] = True
        #     details['score'] += 30
        
        # 8. Hunter.io verification (if API key available)
        if self.hunter_api_key:
            hunter_result = self._verify_with_hunter(email)
            if hunter_result:
                details['hunter_score'] = hunter_result.get('score', 0)
                details['score'] = hunter_result.get('score', details['score'])
        
        # Final determination
        if details['score'] >= 70:
            result = (True, 'valid', details)
        elif details['score'] >= 50:
            result = (True, 'risky', details)
        else:
            result = (False, 'low_confidence', details)
        
        self.results_cache[email] = result
        return result
    
    def _check_syntax(self, email: str) -> bool:
        """Check email syntax using RFC 5322"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None
    
    def _is_disposable(self, domain: str) -> bool:
        """Check if domain is a disposable email provider"""
        disposable_domains = {
            'tempmail.com', 'throwaway.com', 'mailinator.com',
            'guerrillamail.com', 'yopmail.com', 'sharklasers.com',
            'getairmail.com', '10minutemail.com', 'burnermail.io',
            'temp-mail.org', 'fake-email.com', 'mailnesia.com',
            'tempinbox.com', 'dispostable.com', 'mailcatch.com',
            'getnada.com', 'inbox.si', 'mintemail.com',
            'spamgourmet.com', 'boun.cr', 'trashmail.com'
        }
        return domain in disposable_domains
    
    def _is_role_based(self, email: str) -> bool:
        """Check if email is role-based (generic)"""
        role_patterns = [
            r'^careers?@',
            r'^jobs?@',
            r'^hiring@',
            r'^hr@',
            r'^recruit(ing|ment)?@',
            r'^talent@',
            r'^apply@',
            r'^work@',
            r'^join@',
            r'^team@',
            r'^people@',
            r'^staff@',
            r'^admin@',
            r'^info@',
            r'^support@',
            r'^help@',
            r'^contact@',
            r'^hello@',
            r'^office@',
            r'^business@',
            r'^marketing@',
            r'^sales@',
            r'^partners@',
            r'^media@',
            r'^press@',
        ]
        
        local_part = email.split('@')[0].lower()
        for pattern in role_patterns:
            if re.match(pattern, local_part + '@'):
                return True
        return False
    
    def _check_domain(self, domain: str) -> bool:
        """Check if domain has valid DNS records"""
        try:
            socket.gethostbyname(domain)
            return True
        except socket.gaierror:
            return False
    
    def _get_mx_record(self, domain: str) -> Optional[str]:
        """Get MX record for domain"""
        try:
            answers = dns.resolver.resolve(domain, 'MX')
            if answers:
                # Return highest priority MX record
                mx = min(answers, key=lambda x: x.preference)
                return str(mx.exchange).rstrip('.')
        except Exception:
            pass
        
        # Fallback: try A record
        try:
            socket.gethostbyname(domain)
            return domain
        except:
            return None
    
    def _verify_smtp(self, email: str, mx_host: str) -> bool:
        """
        Verify mailbox exists via SMTP
        WARNING: This can be slow and some servers block this
        """
        try:
            server = smtplib.SMTP(timeout=10)
            server.connect(mx_host, 25)
            server.helo(socket.gethostname())
            server.mail('verify@example.com')
            code, message = server.rcpt(email)
            server.quit()
            
            # 250 = success, 550 = mailbox not found
            return code == 250
        except Exception:
            return False
    
    def _verify_with_hunter(self, email: str) -> Optional[dict]:
        """Verify email using Hunter.io API"""
        if not self.hunter_api_key:
            return None
        
        try:
            response = requests.get(
                'https://api.hunter.io/v2/email-verifier',
                params={'email': email, 'api_key': self.hunter_api_key},
                timeout=10
            )
            if response.status_code == 200:
                data = response.json().get('data', {})
                return {
                    'score': data.get('score', 0),
                    'status': data.get('status'),
                    'result': data.get('result')
                }
        except Exception:
            pass
        return None
    
    def batch_validate(self, emails: list) -> dict:
        """Validate multiple emails"""
        results = {}
        for email in emails:
            is_valid, status, details = self.validate(email)
            results[email] = {
                'valid': is_valid,
                'status': status,
                'details': details
            }
        return results
    
    def get_recommendations(self) -> list:
        """Get list of recommendations for improving email quality"""
        return [
            "Use Hunter.io or similar service for better accuracy",
            "Verify MX records before adding emails to database",
            "Avoid role-based emails (careers@, info@) when possible",
            "Check for disposable emails",
            "Use LinkedIn to find specific recruiters",
            "Cross-reference with company websites",
            "Validate emails in batches before campaigns"
        ]


# Common patterns for guessing corporate emails
def guess_corporate_email(first_name: str, last_name: str, domain: str) -> list:
    """
    Generate likely corporate email patterns
    Returns list of possible email addresses
    """
    first = first_name.lower().strip()
    last = last_name.lower().strip()
    f = first[0] if first else ''
    l = last[0] if last else ''
    
    patterns = [
        f"{first}@{domain}",
        f"{last}@{domain}",
        f"{first}.{last}@{domain}",
        f"{first}{last}@{domain}",
        f"{f}{last}@{domain}",
        f"{first}{l}@{domain}",
        f"{f}.{last}@{domain}",
        f"{first}.{l}@{domain}",
        f"{last}.{first}@{domain}",
        f"{f}{l}@{domain}",
    ]
    
    return list(set(patterns))  # Remove duplicates


if __name__ == "__main__":
    # Test validation
    validator = EmailValidator()
    
    test_emails = [
        "mk.knight970@gmail.com",  # Should be valid
        "invalid@nonexistentdomain12345.com",  # Should fail
        "careers@amazon.com",  # Role-based but valid
        "test@tempmail.com",  # Disposable
        "bad-email",  # Invalid syntax
    ]
    
    print("=" * 70)
    print("EMAIL VALIDATION TEST")
    print("=" * 70)
    
    for email in test_emails:
        is_valid, status, details = validator.validate(email)
        print(f"\n{email}")
        print(f"  Valid: {is_valid} ({status})")
        print(f"  Score: {details.get('score', 0)}/100")
