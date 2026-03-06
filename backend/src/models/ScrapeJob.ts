import { Schema, model, Document } from 'mongoose';

export interface IScrapeJob extends Document {
    baseUrl: string;
    mode: 'full' | 'count';
    status: 'pending' | 'crawling' | 'scraping' | 'completed' | 'failed';
    totalProducts: number;
    scrapedProducts: number;
    error?: string;
    createdAt: Date;
    updatedAt: Date;
}

const ScrapeJobSchema = new Schema<IScrapeJob>({
    baseUrl: { type: String, required: true },
    mode: {
        type: String,
        enum: ['full', 'count'],
        default: 'full'
    },
    status: {
        type: String,
        enum: ['pending', 'crawling', 'scraping', 'completed', 'failed'],
        default: 'pending'
    },
    totalProducts: { type: Number, default: 0 },
    scrapedProducts: { type: Number, default: 0 },
    error: { type: String },
}, {
    timestamps: true
});

export default model<IScrapeJob>('ScrapeJob', ScrapeJobSchema);
