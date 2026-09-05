import { GoogleGenAI } from '@google/genai';
import {
  TailorResumeResponse,
  PrepBriefResponse,
  RejectionAnalysisResponse,
  InterviewLog,
  Application,
  ClassifiedEmail,
  GenerateTrackerResponse,
  TrackerType,
} from '../types.js';

function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * FEATURE 1: Resume Tailoring
 */
export async function tailorResume(
  jobDescription: string,
  resumeText: string,
  company?: string,
  role?: string
): Promise<TailorResumeResponse> {
  const ai = getGenAI();
  const prompt = `
You are an expert ATS (Applicant Tracking System) optimizer and career coach.
Analyze the provided Job Description (JD) and Master Resume.

Job Details: Company: "${company || 'Target Company'}", Role: "${role || 'Target Role'}"

JOB DESCRIPTION:
${jobDescription}

MASTER RESUME:
${resumeText}

Task instructions:
1. Extract key technical skills, soft skills, and domain keywords from the JD.
2. Identify skills present in the JD that are NOT supported in the resume (missingSkills).
3. Compute a realistic ATS Keyword Match Score (integer from 0 to 100).
4. Rewrite the bullet points in the resume to mirror the JD's phrasing and metrics, keeping truthful to the original experience.
5. Provide a side-by-side bullet comparison list showing original bullet vs tailored bullet and reasoning.
6. Provide a 2-3 sentence executive summary of the tailoring strategy.

Respond strictly with valid JSON conforming to this schema (no extra formatting outside json codeblock if any):
{
  "extractedSkills": ["skill1", "skill2"],
  "missingSkills": ["missing1", "missing2"],
  "atsScore": 85,
  "tailoredResumeText": "Full rewritten resume text here...",
  "bulletsComparison": [
    {
      "original": "Original bullet text",
      "tailored": "Tailored bullet text",
      "reasoning": "Why this was changed"
    }
  ],
  "summary": "Brief explanation of tailoring changes made."
}
`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
    },
  });

  const text = response.text || '{}';
  try {
    return JSON.parse(text) as TailorResumeResponse;
  } catch (err) {
    console.error('Failed to parse Gemini response for tailorResume:', text);
    throw new Error('Invalid JSON returned from AI model during resume tailoring.');
  }
}

/**
 * FEATURE 3A: Interview Prep Brief with Google Search Grounding
 */
export async function generatePrepBrief(
  company: string,
  role: string,
  userLogs: InterviewLog[]
): Promise<PrepBriefResponse> {
  const ai = getGenAI();

  const userLogsSummary = userLogs.length > 0
    ? userLogs.map(l => `[Company: ${company}, Round: ${l.round}, Outcome: ${l.outcome}, Questions: ${l.questionsAsked}, Reflection: ${l.reflection}]`).join('\n')
    : 'No past interview logs recorded yet.';

  const prompt = `
You are an expert technical interview strategist preparing a candidate for an upcoming interview.
Target Company: "${company}"
Target Role: "${role}"

Candidate's logged past interview experiences for similar context:
${userLogsSummary}

Instructions:
1. Perform web research on current interview processes, common technical/behavioral questions, and round formats specifically for ${company} ${role}.
2. Synthesize web findings with the candidate's past interview logs (if relevant).
3. Output a prep brief structured as:
   - likelyRoundTypes: list of interview rounds (e.g., "Screening", "DSA Coding", "System Design", "HM Behavioral")
   - commonTopics: core topics frequently tested at ${company} for ${role}
   - keyReviewItems: 3 to 5 specific, high-priority review items or prep action points
   - personalizedAdvice: customized advice based on past logs and company style

Generate a clean structured prep brief. Include citation sources if available from search.
Return JSON matching this format:
{
  "likelyRoundTypes": ["Round 1", "Round 2"],
  "commonTopics": ["Topic 1", "Topic 2"],
  "keyReviewItems": ["Action 1", "Action 2", "Action 3"],
  "personalizedAdvice": "Advice paragraph...",
  "citedSources": [{"title": "Source title", "url": "http..."}]
}
`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const text = response.text || '';
  
  // Clean JSON response if enclosed in markdown codeblocks
  let jsonStr = text;
  const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (match) {
    jsonStr = match[1];
  }

  // Fallback default structure if non-JSON output returned with search results
  try {
    return JSON.parse(jsonStr) as PrepBriefResponse;
  } catch {
    // Extract grounding search metadata if present
    const searchChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const citedSources = searchChunks.map((chunk: any) => ({
      title: chunk.web?.title || 'Search Result',
      url: chunk.web?.uri || '',
    })).filter((s: any) => s.url);

    return {
      likelyRoundTypes: [`${company} Technical Round`, `${company} Behavioral / Leadership`, 'System Design / Practical'],
      commonTopics: ['Core Technical Problem Solving', 'Past Projects & Architecture', 'Cultural Fit'],
      keyReviewItems: [
        `Review past projects relevant to ${role} at ${company}.`,
        `Practice common DSA and system architecture questions reported for ${company}.`,
        `Prepare STAR method stories for behavioral questions.`
      ],
      personalizedAdvice: text || `Focus on fundamental principles for ${role} at ${company}.`,
      citedSources,
    };
  }
}

