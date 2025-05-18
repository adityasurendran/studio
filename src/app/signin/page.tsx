// src/app/signin/page.tsx
import { Suspense } from 'react';
import SignInFormContent from './signin-form-content';
import { Loader2, KeyRound } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function SignInPageSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-var(--header-height,4rem)-2rem)] py-12 px-4 bg-gradient-to-br from-background to-secondary/30">
      <Card className="w-full max-w-md shadow-xl border-t-4 border-primary rounded-lg">
        <CardHeader className="text-center p-6 space-y-2">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
            <KeyRound className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold text-primary">Parent Sign In</CardTitle>
          <CardDescription className="text-base">Loading...</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email-skeleton">Email Address</Label>
              <Input id="email-skeleton" disabled className="h-12"/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password-skeleton">Password</Label>
              <Input id="password-skeleton" type="password" disabled className="h-12"/>
            </div>
            <Button className="w-full text-lg py-6" disabled>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading...
            </Button>
          </div>
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

export default function SignInPage() {
  return (
    <Suspense fallback={<SignInPageSkeleton />}>
      <SignInFormContent />
    </Suspense>
  );
}
