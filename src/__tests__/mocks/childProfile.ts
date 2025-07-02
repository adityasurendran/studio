import type { ChildProfile } from '@/types';

export function createMockChildProfile(overrides: Partial<ChildProfile> = {}): ChildProfile {
  return {
    id: 'test-child',
    name: 'Test Child',
    age: 10,
    learningDifficulties: 'None',
    screenIssues: 'None',
    theme: 'light',
    language: 'en',
    curriculum: 'Sample Curriculum',
    interests: 'Science, Math',
    points: 100,
    badges: [],
    lessonAttempts: [],
    ...overrides,
  };
} 