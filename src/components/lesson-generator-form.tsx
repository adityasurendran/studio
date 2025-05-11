// src/components/lesson-generator-form.tsx
"use client";

import type { ChildProfile, GeneratedLesson } from '@/types';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { generateTailoredLessons, type GenerateTailoredLessonsInput } from '@/ai/flows/generate-lesson';
import { useState } from 'react';
import LessonDisplay from './lesson-display';
import { Loader2, Wand2, Smile, History } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

const lessonGenerationSchema = z.object({
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
      recentMood: childProfile.recentMood || 'neutral',
      lessonHistory: childProfile.lessonHistory || '',
    },
  });
  const { toast } = useToast();
  const [generatedLesson, setGeneratedLesson] = useState<GeneratedLesson | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFormSubmit: SubmitHandler<LessonGenerationFormData> = async (data) => {
    setIsLoading(true);
    setGeneratedLesson(null);
    try {
      const input: GenerateTailoredLessonsInput = {
        childName: childProfile.name,
        childAge: childProfile.age,
        learningDifficulties: childProfile.learningDifficulties,
        interests: "Loves dinosaurs, space, and drawing.", // Example, could be part of profile
        recentMood: data.recentMood,
        lessonHistory: data.lessonHistory || "No specific recent history provided.",
      };
      const lesson = await generateTailoredLessons(input);
      setGeneratedLesson(lesson);
      toast({
        title: "Lesson Generated!",
        description: `A new lesson titled "${lesson.lessonTitle}" is ready.`,
      });
    } catch (error) {
      console.error("Lesson generation error:", error);
      toast({
        title: "Error Generating Lesson",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <Card className="w-full max-w-3xl mx-auto shadow-lg">
        <CardHeader>
            <CardTitle className="text-3xl text-primary flex items-center gap-2"><Wand2 className="h-8 w-8" /> Lesson Generator</CardTitle>
            <CardDescription>
                Create a new AI-powered lesson for <strong>{childProfile.name}</strong> (Age: {childProfile.age}).
                <br />
                Provide some context about their recent mood and any relevant lesson history.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
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
                    <FormDescription>How is {childProfile.name} feeling today? This helps tailor the lesson.</FormDescription>
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
                        placeholder="e.g., Recently worked on addition. Struggled with counting by 2s. Enjoyed a story about animals."
                        {...field}
                        rows={3}
                        />
                    </FormControl>
                    <FormDescription>Any specific topics covered recently, or areas to focus on/avoid?</FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90 text-lg py-6" disabled={isLoading}>
                {isLoading ? (
                    <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating Lesson...
                    </>
                ) : (
                    <>
                    <Wand2 className="mr-2 h-5 w-5" /> Generate Lesson
                    </>
                )}
                </Button>
            </form>
            </Form>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="text-center py-10">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-lg text-muted-foreground">Our AI is crafting a special lesson for {childProfile.name}...</p>
        </div>
      )}

      {generatedLesson && (
        <div className="mt-10">
            <h2 className="text-2xl font-semibold mb-4 text-center text-primary">Generated Lesson Preview</h2>
            <LessonDisplay lesson={generatedLesson} childProfile={childProfile} />
        </div>
      )}
    </div>
  );
}
