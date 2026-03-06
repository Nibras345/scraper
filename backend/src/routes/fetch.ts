import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import { rateLimiter } from '../middleware/rateLimiter';
import { CrawlerService } from '../services/crawler';
import { getBrowser } from '../services/browser';

const router = Router();

interface FetchRequestBody {
  url: string;
}

router.post(
  '/',
  rateLimiter,
  async (req: Request<{}, {}, FetchRequestBody>, res: Response) => {

    const { url } = req.body;

    // ---------------------------
    // Validate URL
    // ---------------------------

    if (!url || !url.trim()) {
      return res.status(400).json({
        error: 'URL is required'
      });
    }

    let validUrl: string;

    try {
      validUrl = new URL(url).href;
    } catch {
      return res.status(400).json({
        error: 'Invalid URL format'
      });
    }

    let browser: any;

    try {

      logger.info(`🚀 Starting product discovery: ${validUrl}`);

      // launch browser
      browser = await getBrowser();

      // deep crawl all pages
      const productLinks = await CrawlerService.deepCrawl(validUrl, browser);

      const totalProducts = productLinks.length;

      logger.success(`✅ Discovery complete. Found ${totalProducts} products.`);

      return res.json({
        data: `Total Products found: ${totalProducts}\nStatus: Site Discovery Complete.`,
        totalProducts
      });

    } catch (error) {

      logger.error('❌ Discovery failed', error);

      return res.status(500).json({
        error: 'Failed to discover products on the site'
      });

    } finally {

      try {
        if (browser) {
          await browser.close();
        }
      } catch (e) {
        logger.warn('Browser already closed');
      }

    }

  }
);

export default router;