"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { Loader2, Mail, TestTube } from 'lucide-react';
import { useChildProfiles } from '@/hooks/use-child-profiles';

export default function EmailTestPanel() {
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  const { childProfiles } = useChildProfiles();

  const handleSendTestEmail = async (childId: string) => {
    setIsSending(true);
    try {
      const sendTestEmail = httpsCallable(functions, 'sendTestWeeklyProgressEmail');
      const result = await sendTestEmail({ childId });
      
      toast({
        title: "Test Email Sent",
        description: "Check your inbox for the weekly progress report!",
      });
    } catch (error: any) {
      console.error('Error sending test email:', error);
      toast({
        title: "Email Error",
        description: error.message || "Failed to send test email. Please check your email configuration.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  if (!childProfiles || childProfiles.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Testing
          </CardTitle>
          <CardDescription>
            Test the weekly progress email functionality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No child profiles found. Create a child profile first to test email functionality.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Email Testing Panel
        </CardTitle>
        <CardDescription>
          Test the weekly progress email functionality for each child
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          {childProfiles.map((child) => (
            <div key={child.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-semibold">{child.name}</h3>
                <p className="text-sm text-muted-foreground">
                  Age: {child.age} • Lessons: {child.lessonAttempts?.length || 0}
                </p>
              </div>
              <Button
                onClick={() => handleSendTestEmail(child.id)}
                disabled={isSending}
                variant="outline"
                size="sm"
              >
                {isSending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="mr-2 h-4 w-4" />
                )}
                Send Test Email
              </Button>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-semibold mb-2">How it works:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Click "Send Test Email" to send a weekly progress report to your email</li>
            <li>• The email includes lesson statistics, recent activity, and achievements</li>
            <li>• Weekly emails are automatically sent every Monday at 9 AM UTC</li>
            <li>• Emails are only sent if there's recent activity or it's the first week</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
} 