// src/contexts/auth-context.tsx
"use client";

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { auth } from '@/lib/firebase'; // Firestore will be used indirectly via Cloud Functions
import type { ParentProfile } from '@/types'; 
// For Firestore client-side (if needed, for now functions handle it)
// import { getFirestore, doc, onSnapshot, setDoc } from 'firebase/firestore';

// const db = getFirestore(auth.app); // Initialize Firestore if using client-side listeners

interface AuthContextType {
  currentUser: User | null;
  parentProfile: ParentProfile | null; 
  loading: boolean;
  error: Error | null;
  // updateSubscriptionStatus is removed as status is now managed by backend via Stripe webhooks
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

// This is a placeholder for a function that would be in your firebase-admin setup in Cloud Functions
// For client-side, you'd typically read from Firestore directly if you were to implement real-time updates here.
// However, for simplicity with Stripe webhooks, we'll assume Firestore is updated by the backend.
// The `onSnapshot` listener below demonstrates how you *would* listen to Firestore changes.

async function getParentProfileFromFirestore(userId: string): Promise<ParentProfile | null> {
    // In a real app, this function would interact with your backend or Firestore directly.
    // For this example, we assume Cloud Functions update Firestore, and we fetch it here.
    // This is a conceptual representation. In a real app, this would involve an actual Firestore read.
    // To avoid direct client-side Firestore dependency here and keep it simple,
    // we're simulating that the profile is fetched.
    // The crucial part is that `isSubscribed` comes from your backend source of truth.
    
    // Placeholder: In a real scenario, you'd use firebase-admin in a Cloud Function to get this.
    // For client-side, it's better to use onSnapshot for real-time updates.
    // For now, this function is conceptual. The useEffect will set up a listener.
    console.warn("Conceptual getParentProfileFromFirestore called. Real implementation would fetch from Firestore.");
    return null; // Firestore listener will populate this.
}


export const AuthProviderInternal: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [parentProfile, setParentProfile] = useState<ParentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(
      async (user) => {
        setCurrentUser(user);
        if (user) {
          // Instead of direct get, set up a listener for real-time updates from Firestore
          // This requires Firestore to be set up in src/lib/firebase.ts and imported
          // For now, we'll mock the fetching logic conceptually and assume Firestore is updated by webhooks.
          // In a full implementation, you'd use onSnapshot here.
          // Example with onSnapshot (requires `db` from `firebase/firestore`):
          /*
          const userDocRef = doc(db, "users", user.uid);
          const unsubscribeFirestore = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
              setParentProfile(docSnap.data() as ParentProfile);
            } else {
              // User document doesn't exist, maybe create one with default (not subscribed)
              // This might be handled on first Stripe interaction or user creation
              const defaultProfile: ParentProfile = {
                uid: user.uid,
                email: user.email,
                isSubscribed: false,
              };
              // await setDoc(userDocRef, defaultProfile); // Careful with client-side writes
              setParentProfile(defaultProfile);
              console.log("No such user document in Firestore, setting default profile.");
            }
            setLoading(false);
          }, (firestoreError) => {
            console.error("Error listening to user document:", firestoreError);
            setError(firestoreError);
            setLoading(false);
          });
          return () => unsubscribeFirestore(); // Cleanup Firestore listener
          */

          // Simplified approach: Assume backend (webhooks) updates Firestore.
          // Here we simulate reading it. A real app needs a robust Firestore read or listener.
          // For now, we will rely on the fact that AuthGuard will re-evaluate when parentProfile changes.
          // And parentProfile will change when Stripe webhook updates Firestore, and then Firestore listener (if implemented) updates the state.
          // If no direct Firestore listener here, user might need a refresh after successful subscription for UI to update,
          // unless redirected to a page that forces re-check.
          // The `createStripeCheckoutSession` redirects to /dashboard, which should trigger AuthGuard.
          
          // Simulate initial load with potentially stale data, actual data comes from AuthGuard/page load
           setParentProfile(prev => prev || { uid: user.uid, email: user.email, isSubscribed: false }); // Basic default
           // The AuthGuard will be the primary mechanism for checking subscription status on navigation.
           // Real-time updates would require a Firestore listener.
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
  
  // The updateSubscriptionStatus function is removed because subscription status
  // should now be managed via Stripe webhooks updating Firestore,
  // and then Firestore listeners updating the client state, or re-fetching on navigation.

  const value = { currentUser, parentProfile, loading, error };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};