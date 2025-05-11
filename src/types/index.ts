// src/types/index.ts

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
  // Optional mood and history for lesson generation context
  recentMood?: string;
  lessonHistory?: string;
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
}

export interface ParentProfile {
  uid: string;
  email: string | null;
  username?: string;
  // Other parent-specific fields
}
