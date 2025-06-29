// src/app/dashboard/page.tsx
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useChildProfilesContext } from '@/contexts/child-profiles-context';
import { useActiveChildProfile } from '@/contexts/active-child-profile-context';
import { Users, UserPlus, BookOpen, CheckCircle, Smile, Brain, Sparkles, History as HistoryIcon, TrendingUp, Award, Loader2, BarChart3, Percent, BookCopy, Search, Eye, Star, Rocket, Target, Zap as ZapIcon, Trophy, FastForward, GraduationCap } from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { LessonAttempt, Badge as BadgeType } from '@/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuthContext } from '@/contexts/auth-context';
import { useState } from 'react';

// Helper to get Lucide icon component by name
const getLucideIcon = (iconName?: string) => {
  if (!iconName) return Award; // Default icon
  const icons: { [key: string]: React.ElementType } = {
    Rocket, Target, Award, TrendingUp, Star, ZapIcon, Brain, Trophy
  };
  return icons[iconName] || Award;
};

function DeveloperToolsPanel() {
  const [competitionMode, setCompetitionMode] = useState(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);

  // Placeholder handlers
  const handleToggleCompetition = () => {
    setCompetitionMode((prev) => !prev);
    // TODO: Actually toggle global competition mode
  };
  const handleRunTests = () => {
    setTestStatus('Running...');
    // TODO: Call backend or trigger test runner
    setTimeout(() => setTestStatus('All tests passed!'), 1200);
  };
  const handleSendTestEmail = () => {
    setEmailStatus('Sending...');
    // TODO: Call backend/email endpoint
    setTimeout(() => setEmailStatus('Test email sent!'), 1000);
  };

  return (
    <Card className="border-4 border-dashed border-primary shadow-lg mb-8">
      <CardHeader>
        <CardTitle className="text-xl text-primary">Developer Tools</CardTitle>
        <CardDescription>Only visible to developer account</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant={competitionMode ? 'default' : 'outline'} onClick={handleToggleCompetition}>
            {competitionMode ? 'Competition Mode: ON' : 'Competition Mode: OFF'}
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={handleRunTests}>Run Tests</Button>
          {testStatus && <span className="text-sm text-muted-foreground">{testStatus}</span>}
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={handleSendTestEmail}>Send Test Email Report</Button>
          {emailStatus && <span className="text-sm text-muted-foreground">{emailStatus}</span>}
        </div>
        {/* Add more dev tools here as needed */}
      </CardContent>
    </Card>
  );
}

