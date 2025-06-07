// src/hooks/use-child-profiles.ts
"use client";

import type { ChildProfile, LessonAttempt, GeneratedLesson, Badge } from '@/types';
import { useLocalStorage } from './use-local-storage';
import { v4 as uuidv4 } from 'uuid';
import { useCallback } from 'react';
import { useToast } from './use-toast'; // Import useToast

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
  const [profiles, setProfiles] = useLocalStorage<ChildProfile[]>(CHILD_PROFILES_STORAGE_KEY, []);
  const { toast } = useToast(); 

  const addProfile = useCallback((profileData: Omit<ChildProfile, 'id' | 'lessonAttempts' | 'savedLessons' | 'recentMood' | 'lessonHistory' | 'points' | 'badges'>) => {
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
    const badges = [...newProfile.badges];
    if (newProfile.avatarSeed) {
      const badge = predefinedBadges.find(b => b.id === 'custom-avatar');
      if (badge) {
        badges.push({ ...badge, dateEarned: new Date().toISOString() });
      }
    }
    newProfile.badges = badges;
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
            language: updatedProfile.language || p.language || 'en',
            lessonAttempts: updatedProfile.lessonAttempts || p.lessonAttempts || [],
            savedLessons: updatedProfile.savedLessons || p.savedLessons || [],
            points: updatedProfile.points ?? p.points ?? 0,
            badges: (() => {
              const base = updatedProfile.badges || p.badges || [];
              const hasAvatarBadge = base.some(b => b.id === 'custom-avatar');
              if (!hasAvatarBadge && updatedProfile.avatarSeed) {
                const badge = predefinedBadges.find(b => b.id === 'custom-avatar');
                if (badge) {
                  return [...base, { ...badge, dateEarned: new Date().toISOString() }];
                }
              }
              return base;
            })(),
            avatarSeed: updatedProfile.avatarSeed,
            learningStyle: updatedProfile.learningStyle || p.learningStyle || 'balanced_mixed',
            fontSizePreference: updatedProfile.fontSizePreference || p.fontSizePreference || 'medium',
            preferredActivities: updatedProfile.preferredActivities || p.preferredActivities || '',
            recentMood: updatedProfile.recentMood || p.recentMood || 'neutral',
            lessonHistory: updatedProfile.lessonHistory || p.lessonHistory || '',
            enableLeaderboard: updatedProfile.enableLeaderboard ?? p.enableLeaderboard ?? false,
            dailyUsageLimitMinutes: updatedProfile.dailyUsageLimitMinutes,
            weeklyUsageLimitMinutes: updatedProfile.weeklyUsageLimitMinutes,
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

  const addLessonAttempt = useCallback((childId: string, attemptData: Omit<LessonAttempt, 'attemptId' | 'pointsAwarded'>) => {
    setProfiles(prevProfiles => 
      prevProfiles.map(profile => {
        if (profile.id === childId) {
          const pointsEarned = Math.max(0, attemptData.quizScore); 
          
          const newAttempt: LessonAttempt = {
            ...attemptData,
            attemptId: uuidv4(),
            pointsAwarded: pointsEarned,
            // subject is already part of attemptData from LessonDisplay
          };
          const updatedAttempts = [...(profile.lessonAttempts || []), newAttempt];
          
          const newLessonHistoryEntry = `Completed lesson: "${attemptData.lessonTitle}" (Topic: ${attemptData.lessonTopic || 'N/A'}, Subject: ${attemptData.subject || 'N/A'}, Score: ${attemptData.quizScore}%) on ${new Date(attemptData.timestamp).toLocaleDateString()}. Earned ${pointsEarned} points.`;
          
          const existingHistory = profile.lessonHistory || "";
          const historyLines = existingHistory.split('\n');
          const MAX_HISTORY_LINES = 50; 
          const truncatedHistory = historyLines.slice(Math.max(0, historyLines.length - MAX_HISTORY_LINES + 1)).join('\n');
          
          const updatedLessonHistory = truncatedHistory 
            ? `${truncatedHistory}\n${newLessonHistoryEntry}` 
            : newLessonHistoryEntry;

          const updatedPoints = (profile.points || 0) + pointsEarned;
          let updatedBadges = [...(profile.badges || [])];

          const awardedBadgeIds = new Set(updatedBadges.map(b => b.id));

          if (updatedAttempts.length === 1 && !awardedBadgeIds.has('first-lesson')) {
            const badge = predefinedBadges.find(b => b.id === 'first-lesson');
            if (badge) {
              const newBadge: Badge = { ...badge, dateEarned: new Date().toISOString()};
              updatedBadges.push(newBadge);
              toast({ title: "Badge Unlocked! ✨", description: `You earned the "${badge.name}" badge!` });
            }
          }

          if (attemptData.quizScore === 100 && !awardedBadgeIds.has('perfect-score')) {
             const badge = predefinedBadges.find(b => b.id === 'perfect-score');
             if (badge) {
                const newBadge: Badge = { ...badge, dateEarned: new Date().toISOString()};
                if(!updatedBadges.some(b => b.id === newBadge.id)) {
                    updatedBadges.push(newBadge);
                    toast({ title: "Badge Unlocked! 🎯", description: `Amazing! You earned the "${badge.name}" badge for a perfect score.` });
                }
             }
          }
          
          if (updatedAttempts.length >= 5 && !awardedBadgeIds.has('five-lessons')) {
            const badge = predefinedBadges.find(b => b.id === 'five-lessons');
            if (badge) {
              const newBadge: Badge = { ...badge, dateEarned: new Date().toISOString()};
              updatedBadges.push(newBadge);
              toast({ title: "Badge Unlocked! 🌟", description: `Awesome! You earned the "${badge.name}" badge!` });
            }
          }

          const highScoresCount = updatedAttempts.filter(att => att.quizScore >= 80).length;
          if (highScoresCount >= 3 && !awardedBadgeIds.has('high-scorer')) {
            const badge = predefinedBadges.find(b => b.id === 'high-scorer');
            if (badge) {
              const newBadge: Badge = { ...badge, dateEarned: new Date().toISOString()};
              updatedBadges.push(newBadge);
              toast({ title: "Badge Unlocked! 🏆", description: `Impressive! You earned the "${badge.name}" badge.` });
            }
          }
          
          if (updatedPoints >= 100 && !awardedBadgeIds.has('points-milestone-100')) {
            const badge = predefinedBadges.find(b => b.id === 'points-milestone-100');
            if (badge) {
              const newBadge: Badge = { ...badge, dateEarned: new Date().toISOString()};
              updatedBadges.push(newBadge);
              toast({ title: "Badge Unlocked! 💯", description: `You hit 100 points and earned the "${badge.name}" badge!` });
            }
          }
           if (updatedPoints >= 500 && !awardedBadgeIds.has('points-milestone-500')) {
            const badge = predefinedBadges.find(b => b.id === 'points-milestone-500');
            if (badge) {
              const newBadge: Badge = { ...badge, dateEarned: new Date().toISOString()};
              updatedBadges.push(newBadge);
              toast({ title: "Badge Unlocked! 🚀", description: `Wow, 500 points! You earned the "${badge.name}" badge!` });
            }
          }

          return { 
            ...profile, 
            lessonAttempts: updatedAttempts, 
            lessonHistory: updatedLessonHistory,
            points: updatedPoints,
            badges: updatedBadges,
          };
        }
        return profile;
      })
    );
  }, [setProfiles, toast]);

  const addSavedLesson = useCallback((childId: string, lesson: GeneratedLesson) => {
    setProfiles(prevProfiles =>
      prevProfiles.map(profile => {
        if (profile.id === childId) {
          const lessonExists = profile.savedLessons?.some(sl => sl.lessonTitle === lesson.lessonTitle && JSON.stringify(sl.lessonPages) === JSON.stringify(lesson.lessonPages));
          if (lessonExists) return profile;

          const updatedSavedLessons = [...(profile.savedLessons || []), lesson];
          const MAX_SAVED_LESSONS = 50;
          if (updatedSavedLessons.length > MAX_SAVED_LESSONS) {
            updatedSavedLessons.splice(0, updatedSavedLessons.length - MAX_SAVED_LESSONS); 
          }
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

