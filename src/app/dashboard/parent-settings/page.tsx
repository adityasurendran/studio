// src/app/dashboard/parent-settings/page.tsx
"use client";

import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Shield, CreditCard, Bell, Mail, KeyRound, Edit3, ExternalLink, Lock, Unlock, HelpCircle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { isCompetitionModeEnabled } from '@/config';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import PinDialog from '@/components/pin-dialog';
import EmailTestPanel from '@/components/email-test-panel';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { useAuthContext } from '@/contexts/AuthContext';

export default function ParentSettingsPage() {
  const { currentUser, parentProfile, loading: authLoading } = useAuth();
  const { isPinSetup, setupPin, verifyPin, clearPin } = useAuthContext();
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pinDialogMode, setPinDialogMode] = useState<'setup' | 'enter' | 'change_enter_old' | 'change_set_new' | 'reset'>('enter');
  const [pinVerified, setPinVerified] = useState(false);
  const [tempOldPin, setTempOldPin] = useState<string | null>(null);
  const [isResettingPin, setIsResettingPin] = useState(false);

  // Check for reset token in URL
  const resetToken = searchParams?.get('resetToken');

  useEffect(() => {
    if (resetToken) {
      setPinDialogMode('reset');
      setShowPinDialog(true);
    } else if (isPinSetup && !pinVerified) {
      setPinDialogMode('enter');
      setShowPinDialog(true);
    } else if (!isPinSetup) {
      setPinVerified(true);
    }
  }, [isPinSetup, pinVerified, resetToken]);

  const handlePinSuccess = async (pinValue?: string) => {
    if (pinDialogMode === 'enter') {
      if (pinValue && await verifyPin(pinValue)) {
        setPinVerified(true);
        setShowPinDialog(false);
        toast({ title: "Access Granted", description: "PIN verified successfully." });
      } else {
        toast({ title: "Access Denied", description: "Incorrect PIN.", variant: "destructive" });
      }
    } else if (pinDialogMode === 'setup' && pinValue) {
      await setupPin(pinValue);
      setPinVerified(true);
      setShowPinDialog(false);
    } else if (pinDialogMode === 'change_enter_old' && pinValue) {
        if (await verifyPin(pinValue)) {
            setTempOldPin(pinValue);
            setPinDialogMode('change_set_new');
            toast({ title: "Old PIN Verified", description: "Please set your new PIN." });
        } else {
            toast({ title: "Incorrect Old PIN", description: "Please try again.", variant: "destructive" });
        }
    } else if (pinDialogMode === 'change_set_new' && pinValue) {
        await setupPin(pinValue);
        setPinVerified(true);
        setShowPinDialog(false);
        toast({ title: "PIN Changed Successfully", description: "Your PIN has been updated." });
    } else if (pinDialogMode === 'reset' && pinValue && resetToken) {
        handleResetPin(pinValue);
    }
  };
  
  const handleResetPin = async (newPin: string) => {
    if (!resetToken) {
      toast({ title: "Reset Error", description: "No reset token found.", variant: "destructive" });
      return;
    }

    setIsResettingPin(true);
    try {
      const resetPinFunction = httpsCallable(functions, 'resetPinWithToken');
      await resetPinFunction({ resetToken, newPin });
      
      setPinVerified(true);
      setShowPinDialog(false);
      toast({ title: "PIN Reset Successfully", description: "Your PIN has been reset." });
      
      // Clear the reset token from URL
      router.replace('/dashboard/parent-settings');
    } catch (error: any) {
      console.error('Error resetting PIN:', error);
      toast({ 
        title: "PIN Reset Failed", 
        description: error.message || "Failed to reset PIN.", 
        variant: "destructive" 
      });
    } finally {
      setIsResettingPin(false);
    }
  };

  const handleRequestPinReset = async () => {
    try {
      const requestResetFunction = httpsCallable(functions, 'requestPinReset');
      await requestResetFunction();
      
      toast({ 
        title: "Reset Email Sent", 
        description: "Check your email for PIN reset instructions." 
      });
    } catch (error: any) {
      console.error('Error requesting PIN reset:', error);
      toast({ 
        title: "Reset Request Failed", 
        description: error.message || "Failed to send reset email.", 
        variant: "destructive" 
      });
    }
  };

  const handleManageSubscription = async () => {
     if (isCompetitionModeEnabled) {
        toast({ title: "Competition Mode", description: "Subscription management is not applicable in competition mode." });
        return;
    }
    toast({
      title: "Manage Subscription",
      description: "Redirecting to subscription management portal... (Functionality to be implemented)",
    });
    router.push('/subscribe');
  };

  const handleSetupPin = () => {
    setPinDialogMode('setup');
    setShowPinDialog(true);
  };

  const handleChangePin = () => {
    setPinDialogMode('change_enter_old');
    setShowPinDialog(true);
  };

  const handleDisablePin = async () => {
    await clearPin();
    setPinVerified(true);
  };


  if (!currentUser) {
    return (
        <div className="flex flex-col items-center justify-center h-full py-10 px-4">
            <Card className="w-full max-w-md text-center">
                <CardHeader> <Shield className="h-12 w-12 text-primary mx-auto mb-4" /> <CardTitle>Access Denied</CardTitle> <CardDescription>Please sign in to view parent settings.</CardDescription> </CardHeader>
                <CardContent> <Button onClick={() => router.push('/signin?redirect=/dashboard/parent-settings')}>Sign In</Button> </CardContent>
            </Card>
        </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <PinDialog
        isOpen={showPinDialog}
        setIsOpen={setShowPinDialog}
        mode={pinDialogMode === 'change_enter_old' || pinDialogMode === 'enter' ? 'enter' : 'setup'}
        onSuccess={handlePinSuccess}
        title={
            pinDialogMode === 'setup' ? "Setup PIN Protection" :
            pinDialogMode === 'enter' ? "Enter PIN" :
            pinDialogMode === 'change_enter_old' ? "Enter Old PIN" :
            "Set New PIN"
        }
        description={
            pinDialogMode === 'setup' ? "Create a 4-digit PIN to secure parent settings." :
            pinDialogMode === 'enter' ? "Enter your 4-digit PIN to access settings." :
            pinDialogMode === 'change_enter_old' ? "Enter your current 4-digit PIN to change it." :
            "Create your new 4-digit PIN."
        }
      />

      {!pinVerified && isPinSetup ? (
        <Card className="shadow-xl border-t-4 border-primary text-center p-8">
          <CardHeader>
            <Lock className="h-16 w-16 text-primary mx-auto mb-4" />
            <CardTitle className="text-2xl">Settings Locked</CardTitle>
            <CardDescription>Please enter your PIN to access parent settings.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => { setPinDialogMode('enter'); setShowPinDialog(true); }}>
              <KeyRound className="mr-2 h-5 w-5" /> Enter PIN
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-xl border-t-4 border-primary">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3"> <Shield className="h-10 w-10 text-primary" /> <div> <CardTitle className="text-3xl font-bold text-primary">Parent Account Settings</CardTitle> <CardDescription className="text-lg text-muted-foreground"> Manage your account details, PIN protection, and subscription. </CardDescription> </div> </div>
          </CardHeader>
          <CardContent className="space-y-8">
            
            {/* PIN Management Section */}
            <Card className="bg-card border">
              <CardHeader><CardTitle className="text-xl text-accent flex items-center gap-2"><KeyRound className="h-5 w-5"/>PIN Protection</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {isPinSetup ? (
                  <>
                    <p className="text-sm text-green-600 font-medium">PIN protection is currently active for this browser.</p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button variant="outline" onClick={handleChangePin} className="flex-1"><Edit3 className="mr-2 h-4 w-4"/>Change PIN</Button>
                      <Button variant="destructive" onClick={handleDisablePin} className="flex-1"><Unlock className="mr-2 h-4 w-4"/>Disable PIN Protection</Button>
                    </div>
                    <div className="pt-2">
                      <Button variant="link" onClick={handleRequestPinReset} className="text-sm text-muted-foreground hover:text-primary p-0 h-auto">
                        <HelpCircle className="mr-2 h-4 w-4"/>Forgot your PIN? Reset it via email
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">Secure access to parent settings and child profile management with a 4-digit PIN.</p>
                    <Button onClick={handleSetupPin} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
                      <Lock className="mr-2 h-4 w-4"/>Setup PIN Protection
                    </Button>
                  </>
                )}
                <p className="text-xs text-muted-foreground pt-2">
                  Note: PIN protection is securely stored and provides an extra layer of security. It is NOT a replacement for a strong account password.
                </p>
              </CardContent>
            </Card>

            {/* Account Information Section */}
            <Card className="bg-card border">
              <CardHeader> <CardTitle className="text-xl text-accent flex items-center gap-2"> <Mail className="h-5 w-5" /> Account Information </CardTitle> </CardHeader>
              <CardContent className="space-y-4">
                <div> <Label htmlFor="email" className="text-sm font-medium text-muted-foreground">Email Address</Label> <Input id="email" type="email" value={currentUser.email || ''} readOnly disabled className="mt-1 bg-muted/50"/> </div>
                <Button variant="outline" onClick={() => toast({title: "Password Change", description: "Password change functionality would be via Firebase's password reset email."})} className="w-full sm:w-auto"> <KeyRound className="mr-2 h-4 w-4" /> Change Password </Button>
                <p className="text-xs text-muted-foreground"> To change your email, please contact support. Password changes will typically involve a verification email. </p>
              </CardContent>
            </Card>

            {/* Subscription Management Section */}
            <Card className="bg-card border">
              <CardHeader> <CardTitle className="text-xl text-accent flex items-center gap-2"> <CreditCard className="h-5 w-5" /> Subscription </CardTitle> </CardHeader>
              <CardContent className="space-y-4">
                {isCompetitionModeEnabled ? ( <p className="text-base text-green-600 font-semibold bg-green-50 p-3 rounded-md border border-green-200"> Competition Mode is active. All features are currently unlocked. </p>
                ) : parentProfile?.isSubscribed ? (
                  <>
                    <p className="text-base">Status: <span className="font-semibold text-green-600 capitalize">{parentProfile.stripeSubscriptionStatus || 'Active'}</span></p>
                    <Button onClick={handleManageSubscription} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground"> <Edit3 className="mr-2 h-4 w-4" /> Manage Subscription </Button>
                    <p className="text-xs text-muted-foreground"> Click above to manage your billing details, view invoices, or cancel your subscription via Stripe. </p>
                  </>
                ) : (
                  <>
                    <p className="text-base">Status: <span className="font-semibold text-destructive">Not Subscribed</span></p>
                    <Link href="/subscribe" passHref> <Button className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground"> <CreditCard className="mr-2 h-4 w-4" /> Subscribe Now </Button> </Link>
                    <p className="text-xs text-muted-foreground"> Unlock all features by subscribing to Shannon. </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Email Testing Section */}
            <EmailTestPanel />
            
            <Separator />
            <div className="text-center"> <Button variant="link" onClick={() => router.push('/dashboard')} className="text-primary hover:text-accent"> <ExternalLink className="mr-2 h-4 w-4" /> Back to Main Dashboard </Button> </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
