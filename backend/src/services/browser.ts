import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { HTTPRequest } from 'puppeteer';
import { logger } from '../utils/logger';

puppeteer.use(StealthPlugin());

const USER_AGENTS = [
'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
];

/**
 * Launch stealth browser
 */
export const getBrowser = async () => {

    return await puppeteer.launch({
        headless: true,

        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--disable-infobars',
            '--window-size=1366,768',
            '--disable-blink-features=AutomationControlled'
        ]
    });

};


/**
 * Render webpage with anti-bot protection bypass
 */
export const renderPage = async (url: string, existingBrowser?: any): Promise<string> => {

    let browser = existingBrowser;
    let isTempBrowser = false;
    let page;

    try {

        if (!browser) {

            logger.info(`→ Launching Temp Browser: ${url}`);
            browser = await getBrowser();
            isTempBrowser = true;

        }

        const userAgent =
            USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

        page = await browser.newPage();

        // realistic browser setup
        await page.setUserAgent(userAgent);

        await page.setViewport({
            width: 1366,
            height: 768
        });

        await page.setExtraHTTPHeaders({
            'accept-language': 'en-US,en;q=0.9',
            'referer': 'https://www.google.com/'
        });

        // block unnecessary resources
        await page.setRequestInterception(true);

        page.on('request', (req: HTTPRequest) => {

            const type = req.resourceType();

            if (
                type === 'image' ||
                type === 'font' ||
                type === 'media'
            ) {
                req.abort();
            } else {
                req.continue();
            }

        });

        logger.info(`→ Navigating to: ${url}`);

        await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: 90000
        });

        // human-like delay
        await new Promise(r => setTimeout(r, 2000));

        // detect bot protection pages
        const title = await page.title();

        if (
            title.toLowerCase().includes('just a moment') ||
            title.toLowerCase().includes('checking your browser') ||
            title.toLowerCase().includes('bot protection')
        ) {

            logger.warn('→ Bot protection detected, waiting...');

            await new Promise(r => setTimeout(r, 5000));

        }

        // human scrolling
        await page.evaluate(async () => {

            await new Promise((resolve) => {

                let totalHeight = 0;
                const distance = 300;

                const timer = setInterval(() => {

                    const scrollHeight = document.body.scrollHeight;

                    window.scrollBy(0, distance);

                    totalHeight += distance;

                    if (totalHeight >= scrollHeight) {

                        clearInterval(timer);
                        resolve(true);

                    }

                }, 200);

            });

        });

        const html = await page.content();

        logger.success(`✅ Page rendered. Size: ${html.length}`);

        return html;

    }
    catch (error) {

        logger.error('→ Rendering failed', error);

        throw new Error('Failed to render page');

    }
    finally {

        if (page) {
            await page.close();
        }

        if (browser && isTempBrowser) {
            await browser.close();
        }

    }

};