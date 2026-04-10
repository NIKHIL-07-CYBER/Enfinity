import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { registerDocumentRoutes } from './routes/documents';
import { registerSummarizeRoutes } from './routes/summarize';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// The generalized `cors()` module governs preflight handling and authorized domains.

// Timing Middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 410 && (req.url.includes('/api/translate') || req.url.includes('/api/simplify'))) {
      console.warn(`[SLOW] ${req.method} ${req.url} took ${duration}ms`);
    }
  });
  next();
});

function wrapSuccess(data: any) {
  return { status: 'success', data, error: null };
}

function wrapError(message: string) {
  return { status: 'error', data: null, error: message };
}

app.get('/api/health', (req, res) => {
  res.json(wrapSuccess({ status: 'ok' }));
});

let useFallbackPriority = false;

app.post('/api/translate', async (req, res) => {

  const qRaw = req.body?.text ?? req.body?.q;
  const q = typeof qRaw === 'string' ? qRaw.trim() : '';
  const source = req.body?.source ?? 'en';
  const target = req.body?.target ?? 'es';

  if (!q) {
    return res.status(400).json(wrapError('Missing text to translate'));
  }

  if (useFallbackPriority) {
    try {
      const fallbackRes = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}&langpair=${source}|${target}`);
      const fallbackData = await fallbackRes.json();
      if (fallbackData.responseStatus === 200) {
        return res.json(wrapSuccess({ translatedText: fallbackData.responseData.translatedText }));
      }
    } catch (e) {
      // Ignore and attempt docker
    }
  }

  const controller = new AbortController();
  // Provider Pivot Requirement:
  const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

  try {
    const startDocker = Date.now();
    const defaultRes = await fetch('http://localhost:5000/translate', {
      method: 'POST',
      body: JSON.stringify({ q, source, target }),
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (Date.now() - startDocker >= 410) {
      useFallbackPriority = true; // Lock memory for demo duration
    }

    if (!defaultRes.ok) throw new Error(`Docker failure: ${defaultRes.status}`);
    
    const data = await defaultRes.json();
    return res.json(wrapSuccess(data));
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn('Docker failed or crossed 410ms, tripping circuit breaker to MyMemory');
    useFallbackPriority = true; // Hard lock memory
    
    try {
      const fallbackRes = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}&langpair=${source}|${target}`);
      const fallbackData = await fallbackRes.json();
      
      if (fallbackData.responseStatus === 200) {
        return res.json(wrapSuccess({ translatedText: fallbackData.responseData.translatedText }));
      } else {
        return res.status(500).json(wrapError('Fallback translation failed'));
      }
    } catch (fallbackError) {
      return res.status(500).json(wrapError('Both translation systems failed'));
    }
  }
});

app.post('/api/simplify', async (req, res) => {
  const { word } = req.body;
  if (!word) return res.status(400).json(wrapError('Word is required'));

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return res.status(response.status).json(wrapError('Failed to fetch synonyms'));
    }

    const data = await response.json();
    const synonyms = data[0]?.meanings[0]?.synonyms?.slice(0, 3) || [];
    const definition = data[0]?.meanings[0]?.definitions[0]?.definition || '';

    return res.json(wrapSuccess({ synonyms, definition }));
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      return res.status(504).json(wrapError('Gateway Timeout'));
    }
    return res.status(500).json(wrapError('Internal server error'));
  }
});

// DONE: Task 5e — POST /api/chat for AI chatbot
app.post('/api/chat', async (req, res) => {
  const { message, context, history } = req.body;
  if (!message) return res.status(400).json(wrapError('Message is required'));

  const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;

  if (!GOOGLE_AI_API_KEY) {
    return res.json(wrapSuccess({
      response: "I'm not configured yet. Ask your team to add GOOGLE_AI_API_KEY to .env"
    }));
  }

  const genAI = new GoogleGenerativeAI(GOOGLE_AI_API_KEY);
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash-lite",
    systemInstruction: `You are a reading assistant helping a student understand a text.
Context about what they are currently reading: ${context || 'No context available'}
Be concise (under 120 words). Use simple language. If they ask about a specific word, give definition + example sentence. Focus only on the text.`
  });

  const chatHistory = (history || []).slice(-4).map((m: any) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }],
  }));

  try {
    const chat = model.startChat({
      history: chatHistory,
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const responseText = response.text() || "I couldn't formulate a response.";
    
    return res.json(wrapSuccess({ response: responseText }));
  } catch (error: any) {
    console.error('[CHAT] Error:', error);
    
    // Fallback to Anthropic if key exists and Google fails? 
    // No, better to report Google error since we are switching.
    return res.json(wrapSuccess({
      response: "I'm having trouble connecting to Google AI. Try again. Error: " + error?.message
    }));
  }
});

registerDocumentRoutes(app);
registerSummarizeRoutes(app);

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.warn(`Express Proxy Server listening on port ${PORT}`);
  });
}

export const appInstance = app;
