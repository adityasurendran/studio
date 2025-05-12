// src/components/auth-guard.tsx
"use client";

import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

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
      } else if (parentProfile && !parentProfile.isSubscribed) {
        // If logged in but not subscribed, redirect to subscribe page.
        // This guard is used for routes like /dashboard/*
        // Ensure not already on /subscribe page to prevent loops (though /subscribe won't use this guard)
        if (pathname !== '/subscribe') {
          router.push('/subscribe');
        }
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

  // If user is not authenticated OR is authenticated but not subscribed,
  // useEffect above will handle redirection. Return null to prevent rendering children.
  if (!currentUser || (parentProfile && !parentProfile.isSubscribed)) {
    return null; 
  }

  // User is authenticated and (implicitly, due to the check above) subscribed.
  return <>{children}</>;
}
