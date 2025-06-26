import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const text = req.method === 'POST' ? req.body.text : req.query.text;
  if (!text || typeof text !== 'string') {
    res.status(400).json({ error: 'Missing or invalid text parameter' });
    return;
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Missing ElevenLabs API key' });
    return;
  }

  const voiceId = 'Rachel'; // You can change this to any available ElevenLabs voice
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

  try {
    const elevenRes = await fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    });

    if (!elevenRes.ok) {
      const error = await elevenRes.text();
      res.status(500).json({ error });
      return;
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    elevenRes.body.pipe(res);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
} 