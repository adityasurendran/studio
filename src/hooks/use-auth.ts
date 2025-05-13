// src/hooks/use-auth.ts
"use client";
import { useAuthContext } from '@/contexts/auth-context';

/**
 * Custom hook to access authentication context.
 * Provides currentUser, parentProfile, loading state, error state,
 * and local PIN management functions (UNSAFE - FOR DEMO ONLY).
 * - `isLocalPinSetup`: boolean, true if a local PIN has been configured.
 * - `setupLocalPin`: (pin: string) => void, sets up local PIN protection.
 * - `verifyLocalPin`: (pin: string) => boolean, verifies a PIN against the stored one.
 * - `clearLocalPin`: () => void, disables local PIN protection.
 * WARNING: Local PIN management is NOT secure and for demonstration purposes only.
 */
export const useAuth = () => {
  return useAuthContext();
};
