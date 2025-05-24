// Remove "use client"; to make this a Server Component

import { Suspense } from 'react';
import SubscribePageContent from './subscribe-page-content';
import { Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'; // For skeleton
import { Button } from '@/components/ui/button'; // For skeleton
import { Sparkles } from 'lucide-react'; // For skeleton

function SubscribePageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-12 flex flex-col items-center text-center min-h-[calc(100vh-var(--header-height,4rem)-2rem)] justify-center">
      <Card className="w-full max-w-lg shadow-xl border-t-4 border-accent p-6 md:p-8">
        <CardHeader className="p-0 mb-6">
          <div className="mx-auto bg-accent/10 p-5 rounded-full w-fit mb-6">
            <Sparkles className="h-16 w-16 text-accent" />
          </div>
          <CardTitle className="text-4xl font-bold text-accent">Unlock Shannon Premium</CardTitle>
          <CardDescription className="text-xl mt-3 text-muted-foreground">
            Loading subscription options...
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 space-y-6">
          <div className="h-40 bg-muted rounded-lg animate-pulse" />
          <p className="text-2xl font-bold text-primary">
            <span className="inline-block h-8 w-40 bg-muted rounded animate-pulse"></span>
          </p>
          <Button 
            className="w-full text-xl py-7" 
            size="lg"
            disabled
          >
            <Loader2 className="mr-3 h-6 w-6 animate-spin" />
            Loading...
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}


export default function SubscribePage() {
  return (
    <Suspense fallback={<SubscribePageSkeleton />}>
      <SubscribePageContent />
    </Suspense>
  );
}
