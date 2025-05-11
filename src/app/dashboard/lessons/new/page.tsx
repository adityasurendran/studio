// src/app/dashboard/lessons/new/page.tsx
"use client";

import LessonGeneratorForm from '@/components/lesson-generator-form';
import { useActiveChildProfile } from '@/contexts/active-child-profile-context';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2, UserPlus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';


export default function NewLessonPage() {
  const { activeChild, isLoading } = useActiveChildProfile();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!activeChild) {
    return (
        <Card className="max-w-lg mx-auto mt-10 text-center shadow-lg">
            <CardHeader>
                <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <CardTitle className="text-2xl">No Active Child Profile</CardTitle>
                <CardDescription>Please select or create a child profile to generate a lesson.</CardDescription>
            </CardHeader>
            <CardContent>
                <Link href="/dashboard/profiles" passHref>
                    <Button className="w-full" size="lg">
                        <UserPlus className="mr-2 h-5 w-5" /> Go to Profiles
                    </Button>
                </Link>
            </CardContent>
      </Card>
    );
  }

  return (
    <div className="container mx-auto py-2">
      <LessonGeneratorForm childProfile={activeChild} />
    </div>
  );
}
