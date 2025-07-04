// src/types/index.ts

export interface QuizQuestion {
  questionText: string;
  options: string[]; // Array of answer options
  correctAnswerIndex: number; // 0-based index of the correct option in the options array
  explanation: string; // MANDATORY: Explanation for the correct answer
}

export interface LessonPage {
  sentences: string[]; // Array of 1 or 2 sentences for this page
  imageDataUri: string | null; // Base64 data URI for the image, or null if generation failed
}

export interface GeneratedLesson {
  lessonTitle: string;
  lessonPages: LessonPage[]; // Each element represents a screen with sentences and an image
  lessonFormat: string; // e.g., "story", "quiz", "activity"
  subject: string; // e.g. "Math", "English", "Science"
  quiz: QuizQuestion[]; 
  kinestheticActivities?: string[]; // Optional array of hands-on activities for kinesthetic learners
  curriculumInfo?: {
    summary: string;
    sourceHints?: string[];
    isPlaceholder?: boolean;
  };
}

export interface LessonAttempt {
  attemptId: string; // Unique ID for this attempt
  lessonTitle: string;
  lessonTopic: string; // The original topic requested
  subject: string; // The AI-determined subject of the lesson
  quizScore: number; // Percentage
  quizTotalQuestions: number;
  questionsAnsweredCorrectly: number;
  timestamp: string; // ISO date string
  choseToRelearn?: boolean; // True if parent chose to restart lesson after a poor quiz
  pointsAwarded?: number;
}

export interface Badge {
  id: string; // e.g., 'first-quiz', 'perfect-score-math'
  name: string; // e.g., "First Quiz Completed", "Math Whiz"
  description: string;
  iconName?: string; // Optional: Lucide icon name
  dateEarned: string; // ISO date string
}

export interface ChildProfile {
  id: string; // UUID
  name: string;
  age: number;
  learningDifficulties: string; // Comma-separated or descriptive text
  screenIssues: string; // e.g., "prefers larger fonts, sensitive to bright colors"
  theme: 'light' | 'dark' | 'system' | 'colorful' | 'simple';
  language: string; // e.g., "en" (English), "es" (Spanish), "fr" (French). Default to 'en'.
  curriculum: string; // e.g., "US Grade 2 Math", "Basic Phonics"
  interests: string; // Comma-separated or descriptive text, e.g., "Dinosaurs, space, drawing"
  avatarSeed?: string; 
  learningStyle?: 'visual' | 'auditory' | 'reading_writing' | 'kinesthetic' | 'balanced_mixed';
  fontSizePreference?: 'small' | 'medium' | 'large'; 
  preferredActivities?: string; // e.g., "Interactive games, Storytelling, Drawing tasks, Building blocks"
  recentMood?: string; // e.g., "happy", "neutral", "sad" - should be part of form, updated before lesson generation
  lessonHistory?: string; // General lesson history notes, updated after attempts
  lessonAttempts?: LessonAttempt[]; 
  savedLessons?: GeneratedLesson[];
  points: number;
  badges: Badge[];
  enableLeaderboard?: boolean; 
  dailyUsageLimitMinutes?: number | null; // Optional daily usage limit in minutes, can be null
  weeklyUsageLimitMinutes?: number | null; // Optional weekly usage limit in minutes, can be null
}

export interface ParentProfile {
  uid: string;
  email: string | null;
  username?: string;
  isSubscribed: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripeSubscriptionStatus?: string; // e.g., 'active', 'trialing', 'past_due', 'canceled'
  pinEnabled?: boolean; // For local PIN protection feature
}

