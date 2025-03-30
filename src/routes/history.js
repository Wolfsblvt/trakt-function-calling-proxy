import express from 'express';

import traktDataService from '../services/trakt-data-service.js';
import { DEFAULT_MAX_ITEMS, TRAKT_WATCH_TYPES } from '../trakt/client.js';
import { parseNumberParam } from '../utils.js';

/** @import * as Props from '../trakt/props-types.js' */

const router = express.Router();

/**
 * Get user's history
 * @param {'all'|TRAKT_WATCH_TYPES} [type='all'] - Filter by type: movies, shows, seasons, episodes
 * @param {number} [maxItems] - The number of items to retrieve
 * @param {number} [last_x_days] - The number of days to retrieve history from
 * @returns {Promise<any>} - The user's history
 */
router.get('/', async (req, res) => {
    const maxItems = parseNumberParam(req.query.maxItems);
    const last_x_days = parseNumberParam(req.query.last_x_days);

    /** @type {Props.GetHistoryProps & Props.PaginationProps} */
    const props = {};

    props.type = /** @type {'all' | TRAKT_WATCH_TYPES} */ (req.query.type ?? 'all');
    props.maxItems = maxItems ?? DEFAULT_MAX_ITEMS.HISTORY;

    if (!['all', ...Object.values(TRAKT_WATCH_TYPES)].includes(props.type)) {
        res.status(400).json({ error: 'Invalid type' });
        return;
    }

    if (last_x_days) {
        props.endAt = new Date();
        props.startAt = new Date(props.endAt);
        props.startAt.setDate(props.startAt.getDate() - last_x_days);
    }

    const response = await traktDataService.getHistory(props);

    const transformedResponse = {
        data: response.data,
        count: response.data.length,
        total: response.pagination.itemCount !== response.data.length ? response.pagination.itemCount : undefined,
    };

    if (!last_x_days) {
        transformedResponse._note = 'To get data from a specific year or date, use getHistoryByDateRange().';
    }

    res.json(transformedResponse);
});

export default router;
