// src/types/index.ts

export interface QuizQuestion {
  questionText: string;
  options: string[]; // Array of answer options
  correctAnswerIndex: number; // 0-based index of the correct option in the options array
  explanation?: string; // Optional explanation for the correct answer
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
  quiz: QuizQuestion[]; // Added quiz
}

export interface LessonAttempt {
  attemptId: string; // Unique ID for this attempt
  lessonTitle: string;
  lessonTopic: string; // The original topic requested
  quizScore: number; // Percentage
  quizTotalQuestions: number;
  questionsAnsweredCorrectly: number;
  timestamp: string; // ISO date string
  choseToRelearn?: boolean; // True if parent chose to restart lesson after a poor quiz
}

export interface ChildProfile {
  id: string; // UUID
  name: string;
  age: number;
  learningDifficulties: string; // Comma-separated or descriptive text
  screenIssues: string; // e.g., "prefers larger fonts, sensitive to bright colors"
  theme: 'light' | 'dark' | 'system' | 'colorful' | 'simple';
  language: string; // e.g., "en", "es"
  curriculum: string; // e.g., "US Grade 2 Math", "Basic Phonics"
  interests: string; // Comma-separated or descriptive text, e.g., "Dinosaurs, space, drawing"
  avatarSeed?: string; // Optional seed string for generating avatar
  recentMood?: string;
  lessonHistory?: string; // General lesson history notes
  lessonAttempts?: LessonAttempt[]; // Array of specific lesson/quiz attempts
  savedLessons?: GeneratedLesson[]; // Array of all generated lessons
}

export interface ParentProfile {
  uid: string;
  email: string | null;
  username?: string;
  // Other parent-specific fields
}

