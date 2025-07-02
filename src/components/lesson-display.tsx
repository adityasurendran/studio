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
import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { recommendNextLesson, type RecommendNextLessonInput } from '@/ai/flows/recommend-next-lesson';
import { formatDistanceToNow } from 'date-fns';
import { useUsageTracker } from '@/hooks/use-usage-tracker';
import { formatLessonHistorySummary } from '@/lib/lesson-summary';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

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
    const isFallbackLessonContent = lesson.lessonPages.length === 1 && (
      lesson.lessonPages[0].sentences.length === 1 && (
        lesson.lessonPages[0].sentences[0].includes('default sentence') ||
        lesson.lessonPages[0].sentences[0].includes('unusable')
      )
    );
    return (
      <div className={cn("lesson-display", themeClass)}>
        {/* Curriculum Info Alert */}
        {lesson.curriculumInfo?.isPlaceholder && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>General Knowledge Used</AlertTitle>
            <AlertDescription>
              Curriculum-specific information could not be fetched for this lesson. The lesson is based on general knowledge and may not fully align with the selected curriculum.
            </AlertDescription>
          </Alert>
        )}
        {lesson.curriculumInfo && !lesson.curriculumInfo.isPlaceholder && (
          <Alert className="mb-4">
            <AlertTitle>Curriculum Information</AlertTitle>
            <AlertDescription>
              {lesson.curriculumInfo.summary}
              {lesson.curriculumInfo.sourceHints && lesson.curriculumInfo.sourceHints.length > 0 && (
                <div className="mt-2">
                  <b>Sources:</b> {lesson.curriculumInfo.sourceHints.join(', ')}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
        {/* Fallback Lesson Content Alert */}
        {isFallbackLessonContent && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Fallback Lesson Content</AlertTitle>
            <AlertDescription>
              The lesson content could not be generated as expected. This is a default placeholder. Please try again or adjust the topic.
            </AlertDescription>
          </Alert>
        )}
        {/* Fallback Quiz Alert */}
        {lesson.quiz.length === 0 && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>No Quiz Generated</AlertTitle>
            <AlertDescription>
              The quiz for this lesson could not be generated or was invalid. Please try again or adjust the topic for better results.
            </AlertDescription>
          </Alert>
        )}
        {/* Lesson View */}
        {view === 'lesson' && currentLessonPage && (
          <div className="space-y-4 sm:space-y-6">
            {/* Lesson Header */}
            <div className="text-center space-y-2 sm:space-y-3">
              <div className="flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base text-muted-foreground">
                <Layers className="h-4 w-4" />
                <span>Page {currentPageIndex + 1} of {totalLessonPages}</span>
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary px-2">Lesson Page</h2>
            </div>

            {/* Lesson Content */}
            <Card className="shadow-lg">
              <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                {/* Image Section */}
                {currentLessonPage.imageDataUri && (
                  <div className="relative aspect-video w-full max-w-2xl mx-auto">
                    <Image
                      src={currentLessonPage.imageDataUri}
                      alt="Lesson page illustration"
                      fill
                      className="rounded-lg object-cover shadow-md"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 800px"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm hover:bg-background"
                      onClick={() => handleSpeak(currentLessonPage.sentences.join(' '), `lesson-image-${currentPageIndex}`)}
                    >
                      {isSpeaking && speakingTextIdentifier === `lesson-image-${currentPageIndex}` ? (
                        <StopCircle className="h-4 w-4" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                )}

                {/* Text Content */}
                <div className="space-y-3 sm:space-y-4">
                  {currentLessonPage.sentences.map((sentence, idx) => (
                    <div key={idx} className="flex items-start gap-2 sm:gap-3">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                      <div className="flex-1">
                        <p className={cn("leading-relaxed", fontClass)}>{sentence}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-1 h-8 px-2 text-xs"
                          onClick={() => handleSpeak(sentence, `lesson-sentence-${currentPageIndex}-${idx}`)}
                        >
                          {isSpeaking && speakingTextIdentifier === `lesson-sentence-${currentPageIndex}-${idx}` ? (
                            <StopCircle className="h-3 w-3" />
                          ) : (
                            <Volume2 className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between items-center gap-3 sm:gap-4">
              <Button
                variant="outline"
                onClick={handlePreviousPage}
                disabled={currentPageIndex === 0}
                className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Previous</span>
              </Button>
              
              <div className="flex items-center gap-2 sm:gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePrintLesson}
                  className="h-10 w-10 sm:h-11 sm:w-11"
                  title="Print Lesson"
                >
                  <Printer className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onRestartLesson}
                  className="h-10 w-10 sm:h-11 sm:w-11"
                  title="Restart Lesson"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>

              <Button
                onClick={handleNextPage}
                className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <span className="hidden sm:inline">
                  {currentPageIndex === totalLessonPages - 1 ? 'Start Quiz' : 'Next'}
                </span>
                <span className="sm:hidden">
                  {currentPageIndex === totalLessonPages - 1 ? 'Quiz' : 'Next'}
                </span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Quiz View */}
        {view === 'quiz' && currentQuizQuestion && (
          <div className="space-y-4 sm:space-y-6">
            <div className="text-center space-y-2 sm:space-y-3">
              <div className="flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base text-muted-foreground">
                <Activity className="h-4 w-4" />
                <span>Question {currentQuestionIndex + 1} of {totalQuizQuestions}</span>
              </div>
              <Progress value={((currentQuestionIndex + 1) / totalQuizQuestions) * 100} className="w-full max-w-md mx-auto" />
            </div>

            <Card className="shadow-lg">
              <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-primary">{currentQuizQuestion.questionText}</h3>
                  
                  <RadioGroup
                    value={selectedAnswers[currentQuestionIndex]?.toString() || ''}
                    onValueChange={(value) => handleAnswerSelection(currentQuestionIndex, parseInt(value))}
                    className="space-y-3"
                  >
                    {currentQuizQuestion.options.map((option, optionIndex) => (
                      <div key={optionIndex} className="flex items-center space-x-3">
                        <RadioGroupItem value={optionIndex.toString()} id={`option-${optionIndex}`} />
                        <Label htmlFor={`option-${optionIndex}`} className={cn("text-base sm:text-lg cursor-pointer", fontClass)}>
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="flex justify-between items-center gap-3 sm:gap-4 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentQuestionIndex === 0}
                    className="px-4 sm:px-6 py-2 sm:py-3"
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Previous</span>
                  </Button>
                  
                  <Button
                    onClick={handleSubmitAnswer}
                    disabled={selectedAnswers[currentQuestionIndex] === undefined}
                    className="px-6 sm:px-8 py-2 sm:py-3 bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    <span className="hidden sm:inline">
                      {currentQuestionIndex === totalQuizQuestions - 1 ? 'Finish Quiz' : 'Next Question'}
                    </span>
                    <span className="sm:hidden">
                      {currentQuestionIndex === totalQuizQuestions - 1 ? 'Finish' : 'Next'}
                    </span>
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Results View */}
        {view === 'results' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="text-center space-y-3 sm:space-y-4">
              <div className="flex items-center justify-center gap-2 sm:gap-3">
                {quizScore >= 80 ? (
                  <PartyPopper className="h-8 w-8 sm:h-10 sm:w-10 text-green-500" />
                ) : quizScore >= 60 ? (
                  <Award className="h-8 w-8 sm:h-10 sm:w-10 text-yellow-500" />
                ) : (
                  <Brain className="h-8 w-8 sm:h-10 sm:w-10 text-blue-500" />
                )}
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary">Quiz Complete!</h2>
              <p className="text-lg sm:text-xl text-muted-foreground">
                You scored <span className="font-bold text-accent">{quizScore}%</span> ({answeredCorrectly} out of {totalQuizQuestions} correct)
              </p>
            </div>

            <Card className="shadow-lg">
              <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                <div className="space-y-3 sm:space-y-4">
                  {lesson.quiz?.map((question, questionIndex) => (
                    <div key={questionIndex} className="border rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3">
                      <div className="flex items-start gap-2 sm:gap-3">
                        {selectedAnswers[questionIndex] === question.correctAnswerIndex ? (
                          <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 mt-1 flex-shrink-0" />
                        ) : (
                          <X className="h-5 w-5 sm:h-6 sm:w-6 text-red-500 mt-1 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <h4 className="font-semibold text-base sm:text-lg">{question.questionText}</h4>
                          <p className="text-sm sm:text-base text-muted-foreground mt-1">
                            Your answer: <span className={selectedAnswers[questionIndex] === question.correctAnswerIndex ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                              {question.options[selectedAnswers[questionIndex] || 0]}
                            </span>
                          </p>
                          {selectedAnswers[questionIndex] !== question.correctAnswerIndex && (
                            <p className="text-sm sm:text-base text-green-600 font-medium mt-1">
                              Correct answer: {question.options[question.correctAnswerIndex]}
                            </p>
                          )}
                          {question.explanation && (
                            <div className="mt-2 sm:mt-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowExplanationForQuestionIndex(showExplanationForQuestionIndex === questionIndex ? null : questionIndex)}
                                className="text-xs sm:text-sm h-8 px-2"
                              >
                                <HelpCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                {showExplanationForQuestionIndex === questionIndex ? 'Hide' : 'Show'} Explanation
                              </Button>
                              {showExplanationForQuestionIndex === questionIndex && (
                                <p className="text-sm sm:text-base text-muted-foreground mt-2 p-2 sm:p-3 bg-muted rounded-md">
                                  {question.explanation}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                  <Button
                    onClick={onRestartLesson}
                    variant="outline"
                    className="flex-1 px-4 sm:px-6 py-2 sm:py-3"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Start New Lesson</span>
                    <span className="sm:hidden">New Lesson</span>
                  </Button>
                  
                  {nextRecommendedTopic && (
                    <Button
                      onClick={() => router.push(`/dashboard/lessons/new?topic=${encodeURIComponent(nextRecommendedTopic)}`)}
                      className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Try: {nextRecommendedTopic}</span>
                      <span className="sm:hidden">Next: {nextRecommendedTopic.substring(0, 15)}...</span>
                    </Button>
                  )}
                  
                  {isFetchingRecommendation && (
                    <Button disabled className="flex-1 px-4 sm:px-6 py-2 sm:py-3">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      <span className="hidden sm:inline">Finding next lesson...</span>
                      <span className="sm:hidden">Finding...</span>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  }
  
  return <Card className="border-t-4 border-muted"><CardContent className="p-6">Loading lesson content...</CardContent></Card>;
}

function ElevenLabsAudioPlayer({ text }: { text: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAudio = async () => {
    setLoading(true);
    setError(null);
    setAudioUrl(null);
    try {
      const res = await fetch(`/api/tts?text=${encodeURIComponent(text)}`);
      if (!res.ok) throw new Error('Failed to fetch audio');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      setTimeout(() => {
        audioRef.current?.play();
      }, 100); // slight delay to ensure audio loads
    } catch (e: any) {
      setError(e.message || 'Error generating audio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center mt-4">
      <Button onClick={fetchAudio} disabled={loading} variant="outline" size="sm" className="mb-2">
        {loading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <Volume2 className="h-5 w-5 mr-2" />}
        {loading ? 'Generating Audio...' : 'Play with AI Voice'}
      </Button>
      {audioUrl && (
        <audio ref={audioRef} src={audioUrl} controls className="w-full mt-2" />
      )}
      {error && <p className="text-destructive text-xs mt-1">{error}</p>}
    </div>
  );
}