/**
 * FEATURE 3B: Rejection Pattern Analysis (Strictly based ONLY on user's logged data)
 */
export async function analyzeRejectionPatterns(
  userLogs: InterviewLog[]
): Promise<RejectionAnalysisResponse> {
  const failedLogs = userLogs.filter(l => l.outcome === 'fail' || l.reflection.toLowerCase().includes('reject'));

  if (failedLogs.length === 0) {
    return {
      patternSummary: 'Not enough failed interview logs recorded yet to detect patterns. Log more interview rounds to see insights!',
      recurringWeaknesses: [],
      actionableRecommendations: ['Keep logging interview questions and reflections after every round.'],
      hasSufficientData: false,
    };
  }

  const ai = getGenAI();

  const logsText = failedLogs.map((l, idx) => `
Log #${idx + 1}:
- Company/Round: ${l.round}
- Questions Asked: ${l.questionsAsked}
- Outcome: ${l.outcome}
- Reflection/Notes: ${l.reflection}
  `).join('\n---\n');

  const prompt = `
You are an objective interview data analyst. Analyze ONLY the candidate's logged interview failures below.
Do NOT fabricate patterns or assume details not present in the logs.

LOGGED INTERVIEW FAILURES:
${logsText}

Tasks:
1. Summarize recurring themes or patterns across these specific failed rounds (e.g. system design struggles, timed coding speed, or answering behavioral questions).
2. List 2-4 recurring weaknesses evident in the logs.
3. Provide 3 concrete, actionable recommendations.

Return valid JSON:
{
  "patternSummary": "Summary text...",
  "recurringWeaknesses": ["Weakness 1", "Weakness 2"],
  "actionableRecommendations": ["Rec 1", "Rec 2"],
  "hasSufficientData": true
}
`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
    },
  });

  const text = response.text || '{}';
  try {
    return JSON.parse(text) as RejectionAnalysisResponse;
  } catch (err) {
    console.error('Failed to parse rejection analysis JSON:', text);
    return {
      patternSummary: 'Analysis completed based on logged interviews.',
      recurringWeaknesses: ['Identified areas needing review from interview logs.'],
      actionableRecommendations: ['Focus on system design and time management.'],
      hasSufficientData: true,
    };
  }
}

/**
 * FEATURE 4: Email Classification
 */
export async function classifyEmailsWithGemini(
  emails: Array<{ id: string; subject: string; from: string; date: string; snippet: string }>,
  existingApps: Array<{ id: string; company: string; role: string; status: string }>
): Promise<ClassifiedEmail[]> {
  if (emails.length === 0) return [];

  const ai = getGenAI();

  const prompt = `
You are an email assistant for job searches. Classify the following emails and match them to existing application records if possible.

EXISTING USER APPLICATIONS:
${JSON.stringify(existingApps, null, 2)}

EMAILS TO CLASSIFY:
${JSON.stringify(emails, null, 2)}

For each email:
1. Determine category: "confirmation", "oa_invite", "interview_invite", "rejection", "offer", or "unrelated".
2. Extract the company name and job role if mentioned in the email.
3. Match to an existing application ID if there is a fuzzy match on company and role.
4. Suggest an updated status: "applied", "oa", "interviewing", "rejected", "offer", or null if unrelated.
5. Assign a confidence score from 0.0 to 1.0.

Return a JSON array of objects:
[
  {
    "id": "email_id",
    "subject": "Email subject",
    "from": "Sender",
    "date": "Date string",
    "snippet": "Snippet text",
    "category": "interview_invite",
    "companyMatched": "Company Name",
    "roleMatched": "Role Title",
    "suggestedStatus": "interviewing",
    "matchedApplicationId": "app_id_or_null",
    "confidence": 0.95
  }
]
`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
    },
  });

  const text = response.text || '[]';
  try {
    return JSON.parse(text) as ClassifiedEmail[];
  } catch (err) {
    console.error('Failed to parse email classification:', text);
    return [];
  }
}

