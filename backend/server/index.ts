import express from 'express';
import cors from 'cors';

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
    if (duration > 410) {
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

app.post('/api/translate', async (req, res) => {
  const { q, source, target } = req.body;

  const controller = new AbortController();
  // Provider Pivot: Drop Docker timeout aggressively to 300ms to heavily favor MyMemory or fast executions. Avoid latency spikes.
  const timeoutId = setTimeout(() => controller.abort(), 300);

  try {
    const defaultRes = await fetch('http://localhost:5000/translate', {
      method: 'POST',
      body: JSON.stringify({ q, source, target }),
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!defaultRes.ok) throw new Error(`Docker failure: ${defaultRes.status}`);
    
    const data = await defaultRes.json();
    return res.json(wrapSuccess(data));
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn('Fallback to MyMemory API due to error:', error);
    
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

app.listen(PORT, () => {
  console.log(`Express Proxy Server listening on port ${PORT}`);
});
