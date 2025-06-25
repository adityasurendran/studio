// src/components/lesson-display.tsx
"use client";

import type { GeneratedLesson, ChildProfile, LessonPage, QuizQuestion, LessonAttempt } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { BookOpen, Layers, Type, Palette, ChevronLeft, ChevronRight, ImageOff, CheckCircle, AlertTriangle, RotateCcw, Send, HelpCircle, Check, X, PartyPopper, Award, Brain, Volume2, StopCircle, Printer, Loader2, Activity } from 'lucide-react'; 
import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { recommendNextLesson, type RecommendNextLessonInput } from '@/ai/flows/recommend-next-lesson';
import { formatDistanceToNow } from 'date-fns';
import { useUsageTracker } from '@/hooks/use-usage-tracker';
import { formatLessonHistorySummary } from '@/lib/lesson-summary';

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

  const { startSession, endSession } = useUsageTracker();
  
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingTextIdentifier, setSpeakingTextIdentifier] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const [nextRecommendedTopic, setNextRecommendedTopic] = useState<string | null>(null);
  const [isFetchingRecommendation, setIsFetchingRecommendation] = useState(false);


  useEffect(() => {
    if (childProfile) {
      startSession(childProfile.id);
    }

    setView('lesson');
    setCurrentPageIndex(0);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setQuizScore(0);
    setAnsweredCorrectly(0);
    setShowExplanationForQuestionIndex(null);
    setAttemptedQuestions(new Set());
    setNextRecommendedTopic(null);
    setIsFetchingRecommendation(false);
    
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      setSpeakingTextIdentifier(null);
      if (childProfile) {
        endSession(childProfile.id);
      }
    };
  }, [lesson, childProfile]);

  useEffect(() => {
    if (view === 'results' && quizScore >= 60 && childProfile && childProfile.lessonAttempts && childProfile.lessonAttempts.length > 0 && !isFetchingRecommendation && !nextRecommendedTopic) {
      const fetchRecommendation = async () => {
        setIsFetchingRecommendation(true);
        try {
          const historySummary = formatLessonHistorySummary(childProfile.lessonAttempts);
          const input: RecommendNextLessonInput = {
            childAge: childProfile.age,
            interests: childProfile.interests,
            learningDifficulties: childProfile.learningDifficulties,
            curriculum: childProfile.curriculum,
            lessonHistorySummary: historySummary,
            learningStyle: childProfile.learningStyle || 'balanced_mixed',
          };
          const result = await recommendNextLesson(input);
          if (result && result.recommendedTopic) {
            setNextRecommendedTopic(result.recommendedTopic);
          } else {
            setNextRecommendedTopic(null);
          }
        } catch (error: any) {
          console.error("Error fetching next lesson recommendation:", error);
          toast({
            title: "Recommendation Error",
            description: "Could not fetch next lesson suggestion.",
            variant: "destructive"
          });
          setNextRecommendedTopic(null);
        } finally {
          setIsFetchingRecommendation(false);
        }
      };
      fetchRecommendation();
    }
    // Reset recommendation if view changes from results or quiz score is not good
    if (view !== 'results' || quizScore < 60) {
      setNextRecommendedTopic(null);
    }
  }, [view, quizScore, childProfile, isFetchingRecommendation, nextRecommendedTopic, toast]);

  useEffect(() => {
    // Show a toast if any lesson page is missing an image and a 429 error is likely (rate limit)
    if (lesson.lessonPages.some(page => !page.imageDataUri)) {
      // This is a heuristic; ideally, you'd check for a 429 error flag on the page object
      toast({
        title: "Image Generation Rate Limit",
        description: "You've made too many image requests. Please wait a few minutes and try again.",
        variant: "destructive"
      });
    }
  }, [lesson.lessonPages, toast]);

  const handleSpeak = useCallback((textToSpeak: string, identifier: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (isSpeaking && speakingTextIdentifier === identifier) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setSpeakingTextIdentifier(null);
      return;
    }
    
    if (isSpeaking) {
        window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = childProfile?.language || 'en';
    utterance.onstart = () => {
        setIsSpeaking(true);
        setSpeakingTextIdentifier(identifier);
    };
    utterance.onend = () => {
        setIsSpeaking(false);
        setSpeakingTextIdentifier(null);
    };
    utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error);
        setIsSpeaking(false);
        setSpeakingTextIdentifier(null);
        toast({ title: "Speech Error", description: `Could not play audio: ${event.error}`, variant: "destructive"});
    }
    window.speechSynthesis.speak(utterance);
  }, [childProfile?.language, isSpeaking, speakingTextIdentifier, toast]);


  const themeClass = childProfile?.theme === 'dark' ? 'dark-theme-lesson' : 
                     childProfile?.theme === 'colorful' ? 'colorful-theme-lesson' :
                     childProfile?.theme === 'simple' ? 'simple-theme-lesson' :
                     '';
  
  let fontClass = 'text-base md:text-lg'; 
  if (childProfile?.fontSizePreference === 'small') {
    fontClass = 'text-sm md:text-base';
  } else if (childProfile?.fontSizePreference === 'large') {
    fontClass = 'text-lg md:text-xl';
  }


  const totalLessonPages = lesson.lessonPages.length;
  const currentLessonPage: LessonPage | undefined = lesson.lessonPages[currentPageIndex];
  
  const totalQuizQuestions = lesson.quiz?.length || 0;
  const currentQuizQuestion: QuizQuestion | undefined = lesson.quiz?.[currentQuestionIndex];

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        setSpeakingTextIdentifier(null);
    }
  }, []);


  const handleNextPage = () => {
    stopSpeaking();
    if (currentPageIndex < totalLessonPages - 1) {
      setCurrentPageIndex(prev => prev + 1);
    } else {
      if (totalQuizQuestions > 0) {
        setView('quiz');
      } else {
        // If no quiz, lesson is complete. Call onQuizComplete with 100% score.
        onQuizComplete({ 
            lessonTitle: lesson.lessonTitle, 
            lessonTopic: lessonTopic,
            subject: lesson.subject, // Add subject here
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
    stopSpeaking();
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
    stopSpeaking();
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
    stopSpeaking();
    if (showExplanationForQuestionIndex !== null) {
      setShowExplanationForQuestionIndex(null); 
      // Do not advance, let user try the same question again or submit if they want
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
    // onQuizComplete is called from the results view buttons to include choseToRelearn status
  };

  const handleRestartLessonInternal = () => {
    stopSpeaking();
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

  const handlePrintLesson = () => {
    if (typeof window === 'undefined') return;

    let printContent = `<html><head><title>${lesson.lessonTitle}</title>`;
    printContent += `<style>
      body { font-family: sans-serif; margin: 20px; line-height: 1.6; }
      h1 { color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px; text-align: center; }
      .page-content { margin-bottom: 30px; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;}
      .page-number { font-style: italic; color: #777; text-align: right; font-size: 0.9em; margin-bottom: 5px; }
      .sentence { margin-bottom: 10px; font-size: 1.1em; }
      .image-placeholder { text-align: center; color: #aaa; border: 1px dashed #ccc; padding: 20px; margin-top: 15px; border-radius: 5px; }
      @media print {
        body { margin: 0.5in; }
        .page-content { border: 1px solid #ccc; background-color: #fff; page-break-inside: avoid; }
        img { max-width: 100% !important; height: auto !important; display: block; margin: 10px auto; page-break-inside: avoid; }
        .no-print { display: none !important; }
      }
    </style></head><body>`;
    printContent += `<h1>${lesson.lessonTitle}</h1>`;
    printContent += `<h2>Subject: ${lesson.subject}</h2>`;
    
    lesson.lessonPages.forEach((page, index) => {
      printContent += `<div class="page-content">`;
      printContent += `<p class="page-number">Page ${index + 1}</p>`;
      page.sentences.forEach(sentence => {
        printContent += `<p class="sentence">${sentence}</p>`;
      });
      if (page.imageDataUri) {
         printContent += `<div class="image-placeholder">[Image was present for this page]</div>`;
      } else if(lesson.lessonFormat !== "Custom Text-Based Lesson") {
         printContent += `<div class="image-placeholder">[No image generated for this page]</div>`;
      }
      printContent += `</div>`;
    });

    if (lesson.quiz && lesson.quiz.length > 0) {
      printContent += `<h2>Quiz Questions</h2>`;
      lesson.quiz.forEach((q, qIndex) => {
        printContent += `<div class="page-content">`;
        printContent += `<p class="page-number">Quiz Question ${qIndex + 1}</p>`;
        printContent += `<p class="sentence"><strong>${q.questionText}</strong></p>`;
        printContent += `<ul>`;
        q.options.forEach((opt, optIndex) => {
          printContent += `<li>${String.fromCharCode(65 + optIndex)}. ${opt}</li>`;
        });
        printContent += `</ul>`;
        printContent += `<p class="sentence"><em>Correct Answer: ${String.fromCharCode(65 + q.correctAnswerIndex)}. ${q.options[q.correctAnswerIndex]}</em></p>`;
        printContent += `<p class="sentence"><em>Explanation: ${q.explanation}</em></p>`;
        printContent += `</div>`;
      });
    }

    printContent += `</body></html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        try {
            printWindow.print();
        } catch (e) {
            console.error("Error printing:", e);
            toast({ title: "Print Error", description: "Could not initiate printing.", variant: "destructive" });
        }
      }, 500); 
    } else {
      toast({
        title: "Print Error",
        description: "Could not open print window. Please check your browser's pop-up settings.",
        variant: "destructive"
      });
    }
  };


  if (view === 'lesson') {
    if (!currentLessonPage) {
        return (
            <Card className={cn("w-full shadow-xl border-t-4 border-destructive", themeClass)}>
                <CardHeader><CardTitle className="text-2xl text-destructive">Error Loading Page</CardTitle></CardHeader>
                <CardContent><p>Could not load this lesson page. Please try generating the lesson again or contact support.</p></CardContent>
            </Card>
        );
    }
    const lessonPageSentences = currentLessonPage.sentences.join(' ');
    const lessonPageIdentifier = `lesson-page-${currentPageIndex}`;
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
        
        <CardContent className={cn("flex-grow flex flex-col items-center justify-start p-4 md:p-6 space-y-4")}>
            <div className="w-full aspect-[16/10] bg-muted/30 rounded-lg overflow-hidden flex items-center justify-center mb-4 shadow-inner border max-h-[450px]">
            {currentLessonPage.imageDataUri ? (
                <Image src={currentLessonPage.imageDataUri} alt={`Illustration for page ${currentPageIndex + 1}`} width={600} height={375} className="object-contain w-full h-full" priority={currentPageIndex < 2}/>
            ) : (
                <div className="text-center text-muted-foreground p-4 flex flex-col items-center justify-center h-full">
                    <ImageOff className="h-20 w-20 mx-auto mb-2" />
                    <p className="text-lg font-medium">Image not displayed for this page.</p>
                    {lesson.lessonFormat === "Custom Text-Based Lesson" ?
                        <p className="text-sm">Custom lessons do not include AI-generated images.</p> :
                        <p className="text-sm">This might be due to content filters or a generation issue.</p>
                    }
                </div>
            )}
            </div>
            
            <div className={cn("text-center min-h-[5em] w-full bg-card p-4 rounded-md shadow relative", fontClass, "text-gray-900")}>
              {currentLessonPage.sentences.map((sentence, sIdx) => (<p key={sIdx} className={cn("leading-relaxed", sIdx > 0 ? "mt-2" : "")}>{sentence}</p>))}
              {currentLessonPage.sentences.length === 0 && <p>Loading content...</p>}
              {lessonPageSentences.trim() && (
                  <Button 
                    onClick={() => handleSpeak(lessonPageSentences, lessonPageIdentifier)} 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-2 right-2 text-primary hover:text-accent" 
                    aria-label={isSpeaking && speakingTextIdentifier === lessonPageIdentifier ? "Stop reading" : "Read aloud"}
                  >
                    {isSpeaking && speakingTextIdentifier === lessonPageIdentifier ? <StopCircle className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
                  </Button>
              )}
            </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row items-center justify-between p-4 border-t gap-3">
            <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">Page {currentPageIndex + 1} of {totalLessonPages}</p>
                <Button variant="outline" size="sm" onClick={handlePrintLesson} className="shadow-sm hover:shadow-md">
                    <Printer className="mr-1.5 h-4 w-4" /> Print Lesson
                </Button>
            </div>
            <div className="flex gap-3">
            <Button onClick={handlePreviousPage} disabled={currentPageIndex === 0} variant="outline" size="lg" className="shadow-sm hover:shadow-md transition-shadow"><ChevronLeft className="mr-2 h-5 w-5" /> Previous</Button>
            <Button onClick={handleNextPage} variant="default" size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-md hover:shadow-lg transition-all transform hover:scale-105">
                {currentPageIndex === totalLessonPages - 1 ? (totalQuizQuestions > 0 ? 'Start Quiz' : 'Finish Lesson') : 'Next Page'}
                {currentPageIndex < totalLessonPages - 1 && <ChevronRight className="ml-2 h-5 w-5" />}
            </Button>
            </div>
        </CardFooter>
        <style jsx global>{`
        .dark-theme-lesson { background-color: hsl(var(--background)); color: hsl(var(--foreground)); } 
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
    const questionTextIdentifier = `quiz-question-${currentQuestionIndex}`;
    const explanationTextIdentifier = `quiz-explanation-${currentQuestionIndex}`;

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
          <div className="relative">
            <p className="font-semibold text-xl md:text-2xl leading-tight pr-10">{currentQuizQuestion.questionText}</p>
            {currentQuizQuestion.questionText.trim() && (
                 <Button 
                    onClick={() => handleSpeak(currentQuizQuestion.questionText, questionTextIdentifier)} 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-0 right-0 text-primary hover:text-accent" 
                    aria-label={isSpeaking && speakingTextIdentifier === questionTextIdentifier ? "Stop reading question" : "Read question aloud"}
                  >
                    {isSpeaking && speakingTextIdentifier === questionTextIdentifier ? <StopCircle className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </Button>
            )}
          </div>
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
              <CardHeader className="p-0 pb-2 mb-2 border-b border-blue-300 dark:border-blue-700 relative">
                <CardTitle className="text-xl font-semibold text-blue-700 dark:text-blue-300 flex items-center pr-10">
                  <HelpCircle className="h-6 w-6 mr-2"/> Let&apos;s understand this!
                </CardTitle>
                {currentQuizQuestion.explanation.trim() && (
                    <Button 
                        onClick={() => handleSpeak(currentQuizQuestion.explanation, explanationTextIdentifier)} 
                        variant="ghost" 
                        size="icon" 
                        className="absolute top-0 right-0 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                        aria-label={isSpeaking && speakingTextIdentifier === explanationTextIdentifier ? "Stop reading explanation" : "Read explanation aloud"}
                    >
                        {isSpeaking && speakingTextIdentifier === explanationTextIdentifier ? <StopCircle className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </Button>
                )}
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
    const currentAttemptData = {
        lessonTitle: lesson.lessonTitle,
        lessonTopic: lessonTopic,
        subject: lesson.subject, // Add subject here
        quizScore: quizScore,
        quizTotalQuestions: totalQuizQuestions,
        questionsAnsweredCorrectly: answeredCorrectly,
        timestamp: new Date().toISOString(),
    };

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
          
          {/* Kinesthetic Activities Section */}
          {lesson.kinestheticActivities && lesson.kinestheticActivities.length > 0 && (
            <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-700 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <Activity className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <h3 className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  Hands-On Activities for {childProfile?.name || 'You'}!
                </h3>
              </div>
              <p className="text-blue-600 dark:text-blue-200 mb-4 text-lg">
                Here are some fun activities you can do to learn more about <strong>{lessonTopic}</strong> through movement and hands-on exploration:
              </p>
              <div className="space-y-3">
                {lesson.kinestheticActivities.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-600 shadow-sm">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                      {index + 1}
                    </div>
                    <p className="text-gray-700 dark:text-gray-200 leading-relaxed">{activity}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-800/30 rounded-lg border border-blue-300 dark:border-blue-600">
                <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                  💡 Tip: These activities are designed to help you learn through movement and touch. 
                  Try them with a parent or friend for extra fun!
                </p>
              </div>
            </div>
          )}
          
           {/* Main action button area */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            {isFetchingRecommendation && quizScore >= 60 && (
              <Button variant="default" size="lg" className="bg-accent text-accent-foreground" disabled>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Fetching Next Suggestion...
              </Button>
            )}

            {!isFetchingRecommendation && nextRecommendedTopic && quizScore >= 60 && (
              <Button
                onClick={() => {
                  onQuizComplete({ ...currentAttemptData, choseToRelearn: false });
                  router.push(`/dashboard/lessons/new?topic=${encodeURIComponent(nextRecommendedTopic)}`);
                }}
                variant="default"
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white shadow-lg hover:scale-105"
              >
                Next Lesson: {nextRecommendedTopic.substring(0, 25)}{nextRecommendedTopic.length > 25 ? '...' : ''} <ChevronRight className="ml-2 h-5 w-5"/>
              </Button>
            )}
            
            {/* Fallback / default continue button if no specific next topic or still fetching (and quiz was good) or no quiz*/}
            {(!(isFetchingRecommendation || (nextRecommendedTopic && quizScore >= 60)) && (isSuccess || totalQuizQuestions === 0)) && (
                <Button 
                    onClick={() => {
                        onQuizComplete({ ...currentAttemptData, choseToRelearn: false });
                        onRestartLesson();
                    }} 
                    variant="default" size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg">
                    {totalQuizQuestions > 0 ? 'Generate New Lesson' : 'Back to Dashboard'} <ChevronRight className="ml-2 h-5 w-5"/>
                </Button>
            )}
          </div>

          {/* For poor scores, offer relearn or different topic */}
          {!isSuccess && totalQuizQuestions > 0 && (
            <div className="mt-6 p-4 bg-secondary/50 rounded-lg shadow-sm border">
              <p className="mb-3 text-lg text-foreground">This topic might need a little more review.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  onClick={() => {
                    onQuizComplete({ ...currentAttemptData, choseToRelearn: true });
                    handleRestartLessonInternal(); // This resets the form for the same topic
                  }} 
                  variant="default" size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <RotateCcw className="mr-2 h-5 w-5"/> Learn This Topic Again
                </Button>
                <Button 
                  onClick={() => {
                    onQuizComplete({ ...currentAttemptData, choseToRelearn: false });
                    onRestartLesson(); // This clears form for a new topic
                  }} 
                  variant="outline" size="lg"
                >
                  Choose a Different Topic
                </Button>
              </div>
            </div>
          )}

        </CardContent>
      </Card>
    );
  }
  
  return <Card className="border-t-4 border-muted"><CardContent className="p-6">Loading lesson content...</CardContent></Card>;
}

