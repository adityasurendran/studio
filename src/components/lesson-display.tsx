// src/components/lesson-display.tsx
"use client";

import type { GeneratedLesson, ChildProfile } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { BookOpen, Layers, Type, Palette } from 'lucide-react';

interface LessonDisplayProps {
  lesson: GeneratedLesson;
  childProfile?: ChildProfile | null;
}

export default function LessonDisplay({ lesson, childProfile }: LessonDisplayProps) {
  const themeClass = childProfile?.theme === 'dark' ? 'dark-theme-lesson' : 
                     childProfile?.theme === 'colorful' ? 'colorful-theme-lesson' :
                     childProfile?.theme === 'simple' ? 'simple-theme-lesson' :
                     ''; // default or light
  const fontClass = childProfile?.screenIssues?.includes('larger fonts') ? 'text-lg' : ''; // Example for larger fonts

  return (
    <Card className={cn("w-full shadow-xl transition-all duration-300", themeClass)}>
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
      <CardContent className={cn("prose max-w-none dark:prose-invert", fontClass, themeClass === 'dark-theme-lesson' ? 'prose-invert' : '')}>
        {/* Using prose for nice default styling of HTML content */}
        {/* For safety, if lessonContent can be HTML, ensure it's sanitized or use a markdown renderer */}
        <div dangerouslySetInnerHTML={{ __html: lesson.lessonContent.replace(/\n/g, '<br />') }} />
      </CardContent>
      <style jsx global>{`
        .dark-theme-lesson {
          background-color: #2d3748; /* Example dark bg */
          color: #e2e8f0; /* Example light text */
        }
        .dark-theme-lesson .prose { color: #e2e8f0; }
        .dark-theme-lesson .text-primary { color: var(--primary-dark-variant); /* define in globals if needed */ }

        .colorful-theme-lesson {
          background: linear-gradient(135deg, #a0e7e5, #faf3dd); /* Teal to Yellow */
          color: #333;
        }
        .colorful-theme-lesson .text-primary { color: #FFB347 /* Coral for titles */ }

        .simple-theme-lesson {
            background-color: #fff;
            color: #1a202c;
            border: 1px solid #e2e8f0;
        }
        .simple-theme-lesson .text-primary { color: #2c5282; /* A calm blue */ }

        /* Ensure prose styles are compatible with themes */
        .dark-theme-lesson .prose :where(h1,h2,h3,h4,strong):not(:where([class~="not-prose"] *)) { color: #f7fafc; }
        .colorful-theme-lesson .prose :where(h1,h2,h3,h4,strong):not(:where([class~="not-prose"] *)) { color: #4a5568; }
        .simple-theme-lesson .prose :where(h1,h2,h3,h4,strong):not(:where([class~="not-prose"] *)) { color: #2c5282; }

      `}</style>
    </Card>
  );
}
