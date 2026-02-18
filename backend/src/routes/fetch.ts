import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import { renderPage } from '../services/browser';
import { rateLimiter } from '../middleware/rateLimiter';

const router = Router();

interface FetchRequestBody {
  url: string;
}

router.post('/', rateLimiter, async (req: Request<{}, {}, FetchRequestBody>, res: Response) => {
  const { url } = req.body;

  if (!url || !url.trim()) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    logger.info(`→ Rendering URL with Puppeteer: ${url}`);

    // render full JS page
    const html = await renderPage(url);

    logger.success('→ Render complete');

    res.json({ data: html });
  } catch (error) {
    logger.error('→ Fetch failed', error);
    res.status(500).json({ error: 'Failed to fetch the URL' });
  }
});

export default router;
