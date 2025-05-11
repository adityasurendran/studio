// src/hooks/use-child-profiles.ts
"use client";

import type { ChildProfile } from '@/types';
import { useLocalStorage } from './use-local-storage';
import { v4 as uuidv4 } from 'uuid';
import { useCallback } from 'react';

const CHILD_PROFILES_STORAGE_KEY = 'learnforward-child-profiles';

export function useChildProfiles() {
  const [profiles, setProfiles] = useLocalStorage<ChildProfile[]>(CHILD_PROFILES_STORAGE_KEY, []);

  const addProfile = useCallback((profileData: Omit<ChildProfile, 'id'>) => {
    const newProfile: ChildProfile = { ...profileData, id: uuidv4() };
    setProfiles(prevProfiles => [...prevProfiles, newProfile]);
    return newProfile;
  }, [setProfiles]);

  const updateProfile = useCallback((updatedProfile: ChildProfile) => {
    setProfiles(prevProfiles =>
      prevProfiles.map(p => (p.id === updatedProfile.id ? updatedProfile : p))
    );
  }, [setProfiles]);

  const deleteProfile = useCallback((profileId: string) => {
    setProfiles(prevProfiles => prevProfiles.filter(p => p.id !== profileId));
  }, [setProfiles]);

  const getProfileById = useCallback((profileId: string): ChildProfile | undefined => {
    return profiles.find(p => p.id === profileId);
  }, [profiles]);

  return {
    profiles,
    addProfile,
    updateProfile,
    deleteProfile,
    getProfileById,
  };
}
