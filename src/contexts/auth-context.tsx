// src/contexts/auth-context.tsx
"use client";

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, type ReactNode, useCallback } from 'react';
import { auth, functions as firebaseFunctions } from '@/lib/firebase'; // Ensure functions is imported
import type { ParentProfile } from '@/types'; 
import { httpsCallable } from 'firebase/functions';
import { useToast } from '@/hooks/use-toast'; // Import useToast

// For Firestore client-side (if needed, for now functions handle it)
// import { getFirestore, doc, onSnapshot, setDoc } from 'firebase/firestore';
// const db = getFirestore(auth.app); // Initialize Firestore if using client-side listeners

const LOCAL_PIN_STORAGE_KEY = 'shannon_demo_pin_value'; // UNSAFE: Stores PIN directly for demo
const LOCAL_PIN_SETUP_KEY = 'shannon_demo_pin_is_setup';


interface AuthContextType {
  currentUser: User | null;
  parentProfile: ParentProfile | null; 
  loading: boolean;
  error: Error | null;
  isLocalPinSetup: boolean;
  setupLocalPin: (pin: string) => void;
  verifyLocalPin: (pin: string) => boolean;
  clearLocalPin: () => void;
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
  children: ReactNode;
}

export const AuthProviderInternal: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [parentProfile, setParentProfile] = useState<ParentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  // --- Local PIN Management (UNSAFE - FOR DEMO PURPOSES ONLY) ---
  const [isLocalPinSetup, setIsLocalPinSetup] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsLocalPinSetup(localStorage.getItem(LOCAL_PIN_SETUP_KEY) === 'true');
    }
  }, []);

  const setupLocalPin = useCallback((pin: string) => {
    if (typeof window !== 'undefined') {
      // WARNING: Storing PIN directly in localStorage is highly insecure.
      // This is for demonstration purposes ONLY.
      // In a real application, PINs should be hashed server-side.
      localStorage.setItem(LOCAL_PIN_STORAGE_KEY, pin); 
      localStorage.setItem(LOCAL_PIN_SETUP_KEY, 'true');
      setIsLocalPinSetup(true);
      toast({ title: "PIN Protection Setup", description: "PIN protection has been enabled locally for this browser." });
    }
  }, [toast]);

  const verifyLocalPin = useCallback((pin: string): boolean => {
    if (typeof window !== 'undefined') {
      const storedPin = localStorage.getItem(LOCAL_PIN_STORAGE_KEY);
      const isSetup = localStorage.getItem(LOCAL_PIN_SETUP_KEY) === 'true';
      if (isSetup && storedPin === pin) {
        return true;
      }
    }
    return false;
  }, []);

  const clearLocalPin = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_PIN_STORAGE_KEY);
      localStorage.setItem(LOCAL_PIN_SETUP_KEY, 'false');
      setIsLocalPinSetup(false);
      toast({ title: "PIN Protection Disabled", description: "Local PIN protection has been disabled for this browser.", variant: "destructive" });
    }
  }, [toast]);
  // --- End Local PIN Management ---


  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(
      async (user) => {
        setCurrentUser(user);
        if (user) {
          // This part is for fetching/listening to parent profile from Firestore
          // It's important for subscription status but not directly for the local PIN
          // const userDocRef = doc(db, "users", user.uid);
          // const unsubscribeFirestore = onSnapshot(userDocRef, ...);
          // return () => unsubscribeFirestore();
          
          // For now, assume parentProfile is fetched or defaults are set
          // The actual `isSubscribed` field comes from Firestore, updated by webhooks
           setParentProfile(prev => prev || { uid: user.uid, email: user.email, isSubscribed: false, pinEnabled: false });
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

    return () => unsubscribeAuth();
  }, []);
  
  const value = { 
    currentUser, 
    parentProfile, 
    loading, 
    error,
    isLocalPinSetup,
    setupLocalPin,
    verifyLocalPin,
    clearLocalPin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
