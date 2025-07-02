// src/app/dashboard/lessons/page.tsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useActiveChildProfile } from '@/contexts/active-child-profile-context';
import type { ChildProfile, GeneratedLesson, LessonAttempt } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardFooter, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Loader2, BookOpen, ChevronLeft, History, Eye, Layers, FileText, HelpCircle, Users, Edit, PlusSquare, Palette, Type, Info } from 'lucide-react';
import LessonDisplay from '@/components/lesson-display';
import { useChildProfilesContext } from '@/contexts/child-profiles-context';
import { useToast } from '@/hooks/use-toast';
import { subscribeToLessons } from '@/lib/firestore-lessons';
import { useAuth } from '@/hooks/use-auth';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

export default function LessonHistoryPage() {
  const { activeChild, isLoading: activeChildLoading } = useActiveChildProfile();
  const { currentUser } = useAuth();
  const [lessons, setLessons] = useState<GeneratedLesson[]>([]);
  const [selectedLessonToView, setSelectedLessonToView] = useState<GeneratedLesson | null>(null);
  // addLessonAttempt is not directly used on this page for new attempts, but context might be used for other things.
  // const { addLessonAttempt } = useChildProfilesContext(); 
  const { toast } = useToast();

  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = subscribeToLessons(currentUser.uid, (fetchedLessons) => {
      setLessons(fetchedLessons);
    });
    return () => unsubscribe && unsubscribe();
  }, [currentUser]);

  if (activeChildLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-var(--header-height,4rem)-3rem)] text-center p-4">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-xl text-muted-foreground">Loading lesson history...</p>
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
                        Please select an active child profile to view their lesson history.
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
  
  const handleQuizCompleteForViewedLesson = (attemptData: Omit<LessonAttempt, 'attemptId'>) => {
    // This function is called when a quiz is completed from the "View Lesson" mode.
    // We don't typically save new attempts from here, as it's a review.
    // However, if you *did* want to save it, you'd call addLessonAttempt here.
    toast({
      title: "Quiz Review Complete",
      description: `Score: ${attemptData.quizScore}%. This was a review session and the score was not saved to progress.`,
      duration: 5000,
    });
  };

  const handleCloseLessonView = () => {
    setSelectedLessonToView(null); 
    toast({
        title: "Lesson Closed",
        description: "You have returned to the lesson history."
    });
  };

  if (selectedLessonToView) {
    return (
      <div className="space-y-6">
        <Button onClick={handleCloseLessonView} variant="outline" className="mb-4 shadow-sm hover:shadow-md transition-shadow">
          <ChevronLeft className="mr-2 h-4 w-4" /> Back to Lesson History
        </Button>
        <LessonDisplay
          lesson={selectedLessonToView}
          childProfile={activeChild}
          lessonTopic={selectedLessonToView.lessonTitle} // Or a more specific topic if available
          onQuizComplete={handleQuizCompleteForViewedLesson} // Special handler for viewed lessons
          onRestartLesson={handleCloseLessonView} // "Restart" here means closing the view
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-xl border-t-4 border-primary">
        <CardHeader>
          <div className="flex items-center gap-3">
            <History className="h-10 w-10 text-primary" />
            <div>
                <CardTitle className="text-3xl font-bold text-primary">Lesson History for {activeChild.name}</CardTitle>
                <CardDescription className="text-lg text-muted-foreground">
                Review previously generated lessons. {lessons.length} saved lesson(s) found.
                </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {lessons.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-20 w-20 text-muted-foreground mx-auto mb-6" />
              <p className="text-2xl text-muted-foreground mb-4">
                No lessons have been saved for {activeChild.name} yet.
              </p>
              <p className="text-muted-foreground mb-6">
                Once you generate lessons from the &apos;New Lesson&apos; page, they will appear here for review.
              </p>
              <Link href="/dashboard/lessons/new" passHref>
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg hover:scale-105 transition-transform">
                  <PlusSquare className="mr-2 h-5 w-5" /> Generate a New Lesson
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Show newest lessons first */}
              {lessons.slice().reverse().map((lesson, index) => ( 
                <Card 
                  key={lesson.lessonTitle + '-' + index} // Use a more unique key if possible, like a lesson ID if you add one
                  className="w-full hover:shadow-2xl transition-shadow duration-300 ease-in-out flex flex-col bg-card overflow-hidden group border hover:border-primary/50"
                >
                  <CardHeader className="pb-4 bg-secondary/20 border-b">
                    <div className="flex items-start justify-between">
                        <BookOpen className="h-8 w-8 text-primary mr-3 mt-1 flex-shrink-0" />
                        <div className="flex-grow overflow-hidden">
                            <CardTitle className="text-xl font-semibold text-primary group-hover:text-accent transition-colors truncate" title={lesson.lessonTitle}>
                              {lesson.lessonTitle}
                            </CardTitle>
                            <CardDescription className="text-sm mt-0.5">Subject: {lesson.subject}</CardDescription>
                        </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow space-y-2.5 text-sm p-4">
                    <div className="flex items-center text-muted-foreground">
                        <Type className="h-4 w-4 mr-2 text-primary/70 flex-shrink-0" />
                        <span>Format: {lesson.lessonFormat}</span>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                        <Layers className="h-4 w-4 mr-2 text-primary/70 flex-shrink-0" />
                        <span>Pages: {lesson.lessonPages.length}</span>
                    </div>
                    {lesson.quiz && lesson.quiz.length > 0 && (
                        <div className="flex items-center text-muted-foreground">
                            <HelpCircle className="h-4 w-4 mr-2 text-primary/70 flex-shrink-0" />
                            <span>Quiz: {lesson.quiz.length} questions</span>
                        </div>
                    )}
                    {lesson.curriculumInfo && lesson.curriculumInfo.isPlaceholder && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="flex items-center text-warning cursor-help ml-2">
                              <AlertTriangle className="h-4 w-4 mr-1 text-warning" />
                              <span>General Knowledge</span>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            This lesson was generated using general knowledge. Curriculum-specific information could not be fetched.
                          </TooltipContent>
                        </Tooltip>
                    )}
                    {lesson.curriculumInfo && !lesson.curriculumInfo.isPlaceholder && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="flex items-center text-info cursor-help ml-2">
                              <Info className="h-4 w-4 mr-1 text-info" />
                              <span>Curriculum Info</span>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="max-w-xs">
                              <div className="font-semibold mb-1">Curriculum Summary</div>
                              <div className="text-xs">{lesson.curriculumInfo.summary}</div>
                              {lesson.curriculumInfo.sourceHints && lesson.curriculumInfo.sourceHints.length > 0 && (
                                <div className="mt-2 text-xs">
                                  <b>Sources:</b> {lesson.curriculumInfo.sourceHints.join(', ')}
                                </div>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                    )}
                  </CardContent>
                  <CardFooter className="p-4 border-t mt-auto bg-card">
                    <Button
                      variant="default"
                      className="w-full bg-accent hover:bg-accent/80 text-accent-foreground group-hover:scale-105 transition-transform shadow-sm hover:shadow-md"
                      onClick={() => setSelectedLessonToView(lesson)}
                      aria-label={`View lesson: ${lesson.lessonTitle}`}
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

