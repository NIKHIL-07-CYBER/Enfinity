import type { Express, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import { GoogleGenerativeAI } from '@google/generative-ai';

function extractiveSummary(text: string): string {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (sentences.length === 0) return '• (No content)';
  const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
  const freq: Record<string, number> = {};
  for (const w of words) {
    freq[w] = (freq[w] ?? 0) + 1;
  }
  const scored = sentences.map((s, i) => {
    const sw = s.toLowerCase().match(/\b[a-z]+\b/g) || [];
    let score = sw.reduce((acc, w) => acc + (freq[w] ?? 0), 0) / Math.max(1, sw.length);
    if (i === 0 || i === sentences.length - 1) score += 2;
    return { s, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored
    .slice(0, 4)
    .map((x) => `• ${x.s}`)
    .join('\n');
}

export function registerSummarizeRoutes(app: Express): void {
  app.post('/api/documents/summarize', async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;
    if (!token || !url || !key) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const supabase = createClient(url, key);
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { documentId, text, userId } = req.body as {
      documentId?: string;
      text?: string;
      userId?: string;
    };
    if (!text || !documentId) {
      res.status(400).json({ error: 'Missing fields' });
      return;
    }
    if (userId && userData.user.id !== userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const clipped = String(text).slice(0, 4000);
    const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;

    if (GOOGLE_AI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(GOOGLE_AI_API_KEY);
        const model = genAI.getGenerativeModel({ 
          model: "gemini-1.5-flash",
          systemInstruction: 'You are an expert academic summarizer. Summarize the following text in 3-5 bullet points. Each bullet should be one clear sentence. Focus on key concepts, main arguments, and important terms. Do not include introduction or conclusion fluff.'
        });

        const result = await model.generateContent(clipped);
        const response = await result.response;
        const summary = response.text() || "";

        if (summary) {
          await supabase.from('user_documents').update({ summary }).eq('id', documentId);
          return res.json({ summary });
        }
      } catch (err) {
        console.error('[SUMMARIZE] Google AI Error:', err);
        /* fall through to extractive summary if AI fails */
      }
    }

    const summary = extractiveSummary(clipped);
    await supabase.from('user_documents').update({ summary }).eq('id', documentId);
    res.json({ summary, generated_by: 'extractive' });
  });
}
