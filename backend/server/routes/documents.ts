import type { Express, Request, Response } from 'express';
import multer from 'multer';
// pdf-parse v2 ESM export isn't directly callable via ts-node CJS resolution
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse') as (buffer: Buffer) => Promise<{ text: string; numpages: number }>;

const upload = multer({ storage: multer.memoryStorage() });

export function registerDocumentRoutes(app: Express): void {
  app.post('/api/documents/parse', upload.single('file'), async (req: Request, res: Response) => {
    try {
      const buffer = req.file?.buffer;
      if (!buffer) {
        res.status(400).json({ error: 'No file' });
        return;
      }
      const data = await pdfParse(buffer);
      res.json({ text: data.text, pageCount: data.numpages });
    } catch {
      res.status(400).json({ error: 'Could not parse PDF' });
    }
  });
}
