import { Browser } from "puppeteer";
import { logger } from "../utils/logger";

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

const MAX_PAGES = 30;
const RETRY_LIMIT = 2;

const normalizeProductUrl = (rawUrl: string): string => {
    try {
        const parsed = new URL(rawUrl);
        parsed.hash = "";
        parsed.search = "";
        return parsed.toString().replace(/\/$/, "");
    } catch {
        return rawUrl.split("#")[0].split("?")[0].replace(/\/$/, "");
    }
};

const buildPaginatedUrl = (startUrl: string, pageNumber: number): string => {
    const parsed = new URL(startUrl);

    // Keep original URL untouched for page=1 if no page query exists.
    if (pageNumber === 1 && !parsed.searchParams.has("page")) {
        return parsed.toString();
    }

    parsed.searchParams.set("page", String(pageNumber));
    return parsed.toString();
};

const autoScroll = async (page: any): Promise<void> => {
    await page.evaluate(async () => {
        await new Promise<void>((resolve) => {
            let totalHeight = 0;
            const distance = 400;
            const maxScrolls = 25;
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

const extractProductLinks = async (page: any): Promise<string[]> => {
    return page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll("a[href]"));
        const results = new Set<string>();

        const productPatterns = [
            /\/products?(\/|$)/i,
            /\/items?(\/|$)/i,
            /\/p\/[^/]+/i,
            /\/shop\/[^/]+/i
        ];

        const categoryPatterns = [
            /\/collections?(\/|$)/i,
            /\/categor(y|ies)(\/|$)/i,
            /\/tags?(\/|$)/i
        ];

        for (const anchor of anchors) {
            const href = (anchor as HTMLAnchorElement).href;
            if (!href) continue;

            let candidate: URL;
            try {
                candidate = new URL(href, window.location.href);
            } catch {
                continue;
            }

            const path = candidate.pathname.toLowerCase();
            const isCategory = categoryPatterns.some((pattern) => pattern.test(path));
            if (isCategory) continue;

            const isProduct = productPatterns.some((pattern) => pattern.test(path));
            if (!isProduct) continue;

            candidate.hash = "";
            candidate.search = "";
            results.add(candidate.toString().replace(/\/$/, ""));
        }

        return Array.from(results);
    });
};

export class CrawlerService {
    static async deepCrawl(startUrl: string, browser: Browser): Promise<string[]> {
        const productLinks = new Set<string>();
        const visitedPages = new Set<string>();

        const page = await browser.newPage();
        let stopReason = "Reached crawl end";

        try {
            for (let pageNumber = 1; pageNumber <= MAX_PAGES; pageNumber++) {
                const paginatedUrl = buildPaginatedUrl(startUrl, pageNumber);

                if (visitedPages.has(paginatedUrl)) {
                    stopReason = `Pagination loop detected at page ${pageNumber}`;
                    break;
                }

                visitedPages.add(paginatedUrl);
                logger.info(`[Crawler] Crawling page ${pageNumber}: ${paginatedUrl}`);

                let links: string[] = [];
                let lastError: unknown = null;

                for (let attempt = 1; attempt <= RETRY_LIMIT + 1; attempt++) {
                    try {
                        await page.goto(paginatedUrl, {
                            waitUntil: "networkidle2",
                            timeout: 60000
                        });

                        await autoScroll(page);
                        await delay(1000);

                        links = await extractProductLinks(page);
                        break;
                    } catch (error) {
                        lastError = error;
                        logger.warn(`[Crawler] Page ${pageNumber} attempt ${attempt} failed`);
                        await delay(1200 * attempt);
                    }
                }

                if (links.length === 0 && lastError) {
                    logger.error(`[Crawler] Failed page ${pageNumber} after retries`, lastError);
                    stopReason = `Failed page ${pageNumber} after retries`;
                    break;
                }

                logger.info(`[Crawler] Products found on page ${pageNumber}: ${links.length}`);

                if (links.length === 0) {
                    stopReason = `No products found on page ${pageNumber}`;
                    break;
                }

                let newCount = 0;
                for (const link of links) {
                    const normalized = normalizeProductUrl(link);
                    if (!productLinks.has(normalized)) {
                        newCount += 1;
                    }
                    productLinks.add(normalized);
                }

                logger.info(`[Crawler] New unique products on page ${pageNumber}: ${newCount}`);
                logger.info(`[Crawler] Total unique products so far: ${productLinks.size}`);

                if (newCount === 0) {
                    stopReason = `No new products discovered on page ${pageNumber}`;
                    break;
                }
            }

            if (visitedPages.size >= MAX_PAGES) {
                stopReason = `Reached safety page limit (${MAX_PAGES})`;
            }
        } finally {
            await page.close();
        }

        logger.info(`[Crawler] Stop reason: ${stopReason}`);
        logger.success(`[Crawler] Total unique products discovered: ${productLinks.size}`);

        return Array.from(productLinks);
    }
}
