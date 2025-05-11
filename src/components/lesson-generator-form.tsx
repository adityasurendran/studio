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
import { Loader2, Wand2, Smile, History, Target, RefreshCw } from 'lucide-react';
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
    setGeneratedLesson(null); // Clear previous lesson before new one is generated
    try {
      const lesson = await generateTailoredLessons(input);
      setGeneratedLesson(lesson);
      addSavedLesson(childProfile.id, lesson);
      setLastSuccessfulInput(input); // Save input for potential regeneration
      toast({
        title: isRegeneration ? "Lesson Regenerated!" : "Lesson Generated!",
        description: `A new lesson titled "${lesson.lessonTitle}" is ready.`,
      });
    } catch (error) {
      console.error("Lesson generation error:", error);
      toast({
        title: "Error Generating Lesson",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        variant: "destructive",
      });
      // If regeneration fails, keep the last successful input available
      // If initial generation fails, lastSuccessfulInput will remain null
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
    await processLessonGeneration(lastSuccessfulInput, true);
  };

  const handleQuizComplete = (attemptData: Omit<LessonAttempt, 'attemptId'>) => {
    if (childProfile) {
      addLessonAttempt(childProfile.id, attemptData);
      toast({
        title: "Quiz Finished!",
        description: `Score: ${attemptData.quizScore}%. Results saved.`,
      });
    }
  };

  const handleRestartLesson = () => {
    setGeneratedLesson(null); 
    setIsLoading(false); 
    toast({
        title: "Ready for a new Lesson",
        description: "The previous lesson view has been cleared. Generate a new one or select a different topic."
    });
  };


  return (
    <div className="space-y-8">
      <Card className="w-full max-w-3xl mx-auto shadow-lg">
        <CardHeader>
            <CardTitle className="text-3xl text-primary flex items-center gap-2"><Wand2 className="h-8 w-8" /> Lesson Generator</CardTitle>
            <CardDescription>
                Create a new AI-powered lesson for <strong>{childProfile.name}</strong> (Age: {childProfile.age}).
                <br />
                Specify the lesson topic and provide context about their recent mood and lesson history.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="lessonTopic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><Target /> What should {childProfile.name} learn about today?</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Addition up to 10, The Solar System, Types of Dinosaurs" {...field} />
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
                    <FormLabel className="flex items-center gap-2"><Smile /> Recent Mood</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
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
                    <FormLabel className="flex items-center gap-2"><History /> Brief Lesson History / Context (Optional)</FormLabel>
                    <FormControl>
                        <Textarea
                        placeholder="e.g., Recently worked on subtraction. Struggled with counting by 5s. Enjoyed a story about space."
                        {...field}
                        rows={3}
                        />
                    </FormControl>
                    <FormDescription>Any specific topics covered recently, or areas to focus on/avoid?</FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <div className="flex flex-col sm:flex-row gap-2">
                    <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90 text-lg py-6" disabled={isLoading}>
                    {isLoading && !lastSuccessfulInput ? ( // Show loading only if it's not a regeneration
                        <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating Lesson...
                        </>
                    ) : (
                        <>
                        <Wand2 className="mr-2 h-5 w-5" /> Generate Lesson
                        </>
                    )}
                    </Button>
                    {lastSuccessfulInput && (
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={handleRegenerateLastLesson} 
                            className="w-full text-lg py-6" 
                            disabled={isLoading}
                        >
                            {isLoading && lastSuccessfulInput ? (
                                <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Regenerating...
                                </>
                            ) : (
                                <>
                                <RefreshCw className="mr-2 h-5 w-5" /> Regenerate Last Lesson
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
        <div className="text-center py-10">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-lg text-muted-foreground">
            Our AI is crafting a special lesson and illustrating it for {childProfile.name}...
            <br/>This may take a minute or two, especially for longer lessons. Please wait.
          </p>
        </div>
      )}

      {generatedLesson && !isLoading && ( 
        <div className="mt-10">
            <h2 className="text-2xl font-semibold mb-4 text-center text-primary">Generated Lesson Preview</h2>
            <LessonDisplay 
                lesson={generatedLesson} 
                childProfile={childProfile}
                lessonTopic={lastSuccessfulInput?.lessonTopic || form.getValues("lessonTopic")} // Use topic from last input or current form
                onQuizComplete={handleQuizComplete}
                onRestartLesson={handleRestartLesson}
            />
        </div>
      )}
    </div>
  );
}
