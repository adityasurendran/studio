// src/app/dashboard/profiles/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ChildProfileForm from '@/components/child-profile-form';
import { useChildProfilesContext } from '@/contexts/child-profiles-context';
import { useActiveChildProfile } from '@/contexts/active-child-profile-context';
import type { ChildProfile, Badge as BadgeType } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Edit3, Trash2, CheckCircle, Users, Eye, Sparkle, Brain, Award, Star, Rocket, Target, TrendingUp, Zap as ZapIcon, BarChartHorizontalBig, KeyRound, Lock } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import PinDialog from '@/components/pin-dialog'; // Import PinDialog
import { useAuth } from '@/hooks/use-auth'; // Import useAuth

type ProfileFormData = Omit<ChildProfile, 'id' | 'lessonAttempts' | 'savedLessons' | 'recentMood' | 'lessonHistory' | 'points' | 'badges' >;

const getLucideIcon = (iconName?: string) => {
  if (!iconName) return Award; 
  const icons: { [key: string]: React.ElementType } = {
    Rocket, Target, Award, TrendingUp, Star, ZapIcon, Brain, BarChartHorizontalBig
  };
  return icons[iconName] || Award;
};


export default function ManageProfilesPage() {
  const { profiles, addProfile, updateProfile, deleteProfile } = useChildProfilesContext();
  const { activeChild, setActiveChildId } = useActiveChildProfile();
  const [editingProfile, setEditingProfile] = useState<ChildProfile | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<ChildProfile | null>(null);
  
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const { isLocalPinSetup, verifyLocalPin } = useAuth(); // Get PIN status and verification function

  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pinAction, setPinAction] = useState<'add' | 'edit' | null>(null); // To know which action to perform after PIN

  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      handleOpenAddForm(); // Use the new handler that checks PIN
    }
  }, [searchParams, isLocalPinSetup]); // Add isLocalPinSetup to dependency array


  const proceedWithAddForm = () => {
    setEditingProfile(null);
    setShowForm(true);
  };

  const proceedWithEditForm = (profile: ChildProfile) => {
    setEditingProfile(profile);
    setShowForm(true);
  };

  const handleOpenAddForm = () => {
    if (isLocalPinSetup) {
      setPinAction('add');
      setShowPinDialog(true);
    } else {
      proceedWithAddForm();
    }
  };

  const handleOpenEditForm = (profile: ChildProfile) => {
    if (isLocalPinSetup) {
      setPinAction('edit');
      setEditingProfile(profile); // Store profile to edit after PIN
      setShowPinDialog(true);
    } else {
      proceedWithEditForm(profile);
    }
  };

  const handlePinSuccess = (pinValue?: string) => {
    // verifyLocalPin is called by PinDialog if mode is 'enter'
    // For this flow, we always need to verify
    if (pinValue && verifyLocalPin(pinValue)) {
        setShowPinDialog(false);
        if (pinAction === 'add') {
            proceedWithAddForm();
        } else if (pinAction === 'edit' && editingProfile) {
            proceedWithEditForm(editingProfile);
        }
        setPinAction(null);
        toast({title: "PIN Verified", description: "Access granted."})
    } else {
        toast({title: "Incorrect PIN", description: "Please try again.", variant: "destructive"});
        // PinDialog remains open, or you can close it and reset pinAction
    }
  };


  const handleAddProfile = (data: ProfileFormData) => {
    const newProfile = addProfile(data);
    toast({ title: "Profile Created", description: `${data.name}'s profile has been successfully created.` });
    setShowForm(false);
    setActiveChildId(newProfile.id); 
  };

  const handleUpdateProfile = (data: ProfileFormData) => {
    if (editingProfile) {
      updateProfile({ ...editingProfile, ...data, points: editingProfile.points, badges: editingProfile.badges }); 
      toast({ title: "Profile Updated", description: `${data.name}'s profile has been successfully updated.` });
      setEditingProfile(null);
      setShowForm(false);
    }
  };

  const handleDeleteProfile = (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    if (profile) {
      deleteProfile(profileId);
      toast({ title: "Profile Deleted", description: `${profile.name}'s profile has been deleted.`, variant: "destructive" });
      if (activeChild?.id === profileId) {
        setActiveChildId(null); 
      }
    }
    setProfileToDelete(null); 
  };
  
  const handleToggleLeaderboard = (profileId: string, checked: boolean) => {
    const profile = profiles.find(p => p.id === profileId);
    if (profile) {
      updateProfile({ ...profile, enableLeaderboard: checked });
      toast({
        title: "Leaderboard Setting Updated",
        description: `${profile.name} will ${checked ? 'now' : 'no longer'} appear on leaderboards.`,
      });
    }
  };
  
  const closeForm = () => {
    setShowForm(false);
    setEditingProfile(null);
    setPinAction(null); // Reset pin action
  }

  if (showForm) { // ChildProfileForm is shown after PIN verification if needed
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <ChildProfileForm
          profile={editingProfile || undefined}
          onSubmit={editingProfile ? handleUpdateProfile : handleAddProfile}
          onCancel={closeForm}
          isEditing={!!editingProfile}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PinDialog
        isOpen={showPinDialog}
        setIsOpen={setShowPinDialog}
        mode="enter" // Always 'enter' mode here, as we are verifying
        onSuccess={handlePinSuccess}
        title="Enter PIN"
        description="Please enter your PIN to manage child profiles."
      />

      <Card className="shadow-xl">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-3xl text-primary flex items-center gap-2"><Users className="h-8 w-8"/> Child Profiles</CardTitle>
            <CardDescription className="mt-1">Manage your children&apos;s learning profiles, points, and badges.</CardDescription>
          </div>
          <Button onClick={handleOpenAddForm} className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-md hover:shadow-lg transition-shadow w-full sm:w-auto">
            {isLocalPinSetup && <Lock className="mr-1.5 h-4 w-4" />}
            <UserPlus className="mr-2 h-5 w-5" /> Add New Profile
          </Button>
        </CardHeader>
        <CardContent>
          {profiles.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-20 w-20 text-muted-foreground mx-auto mb-6" />
              <p className="text-2xl text-muted-foreground mb-4">No child profiles yet.</p>
              <p className="text-muted-foreground mb-6">Create profiles to personalize lessons and track progress.</p>
              <Button onClick={handleOpenAddForm} size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:scale-105 transition-transform">
                 {isLocalPinSetup && <Lock className="mr-1.5 h-4 w-4" />}
                <UserPlus className="mr-2 h-5 w-5" /> Create Your First Profile
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {profiles.map((profile) => (
                <Card 
                    key={profile.id} 
                    className={`flex flex-col transition-all duration-300 ease-in-out hover:shadow-2xl 
                                ${activeChild?.id === profile.id ? 'border-2 border-primary ring-4 ring-primary/20 shadow-xl' : 'shadow-lg'}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-4">
                        <Avatar className={`h-16 w-16 border-2 ${activeChild?.id === profile.id ? 'border-primary' : 'border-muted'}`}>
                            <AvatarImage src={`https://avatar.vercel.sh/${encodeURIComponent(profile.avatarSeed || profile.name)}.png?size=64`} alt={profile.name} />
                            <AvatarFallback className="text-2xl">{profile.name[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-2xl text-primary">{profile.name}</CardTitle>
                            <CardDescription className="text-sm">Age: {profile.age}</CardDescription>
                        </div>
                       </div>
                    </div>
                    <div className="mt-2 text-primary font-semibold text-lg flex items-center">
                        <Star className="h-5 w-5 mr-1.5 text-yellow-400 fill-yellow-400"/> Points: {profile.points || 0}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow space-y-3 text-sm">
                    <div>
                        <h4 className="font-semibold text-foreground mb-1.5 flex items-center"><Award className="h-4 w-4 mr-1.5 text-accent"/>Badges:</h4>
                        {profile.badges && profile.badges.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                            <TooltipProvider>
                                {profile.badges.slice(0, 5).map((badge: BadgeType) => {
                                const IconComponent = getLucideIcon(badge.iconName);
                                return (
                                    <Tooltip key={badge.id}>
                                    <TooltipTrigger asChild>
                                        <span className="p-2 bg-secondary rounded-full shadow-sm hover:bg-secondary/80 transition-colors">
                                            <IconComponent className="h-5 w-5 text-accent" />
                                        </span>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-popover text-popover-foreground shadow-xl">
                                        <p className="font-bold">{badge.name}</p>
                                        <p className="text-xs">{badge.description}</p>
                                        <p className="text-xs text-muted-foreground">Earned: {new Date(badge.dateEarned).toLocaleDateString()}</p>
                                    </TooltipContent>
                                    </Tooltip>
                                );
                                })}
                                {profile.badges.length > 5 && (
                                    <span className="p-2 bg-secondary rounded-full shadow-sm text-xs font-semibold text-accent">+{profile.badges.length - 5} more</span>
                                )}
                            </TooltipProvider>
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-xs italic">No badges earned yet.</p>
                        )}
                    </div>
                    <p className="text-muted-foreground"><strong className="text-foreground">Curriculum:</strong> {profile.curriculum}</p>
                    <div className="flex items-center space-x-2 pt-2 border-t mt-2">
                      <Switch
                        id={`leaderboard-${profile.id}`}
                        checked={!!profile.enableLeaderboard}
                        onCheckedChange={(checked) => handleToggleLeaderboard(profile.id, checked)}
                        aria-label="Enable leaderboard participation"
                      />
                      <Label htmlFor={`leaderboard-${profile.id}`} className="text-xs text-muted-foreground cursor-pointer">
                        Include in Leaderboard
                      </Label>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-2 pt-4 mt-auto border-t">
                    <div className="flex w-full gap-2">
                        <Button variant="outline" size="sm" className="flex-1 hover:border-primary hover:text-primary" onClick={() => handleOpenEditForm(profile)}>
                            {isLocalPinSetup && <Lock className="mr-1 h-3 w-3"/>} <Edit3 className="mr-1.5 h-4 w-4" /> Edit
                        </Button>
                        <Button variant="ghost" size="sm" className="flex-1 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setProfileToDelete(profile)}>
                            <Trash2 className="mr-1.5 h-4 w-4" /> Delete
                        </Button>
                    </div>
                    {activeChild?.id !== profile.id ? (
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="w-full bg-accent hover:bg-accent/90 text-accent-foreground shadow-sm hover:shadow-md" 
                        onClick={() => setActiveChildId(profile.id)}
                      >
                        <Sparkle className="mr-1.5 h-4 w-4" /> Set as Active
                      </Button>
                    ) : (
                       <div className="w-full text-center text-sm text-green-600 font-semibold py-2 mt-1 flex items-center justify-center gap-1.5 border border-green-500 bg-green-50 rounded-md">
                        <CheckCircle className="h-5 w-5" /> Active Profile
                       </div>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {profileToDelete && (
        <Dialog open={!!profileToDelete} onOpenChange={() => setProfileToDelete(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl">Delete Profile</DialogTitle>
              <DialogDescription className="mt-2 text-base">
                Are you sure you want to delete {profileToDelete.name}&apos;s profile? This will remove all associated data including points and badges, and cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-6 sm:justify-end gap-2">
              <DialogClose asChild>
                <Button variant="outline" size="lg">Cancel</Button>
              </DialogClose>
              <Button variant="destructive" size="lg" onClick={() => handleDeleteProfile(profileToDelete.id)}>
                Delete Profile
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
