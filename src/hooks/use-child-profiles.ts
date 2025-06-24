// src/hooks/use-child-profiles.ts
"use client";

import type { ChildProfile, LessonAttempt, GeneratedLesson, Badge } from '@/types';
import { useLocalStorage } from './use-local-storage';
import { v4 as uuidv4 } from 'uuid';
import { useCallback, useState, useEffect } from 'react';
import { useToast } from './use-toast'; // Import useToast
import { db } from '@/lib/firebase';
import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { useAuth } from './use-auth';

const CHILD_PROFILES_STORAGE_KEY = 'shannon-child-profiles';

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

  const addProfile = useCallback(async (profileData: Omit<ChildProfile, 'id' | 'lessonAttempts' | 'savedLessons' | 'recentMood' | 'lessonHistory' | 'points' | 'badges'>) => {
    if (!currentUser) throw new Error('Not authenticated');
    const newProfile: ChildProfile = {
      ...profileData,
      id: uuidv4(),
      language: profileData.language || 'en',
      lessonAttempts: [],
      savedLessons: [],
      points: 0,
      badges: [],
      avatarSeed: profileData.avatarSeed || '',
      learningStyle: profileData.learningStyle || 'balanced_mixed', 
      fontSizePreference: profileData.fontSizePreference || 'medium', 
      preferredActivities: profileData.preferredActivities || '',
      recentMood: profileData.recentMood || 'neutral', 
      lessonHistory: profileData.lessonHistory || '',
      enableLeaderboard: profileData.enableLeaderboard || false,
      dailyUsageLimitMinutes: profileData.dailyUsageLimitMinutes, 
      weeklyUsageLimitMinutes: profileData.weeklyUsageLimitMinutes, 
    };
    await setDoc(doc(collection(db, 'users', currentUser.uid, 'childProfiles'), newProfile.id), newProfile);
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

  const addLessonAttempt = useCallback((childId: string, attemptData: Omit<LessonAttempt, 'attemptId' | 'pointsAwarded'>) => {
    // Implementation for adding a lesson attempt to Firestore
  }, []);

  const addSavedLesson = useCallback((childId: string, lesson: GeneratedLesson) => {
    // Implementation for adding a saved lesson to Firestore
  }, []);

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

