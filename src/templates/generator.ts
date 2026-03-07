interface Contact {
  name: string;
  email: string;
  company: string;
  role: string;
  jobTitle?: string;
  jobRequirements?: string;
}

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  linkedin: string;
  skills: string[];
  experience: string;
  highlights: string[];
}

export function generateEmail(
  contact: Contact,
  user: UserProfile,
  isFollowUp: boolean = false,
  followUpNumber: number = 0
): { subject: string; body: string } {
  // Match user skills with job requirements
  const matchedSkills = matchSkills(contact.jobRequirements || '', user.skills);
  
  if (isFollowUp) {
    return generateFollowUp(contact, user, followUpNumber, matchedSkills);
  }
  
  return generateInitialEmail(contact, user, matchedSkills);
}

function matchSkills(jobRequirements: string, userSkills: string[]): string[] {
  const requirements = jobRequirements.toLowerCase();
  return userSkills.filter(skill => 
    requirements.includes(skill.toLowerCase()) ||
    requirements.includes(skill.toLowerCase().replace('/', ' '))
  );
}

function generateInitialEmail(contact: Contact, user: UserProfile, matchedSkills: string[]): { subject: string; body: string } {
  const firstName = contact.name.split(' ')[0];
  const role = contact.jobTitle || 'AI Engineer';
  
  const subject = `Application for ${role} position - ${user.name}`;
  
  const skillsText = matchedSkills.length > 0 
    ? `My expertise in ${matchedSkills.slice(0, 3).join(', ')} aligns perfectly with your requirements.`
    : 'My background in AI/ML engineering and multi-agent systems makes me a strong fit for this role.';

  const body = `Dear ${firstName},

I hope this email finds you well. I'm writing to express my strong interest in the ${role} position at ${contact.company}.

${skillsText}

Here are some highlights from my experience:
${user.highlights.slice(0, 3).map(h => `• ${h}`).join('\n')}

With ${user.experience} of experience building AI-powered systems and managing complex multi-agent architectures, I'm excited about the opportunity to contribute to ${contact.company}'s innovative projects.

I've attached my resume for your review. I would welcome the opportunity to discuss how my skills and experience align with your team's needs.

Thank you for your time and consideration. I look forward to hearing from you.

Best regards,
${user.name}
${user.phone}
${user.linkedin}
${user.email}`;

  return { subject, body };
}

function generateFollowUp(contact: Contact, user: UserProfile, number: number, matchedSkills: string[]): { subject: string; body: string } {
  const firstName = contact.name.split(' ')[0];
  const role = contact.jobTitle || 'the position';
  
  switch (number) {
    case 1: // 3-day follow-up
      return {
        subject: `Following up: ${role} Application`,
        body: `Dear ${firstName},

I hope you're having a great week. I wanted to follow up on my application for the ${role} at ${contact.company} that I submitted a few days ago.

I'm still very excited about the opportunity and wanted to reiterate my enthusiasm for joining your team. ${matchedSkills.length > 0 ? `My experience with ${matchedSkills[0]} would be particularly valuable for your current initiatives.` : ''}

If you need any additional information from me, please don't hesitate to ask.

Best regards,
${user.name}
${user.email}`
      };
      
    case 2: // 7-day follow-up
      return {
        subject: `Quick follow-up: ${role} at ${contact.company}`,
        body: `Hi ${firstName},

I hope this message finds you well. I wanted to reach out again regarding the ${role} position.

I understand you likely have many applications to review. I wanted to share a quick update - I've recently completed work on an autonomous multi-agent system that orchestrates 134 AI agents across 60 repositories, which I believe demonstrates the kind of scalable AI architecture that would benefit ${contact.company}.

I'd love to discuss how I could bring similar innovation to your team.

Best,
${user.name}
${user.email}
${user.linkedin}`
      };
      
    case 3: // 14-day breakup email
      return {
        subject: `Thank you for considering my application`,
        body: `Hi ${firstName},

I wanted to reach out one final time regarding the ${role} position at ${contact.company}.

I completely understand if the timing isn't right or if you've moved forward with other candidates. I remain very interested in ${contact.company} and would welcome the opportunity to connect in the future if new roles open up.

Thank you for your time throughout this process. I wish you and the team continued success.

Best regards,
${user.name}
${user.email}
${user.linkedin}`
      };
      
    default:
      return generateInitialEmail(contact, user, matchedSkills);
  }
}

// Template for specific company types
export function generateCustomTemplate(
  contact: Contact,
  user: UserProfile,
  companyType: 'startup' | 'enterprise' | 'product' | 'consulting'
): { subject: string; body: string } {
  const firstName = contact.name.split(' ')[0];
  const role = contact.jobTitle || 'AI Engineer';
  
  const customizations: Record<typeof companyType, { angle: string; valueProp: string }> = {
    startup: {
      angle: 'early-stage growth',
      valueProp: 'wear multiple hats and build from the ground up'
    },
    enterprise: {
      angle: 'scale and reliability',
      valueProp: 'architect systems that serve millions of users'
    },
    product: {
      angle: 'user-centric innovation',
      valueProp: 'create AI features that users love'
    },
    consulting: {
      angle: 'diverse challenges',
      valueProp: 'solve complex problems across industries'
    }
  };
  
  const { angle, valueProp } = customizations[companyType];
  
  const subject = `${role} Application - ${user.name} | ${angle} focused`;
  
  const body = `Dear ${firstName},

I'm reaching out about the ${role} position at ${contact.company}. Your company's focus on ${angle} resonates strongly with my experience.

Throughout my ${user.experience} career, I've had the opportunity to ${valueProp}:

${user.highlights.map(h => `• ${h}`).join('\n')}

I'm particularly drawn to ${contact.company} because of your reputation for technical excellence and innovation in the AI space.

I'd love to explore how my background in building autonomous AI systems could contribute to your team's goals.

Best regards,
${user.name}
${user.email}
${user.linkedin}`;

  return { subject, body };
}
