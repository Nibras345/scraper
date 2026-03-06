import { Browser, HTTPRequest, Page } from 'puppeteer';
import { extractShopifyProduct } from './parser';
import { extractFields } from './ai';
import { logger } from '../utils/logger';

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export interface ScrapedLinkResult {
    link: string;
    variants: any[];
    index: number;
    total: number;
}

interface ScrapeProductsOptions {
    concurrency?: number;
    retries?: number;
    maxProducts?: number;
    fields: string;
    onSuccess?: (result: ScrapedLinkResult) => Promise<void> | void;
    onFailure?: (link: string, error: unknown) => Promise<void> | void;
}

interface ScrapeProductsResult {
    variants: any[];
    successCount: number;
    failureCount: number;
    totalProcessed: number;
}

const configurePage = async (page: Page): Promise<void> => {
    await page.setViewport({ width: 1366, height: 768 });
    await page.setExtraHTTPHeaders({
        'accept-language': 'en-US,en;q=0.9'
    });

    await page.setRequestInterception(true);
    page.on('request', (req: HTTPRequest) => {
        const type = req.resourceType();
        if (type === 'image' || type === 'font' || type === 'media') {
            req.abort();
            return;
        }
        req.continue();
    });
};

const autoScroll = async (page: Page): Promise<void> => {
    await page.evaluate(async () => {
        await new Promise<void>((resolve) => {
            let totalHeight = 0;
            const distance = 350;
            const maxScrolls = 20;
            let count = 0;

            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;
                count += 1;

                if (totalHeight >= scrollHeight || count >= maxScrolls) {
                    clearInterval(timer);
                    resolve();
                }
            }, 180);
        });
    });
};

const scrapeSingleProduct = async (
    page: Page,
    link: string,
    fields: string,
    retries: number
): Promise<any[]> => {
    let lastError: unknown;

    for (let attempt = 1; attempt <= retries + 1; attempt++) {
        try {
            await page.goto(link, {
                waitUntil: 'networkidle2',
                timeout: 90000
            });

            await autoScroll(page);
            await delay(800);

            const html = await page.content();
            let variants = extractShopifyProduct(html, link);

            if (!variants) {
                logger.info(`[Generator] AI fallback: ${link}`);
                const aiData = await extractFields(link, html, fields);
                variants = Array.isArray(aiData) ? aiData : [aiData];
            }

            return variants.filter(Boolean);
        } catch (error) {
            lastError = error;
            logger.warn(`[Generator] Attempt ${attempt} failed for ${link}`);
            await delay(1000 * attempt);
        }
    }

    throw lastError ?? new Error('Unknown scrape failure');
};

export const scrapeProductsInBatches = async (
    links: string[],
    browser: Browser,
    options: ScrapeProductsOptions
): Promise<ScrapeProductsResult> => {
    const concurrency = Math.max(1, options.concurrency ?? 5);
    const retries = Math.max(0, options.retries ?? 2);
    const maxProducts = Math.max(1, options.maxProducts ?? 300);
    const linksToScrape = links.slice(0, maxProducts);

    const results: any[] = [];
    let successCount = 0;
    let failureCount = 0;
    let cursor = 0;

    const workerCount = Math.min(concurrency, linksToScrape.length || 1);

    const workers = Array.from({ length: workerCount }, async () => {
        const page = await browser.newPage();

        try {
            await configurePage(page);

            while (true) {
                const currentIndex = cursor;
                cursor += 1;

                if (currentIndex >= linksToScrape.length) {
                    break;
                }

                const link = linksToScrape[currentIndex];
                logger.info(`[Generator] Scraping ${currentIndex + 1}/${linksToScrape.length}: ${link}`);

                try {
                    const variants = await scrapeSingleProduct(page, link, options.fields, retries);

                    if (variants.length > 0) {
                        results.push(...variants);
                    }

                    successCount += 1;

                    if (options.onSuccess) {
                        await options.onSuccess({
                            link,
                            variants,
                            index: currentIndex,
                            total: linksToScrape.length
                        });
                    }
                } catch (error) {
                    failureCount += 1;
                    logger.error(`[Generator] Failed to scrape ${link}`, error);

                    if (options.onFailure) {
                        await options.onFailure(link, error);
                    }
                }
            }
        } finally {
            await page.close();
        }
    });

    await Promise.all(workers);

    return {
        variants: results,
        successCount,
        failureCount,
        totalProcessed: successCount + failureCount
    };
};
