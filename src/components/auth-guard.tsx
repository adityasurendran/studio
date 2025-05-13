// src/components/auth-guard.tsx
"use client";

import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { isCompetitionModeEnabled } from '@/config'; // Import the configuration

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
        // If not logged in, redirect to signin, appending current path as redirect query
        router.push(`/signin?redirect=${encodeURIComponent(pathname)}`);
      } else if (
        !isCompetitionModeEnabled &&
        parentProfile &&
        !parentProfile.isSubscribed &&
        pathname !== '/subscribe' && // Allow access to /subscribe itself
        pathname !== '/dashboard/parent-settings' // Allow access to parent settings page
      ) {
        // If logged in, competition mode OFF, not subscribed, AND not on an allowed page, redirect to subscribe.
        router.push('/subscribe');
      }
    }
  }, [currentUser, parentProfile, loading, router, pathname]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // If competition mode is enabled, allow access even if not subscribed (as long as logged in).
  if (isCompetitionModeEnabled && currentUser) {
    return <>{children}</>;
  }

  // If user is not authenticated:
  if (!currentUser) {
    // useEffect above will handle redirection. Return null to prevent rendering children.
    return null; 
  }
  
  // If user is authenticated, but competition mode is OFF AND user is not subscribed,
  // AND they are trying to access a page other than /subscribe or /dashboard/parent-settings:
  if (
    !isCompetitionModeEnabled &&
    parentProfile &&
    !parentProfile.isSubscribed &&
    pathname !== '/subscribe' &&
    pathname !== '/dashboard/parent-settings'
  ) {
    // useEffect above will handle redirection. Return null.
    return null;
  }
  
  // User is authenticated and either subscribed, or competition mode is on, or on an allowed page.
  return <>{children}</>;
}

