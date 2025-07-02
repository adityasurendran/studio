// src/app/signin/signin-form-content.tsx
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogIn, KeyRound } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function SignInFormContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Sign In Successful",
        description: "Welcome back! Redirecting...",
      });
      const redirectPath = searchParams?.get('redirect');
      router.push(redirectPath || '/dashboard');
    } catch (err: any) {
      let friendlyMessage = "Please check your credentials and try again.";
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        friendlyMessage = "Invalid email or password. Please try again.";
      } else if (err.code === 'auth/too-many-requests') {
        friendlyMessage = "Access to this account has been temporarily disabled due to many failed login attempts. You can immediately restore it by resetting your password or you can try again later.";
      } else {
        friendlyMessage = err.message || friendlyMessage;
      }
      setError(friendlyMessage);
      toast({
        title: "Sign In Failed",
        description: friendlyMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetSent(true);
      toast({
        title: "Password Reset Email Sent",
        description: "Check your inbox for a link to reset your password.",
      });
    } catch (err: any) {
      setError("Failed to send reset email. Please check the address and try again.");
      toast({
        title: "Reset Failed",
        description: "Failed to send reset email. Please check the address and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-var(--header-height,4rem)-2rem)] py-12 px-4 bg-gradient-to-br from-background to-secondary/30">
      <Card className="w-full max-w-md shadow-xl border-t-4 border-primary rounded-lg">
        <CardHeader className="text-center p-6 space-y-2">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
            <KeyRound className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold text-primary">Parent Sign In</CardTitle>
          <CardDescription className="text-base">Access your nyro dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {!showReset ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-base">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="text-base h-12"
                  aria-label="Email Address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-base">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="text-base h-12"
                  aria-label="Password"
                />
                <p className="text-right text-sm mt-2">
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => { setShowReset(true); setResetSent(false); setError(null); }}
                  >
                    Forgot password?
                  </button>
                </p>
              </div>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTitle>Sign In Failed</AlertTitle>
                  <AlertDescription>
                    {error}
                    <Button onClick={handleSubmit} variant="outline" className="ml-2 mt-2">Try Again</Button>
                  </AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-lg py-6 shadow-md hover:shadow-lg transition-shadow" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <LogIn className="mr-2 h-5 w-5" />}
                Sign In
              </Button>
            </form>
          ) : (
            <form onSubmit={handlePasswordReset} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="reset-email" className="text-base">Email Address</Label>
                <Input
                  id="reset-email"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="text-base h-12"
                  aria-label="Email Address"
                />
              </div>
              {error && <p className="text-sm text-destructive text-center bg-destructive/10 p-3 rounded-md">{error}</p>}
              <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-lg py-6 shadow-md hover:shadow-lg transition-shadow" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Send Reset Email"}
              </Button>
              {resetSent && <p className="text-green-600 text-sm text-center">Reset email sent! Check your inbox.</p>}
              <Button type="button" variant="ghost" onClick={() => setShowReset(false)} className="w-full mt-2">
                Back to Sign In
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="text-center flex-col p-6 border-t mt-4">
          <p className="text-base text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-semibold text-primary hover:text-accent hover:underline">
              Sign up here
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
