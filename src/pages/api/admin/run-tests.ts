import type { NextApiRequest, NextApiResponse } from 'next';

const DEVELOPER_EMAILS = ['aditya@nyro.eu.org'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userEmail = req.headers['x-user-email'];
  if (typeof userEmail !== 'string' || !DEVELOPER_EMAILS.includes(userEmail)) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    // Dynamically import child_process to avoid issues in serverless
    const { exec } = await import('child_process');
    exec('npm test -- --json --outputFile=jest-output.json', (error, stdout, stderr) => {
      if (error) {
        return res.status(200).json({ status: 'fail', result: stderr || error.message });
      }
      try {
        const output = require(process.cwd() + '/jest-output.json');
        return res.status(200).json({ status: 'success', result: output });
      } catch (parseErr) {
        return res.status(200).json({ status: 'success', result: stdout });
      }
    });
  } catch (err: any) {
    return res.status(500).json({ status: 'fail', result: err.message || 'Failed to run tests' });
  }
} 