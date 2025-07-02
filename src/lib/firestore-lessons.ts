import { db } from './firebase-firestore';
import { collection, query, onSnapshot, addDoc, orderBy, limit } from 'firebase/firestore';
import type { GeneratedLesson } from '@/types';
import { logError, logWarn } from './logger';

/**
 * Subscribe to lessons for a specific user
 * @param userId - The user's UID
 * @param callback - Function called when lessons are updated
 * @returns Unsubscribe function
 */
export function subscribeToLessons(userId: string, callback: (lessons: GeneratedLesson[]) => void) {
  if (!userId) {
    logWarn('subscribeToLessons: No userId provided');
    return () => {};
  }

  const lessonsRef = collection(db, 'users', userId, 'lessons');
  const q = query(lessonsRef, orderBy('createdAt', 'desc'), limit(50));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const lessons: GeneratedLesson[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      // Convert stored lesson back to GeneratedLesson format
      const lesson: GeneratedLesson = {
        lessonTitle: data.lessonTitle,
        lessonPages: data.lessonPages,
        lessonFormat: data.lessonFormat,
        subject: data.subject,
        quiz: data.quiz,
        kinestheticActivities: data.kinestheticActivities,
        curriculumInfo: data.curriculumInfo,
      };
      lessons.push(lesson);
    });
    callback(lessons);
  }, (error) => {
    logError('Error subscribing to lessons:', error);
    callback([]);
  });

  return unsubscribe;
}

/**
 * Save a lesson to Firestore
 * @param userId - The user's UID
 * @param lesson - The lesson to save
 * @returns Promise with the saved lesson ID
 */
export async function saveLesson(userId: string, lesson: GeneratedLesson): Promise<string> {
  if (!userId) {
    throw new Error('saveLesson: No userId provided');
  }

  const lessonsRef = collection(db, 'users', userId, 'lessons');
  const lessonData = {
    ...lesson,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const docRef = await addDoc(lessonsRef, lessonData);
  return docRef.id;
}

/**
 * Get lessons for a specific user (one-time fetch)
 * @param userId - The user's UID
 * @returns Promise with array of lessons
 */
export async function getLessons(userId: string): Promise<GeneratedLesson[]> {
  if (!userId) {
    logWarn('getLessons: No userId provided');
    return [];
  }

  const lessonsRef = collection(db, 'users', userId, 'lessons');
  const q = query(lessonsRef, orderBy('createdAt', 'desc'), limit(50));

  return new Promise((resolve, reject) => {
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lessons: GeneratedLesson[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Convert stored lesson back to GeneratedLesson format
        const lesson: GeneratedLesson = {
          lessonTitle: data.lessonTitle,
          lessonPages: data.lessonPages,
          lessonFormat: data.lessonFormat,
          subject: data.subject,
          quiz: data.quiz,
          kinestheticActivities: data.kinestheticActivities,
          curriculumInfo: data.curriculumInfo,
        };
        lessons.push(lesson);
      });
      unsubscribe();
      resolve(lessons);
    }, (error) => {
      logError('Error getting lessons:', error);
      reject(error);
    });
  });
} 