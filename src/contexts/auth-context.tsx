// src/contexts/auth-context.tsx
"use client";

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, type ReactNode, useCallback } from 'react';
import { auth, functions as firebaseFunctions, db } from '@/lib/firebase'; 
import type { ParentProfile } from '@/types'; 
import { httpsCallable } from 'firebase/functions';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast'; 
// Removed Firestore imports as they were commented out and not used for subscription status here.
// If you intend to use Firestore for profile storage, they would be needed.

interface AuthContextType {
  currentUser: User | null;
  parentProfile: ParentProfile | null; 
  loading: boolean;
  error: Error | null;
  isPinSetup: boolean;
  setupPin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  clearPin: () => Promise<void>;
  updateSubscriptionStatus: (isSubscribed: boolean) => Promise<void>;
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
  const [isPinSetup, setIsPinSetup] = useState(false);
  const { toast } = useToast();

  // Check if PIN is setup for current user
  const checkPinSetup = useCallback(async (userId: string) => {
    try {
      const pinDoc = await getDoc(doc(db, 'pins', userId));
      setIsPinSetup(pinDoc.exists());
    } catch (error) {
      console.error('Error checking PIN setup:', error);
      setIsPinSetup(false);
    }
  }, []);

  const setupPin = useCallback(async (pin: string) => {
    if (!currentUser) {
      toast({ 
        title: "Authentication Error", 
        description: "You must be signed in to setup PIN protection.", 
        variant: "destructive" 
      });
      return;
    }

    try {
      const setupPinFunction = httpsCallable(firebaseFunctions, 'setupPin');
      await setupPinFunction({ pin });
      
      setIsPinSetup(true);
      toast({ 
        title: "PIN Protection Setup", 
        description: "PIN protection has been enabled securely." 
      });
    } catch (error: any) {
      console.error('Error setting up PIN:', error);
      toast({ 
        title: "PIN Setup Failed", 
        description: error.message || "Failed to setup PIN protection.", 
        variant: "destructive" 
      });
    }
  }, [currentUser, toast]);

  const verifyPin = useCallback(async (pin: string): Promise<boolean> => {
    if (!currentUser) {
      return false;
    }

    try {
      const verifyPinFunction = httpsCallable(firebaseFunctions, 'verifyPin');
      const result = await verifyPinFunction({ pin });
      return result.data as boolean;
    } catch (error: any) {
      console.error('Error verifying PIN:', error);
      toast({ 
        title: "PIN Verification Failed", 
        description: error.message || "Failed to verify PIN.", 
        variant: "destructive" 
      });
      return false;
    }
  }, [currentUser, toast]);

  const clearPin = useCallback(async () => {
    if (!currentUser) {
      toast({ 
        title: "Authentication Error", 
        description: "You must be signed in to clear PIN protection.", 
        variant: "destructive" 
      });
      return;
    }

    try {
      const clearPinFunction = httpsCallable(firebaseFunctions, 'clearPin');
      await clearPinFunction();
      
      setIsPinSetup(false);
      toast({ 
        title: "PIN Protection Disabled", 
        description: "PIN protection has been disabled.", 
        variant: "destructive" 
      });
    } catch (error: any) {
      console.error('Error clearing PIN:', error);
      toast({ 
        title: "PIN Clear Failed", 
        description: error.message || "Failed to clear PIN protection.", 
        variant: "destructive" 
      });
    }
  }, [currentUser, toast]);

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

    try {
      const updateUserSubscriptionFunction = httpsCallable(firebaseFunctions, 'updateUserSubscription');
      await updateUserSubscriptionFunction({ isSubscribed });
      
      setParentProfile(prevProfile => {
        if (!prevProfile) return null;
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
          try {
            setParentProfile(prev => ({
                uid: user.uid,
                email: user.email,
                isSubscribed: prev?.isSubscribed || false,
                pinEnabled: prev?.pinEnabled || false,
            }));
            
            // Check PIN setup status
            await checkPinSetup(user.uid);
          } catch (err: any) {
            console.error("Error fetching parent profile:", err);
            setError(err);
            setParentProfile({ uid: user.uid, email: user.email, isSubscribed: false, pinEnabled: false });
          }
        } else {
          setParentProfile(null);
          setIsPinSetup(false);
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
  }, [checkPinSetup]);
  
  const value = { 
    currentUser, 
    parentProfile, 
    loading, 
    error,
    isPinSetup,
    setupPin,
    verifyPin,
    clearPin,
    updateSubscriptionStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
