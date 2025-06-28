"use client";

import { useState } from 'react';
import { useActiveChildProfile } from '@/contexts/active-child-profile-context';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2, Users, Compass, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SubjectSelector from '@/components/subject-selector';
import BookBasedLessonForm from '@/components/book-based-lesson-form';

export default function BookBasedLessonPage() {
  const { activeChild, isLoading } = useActiveChildProfile();
  const [selectedSubject, setSelectedSubject] = useState<string | undefined>(undefined);

  if (isLoading) {
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
              <Compass className="h-16 w-16 text-primary" />
            </div>
            <CardTitle className="text-3xl font-semibold">No Active Child Profile</CardTitle>
            <CardDescription className="text-base mt-2 text-muted-foreground">
              To generate a book-based lesson, please first select an active child profile.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Link href="/dashboard/profiles" passHref>
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-6 shadow-md hover:shadow-lg" size="lg">
                <Users className="mr-2 h-5 w-5" /> Manage Child Profiles
              </Button>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">
              You can set an active profile from the Profiles page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 md:py-8 space-y-6">
      {/* Back Button */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/lessons/new" passHref>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Lesson Generator
          </Button>
        </Link>
      </div>

      {/* Subject Selection or Lesson Form */}
      {!selectedSubject ? (
        <SubjectSelector 
          onSubjectSelect={setSelectedSubject}
          selectedSubject={selectedSubject}
        />
      ) : (
        <div className="space-y-6">
          {/* Subject Header */}
          <Card className="shadow-lg border-primary/20">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Compass className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-primary">
                      {selectedSubject} Lessons
                    </CardTitle>
                    <CardDescription className="text-base text-muted-foreground">
                      Generate lessons based on {selectedSubject} books for {activeChild.name}
                    </CardDescription>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedSubject(undefined)}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Change Subject
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Lesson Form */}
          <BookBasedLessonForm 
            childProfile={activeChild}
            selectedSubject={selectedSubject}
          />
        </div>
      )}
    </div>
  );
} 