// src/components/lesson-display.tsx
"use client";

import type { GeneratedLesson, ChildProfile, LessonPage, QuizQuestion, LessonAttempt } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { BookOpen, Layers, Type, Palette, ChevronLeft, ChevronRight, ImageOff, CheckCircle, AlertTriangle, RotateCcw, Send, HelpCircle, Check, X } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect } from 'react';

interface LessonDisplayProps {
  lesson: GeneratedLesson;
  childProfile?: ChildProfile | null;
  lessonTopic: string; 
  onQuizComplete: (attempt: Omit<LessonAttempt, 'attemptId'>) => void;
  onRestartLesson: () => void; 
}

export default function LessonDisplay({ lesson, childProfile, lessonTopic, onQuizComplete, onRestartLesson }: LessonDisplayProps) {
  const [view, setView] = useState<'lesson' | 'quiz' | 'results'>('lesson');
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizScore, setQuizScore] = useState(0);
  const [answeredCorrectly, setAnsweredCorrectly] = useState(0);
  const [showExplanationForQuestionIndex, setShowExplanationForQuestionIndex] = useState<number | null>(null);
  const [attemptedQuestions, setAttemptedQuestions] = useState<Set<number>>(new Set());


  useEffect(() => {
    // Reset quiz state if lesson changes (e.g., new lesson generated)
    setView('lesson');
    setCurrentPageIndex(0);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setQuizScore(0);
    setAnsweredCorrectly(0);
    setShowExplanationForQuestionIndex(null);
    setAttemptedQuestions(new Set());
  }, [lesson]);

  const themeClass = childProfile?.theme === 'dark' ? 'dark-theme-lesson' : 
                     childProfile?.theme === 'colorful' ? 'colorful-theme-lesson' :
                     childProfile?.theme === 'simple' ? 'simple-theme-lesson' :
                     '';
  const fontClass = childProfile?.screenIssues?.includes('larger fonts') ? 'text-lg md:text-xl' : 'text-base md:text-lg';

  const totalLessonPages = lesson.lessonPages.length;
  const currentLessonPage: LessonPage | undefined = lesson.lessonPages[currentPageIndex];
  
  const totalQuizQuestions = lesson.quiz?.length || 0;
  const currentQuizQuestion: QuizQuestion | undefined = lesson.quiz?.[currentQuestionIndex];

  const handleNextPage = () => {
    if (currentPageIndex < totalLessonPages - 1) {
      setCurrentPageIndex(prev => prev + 1);
    } else {
      if (totalQuizQuestions > 0) {
        setView('quiz');
      } else {
        onQuizComplete({ 
            lessonTitle: lesson.lessonTitle, 
            lessonTopic: lessonTopic,
            quizScore: 100, 
            quizTotalQuestions: 0, 
            questionsAnsweredCorrectly: 0,
            timestamp: new Date().toISOString() 
        }); 
        setView('results'); 
      }
    }
  };

  const handlePreviousPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(prev => prev - 1);
    }
  };

  const handleAnswerSelection = (questionIdx: number, optionIdx: number) => {
    setSelectedAnswers(prev => ({ ...prev, [questionIdx]: optionIdx }));
    // If showing explanation, selecting an answer implies trying again, so hide explanation
    if (showExplanationForQuestionIndex === questionIdx) {
      setShowExplanationForQuestionIndex(null);
    }
  };

  const handleSubmitAnswer = () => {
    if (currentQuizQuestion === undefined || selectedAnswers[currentQuestionIndex] === undefined) return;

    const isCorrect = selectedAnswers[currentQuestionIndex] === currentQuizQuestion.correctAnswerIndex;
    
    if (isCorrect) {
      setShowExplanationForQuestionIndex(null); // Ensure no explanation shown for correct answers
      setAttemptedQuestions(prev => new Set(prev).add(currentQuestionIndex)); // Mark as attempted (and correct)
      advanceToNextQuestionOrSubmit();
    } else {
      // Incorrect answer, show explanation
      setShowExplanationForQuestionIndex(currentQuestionIndex);
      // Don't advance, user needs to click "Try Again" or "Continue"
    }
  };
  
  const handleTryAgainOrContinueFromExplanation = () => {
    if (showExplanationForQuestionIndex !== null) {
      // Clear selected answer for the current question to force re-selection
      const { [showExplanationForQuestionIndex]: _, ...rest } = selectedAnswers;
      setSelectedAnswers(rest);
      setShowExplanationForQuestionIndex(null); // Hide explanation, user will re-attempt
      // Question remains the same (currentQuestionIndex is not changed yet)
    }
  };

  const advanceToNextQuestionOrSubmit = () => {
    if (currentQuestionIndex < totalQuizQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      finalizeQuiz();
    }
  };
  
  const finalizeQuiz = () => {
    let correctAnswersCount = 0;
    lesson.quiz.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswerIndex) {
        correctAnswersCount++;
      }
    });
    setAnsweredCorrectly(correctAnswersCount);
    const score = totalQuizQuestions > 0 ? Math.round((correctAnswersCount / totalQuizQuestions) * 100) : 100;
    setQuizScore(score);
    setView('results');
    onQuizComplete({
      lessonTitle: lesson.lessonTitle,
      lessonTopic: lessonTopic,
      quizScore: score,
      quizTotalQuestions: totalQuizQuestions,
      questionsAnsweredCorrectly: correctAnswersCount,
      timestamp: new Date().toISOString(),
    });
  };

  const handleRestartLessonInternal = () => {
    setView('lesson');
    setCurrentPageIndex(0);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setQuizScore(0);
    setAnsweredCorrectly(0);
    setShowExplanationForQuestionIndex(null);
    setAttemptedQuestions(new Set());
    onRestartLesson(); 
  };

  const handleUserChoseToRelearn = () => {
     onQuizComplete({ 
      lessonTitle: lesson.lessonTitle,
      lessonTopic: lessonTopic, 
      quizScore: quizScore,
      quizTotalQuestions: totalQuizQuestions,
      questionsAnsweredCorrectly: answeredCorrectly,
      timestamp: new Date().toISOString(),
      choseToRelearn: true,
    });
    handleRestartLessonInternal();
  }

  const handleUserChoseToSkipOrContinue = () => {
     onQuizComplete({ 
      lessonTitle: lesson.lessonTitle,
      lessonTopic: lessonTopic, 
      quizScore: quizScore,
      quizTotalQuestions: totalQuizQuestions,
      questionsAnsweredCorrectly: answeredCorrectly,
      timestamp: new Date().toISOString(),
      choseToRelearn: false, 
    });
    handleRestartLessonInternal();
  }


  if (view === 'lesson') {
    if (!currentLessonPage) {
        return (
            <Card className={cn("w-full shadow-xl", themeClass)}>
                <CardHeader><CardTitle className="text-2xl text-destructive">Error</CardTitle></CardHeader>
                <CardContent><p>Could not load lesson page. Please try generating the lesson again.</p></CardContent>
            </Card>
        );
    }
    return (
      <Card className={cn("w-full shadow-xl transition-all duration-300 flex flex-col", themeClass)}>
        <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="h-8 w-8 text-primary" />
              <CardTitle className="text-3xl text-primary">{lesson.lessonTitle}</CardTitle>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1"><Layers className="h-4 w-4" /><span>Subject: <strong>{lesson.subject}</strong></span></div>
                <div className="flex items-center gap-1"><Type className="h-4 w-4" /><span>Format: <strong>{lesson.lessonFormat}</strong></span></div>
                {childProfile?.theme && (<div className="flex items-center gap-1"><Palette className="h-4 w-4" /><span>Theme: <strong>{childProfile.theme}</strong></span></div>)}
            </div>
        </CardHeader>
        
        <CardContent className={cn("flex-grow flex flex-col items-center justify-center p-4 md:p-6 space-y-4", fontClass)}>
            <div className="w-full aspect-video bg-muted/50 rounded-lg overflow-hidden flex items-center justify-center mb-4 shadow-inner max-h-[400px]">
            {currentLessonPage.imageDataUri ? (
                <Image src={currentLessonPage.imageDataUri} alt={`Illustration page ${currentPageIndex + 1}`} width={500} height={281} className="object-contain w-full h-full" priority={true}/>
            ) : (
                <div className="text-center text-destructive p-4"><ImageOff className="h-16 w-16 mx-auto mb-2" /><p className="text-sm">Image not available.</p></div>
            )}
            </div>
            
            <div className={cn("text-center min-h-[4em]", fontClass, themeClass === 'dark-theme-lesson' ? 'text-slate-200' : 'text-foreground')}>
            {currentLessonPage.sentences.map((sentence, sIdx) => (<p key={sIdx} className={sIdx > 0 ? "mt-1" : ""}>{sentence}</p>))}
            {currentLessonPage.sentences.length === 0 && <p>Loading content...</p>}
            </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row items-center justify-between p-4 border-t">
            <p className="text-sm text-muted-foreground mb-2 sm:mb-0">Page {currentPageIndex + 1} of {totalLessonPages}</p>
            <div className="flex gap-2">
            <Button onClick={handlePreviousPage} disabled={currentPageIndex === 0} variant="outline" size="lg"><ChevronLeft className="mr-2 h-5 w-5" /> Previous</Button>
            <Button onClick={handleNextPage} variant="default" size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                {currentPageIndex === totalLessonPages - 1 ? (totalQuizQuestions > 0 ? 'Start Quiz' : 'Finish Lesson') : 'Next'}
                {currentPageIndex < totalLessonPages - 1 && <ChevronRight className="ml-2 h-5 w-5" />}
            </Button>
            </div>
        </CardFooter>
        <style jsx global>{`
        .dark-theme-lesson { background-color: #2d3748; color: #e2e8f0; }
        .dark-theme-lesson .text-primary { color: var(--primary); }
        .dark-theme-lesson .text-muted-foreground { color: #a0aec0; }
        .colorful-theme-lesson { background: linear-gradient(135deg, hsl(var(--primary) / 0.2), hsl(var(--accent) / 0.2)); color: #333; }
        .colorful-theme-lesson .text-primary { color: hsl(var(--primary)); }
        .colorful-theme-lesson .text-muted-foreground { color: hsl(var(--foreground) / 0.7); }
        .simple-theme-lesson { background-color: #fff; color: #1a202c; border: 1px solid #e2e8f0; }
        .simple-theme-lesson .text-primary { color: hsl(var(--primary)); }
        .simple-theme-lesson .text-muted-foreground { color: hsl(var(--muted-foreground)); }
      `}</style>
      </Card>
    );
  }

  if (view === 'quiz' && currentQuizQuestion) {
    const isExplanationVisible = showExplanationForQuestionIndex === currentQuestionIndex;
    const hasSelectedAnswer = selectedAnswers[currentQuestionIndex] !== undefined;

    return (
      <Card className={cn("w-full shadow-xl", themeClass)}>
        <CardHeader>
          <CardTitle className="text-2xl text-primary">Quiz Time: {lesson.lessonTitle}</CardTitle>
          <p className="text-muted-foreground">Question {currentQuestionIndex + 1} of {totalQuizQuestions}</p>
          <Progress value={((currentQuestionIndex + 1) / totalQuizQuestions) * 100} className="w-full mt-2" />
        </CardHeader>
        <CardContent className={cn("p-4 md:p-6 space-y-6", fontClass)}>
          <p className="font-semibold text-lg">{currentQuizQuestion.questionText}</p>
          <RadioGroup
            value={selectedAnswers[currentQuestionIndex]?.toString()}
            onValueChange={(value) => handleAnswerSelection(currentQuestionIndex, parseInt(value))}
            className="space-y-2"
            disabled={isExplanationVisible} // Disable options when showing explanation
          >
            {currentQuizQuestion.options.map((option, idx) => (
              <div 
                key={idx} 
                className={cn(
                  "flex items-center space-x-2 p-3 border rounded-md hover:bg-muted/50 transition-colors cursor-pointer has-[input:checked]:bg-secondary has-[input:checked]:border-primary",
                  isExplanationVisible && selectedAnswers[currentQuestionIndex] === idx && selectedAnswers[currentQuestionIndex] !== currentQuizQuestion.correctAnswerIndex && "bg-destructive/20 border-destructive", // Highlight incorrect selection
                  isExplanationVisible && idx === currentQuizQuestion.correctAnswerIndex && "bg-green-500/20 border-green-600" // Highlight correct answer
                )}
              >
                <RadioGroupItem value={idx.toString()} id={`q${currentQuestionIndex}-opt${idx}`} disabled={isExplanationVisible} />
                <Label htmlFor={`q${currentQuestionIndex}-opt${idx}`} className="flex-1 cursor-pointer text-base">{option}</Label>
                {isExplanationVisible && selectedAnswers[currentQuestionIndex] === idx && selectedAnswers[currentQuestionIndex] !== currentQuizQuestion.correctAnswerIndex && <X className="h-5 w-5 text-destructive" />}
                {isExplanationVisible && idx === currentQuizQuestion.correctAnswerIndex && <Check className="h-5 w-5 text-green-600" />}
              </div>
            ))}
          </RadioGroup>

          {isExplanationVisible && (
            <div className="mt-4 p-4 bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700 rounded-md shadow">
              <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-300 mb-2 flex items-center">
                <HelpCircle className="h-5 w-5 mr-2"/> Let's understand this!
              </h3>
              <p className="text-sm text-blue-600 dark:text-blue-200 mb-1">
                The correct answer is: <strong>{currentQuizQuestion.options[currentQuizQuestion.correctAnswerIndex]}</strong>
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-200">
                {currentQuizQuestion.explanation}
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end p-4 border-t">
          {isExplanationVisible ? (
             <Button onClick={handleTryAgainOrContinueFromExplanation} size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                Try Again <RotateCcw className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmitAnswer} disabled={!hasSelectedAnswer} size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
              {currentQuestionIndex === totalQuizQuestions - 1 && attemptedQuestions.size === totalQuizQuestions -1 ? 'Submit Quiz' : 'Check Answer'} <Send className="ml-2 h-4 w-4" />
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  }


  if (view === 'results') {
    const isSuccess = quizScore >= 60;
    return (
      <Card className={cn("w-full shadow-xl text-center", themeClass)}>
        <CardHeader>
          <CardTitle className="text-3xl text-primary">Quiz Results!</CardTitle>
        </CardHeader>
        <CardContent className={cn("p-6 space-y-4", fontClass)}>
          {totalQuizQuestions > 0 ? (
            isSuccess ? <CheckCircle className="h-20 w-20 text-green-500 mx-auto" /> : <AlertTriangle className="h-20 w-20 text-destructive mx-auto" />
          ) : <BookOpen className="h-20 w-20 text-primary mx-auto" /> }

          {totalQuizQuestions > 0 && (
            <>
                <p className="text-4xl font-bold">Your Score: {quizScore}%</p>
                <p className="text-muted-foreground">You answered {answeredCorrectly} out of {totalQuizQuestions} questions correctly.</p>
            </>
          )}
          {totalQuizQuestions === 0 && (
             <p className="text-xl text-green-600 mt-4">Lesson completed!</p>
          )}
          
          {!isSuccess && totalQuizQuestions > 0 && (
            <div className="mt-6 p-4 bg-muted/50 rounded-md">
              <p className="mb-3 text-lg">It looks like this topic was a bit tricky!</p>
              <p className="mb-3">Would you like to try learning this topic again?</p>
              <div className="flex gap-4 justify-center">
                <Button onClick={handleUserChoseToRelearn} variant="default" size="lg" className="bg-primary text-primary-foreground">
                  <RotateCcw className="mr-2 h-5 w-5"/> Learn Again
                </Button>
                <Button onClick={handleUserChoseToSkipOrContinue} variant="outline" size="lg">
                  Skip for Now
                </Button>
              </div>
            </div>
          )}
          {(isSuccess || totalQuizQuestions === 0) && (
             <Button onClick={handleUserChoseToSkipOrContinue} variant="default" size="lg" className="mt-6 bg-accent text-accent-foreground hover:bg-accent/90">
                Finish Lesson
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }
  
  return <Card><CardContent>Loading lesson display...</CardContent></Card>;
}
