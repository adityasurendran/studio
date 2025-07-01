// src/app/signup/page.tsx
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, ShieldCheck } from 'lucide-react';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password should be at least 6 characters long.");
      toast({
        title: "Sign Up Error",
        description: "Password should be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      toast({
        title: "Sign Up Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      toast({
        title: "Sign Up Successful!",
        description: "Your account has been created. Welcome to nyro!",
      });
      router.push('/dashboard'); 
    } catch (err: any) {
      let friendlyMessage = "Could not create account. Please try again.";
      if (err.code === 'auth/email-already-in-use') {
        friendlyMessage = "This email address is already in use. Try signing in instead.";
      } else if (err.code === 'auth/invalid-email') {
        friendlyMessage = "The email address is not valid.";
      } else if (err.code === 'auth/weak-password') {
        friendlyMessage = "The password is too weak. Please choose a stronger password.";
      } else {
        friendlyMessage = err.message || friendlyMessage;
      }
      setError(friendlyMessage);
      toast({
        title: "Sign Up Failed",
        description: friendlyMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-var(--header-height,4rem)-2rem)] py-12 px-4 bg-gradient-to-br from-background to-accent/20">
      <Card className="w-full max-w-md shadow-xl border-t-4 border-accent rounded-lg">
        <CardHeader className="text-center p-6 space-y-2">
           <div className="mx-auto bg-accent/10 p-3 rounded-full w-fit">
            <ShieldCheck className="h-10 w-10 text-accent" />
          </div>
          <CardTitle className="text-3xl font-bold text-accent">Create Parent Account</CardTitle>
          <CardDescription className="text-base">Join nyro to support your child&apos;s learning journey.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
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
                placeholder="Min. 6 characters"
                required
                className="text-base h-12"
                aria-label="Password"
              />
            </div>
             <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-base">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                required
                className="text-base h-12"
                aria-label="Confirm Password"
              />
            </div>
            {error && <p className="text-sm text-destructive text-center bg-destructive/10 p-3 rounded-md">{error}</p>}
            <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90 text-lg py-6 shadow-md hover:shadow-lg transition-shadow" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UserPlus className="mr-2 h-5 w-5"/>}
              Sign Up
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center p-6 border-t mt-4">
          <p className="text-base text-muted-foreground">
            Already have an account?{' '}
            <Link href="/signin" className="font-semibold text-accent hover:text-primary hover:underline">
              Sign in here
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
