"""
Email templates for cold outreach
"""

class EmailTemplates:
    
    @staticmethod
    def cold_outreach(company_name, hr_name, job_title, location=""):
        """Initial cold email template"""
        first_name = hr_name.split()[0] if hr_name else "there"
        
        subject = f"AI Engineer Application - {company_name} | Immediate Joiner"
        
        body = f"""Hi {first_name},

I hope this message finds you well. I came across the {job_title} position at {company_name}{' in ' + location if location else ''} and I'm very excited to apply.

I'm an AI Engineer with 2+ years of hands-on experience building production-grade AI systems:

• Built LLM-powered applications using OpenAI, LangChain, and vector databases (Pinecone, Chroma)
• Deployed AI systems on AWS/GCP with Docker, Kubernetes, and CI/CD pipelines
• Experience with MLOps, model fine-tuning, and RAG (Retrieval Augmented Generation) architectures
• Proficient in Python, TensorFlow, PyTorch, and modern AI frameworks
• Immediate joiner (notice period: 0-15 days)

I believe my experience aligns well with {company_name}'s AI initiatives, and I'd love to discuss how I can contribute to your team.

I've attached my resume for your review. Would you be open to a quick conversation this week?

Best regards,
[YOUR_NAME]
[YOUR_PHONE] | [YOUR_LINKEDIN_URL]
[YOUR_PORTFOLIO_URL]

---
If you'd prefer not to receive emails from me, please reply with "unsubscribe" and I'll remove you from my list.
"""
        return subject, body
    
    @staticmethod
    def followup_1(company_name, hr_name, job_title):
        """First follow-up (3 days)"""
        first_name = hr_name.split()[0] if hr_name else "there"
        
        subject = f"Re: AI Engineer Application - {company_name} - Following Up"
        
        body = f"""Hi {first_name},

I hope you're doing well. I wanted to follow up on my application for the {job_title} role at {company_name} that I sent a few days ago.

I'm still very interested in the opportunity and would love to learn more about the position and how I can contribute to your AI initiatives.

Is there any update on the hiring process, or would you like any additional information from my side?

Looking forward to hearing from you.

Best regards,
[YOUR_NAME]
[YOUR_PHONE] | [YOUR_LINKEDIN_URL]
"""
        return subject, body
    
    @staticmethod
    def followup_2(company_name, hr_name, job_title):
        """Second follow-up (7 days)"""
        first_name = hr_name.split()[0] if hr_name else "there"
        
        subject = f"Re: AI Engineer Role at {company_name} - Quick Check-in"
        
        body = f"""Hi {first_name},

I wanted to reach out one more time regarding the {job_title} position at {company_name}.

I understand you're likely busy with many applications, but I wanted to reiterate my strong interest in joining your team. My experience with LLMs, MLOps, and production AI deployments could be a great fit for your current needs.

If the position is still open, I'd appreciate the opportunity to discuss further. If not, I'd be grateful if you could keep me in mind for future opportunities.

Thank you for your time.

Best regards,
[YOUR_NAME]
[YOUR_PHONE] | [YOUR_LINKEDIN_URL]
"""
        return subject, body
    
    @staticmethod
    def followup_final(company_name, hr_name, job_title):
        """Final follow-up (14 days)"""
        first_name = hr_name.split()[0] if hr_name else "there"
        
        subject = f"Re: {job_title} at {company_name} - Closing the Loop"
        
        body = f"""Hi {first_name},

I hope this email finds you well. This is my final follow-up regarding the {job_title} position at {company_name}.

I wanted to express my continued interest in {company_name} and request that you keep my profile on file for future AI/ML opportunities. I'm passionate about building innovative AI solutions and would welcome the chance to contribute to your team down the line.

If you'd like to connect on LinkedIn for future opportunities, here's my profile: [YOUR_LINKEDIN_URL]

Thank you for your time and consideration.

Best regards,
[YOUR_NAME]
[YOUR_PHONE] | [YOUR_LINKEDIN_URL]
"""
        return subject, body
    
    @staticmethod
    def get_template_for_status(status, company_name, hr_name, job_title):
        """Get appropriate template based on status"""
        from config import Status
        
        if status == Status.NEW:
            return EmailTemplates.cold_outreach(company_name, hr_name, job_title)
        elif status == Status.EMAILED:
            return EmailTemplates.followup_1(company_name, hr_name, job_title)
        elif status == Status.FOLLOWUP1:
            return EmailTemplates.followup_2(company_name, hr_name, job_title)
        elif status == Status.FOLLOWUP2:
            return EmailTemplates.followup_final(company_name, hr_name, job_title)
        else:
            return None, None
    
    @staticmethod
    def get_next_status(current_status):
        """Get next status in the sequence"""
        from config import Status
        
        status_flow = {
            Status.NEW: Status.EMAILED,
            Status.EMAILED: Status.FOLLOWUP1,
            Status.FOLLOWUP1: Status.FOLLOWUP2,
            Status.FOLLOWUP2: Status.FOLLOWUP3,
            Status.FOLLOWUP3: Status.CLOSED
        }
        
        return status_flow.get(current_status, current_status)
