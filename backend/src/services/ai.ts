import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

dotenv.config();

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export const extractFields = async (url: string, html: string, fields: string) => {
    try {
        logger.info('Sending data to AI');
        const response = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: 'You are a Shopify product data extractor. Return ONLY valid JSON. Missing fields must be empty strings.'
                },
                {
                    role: 'user',
                    content: `URL: ${url}\nFields to extract: ${fields}\nHTML Data: ${html.substring(0, 30000)}` // Safeguard against prompt length
                }
            ],
            model: 'llama-3.3-70b-versatile',
            response_format: { type: 'json_object' }
        });

        logger.success('AI response received');
        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error('Empty response from AI');
        }
        return JSON.parse(content);
    } catch (error) {
        logger.error('AI Extraction failed', error);
        throw error;
    }
};
