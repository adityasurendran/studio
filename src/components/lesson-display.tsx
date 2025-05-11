
// src/components/lesson-display.tsx
"use client";

import type { GeneratedLesson, ChildProfile } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { BookOpen, Layers, Type, Palette, ChevronLeft, ChevronRight, AlertTriangle, ImageOff, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';
import { generateImageForSentence, type GenerateImageInput } from '@/ai/flows/generate-image-for-sentence';
import { useToast } from '@/hooks/use-toast';

interface LessonDisplayProps {
  lesson: GeneratedLesson;
  childProfile?: ChildProfile | null;
}

export default function LessonDisplay({ lesson, childProfile }: LessonDisplayProps) {
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [sentenceImages, setSentenceImages] = useState<Record<number, string>>({});
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const { toast } = useToast();

  const themeClass = childProfile?.theme === 'dark' ? 'dark-theme-lesson' : 
                     childProfile?.theme === 'colorful' ? 'colorful-theme-lesson' :
                     childProfile?.theme === 'simple' ? 'simple-theme-lesson' :
                     '';
  const fontClass = childProfile?.screenIssues?.includes('larger fonts') ? 'text-lg md:text-xl' : 'text-base md:text-lg';

  const totalSentences = lesson.lessonContent.length;
  const currentSentence = lesson.lessonContent[currentSentenceIndex];

  const loadAndSetImage = useCallback(async (index: number, sentence: string) => {
    if (!sentence || sentenceImages[index]) {
      setImageError(null); // Clear previous error if image already loaded or sentence is empty
      setIsImageLoading(false);
      return;
    }

    setIsImageLoading(true);
    setImageError(null);
    try {
      const imageInput: GenerateImageInput = { 
        sentence,
        childAge: childProfile?.age,
        // Assuming interests are part of the profile, this needs to be added to ChildProfile type and form
        // interests: childProfile?.interests 
      };
      const result = await generateImageForSentence(imageInput);
      setSentenceImages(prev => ({ ...prev, [index]: result.imageDataUri }));
    } catch (err) {
      console.error("Error generating image for sentence:", err);
      setImageError(err instanceof Error ? err.message : "Failed to load image.");
      toast({
        title: "Image Generation Failed",
        description: `Could not generate an image for the sentence. Please try again or skip.`,
        variant: "destructive",
      });
    } finally {
      setIsImageLoading(false);
    }
  }, [sentenceImages, childProfile, toast]);

  useEffect(() => {
    if (currentSentence) {
      loadAndSetImage(currentSentenceIndex, currentSentence);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSentenceIndex, lesson.lessonContent]); // loadAndSetImage is memoized

  const handleNextSentence = () => {
    if (currentSentenceIndex < totalSentences - 1) {
      setCurrentSentenceIndex(prev => prev + 1);
    }
  };

  const handlePreviousSentence = () => {
    if (currentSentenceIndex > 0) {
      setCurrentSentenceIndex(prev => prev - 1);
    }
  };

  return (
    <Card className={cn("w-full shadow-xl transition-all duration-300 flex flex-col", themeClass)}>
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="h-8 w-8 text-primary" />
          <CardTitle className="text-3xl text-primary">{lesson.lessonTitle}</CardTitle>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
                <Layers className="h-4 w-4" />
                <span>Subject: <strong>{lesson.subject}</strong></span>
            </div>
            <div className="flex items-center gap-1">
                <Type className="h-4 w-4" />
                <span>Format: <strong>{lesson.lessonFormat}</strong></span>
            </div>
            {childProfile?.theme && (
                 <div className="flex items-center gap-1">
                    <Palette className="h-4 w-4" />
                    <span>Theme: <strong>{childProfile.theme}</strong></span>
                </div>
            )}
        </div>
      </CardHeader>
      
      <CardContent className={cn("flex-grow flex flex-col items-center justify-center p-4 md:p-6 space-y-4", fontClass)}>
        <div className="w-full aspect-video bg-muted/50 rounded-lg overflow-hidden flex items-center justify-center mb-4 shadow-inner max-h-[400px]">
          {isImageLoading && <Loader2 className="h-16 w-16 animate-spin text-primary" />}
          {!isImageLoading && imageError && (
            <div className="text-center text-destructive p-4">
              <ImageOff className="h-16 w-16 mx-auto mb-2" />
              <p className="text-sm">Could not load image.</p>
              <p className="text-xs">{imageError.substring(0,100)}</p>
            </div>
          )}
          {!isImageLoading && !imageError && sentenceImages[currentSentenceIndex] && (
            <Image 
              src={sentenceImages[currentSentenceIndex]} 
              alt={`Illustration for: ${currentSentence}`} 
              width={500} 
              height={281} // 16:9 aspect ratio for 500 width
              className="object-contain w-full h-full"
              priority={true} // Prioritize loading current image
            />
          )}
           {!isImageLoading && !imageError && !sentenceImages[currentSentenceIndex] && (
             <Skeleton className="w-full h-full" /> // Fallback skeleton if no image, no error, not loading
           )}
        </div>
        
        <p className={cn("text-center min-h-[3em]", fontClass, themeClass === 'dark-theme-lesson' ? 'text-slate-200' : 'text-foreground')}>
          {currentSentence || "Loading sentence..."}
        </p>
      </CardContent>

      <CardFooter className="flex flex-col sm:flex-row items-center justify-between p-4 border-t">
        <p className="text-sm text-muted-foreground mb-2 sm:mb-0">
          Sentence {currentSentenceIndex + 1} of {totalSentences}
        </p>
        <div className="flex gap-2">
          <Button 
            onClick={handlePreviousSentence} 
            disabled={currentSentenceIndex === 0 || isImageLoading}
            variant="outline"
            size="lg"
          >
            <ChevronLeft className="mr-2 h-5 w-5" /> Previous
          </Button>
          <Button 
            onClick={handleNextSentence} 
            disabled={currentSentenceIndex === totalSentences - 1 || isImageLoading}
            variant="default"
            size="lg"
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            Next <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </CardFooter>

      <style jsx global>{`
        .dark-theme-lesson {
          background-color: #2d3748; /* Example dark bg */
          color: #e2e8f0; /* Example light text */
        }
        .dark-theme-lesson .text-primary { color: var(--primary); /* Use theme primary */ }
        .dark-theme-lesson .text-muted-foreground { color: #a0aec0; }


        .colorful-theme-lesson {
          background: linear-gradient(135deg, hsl(var(--primary) / 0.2), hsl(var(--accent) / 0.2));
          color: #333;
        }
        .colorful-theme-lesson .text-primary { color: hsl(var(--primary)); }
        .colorful-theme-lesson .text-muted-foreground { color: hsl(var(--foreground) / 0.7); }


        .simple-theme-lesson {
            background-color: #fff;
            color: #1a202c;
            border: 1px solid #e2e8f0;
        }
        .simple-theme-lesson .text-primary { color: hsl(var(--primary)); }
        .simple-theme-lesson .text-muted-foreground { color: hsl(var(--muted-foreground)); }
      `}</style>
    </Card>
  );
}
