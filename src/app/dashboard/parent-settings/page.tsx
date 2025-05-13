// src/app/dashboard/parent-settings/page.tsx
"use client";

import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Shield, CreditCard, Bell, Mail, KeyRound, Edit3, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { isCompetitionModeEnabled } from '@/config';
import Link from 'next/link';

export default function ParentSettingsPage() {
  const { currentUser, parentProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // Placeholder function for handling password change
  const handleChangePassword = () => {
    toast({
      title: "Password Change",
      description: "Password change functionality would be implemented here, typically by sending a password reset email or using Firebase's updatePassword method after re-authentication.",
    });
    // Example: router.push('/auth/reset-password'); // Or trigger Firebase email
  };

  // Placeholder for managing subscription (Stripe Customer Portal)
  const handleManageSubscription = async () => {
     if (isCompetitionModeEnabled) {
        toast({ title: "Competition Mode", description: "Subscription management is not applicable in competition mode." });
        return;
    }
    toast({
      title: "Manage Subscription",
      description: "Redirecting to subscription management portal... (Functionality to be implemented)",
    });
    // In a real app, you'd call a Firebase Function to get a Stripe Customer Portal link
    // and then redirect: window.location.href = portalLink;
    // For now, redirect to subscribe page as a placeholder for general subscription info
    router.push('/subscribe');
  };

  if (!currentUser) {
    // This should ideally be caught by AuthGuard, but as a fallback:
    return (
        <div className="flex flex-col items-center justify-center h-full py-10 px-4">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
                    <CardTitle>Access Denied</CardTitle>
                    <CardDescription>Please sign in to view parent settings.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={() => router.push('/signin?redirect=/dashboard/parent-settings')}>Sign In</Button>
                </CardContent>
            </Card>
        </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <Card className="shadow-xl border-t-4 border-primary">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <Shield className="h-10 w-10 text-primary" />
            <div>
              <CardTitle className="text-3xl font-bold text-primary">Parent Account Settings</CardTitle>
              <CardDescription className="text-lg text-muted-foreground">
                Manage your account details and subscription.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Account Information Section */}
          <Card className="bg-card border">
            <CardHeader>
              <CardTitle className="text-xl text-accent flex items-center gap-2">
                <Mail className="h-5 w-5" /> Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-muted-foreground">Email Address</Label>
                <Input id="email" type="email" value={currentUser.email || ''} readOnly disabled className="mt-1 bg-muted/50"/>
              </div>
              <Button variant="outline" onClick={handleChangePassword} className="w-full sm:w-auto">
                <KeyRound className="mr-2 h-4 w-4" /> Change Password
              </Button>
              <p className="text-xs text-muted-foreground">
                To change your email, please contact support. Password changes will typically involve a verification email.
              </p>
            </CardContent>
          </Card>

          {/* Subscription Management Section */}
          <Card className="bg-card border">
            <CardHeader>
              <CardTitle className="text-xl text-accent flex items-center gap-2">
                <CreditCard className="h-5 w-5" /> Subscription
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isCompetitionModeEnabled ? (
                <p className="text-base text-green-600 font-semibold bg-green-50 p-3 rounded-md border border-green-200">
                  Competition Mode is active. All features are currently unlocked.
                </p>
              ) : parentProfile?.isSubscribed ? (
                <>
                  <p className="text-base">Status: <span className="font-semibold text-green-600 capitalize">{parentProfile.stripeSubscriptionStatus || 'Active'}</span></p>
                  <Button onClick={handleManageSubscription} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Edit3 className="mr-2 h-4 w-4" /> Manage Subscription
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Click above to manage your billing details, view invoices, or cancel your subscription via Stripe.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-base">Status: <span className="font-semibold text-destructive">Not Subscribed</span></p>
                  <Link href="/subscribe" passHref>
                    <Button className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground">
                      <CreditCard className="mr-2 h-4 w-4" /> Subscribe Now
                    </Button>
                  </Link>
                   <p className="text-xs text-muted-foreground">
                    Unlock all features by subscribing to Shannon.
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Notification Preferences Section (Placeholder) */}
          <Card className="bg-card border">
            <CardHeader>
              <CardTitle className="text-xl text-accent flex items-center gap-2">
                <Bell className="h-5 w-5" /> Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Manage your email notification settings for progress updates and app news. (Coming Soon)
              </p>
              {/* Example Toggle (non-functional) */}
              <div className="flex items-center space-x-2 mt-4 opacity-50">
                <input type="checkbox" id="progressUpdates" disabled />
                <label htmlFor="progressUpdates" className="text-sm font-medium text-muted-foreground">Receive weekly progress reports</label>
              </div>
              <div className="flex items-center space-x-2 mt-2 opacity-50">
                <input type="checkbox" id="appNews" disabled />
                <label htmlFor="appNews" className="text-sm font-medium text-muted-foreground">Receive updates about new features</label>
              </div>
            </CardContent>
          </Card>
           <Separator />
            <div className="text-center">
                 <Button variant="link" onClick={() => router.push('/dashboard')} className="text-primary hover:text-accent">
                    <ExternalLink className="mr-2 h-4 w-4" /> Back to Main Dashboard
                </Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
