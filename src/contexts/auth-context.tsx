// src/contexts/auth-context.tsx
"use client";

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import type { ParentProfile } from '@/types'; 

const getSubscriptionKey = (uid: string) => `shannon-subscription-status-${uid}`;

interface AuthContextType {
  currentUser: User | null;
  parentProfile: ParentProfile | null; 
  loading: boolean;
  error: Error | null;
  updateSubscriptionStatus: (isSubscribed: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProviderInternal: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [parentProfile, setParentProfile] = useState<ParentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(
      async (user) => {
        setCurrentUser(user);
        if (user) {
          let isUserSubscribed = false;
          if (typeof window !== 'undefined') {
            const storedStatus = window.localStorage.getItem(getSubscriptionKey(user.uid));
            isUserSubscribed = storedStatus === 'true';
          }
          setParentProfile({
            uid: user.uid,
            email: user.email,
            // username: user.displayName || undefined, 
            isSubscribed: isUserSubscribed, 
          });
        } else {
          setParentProfile(null);
        }
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const updateSubscriptionStatus = (isSubscribed: boolean) => {
    if (currentUser) {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(getSubscriptionKey(currentUser.uid), String(isSubscribed));
      }
      setParentProfile(prevProfile => {
        if (!prevProfile) return null; // Should ideally not happen if currentUser exists
        return { ...prevProfile, isSubscribed };
      });
    }
  };

  const value = { currentUser, parentProfile, loading, error, updateSubscriptionStatus };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
