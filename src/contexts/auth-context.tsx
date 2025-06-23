// src/contexts/auth-context.tsx
"use client";

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, type ReactNode, useCallback } from 'react';
import { auth, functions as firebaseFunctions } from '@/lib/firebase'; 
import type { ParentProfile } from '@/types'; 
import { httpsCallable } from 'firebase/functions';
import { useToast } from '@/hooks/use-toast'; 
// Removed Firestore imports as they were commented out and not used for subscription status here.
// If you intend to use Firestore for profile storage, they would be needed.

const LOCAL_PIN_STORAGE_KEY = 'shannon_demo_pin_value'; 
const LOCAL_PIN_SETUP_KEY = 'shannon_demo_pin_is_setup';

// Define the special "always free" account email
const ALWAYS_FREE_EMAIL = "adityasurendran01@icloud.com";

interface AuthContextType {
  currentUser: User | null;
  parentProfile: ParentProfile | null; 
  loading: boolean;
  error: Error | null;
  isLocalPinSetup: boolean;
  setupLocalPin: (pin: string) => void;
  verifyLocalPin: (pin: string) => boolean;
  clearLocalPin: () => void;
  updateSubscriptionStatus: (isSubscribed: boolean) => Promise<void>; // Added for external updates
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
  const [parentProfile, setParentProfile] = useState<ParentProfile | null>(null); // Initialize with null
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const [isLocalPinSetup, setIsLocalPinSetup] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsLocalPinSetup(localStorage.getItem(LOCAL_PIN_SETUP_KEY) === 'true');
    }
  }, []);

  const setupLocalPin = useCallback((pin: string) => {
    if (typeof window !== 'undefined') {
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

  const updateSubscriptionStatus = useCallback(async (isSubscribed: boolean) => {
    if (!currentUser) {
      console.error("No user is currently signed in. Cannot update subscription status via function.");
      toast({
        title: "Authentication Error",
        description: "You must be signed in to update your subscription.",
        variant: "destructive",
      });
      return;
    }

    // For the special free email, always set client-side to true
    if (currentUser.email === ALWAYS_FREE_EMAIL) {
        setParentProfile(prevProfile => {
            if (!prevProfile) return { uid: currentUser.uid, email: currentUser.email, isSubscribed: true, pinEnabled: false };
            return { ...prevProfile, isSubscribed: true };
        });
        toast({ title: "Special Account", description: "This account has permanent premium access." });
        return;
    }

    try {
      const updateUserSubscriptionFunction = httpsCallable(firebaseFunctions, 'updateUserSubscription');
      await updateUserSubscriptionFunction({ isSubscribed });
      
      setParentProfile(prevProfile => {
        if (!prevProfile) return null; // Should ideally not happen if user is logged in
        return { ...prevProfile, isSubscribed };
      });
      toast({
        title: "Subscription Updated",
        description: `Subscription status set to: ${isSubscribed ? 'Active' : 'Inactive'}.`,
      });
    } catch (error: any) {
      console.error("Error calling updateUserSubscription function:", error);
      toast({
        title: "Subscription Update Failed",
        description: error.message || "Failed to update subscription status on the server. Please try again.",
        variant: "destructive",
      });
    }
  }, [currentUser, toast]);


  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(
      async (user) => {
        setLoading(true);
        setError(null);
        setCurrentUser(user);
        if (user) {
          if (user.email === ALWAYS_FREE_EMAIL) {
            // Grant free access to this special email
            console.log(`User ${user.email} detected as ALWAYS_FREE_EMAIL. Granting subscription access.`);
            setParentProfile({
              uid: user.uid,
              email: user.email,
              isSubscribed: true, // Override: always subscribed
              pinEnabled: false, // Default for new profile parts
              // Potentially fetch other parent profile details if they exist, but override isSubscribed
            });
            setLoading(false);
            return; // Skip Firebase function call for this user
          }
          
          // For regular users, call the Cloud Function to get their profile/subscription status
          try {
            // Assuming you have a Cloud Function to get user profile data including subscription
            // For this example, we'll simulate fetching and creating a default if not found.
            // In a real app, this would be replaced by an actual call to a function like 'getUserProfile'.
            // For now, let's mock fetching a profile and checking its `isSubscribed` status.
            // This part needs to be connected to your actual backend logic that reads from Firestore.
            // For the demo, we'll set a default non-subscribed state for other users.
            // If you have a function that fetches user data, it should be called here.
            // e.g., const getUserProfile = httpsCallable(firebaseFunctions, 'getUserProfile');
            // const profileResult = await getUserProfile();
            // const fetchedProfile = profileResult.data as ParentProfile;
            // setParentProfile(fetchedProfile);

            // Placeholder: Simulating a non-subscribed user if not the special email
            // In a real app, you fetch this from Firestore or your backend
            setParentProfile(prev => ({
                uid: user.uid,
                email: user.email,
                isSubscribed: prev?.isSubscribed || false, // Keep existing if re-auth, else default
                pinEnabled: prev?.pinEnabled || false,
            }));

          } catch (err: any) {
            console.error("Error fetching parent profile:", err);
            setError(err);
            setParentProfile({ uid: user.uid, email: user.email, isSubscribed: false, pinEnabled: false });
          }
        } else {
          setParentProfile(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Auth state change error:", err);
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
    updateSubscriptionStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
