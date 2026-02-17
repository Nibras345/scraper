import * as cheerio from 'cheerio';

export const extractShopifyProduct = (html: string) => {
    const $ = cheerio.load(html);

    let productData: any = null;

    // Try to find structured JSON-LD Product
    $('script[type="application/ld+json"]').each((_, el) => {
        try {
            const content = $(el).html();
            if (!content) return;

            const json = JSON.parse(content);

            if (json['@type'] === 'Product') {
                productData = json;
            }
        } catch {
            // ignore parsing errors
        }
    });

    return productData;
};
