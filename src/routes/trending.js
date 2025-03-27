import express from 'express';
import dataProcessor from '../services/data-processor.js';

/** @import * as Props from '../trakt/props-types.js' */

/** @typedef {import('../cache/cached-trakt-client.js').WithForceRefresh} AllowForceRefresh */

const router = express.Router();

/**
 * GET /trending - Fetches trending items enriched with ratings and watch history
 * @param {string} [req.query.type='movies'] - Type: movies or shows
 * @param {number} [req.query.limit=10] - Number of items to return
 * @param {number} [req.query.page=1] - Page number
 * @param {boolean} [req.query.forceRefresh=false] - Whether to force a refresh from the API
 * @param {boolean} [req.query.autoPaginate=true] - Whether to automatically fetch all pages
 * @param {number} [req.query.maxPages] - Maximum number of pages to fetch when auto-paginating
 */
router.get('/', async (req, res) => {
    try {
        const {
            type: typeParam,
            limit: limitParam,
            page: pageParam,
            forceRefresh: forceRefreshParam,
            autoPaginate: autoPaginateParam,
            maxPages: maxPagesParam,
        } = req.query;

        // Convert query parameters to appropriate types
        /** @type {object & AllowForceRefresh & {autoPaginate?: boolean, maxPages?: number | null}} */
        const options = {
            type: typeParam && typeof typeParam === 'string' ? String(typeParam) : undefined,
            limit: limitParam ? Number(String(limitParam)) : undefined,
            page: pageParam ? Number(String(pageParam)) : undefined,
            forceRefresh: forceRefreshParam === 'true',
            autoPaginate: autoPaginateParam !== 'false', // Default to true unless explicitly set to false
            maxPages: maxPagesParam ? Number(String(maxPagesParam)) : null,
        };

        // Use the DataProcessor to get enriched trending items
        const trendingResponse = await dataProcessor.getEnrichedTrending(options);

        res.json({
            items: trendingResponse.items,
            count: trendingResponse.items.length,
            page: options.page,
            limit: options.limit,
            pagination: trendingResponse.pagination,
        });
    } catch (error) {
        console.error('Error fetching trending items:', error);
        res.status(500).json({ error: 'Error fetching trending items', message: error.message });
    }
});

/**
 * GET /trending/full - Fetches both trending movies and shows in one request
 * @param {boolean} [req.query.forceRefresh=false] - Whether to force a refresh from the API
 * @param {boolean} [req.query.autoPaginate=true] - Whether to automatically fetch all pages
 * @param {number} [req.query.maxPages] - Maximum number of pages to fetch when auto-paginating
 */
router.get('/full', async (req, res) => {
    try {
        const {
            forceRefresh: forceRefreshParam,
            autoPaginate: autoPaginateParam,
            maxPages: maxPagesParam,
        } = req.query;

        // Convert query parameters to appropriate types
        /** @type {object & AllowForceRefresh & {autoPaginate?: boolean, maxPages?: number | null}} */
        const options = {
            forceRefresh: forceRefreshParam === 'true',
            autoPaginate: autoPaginateParam !== 'false', // Default to true unless explicitly set to false
            maxPages: maxPagesParam ? Number(String(maxPagesParam)) : null,
        };

        // Use the DataProcessor to get full trending data (movies and shows)
        const fullTrendingResponse = await dataProcessor.getFullTrending(options);

        res.json(fullTrendingResponse);
    } catch (error) {
        console.error('Error fetching full trending data:', error);
        res.status(500).json({ error: 'Error fetching full trending data', message: error.message });
    }
});

export default router;
