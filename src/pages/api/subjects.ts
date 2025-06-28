import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const subjectMappingPath = path.join(process.cwd(), 'books', 'subject-mapping.json');
    
    if (!fs.existsSync(subjectMappingPath)) {
      return res.status(404).json({ message: 'Subject mapping not found' });
    }

    const subjectMappingData = fs.readFileSync(subjectMappingPath, 'utf8');
    const subjects = JSON.parse(subjectMappingData);

    res.status(200).json(subjects);
  } catch (error) {
    console.error('Error reading subject mapping:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 