import { Parser } from 'json2csv';
import { logger } from '../utils/logger';

export const convertToCSV = (data: any | any[]) => {
    try {
        logger.info('CSV generated');
        const parser = new Parser();
        const csv = parser.parse(data);
        return csv;
    } catch (error) {
        logger.error('CSV generation failed', error);
        throw error;
    }
};
