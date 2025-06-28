"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, GraduationCap, Loader2, CheckCircle } from 'lucide-react';

interface SubjectMapping {
  [subject: string]: string[];
}

interface SubjectSelectorProps {
  onSubjectSelect: (subject: string) => void;
  selectedSubject?: string;
}

export default function SubjectSelector({ onSubjectSelect, selectedSubject }: SubjectSelectorProps) {
  const [subjects, setSubjects] = useState<SubjectMapping>({});
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const response = await fetch('/api/subjects');
        if (response.ok) {
          const data = await response.json();
          setSubjects(data);
        } else {
          console.error('Failed to load subjects');
        }
      } catch (error) {
        console.error('Error loading subjects:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSubjects();
  }, []);

  const handleSubjectClick = (subject: string) => {
    if (subjects[subject]) {
      onSubjectSelect(subject);
    } else {
      toast({
        title: "Coming Soon",
        description: `Lessons for ${subject} are coming soon!`,
        variant: "default",
      });
    }
  };

  const availableSubjects = Object.keys(subjects);
  const unavailableSubjects = [
    'Irish', 'Maths', 'History', 'Geography', 'Business', 
    'French', 'German', 'Art', 'Music', 'Technology'
  ].filter(subject => !availableSubjects.includes(subject));

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto shadow-xl border-t-4 border-primary">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-10 w-10 text-primary" />
            <div>
              <CardTitle className="text-3xl font-bold text-primary">Select Subject</CardTitle>
              <CardDescription className="text-lg text-muted-foreground">
                Choose a subject to generate lessons from our book collection
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex justify-center py-12">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-xl border-t-4 border-primary">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <GraduationCap className="h-10 w-10 text-primary" />
          <div>
            <CardTitle className="text-3xl font-bold text-primary">Select Subject</CardTitle>
            <CardDescription className="text-lg text-muted-foreground">
              Choose a subject to generate lessons from our book collection
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Available Subjects */}
        <div>
          <h3 className="text-xl font-semibold text-primary mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Available Subjects
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {availableSubjects.map((subject) => (
              <Button
                key={subject}
                variant={selectedSubject === subject ? "default" : "outline"}
                className={`h-16 text-base font-medium transition-all duration-200 ${
                  selectedSubject === subject 
                    ? "bg-primary text-primary-foreground shadow-lg scale-105" 
                    : "hover:bg-primary/10 hover:border-primary hover:text-primary hover:scale-105"
                }`}
                onClick={() => handleSubjectClick(subject)}
              >
                <BookOpen className="mr-2 h-4 w-4" />
                {subject}
              </Button>
            ))}
          </div>
        </div>

        {/* Unavailable Subjects */}
        {unavailableSubjects.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold text-muted-foreground mb-4 flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Coming Soon
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {unavailableSubjects.map((subject) => (
                <Button
                  key={subject}
                  variant="outline"
                  className="h-16 text-base font-medium text-muted-foreground border-dashed hover:bg-muted/50 cursor-not-allowed opacity-60"
                  onClick={() => handleSubjectClick(subject)}
                  disabled
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  {subject}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Subject Info */}
        {selectedSubject && subjects[selectedSubject] && (
          <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <h4 className="font-semibold text-primary mb-2">
              📚 Books Available for {selectedSubject}
            </h4>
            <div className="space-y-1">
              {subjects[selectedSubject].map((book, index) => (
                <p key={index} className="text-sm text-muted-foreground">
                  • {book}
                </p>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 