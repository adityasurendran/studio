// src/app/dashboard/lessons/page.tsx
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useActiveChildProfile } from '@/contexts/active-child-profile-context';
import type { ChildProfile, GeneratedLesson, LessonAttempt } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardFooter, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Loader2, BookOpen, ChevronLeft, History, Eye } from 'lucide-react';
import LessonDisplay from '@/components/lesson-display';
import { useChildProfilesContext } from '@/contexts/child-profiles-context';
import { useToast } from '@/hooks/use-toast';

export default function LessonHistoryPage() {
  const { activeChild, isLoading: activeChildLoading } = useActiveChildProfile();
  const [selectedLessonToView, setSelectedLessonToView] = useState<GeneratedLesson | null>(null);
  const { addLessonAttempt } = useChildProfilesContext(); // To potentially save re-attempts if desired, currently just for review
  const { toast } = useToast();

  if (activeChildLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!activeChild) {
    return (
      <Card className="max-w-lg mx-auto mt-10 text-center shadow-lg">
        <CardHeader>
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <CardTitle className="text-2xl">No Active Child Profile</CardTitle>
          <CardDescription>Please select an active child profile to view lesson history.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/dashboard/profiles" passHref>
            <Button className="w-full" size="lg">
              Go to Profiles
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }
  
  const handleQuizCompleteForViewedLesson = (attemptData: Omit<LessonAttempt, 'attemptId'>) => {
    // For now, viewing a saved lesson's quiz is just for review and doesn't create a new primary attempt
    // We could add logic here to save it as a "re-attempt" if needed.
    toast({
      title: "Quiz Review Complete",
      description: `Score: ${attemptData.quizScore}%. This was a review session.`,
    });
    // Optionally, one could add this attempt to a different list or mark it specially.
    // addLessonAttempt(activeChild.id, attemptData); 
  };

  const handleRestartViewedLesson = () => {
    setSelectedLessonToView(null); 
    toast({
        title: "Lesson Closed",
        description: "You have returned to the lesson history."
    });
  };

  if (selectedLessonToView) {
    return (
      <div className="space-y-6">
        <Button onClick={() => setSelectedLessonToView(null)} variant="outline" className="mb-4">
          <ChevronLeft className="mr-2 h-4 w-4" /> Back to Lesson History
        </Button>
        <LessonDisplay
          lesson={selectedLessonToView}
          childProfile={activeChild}
          lessonTopic={selectedLessonToView.lessonTitle} // Assuming lesson title can serve as topic context here
          onQuizComplete={handleQuizCompleteForViewedLesson}
          onRestartLesson={handleRestartViewedLesson}
        />
      </div>
    );
  }

  const savedLessons = activeChild.savedLessons || [];

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl text-primary flex items-center gap-2">
            <History className="h-8 w-8" /> Lesson History for {activeChild.name}
          </CardTitle>
          <CardDescription>
            Review previously generated lessons. You have {savedLessons.length} saved lesson(s).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {savedLessons.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-xl text-muted-foreground mb-4">
                No lessons have been saved for {activeChild.name} yet.
              </p>
              <Link href="/dashboard/lessons/new" passHref>
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <BookOpen className="mr-2 h-5 w-5" /> Generate a New Lesson
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {savedLessons.map((lesson, index) => (
                <Card key={index} className="hover:shadow-xl transition-shadow flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-xl truncate" title={lesson.lessonTitle}>{lesson.lessonTitle}</CardTitle>
                    <CardDescription>Subject: {lesson.subject}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-sm text-muted-foreground">
                      Format: {lesson.lessonFormat}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Pages: {lesson.lessonPages.length}
                    </p>
                     {lesson.quiz && lesson.quiz.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                            Quiz Questions: {lesson.quiz.length}
                        </p>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={() => setSelectedLessonToView(lesson)}
                    >
                      <Eye className="mr-2 h-4 w-4" /> View Lesson
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
