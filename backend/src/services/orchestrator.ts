import { logger } from '../utils/logger';
import { CrawlerService } from './crawler';
import { getBrowser } from './browser';
import { scrapeProductsInBatches } from './generator';
import Product from '../models/Product';
import ScrapeJob from '../models/ScrapeJob';

/**
 * Manages the full scraping lifecycle for a job.
 */
export class OrchestratorService {
    static async startJob(jobId: string, url: string, fields: string) {
        try {
            logger.startup(`Starting Batch Scrape for Job: ${jobId}`);

            // 1. Update status to crawling
            await ScrapeJob.findByIdAndUpdate(jobId, { status: 'crawling' });

            // 2. Discover product links
            const browser = await getBrowser();
            let linksToScrape: string[] = [];
            let scrapedCount = 0;

            try {
                linksToScrape = await CrawlerService.deepCrawl(url, browser);

                logger.info(`Total unique product links identified: ${linksToScrape.length}`);

                // 3. Update job with total count
                const job = await ScrapeJob.findById(jobId);
                await ScrapeJob.findByIdAndUpdate(jobId, {
                    totalProducts: linksToScrape.length
                });

                // If mode is 'count', we stop here
                if (job?.mode === 'count') {
                    logger.success(`Count-only mode finished. Total: ${linksToScrape.length}`);
                    await ScrapeJob.findByIdAndUpdate(jobId, { status: 'completed' });
                    return;
                }

                // 4. Start scraping (Full mode)
                await ScrapeJob.findByIdAndUpdate(jobId, { status: 'scraping' });

                const maxProducts = 300; // safety
                const actualLinks = linksToScrape.slice(0, maxProducts);

                const result = await scrapeProductsInBatches(actualLinks, browser, {
                    fields,
                    concurrency: 5,
                    retries: 2,
                    maxProducts,
                    onSuccess: async ({ link, variants }) => {
                        if (variants.length > 0) {
                            await Product.insertMany(
                                variants.map((variant) => ({
                                    ...variant,
                                    'Product URL': variant['Product URL'] || link,
                                    url: link,
                                    jobId
                                }))
                            );
                        }

                        scrapedCount += 1;
                        await ScrapeJob.findByIdAndUpdate(jobId, { scrapedProducts: scrapedCount });
                    },
                    onFailure: async (link, err) => {
                        logger.error(`Failed to scrape product: ${link}`, err);
                    }
                });

                logger.info(
                    `Scrape summary: success=${result.successCount}, failed=${result.failureCount}, processed=${result.totalProcessed}`
                );
            } finally {
                if (browser) await browser.close();
            }

            // 5. Success!
            await ScrapeJob.findByIdAndUpdate(jobId, { status: 'completed' });
            logger.success(`Batch Scrape completed! Scraped: ${scrapedCount}`);
        } catch (error: any) {
            logger.error(`Orchestrator failed for job ${jobId}`, error);
            await ScrapeJob.findByIdAndUpdate(jobId, { status: 'failed', error: error.message });
        }
    }
}
