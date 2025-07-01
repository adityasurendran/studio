// src/hooks/use-child-profiles.ts
"use client";

import type { ChildProfile, LessonAttempt, GeneratedLesson, Badge } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { useCallback, useState, useEffect } from 'react';
import { useToast } from './use-toast'; // Import useToast
import { db } from '@/lib/firebase-firestore';
import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { useAuth } from './use-auth';

const CHILD_PROFILES_STORAGE_KEY = 'nyro-child-profiles';

const predefinedBadges: Omit<Badge, 'dateEarned'>[] = [
  { id: 'first-lesson', name: "Trailblazer", description: "Completed your first lesson!", iconName: "Rocket" },
  { id: 'perfect-score', name: "Perfectionist", description: "Achieved a perfect score on a quiz!", iconName: "Target" },
  { id: 'five-lessons', name: "Consistent Learner", description: "Completed 5 lessons!", iconName: "Award" },
  { id: 'high-scorer', name: "High Achiever", description: "Scored 80% or more on 3 quizzes!", iconName: "TrendingUp" },
  { id: 'points-milestone-100', name: "Century Club", description: "Earned 100 points!", iconName: "Star" },
  { id: 'points-milestone-500', name: "Point Powerhouse", description: "Earned 500 points!", iconName: "ZapIcon" },
  { id: 'custom-avatar', name: 'Stylist', description: 'Created a custom avatar!', iconName: 'Smile' },
];

export function useChildProfiles() {
  const { currentUser } = useAuth();
  const { toast } = useToast(); 
  const [profiles, setProfiles] = useState<ChildProfile[]>([]);

  // Load profiles from Firestore
  useEffect(() => {
    if (!currentUser) {
      setProfiles([]);
      return;
    }
    const ref = collection(db, 'users', currentUser.uid, 'childProfiles');
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      setProfiles(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as ChildProfile));
    });
    return () => unsubscribe();
  }, [currentUser]);

  const addProfile = useCallback(async (profileData: Omit<ChildProfile, 'id' | 'lessonAttempts' | 'savedLessons' | 'points' | 'badges'>) => {
    if (!currentUser) throw new Error('Not authenticated');
    const newProfile: ChildProfile = {
      ...profileData,
      id: uuidv4(),
      language: profileData.language || 'en',
      lessonAttempts: [],
      savedLessons: [],
      points: 0,
      badges: [],
      avatarSeed: profileData.avatarSeed?.trim() || profileData.name,
      learningStyle: profileData.learningStyle || 'balanced_mixed', 
      fontSizePreference: profileData.fontSizePreference || 'medium', 
      preferredActivities: profileData.preferredActivities || '',
      enableLeaderboard: profileData.enableLeaderboard || false,
      dailyUsageLimitMinutes: profileData.dailyUsageLimitMinutes ?? null, 
      weeklyUsageLimitMinutes: profileData.weeklyUsageLimitMinutes ?? null, 
    };
    await setDoc(doc(collection(db, 'users', currentUser.uid, 'childProfiles'), newProfile.id), newProfile as any);
    return newProfile;
  }, [currentUser]);

  const updateProfile = useCallback(async (updatedProfile: ChildProfile) => {
    if (!currentUser) throw new Error('Not authenticated');
    await updateDoc(doc(db, 'users', currentUser.uid, 'childProfiles', updatedProfile.id), updatedProfile);
  }, [currentUser]);

  const deleteProfile = useCallback(async (profileId: string) => {
    if (!currentUser) throw new Error('Not authenticated');
    await deleteDoc(doc(db, 'users', currentUser.uid, 'childProfiles', profileId));
  }, [currentUser]);

  const getProfileById = useCallback((profileId: string): ChildProfile | undefined => {
    return profiles.find(p => p.id === profileId);
  }, [profiles]);

  const addLessonAttempt = useCallback(async (childId: string, attemptData: Omit<LessonAttempt, 'attemptId' | 'pointsAwarded'>) => {
    if (!currentUser) throw new Error('Not authenticated');
    const attemptId = uuidv4();
    const newAttempt: LessonAttempt = {
      ...attemptData,
      attemptId,
      pointsAwarded: 0, // You can update this logic as needed
    };
    const childRef = doc(db, 'users', currentUser.uid, 'childProfiles', childId);
    // Atomically add the new attempt to the lessonAttempts array
    await updateDoc(childRef, {
      lessonAttempts: [...(profiles.find(p => p.id === childId)?.lessonAttempts || []), newAttempt],
    });
    return newAttempt;
  }, [currentUser, profiles]);

  const addSavedLesson = useCallback(async (childId: string, lesson: GeneratedLesson) => {
    if (!currentUser) throw new Error('Not authenticated');
    const childRef = doc(db, 'users', currentUser.uid, 'childProfiles', childId);
    // Atomically add the new lesson to the savedLessons array
    await updateDoc(childRef, {
      savedLessons: [...(profiles.find(p => p.id === childId)?.savedLessons || []), lesson],
    });
  }, [currentUser, profiles]);

  return {
    profiles,
    addProfile,
    updateProfile,
    deleteProfile,
    getProfileById,
    addLessonAttempt,
    addSavedLesson,
  };
}

