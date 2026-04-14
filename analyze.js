// /api/analyze.js — Vercel Serverless Function
// Gọi Gemini 2.5 Flash với thinking tắt

export default async function handler(req, res) {
  // CORS (phòng khi bạn mở HTML từ domain khác)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const {
      prompt,
      model = 'gemini-2.5-flash',
      thinkingBudget = 0,
    } = req.body || {};

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Thiếu prompt' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Server chưa cấu hình GEMINI_API_KEY' });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json',
          thinkingConfig: { thinkingBudget }, // 0 = tắt thinking
        },
      }),
    });

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      return res.status(geminiRes.status).json({
        error: data?.error?.message || 'Gemini API error',
      });
    }

    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return res.status(200).json({ content });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Internal error' });
  }
}