export default function DashboardOverviewPage() {
  const { profiles } = useChildProfilesContext();
  const { activeChild, setActiveChildId, isLoading: activeChildLoading } = useActiveChildProfile();
  const { developerMode } = useAuthContext();

  if (activeChildLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-var(--header-height,4rem)-3rem)] text-center p-4">
        <Loader2 className="h-12 w-12 sm:h-16 sm:w-16 animate-spin text-primary mb-4" />
        <p className="text-lg sm:text-xl text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }
  
  const getProgressStats = () => {
    if (!activeChild || !activeChild.lessonAttempts || activeChild.lessonAttempts.length === 0) {
      return {
        totalLessonsAttempted: 0,
        averageQuizScore: 0,
        subjectsCovered: new Set<string>(),
        totalCorrectAnswers: 0,
        totalQuestionsAttempted: 0,
        accuracy: 0,
        totalPoints: activeChild?.points || 0,
        badges: activeChild?.badges || [],
      };
    }
    const attempts = activeChild.lessonAttempts;
    const totalLessonsAttempted = attempts.length;
    const totalQuizScoreSum = attempts.reduce((sum, attempt) => sum + attempt.quizScore, 0);
    const averageQuizScore = totalLessonsAttempted > 0 ? Math.round(totalQuizScoreSum / totalLessonsAttempted) : 0;
    
    const subjectsCovered = new Set<string>();
    attempts.forEach(attempt => {
        if(attempt.lessonTopic && attempt.lessonTopic.trim() !== "") {
            subjectsCovered.add(attempt.lessonTopic);
        } else if (attempt.lessonTitle && attempt.lessonTitle.trim() !== "") {
            subjectsCovered.add(attempt.lessonTitle);
        } else {
            subjectsCovered.add("General Topic"); 
        }
    });

    const totalCorrectAnswers = attempts.reduce((sum, attempt) => sum + (attempt.questionsAnsweredCorrectly || 0), 0);
    const totalQuestionsAttempted = attempts.reduce((sum, attempt) => sum + (attempt.quizTotalQuestions || 0), 0);
    const accuracy = totalQuestionsAttempted > 0 ? Math.round((totalCorrectAnswers / totalQuestionsAttempted) * 100) : 0;

    return {
      totalLessonsAttempted,
      averageQuizScore,
      subjectsCovered,
      totalCorrectAnswers,
      totalQuestionsAttempted,
      accuracy,
      totalPoints: activeChild.points || 0,
      badges: activeChild.badges || [],
    };
  };

  const progressStats = getProgressStats();

  return (
    <div className="space-y-6 sm:space-y-8 px-3 sm:px-4">
      {developerMode && <DeveloperToolsPanel />}
      <Card className="shadow-xl border-primary/20">
        <CardHeader className="pb-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
            <div>
              <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary">Dashboard</CardTitle>
              <CardDescription className="text-base sm:text-lg text-muted-foreground">Welcome back! Let&apos;s continue the learning adventure.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          {activeChild ? (
            <div className="p-4 sm:p-6 bg-gradient-to-br from-primary/10 via-card to-secondary/10 rounded-lg shadow-lg text-center border border-primary/30">
              <Avatar className="w-20 h-20 sm:w-28 sm:h-28 mx-auto mb-4 border-4 border-primary shadow-xl">
                <AvatarImage src={`https://avatar.vercel.sh/${encodeURIComponent(activeChild.avatarSeed?.trim() || activeChild.name)}.png?size=120`} alt={activeChild.name} />
                <AvatarFallback className="text-2xl sm:text-4xl bg-secondary/50 text-secondary-foreground">{activeChild.name[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <h2 className="text-2xl sm:text-3xl font-semibold text-primary">
                {activeChild.name}
              </h2>
              <p className="text-muted-foreground mt-1 mb-3">Ready for a new lesson!</p>
              <div className="text-xs sm:text-sm text-foreground mb-4 sm:mb-6 space-y-1 bg-card/50 p-3 rounded-md border max-w-sm mx-auto">
                  <p><span className="font-medium text-primary/80">Age:</span> {activeChild.age}</p>
                  <p><span className="font-medium text-primary/80">Curriculum:</span> {activeChild.curriculum}</p>
                   {activeChild.learningStyle && <p><span className="font-medium text-primary/80">Learning Style:</span> <span className="capitalize">{activeChild.learningStyle.replace(/_/g, ' ')}</span></p>}
                   {activeChild.fontSizePreference && <p><span className="font-medium text-primary/80">Font Size:</span> <span className="capitalize">{activeChild.fontSizePreference}</span></p>}
              </div>
              <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3">
                <Link href="/dashboard/lessons/new" passHref>
                  <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-md hover:shadow-lg transition-all duration-150 transform hover:scale-105 px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg w-full sm:w-auto">
                    <BookOpen className="mr-2 h-5 w-5 sm:h-6 sm:w-6" /> Generate New Lesson
                  </Button>
                </Link>
                <Link href="/dashboard/lessons/book-based" passHref>
                  <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg transition-all duration-150 transform hover:scale-105 px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg w-full sm:w-auto">
                    <GraduationCap className="mr-2 h-5 w-5 sm:h-6 sm:w-6" /> Book-Based Lessons
                  </Button>
                </Link>
                <Link href="/dashboard/discover" passHref>
                  <Button size="lg" variant="outline" className="text-primary border-primary hover:bg-primary/10 shadow-md hover:shadow-lg transition-all duration-150 transform hover:scale-105 px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg w-full sm:w-auto">
                    <Search className="mr-2 h-5 w-5 sm:h-6 sm:w-6" /> Explore Topics
                  </Button>
                </Link>
              </div>
            </div>
          ) : profiles.length > 0 ? (
            <div className="text-center p-6 sm:p-8 bg-card rounded-lg border border-dashed border-primary/50">
              <Users className="h-12 w-12 sm:h-16 sm:w-16 text-primary mx-auto mb-4" />
              <p className="text-lg sm:text-xl text-foreground mb-4">Please select an active child profile to begin.</p>
              <Link href="/dashboard/profiles" passHref>
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Users className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Go to Profiles
                </Button>
              </Link>
            </div>
          ) : (
            <div className="text-center p-6 sm:p-8 bg-card rounded-lg border border-dashed border-accent/50">
              <UserPlus className="h-12 w-12 sm:h-16 sm:w-16 text-accent mx-auto mb-4" />
              <p className="text-lg sm:text-xl text-foreground mb-4">No child profiles found. Let&apos;s add one!</p>
              <Link href="/dashboard/profiles?action=add" passHref>
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <UserPlus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Add Child Profile
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {activeChild && (
        <Card className="shadow-lg">
          <CardHeader className="px-4 sm:px-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <CardTitle className="text-xl sm:text-2xl text-primary">Progress & Rewards for {activeChild.name}</CardTitle>
            </div>
            <CardDescription>A snapshot of {activeChild.name}&apos;s learning journey, points, and badges.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-center px-4 sm:px-6">
            <StatCard icon={<Star className="text-yellow-400 fill-yellow-400" />} label="Total Points" value={progressStats.totalPoints.toString()} />
            <StatCard icon={<TrendingUp className="text-accent"/>} label="Lessons Attempted" value={progressStats.totalLessonsAttempted.toString()} />
            <StatCard icon={<Award className="text-green-500"/>} label="Average Quiz Score" value={`${progressStats.averageQuizScore}%`} />
            <StatCard 
              icon={<Percent className="text-blue-500"/>} 
              label="Overall Accuracy" 
              value={`${progressStats.accuracy}%`} 
              description={progressStats.totalQuestionsAttempted > 0 ? `(${progressStats.totalCorrectAnswers} / ${progressStats.totalQuestionsAttempted} correct)` : "(No quiz questions attempted yet)"}
            />
            <div className="sm:col-span-2 lg:col-span-1 lg:row-span-2">
                 <h4 className="text-base sm:text-lg font-semibold text-left mb-2 text-primary flex items-center gap-2"> <Award className="h-4 w-4 sm:h-5 sm:w-5"/> Badges Earned:</h4>
                {progressStats.badges.length > 0 ? (
                     <div className="flex flex-wrap gap-2 justify-center sm:justify-start p-2 bg-secondary/30 rounded-md border min-h-[60px]">
                    <TooltipProvider>
                        {progressStats.badges.slice(0,8).map((badge: BadgeType) => { 
                         const IconComponent = getLucideIcon(badge.iconName);
                         return (
                            <Tooltip key={badge.id}>
                                <TooltipTrigger asChild>
                                    <span className="p-2 sm:p-2.5 bg-card rounded-full shadow-md hover:bg-accent/10 transition-colors cursor-default">
                                        <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent className="bg-popover text-popover-foreground shadow-xl text-left">
                                    <p className="font-bold text-primary">{badge.name}</p>
                                    <p className="text-xs max-w-xs">{badge.description}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">Earned: {new Date(badge.dateEarned).toLocaleDateString()}</p>
                                </TooltipContent>
                            </Tooltip>
                         );
                        })}
                        {progressStats.badges.length > 8 && (
                             <span className="p-2 sm:p-2.5 bg-card rounded-full shadow-md text-xs sm:text-sm font-semibold text-accent flex items-center justify-center h-9 w-9 sm:h-11 sm:w-11">+{progressStats.badges.length - 8}</span>
                        )}
                    </TooltipProvider>
                    </div>
                ) : (
                    <div className="text-center p-4 bg-secondary/30 rounded-md border min-h-[60px] flex items-center justify-center">
                        <p className="text-sm text-muted-foreground">No badges earned yet. Keep learning!</p>
                    </div>
                )}
            </div>
            <div className="md:col-span-full lg:col-span-2">
              <h4 className="text-lg font-semibold text-left mb-2 text-primary flex items-center gap-2"> <BookCopy className="h-5 w-5"/> Subjects Explored:</h4>
              {progressStats.subjectsCovered.size > 0 ? (
                <div className="flex flex-wrap gap-2 p-2 bg-secondary/30 rounded-md border min-h-[60px] items-center">
                  {Array.from(progressStats.subjectsCovered).map(subject => (
                    <span key={subject} className="bg-secondary text-secondary-foreground px-3 py-1.5 rounded-full text-sm font-medium shadow-sm">
                      {subject}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-left text-sm italic p-2 bg-secondary/30 rounded-md border">No specific subjects recorded in lesson attempts yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}


      {activeChild && activeChild.lessonAttempts && activeChild.lessonAttempts.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-2">
                <HistoryIcon className="h-7 w-7 text-primary" />
                <CardTitle className="text-2xl text-primary">Recent Activity for {activeChild.name}</CardTitle>
            </div>
            <CardDescription>Overview of the latest lessons and quiz attempts. For a full history, visit the <Link href="/dashboard/lessons" className="text-accent hover:underline">Lesson History</Link> page.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {activeChild.lessonAttempts.slice(-3).reverse().map(attempt => (
                <li key={attempt.attemptId} className="p-4 border rounded-lg bg-card hover:shadow-xl transition-shadow duration-200 ease-in-out">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
                    <div className="flex-grow mb-2 sm:mb-0">
                        <h3 className="font-semibold text-lg text-primary group-hover:text-accent transition-colors line-clamp-1" title={attempt.lessonTitle}>{attempt.lessonTitle}</h3>
                        <p className="text-sm text-muted-foreground">Topic: {attempt.lessonTopic || "N/A"}</p>
                    </div>
                    <div className="text-left sm:text-right w-full sm:w-auto">
                        <span className={`font-bold text-2xl ${attempt.quizScore >= 60 ? 'text-green-600' : 'text-destructive'}`}>
                        {attempt.quizScore}%
                        </span>
                        {attempt.quizTotalQuestions > 0 && (
                        <p className="text-xs text-muted-foreground">
                            {attempt.questionsAnsweredCorrectly}/{attempt.quizTotalQuestions} correct
                        </p>
                        )}
                         {attempt.quizTotalQuestions === 0 && (
                             <p className="text-xs text-muted-foreground">(No quiz in this lesson)</p>
                         )}
                          {attempt.pointsAwarded !== undefined && (
                             <p className="text-xs text-yellow-600 dark:text-yellow-400">+{attempt.pointsAwarded} points</p>
                         )}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between items-center mt-2 pt-2 border-t border-dashed">
                    <p className="text-xs text-muted-foreground mb-1 sm:mb-0">
                        {format(new Date(attempt.timestamp), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                    {attempt.choseToRelearn && (
                        <span className="text-xs px-3 py-1 bg-amber-100 text-amber-700 dark:bg-amber-700 dark:text-amber-100 rounded-full font-semibold shadow-sm self-start sm:self-center">Chose to relearn</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
             {activeChild.lessonAttempts.length === 0 && (
                 <p className="text-center text-muted-foreground py-4">No recent activity recorded yet.</p>
             )}
          </CardContent>
           {activeChild.lessonAttempts.length > 3 && (
              <CardFooter className="justify-center pt-4">
                <Button variant="outline" asChild className="text-primary hover:text-accent hover:border-accent">
                    <Link href="/dashboard/lessons"><Eye className="mr-2"/> View All Activity</Link>
                </Button>
              </CardFooter>
            )}
        </Card>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">
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
          icon={<GraduationCap className="h-10 w-10 text-primary" />}
          title="Book-Based Lessons"
          description="Generate lessons from our curated collection of Irish Junior Cycle textbooks."
          link="/dashboard/lessons/book-based"
          linkLabel="Browse Subjects"
          disabled={!activeChild}
        />
        <FeatureCard
          icon={<Search className="h-10 w-10 text-primary" />}
          title="Explore Topics"
          description="Get AI suggestions for new lesson topics tailored to your child."
          link="/dashboard/discover" 
          linkLabel="Discover Topics"
          disabled={!activeChild}
        />
         <FeatureCard
          icon={<FastForward className="h-10 w-10 text-primary" />}
          title="Next Lesson Recommendations"
          description="Get AI suggestions for the next logical lesson based on progress."
          link="/dashboard/recommendations"
          linkLabel="Get Recommendation"
          disabled={!activeChild || !activeChild.lessonAttempts || activeChild.lessonAttempts.length === 0}
        />
         <FeatureCard
          icon={<Trophy className="h-10 w-10 text-primary" />}
          title="Leaderboard"
          description="See who's topping the charts! (Optional participation)"
          link="/dashboard/leaderboard"
          linkLabel="View Leaderboard"
          disabled={profiles.length === 0} // Disable if no profiles exist
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
                    <AvatarImage src={`https://avatar.vercel.sh/${encodeURIComponent(profile.avatarSeed?.trim() || profile.name)}.png?size=56`} alt={profile.name} />
                    <AvatarFallback className="text-xl">{profile.name[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <span className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors block">{profile.name}</span>
                    <span className="text-sm text-muted-foreground">Age: {profile.age}</span>
                     <span className="text-sm text-muted-foreground block mt-0.5"><Star className="h-3 w-3 inline-block mr-1 text-yellow-500 fill-yellow-400"/> Points: {profile.points || 0}</span>
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

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  description?: string;
}

function StatCard({ icon, label, value, description }: StatCardProps) {
  return (
    <Card className="p-4 bg-card hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-center text-muted-foreground mb-2">
        {icon}
        <h3 className="ml-2 text-base font-medium">{label}</h3>
      </div>
      <p className="text-3xl font-bold text-primary">{value}</p>
      {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
    </Card>
  );
}