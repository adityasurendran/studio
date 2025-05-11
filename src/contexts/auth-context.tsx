// src/contexts/auth-context.tsx
"use client";

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import type { ParentProfile } from '@/types'; // Assuming ParentProfile might be different from User

interface AuthContextType {
  currentUser: User | null;
  parentProfile: ParentProfile | null; // Could be extended with more details from Firestore
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
          // Here you could fetch additional parent profile data from Firestore
          // For now, just map the Firebase User to ParentProfile
          setParentProfile({
            uid: user.uid,
            email: user.email,
            // username: user.displayName || undefined, // If you store displayName
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
