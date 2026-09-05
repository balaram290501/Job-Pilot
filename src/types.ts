export type ApplicationStatus =
  | 'saved'
  | 'applied'
  | 'oa'
  | 'interviewing'
  | 'offer'
  | 'rejected'
  | 'ghosted';

export type JobSource = 'linkedin' | 'naukri' | 'other' | string;

export interface UserPreferences {
  targetRoles: string[];
  locations: string[];
  seniority: string;
}

export interface CandidateProfile {
  phone: string;
  noticePeriod: string;
  currentCtc: string;
  expectedCtc: string;
  portfolioUrl: string;
  linkedInUrl: string;
  yearsOfExperience: string;
}

export interface UserDoc {
  uid: string;
  name: string;
  email: string;
  resumeMasterText: string;
  preferences: UserPreferences;
  candidateProfile: CandidateProfile;
  apiToken: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Application {
  id: string;
  userId: string;
  company: string;
  role: string;
  jobDescriptionText: string;
  status: ApplicationStatus;
  appliedDate: string;
  source: JobSource;
  tailoredResumeText: string;
  notes: string;
  lastUpdated: string;
  salaryRange?: string;
  location?: string;
}

export type OutcomeType = 'pass' | 'fail' | 'pending';

export interface InterviewLog {
  id: string;
  applicationId: string;
  userId: string;
  round: string; // e.g., "OA", "Technical 1", "HM round"
  questionsAsked: string;
  outcome: OutcomeType;
  reflection: string;
  date: string;
  createdAt?: string;
}

export interface TailorResumeResponse {
  extractedSkills: string[];
  missingSkills: string[];
  atsScore: number;
  tailoredResumeText: string;
  bulletsComparison: Array<{
    original: string;
    tailored: string;
    reasoning: string;
  }>;
  summary: string;
}

export interface PrepBriefResponse {
  likelyRoundTypes: string[];
  commonTopics: string[];
  keyReviewItems: string[];
  citedSources?: Array<{ title: string; url: string }>;
  personalizedAdvice?: string;
}

export interface RejectionAnalysisResponse {
  patternSummary: string;
  recurringWeaknesses: string[];
  actionableRecommendations: string[];
  hasSufficientData: boolean;
}

export interface ClassifiedEmail {
  id: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  category: 'confirmation' | 'oa_invite' | 'interview_invite' | 'rejection' | 'offer' | 'unrelated';
  companyMatched?: string;
  roleMatched?: string;
  suggestedStatus?: ApplicationStatus;
  matchedApplicationId?: string;
  confidence: number;
}

export type TrackerType = 'DSA' | 'Course' | 'Skills';

export interface TrackerTopic {
  id: string;
  title: string;
  category?: string; // e.g., "Arrays", "Binary Trees", "System Design", "Module 1"
  difficulty?: 'Easy' | 'Medium' | 'Hard' | string;
  completed: boolean;
  completedAt?: string;
  notes?: string;
  resourceLink?: string;
}

export interface LearningTracker {
  id: string;
  userId: string;
  name: string;
  type: TrackerType;
  description?: string;
  dailyGoal: number; // e.g. 2 topics / problems per day
  streak: number; // consecutive active days
  lastCompletedDate?: string; // YYYY-MM-DD
  topics: TrackerTopic[];
  createdAt: string;
  lastUpdated: string;
}

export interface GenerateTrackerResponse {
  name: string;
  type: TrackerType;
  description: string;
  recommendedDailyGoal: number;
  topics: Array<{
    title: string;
    category: string;
    difficulty?: string;
    resourceLink?: string;
  }>;
}

