import express from 'express';

import { TRAKT_WATCH_TYPES } from '../trakt/client.js';

/** @import * as Props from '../trakt/types/props-types.js' */

/** @typedef {import('../cache/cached-trakt-client.js').WithForceRefresh} AllowForceRefresh */

const router = express.Router();

/**
 * GET /ratings - Fetches user ratings with filtering options
 * @param {string} [req.query.type] - Optional filter by type: movies, shows, seasons, episodes
 * @param {number} [req.query.rating] - Optional filter by rating value (1-10)
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
            rating: ratingParam,
            limit: limitParam,
            page: pageParam,
            forceRefresh: forceRefreshParam,
            autoPaginate: autoPaginateParam,
            maxPages: maxPagesParam,
        } = req.query;

        // Convert query parameters to appropriate types
        /** @type {Props.GetRatingsProps & AllowForceRefresh & {autoPaginate?: boolean, maxPages?: number|null}} */
        const options = {
            type: typeParam && typeof typeParam === 'string' && TRAKT_WATCH_TYPES[typeParam.toUpperCase()] ? TRAKT_WATCH_TYPES[typeParam.toUpperCase()] : undefined,
            rating: ratingParam ? Number(String(ratingParam)) : undefined,
            limit: limitParam ? Number(String(limitParam)) : undefined,
            page: pageParam ? Number(String(pageParam)) : undefined,
            forceRefresh: forceRefreshParam === 'true',
            autoPaginate: autoPaginateParam !== 'false', // Default to true unless explicitly set to false
            maxPages: maxPagesParam ? Number(String(maxPagesParam)) : null,
        };

        // Use the DataProcessor to get ratings with client-side filtering
        const ratingsResponse = await dataProcessor.getRatings(options);

        res.json({
            items: ratingsResponse.items,
            count: ratingsResponse.items.length,
            page: options.page,
            limit: options.limit,
            pagination: ratingsResponse.pagination,
        });
    } catch (error) {
        console.error('Error fetching ratings:', error);
        res.status(500).json({ error: 'Error fetching ratings', message: error.message });
    }
});

export default router;
