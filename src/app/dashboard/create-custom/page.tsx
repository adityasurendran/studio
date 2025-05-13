// src/app/dashboard/create-custom/page.tsx
"use client";

import CustomLessonCreatorForm from "@/components/custom-lesson-creator-form";
import { useActiveChildProfile } from '@/contexts/active-child-profile-context';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Loader2, Users, FileEdit } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function CreateCustomPage() {
  const { activeChild, isLoading } = useActiveChildProfile();

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
                        <FileEdit className="h-16 w-16 text-primary" />
                    </div>
                    <CardTitle className="text-3xl font-semibold">No Active Child Profile</CardTitle>
                    <CardDescription className="text-base mt-2 text-muted-foreground">
                        To create a custom lesson, please first select an active child profile.
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
    <div className="container mx-auto py-6 md:py-8">
      <CustomLessonCreatorForm childProfile={activeChild} />
    </div>
  );
}
