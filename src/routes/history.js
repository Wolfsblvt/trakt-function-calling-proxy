import express from 'express';
import dataProcessor from '../services/data-processor.js';

const router = express.Router();

/**
 * GET /history - Fetches recently watched items with their ratings
 * @param {number} [req.query.limit] - Optional limit for number of items
 * @param {number} [req.query.page] - Optional page number (default: 1)
 */
router.get('/', async (req, res) => {
    try {
        // Extract and validate query parameters
        const limitParam = req.query.limit;
        const pageParam = req.query.page;

        // Convert query parameters to appropriate types
        const options = {
            limit: limitParam ? parseInt(String(limitParam), 10) : undefined,
            page: pageParam ? parseInt(String(pageParam), 10) : 1
        };

        // Use the DataProcessor to get enriched watch history with ratings
        const historyItems = await dataProcessor.getEnrichedWatchlist(options);

        res.json({
            items: historyItems,
            count: historyItems.length,
            page: options.page,
            limit: options.limit
        });
    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).json({ error: 'Error fetching history', message: error.message });
    }
});

export default router;
