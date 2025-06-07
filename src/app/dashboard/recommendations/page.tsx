// src/app/dashboard/recommendations/page.tsx
"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useActiveChildProfile } from '@/contexts/active-child-profile-context';
import type { ChildProfile, LessonAttempt } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles, FastForward, Lightbulb, ArrowRight, AlertTriangle, Users, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { recommendNextLesson, type RecommendNextLessonInput, type RecommendNextLessonOutput } from '@/ai/flows/recommend-next-lesson';
import { formatLessonHistorySummary } from '@/lib/lesson-summary';




export default function RecommendationsPage() {
  const { activeChild, isLoading: childLoading } = useActiveChildProfile();
  const [isLoadingRecommendation, setIsLoadingRecommendation] = useState(false);
  const [recommendation, setRecommendation] = useState<RecommendNextLessonOutput | null>(null);
  const { toast } = useToast();

  const lessonHistorySummary = useMemo(() => {
    return formatLessonHistorySummary(activeChild?.lessonAttempts);
  }, [activeChild?.lessonAttempts]);

  const handleGetRecommendation = async () => {
    if (!activeChild) {
      toast({ title: "Error", description: "No active child profile selected.", variant: "destructive" });
      return;
    }
    if (!activeChild.lessonAttempts || activeChild.lessonAttempts.length === 0) {
       toast({ title: "Not Enough Data", description: "Please complete some lessons first to get personalized recommendations.", variant: "default" });
      return;
    }

    setIsLoadingRecommendation(true);
    setRecommendation(null);
    try {
      const input: RecommendNextLessonInput = {
        childAge: activeChild.age,
        interests: activeChild.interests,
        learningDifficulties: activeChild.learningDifficulties,
        curriculum: activeChild.curriculum,
        lessonHistorySummary: lessonHistorySummary,
        learningStyle: activeChild.learningStyle || 'balanced_mixed',
      };
      const result = await recommendNextLesson(input);
      setRecommendation(result);
      toast({ title: "Recommendation Ready!", description: "A suggested next lesson topic has been generated." });
    } catch (error: any) {
      console.error("Next lesson recommendation error:", error);
      toast({
        title: "Recommendation Error",
        description: error.message || "Could not generate a recommendation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingRecommendation(false);
    }
  };

  if (childLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-var(--header-height,4rem)-3rem)] text-center p-4">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-xl text-muted-foreground">Loading child profile...</p>
      </div>
    );
  }

  if (!activeChild) {
     return (
        <div className="flex flex-col items-center justify-center h-full py-10 px-4 min-h-[calc(100vh-var(--header-height,4rem)-3rem)]">
            <Card className="w-full max-w-lg text-center shadow-xl p-6 md:p-8 border-t-4 border-primary">
                <CardHeader className="p-0 mb-6">
                    <div className="mx-auto bg-primary/10 p-5 rounded-full w-fit mb-4">
                        <Users className="h-16 w-16 text-primary" />
                    </div>
                    <CardTitle className="text-3xl font-semibold">No Active Child Profile</CardTitle>
                    <CardDescription className="text-base mt-2 text-muted-foreground">
                        Please select an active child profile to get lesson recommendations.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Link href="/dashboard/profiles" passHref>
                        <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-6 shadow-md hover:shadow-lg" size="lg">
                            <Users className="mr-2 h-5 w-5" /> Manage Child Profiles
                        </Button>
                    </Link>
                </CardContent>
          </Card>
        </div>
    );
  }
  
  const hasLessonHistory = activeChild.lessonAttempts && activeChild.lessonAttempts.length > 0;

  return (
    <div className="container mx-auto py-6 md:py-8 max-w-3xl">
      <Card className="shadow-xl border-t-4 border-accent">
        <CardHeader>
          <div className="flex items-center gap-3">
            <FastForward className="h-10 w-10 text-accent" />
            <div>
              <CardTitle className="text-3xl font-bold text-accent">What&apos;s Next for {activeChild.name}?</CardTitle>
              <CardDescription className="text-lg text-muted-foreground mt-1">
                Get AI-powered recommendations for the next lesson based on {activeChild.name}&apos;s learning path.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!hasLessonHistory ? (
            <div className="text-center py-8 px-4 bg-secondary/30 rounded-lg border border-dashed border-accent/50">
              <BookOpen className="h-16 w-16 text-accent mx-auto mb-4" />
              <p className="text-xl font-semibold text-accent mb-2">Complete Some Lessons First!</p>
              <p className="text-muted-foreground mb-6">
                Personalized recommendations are based on {activeChild.name}&apos;s completed lessons and quiz performance.
                Once some lessons are done, come back here for tailored suggestions.
              </p>
              <Link href="/dashboard/lessons/new" passHref>
                <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  <Sparkles className="mr-2 h-5 w-5" /> Create a New Lesson
                </Button>
              </Link>
            </div>
          ) : (
            <Button 
              onClick={handleGetRecommendation} 
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-lg py-6 shadow-md hover:shadow-lg" 
              size="lg" 
              disabled={isLoadingRecommendation}
            >
              {isLoadingRecommendation ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-5 w-5" />
              )}
              Get Next Lesson Recommendation
            </Button>
          )}
           {hasLessonHistory && (
            <Card className="mt-6 bg-card border">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium text-muted-foreground">Summary of Recent Lessons:</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    <pre className="whitespace-pre-wrap text-xs text-foreground bg-muted/30 p-3 rounded-md max-h-40 overflow-y-auto">
                        {lessonHistorySummary}
                    </pre>
                </CardContent>
            </Card>
           )}
        </CardContent>
      </Card>

      {isLoadingRecommendation && (
        <div className="text-center py-10 mt-8">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Analyzing {activeChild.name}&apos;s progress and recommending the next step...</p>
        </div>
      )}

      {recommendation && !isLoadingRecommendation && (
        <Card className="mt-8 shadow-lg border-t-4 border-primary">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Lightbulb className="h-8 w-8 text-primary" />
              <CardTitle className="text-2xl font-semibold text-primary">Next Step Recommendation!</CardTitle>
            </div>
             {recommendation.confidence && (
                <CardDescription className="text-sm text-muted-foreground">
                    Confidence: {Math.round(recommendation.confidence * 100)}%
                </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <h3 className="text-xl font-bold text-accent">{recommendation.recommendedTopic}</h3>
            <p className="text-muted-foreground italic whitespace-pre-line">&quot;{recommendation.reasoning}&quot;</p>
            <Link href={`/dashboard/lessons/new?topic=${encodeURIComponent(recommendation.recommendedTopic)}`} passHref>
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-6 shadow-md hover:shadow-lg" size="lg">
                <ArrowRight className="mr-2 h-5 w-5" /> Create This Lesson
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

