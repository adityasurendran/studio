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

const MASTER_SUBJECTS = [
  'English', 'Home Economics', 'Religion', 'Civics', 'Science', 'Spanish',
  'Irish', 'Maths', 'History', 'Geography', 'Business', 'French', 'German', 'Art', 'Music', 'Technology'
];

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

  const availableSubjects = Object.keys(subjects).map(s => s.charAt(0).toUpperCase() + s.slice(1));
  const unavailableSubjects = MASTER_SUBJECTS.filter(subject => !availableSubjects.includes(subject));

  const handleSubjectClick = (subject: string) => {
    if (availableSubjects.includes(subject)) {
      onSubjectSelect(subject);
    } else {
      toast({
        title: "Coming Soon",
        description: `Lessons for ${subject} are coming soon!`,
        variant: "default",
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full sm:max-w-2xl md:max-w-4xl mx-auto shadow-xl border-t-4 border-primary">
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
    <Card className="w-full sm:max-w-2xl md:max-w-4xl mx-auto shadow-xl border-t-4 border-primary">
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

        {/* Subject Buttons */}
        <div>
          <h3 className="text-xl font-semibold text-primary mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Available Subjects
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {MASTER_SUBJECTS.map((subject) => (
              <Button
                key={subject}
                variant={selectedSubject === subject ? "default" : "outline"}
                className={`h-16 text-base font-medium transition-all duration-200 ${
                  availableSubjects.includes(subject)
                    ? (selectedSubject === subject
                        ? "bg-primary text-primary-foreground shadow-lg scale-105"
                        : "hover:bg-primary/10 hover:border-primary hover:text-primary hover:scale-105")
                    : "text-muted-foreground border-dashed cursor-not-allowed opacity-60 hover:bg-muted/50"
                }`}
                onClick={() => handleSubjectClick(subject)}
                disabled={!availableSubjects.includes(subject)}
              >
                <BookOpen className="mr-2 h-4 w-4" />
                {subject}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 