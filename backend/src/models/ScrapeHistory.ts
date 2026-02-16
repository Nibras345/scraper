import { Schema, model, Document } from 'mongoose';

export interface IScrapeHistory extends Document {
    url: string;
    fields: string;
    result: any;
    createdAt: Date;
}

const ScrapeHistorySchema = new Schema<IScrapeHistory>({
    url: { type: String, required: true },
    fields: { type: String, required: true },
    result: { type: Schema.Types.Mixed, required: true },
    createdAt: { type: Date, default: Date.now }
});

export default model<IScrapeHistory>('ScrapeHistory', ScrapeHistorySchema);
