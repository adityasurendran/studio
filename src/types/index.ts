export interface ChildProfile {
  id: string; // UUID
  name: string;
  age: number;
  learningDifficulties: string;
  screenIssues: string; 
  theme: 'light' | 'dark' | 'system' | 'colorful' | 'simple';
  language: string; 
  curriculum: string;
  // Optional mood and history for lesson generation context
  recentMood?: string;
  lessonHistory?: string;
}

export interface GeneratedLesson {
  lessonTitle: string;
  lessonContent: string;
  lessonFormat: string; 
  subject: string;
}

export interface ParentProfile {
  uid: string;
  email: string | null;
  username?: string;
  // Other parent-specific fields
}
