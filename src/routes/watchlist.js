import express from 'express';
import dataProcessor from '../services/data-processor.js';
import { TRAKT_WATCH_TYPES } from '../trakt/client.js';

/** @import * as Props from '../trakt/props-types.js' */

/** @typedef {import('../cache/cached-trakt-client.js').WithForceRefresh} AllowForceRefresh */

const router = express.Router();

/**
 * GET /watchlist - Fetches the user's Trakt watchlist with ratings and watch history
 * @param {string} [req.query.type] - Optional filter by type: movies, shows, seasons, episodes
 * @param {string} [req.query.sort='rank'] - How to sort: rank, added, released, title
 * @param {number} [req.query.limit] - Optional limit for number of items
 * @param {number} [req.query.page=1] - Optional page number (default: 1)
 * @param {boolean} [req.query.forceRefresh=false] - Whether to force a refresh from the API
 * @param {boolean} [req.query.autoPaginate=true] - Whether to automatically fetch all pages
 * @param {number} [req.query.maxPages] - Maximum number of pages to fetch when auto-paginating
 */
router.get('/', async (req, res) => {
    try {
        const {
            type: typeParam,
            sort: sortParam,
            limit: limitParam,
            page: pageParam,
            forceRefresh: forceRefreshParam,
            autoPaginate: autoPaginateParam,
            maxPages: maxPagesParam,
        } = req.query;

        // Convert query parameters to appropriate types
        /** @type {Object & AllowForceRefresh & {autoPaginate?: boolean, maxPages?: number|null}} */
        const options = {
            type: typeParam && typeof typeParam === 'string' && TRAKT_WATCH_TYPES[typeParam.toUpperCase()] ? TRAKT_WATCH_TYPES[typeParam.toUpperCase()] : undefined,
            sort: sortParam ? String(sortParam) : undefined,
            limit: limitParam ? Number(String(limitParam)) : undefined,
            page: pageParam ? Number(String(pageParam)) : undefined,
            forceRefresh: forceRefreshParam === 'true',
            autoPaginate: autoPaginateParam !== 'false', // Default to true unless explicitly set to false
            maxPages: maxPagesParam ? Number(String(maxPagesParam)) : null,
        };

        // Use the DataProcessor to get enriched watchlist with ratings and history
        const watchlistResponse = await dataProcessor.getEnrichedWatchlist(options);

        res.json({
            items: watchlistResponse.items,
            count: watchlistResponse.items.length,
            page: options.page,
            limit: options.limit,
            pagination: watchlistResponse.pagination,
        });
    } catch (error) {
        console.error('Error fetching watchlist:', error);
        res.status(500).json({ error: 'Error fetching watchlist', message: error.message });
    }
});

export default router;
