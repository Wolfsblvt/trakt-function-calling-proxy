import express from 'express';
import dataProcessor from '../services/data-processor.js';
import { TRAKT_WATCH_TYPES } from '../trakt/client.js';

/** @import * as Props from '../trakt/props-types.js' */

/** @typedef {import('../cache/cached-trakt-client.js').WithForceRefresh} AllowForceRefresh */

const router = express.Router();

/**
 * GET /history - Fetches recently watched items with their ratings
 * @param {string} [req.query.type] - Optional filter by type: movies, shows, seasons, episodes
 * @param {string} [req.query.id] - Optional Trakt ID for a specific item
 * @param {string} [req.query.startAt] - Optional start date in ISO format (YYYY-MM-DD)
 * @param {string} [req.query.endAt] - Optional end date in ISO format (YYYY-MM-DD)
 * @param {number} [req.query.limit] - Optional limit for number of items
 * @param {number} [req.query.page=1] - Optional page number (default: 1)
 * @param {boolean} [req.query.forceRefresh=false] - Whether to force a refresh from the API
 */
router.get('/', async (req, res) => {
    try {
        // Extract and validate query parameters
        const typeParam = req.query.type;
        const idParam = req.query.id;
        const startAtParam = req.query.startAt;
        const endAtParam = req.query.endAt;
        const limitParam = req.query.limit;
        const pageParam = req.query.page;
        const forceRefreshParam = req.query.forceRefresh;

        // Convert query parameters to appropriate types
        /** @type {Props.GetHistoryProps & AllowForceRefresh} */
        const options = {
            type: typeParam && typeof typeParam === 'string' && TRAKT_WATCH_TYPES[typeParam.toUpperCase()] ? TRAKT_WATCH_TYPES[typeParam.toUpperCase()] : undefined,
            itemId: idParam && !isNaN(Number(idParam)) ? Number(idParam) : undefined,
            startAt: startAtParam ? new Date(String(startAtParam)) : undefined,
            endAt: endAtParam ? new Date(String(endAtParam)) : undefined,
            limit: limitParam ? Number(String(limitParam)) : undefined,
            page: pageParam ? Number(String(pageParam)) : undefined,
            forceRefresh: forceRefreshParam === 'true',
        };

        // Use the DataProcessor to get enriched watch history with ratings
        const historyItems = await dataProcessor.getEnrichedHistory(options);

        res.json({
            items: historyItems,
            count: historyItems.length,
            page: options.page,
            limit: options.limit,
        });
    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).json({ error: 'Error fetching history', message: error.message });
    }
});

export default router;
