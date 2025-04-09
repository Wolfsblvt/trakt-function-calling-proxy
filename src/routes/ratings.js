import express from 'express';

import dataService from '../services/data-service.js';
import { DEFAULT_LIMITS } from '../trakt/client.js';
import { parseTraktTypeWithAliases } from '../trakt/trakt-utils.js';
import { paramParser } from '../utils/param-parser.js';
import { createApiResponseFromProps } from '../utils/utils.js';

/** @import * as Props from '../trakt/types/props-types.js' */

/** @typedef {import('../utils/utils.js').ApiResponse<T>} ApiResponse @template T */

const router = express.Router();

/**
 * Get user's ratings with filtering and sorting options
 * @param {Props.RatingsFilterType} [type='all'] - Filter by type: movies, shows, seasons, episodes
 * @param {number} [min_rating=null] - Minimum rating to include (1-10)
 * @param {number} [max_rating=null] - Maximum rating to include (1-10)
 * @param {number} [limit=50] - Maximum number of items to return
 * @param {'rating'|'rated_at'} [sort_by='rated_at'] - Field to sort by
 * @param {'asc'|'desc'} [order='desc'] - Sort order
 * @param {boolean} [include_unwatched=false] - Whether to include items that haven't been watched
 * @param {boolean} [include_stats=true] - Whether to include statistics
 * @returns {Promise<ApiResponse<Flattened.FlattenedRatingItem>>} - The user's ratings
 */
router.get('/', async (req, res, next) => {
    try {
        const type = /** @type {Props.RatingsFilterType|undefined} */ (parseTraktTypeWithAliases(req.query.type, ['all', 'movies', 'shows', 'seasons', 'episodes'], 'type'));
        const minRating = paramParser.number(req.query.min_rating, 'min_rating');
        const maxRating = paramParser.number(req.query.max_rating, 'max_rating');
        const limit = paramParser.number(req.query.limit, 'limit');
        const sortBy = /** @type {'rating'|'rated_at'|undefined} */ (paramParser.enum(req.query.sort_by, ['rating', 'rated_at'], 'sort_by'));
        const order = /** @type {'asc'|'desc'|undefined} */ (paramParser.enum(req.query.order, ['asc', 'desc'], 'order'));
        const includeUnwatched = paramParser.boolean(req.query.include_unwatched, 'include_unwatched');
        const includeStats = paramParser.boolean(req.query.include_stats, 'include_stats');

        /** @type {Props.GetRatingsProps & Props.PaginationProps} */
        const props = {
            type: type ?? 'all',
            minRating: minRating,
            maxRating: maxRating,
            limit: limit ?? DEFAULT_LIMITS.RATINGS,
            sortBy: sortBy ?? 'rated_at',
            order: order ?? 'desc',
            includeUnwatched: includeUnwatched ?? false,
            includeStats: includeStats ?? true,
        };

        const ratings = await dataService.getRatings(props);

        const response = createApiResponseFromProps(ratings);

        // Add helpful tips
        response._tips = [
            'You can filter results by type (movie, show, episode), minimum or maximum rating, or sort by rating or date.',
            'Use the "limit" parameter to reduce result size if context is too long.',
            'Set "sort_by" to "rating" or "rated_at", and "order" to "asc" or "desc".',
        ];

        // Add info about the current filters
        const filterInfo = [];
        if (minRating !== undefined) filterInfo.push(`rated ${minRating}+ stars`);
        if (maxRating !== undefined) filterInfo.push(`rated ${maxRating}- stars`);
        if (type !== 'all' && type !== undefined) filterInfo.push(`type: "${type}"`);
        if (sortBy === 'rating') filterInfo.push(`sorted by rating ${order === 'desc' ? '(highest first)' : '(lowest first)'}`);
        if (sortBy === 'rated_at') filterInfo.push(`sorted by date ${order === 'desc' ? '(newest first)' : '(oldest first)'}`);

        response._info = filterInfo.length > 0
            ? `Showing ${ratings.data.length} ratings ${filterInfo.join(', ')}.`
            : `Showing ${ratings.data.length} ratings.`;

        res.json(response);
    } catch (error) {
        next(error);
    }
});

export default router;
