import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebase-firestore';
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
    const settingsRef = db.collection('settings').doc('global');
    const doc = await settingsRef.get();
    const current = doc.exists ? doc.data().competitionMode : false;
    await settingsRef.set({ competitionMode: !current }, { merge: true });
    return res.status(200).json({ competitionMode: !current });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
} 