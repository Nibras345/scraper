import { logger } from '../utils/logger';
import { CrawlerService } from './crawler';
import { renderPage, getBrowser } from './browser';
import { extractShopifyProduct } from './parser';
import { extractFields } from './ai';
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

                // 4. Scrape each link using the SAME browser session
                const maxProducts = 300; // safety
                const actualLinks = linksToScrape.slice(0, maxProducts);

                for (const link of actualLinks) {
                    try {
                        logger.info(`Processing product [${scrapedCount + 1}/${actualLinks.length}]: ${link}`);
                        const html = await renderPage(link, browser);

                        // Try direct extraction first
                        let variants = extractShopifyProduct(html, link);

                        if (!variants) {
                            logger.info(`Falling back to AI for ${link}`);
                            const aiData = await extractFields(link, html, fields);
                            variants = Array.isArray(aiData) ? aiData : [aiData];
                        }

                        // Save variants to Product model
                        for (const variant of variants) {
                            await Product.create({
                                ...variant,
                                'Product URL': variant['Product URL'] || link,
                                url: link,
                                jobId: jobId
                            });
                        }

                        scrapedCount++;
                        await ScrapeJob.findByIdAndUpdate(jobId, { scrapedProducts: scrapedCount });

                    } catch (err) {
                        logger.error(`Failed to scrape product: ${link}`, err);
                    }
                }
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
