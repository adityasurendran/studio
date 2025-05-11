// src/hooks/use-auth.ts
"use client";
import { useAuthContext } from '@/contexts/auth-context';

export const useAuth = () => {
  return useAuthContext();
};
