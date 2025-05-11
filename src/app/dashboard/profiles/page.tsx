// src/app/dashboard/profiles/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ChildProfileForm from '@/components/child-profile-form';
import { useChildProfilesContext } from '@/contexts/child-profiles-context';
import { useActiveChildProfile } from '@/contexts/active-child-profile-context';
import type { ChildProfile } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Edit3, Trash2, CheckCircle, Users, Eye } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type ProfileFormData = Omit<ChildProfile, 'id'>;

export default function ManageProfilesPage() {
  const { profiles, addProfile, updateProfile, deleteProfile } = useChildProfilesContext();
  const { activeChild, setActiveChildId } = useActiveChildProfile();
  const [editingProfile, setEditingProfile] = useState<ChildProfile | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<ChildProfile | null>(null);

  const { toast } = useToast();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      setShowForm(true);
      setEditingProfile(null);
    }
  }, [searchParams]);

  const handleAddProfile = (data: ProfileFormData) => {
    const newProfile = addProfile(data);
    toast({ title: "Profile Created", description: `${data.name}'s profile has been successfully created.` });
    setShowForm(false);
    setActiveChildId(newProfile.id); // Optionally set new profile as active
  };

  const handleUpdateProfile = (data: ProfileFormData) => {
    if (editingProfile) {
      updateProfile({ ...editingProfile, ...data });
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
        setActiveChildId(null); // Clear active child if it was deleted
      }
    }
    setProfileToDelete(null); // Close confirmation dialog
  };

  const openEditForm = (profile: ChildProfile) => {
    setEditingProfile(profile);
    setShowForm(true);
  };

  const openAddForm = () => {
    setEditingProfile(null);
    setShowForm(true);
  };
  
  const closeForm = () => {
    setShowForm(false);
    setEditingProfile(null);
  }

  if (showForm || editingProfile) {
    return (
      <div className="max-w-4xl mx-auto py-8">
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
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle className="text-3xl text-primary flex items-center gap-2"><Users className="h-8 w-8"/> Child Profiles</CardTitle>
            <CardDescription>Manage your children&apos;s learning profiles.</CardDescription>
          </div>
          <Button onClick={openAddForm} className="bg-accent text-accent-foreground hover:bg-accent/90">
            <UserPlus className="mr-2 h-4 w-4" /> Add New Profile
          </Button>
        </CardHeader>
        <CardContent>
          {profiles.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-xl text-muted-foreground mb-4">No child profiles yet.</p>
              <Button onClick={openAddForm} size="lg">
                <UserPlus className="mr-2 h-5 w-5" /> Create Your First Profile
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {profiles.map((profile) => (
                <Card key={profile.id} className={`hover:shadow-xl transition-shadow ${activeChild?.id === profile.id ? 'border-2 border-primary ring-2 ring-primary' : ''}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                            <AvatarImage src={`https://avatar.vercel.sh/${profile.name}.png?size=48`} alt={profile.name} />
                            <AvatarFallback>{profile.name[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-xl">{profile.name}</CardTitle>
                            <CardDescription>Age: {profile.age}</CardDescription>
                        </div>
                       </div>
                      {activeChild?.id === profile.id && (
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-1"><strong>Curriculum:</strong> {profile.curriculum}</p>
                    <p className="text-sm text-muted-foreground mb-1 truncate" title={profile.learningDifficulties}><strong>Difficulties:</strong> {profile.learningDifficulties || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground mb-3"><strong>Theme:</strong> {profile.theme}</p>
                  </CardContent>
                  <CardFooter className="flex justify-between gap-2">
                     <Button variant="outline" size="sm" onClick={() => openEditForm(profile)}>
                      <Edit3 className="mr-1 h-4 w-4" /> Edit
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-100 hover:text-red-700" onClick={() => setProfileToDelete(profile)}>
                      <Trash2 className="mr-1 h-4 w-4" /> Delete
                    </Button>
                    {activeChild?.id !== profile.id && (
                      <Button variant="secondary" size="sm" onClick={() => setActiveChildId(profile.id)}>
                        <Eye className="mr-1 h-4 w-4" /> Set Active
                      </Button>
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Profile</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {profileToDelete.name}&apos;s profile? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button variant="destructive" onClick={() => handleDeleteProfile(profileToDelete.id)}>
                Delete Profile
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
