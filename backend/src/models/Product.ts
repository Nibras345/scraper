import { Schema, model, Document } from 'mongoose';

export interface IProduct extends Document {
    url: string;
    handle: string;
    title: string;
    sku: string;
    price: string;
    compareAtPrice?: string;
    color?: string;
    size?: string;
    description: string;
    stock?: number;
    images: string[];
    attributes: Map<string, string>;
    category?: string;
    tags?: string[];
    jobId: Schema.Types.ObjectId;
    createdAt: Date;
    [key: string]: any; // Allow for dynamic Shopify fields via strict: false
}

const ProductSchema = new Schema<IProduct>({
    url: { type: String, required: true },
    handle: { type: String, required: true },
    title: { type: String, required: true },
    sku: { type: String },
    price: { type: String, required: true },
    compareAtPrice: { type: String },
    color: { type: String },
    size: { type: String },
    description: { type: String },
    stock: { type: Number },
    images: [{ type: String }],
    attributes: { type: Map, of: String },
    category: { type: String },
    tags: [{ type: String }],
    jobId: { type: Schema.Types.ObjectId, ref: 'ScrapeJob', required: true },
    createdAt: { type: Date, default: Date.now }
}, {
    strict: false // Allow saving other Shopify/Dynamic fields for CSV export
});

export default model<IProduct>('Product', ProductSchema);
