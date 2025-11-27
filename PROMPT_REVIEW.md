# System Prompt Review & Recommendations

## Your Prompt Analysis

### ✅ **Excellent Elements to Keep:**

1. **Comprehensive Scoring Framework** - The 0-100 breakdown is excellent:
   - MUST-HAVE (60 pts): Core skills, experience, education
   - NICE-TO-HAVE (25 pts): Preferred skills, certifications, industry experience
   - OVERALL FIT (15 pts): Career trajectory, cultural alignment, communication

2. **Fairness Principles** - Strong emphasis on:
   - Skills-based hiring
   - No discrimination
   - Valuing diverse paths
   - Modern hiring realities (remote work, AI-assisted apps)

3. **Special Cases Handling** - Great coverage of:
   - Career changers
   - Recent graduates
   - Senior/executive candidates
   - Overqualified candidates
   - Employment gaps

4. **Red Flags & Quality Indicators** - Clear criteria for:
   - Employment gaps >12 months
   - Job hopping patterns
   - Missing information
   - Quantifiable achievements

### ⚠️ **Issues to Fix:**

1. **N8N Variables in Prompt** ❌
   ```
   {{ $('Edit Fields1').item.json.interview_meeting_link }}
   {{ $('Edit Fields1').item.json.google_calendar_link }}
   ```
   **Fix:** Remove these - they're workflow variables, not AI instructions

2. **Reasoning Length Contradiction** ❌
   - Says "minimum 150 words" 
   - Also says "3-4 sentences maximum"
   - **Fix:** Choose one: **3-4 sentences (50-100 words)** is more practical

3. **Prompt Too Long** ⚠️
   - ~2000+ words may overwhelm the model
   - **Fix:** Split into System Instruction + Analysis Prompt

4. **Over-Prescriptive Scoring** ⚠️
   - Exact point breakdowns (25 pts, 20 pts) may be too rigid
   - **Fix:** Use as guidance, not strict rules

## Recommended Integration Strategy

### Option 1: **Enhanced System Instruction** (Recommended)
Keep your comprehensive framework but structure it better:

**System Instruction** (Reusable, ~500 words):
- Core identity & objectives
- Scoring framework overview
- Fairness principles
- Special cases guidance
- Red flags & quality indicators

**Analysis Prompt** (Job-specific, ~300 words):
- Company context
- Job details
- CV text
- Specific analysis tasks
- Output format

### Option 2: **Hybrid Approach**
Use your detailed framework as the system instruction, but:
- Remove N8N variables
- Fix reasoning length (3-4 sentences)
- Make scoring framework more flexible
- Add dynamic placeholders for job details

## My Recommendation

**Use your comprehensive prompt** but with these modifications:

1. ✅ Remove N8N workflow variables
2. ✅ Fix reasoning to "3-4 sentences (50-100 words)"
3. ✅ Split into System Instruction + Analysis Prompt
4. ✅ Make scoring framework guidance (not strict rules)
5. ✅ Add dynamic placeholders: `{JOB_TITLE}`, `{JOB_DESCRIPTION}`, `{REQUIRED_SKILLS}`, `{COMPANY_NAME}`, `{CV_TEXT}`

This will give you:
- ✅ Comprehensive evaluation framework
- ✅ Fairness and bias mitigation
- ✅ Special cases handling
- ✅ Better model performance (shorter, focused prompts)
- ✅ Consistent, actionable outputs

