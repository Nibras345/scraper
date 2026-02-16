import puppeteer from 'puppeteer';
import { logger } from '../utils/logger';

/**
 * Render a webpage using a real browser.
 * Needed for JS-heavy Shopify / React stores.
 */
export const renderPage = async (url: string): Promise<string> => {
    let browser;

    try {
        // Step 1 → Launch browser
        logger.info(`→ Launching browser to render: ${url}`);

        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        // Step 2 → Open new tab
        const page = await browser.newPage();

        // Step 3 → Fake real browser (anti-bot help)
        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
        );

        // Step 4 → Go to URL
        logger.info('→ Navigating to URL...');
        await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });

        // Step 5 → Wait for product-like elements
        logger.info('→ Waiting for product elements to appear...');

        try {
            await page.waitForSelector(
                'h1, h2, img, [class*="product"], [class*="price"]',
                { timeout: 15000 }
            );
            logger.success('→ Product content detected');
        } catch {
            // Continue even if selector not found
            logger.info('→ Product selector not found, continuing anyway...');
        }

        // Step 6 → small extra wait for lazy content
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Step 7 → NOW get HTML
        const html = await page.content();

        logger.info(`→ HTML size: ${html.length}`);
        logger.success('→ Page rendered successfully');

        return html;

    } catch (error) {
        logger.error('→ Puppeteer rendering failed', error);
        throw new Error('Failed to render page with Puppeteer');
    } finally {
        // Step 8 → Always close browser
        if (browser) {
            await browser.close();
        }
    }
};
