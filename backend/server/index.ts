import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

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
  const { q, source, target } = req.body;

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

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

  if (!ANTHROPIC_API_KEY) {
    return res.json(wrapSuccess({
      response: "I'm not configured yet. Ask your team to add ANTHROPIC_API_KEY to .env"
    }));
  }

  const systemPrompt = `You are a reading assistant helping a student understand a text.\nContext about what they are currently reading: ${context || 'No context available'}\nBe concise (under 120 words). Use simple language. If they ask about a specific word, give definition + example sentence. Focus only on the text.`;

  const messages = [
    ...(history || []).slice(-4).map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content
    })),
    { role: 'user', content: message }
  ];

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        system: systemPrompt,
        messages,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      console.error('[CHAT] Anthropic error:', errText);
      return res.json(wrapSuccess({
        response: "I'm having trouble thinking right now. Try again in a moment."
      }));
    }

    const data = await apiRes.json();
    const responseText = data.content?.[0]?.text || "I couldn't formulate a response.";
    return res.json(wrapSuccess({ response: responseText }));
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      return res.json(wrapSuccess({ response: "Response timed out. Try a shorter question." }));
    }
    console.error('[CHAT] Error:', error);
    return res.json(wrapSuccess({
      response: "I'm having trouble connecting. Try again."
    }));
  }
});

app.listen(PORT, () => {
  console.warn(`Express Proxy Server listening on port ${PORT}`);
});
