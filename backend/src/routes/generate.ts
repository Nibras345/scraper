import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import { extractFields } from '../services/ai';
import { convertToCSV } from '../services/csv';
import ScrapeHistory from '../models/ScrapeHistory';

import { renderPage } from '../services/browser';

const router = Router();

interface GenerateRequestBody {
    url?: string;
    data?: string;
    fields: string;
}

router.post('/', async (req: Request<{}, {}, GenerateRequestBody>, res: Response) => {
    const { url = '', data, fields } = req.body;

    if (!fields) {
        return res.status(400).json({ error: 'fields is required' });
    }

    try {
        let finalHtml = data;

        // Only render if data is not provided
        if (!finalHtml && url) {
            logger.info('→ Starting Puppeteer rendering');
            finalHtml = await renderPage(url);
        }

        if (!finalHtml) {
            return res.status(400).json({ error: 'Either url or data (HTML) must be provided' });
        }

        // 2. Call Grok AI
        const extractedData = await extractFields(url, finalHtml, fields);

        // 2. Save to database
        logger.info('Saving to database');
        await ScrapeHistory.create({
            url,
            fields,
            result: extractedData
        });

        // 3. Convert to CSV
        logger.info('CSV generating');
        const csv = convertToCSV(extractedData);

        // 4. Send back as file
        logger.info('File sent');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=shopify_products.csv');
        res.status(200).send(csv);

    } catch (error) {
        logger.error('Generation failed', error);
        res.status(500).json({ error: 'AI generation or CSV conversion failed' });
    }
});

export default router;
