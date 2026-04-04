import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/translate', async (req, res) => {
  const { q, source, target } = req.body;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const defaultRes = await fetch('http://localhost:5000/translate', {
      method: 'POST',
      body: JSON.stringify({ q, source, target }),
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!defaultRes.ok) {
      throw new Error(`Local Docker translation failed: ${defaultRes.status}`);
    }
    
    const data = await defaultRes.json();
    return res.json(data);
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn('Fallback to MyMemory API due to error:', error);
    
    try {
      const fallbackRes = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}&langpair=${source}|${target}`);
      const fallbackData = await fallbackRes.json();
      
      if (fallbackData.responseStatus === 200) {
        return res.json({ translatedText: fallbackData.responseData.translatedText });
      } else {
        return res.status(500).json({ error: 'Fallback MyMemory translation returned error status' });
      }
    } catch (fallbackError) {
      console.error('Both translation services failed', fallbackError);
      return res.status(500).json({ error: 'Both local Docker and fallback translations failed' });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Express Proxy Server listening on port ${PORT}`);
});
