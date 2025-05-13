// src/hooks/use-child-profiles.ts
"use client";

import type { ChildProfile, LessonAttempt, GeneratedLesson } from '@/types';
import { useLocalStorage } from './use-local-storage';
import { v4 as uuidv4 } from 'uuid';
import { useCallback } from 'react';

const CHILD_PROFILES_STORAGE_KEY = 'shannon-child-profiles';

export function useChildProfiles() {
  const [profiles, setProfiles] = useLocalStorage<ChildProfile[]>(CHILD_PROFILES_STORAGE_KEY, []);

  const addProfile = useCallback((profileData: Omit<ChildProfile, 'id' | 'lessonAttempts' | 'savedLessons' | 'recentMood' | 'lessonHistory'>) => {
    const newProfile: ChildProfile = { 
      ...profileData, 
      id: uuidv4(),
      lessonAttempts: [],
      savedLessons: [],
      avatarSeed: profileData.avatarSeed || '', // Ensure avatarSeed is initialized
      learningStyle: profileData.learningStyle || 'balanced_mixed', // Initialize learningStyle
      fontSizePreference: profileData.fontSizePreference || 'medium', // Initialize fontSizePreference
    };
    setProfiles(prevProfiles => [...prevProfiles, newProfile]);
    return newProfile;
  }, [setProfiles]);

  const updateProfile = useCallback((updatedProfile: ChildProfile) => {
    setProfiles(prevProfiles =>
      prevProfiles.map(p => (
        p.id === updatedProfile.id 
        ? { 
            ...p, 
            ...updatedProfile, 
            lessonAttempts: updatedProfile.lessonAttempts || p.lessonAttempts || [],
            savedLessons: updatedProfile.savedLessons || p.savedLessons || [],
            avatarSeed: updatedProfile.avatarSeed, 
            learningStyle: updatedProfile.learningStyle || p.learningStyle || 'balanced_mixed',
            fontSizePreference: updatedProfile.fontSizePreference || p.fontSizePreference || 'medium', // Ensure fontSizePreference is updated
          } 
        : p
      ))
    );
  }, [setProfiles]);

  const deleteProfile = useCallback((profileId: string) => {
    setProfiles(prevProfiles => prevProfiles.filter(p => p.id !== profileId));
  }, [setProfiles]);

  const getProfileById = useCallback((profileId: string): ChildProfile | undefined => {
    return profiles.find(p => p.id === profileId);
  }, [profiles]);

  const addLessonAttempt = useCallback((childId: string, attemptData: Omit<LessonAttempt, 'attemptId'>) => {
    setProfiles(prevProfiles => 
      prevProfiles.map(profile => {
        if (profile.id === childId) {
          const newAttempt: LessonAttempt = {
            ...attemptData,
            attemptId: uuidv4(),
          };
          const updatedAttempts = [...(profile.lessonAttempts || []), newAttempt];
          // Update lessonHistory with the topic of the new attempt
          const newLessonHistoryEntry = `Completed lesson: ${attemptData.lessonTopic} (Score: ${attemptData.quizScore}%)`;
          const updatedLessonHistory = profile.lessonHistory 
            ? `${profile.lessonHistory}\n${newLessonHistoryEntry}` 
            : newLessonHistoryEntry;
          
          return { ...profile, lessonAttempts: updatedAttempts, lessonHistory: updatedLessonHistory };
        }
        return profile;
      })
    );
  }, [setProfiles]);

  const addSavedLesson = useCallback((childId: string, lesson: GeneratedLesson) => {
    setProfiles(prevProfiles =>
      prevProfiles.map(profile => {
        if (profile.id === childId) {
          const updatedSavedLessons = [...(profile.savedLessons || []), lesson];
          return { ...profile, savedLessons: updatedSavedLessons };
        }
        return profile;
      })
    );
  }, [setProfiles]);

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
