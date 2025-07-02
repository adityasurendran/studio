import type { NextApiRequest, NextApiResponse } from 'next';
import { sendWeeklyProgressEmail } from '@/lib/progress-email';
import type { ChildProfile } from '@/types';
import { createMockChildProfile } from '@/__tests__/mocks/childProfile';
import { getAuth } from 'firebase-admin/auth';

const DEVELOPER_EMAILS = ['aditya@nyro.eu.org'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Real authentication check
  const idToken = req.headers['authorization']?.toString().replace('Bearer ', '');
  if (!idToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    const decoded = await getAuth().verifyIdToken(idToken);
    const userEmail = decoded.email;
    if (typeof userEmail !== 'string' || !DEVELOPER_EMAILS.includes(userEmail)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    // Create a mock child profile for the test email
    const mockChild: ChildProfile = createMockChildProfile({
      lessonAttempts: [
        {
          attemptId: '1',
          lessonTitle: 'Sample Lesson',
          lessonTopic: 'Sample Topic',
          subject: 'Science',
          quizScore: 90,
          quizTotalQuestions: 10,
          questionsAnsweredCorrectly: 9,
          timestamp: new Date().toISOString(),
        },
      ],
    });
    try {
      // Send test email to both developer accounts
      for (const email of DEVELOPER_EMAILS) {
        sendWeeklyProgressEmail(email, mockChild);
      }
      return res.status(200).json({ status: 'success', message: 'Test emails sent!' });
    } catch (err: any) {
      return res.status(500).json({ status: 'fail', message: err.message || 'Failed to send test emails' });
    }
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
} 