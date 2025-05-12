// src/app/dashboard/page.tsx
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useChildProfilesContext } from '@/contexts/child-profiles-context';
import { useActiveChildProfile } from '@/contexts/active-child-profile-context';
import { Users, UserPlus, BookOpen, CheckCircle, Smile, Brain, Sparkles, History as HistoryIcon, TrendingUp, Award } from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function DashboardOverviewPage() {
  const { profiles } = useChildProfilesContext();
  const { activeChild, setActiveChildId } = useActiveChildProfile();

  return (
    <div className="space-y-8">
      <Card className="shadow-xl border-primary/20">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <Sparkles className="h-10 w-10 text-primary" />
            <div>
              <CardTitle className="text-4xl font-bold text-primary">Dashboard</CardTitle>
              <CardDescription className="text-lg text-muted-foreground">Welcome back! Let&apos;s continue the learning adventure.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {activeChild ? (
            <div className="p-6 bg-gradient-to-br from-primary/10 via-card to-secondary/10 rounded-lg shadow-lg text-center border border-primary/30">
              <Avatar className="w-28 h-28 mx-auto mb-4 border-4 border-primary shadow-xl">
                <AvatarImage src={`https://picsum.photos/seed/${activeChild.name}/120/120`} alt={activeChild.name} data-ai-hint="child avatar" />
                <AvatarFallback className="text-4xl bg-secondary/50 text-secondary-foreground">{activeChild.name[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <h2 className="text-3xl font-semibold text-primary">
                {activeChild.name}
              </h2>
              <p className="text-muted-foreground mt-1 mb-3">Ready for a new lesson!</p>
              <div className="text-sm text-foreground mb-6 space-y-1 bg-card/50 p-3 rounded-md border max-w-sm mx-auto">
                  <p><span className="font-medium text-primary/80">Age:</span> {activeChild.age}</p>
                  <p><span className="font-medium text-primary/80">Curriculum:</span> {activeChild.curriculum}</p>
              </div>
              <Link href="/dashboard/lessons/new" passHref>
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-md hover:shadow-lg transition-all duration-150 transform hover:scale-105 px-8 py-6 text-lg">
                  <BookOpen className="mr-2 h-6 w-6" /> Generate New Lesson
                </Button>
              </Link>
            </div>
          ) : profiles.length > 0 ? (
            <div className="text-center p-8 bg-card rounded-lg border border-dashed border-primary/50">
              <Users className="h-16 w-16 text-primary mx-auto mb-4" />
              <p className="text-xl text-foreground mb-4">Please select an active child profile to begin.</p>
              <Link href="/dashboard/profiles" passHref>
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Users className="mr-2 h-5 w-5" /> Go to Profiles
                </Button>
              </Link>
            </div>
          ) : (
            <div className="text-center p-8 bg-card rounded-lg border border-dashed border-accent/50">
              <UserPlus className="h-16 w-16 text-accent mx-auto mb-4" />
              <p className="text-xl text-foreground mb-4">No child profiles found. Let&apos;s add one!</p>
              <Link href="/dashboard/profiles?action=add" passHref>
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <UserPlus className="mr-2 h-5 w-5" /> Add Child Profile
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {activeChild && activeChild.lessonAttempts && activeChild.lessonAttempts.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-2">
                <HistoryIcon className="h-7 w-7 text-primary" />
                <CardTitle className="text-2xl text-primary">Recent Activity for {activeChild.name}</CardTitle>
            </div>
            <CardDescription>Overview of the latest lessons and quiz attempts.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {activeChild.lessonAttempts.slice(-3).reverse().map(attempt => (
                <li key={attempt.attemptId} className="p-4 border rounded-lg bg-card hover:shadow-xl transition-shadow duration-200 ease-in-out">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                        <h3 className="font-semibold text-lg text-primary group-hover:text-accent transition-colors">{attempt.lessonTitle}</h3>
                        <p className="text-sm text-muted-foreground">Topic: {attempt.lessonTopic}</p>
                    </div>
                    <div className="text-right">
                        <span className={`font-bold text-2xl ${attempt.quizScore >= 60 ? 'text-green-600' : 'text-destructive'}`}>
                        {attempt.quizScore}%
                        </span>
                        {attempt.quizTotalQuestions > 0 && (
                        <p className="text-xs text-muted-foreground">
                            {attempt.questionsAnsweredCorrectly}/{attempt.quizTotalQuestions} correct
                        </p>
                        )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-dashed">
                    <p className="text-xs text-muted-foreground">
                        {format(new Date(attempt.timestamp), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                    {attempt.choseToRelearn && (
                        <span className="text-xs px-3 py-1 bg-amber-100 text-amber-700 dark:bg-amber-700 dark:text-amber-100 rounded-full font-semibold shadow-sm">Chose to relearn</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            {activeChild.lessonAttempts.length > 3 && (
              <div className="text-center mt-6">
                <Button variant="link" asChild className="text-primary hover:text-accent">
                    <Link href="#">View all activity (coming soon)</Link>
                </Button>
              </div>
            )}
             {activeChild.lessonAttempts.length === 0 && (
                 <p className="text-center text-muted-foreground py-4">No recent activity recorded yet.</p>
             )}
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <FeatureCard
          icon={<Users className="h-10 w-10 text-primary" />}
          title="Manage Profiles"
          description="Create, view, and update profiles for each child."
          link="/dashboard/profiles"
          linkLabel="View Profiles"
        />
        <FeatureCard
          icon={<Brain className="h-10 w-10 text-primary" />}
          title="AI-Powered Lessons"
          description="Generate tailored lessons based on your child's needs and interests."
          link="/dashboard/lessons/new"
          linkLabel="Create Lesson"
          disabled={!activeChild}
        />
        <FeatureCard
          icon={<Award className="h-10 w-10 text-primary" />}
          title="Adaptive Learning"
          description="Lessons adapt to screen preferences and learning styles."
          link="#"
          linkLabel="Learn More (Coming Soon)"
          disabled
        />
      </div>

      {profiles.length > 0 && !activeChild && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-primary flex items-center gap-2"> <Users className="h-7 w-7" /> Select an Active Profile</CardTitle>
            <CardDescription>Choose a child to focus on for lesson generation and tracking.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {profiles.map(profile => (
              <Button
                key={profile.id}
                variant="outline"
                className="p-4 h-auto flex items-center gap-4 text-left w-full hover:bg-secondary/50 hover:border-primary transition-all duration-150 group shadow-sm hover:shadow-md"
                onClick={() => setActiveChildId(profile.id)}
              >
                <Avatar className="w-14 h-14 group-hover:scale-105 transition-transform border-2 border-muted group-hover:border-primary">
                    <AvatarImage src={`https://picsum.photos/seed/${profile.name}/56/56`} alt={profile.name} data-ai-hint="child avatar" />
                    <AvatarFallback className="text-xl">{profile.name[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <span className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors block">{profile.name}</span>
                    <span className="text-sm text-muted-foreground">Age: {profile.age}</span>
                </div>
                <CheckCircle className="w-6 h-6 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:text-primary transition-opacity" />
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
    <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out group">
      <CardHeader className="flex flex-col items-center text-center gap-3 pb-3">
        <div className="p-3 bg-primary/10 rounded-full group-hover:scale-110 transition-transform duration-200">
            {icon}
        </div>
        <CardTitle className="text-2xl font-semibold text-foreground group-hover:text-primary transition-colors">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-muted-foreground mb-6 min-h-[3em]">{description}</p>
        <Link href={disabled ? "#" : link} passHref legacyBehavior>
          <Button 
            variant="secondary" 
            className="w-full text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-colors group-hover:shadow-lg" 
            disabled={disabled}
            aria-disabled={disabled}
            tabIndex={disabled ? -1 : 0}
          >
            {linkLabel}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
