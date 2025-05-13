// src/app/dashboard/discover/page.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useActiveChildProfile } from '@/contexts/active-child-profile-context';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles, Search, Lightbulb, ArrowRight, AlertTriangle, Users, Mic, MicOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { suggestLessonTopic, type SuggestLessonTopicInput, type SuggestLessonTopicOutput } from '@/ai/flows/suggest-lesson-topic';
import { cn } from '@/lib/utils';

// Define a local schema for the form fields used in this component
const discoverTopicFormSchema = z.object({
  previousTopicsLearned: z.string().optional(),
});

type DiscoverTopicFormData = z.infer<typeof discoverTopicFormSchema>;

export default function DiscoverTopicsPage() {
  const { activeChild, isLoading: childLoading } = useActiveChildProfile();
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<SuggestLessonTopicOutput | null>(null);
  const { toast } = useToast();

  const [isListening, setIsListening] = useState(false);
  const [sttError, setSttError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);


  const form = useForm<DiscoverTopicFormData>({
    resolver: zodResolver(discoverTopicFormSchema),
    defaultValues: {
      previousTopicsLearned: activeChild?.lessonHistory || '',
    },
  });

  useEffect(() => {
     if (activeChild) {
        form.reset({ previousTopicsLearned: activeChild.lessonHistory || '' });
     }
  }, [activeChild, form]);

  const initializeSpeechRecognition = useCallback(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
        const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognitionAPI();
        const recognition = recognitionRef.current;
        recognition.continuous = false;
        recognition.lang = activeChild?.language || 'en-US';
        recognition.interimResults = false;

        recognition.onresult = (event) => {
            const transcript = event.results[event.results.length - 1][0].transcript;
            const currentFieldValue = form.getValues("previousTopicsLearned");
            form.setValue("previousTopicsLearned", currentFieldValue ? `${currentFieldValue.trim()} ${transcript}`.trim() : transcript);
            toast({ title: "Transcript Added", description: "Your spoken text has been added to the input field." });
        };

        recognition.onspeechend = () => {
            setIsListening(false);
        };
        
        recognition.onnomatch = () => {
            const errorMsg = "Speech not recognized. Please try again.";
            setSttError(errorMsg);
            toast({title: "Speech Not Recognized", description: errorMsg, variant: "destructive"})
            setIsListening(false);
        }

        recognition.onerror = (event) => {
            let errorMsg = "An unknown speech recognition error occurred.";
            if (event.error === 'no-speech') {
                errorMsg = "No speech was detected. Please try again.";
            } else if (event.error === 'audio-capture') {
                errorMsg = "Audio capture failed. Ensure your microphone is working and permitted.";
            } else if (event.error === 'not-allowed') {
                errorMsg = "Microphone access denied. Please enable it in your browser settings.";
            } else if (event.error === 'network') {
                 errorMsg = "Network error during speech recognition. Please check your connection.";
            } else if (event.error) {
                errorMsg = `Speech recognition error: ${event.error}.`;
            }
            setSttError(errorMsg);
            toast({ title: "Speech Recognition Error", description: errorMsg, variant: "destructive"});
            setIsListening(false);
        };
        setSttError(null); // Clear previous errors on successful init
    } else {
        setSttError("Speech recognition is not supported by your browser.");
    }
  }, [activeChild?.language, form, toast]);

  useEffect(() => {
    initializeSpeechRecognition();
    // Cleanup function to abort recognition if component unmounts while listening
    return () => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.abort();
            setIsListening(false);
        }
    };
  }, [initializeSpeechRecognition, isListening]);

  const toggleListening = () => {
    if (sttError === "Speech recognition is not supported by your browser.") {
        toast({ title: "Not Supported", description: sttError, variant: "destructive" });
        return;
    }
    if (!recognitionRef.current) { // If not initialized yet (e.g. activeChild was null)
        initializeSpeechRecognition(); // Try to initialize again
        if (!recognitionRef.current) { // Still not initialized
            toast({ title: "STT Error", description: "Speech recognition could not be initialized.", variant: "destructive"});
            return;
        }
    }

    if (isListening) {
        recognitionRef.current.stop();
        setIsListening(false);
    } else {
        try {
            recognitionRef.current.lang = activeChild?.language || 'en-US'; // Ensure lang is current
            recognitionRef.current.start();
            setIsListening(true);
            setSttError(null); // Clear previous operational errors
            toast({ title: "Listening...", description: "Speak now to add to the context field."});
        } catch (e: any) {
            const errorMsg = "Could not start speech recognition. It might already be active or an error occurred.";
            console.error("Error starting STT:", e);
            toast({ title: "STT Error", description: errorMsg, variant: "destructive"});
            setSttError(errorMsg);
            setIsListening(false);
        }
    }
  };


  const handleFormSubmit: SubmitHandler<DiscoverTopicFormData> = async (data) => {
    if (!activeChild) {
      toast({ title: "Error", description: "No active child profile selected.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setSuggestion(null);
    try {
      const input: SuggestLessonTopicInput = {
        childAge: activeChild.age,
        interests: activeChild.interests,
        learningDifficulties: activeChild.learningDifficulties,
        curriculum: activeChild.curriculum,
        previousTopicsLearned: data.previousTopicsLearned || activeChild.lessonHistory || "No specific previous topics provided.",
        learningStyle: activeChild.learningStyle || 'balanced_mixed',
      };
      const result = await suggestLessonTopic(input);
      setSuggestion(result);
      toast({ title: "Suggestion Ready!", description: "A new topic idea has been generated." });
    } catch (error: any) {
      console.error("Topic suggestion error:", error);
      toast({
        title: "Suggestion Error",
        description: error.message || "Could not generate a topic suggestion. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (childLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-var(--header-height,4rem)-3rem)] text-center p-4">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-xl text-muted-foreground">Loading child profile...</p>
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
                        Please select an active child profile to discover new lesson topics.
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

  return (
    <div className="container mx-auto py-6 md:py-8 max-w-3xl">
      <Card className="shadow-xl border-t-4 border-accent">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Search className="h-10 w-10 text-accent" />
            <div>
              <CardTitle className="text-3xl font-bold text-accent">Explore New Lesson Topics</CardTitle>
              <CardDescription className="text-lg text-muted-foreground mt-1">
                Get AI-powered suggestions for {activeChild.name} (Age: {activeChild.age}, Curriculum: {activeChild.curriculum}).
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="previousTopicsLearned"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center">
                        <FormLabel className="text-base">Previous Topics or Context (Optional)</FormLabel>
                        <Button 
                            type="button" 
                            onClick={toggleListening} 
                            variant="ghost" 
                            size="icon"
                            className={cn("hover:bg-accent/20", isListening ? "text-destructive" : "text-primary")}
                            aria-label={isListening ? "Stop listening" : "Start listening"}
                            disabled={!!sttError && sttError === "Speech recognition is not supported by your browser."}
                        >
                            {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                        </Button>
                    </div>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., 'Learned about planets last week.' or 'Needs help with fractions.' You can also use the microphone to dictate."
                        {...field}
                        rows={4}
                      />
                    </FormControl>
                    <FormDescription>
                      Help the AI by mentioning what {activeChild.name} has learned recently or any specific focus areas. Uses profile history if blank. {isListening && <span className="text-accent font-semibold animate-pulse">Listening...</span>}
                    </FormDescription>
                    {sttError && <FormMessage className="text-destructive">{sttError}</FormMessage>}
                    {!sttError && <FormMessage />}
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-lg py-6 shadow-md hover:shadow-lg" size="lg" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-5 w-5" />
                )}
                Get Topic Suggestion
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="text-center py-10 mt-8">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Finding the perfect topic for {activeChild.name}...</p>
        </div>
      )}

      {suggestion && !isLoading && (
        <Card className="mt-8 shadow-lg border-t-4 border-primary">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Lightbulb className="h-8 w-8 text-primary" />
              <CardTitle className="text-2xl font-semibold text-primary">Here&apos;s a Topic Idea!</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <h3 className="text-xl font-bold text-accent">{suggestion.suggestedTopic}</h3>
            <p className="text-muted-foreground italic">&quot;{suggestion.reasoning}&quot;</p>
            <Link href={`/dashboard/lessons/new?topic=${encodeURIComponent(suggestion.suggestedTopic)}`} passHref>
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-6 shadow-md hover:shadow-lg" size="lg">
                <ArrowRight className="mr-2 h-5 w-5" /> Use This Topic to Create a Lesson
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

