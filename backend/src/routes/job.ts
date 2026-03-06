import express, { Request, Response } from 'express';
import ScrapeJob from '../models/ScrapeJob';
import Product from '../models/Product';
import { OrchestratorService } from '../services/orchestrator';
import { convertToCSV } from '../services/csv';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * Start a new scraping job.
 */
router.post('/start', async (req: Request, res: Response) => {
    try {
        const { url, mode = 'full', fields = 'title, price, sku, color, size, description, images' } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        // Create a new job record
        const job = await ScrapeJob.create({
            baseUrl: url,
            mode,
            status: 'pending'
        });

        // Run orchestration in the background
        OrchestratorService.startJob((job._id as any).toString(), url, fields);

        res.status(201).json({
            message: 'Scraping job started',
            jobId: job._id
        });

    } catch (error: any) {
        logger.error('Failed to start job', error);
        res.status(500).json({ error: 'Failed to initiate scraping job' });
    }
});

/**
 * Get status of a job.
 */
router.get('/:id/status', async (req: Request, res: Response) => {
    try {
        const job = await ScrapeJob.findById(req.params.id);
        if (!job) return res.status(404).json({ error: 'Job not found' });
        res.json(job);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch job status' });
    }
});

/**
 * Get products for a job.
 */
router.get('/products', async (req: Request, res: Response) => {
    try {
        const { jobId, title, minPrice, maxPrice } = req.query;
        const query: any = {};

        if (jobId) query.jobId = jobId;
        if (title) query.title = { $regex: title, $options: 'i' };
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = minPrice;
            if (maxPrice) query.price.$lte = maxPrice;
        }

        const products = await Product.find(query).limit(100);
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

/**
 * Export job products to Shopify-compatible CSV.
 */
router.get('/:id/export', async (req: Request, res: Response) => {
    try {
        const products = await Product.find({ jobId: req.params.id }).lean();

        if (products.length === 0) {
            return res.status(404).json({ error: 'No products found for this job' });
        }

        const csv = convertToCSV(products);

        res.header('Content-Type', 'text/csv');
        res.attachment(`shopify_export_${req.params.id}.csv`);
        res.send(csv);

    } catch (error) {
        logger.error('Export failed', error);
        res.status(500).json({ error: 'Failed to generate CSV export' });
    }
});

export default router;
