// src/components/lesson-display.tsx
"use client";

import type { GeneratedLesson, ChildProfile, LessonPage } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { BookOpen, Layers, Type, Palette, ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

interface LessonDisplayProps {
  lesson: GeneratedLesson;
  childProfile?: ChildProfile | null;
}

export default function LessonDisplay({ lesson, childProfile }: LessonDisplayProps) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const themeClass = childProfile?.theme === 'dark' ? 'dark-theme-lesson' : 
                     childProfile?.theme === 'colorful' ? 'colorful-theme-lesson' :
                     childProfile?.theme === 'simple' ? 'simple-theme-lesson' :
                     '';
  const fontClass = childProfile?.screenIssues?.includes('larger fonts') ? 'text-lg md:text-xl' : 'text-base md:text-lg';

  const totalPages = lesson.lessonPages.length;
  const currentPage: LessonPage | undefined = lesson.lessonPages[currentPageIndex];

  const handleNextPage = () => {
    if (currentPageIndex < totalPages - 1) {
      setCurrentPageIndex(prev => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(prev => prev - 1);
    }
  };

  if (!currentPage) {
    return (
        <Card className={cn("w-full shadow-xl", themeClass)}>
            <CardHeader>
                <CardTitle className="text-2xl text-destructive">Error</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Could not load lesson page. Please try generating the lesson again.</p>
            </CardContent>
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
          {currentPage.imageDataUri ? (
            <Image 
              src={currentPage.imageDataUri} 
              alt={`Illustration for lesson page ${currentPageIndex + 1}`}
              width={500} 
              height={281} // 16:9 aspect ratio for 500 width
              className="object-contain w-full h-full"
              priority={true} // Prioritize loading current image
            />
          ) : (
            <div className="text-center text-destructive p-4">
              <ImageOff className="h-16 w-16 mx-auto mb-2" />
              <p className="text-sm">Image not available for this page.</p>
            </div>
          )}
        </div>
        
        <div className={cn("text-center min-h-[4em]", fontClass, themeClass === 'dark-theme-lesson' ? 'text-slate-200' : 'text-foreground')}>
          {currentPage.sentences.map((sentence, sIdx) => (
            <p key={sIdx} className={sIdx > 0 ? "mt-1" : ""}>{sentence}</p>
          ))}
           {currentPage.sentences.length === 0 && <p>Loading content...</p>}
        </div>
      </CardContent>

      <CardFooter className="flex flex-col sm:flex-row items-center justify-between p-4 border-t">
        <p className="text-sm text-muted-foreground mb-2 sm:mb-0">
          Page {currentPageIndex + 1} of {totalPages}
        </p>
        <div className="flex gap-2">
          <Button 
            onClick={handlePreviousPage} 
            disabled={currentPageIndex === 0}
            variant="outline"
            size="lg"
          >
            <ChevronLeft className="mr-2 h-5 w-5" /> Previous
          </Button>
          <Button 
            onClick={handleNextPage} 
            disabled={currentPageIndex === totalPages - 1}
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
