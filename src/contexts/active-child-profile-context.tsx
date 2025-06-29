// src/contexts/active-child-profile-context.tsx
"use client";

import type { ChildProfile } from '@/types';
import { createContext, useContext, useState, type ReactNode, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useChildProfilesContext } from './child-profiles-context';


const ACTIVE_CHILD_ID_KEY = 'shannon-active-child-id';

interface ActiveChildProfileContextType {
  activeChild: ChildProfile | null;
  setActiveChildId: (id: string | null) => void;
  isLoading: boolean;
}

const ActiveChildProfileContext = createContext<ActiveChildProfileContextType | undefined>(undefined);

export const useActiveChildProfile = () => {
  const context = useContext(ActiveChildProfileContext);
  if (!context) {
    throw new Error('useActiveChildProfile must be used within an ActiveChildProfileProvider');
  }
  return context;
};

export const ActiveChildProfileProvider = ({ children }: { children: ReactNode }) => {
  const [activeChildId, setActiveChildIdInStorage] = useLocalStorage<string | null>(ACTIVE_CHILD_ID_KEY, null);
  const [activeChild, setActiveChild] = useState<ChildProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { getProfileById, profiles } = useChildProfilesContext();

  useEffect(() => {
    setIsLoading(true);
    if (activeChildId) {
      const profile = getProfileById(activeChildId);
      setActiveChild(profile || null);
      if (!profile) { // If profile with stored ID doesn't exist (e.g. deleted)
        setActiveChildIdInStorage(null);
      }
    } else {
      setActiveChild(null);
    }
    setIsLoading(false);
  }, [activeChildId, getProfileById, setActiveChildIdInStorage, profiles]);

  // Auto-select the only profile if there is exactly one and none is active
  useEffect(() => {
    if (!activeChildId && profiles.length === 1) {
      setActiveChildIdInStorage(profiles[0].id);
    }
    // Do not unset if more than one profile or already set
  }, [activeChildId, profiles, setActiveChildIdInStorage]);

  const setActiveChildId = (id: string | null) => {
    setActiveChildIdInStorage(id);
  };
  
  return (
    <ActiveChildProfileContext.Provider value={{ activeChild, setActiveChildId, isLoading }}>
      {children}
    </ActiveChildProfileContext.Provider>
  );
};

