export interface ComplianceTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  formData: {
    courseTitle: string;
    courseDescription: string;
    industry: string;
    targetAudience: string;
    difficultyLevel: string;
    numModules: string;
    lessonsPerModule: string;
    additionalInstructions: string;
  };
}

export const UK_COMPLIANCE_TEMPLATES: ComplianceTemplate[] = [
  {
    id: "gdpr",
    name: "GDPR Data Protection",
    description:
      "UK GDPR and Data Protection Act 2018 compliance training. Covers lawful bases for processing, data subject rights, breach notification, and ICO guidance.",
    icon: "Shield",
    category: "Data Protection",
    formData: {
      courseTitle: "GDPR Data Protection Training",
      courseDescription:
        "Comprehensive training on UK GDPR and the Data Protection Act 2018. This course covers the principles of data protection, lawful bases for processing personal data, individual rights, data breach procedures, and practical compliance scenarios for UK businesses.",
      industry: "Legal",
      targetAudience: "All employees who handle, process, or have access to personal data",
      difficultyLevel: "beginner",
      numModules: "4",
      lessonsPerModule: "3",
      additionalInstructions:
        "Focus on UK GDPR specifics (not EU GDPR). Include ICO guidance references, the seven data protection principles, six lawful bases for processing, data subject rights (access, rectification, erasure, portability), breach notification procedures (72-hour rule), DPO requirements, and practical workplace scenarios. Include real-world examples of ICO enforcement actions.",
    },
  },
  {
    id: "health-safety",
    name: "Health & Safety",
    description:
      "Health and Safety at Work Act 1974 essentials. Covers employer duties, risk assessments, incident reporting, and HSE compliance.",
    icon: "HardHat",
    category: "Workplace Safety",
    formData: {
      courseTitle: "Health & Safety at Work Training",
      courseDescription:
        "Essential health and safety training covering the Health and Safety at Work Act 1974 and associated regulations. Learn about employer and employee duties, risk assessments, accident reporting, and maintaining a safe working environment.",
      industry: "Manufacturing",
      targetAudience: "All employees, team leaders, and managers",
      difficultyLevel: "beginner",
      numModules: "4",
      lessonsPerModule: "3",
      additionalInstructions:
        "Cover the Health and Safety at Work Act 1974, Management of Health and Safety at Work Regulations 1999, RIDDOR reporting, COSHH regulations, DSE assessments, manual handling, fire safety basics, first aid requirements, and risk assessment methodology. Include the role of HSE (Health and Safety Executive). Use practical UK workplace scenarios.",
    },
  },
  {
    id: "edi",
    name: "Equality, Diversity & Inclusion",
    description:
      "Equality Act 2010 training. Covers protected characteristics, unconscious bias, inclusive practices, and discrimination prevention.",
    icon: "Users",
    category: "Workplace Culture",
    formData: {
      courseTitle: "Equality, Diversity & Inclusion Training",
      courseDescription:
        "Training on the Equality Act 2010 and creating an inclusive workplace. Covers the nine protected characteristics, types of discrimination, reasonable adjustments, unconscious bias, and best practices for building diverse and inclusive teams.",
      industry: "Education",
      targetAudience: "All employees, hiring managers, and team leaders",
      difficultyLevel: "beginner",
      numModules: "4",
      lessonsPerModule: "3",
      additionalInstructions:
        "Cover all nine protected characteristics under the Equality Act 2010 (age, disability, gender reassignment, marriage/civil partnership, pregnancy/maternity, race, religion/belief, sex, sexual orientation). Include direct and indirect discrimination, harassment, victimisation, reasonable adjustments for disability, equal pay, unconscious bias awareness, inclusive language, and microaggressions. Use UK-specific case studies and tribunal examples.",
    },
  },
  {
    id: "anti-bribery",
    name: "Anti-Bribery & Corruption",
    description:
      "UK Bribery Act 2010 training. Covers bribery offences, facilitation payments, gifts and hospitality policies, and corporate liability.",
    icon: "Scale",
    category: "Legal Compliance",
    formData: {
      courseTitle: "Anti-Bribery & Corruption Training",
      courseDescription:
        "Training on the UK Bribery Act 2010 and anti-corruption compliance. Covers the four bribery offences, adequate procedures defence, gifts and hospitality policies, facilitation payments, and reporting concerns.",
      industry: "Finance",
      targetAudience: "All employees, especially those in client-facing, procurement, and finance roles",
      difficultyLevel: "intermediate",
      numModules: "3",
      lessonsPerModule: "3",
      additionalInstructions:
        "Cover the four offences under the UK Bribery Act 2010 (bribing another person, being bribed, bribing a foreign public official, failure of commercial organisation to prevent bribery). Include the six adequate procedures principles, gifts and hospitality thresholds, facilitation payments, red flags for bribery, whistleblowing procedures, and the role of the Serious Fraud Office (SFO). Use real UK prosecution examples.",
    },
  },
  {
    id: "fire-safety",
    name: "Fire Safety",
    description:
      "Regulatory Reform (Fire Safety) Order 2005 training. Covers fire risk assessment, evacuation procedures, fire prevention, and responsible person duties.",
    icon: "Flame",
    category: "Workplace Safety",
    formData: {
      courseTitle: "Fire Safety Awareness Training",
      courseDescription:
        "Fire safety training covering the Regulatory Reform (Fire Safety) Order 2005. Learn about fire risk assessments, evacuation procedures, fire prevention measures, use of firefighting equipment, and the duties of the responsible person.",
      industry: "Retail",
      targetAudience: "All employees, fire wardens, and building managers",
      difficultyLevel: "beginner",
      numModules: "3",
      lessonsPerModule: "3",
      additionalInstructions:
        "Cover the Regulatory Reform (Fire Safety) Order 2005, the fire triangle, classes of fire, types of fire extinguishers and their uses, fire risk assessment process (5 steps), evacuation procedures and assembly points, fire warden duties, the responsible person role, fire door regulations, emergency lighting, fire alarm testing, and personal emergency evacuation plans (PEEPs). Include practical scenarios.",
    },
  },
  {
    id: "modern-slavery",
    name: "Modern Slavery Awareness",
    description:
      "Modern Slavery Act 2015 training. Covers recognising signs of modern slavery, reporting obligations, supply chain due diligence, and transparency statements.",
    icon: "Eye",
    category: "Legal Compliance",
    formData: {
      courseTitle: "Modern Slavery Awareness Training",
      courseDescription:
        "Training on the Modern Slavery Act 2015 and identifying and preventing modern slavery in your organisation and supply chain. Covers types of exploitation, recognising warning signs, reporting procedures, and supply chain due diligence.",
      industry: "Retail",
      targetAudience: "All employees, procurement teams, HR managers, and supply chain managers",
      difficultyLevel: "beginner",
      numModules: "3",
      lessonsPerModule: "3",
      additionalInstructions:
        "Cover the Modern Slavery Act 2015, types of modern slavery (forced labour, human trafficking, debt bondage, child labour), warning signs and indicators, the National Referral Mechanism (NRM), Section 54 transparency statements, supply chain due diligence requirements, reporting to the Modern Slavery Helpline, employer responsibilities, and industry-specific risks. Use UK statistics and case studies.",
    },
  },
];
