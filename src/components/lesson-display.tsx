// src/components/lesson-display.tsx
"use client";

import type { GeneratedLesson, ChildProfile, LessonPage, QuizQuestion, LessonAttempt } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { BookOpen, Layers, Type, Palette, ChevronLeft, ChevronRight, ImageOff, CheckCircle, AlertTriangle, RotateCcw, Send, HelpCircle, Check, X, PartyPopper, Award, Brain, Volume2, StopCircle } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';

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
  const [isSpeaking, setIsSpeaking] = useState(false);

  const cleanupSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  useEffect(() => {
    // Reset state when lesson changes
    setView('lesson');
    setCurrentPageIndex(0);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setQuizScore(0);
    setAnsweredCorrectly(0);
    setShowExplanationForQuestionIndex(null);
    setAttemptedQuestions(new Set());
    cleanupSpeech();

    // Cleanup speech synthesis when component unmounts or lesson changes
    return () => {
      cleanupSpeech();
    };
  }, [lesson, cleanupSpeech]);

  const themeClass = childProfile?.theme === 'dark' ? 'dark-theme-lesson' : 
                     childProfile?.theme === 'colorful' ? 'colorful-theme-lesson' :
                     childProfile?.theme === 'simple' ? 'simple-theme-lesson' :
                     '';
  
  let fontClass = 'text-base md:text-lg'; // Default medium
  if (childProfile?.fontSizePreference === 'small') {
    fontClass = 'text-sm md:text-base';
  } else if (childProfile?.fontSizePreference === 'large') {
    fontClass = 'text-lg md:text-xl';
  }


  const totalLessonPages = lesson.lessonPages.length;
  const currentLessonPage: LessonPage | undefined = lesson.lessonPages[currentPageIndex];
  
  const totalQuizQuestions = lesson.quiz?.length || 0;
  const currentQuizQuestion: QuizQuestion | undefined = lesson.quiz?.[currentQuestionIndex];

  const handleSpeak = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !currentLessonPage) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const sentencesToSpeak = currentLessonPage.sentences.join(' ');
    const utterance = new SpeechSynthesisUtterance(sentencesToSpeak);
    utterance.lang = childProfile?.language || 'en-US';
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleNextPage = () => {
    cleanupSpeech();
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
    cleanupSpeech();
    if (currentPageIndex > 0) {
      setCurrentPageIndex(prev => prev - 1);
    }
  };

  const handleAnswerSelection = (questionIdx: number, optionIdx: number) => {
    setSelectedAnswers(prev => ({ ...prev, [questionIdx]: optionIdx }));
    if (showExplanationForQuestionIndex === questionIdx) {
      setShowExplanationForQuestionIndex(null);
    }
  };

  const handleSubmitAnswer = () => {
    if (currentQuizQuestion === undefined || selectedAnswers[currentQuestionIndex] === undefined) return;

    const isCorrect = selectedAnswers[currentQuestionIndex] === currentQuizQuestion.correctAnswerIndex;
    
    if (isCorrect) {
      setShowExplanationForQuestionIndex(null); 
      setAttemptedQuestions(prev => new Set(prev).add(currentQuestionIndex)); 
      advanceToNextQuestionOrSubmit();
    } else {
      setShowExplanationForQuestionIndex(currentQuestionIndex);
    }
  };
  
  const handleTryAgainOrContinueFromExplanation = () => {
    if (showExplanationForQuestionIndex !== null) {
      const { [showExplanationForQuestionIndex]: _, ...rest } = selectedAnswers;
      setSelectedAnswers(rest); // Clear selection for this question
      setShowExplanationForQuestionIndex(null); 
      // Don't advance, let them try again on the same question.
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
    cleanupSpeech();
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
            <Card className={cn("w-full shadow-xl border-t-4 border-destructive", themeClass)}>
                <CardHeader><CardTitle className="text-2xl text-destructive">Error Loading Page</CardTitle></CardHeader>
                <CardContent><p>Could not load this lesson page. Please try generating the lesson again or contact support.</p></CardContent>
            </Card>
        );
    }
    return (
      <Card className={cn("w-full shadow-xl transition-all duration-300 flex flex-col border-t-4 border-primary", themeClass)}>
        <CardHeader className="pb-3">
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="h-10 w-10 text-primary" />
              <CardTitle className="text-3xl md:text-4xl font-bold text-primary">{lesson.lessonTitle}</CardTitle>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground border-t pt-3 mt-2">
                <div className="flex items-center gap-1.5"><Layers className="h-4 w-4 text-primary/80" /><span>Subject: <strong>{lesson.subject}</strong></span></div>
                <div className="flex items-center gap-1.5"><Type className="h-4 w-4 text-primary/80" /><span>Format: <strong>{lesson.lessonFormat}</strong></span></div>
                {childProfile?.theme && (<div className="flex items-center gap-1.5"><Palette className="h-4 w-4 text-primary/80" /><span>Theme: <strong className="capitalize">{childProfile.theme}</strong></span></div>)}
            </div>
        </CardHeader>
        
        <CardContent className={cn("flex-grow flex flex-col items-center justify-start p-4 md:p-6 space-y-4", fontClass)}>
            <div className="w-full aspect-[16/10] bg-muted/30 rounded-lg overflow-hidden flex items-center justify-center mb-4 shadow-inner border max-h-[450px]">
            {currentLessonPage.imageDataUri ? (
                <Image src={currentLessonPage.imageDataUri} alt={`Illustration for page ${currentPageIndex + 1}`} width={600} height={375} className="object-contain w-full h-full" priority={currentPageIndex < 2}/>
            ) : (
                <div className="text-center text-destructive p-4 flex flex-col items-center justify-center h-full">
                    <ImageOff className="h-20 w-20 mx-auto mb-2" />
                    <p className="text-lg font-medium">Image not available for this page.</p>
                    <p className="text-sm">This might be due to content filters or a generation issue.</p>
                </div>
            )}
            </div>
            
            <div className={cn("text-center min-h-[5em] w-full bg-card p-4 rounded-md shadow relative", fontClass, themeClass === 'dark-theme-lesson' ? 'text-slate-100' : 'text-foreground')}>
              {currentLessonPage.sentences.map((sentence, sIdx) => (<p key={sIdx} className={cn("leading-relaxed", sIdx > 0 ? "mt-2" : "")}>{sentence}</p>))}
              {currentLessonPage.sentences.length === 0 && <p>Loading content...</p>}
              <Button onClick={handleSpeak} variant="ghost" size="icon" className="absolute top-2 right-2 text-primary hover:text-accent" aria-label={isSpeaking ? "Stop reading" : "Read aloud"}>
                {isSpeaking ? <StopCircle className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
              </Button>
            </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row items-center justify-between p-4 border-t gap-3">
            <p className="text-sm text-muted-foreground">Page {currentPageIndex + 1} of {totalLessonPages}</p>
            <div className="flex gap-3">
            <Button onClick={handlePreviousPage} disabled={currentPageIndex === 0} variant="outline" size="lg" className="shadow-sm hover:shadow-md transition-shadow"><ChevronLeft className="mr-2 h-5 w-5" /> Previous</Button>
            <Button onClick={handleNextPage} variant="default" size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-md hover:shadow-lg transition-all transform hover:scale-105">
                {currentPageIndex === totalLessonPages - 1 ? (totalQuizQuestions > 0 ? 'Start Quiz' : 'Finish Lesson') : 'Next Page'}
                {currentPageIndex < totalLessonPages - 1 && <ChevronRight className="ml-2 h-5 w-5" />}
            </Button>
            </div>
        </CardFooter>
        <style jsx global>{`
        .dark-theme-lesson { background-color: hsl(var(--background)); color: hsl(var(--foreground)); } /* Use theme vars */
        .dark-theme-lesson .text-primary { color: hsl(var(--primary)); }
        .dark-theme-lesson .text-muted-foreground { color: hsl(var(--muted-foreground)); }
        .colorful-theme-lesson { background: linear-gradient(135deg, hsl(var(--primary) / 0.1), hsl(var(--accent) / 0.1)); color: hsl(var(--foreground)); }
        .colorful-theme-lesson .text-primary { color: hsl(var(--primary)); }
        .simple-theme-lesson { background-color: hsl(var(--card)); color: hsl(var(--card-foreground)); border-color: hsl(var(--border)); }
      `}</style>
      </Card>
    );
  }

  if (view === 'quiz' && currentQuizQuestion) {
    const isExplanationVisible = showExplanationForQuestionIndex === currentQuestionIndex;
    const hasSelectedAnswer = selectedAnswers[currentQuestionIndex] !== undefined;

    return (
      <Card className={cn("w-full shadow-xl border-t-4 border-accent", themeClass)}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <Brain className="h-10 w-10 text-accent" />
            <CardTitle className="text-3xl md:text-4xl font-bold text-accent">Quiz Time: {lesson.lessonTitle}</CardTitle>
          </div>
          <p className="text-muted-foreground mt-2">Question {currentQuestionIndex + 1} of {totalQuizQuestions}</p>
          <Progress value={((currentQuestionIndex + 1) / totalQuizQuestions) * 100} className="w-full mt-3 h-3" />
        </CardHeader>
        <CardContent className={cn("p-4 md:p-6 space-y-6", fontClass)}>
          <p className="font-semibold text-xl md:text-2xl leading-tight">{currentQuizQuestion.questionText}</p>
          <RadioGroup
            value={selectedAnswers[currentQuestionIndex]?.toString()}
            onValueChange={(value) => handleAnswerSelection(currentQuestionIndex, parseInt(value))}
            className="space-y-3"
            disabled={isExplanationVisible}
          >
            {currentQuizQuestion.options.map((option, idx) => (
              <Label
                key={idx} 
                htmlFor={`q${currentQuestionIndex}-opt${idx}`}
                className={cn(
                  "flex items-center space-x-3 p-4 border-2 rounded-lg hover:border-primary/70 transition-all cursor-pointer text-base md:text-lg",
                  selectedAnswers[currentQuestionIndex] === idx ? "border-primary bg-primary/10" : "border-input bg-card",
                  isExplanationVisible && selectedAnswers[currentQuestionIndex] === idx && selectedAnswers[currentQuestionIndex] !== currentQuizQuestion.correctAnswerIndex && "border-destructive bg-destructive/10 text-destructive", 
                  isExplanationVisible && idx === currentQuizQuestion.correctAnswerIndex && "border-green-600 bg-green-500/10 text-green-700 dark:text-green-400",
                  isExplanationVisible && "cursor-default opacity-80"
                )}
              >
                <RadioGroupItem value={idx.toString()} id={`q${currentQuestionIndex}-opt${idx}`} disabled={isExplanationVisible} className="h-5 w-5"/>
                <span className="flex-1">{option}</span>
                {isExplanationVisible && selectedAnswers[currentQuestionIndex] === idx && selectedAnswers[currentQuestionIndex] !== currentQuizQuestion.correctAnswerIndex && <X className="h-6 w-6 text-destructive flex-shrink-0" />}
                {isExplanationVisible && idx === currentQuizQuestion.correctAnswerIndex && <Check className="h-6 w-6 text-green-600 flex-shrink-0" />}
              </Label>
            ))}
          </RadioGroup>

          {isExplanationVisible && (
            <Card className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-400 dark:border-blue-600 rounded-lg shadow-md">
              <CardHeader className="p-0 pb-2 mb-2 border-b border-blue-300 dark:border-blue-700">
                <CardTitle className="text-xl font-semibold text-blue-700 dark:text-blue-300 flex items-center">
                  <HelpCircle className="h-6 w-6 mr-2"/> Let&apos;s understand this!
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 text-sm md:text-base text-blue-600 dark:text-blue-200 space-y-2">
                <p>
                  The correct answer is: <strong className="font-semibold">{currentQuizQuestion.options[currentQuizQuestion.correctAnswerIndex]}</strong>
                </p>
                <p className="leading-relaxed">{currentQuizQuestion.explanation}</p>
              </CardContent>
            </Card>
          )}
        </CardContent>
        <CardFooter className="flex justify-end p-4 border-t">
          {isExplanationVisible ? (
             <Button onClick={handleTryAgainOrContinueFromExplanation} size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg transition-all transform hover:scale-105">
                Try Again <RotateCcw className="ml-2 h-5 w-5" />
            </Button>
          ) : (
            <Button onClick={handleSubmitAnswer} disabled={!hasSelectedAnswer} size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-md hover:shadow-lg transition-all transform hover:scale-105">
              {currentQuestionIndex === totalQuizQuestions - 1 && attemptedQuestions.size === totalQuizQuestions -1 ? 'Submit Quiz' : 'Check Answer'} <Send className="ml-2 h-5 w-5" />
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  }


  if (view === 'results') {
    const isSuccess = quizScore >= 60;
    return (
      <Card className={cn("w-full shadow-xl text-center border-t-4", themeClass, isSuccess ? "border-green-500" : "border-destructive")}>
        <CardHeader className="pb-2 pt-8">
          <CardTitle className="text-4xl md:text-5xl font-bold text-primary">
            {totalQuizQuestions > 0 ? "Quiz Results!" : "Lesson Complete!"}
          </CardTitle>
        </CardHeader>
        <CardContent className={cn("p-6 space-y-6", fontClass)}>
          {totalQuizQuestions > 0 ? (
            isSuccess ? (
              <div className="flex flex-col items-center text-green-500">
                <Award className="h-28 w-28 animate-bounce text-green-500" />
                <p className="text-3xl font-semibold mt-4">Great Job, {childProfile?.name || 'Learner'}!</p>
              </div>
            ) : (
              <div className="flex flex-col items-center text-destructive">
                <AlertTriangle className="h-28 w-28 text-destructive" />
                <p className="text-3xl font-semibold mt-4">Keep Practicing!</p>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center text-primary">
              <PartyPopper className="h-28 w-28 text-accent animate-pulse" />
              <p className="text-3xl font-semibold mt-4">Lesson Finished!</p>
            </div>
          )}
          
          {totalQuizQuestions > 0 && (
            <div className="py-4 px-6 bg-card border rounded-lg shadow-inner max-w-sm mx-auto">
                <p className="text-5xl font-bold text-primary">{quizScore}%</p>
                <p className="text-muted-foreground mt-1">You answered {answeredCorrectly} out of {totalQuizQuestions} questions correctly.</p>
            </div>
          )}
          {totalQuizQuestions === 0 && (
             <p className="text-xl text-green-600 mt-4 font-medium">Well done on completing the lesson!</p>
          )}
          
          {!isSuccess && totalQuizQuestions > 0 && (
            <div className="mt-8 p-6 bg-secondary/50 rounded-lg shadow-md border">
              <p className="mb-3 text-xl text-foreground">This topic might need a little more review.</p>
              <p className="mb-4 text-muted-foreground">Would you like to try learning this topic again, or move on?</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={handleUserChoseToRelearn} variant="default" size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg">
                  <RotateCcw className="mr-2 h-5 w-5"/> Learn Again
                </Button>
                <Button onClick={handleUserChoseToSkipOrContinue} variant="outline" size="lg" className="shadow-sm hover:shadow-md">
                  Skip for Now
                </Button>
              </div>
            </div>
          )}
          {(isSuccess || totalQuizQuestions === 0) && (
             <Button onClick={handleUserChoseToSkipOrContinue} variant="default" size="lg" className="mt-8 bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg hover:scale-105 transition-transform py-3 px-8 text-lg">
                {totalQuizQuestions > 0 ? 'Continue Learning' : 'Back to Dashboard'} <ChevronRight className="ml-2 h-5 w-5"/>
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }
  
  return <Card className="border-t-4 border-muted"><CardContent className="p-6 text-center text-muted-foreground">Loading lesson display... Please wait.</CardContent></Card>;
}
