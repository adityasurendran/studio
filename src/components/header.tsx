// src/components/header.tsx
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { auth } from '@/lib/firebase-auth';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { LogIn, LogOut, UserPlus, LayoutDashboard, HelpCircle, Info, Menu } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Logo from '@/components/logo'; 
import { useCompetitionMode } from '@/hooks/use-competition-mode';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export default function Header() {
  const { currentUser, parentProfile } = useAuth();
  const { competitionMode, loading: competitionLoading } = useCompetitionMode();
  const router = useRouter();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const dashboardLink = (currentUser && (parentProfile?.isSubscribed || competitionMode)) ? "/dashboard" : "/subscribe";

  const NavigationLinks = () => (
    <>
      <Link href="/about" passHref>
        <Button variant="ghost" className="text-foreground hover:text-primary text-sm sm:text-base">
          <Info className="mr-1 sm:mr-2 h-4 w-4" /> 
          <span className="hidden xs:inline">About</span>
        </Button>
      </Link>
      <Link href="/faq" passHref>
        <Button variant="ghost" className="text-foreground hover:text-primary text-sm sm:text-base">
          <HelpCircle className="mr-1 sm:mr-2 h-4 w-4" /> 
          <span className="hidden xs:inline">FAQ</span>
        </Button>
      </Link>
      {currentUser ? (
        <>
          <Link href={dashboardLink} passHref>
            <Button variant="ghost" className="text-foreground hover:text-primary text-sm sm:text-base">
              <LayoutDashboard className="mr-1 sm:mr-2 h-4 w-4" /> 
              <span className="hidden xs:inline">Dashboard</span>
            </Button>
          </Link>
          <Button 
            variant="outline" 
            onClick={handleSignOut} 
            className="border-accent text-accent hover:bg-accent hover:text-accent-foreground text-sm sm:text-base"
          >
            <LogOut className="mr-1 sm:mr-2 h-4 w-4" /> 
            <span className="hidden xs:inline">Sign Out</span>
          </Button>
        </>
      ) : (
        <>
          <Link href="/signin" passHref>
            <Button variant="ghost" className="text-foreground hover:text-primary text-sm sm:text-base">
              <LogIn className="mr-1 sm:mr-2 h-4 w-4" /> 
              <span className="hidden xs:inline">Sign In</span>
            </Button>
          </Link>
          <Link href="/signup" passHref>
            <Button variant="default" className="bg-accent text-accent-foreground hover:bg-accent/90 text-sm sm:text-base">
              <UserPlus className="mr-1 sm:mr-2 h-4 w-4" /> 
              <span className="hidden xs:inline">Sign Up</span>
            </Button>
          </Link>
        </>
      )}
    </>
  );

  return (
    <header className="w-full border-b bg-background sticky top-0 z-50">
      {competitionMode && !competitionLoading && (
        <div className="w-full bg-green-600 text-white text-center py-2 text-sm font-semibold tracking-wide shadow-md">
          Competition Mode Active: All features are unlocked for demo/testing.
        </div>
      )}
      <div className="bg-card shadow-md sticky top-0 z-50 h-[var(--header-height,4rem)] flex items-center w-full">
        <div className="w-full px-3 sm:px-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-primary hover:text-primary/80 transition-colors">
            <Logo className="h-6 w-auto sm:h-8" /> 
            <span className="hidden sm:inline">nyro</span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2">
            <NavigationLinks />
          </nav>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[320px]">
                <div className="flex flex-col gap-2 mt-6">
                  <NavigationLinks />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
