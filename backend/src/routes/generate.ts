import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import { convertToCSV } from '../services/csv';
import { rateLimiter } from '../middleware/rateLimiter';
import { CrawlerService } from '../services/crawler';
import { getBrowser } from '../services/browser';
import { scrapeProductsInBatches } from '../services/generator';

const router = Router();

interface GenerateRequestBody {
    url: string;
    fields: string;
}

router.post('/', rateLimiter, async (req: Request<{}, {}, GenerateRequestBody>, res: Response) => {
    const { url, fields } = req.body;

    if (!url) return res.status(400).json({ error: 'url is required' });
    if (!fields) return res.status(400).json({ error: 'fields is required' });

    let browser;
    try {
        logger.info(`Starting Synchronous Extraction for: ${url}`);
        browser = await getBrowser();

        // 1. Discover all links first
        const links = await CrawlerService.deepCrawl(url, browser);
        logger.info(`Found ${links.length} products to scrape.`);

        // 2. Scrape products with bounded concurrency
        const scrapeResult = await scrapeProductsInBatches(links, browser, {
            fields,
            concurrency: 5,
            retries: 2,
            maxProducts: 50
        });

        const allVariants = scrapeResult.variants;

        if (allVariants.length === 0) {
            return res.status(404).json({ error: 'No products could be extracted.' });
        }

        // 3. Convert to CSV
        const csv = convertToCSV(allVariants);

        // 4. Send back as file
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=extracted_products.csv');
        res.status(200).send(csv);
    } catch (error) {
        logger.error('Generation failed', error);
        res.status(500).json({ error: 'Failed to perform synchronous extraction' });
    } finally {
        if (browser) await browser.close();
    }
});

export default router;
