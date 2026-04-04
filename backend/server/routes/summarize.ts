import type { Express, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

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
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (apiKey) {
      try {
        const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 400,
            system:
              'You are an expert academic summarizer. Summarize the following text in 3-5 bullet points. Each bullet should be one clear sentence. Focus on key concepts, main arguments, and important terms. Do not include introduction or conclusion fluff.',
            messages: [{ role: 'user', content: clipped }],
          }),
        });
        if (apiRes.ok) {
          const data = (await apiRes.json()) as {
            content?: Array<{ type?: string; text?: string }>;
          };
          const block = data.content?.find((c) => c.type === 'text');
          const summary = block?.text ?? '';
          await supabase.from('user_documents').update({ summary }).eq('id', documentId);
          return res.json({ summary });
        }
      } catch {
        /* fall through */
      }
    }

    const summary = extractiveSummary(clipped);
    await supabase.from('user_documents').update({ summary }).eq('id', documentId);
    res.json({ summary, generated_by: 'extractive' });
  });
}
