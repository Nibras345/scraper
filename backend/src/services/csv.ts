import { Parser } from 'json2csv';
import { logger } from '../utils/logger';

export const convertToCSV = (data: any) => {
    try {
        if (!data) return '';

        // Ensure data is an array
        const dataArray = Array.isArray(data) ? data : [data];

        if (dataArray.length === 0) return '';

        logger.info('CSV generating from data array');

        // Ensure data is flattened if it's an array of arrays
        const flattenedData = dataArray.flat();

        if (flattenedData.length === 0) return '';

        const parser = new Parser({
            fields: Object.keys(flattenedData[0])
        });

        const csv = parser.parse(flattenedData);
        return csv;
    } catch (error) {
        logger.error('CSV generation failed', error);
        throw error;
    }
};
