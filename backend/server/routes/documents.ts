import type { Express, Request, Response } from 'express';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

export function registerDocumentRoutes(app: Express): void {
  app.post('/api/documents/parse', upload.single('file'), async (req: Request, res: Response) => {
    res.status(400).json({ error: 'PDF parsing is handled client-side now.' });
  });
}
