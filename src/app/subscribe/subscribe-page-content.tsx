"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Lock, CreditCard, Sparkles, LogIn, Loader2 as Loader2Icon, Award } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { functions } from "@/lib/firebase"; 
import { httpsCallable } from 'firebase/functions'; 
import { isCompetitionModeEnabled } from '@/config'; // Import the configuration

export default function SubscribePageContent() {
  const { currentUser, parentProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    if (isCompetitionModeEnabled && currentUser) {
      toast({
        title: "Competition Mode Active",
        description: "All features are currently unlocked. Redirecting to dashboard.",
      });
      router.replace('/dashboard');
      return; // Early exit if redirecting
    }

    const sessionId = searchParams.get('session_id');
    const canceled = searchParams.get('canceled');

    if (sessionId) {
      toast({
        title: "Subscription Successful!",
        description: "Welcome to nyro Premium! Your dashboard is loading.",
        variant: "default",
      });
      // Clear query params and redirect to dashboard
      router.replace('/dashboard'); 
    }

    if (canceled) {
      toast({
        title: "Subscription Canceled",
        description: "You have canceled the subscription process. You can try again anytime.",
        variant: "destructive",
      });
      // Use router.replace to remove query params from URL without adding to history
      router.replace('/subscribe'); 
    }
  }, [isCompetitionModeEnabled, currentUser, router, toast, searchParams]);


  if (authLoading || (isCompetitionModeEnabled && currentUser)) { 
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-var(--header-height,4rem)-3rem)] text-center p-4">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-xl text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (currentUser && parentProfile?.isSubscribed && !isCompetitionModeEnabled) { 
    router.replace('/dashboard'); 
    return ( // Return a loader while redirecting
        <div className="flex flex-col justify-center items-center h-[calc(100vh-var(--header-height,4rem)-3rem)] text-center p-4">
            <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
            <p className="text-xl text-muted-foreground">Already subscribed. Redirecting...</p>
        </div>
    );
  }
  
  if (isCompetitionModeEnabled && currentUser) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-var(--header-height,4rem)-3rem)] text-center p-4">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-xl text-muted-foreground">Competition mode active. Redirecting...</p>
      </div>
    );
  }


  if (!currentUser) {
     return (
        <div className="container mx-auto px-4 py-12 flex flex-col items-center text-center min-h-[calc(100vh-var(--header-height,4rem)-2rem)] justify-center">
        <Card className="w-full max-w-md shadow-xl border-t-4 border-primary p-6">
            <CardHeader className="text-center p-0 mb-4">
            <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
                <Lock className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold text-primary">Access Restricted</CardTitle>
            <CardDescription className="text-lg mt-2 text-muted-foreground">
                Please sign in to {isCompetitionModeEnabled ? "access the dashboard" : "subscribe and unlock nyro"}.
            </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 p-0">
            <Link href={isCompetitionModeEnabled ? "/signin?redirect=/dashboard" : "/signin?redirect=/subscribe"} passHref>
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-6" size="lg">
                    <LogIn className="mr-2 h-5 w-5" /> Sign In
                </Button>
            </Link>
            <Link href="/signup" passHref>
                <Button variant="outline" className="w-full text-lg py-6" size="lg">
                    Create Account
                </Button>
            </Link>
             <Link href="/" passHref>
                <Button variant="link" className="text-sm mt-2">Back to Homepage</Button>
              </Link>
            </CardContent>
        </Card>
        </div>
    );
  }

  const handleSubscribe = async () => {
    if (!currentUser) { 
      toast({ title: "Error", description: "You must be logged in to subscribe.", variant: "destructive" });
      router.push("/signin?redirect=/subscribe");
      return;
    }
    if (isCompetitionModeEnabled) { 
      toast({ title: "Competition Mode Active", description: "Subscription is not required."});
      router.push('/dashboard');
      return;
    }

    setIsSubscribing(true);
    try {
      const createStripeCheckout = httpsCallable(functions, 'createStripeCheckoutSession');
      const result = await createStripeCheckout(); // No data needs to be passed if UID is handled by context
      const { sessionUrl } = result.data as { sessionUrl: string, sessionId: string }; 

      if (sessionUrl) {
        window.location.href = sessionUrl;
      } else {
        throw new Error("Could not create Stripe session. No URL returned.");
      }
    } catch (error: any) {
      console.error("Stripe Checkout Error:", error);
      let errorMessage = "Could not initiate subscription. Please try again.";
      if (error.message) {
        errorMessage = error.message;
      } else if (error.details && typeof error.details === 'string') {
        errorMessage = error.details;
      }
      toast({
        title: "Subscription Error",
        description: errorMessage,
        variant: "destructive",
      });
      setIsSubscribing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 flex flex-col items-center text-center min-h-[calc(100vh-var(--header-height,4rem)-2rem)] justify-center">
      <Card className="w-full max-w-lg shadow-xl border-t-4 border-accent p-6 md:p-8">
        <CardHeader className="p-0 mb-6">
          <div className="mx-auto bg-accent/10 p-5 rounded-full w-fit mb-6">
            <Sparkles className="h-16 w-16 text-accent" />
          </div>
          <CardTitle className="text-4xl font-bold text-accent">Unlock nyro Premium</CardTitle>
          <CardDescription className="text-xl mt-3 text-muted-foreground">
            Subscribe to access personalized AI-powered lessons and all features.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 space-y-6">
          <Card className="p-6 bg-card rounded-lg border border-dashed border-primary/30 text-left">
            <h3 className="text-2xl font-semibold text-primary mb-3 text-center">Premium Features:</h3>
            <ul className="list-disc list-inside text-foreground space-y-1.5 pl-4">
              <li>Unlimited AI-generated lessons</li>
              <li>Personalized content for each child</li>
              <li>Adaptive learning features & themes</li>
              <li>Detailed progress tracking & history</li>
              <li>Quiz generation with explanations</li>
              <li>Support for various learning difficulties</li>
            </ul>
          </Card>
          
          <p className="text-2xl font-bold text-primary">
            Subscription Price: <span className="text-accent">$9.99 / month</span>
          </p>
          <p className="text-sm text-muted-foreground -mt-4">(Example price. Configure yours in Stripe & .env)</p>
          
          <Button 
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-xl py-7 shadow-lg hover:shadow-xl transition-all transform hover:scale-105" 
            size="lg"
            onClick={handleSubscribe}
            disabled={isSubscribing || authLoading}
          >
            {isSubscribing ? (
              <Loader2Icon className="mr-3 h-6 w-6 animate-spin" />
            ) : (
              <CreditCard className="mr-3 h-6 w-6" />
            )}
            {isSubscribing ? "Redirecting to Payment..." : "Subscribe Now"}
          </Button>
          
          <p className="text-xs text-muted-foreground mt-4">
            By subscribing, you agree to our Terms of Service and Privacy Policy.
          </p>
          <Link href="/" passHref>
            <Button variant="link" className="text-sm">Back to Homepage</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
