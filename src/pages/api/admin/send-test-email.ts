import type { NextApiRequest, NextApiResponse } from 'next';
import { sendWeeklyProgressEmail } from '@/lib/progress-email';
import type { ChildProfile } from '@/types';

const DEVELOPER_EMAILS = ['aditya@nyro.eu.org'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // TODO: Replace with real authentication check
  const userEmail = req.headers['x-user-email'];
  if (typeof userEmail !== 'string' || !DEVELOPER_EMAILS.includes(userEmail)) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  // Create a mock child profile for the test email
  const mockChild: ChildProfile = {
    id: 'test-child',
    name: 'Test Child',
    age: 10,
    learningDifficulties: 'None',
    screenIssues: 'None',
    theme: 'light',
    language: 'en',
    curriculum: 'Sample Curriculum',
    interests: 'Science, Math',
    points: 100,
    badges: [],
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
  };
  try {
    // Send test email to both developer accounts
    for (const email of DEVELOPER_EMAILS) {
      sendWeeklyProgressEmail(email, mockChild);
    }
    return res.status(200).json({ status: 'success', message: 'Test emails sent!' });
  } catch (err: any) {
    return res.status(500).json({ status: 'fail', message: err.message || 'Failed to send test emails' });
  }
} 