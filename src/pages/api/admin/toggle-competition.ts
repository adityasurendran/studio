import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebase-firestore';

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
  try {
    const settingsRef = db.collection('settings').doc('global');
    const doc = await settingsRef.get();
    const current = doc.exists ? doc.data().competitionMode : false;
    await settingsRef.set({ competitionMode: !current }, { merge: true });
    return res.status(200).json({ competitionMode: !current });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to toggle competition mode' });
  }
} 