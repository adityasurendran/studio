// src/components/header.tsx
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { BookHeart, LogIn, LogOut, UserPlus, LayoutDashboard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Header() {
  const { currentUser } = useAuth();
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

  return (
    <header className="bg-card shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary hover:text-primary/80 transition-colors">
          <BookHeart className="h-8 w-8" />
          <span>LearnForward</span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4">
          {currentUser ? (
            <>
              <Link href="/dashboard" passHref>
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
