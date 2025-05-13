// src/app/dashboard/leaderboard/page.tsx
"use client";

import { useChildProfilesContext } from '@/contexts/child-profiles-context';
import type { ChildProfile } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, Star, Users, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function LeaderboardPage() {
  const { profiles } = useChildProfilesContext();

  const participatingProfiles = profiles
    .filter(profile => profile.enableLeaderboard)
    .sort((a, b) => (b.points || 0) - (a.points || 0));

  return (
    <div className="container mx-auto py-8">
      <Card className="shadow-xl border-t-4 border-accent">
        <CardHeader className="text-center">
          <div className="mx-auto bg-accent/10 p-4 rounded-full w-fit mb-4">
            <Trophy className="h-16 w-16 text-accent" />
          </div>
          <CardTitle className="text-4xl font-bold text-accent">Leaderboard</CardTitle>
          <CardDescription className="text-lg text-muted-foreground mt-2">
            See who&apos;s topping the charts in Shannon! Points are earned by completing lessons and quizzes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {participatingProfiles.length === 0 ? (
            <div className="text-center py-12">
              <ShieldAlert className="h-20 w-20 text-muted-foreground mx-auto mb-6" />
              <p className="text-2xl text-muted-foreground mb-4">The Leaderboard is Empty</p>
              <p className="text-muted-foreground mb-6">
                No children have opted to participate in the leaderboard yet, or no points have been scored.
                <br/> You can enable leaderboard participation in each child&apos;s profile settings.
              </p>
              <Link href="/dashboard/profiles" passHref>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Users className="mr-2 h-5 w-5" /> Manage Profiles
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px] text-center text-base">Rank</TableHead>
                    <TableHead className="text-base">Name</TableHead>
                    <TableHead className="text-right text-base">Points</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participatingProfiles.map((profile, index) => (
                    <TableRow key={profile.id} className={index < 3 ? 'bg-secondary/50 font-semibold' : ''}>
                      <TableCell className="text-center">
                        {index === 0 && <Trophy className="h-6 w-6 text-yellow-500 inline-block" />}
                        {index === 1 && <Trophy className="h-6 w-6 text-gray-400 inline-block" />}
                        {index === 2 && <Trophy className="h-6 w-6 text-orange-400 inline-block" />}
                        {index >= 3 && (
                            <span className="text-lg font-medium">{index + 1}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border">
                            <AvatarImage src={`https://avatar.vercel.sh/${encodeURIComponent(profile.avatarSeed || profile.name)}.png?size=40`} alt={profile.name} />
                            <AvatarFallback>{profile.name[0].toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="text-lg">{profile.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 text-lg">
                           <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" /> 
                           {profile.points || 0}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      <p className="text-center text-xs text-muted-foreground mt-6">
        Leaderboard participation is optional and can be managed in each child&apos;s profile settings.
      </p>
    </div>
  );
}
