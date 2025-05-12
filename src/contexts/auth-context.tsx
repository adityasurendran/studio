// src/contexts/auth-context.tsx
"use client";

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import type { ParentProfile } from '@/types'; 

interface AuthContextType {
  currentUser: User | null;
  parentProfile: ParentProfile | null; 
  loading: boolean;
  error: Error | null;
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
          // In a real app, isSubscribed would be fetched from a backend/database.
          // For demonstration, we'll default it to false.
          // You could set this to true for specific test UIDs:
          // const testUserSubscribed = user.uid === "your-test-user-uid";
          setParentProfile({
            uid: user.uid,
            email: user.email,
            // username: user.displayName || undefined, 
            isSubscribed: false, // Default to false for paywall. Set to true to bypass for testing.
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

  const value = { currentUser, parentProfile, loading, error };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
