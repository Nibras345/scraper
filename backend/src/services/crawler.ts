import { Browser } from "puppeteer";
import { logger } from "../utils/logger";

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export class CrawlerService {

    static async deepCrawl(startUrl: string, browser: Browser): Promise<string[]> {

        const productLinks = new Set<string>();
        const visitedPages = new Set<string>();

        let pageNumber = 1;
        let pageCount = 0;

        while (true) {

            const url =
                pageNumber === 1
                    ? startUrl
                    : `${startUrl}?page=${pageNumber}`;

            if (visitedPages.has(url)) break;

            visitedPages.add(url);
            pageCount++;

            logger.info(`→ Crawling page: ${url}`);

            try {

                const page = await browser.newPage();

                await page.goto(url, {
                    waitUntil: "networkidle2",
                    timeout: 60000
                });

                await delay(3000);

                // -----------------------
                // Extract product links
                // -----------------------

                const links: string[] = await page.evaluate(() => {

                    const anchors = Array.from(document.querySelectorAll("a[href]"));
                    const results = new Set<string>();

                    anchors.forEach(a => {

                        const href = (a as HTMLAnchorElement).href;

                        if (!href) return;

                        const isProduct =
                            href.includes("/product") ||
                            href.includes("/products") ||
                            href.includes("/item") ||
                            href.includes("/p/");

                        const isCategory =
                            href.includes("/category") ||
                            href.includes("/categories") ||
                            href.includes("/collection");

                        if (isProduct && !isCategory) {
                            results.add(href.split("?")[0]);
                        }

                    });

                    return Array.from(results);

                });

                await page.close();

                logger.info(`→ Found ${links.length} product links on this page`);

                // add to global list
                links.forEach(l => productLinks.add(l));

                // stop if page has no products
                if (links.length === 0) break;

                pageNumber++;

                // safety limit
                if (pageCount > 30) break;

            } catch (err) {

                logger.error("→ Page crawl failed", err);
                break;

            }

        }

        logger.success(`→ Total unique products discovered: ${productLinks.size}`);

        return Array.from(productLinks);

    }

}