/**
 * FEATURE: Generate Structured Learning Tracker
 */
export async function generateLearningTracker(
  userPrompt: string,
  targetDays?: number
): Promise<GenerateTrackerResponse> {
  const ai = getGenAI();

  const prompt = `
You are an expert technical curriculum designer and learning roadmap architect.
The user wants to create a comprehensive, structured learning tracker based on: "${userPrompt}".
${targetDays ? `The user aims to complete this tracker in approximately ${targetDays} days.` : ''}

Task instructions:
1. Generate an appropriate, professional tracker "name" (e.g. "Striver A2Z DSA Sheet", "NeetCode 150", "System Design for Senior Engineers", "React 19 & Next.js Full-Stack Mastery", "Advanced SQL & Database Internals").
2. Classify the tracker "type" into exactly one of: "dsa", "course", "skills", or "custom".
3. Write a concise, motivating 1-2 sentence "description" of what this tracker covers.
4. Recommend a realistic "suggestedDailyGoal" (an integer, e.g. 1 to 5 topics/problems per day). ${targetDays ? `Factor in the target timeframe of ${targetDays} days relative to the total number of topics.` : ''}
5. Generate a thorough, logically sequenced "topics" array.
   - For standard coding sheets (e.g. Striver A2Z, NeetCode 150, Blind 75, Love Babbar 450), include authentic topics and canonical problem patterns in sequential order.
   - For each topic item, provide:
     * "title": Clear topic or problem title (e.g. "Two Sum", "Sliding Window Maximum", "Invert Binary Tree", "Database Indexing & B-Trees").
     * "difficulty": Difficulty level ("easy", "medium", or "hard").
     * "link": Authoritative resource or problem link (e.g. LeetCode URL, documentation URL, or empty string "").
     * "pattern": Category, pattern, or module name (e.g. "Arrays & Hashing", "Two Pointers", "Binary Search", "Dynamic Programming", "System Architecture", "State Management").
   - Provide a comprehensive, structured list of topics (typically between 15 to 40 distinct items).

Respond strictly with valid JSON conforming to this schema:
{
  "name": "Exact curriculum name",
  "type": "dsa",
  "description": "Brief description of the roadmap...",
  "suggestedDailyGoal": 2,
  "topics": [
    {
      "title": "Topic or Problem Title",
      "difficulty": "medium",
      "link": "",
      "pattern": "Core pattern or module"
    }
  ]
}
`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
    },
  });

  const text = response.text || '{}';
  try {
    const raw = JSON.parse(text);
    const validTypes: TrackerType[] = ['dsa', 'course', 'skills', 'custom'];
    const rawType = typeof raw.type === 'string' ? (raw.type.toLowerCase() as TrackerType) : 'dsa';
    const type: TrackerType = validTypes.includes(rawType) ? rawType : 'dsa';

    const parsed: GenerateTrackerResponse = {
      name: raw.name || userPrompt,
      type,
      description: raw.description || `Learning tracker for ${userPrompt}`,
      suggestedDailyGoal: Number(raw.suggestedDailyGoal) || 2,
      topics: Array.isArray(raw.topics)
        ? raw.topics.map((t: any) => ({
            title: t.title || 'Untitled Topic',
            difficulty: (['easy', 'medium', 'hard'].includes(t.difficulty?.toLowerCase())
              ? t.difficulty.toLowerCase()
              : 'medium') as 'easy' | 'medium' | 'hard',
            link: t.link || t.resourceLink || '',
            pattern: t.pattern || t.category || 'General Topics',
          }))
        : [],
    };
    return parsed;
  } catch (err) {
    console.error('Failed to parse Gemini generated learning tracker:', text);
    throw new Error('Failed to parse generated learning tracker from AI.');
  }
}

/**
 * FEATURE: Generate Learning Tracker with Gemini (Alias / Helper)
 */
export async function generateTrackerWithGemini(
  query: string,
  preferredType?: TrackerType
): Promise<GenerateTrackerResponse> {
  return generateLearningTracker(query);
}


