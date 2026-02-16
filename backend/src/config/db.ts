import mongoose from 'mongoose';
import { logger } from '../utils/logger';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || '';

export const connectDB = async () => {
    try {
        if (!MONGO_URI) {
            throw new Error('MONGO_URI is not defined in environment variables');
        }
        await mongoose.connect(MONGO_URI);
        logger.success('DB Connected');
    } catch (error) {
        logger.error('Database connection failed', error);
        process.exit(1);
    }
};
