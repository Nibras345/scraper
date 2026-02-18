import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import cors from 'cors';
import { logger } from './utils/logger';
import { connectDB } from './config/db';
import fetchRoutes from './routes/fetch';
import generateRoutes from './routes/generate';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/fetch', fetchRoutes);
app.use('/generate', generateRoutes);

// Health Check
app.get('/', (req: Request, res: Response) => {
    res.send('AI Shopify CSV Scraper API is running...');
});

// Start Server
const startServer = async () => {
    try {
        await connectDB();
        const server = app.listen(PORT, () => {
            logger.startup(`Server running on port ${PORT}`);
        });

        server.on('error', (error: any) => {
            if (error.code === 'EADDRINUSE') {
                logger.error(`Port ${PORT} is already in use. Please close the process using this port or change the PORT in .env.`);
                process.exit(1);
            } else {
                logger.error('Server error', error);
            }
        });
    } catch (error) {
        logger.error('Failed to start server', error);
        process.exit(1);
    }
};

startServer();
