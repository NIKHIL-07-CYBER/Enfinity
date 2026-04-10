import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { registerDocumentRoutes } from './routes/documents';
import { registerSummarizeRoutes } from './routes/summarize';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS Hardening
const allowedOrigins = [
  'http://localhost:5173', 
  'http://localhost:5174', 
  'http://localhost:5175', 
  'http://localhost:3000',
  process.env.FRONTEND_URL || 'https://your-vercel-frontend-url.vercel.app'
];

app.use(cors({ 
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Strict CORS restriction'));
    }
  } 
}));
app.use(express.json());

const FRONTEND = process.env.FRONTEND_URL || 'http://localhost:5173';

app.options('/api/translate', (req, res) => {
  res.header('Access-Control-Allow-Origin', FRONTEND);
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Accept');
  res.status(204).end();
});

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
let fallbackRequestCount = 0;

app.post('/api/translate', async (req, res) => {
  res.header('Access-Control-Allow-Origin', FRONTEND);
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Accept');

  const qRaw = req.body?.text ?? req.body?.q;
  const q = typeof qRaw === 'string' ? qRaw.trim() : '';
  const source = req.body?.source ?? 'en';
  const target = req.body?.target ?? 'es';

  if (!q) {
    return res.status(400).json(wrapError('Missing text to translate'));
  }

  // Re-probe Docker every 30 requests to allow recovery
  if (useFallbackPriority) {
    fallbackRequestCount++;
    if (fallbackRequestCount >= 30) {
      useFallbackPriority = false;
      fallbackRequestCount = 0;
    }
  }

  // ── Race Strategy: hit both providers simultaneously, use whichever returns first ──
  const dockerAbort = new AbortController();
  const dockerTimeout = setTimeout(() => dockerAbort.abort(), 4000);

  const myMemoryAbort = new AbortController();
  const myMemoryTimeout = setTimeout(() => myMemoryAbort.abort(), 5000);

  const dockerPromise = (async () => {
    const startDocker = Date.now();
    const r = await fetch('http://localhost:5000/translate', {
      method: 'POST',
      body: JSON.stringify({ q, source, target }),
      headers: { 'Content-Type': 'application/json' },
      signal: dockerAbort.signal,
    });
    clearTimeout(dockerTimeout);
    if (!r.ok) throw new Error(`Docker failure: ${r.status}`);
    if (Date.now() - startDocker >= 410) {
      useFallbackPriority = true;
      fallbackRequestCount = 0;
    }
    const data = await r.json();
    return { source: 'docker' as const, data };
  })();

  const myMemoryPromise = (async () => {
    const r = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}&langpair=${source}|${target}`,
      { signal: myMemoryAbort.signal },
    );
    clearTimeout(myMemoryTimeout);
    const data = await r.json();
    if (data.responseStatus !== 200) throw new Error('MyMemory failed');
    return { source: 'mymemory' as const, data: { translatedText: data.responseData.translatedText } };
  })();

  try {
    // If we already know Docker is slow, skip racing it
    const candidates = useFallbackPriority
      ? [myMemoryPromise]
      : [dockerPromise, myMemoryPromise];

    const winner = await Promise.any(candidates);

    // Cleanup abort controllers
    dockerAbort.abort();
    myMemoryAbort.abort();
    clearTimeout(dockerTimeout);
    clearTimeout(myMemoryTimeout);

    return res.json(wrapSuccess(winner.data));
  } catch {
    // All providers failed
    dockerAbort.abort();
    myMemoryAbort.abort();
    clearTimeout(dockerTimeout);
    clearTimeout(myMemoryTimeout);
    return res.status(500).json(wrapError('Both translation systems failed'));
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

app.listen(PORT, () => {
  console.warn(`Express Proxy Server listening on port ${PORT}`);
});
