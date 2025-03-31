import express from 'express';

import dataService from '../services/data-service.js';
import { DEFAULT_LIMITS, TRAKT_WATCH_TYPES } from '../trakt/client.js';
import { paramParser } from '../utils/param-parser.js';
import { createApiResponse, getDaysRangeOfItems } from '../utils/utils.js';

/** @import * as Props from '../trakt/types/props-types.js' */

const router = express.Router();

/**
 * Get user's history
 * @param {'all'|TRAKT_WATCH_TYPES} [type='all'] - Filter by type: movies, shows, seasons, episodes
 * @param {number} [limit] - The number of items to retrieve
 * @param {number} [last_x_days] - The number of days to retrieve history from
 * @returns {Promise<any>} - The user's history
 */
router.get('/', async (req, res) => {
    const type = /** @type {TRAKT_WATCH_TYPES|undefined} */ (paramParser.enum(req.query.type, ['all', ...Object.values(TRAKT_WATCH_TYPES)]));
    const limit = paramParser.number(req.query.limit);
    const last_x_days = paramParser.number(req.query.last_x_days);

    /** @type {Props.GetHistoryProps & Props.PaginationProps} */
    const props = {};

    props.type = type ?? 'all';
    props.limit = limit ?? DEFAULT_LIMITS.HISTORY;

    if (last_x_days) {
        props.endAt = new Date();
        props.startAt = new Date(props.endAt);
        props.startAt.setDate(props.startAt.getDate() - last_x_days);

        if (limit === undefined) {
            console.debug('No limit specified, but requested last_x_days, setting limit to undefined to return all items in that range.');
            props.limit = undefined;
        }
    }

    const history = await dataService.getHistory(props);

    const response = createApiResponse(history.data, history.pagination);

    const days = last_x_days ?? getDaysRangeOfItems(history.data, item => new Date(item.watched_at).getTime());
    response._info = `Includes ${days} days of history.`;

    response._tip = ['To get data from a specific year or date, use /get-by-date-range.'];
    if (limit === undefined && last_x_days === undefined) {
        response._tip.push(`No limit specified, returning ${DEFAULT_LIMITS.HISTORY} items. Use 'limit' to return a specific number of items, or 'last_x_days' to return items from a specific time range.`);
    }

    res.json(response);
});

/**
 * Get user's history by date range
 * @param {'all'|TRAKT_WATCH_TYPES} [type='all'] - Filter by type: movies, shows, seasons, episodes
 * @param {string} start_at - ISO 8601 UTC datetime for start of the time range
 * @param {string} end_at - ISO 8601 UTC datetime for end of the time range
 * @returns {Promise<any>} - The user's history in the time range
 */
router.get('/get-by-date-range', async (req, res) => {
    const type = /** @type {TRAKT_WATCH_TYPES|undefined} */ (paramParser.enum(req.query.type, ['all', ...Object.values(TRAKT_WATCH_TYPES)]));
    const startAt = paramParser.dateStrict(req.query.start_at);
    const endAt = paramParser.dateStrict(req.query.end_at);

    /** @type {Props.GetHistoryProps & Props.PaginationProps} */
    const props = {};

    props.type = type ?? 'all';
    props.limit = null; // Unlimited
    props.startAt = startAt;
    props.endAt = endAt;

    const history = await dataService.getHistory(props);

    const response = createApiResponse(history.data, history.pagination);

    const days = Math.round((endAt.getTime() - startAt.getTime()) / (1_000 * 60 * 60 * 24));
    response._info = `Includes ${days} days of history.`;

    res.json(response);
});


export default router;
