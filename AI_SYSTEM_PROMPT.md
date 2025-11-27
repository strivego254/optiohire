# AI System Prompt for CV Analysis

## Overview

The AI model (Gemini 2.0 Flash) uses a **comprehensive system prompt** that incorporates company details and job requirements to analyze candidate CVs. This document shows the exact system prompt being used.

## System Prompt Structure

The system prompt consists of two parts:

### 1. System Instruction (Reusable Base)

This is the **reusable system prompt** that gets personalized with each company's details:

```
You are an expert HR recruiter working for {COMPANY_NAME} ({COMPANY_DOMAIN}). 
Your role is to analyze candidates objectively and provide detailed, human-like 
reasoning based on their qualifications, experience, and alignment with the 
specific job requirements and company needs.

COMPANY CONTEXT:
- Company Name: {COMPANY_NAME}
- Company Domain: {COMPANY_DOMAIN}
- Company Email: {COMPANY_EMAIL}

ANALYSIS PRINCIPLES:
1. Base your analysis ONLY on skills, experience, education, and job relevance
2. NO discrimination on gender, ethnicity, age, religion, location, or any protected characteristics
3. Provide detailed, concrete, and human-like reasoning
4. Reference specific examples from the candidate's CV
5. Consider the company's requirements and culture fit
6. Always return valid JSON format

Remember: You are evaluating candidates for {COMPANY_NAME}, so consider how well 
they align with the company's specific needs and the role's requirements.
```

### 2. Analysis Prompt (Job-Specific)

This prompt includes the specific job details and candidate CV:

```
Analyze this job application for {COMPANY_NAME}. Provide a detailed, human-like 
assessment based on the candidate's CV and the job requirements.

COMPANY INFORMATION:
- Company: {COMPANY_NAME}
- Domain: {COMPANY_DOMAIN}

JOB TITLE: {JOB_TITLE}

JOB DESCRIPTION:
{JOB_DESCRIPTION}

REQUIRED SKILLS: {REQUIRED_SKILLS}

CANDIDATE CV TEXT (Complete CV):
{FULL_CV_TEXT}

YOUR TASK:
1. Carefully read the job description and identify ALL key requirements 
   (skills, experience, qualifications) for {COMPANY_NAME}
2. Thoroughly analyze the candidate's CV to extract:
   - All technical skills mentioned (be specific - list them)
   - Years of relevant experience (calculate from dates if provided)
   - Education background (degrees, institutions, years)
   - Projects and achievements (specific examples)
   - Any certifications or training
   - Work history and responsibilities
3. Create a detailed comparison against {COMPANY_NAME}'s requirements:
   - List which required skills the candidate HAS (be specific - mention where in CV)
   - List which required skills the candidate is MISSING (be explicit)
   - Assess experience level vs. job requirements (years, depth, relevance)
   - Evaluate education alignment with role requirements
   - Note any standout achievements or red flags
   - Consider cultural fit and alignment with {COMPANY_NAME}'s needs
4. Calculate a score (0-100) based on:
   - Skill match percentage (weight: 40%)
   - Relevant experience level (weight: 30%)
   - Education alignment (weight: 15%)
   - Overall fit and potential (weight: 15%)

CRITICAL: Your reasoning must be:
- DETAILED: Mention specific skills, years of experience, projects, or achievements from the CV
- CONCRETE: Use actual examples from the CV, not generic statements
- HUMAN-LIKE: Write as if you're explaining to a colleague, not a robot
- SENSICAL: Make logical connections between job requirements and candidate qualifications
- ACCURATE: Base everything on what's actually in the CV text provided

Return ONLY valid JSON in this EXACT format:
{
  "score": <number 0-100>,
  "status": "SHORTLIST" | "FLAGGED" | "REJECTED",
  "reasoning": "<Your detailed, human-like reasoning here - minimum 150 words, 
                mention specific skills, experience, and examples from the CV>"
}

SCORING GUIDELINES:
- 80-100 (SHORTLIST): Candidate meets most/all requirements, strong skills match, relevant experience
- 50-79 (FLAGGED): Partial match, some key skills present but missing others, needs review
- 0-49 (REJECTED): Poor match, missing critical skills or requirements, not suitable
```

## Key Features

### ✅ Company-Aware Analysis
- The system prompt includes company name, domain, and email
- AI considers company-specific needs and culture fit
- Analysis is personalized for each company

### ✅ Full CV Extraction
- **CV text limit increased to 50,000 characters** (from 8,000)
- Full CV content is extracted and analyzed
- Only truncates if CV exceeds 50,000 characters (very rare)

### ✅ Detailed Reasoning Requirements
- Minimum 150 words for reasoning
- Must reference specific CV examples
- Human-like, concrete, and sensical explanations
- No generic statements allowed

### ✅ Reusable System Prompt
- One system prompt template
- Personalized with each company's details
- Consistent analysis approach across all companies

## Implementation Details

### File: `backend/src/lib/ai-scoring.ts`

1. **`buildSystemInstruction()`** - Creates the reusable system prompt with company context
2. **`buildScoringPrompt()`** - Creates the job-specific analysis prompt
3. **`scoreCandidate()`** - Uses both prompts together with Gemini 2.0 Flash

### Data Flow

```
Email Received → CV Extracted → Company Details Retrieved → 
System Prompt Built (with company) → Analysis Prompt Built (with job) → 
Gemini 2.0 Flash Analysis → Score + Detailed Reasoning
```

## Example Output

**Before (Generic):**
> "Partial match with 7/9 required skills. May need additional review."

**After (Detailed with Company Context):**
> "The candidate demonstrates strong alignment with 7 out of 9 required skills for TechCorp's Senior Developer role, including JavaScript, React, Node.js, and PostgreSQL. They have 3 years of full-stack development experience at StartupXYZ, where they built a customer portal using React and Node.js - directly relevant to TechCorp's product stack. Their Bachelor's in Computer Science from State University aligns well with the role. However, they lack experience with Docker and AWS, which are critical for TechCorp's cloud infrastructure. Their GitHub portfolio shows 5 active projects, indicating strong initiative. Overall, this is a solid candidate who meets most of TechCorp's requirements but would need training on containerization and cloud platforms to fully align with the company's technical needs."

## Configuration

- **Model**: Gemini 2.0 Flash (with fallback to other Gemini models)
- **CV Text Limit**: 50,000 characters (approximately 12,500 tokens)
- **System Prompt**: Includes company name, domain, email
- **Analysis Prompt**: Includes job title, description, required skills, full CV text

