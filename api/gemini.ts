// api/gemini.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. السماح للكود بتاعك بس إنه يكلم الملف ده (CORS)
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // لو المتصفح بيستأذن الأول (OPTIONS request) نقوله اتفضل
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 2. استقبال الرسالة من الفرونت إند
  const { contents } = req.body;

  try {
    // 3. نجيب المفتاح من خزنة فيرسل (مش من الكود)
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Server Error: API Key missing' });
    }

    // 4. نكلم جوجل إحنا بقى من السيرفر
    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
      { contents },
      {
        params: { key: GEMINI_API_KEY },
        headers: { 'Content-Type': 'application/json' },
      }
    );

    // 5. نرجع الرد للفرونت إند
    return res.status(200).json(response.data);

  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
