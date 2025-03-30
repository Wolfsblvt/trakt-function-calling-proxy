import express from 'express';

import dataService from '../services/data-service.js';
import { DEFAULT_LIMITS, TRAKT_WATCH_TYPES } from '../trakt/client.js';
import { createApiResponse, parseNumberParam } from '../utils.js';

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
    if (typeof req.query.type !== 'string' || !['all', ...Object.values(TRAKT_WATCH_TYPES)].includes(req.query.type)) {
        res.status(400).json({ error: 'Invalid type' });
        return;
    }

    const limit = parseNumberParam(req.query.limit);
    const last_x_days = parseNumberParam(req.query.last_x_days);

    /** @type {Props.GetHistoryProps & Props.PaginationProps} */
    const props = {};

    props.type = /** @type {'all' | TRAKT_WATCH_TYPES} */ (req.query.type ?? 'all');
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

    if (limit === undefined && last_x_days === undefined) {
        response._info = `No limit specified, returning ${DEFAULT_LIMITS.HISTORY} items. Use 'limit' to return a specific number of items, or 'last_x_days' to return items from a specific time range.`;
    }
    response._note = 'To get data from a specific year or date, use getHistoryByDateRange.';

    res.json(response);
});



export default router;
