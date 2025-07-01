// src/components/auth-guard.tsx
"use client";

import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, ShieldCheck } from 'lucide-react'; // Added ShieldCheck for visual flair
import { isCompetitionModeEnabled } from '@/config'; 
import Logo from '@/components/logo';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { currentUser, parentProfile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!currentUser) {
        router.push(`/signin?redirect=${encodeURIComponent(pathname)}`);
      } else if (
        !isCompetitionModeEnabled &&
        parentProfile &&
        !parentProfile.isSubscribed &&
        pathname !== '/subscribe' && 
        pathname !== '/dashboard/parent-settings'
      ) {
        router.push('/subscribe');
      }
    }
  }, [currentUser, parentProfile, loading, router, pathname]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-background via-secondary/10 to-background text-center p-6">
        <div className="mb-8 animate-pulse">
            <Logo className="h-24 w-24 text-primary" />
        </div>
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-6" />
        <h1 className="text-3xl font-semibold text-primary mb-3 tracking-tight">
          Loading Your nyro Dashboard
        </h1>
        <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
          Please wait a moment while we securely prepare your personalized learning environment...
        </p>
        <div className="mt-8 flex items-center text-sm text-muted-foreground">
            <ShieldCheck className="h-5 w-5 mr-2 text-green-500"/>
            <span>Ensuring a safe & tailored experience.</span>
        </div>
      </div>
    );
  }

  if (isCompetitionModeEnabled && currentUser) {
    return <>{children}</>;
  }

  if (!currentUser) {
    return null; 
  }
  
  if (
    !isCompetitionModeEnabled &&
    parentProfile &&
    !parentProfile.isSubscribed &&
    pathname !== '/subscribe' &&
    pathname !== '/dashboard/parent-settings'
  ) {
    return null;
  }
  
  return <>{children}</>;
}

