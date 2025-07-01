import type { ChildProfile } from '@/types';
import { formatLessonHistorySummary } from '@/lib/lesson-summary';
import { functions } from '@/lib/firebase-functions';
import { httpsCallable } from 'firebase/functions';

export function sendWeeklyProgressEmail(parentEmail: string, child: ChildProfile) {
  const summary = formatLessonHistorySummary(child.lessonAttempts);
  const message = `Weekly Progress for ${child.name}\n\n${summary}\n\nTotal Points: ${child.points}`;
  console.log(`Sending weekly progress email to ${parentEmail}:\n${message}`);
}

// New function to send weekly progress email via Firebase Functions
export async function sendWeeklyProgressEmailViaFunction(childId: string): Promise<{ success: boolean; message: string }> {
  try {
    const sendTestEmail = httpsCallable(functions, 'sendTestWeeklyProgressEmail');
    const result = await sendTestEmail({ childId });
    return { success: true, message: 'Email sent successfully' };
  } catch (error: any) {
    console.error('Error sending weekly progress email:', error);
    return { 
      success: false, 
      message: error.message || 'Failed to send email' 
    };
  }
}
