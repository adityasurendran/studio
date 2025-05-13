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
import { Loader2, Wand2, Smile, History, Target, RefreshCw, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useChildProfilesContext } from '@/contexts/child-profiles-context';

const lessonGenerationSchema = z.object({
  lessonTopic: z.string().min(3, "Please specify a lesson topic (min 3 characters).").max(100, "Topic too long (max 100 chars)."),
  recentMood: z.string().min(1, "Recent mood is required."),
  lessonHistory: z.string().optional(),
});

type LessonGenerationFormData = z.infer<typeof lessonGenerationSchema>;

interface LessonGeneratorFormProps {
  childProfile: ChildProfile;
}

export default function LessonGeneratorForm({ childProfile }: LessonGeneratorFormProps) {
  const form = useForm<LessonGenerationFormData>({
    resolver: zodResolver(lessonGenerationSchema),
    defaultValues: {
      lessonTopic: '',
      recentMood: childProfile.recentMood || 'neutral',
      lessonHistory: childProfile.lessonHistory || '',
    },
  });
  const { toast } = useToast();
  const [generatedLesson, setGeneratedLesson] = useState<GeneratedLesson | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSuccessfulInput, setLastSuccessfulInput] = useState<GenerateTailoredLessonsInput | null>(null);
  const { addLessonAttempt, addSavedLesson } = useChildProfilesContext();

  useEffect(() => {
    form.reset({
      lessonTopic: '',
      recentMood: childProfile.recentMood || 'neutral',
      lessonHistory: childProfile.lessonHistory || '',
    });
    setGeneratedLesson(null);
    setLastSuccessfulInput(null);
  }, [childProfile, form]);

  const processLessonGeneration = async (input: GenerateTailoredLessonsInput, isRegeneration: boolean = false) => {
    setIsLoading(true);
    setGeneratedLesson(null); 
    try {
      const lesson = await generateTailoredLessons(input);
      setGeneratedLesson(lesson);
      addSavedLesson(childProfile.id, lesson);
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
    const input: GenerateTailoredLessonsInput = {
      childName: childProfile.name,
      childAge: childProfile.age,
      learningDifficulties: childProfile.learningDifficulties,
      interests: childProfile.interests || "general topics",
      recentMood: data.recentMood,
      lessonHistory: data.lessonHistory || "No specific recent history provided.",
      lessonTopic: data.lessonTopic,
      curriculum: childProfile.curriculum,
      learningStyle: childProfile.learningStyle || 'balanced_mixed', // Pass learning style
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
    // Ensure learningStyle is included if it was part of the original successful input or profile
    const inputToRegenerate: GenerateTailoredLessonsInput = {
        ...lastSuccessfulInput,
        learningStyle: childProfile.learningStyle || lastSuccessfulInput.learningStyle || 'balanced_mixed',
    };
    await processLessonGeneration(inputToRegenerate, true);
  };

  const handleQuizComplete = (attemptData: Omit<LessonAttempt, 'attemptId'>) => {
    if (childProfile) {
      addLessonAttempt(childProfile.id, attemptData);
      toast({
        title: "Quiz Finished!",
        description: `Score: ${attemptData.quizScore}%. Results saved for ${childProfile.name}.`,
      });
    }
  };

  const handleRestartLesson = () => {
    setGeneratedLesson(null); 
    setIsLoading(false); 
    // Reset form to allow new topic input if desired, or keep current topic for easy regeneration
    // form.resetField("lessonTopic"); // Optional: clear topic
    toast({
        title: "Ready for a New Lesson",
        description: "The previous lesson view has been cleared. Feel free to generate a new lesson or adjust the topic."
    });
  };


  return (
    <div className="space-y-8">
      <Card className="w-full max-w-3xl mx-auto shadow-xl border-t-4 border-primary">
        <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
                <Wand2 className="h-10 w-10 text-primary" />
                <div>
                    <CardTitle className="text-3xl font-bold text-primary">Lesson Generator</CardTitle>
                    <CardDescription className="text-lg text-muted-foreground mt-1">
                        Craft a new AI-powered lesson for <strong className="text-accent">{childProfile.name}</strong> (Age: {childProfile.age}).
                    </CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="lessonTopic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-lg"><Target className="text-primary"/> What should {childProfile.name} learn about today?</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Addition up to 10, The Solar System, Types of Dinosaurs" {...field} className="h-12 text-base"/>
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
                    <FormLabel className="flex items-center gap-2 text-lg"><Smile className="text-primary"/> Recent Mood</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger className="h-12 text-base">
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
                    <FormLabel className="flex items-center gap-2 text-lg"><History className="text-primary"/> Brief Lesson History / Context (Optional)</FormLabel>
                    <FormControl>
                        <Textarea
                        placeholder="e.g., Recently worked on subtraction. Struggled with counting by 5s. Enjoyed a story about space."
                        {...field}
                        rows={3}
                        className="text-base"
                        />
                    </FormControl>
                    <FormDescription>Any specific topics covered recently, or areas to focus on/avoid?</FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90 text-lg py-3 shadow-md hover:shadow-lg transition-all transform hover:scale-105" size="lg" disabled={isLoading}>
                    {isLoading && !lastSuccessfulInput ? ( 
                        <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating Lesson...
                        </>
                    ) : (
                        <>
                        <Sparkles className="mr-2 h-5 w-5" /> Generate Lesson
                        </>
                    )}
                    </Button>
                    {lastSuccessfulInput && (
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={handleRegenerateLastLesson} 
                            className="w-full text-lg py-3 shadow-sm hover:shadow-md hover:border-primary hover:text-primary" 
                            size="lg"
                            disabled={isLoading}
                        >
                            {isLoading && lastSuccessfulInput ? (
                                <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Regenerating...
                                </>
                            ) : (
                                <>
                                <RefreshCw className="mr-2 h-5 w-5" /> Regenerate Last
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </form>
            </Form>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="text-center py-10 px-4 my-8 bg-card rounded-lg shadow-lg border">
          <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-6" />
          <p className="mt-4 text-xl text-muted-foreground leading-relaxed">
            <span className="font-semibold text-primary block text-2xl mb-2">Hang tight!</span> Our AI is crafting a special lesson
            <br />
            and illustrating it for <strong className="text-accent">{childProfile.name}</strong>.
            <br />
            This may take a moment or two, especially for the images. Good things take time!
          </p>
        </div>
      )}

      {generatedLesson && !isLoading && ( 
        <div className="mt-10">
            <Card className="shadow-xl">
                <CardHeader>
                    <CardTitle className="text-2xl font-semibold text-center text-primary">Generated Lesson Preview</CardTitle>
                    <CardDescription className="text-center text-muted-foreground">Review the lesson below. You can restart if needed.</CardDescription>
                </CardHeader>
                <CardContent>
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

