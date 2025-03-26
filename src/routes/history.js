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
 * @param {boolean} [req.query.autoPaginate=false] - Whether to automatically fetch all pages
 * @param {number} [req.query.maxPages] - Maximum number of pages to fetch when auto-paginating
 */
router.get('/', async (req, res) => {
    try {
        const {
            type: typeParam,
            id: idParam,
            startAt: startAtParam,
            endAt: endAtParam,
            limit: limitParam,
            page: pageParam,
            forceRefresh: forceRefreshParam,
            autoPaginate: autoPaginateParam,
            maxPages: maxPagesParam,
        } = req.query;

        // Convert query parameters to appropriate types
        /** @type {Props.GetHistoryProps & AllowForceRefresh & {autoPaginate?: boolean, maxPages?: number|null}} */
        const options = {
            type: typeParam && typeof typeParam === 'string' && TRAKT_WATCH_TYPES[typeParam.toUpperCase()] ? TRAKT_WATCH_TYPES[typeParam.toUpperCase()] : undefined,
            itemId: !isNaN(Number(idParam)) ? Number(idParam) : undefined,
            startAt: startAtParam ? new Date(String(startAtParam)) : undefined,
            endAt: endAtParam ? new Date(String(endAtParam)) : undefined,
            limit: limitParam ? Number(String(limitParam)) : undefined,
            page: pageParam ? Number(String(pageParam)) : undefined,
            forceRefresh: forceRefreshParam === 'true',
            autoPaginate: autoPaginateParam === 'true',
            maxPages: maxPagesParam ? Number(String(maxPagesParam)) : null,
        };

        // Use the DataProcessor to get enriched watch history with ratings
        const historyResponse = await dataProcessor.getEnrichedHistory(options);

        res.json({
            items: historyResponse.items,
            count: historyResponse.items.length,
            page: options.page,
            limit: options.limit,
            pagination: historyResponse.pagination,
        });
    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).json({ error: 'Error fetching history', message: error.message });
    }
});

export default router;
