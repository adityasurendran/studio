// src/components/header.tsx
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { LogIn, LogOut, UserPlus, LayoutDashboard, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Logo from '@/components/logo'; 

export default function Header() {
  const { currentUser, parentProfile } = useAuth(); // Added parentProfile
  const router = useRouter();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast({ title: "Signed Out", description: "You have been successfully signed out." });
      router.push('/');
    } catch (error) {
      console.error("Sign out error", error);
      toast({ title: "Error", description: "Failed to sign out. Please try again.", variant: "destructive" });
    }
  };

  const dashboardLink = currentUser && parentProfile?.isSubscribed ? "/dashboard" : "/subscribe";

  return (
    <header className="bg-card shadow-md sticky top-0 z-50 h-[var(--header-height,4rem)] flex items-center">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary hover:text-primary/80 transition-colors">
          <Logo className="h-8 w-auto" /> 
          <span className="hidden sm:inline">Shannon</span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link href="/faq" passHref>
            <Button variant="ghost" className="text-foreground hover:text-primary">
              <HelpCircle className="mr-2 h-4 w-4 hidden sm:inline" /> FAQ
            </Button>
          </Link>
          {currentUser ? (
            <>
              <Link href={dashboardLink} passHref>
                <Button variant="ghost" className="text-foreground hover:text-primary">
                  <LayoutDashboard className="mr-2 h-4 w-4 hidden sm:inline" /> Dashboard
                </Button>
              </Link>
              <Button variant="outline" onClick={handleSignOut} className="border-accent text-accent hover:bg-accent hover:text-accent-foreground">
                <LogOut className="mr-2 h-4 w-4 hidden sm:inline" /> Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link href="/signin" passHref>
                <Button variant="ghost" className="text-foreground hover:text-primary">
                  <LogIn className="mr-2 h-4 w-4 hidden sm:inline" /> Sign In
                </Button>
              </Link>
              <Link href="/signup" passHref>
                <Button variant="default" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <UserPlus className="mr-2 h-4 w-4 hidden sm:inline" /> Sign Up
                </Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
