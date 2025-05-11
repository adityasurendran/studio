// src/app/dashboard/page.tsx
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useChildProfilesContext } from '@/contexts/child-profiles-context';
import { useActiveChildProfile } from '@/contexts/active-child-profile-context';
import { Users, UserPlus, BookOpen, CheckCircle, Smile, Brain, Sparkles } from 'lucide-react';
import Image from 'next/image';

export default function DashboardOverviewPage() {
  const { profiles } = useChildProfilesContext();
  const { activeChild, setActiveChildId } = useActiveChildProfile();

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl text-primary flex items-center gap-2">
            <Sparkles className="h-8 w-8" /> Dashboard Overview
          </CardTitle>
          <CardDescription>Welcome back! Manage child profiles and generate engaging lessons.</CardDescription>
        </CardHeader>
        <CardContent>
          {activeChild ? (
            <div className="p-6 bg-secondary/30 rounded-lg text-center">
              <Image 
                src={`https://picsum.photos/seed/${activeChild.name}/100/100`} 
                alt={activeChild.name} 
                width={100} 
                height={100} 
                className="rounded-full mx-auto mb-4 border-4 border-primary shadow-md"
                data-ai-hint="child avatar"
              />
              <h2 className="text-2xl font-semibold text-primary">
                {activeChild.name} is active!
              </h2>
              <p className="text-muted-foreground mb-4">Age: {activeChild.age} | Curriculum: {activeChild.curriculum}</p>
              <Link href="/dashboard/lessons/new" passHref>
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <BookOpen className="mr-2 h-5 w-5" /> Generate New Lesson for {activeChild.name}
                </Button>
              </Link>
            </div>
          ) : profiles.length > 0 ? (
            <div className="text-center p-6 bg-muted/50 rounded-lg">
              <p className="text-lg text-foreground mb-4">Please select a child profile to begin.</p>
              <Link href="/dashboard/profiles" passHref>
                <Button size="lg">
                  <Users className="mr-2 h-5 w-5" /> Go to Profiles
                </Button>
              </Link>
            </div>
          ) : (
            <div className="text-center p-6 bg-muted/50 rounded-lg">
              <p className="text-lg text-foreground mb-4">No child profiles found. Let&apos;s add one!</p>
              <Link href="/dashboard/profiles?action=add" passHref>
                <Button size="lg">
                  <UserPlus className="mr-2 h-5 w-5" /> Add Child Profile
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <FeatureCard
          icon={<Users className="h-8 w-8 text-primary" />}
          title="Manage Profiles"
          description="Create, view, and update profiles for each child."
          link="/dashboard/profiles"
          linkLabel="View Profiles"
        />
        <FeatureCard
          icon={<Brain className="h-8 w-8 text-primary" />}
          title="AI-Powered Lessons"
          description="Generate tailored lessons based on your child's needs and interests."
          link="/dashboard/lessons/new"
          linkLabel="Create Lesson"
          disabled={!activeChild}
        />
        <FeatureCard
          icon={<Smile className="h-8 w-8 text-primary" />}
          title="Adaptive Learning"
          description="Lessons adapt to screen preferences and learning styles."
          link="#"
          linkLabel="Learn More (Coming Soon)"
          disabled
        />
      </div>

      {profiles.length > 0 && !activeChild && (
        <Card>
          <CardHeader>
            <CardTitle>Select an Active Profile</CardTitle>
            <CardDescription>Choose a child to focus on for lesson generation and tracking.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {profiles.map(profile => (
              <Button 
                key={profile.id} 
                variant="outline" 
                className="p-4 h-auto flex flex-col items-start text-left"
                onClick={() => setActiveChildId(profile.id)}
              >
                <span className="font-semibold text-lg">{profile.name}</span>
                <span className="text-sm text-muted-foreground">Age: {profile.age}</span>
              </Button>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  link: string;
  linkLabel: string;
  disabled?: boolean;
}

function FeatureCard({ icon, title, description, link, linkLabel, disabled }: FeatureCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        {icon}
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">{description}</p>
        <Link href={disabled ? "#" : link} passHref>
          <Button variant="secondary" className="w-full" disabled={disabled}>
            {linkLabel}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
