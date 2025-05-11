// src/contexts/child-profiles-context.tsx
"use client";

import type { ChildProfile, GeneratedLesson } from '@/types';
import { useChildProfiles as useChildProfilesHook } from '@/hooks/use-child-profiles';
import { createContext, useContext, type ReactNode } from 'react';

interface ChildProfilesContextType {
  profiles: ChildProfile[];
  addProfile: (profileData: Omit<ChildProfile, 'id' | 'lessonAttempts' | 'savedLessons'>) => ChildProfile;
  updateProfile: (updatedProfile: ChildProfile) => void;
  deleteProfile: (profileId: string) => void;
  getProfileById: (profileId: string) => ChildProfile | undefined;
  addSavedLesson: (childId: string, lesson: GeneratedLesson) => void;
}

const ChildProfilesContext = createContext<ChildProfilesContextType | undefined>(undefined);

export const useChildProfilesContext = () => {
  const context = useContext(ChildProfilesContext);
  if (!context) {
    throw new Error('useChildProfilesContext must be used within a ChildProfilesProvider');
  }
  return context;
};

export const ChildProfilesProvider = ({ children }: { children: ReactNode }) => {
  const childProfilesData = useChildProfilesHook();
  return (
    <ChildProfilesContext.Provider value={childProfilesData}>
      {children}
    </ChildProfilesContext.Provider>
  );
};
