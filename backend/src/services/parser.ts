import * as cheerio from 'cheerio';

export const extractShopifyProduct = (html: string, url: string): any[] | null => {
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
            } else if (Array.isArray(json)) {
                const found = json.find(i => i['@type'] === 'Product');
                if (found) productData = found;
            }
        } catch (e) { }
    });

    if (!productData) return null;

    // For a cleaner Shopify CSV, we need a "Handle" (URL-friendly name)
    const effectiveUrl = productData.url || url || '';
    const handle = effectiveUrl.split('/').pop()?.split('?')[0] || 'product';

    const variants: any[] = [];

    // If there are multiple offers, treat each as a variant
    const offers = Array.isArray(productData.offers) ? productData.offers : [productData.offers];

    offers.forEach((offer: any) => {
        if (!offer) return;

        variants.push({
            'Product URL': url,
            'Handle': handle,
            'Title': productData.name || '',
            'Product Title': productData.name || '', // Explicitly requested
            'Description': productData.description || '', // Explicitly requested
            'Body (HTML)': productData.description || '',
            'Vendor': productData.brand?.name || productData.brand || '',
            'Type': productData.category || '',
            'Tags': '',
            'SKU': offer.sku || productData.sku || offer.identifier || '',
            'Price': offer.price || offer.priceSpecification?.price || '',
            'Compare At Price': offer.priceSpecification?.price || '',
            'Variant Grams': 0,
            'Variant Inventory Tracker': 'shopify',
            'Variant Inventory Qty': (offer.availability?.includes('InStock') || offer.availability?.includes('OnlineOnly')) ? 100 : 0,
            'Variant Inventory Policy': 'deny',
            'Variant Fulfillment Service': 'manual',
            'Option1 Name': 'Color',
            'Option1 Value': offer.color || 'Default',
            'Color': offer.color || 'Default', // Explicitly requested
            'Option2 Name': 'Size',
            'Option2 Value': offer.size || 'Default',
            'Size': offer.size || 'Default', // Explicitly requested
            'Image Src': (Array.isArray(productData.image) ? productData.image[0] : productData.image) || '',
            'Image Alt Text': productData.name || ''
        });
    });

    return variants.length > 0 ? variants : null;
};
