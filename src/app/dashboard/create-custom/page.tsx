// src/app/dashboard/create-custom/page.tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileEdit, Lightbulb } from "lucide-react"; // Or Construction, Wrench

export default function CreateCustomPage() {
  return (
    <div className="container mx-auto py-8">
      <Card className="shadow-xl border-t-4 border-accent">
        <CardHeader className="text-center">
          <div className="mx-auto bg-accent/10 p-4 rounded-full w-fit mb-4">
            <FileEdit className="h-16 w-16 text-accent" />
          </div>
          <CardTitle className="text-4xl font-bold text-accent">Custom Content Creation</CardTitle>
          <CardDescription className="text-lg text-muted-foreground mt-2">
            Unleash your creativity! This space is for building and tailoring your own learning materials.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12">
          <Lightbulb className="h-20 w-20 text-primary mx-auto mb-6 animate-pulse" />
          <h2 className="text-3xl font-semibold text-primary mb-4">Feature Coming Soon!</h2>
          <p className="text-xl text-foreground mb-3">
            We&apos;re working hard to bring you powerful tools to:
          </p>
          <ul className="list-disc list-inside text-left max-w-md mx-auto text-muted-foreground space-y-1 mb-8">
            <li>Create your own lessons from scratch.</li>
            <li>Modify AI-generated lessons to better suit your child.</li>
            <li>Design custom quizzes and activities.</li>
            <li>Share (optionally) your creations with the community.</li>
          </ul>
          <p className="text-lg text-foreground mb-6">
            Stay tuned for updates! In the meantime, you can continue using the AI lesson generator.
          </p>
          <Link href="/dashboard/lessons/new" passHref>
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Generate AI Lesson
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
