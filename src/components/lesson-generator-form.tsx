// src/components/lesson-generator-form.tsx
"use client";

import type { ChildProfile, GeneratedLesson, LessonAttempt } from '@/types';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { generateTailoredLessons, type GenerateTailoredLessonsInput } from '@/ai/flows/generate-lesson';
import { useState, useEffect } from 'react';
import LessonDisplay from './lesson-display';
import { Loader2, Wand2, Smile, History, Target, RefreshCw, Sparkles, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useChildProfilesContext } from '@/contexts/child-profiles-context';
import { useUsageTracker } from '@/hooks/use-usage-tracker';
import { saveLesson } from '@/lib/firestore-lessons';
import { useAuth } from '@/hooks/use-auth';
import { v4 as uuidv4 } from 'uuid';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';

const lessonGenerationSchema = z.object({
  lessonTopic: z.string().min(3, "Please specify a lesson topic (min 3 characters).").max(100, "Topic too long (max 100 chars)."),
  recentMood: z.string().min(1, "Recent mood is required."),
  lessonHistory: z.string().optional(),
});

type LessonGenerationFormData = z.infer<typeof lessonGenerationSchema>;

interface LessonGeneratorFormProps {
  childProfile: ChildProfile;
  initialTopic?: string; 
}

export default function LessonGeneratorForm({ childProfile, initialTopic }: LessonGeneratorFormProps) {
  const form = useForm<LessonGenerationFormData>({
    resolver: zodResolver(lessonGenerationSchema),
    defaultValues: {
      lessonTopic: initialTopic || '',
      recentMood: childProfile.recentMood || 'neutral',
      lessonHistory: childProfile.lessonHistory || '',
    },
  });
  const { toast } = useToast();
  const [generatedLesson, setGeneratedLesson] = useState<GeneratedLesson | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSuccessfulInput, setLastSuccessfulInput] = useState<GenerateTailoredLessonsInput | null>(null);
  const { addLessonAttempt, addSavedLesson, updateProfile } = useChildProfilesContext();
  const { isWithinLimit } = useUsageTracker();
  const { currentUser } = useAuth();

  useEffect(() => {
    form.reset({
      lessonTopic: initialTopic || '',
      recentMood: childProfile.recentMood || 'neutral',
      lessonHistory: childProfile.lessonHistory || '',
    });
    // Optionally, you might want to clear the generated lesson when the profile or topic changes significantly
    // setGeneratedLesson(null); 
    // setLastSuccessfulInput(null);
  }, [childProfile, initialTopic, form]);

  const processLessonGeneration = async (input: GenerateTailoredLessonsInput, isRegeneration: boolean = false) => {
    setIsLoading(true);
    setGeneratedLesson(null); 
    try {
      const lesson = await generateTailoredLessons(input);
      const lessonWithId = { ...lesson, id: uuidv4() };
      if (currentUser) {
        await saveLesson(currentUser.uid, lessonWithId);
      }
      setGeneratedLesson(lessonWithId);
      setLastSuccessfulInput(input); 
      toast({
        title: isRegeneration ? "Lesson Regenerated!" : "Lesson Generated!",
        description: `A new lesson titled "${lesson.lessonTitle}" is ready for ${childProfile.name}.`,
      });
    } catch (error) {
      console.error("Lesson generation error:", error);
      toast({
        title: "Error Generating Lesson",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again or adjust the topic.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit: SubmitHandler<LessonGenerationFormData> = async (data) => {
    if (!isWithinLimit(childProfile.id, childProfile.dailyUsageLimitMinutes, childProfile.weeklyUsageLimitMinutes)) {
      toast({
        title: 'Usage Limit Reached',
        description: `${childProfile.name} has reached their allowed screen time.`,
        variant: 'destructive',
      });
      return;
    }

    const input: GenerateTailoredLessonsInput = {
      childName: childProfile.name,
      childAge: childProfile.age,
      learningDifficulties: childProfile.learningDifficulties,
      interests: childProfile.interests || "general topics",
      recentMood: data.recentMood,
      lessonHistory: data.lessonHistory || "No specific recent history provided.",
      lessonTopic: data.lessonTopic,
      curriculum: childProfile.curriculum,
      learningStyle: childProfile.learningStyle || 'balanced_mixed',
      preferredActivities: childProfile.preferredActivities || '',
      targetLanguage: childProfile.language || 'en', // Include child's language preference
    };
    await processLessonGeneration(input);
  };

  const handleRegenerateLastLesson = async () => {
    if (!lastSuccessfulInput) {
      toast({
        title: "Cannot Regenerate",
        description: "No previous lesson input found to regenerate from.",
        variant: "destructive",
      });
      return;
    }
    const inputToRegenerate: GenerateTailoredLessonsInput = {
        ...lastSuccessfulInput,
        learningStyle: childProfile.learningStyle || lastSuccessfulInput.learningStyle || 'balanced_mixed',
        preferredActivities: childProfile.preferredActivities || lastSuccessfulInput.preferredActivities || '',
        // Update recentMood from current form/profile state if desired
        recentMood: form.getValues("recentMood") || childProfile.recentMood || lastSuccessfulInput.recentMood,
        targetLanguage: childProfile.language || lastSuccessfulInput.targetLanguage || 'en', // Ensure language is included
    };
    await processLessonGeneration(inputToRegenerate, true);
  };

  const handleQuizComplete = (attemptData: Omit<LessonAttempt, 'attemptId'>) => {
    if (childProfile) {
      addLessonAttempt(childProfile.id, attemptData);
      
      let newMood = childProfile.recentMood;
      if (attemptData.quizScore >= 80) newMood = 'happy';
      else if (attemptData.quizScore < 50) newMood = 'sad';
      
      // We only update mood if it actually changed, to avoid unnecessary profile updates
      if (newMood !== childProfile.recentMood) {
         updateProfile({
          ...childProfile,
          recentMood: newMood,
        });
      }
      toast({
        title: "Quiz Finished!",
        description: `Score: ${attemptData.quizScore}%. Results saved for ${childProfile.name}.`,
      });
    }
  };

  const handleRestartLesson = () => {
    setGeneratedLesson(null); 
    setIsLoading(false); 
    form.reset({ 
      lessonTopic: '', // Reset topic to blank
      recentMood: childProfile.recentMood || 'neutral',
      lessonHistory: childProfile.lessonHistory || '', // Keep lesson history or reset as needed
    });
    setLastSuccessfulInput(null); // Clear last successful input
    toast({
        title: "Ready for a New Lesson",
        description: "The previous lesson view has been cleared. You can generate a new lesson or adjust the topic."
    });
  };


  return (
    <div className="space-y-6 sm:space-y-8 px-3 sm:px-4">
      <Card className="w-full max-w-3xl mx-auto shadow-xl border-t-4 border-primary">
        <CardHeader className="pb-4 px-4 sm:px-6">
            <div className="flex items-center gap-3">
                <Wand2 className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                <div>
                    <CardTitle className="text-2xl sm:text-3xl font-bold text-primary">Lesson Generator</CardTitle>
                    <CardDescription className="text-base sm:text-lg text-muted-foreground mt-1">
                        Craft a new AI-powered lesson for <strong className="text-accent">{childProfile.name}</strong> (Age: {childProfile.age}).
                    </CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
            {/* Show curriculum info warning if placeholder */}
            {generatedLesson?.curriculumInfo?.isPlaceholder && (
              <Alert variant="warning" className="mb-4">
                <AlertTitle>General Knowledge Used</AlertTitle>
                <AlertDescription>
                  Curriculum-specific information could not be fetched for this lesson. The lesson is based on general knowledge and may not fully align with the selected curriculum.
                </AlertDescription>
              </Alert>
            )}
            <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 sm:space-y-6">
                <FormField
                  control={form.control}
                  name="lessonTopic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-base sm:text-lg"><Target className="text-primary h-4 w-4 sm:h-5 sm:w-5"/> What should {childProfile.name} learn about today?</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Addition up to 10, The Solar System, Types of Dinosaurs" {...field} className="h-11 sm:h-12 text-base"/>
                      </FormControl>
                      <FormDescription>Be specific for the best results. This will guide the lesson content.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                control={form.control}
                name="recentMood"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="flex items-center gap-2 text-base sm:text-lg"><Smile className="text-primary h-4 w-4 sm:h-5 sm:w-5"/> Recent Mood</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger className="h-11 sm:h-12 text-base">
                            <SelectValue placeholder="Select child's current mood" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value="happy">😊 Happy / Engaged</SelectItem>
                        <SelectItem value="neutral">😐 Neutral / Calm</SelectItem>
                        <SelectItem value="sad">😞 Sad / Tired / Unfocused</SelectItem>
                        <SelectItem value="anxious">😟 Anxious / Stressed</SelectItem>
                        <SelectItem value="excited">🤩 Excited / Eager</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormDescription>How is {childProfile.name} feeling today? This helps tailor the lesson tone.</FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="lessonHistory"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="flex items-center gap-2 text-base sm:text-lg"><History className="text-primary h-4 w-4 sm:h-5 sm:w-5"/> Brief Lesson History / Context (Optional)</FormLabel>
                    <FormControl>
                        <Textarea
                        placeholder="e.g., Recently worked on subtraction. Struggled with counting by 5s. Enjoyed a story about space."
                        {...field}
                        rows={3}
                        className="text-base"
                        />
                    </FormControl>
                    <FormDescription>Any specific topics covered recently, or areas to focus on/avoid? Updated automatically after lessons.</FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90 text-base sm:text-lg py-3 sm:py-4 shadow-md hover:shadow-lg transition-all transform hover:scale-105" size="lg" disabled={isLoading}>
                    {isLoading && !lastSuccessfulInput ? ( 
                        <>
                        <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" /> Generating Lesson...
                        </>
                    ) : (
                        <>
                        <Sparkles className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Generate Lesson
                        </>
                    )}
                    </Button>
                    {lastSuccessfulInput && (
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={handleRegenerateLastLesson} 
                            className="w-full text-base sm:text-lg py-3 sm:py-4 shadow-sm hover:shadow-md hover:border-primary hover:text-primary" 
                            size="lg"
                            disabled={isLoading}
                        >
                            {isLoading && lastSuccessfulInput ? (
                                <>
                                <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" /> Regenerating...
                                </>
                            ) : (
                                <>
                                <RefreshCw className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Regenerate Last
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </form>
            </Form>
        </CardContent>
      </Card>

      {/* Error message if lesson generation fails */}
      {!isLoading && lastSuccessfulInput && !generatedLesson && (
        <Card className="w-full max-w-2xl mx-auto mt-6 border-t-4 border-destructive shadow-lg">
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <AlertTriangle className="h-7 w-7 text-destructive" />
            <CardTitle className="text-lg text-destructive">Lesson Generation Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive text-base mb-2">Sorry, we couldn't generate a lesson. Please try again, adjust the topic, or check your internet connection.</p>
            <Button onClick={handleRegenerateLastLesson} variant="outline" className="text-destructive border-destructive hover:bg-destructive/10">
              <RefreshCw className="mr-2 h-4 w-4" /> Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <div className="text-center py-8 sm:py-10 px-4 my-6 sm:my-8 bg-card rounded-lg shadow-lg border">
          <Loader2 className="h-12 w-12 sm:h-16 sm:w-16 animate-spin text-primary mx-auto mb-4 sm:mb-6" />
          <p className="mt-4 text-base sm:text-xl text-muted-foreground leading-relaxed">
            <span className="font-semibold text-primary block text-xl sm:text-2xl mb-2">Hang tight!</span> Our AI is crafting a special lesson
            <br />
            and illustrating it for <strong className="text-accent">{childProfile.name}</strong>.
            <br />
            This may take a moment or two, especially for the images. Good things take time!
          </p>
        </div>
      )}

      {generatedLesson && !isLoading && ( 
        <div className="mt-8 sm:mt-10">
            <Card className="shadow-xl">
                <CardHeader className="px-4 sm:px-6">
                    <CardTitle className="text-xl sm:text-2xl font-semibold text-center text-primary">Generated Lesson Preview</CardTitle>
                    <CardDescription className="text-center text-muted-foreground">Review the lesson below. You can restart if needed.</CardDescription>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                    <LessonDisplay 
                        lesson={generatedLesson} 
                        childProfile={childProfile}
                        lessonTopic={lastSuccessfulInput?.lessonTopic || form.getValues("lessonTopic")} 
                        onQuizComplete={handleQuizComplete}
                        onRestartLesson={handleRestartLesson}
                    />
                </CardContent>
            </Card>
        </div>
      )}
    </div>
  );
}
