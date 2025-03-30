import cachedTraktClient from '../cache/cached-trakt-client.js';
import { DEFAULT_MAX_ITEMS } from '../trakt/client.js';
import traktEnrichmentService from './trakt-enrichment-service.js';

/** @import * as Trakt from '../trakt/trakt-types.js' */
/** @import * as Props from '../trakt/props-types.js' */

/** @typedef {import('../trakt/client.js').TRAKT_WATCH_TYPES} TRAKT_WATCH_TYPES */
/** @typedef {import('../cache/cached-trakt-client.js').WithForceRefresh} AllowForceRefresh */

/**
 * TraktDataService class for handling data fetching, caching, and enrichment
 */
class TraktDataService {

    /**
     * Get the user's watch history (paginated with auto-pagination support)
     * @param {Props.GetHistoryProps & Props.PaginationProps} [options={}] - Optional parameters
     * @returns {Promise<{data: Trakt.HistoryItem[], pagination: Trakt.Pagination}>} - The history with pagination info
     */
    async getHistory({ type = 'all', startAt = null, endAt = null, maxItems = DEFAULT_MAX_ITEMS.HISTORY } = {}) {
        // Fetch history from Trakt API
        const response = await cachedTraktClient.getHistory({ type, startAt, endAt, maxItems });

        // If extended info is requested, enrich the history items
        const enrichedData = await traktEnrichmentService.enrichHistory(response.data);
        response.data = enrichedData;

        return response;
    }
}

const traktDataService = new TraktDataService();
export default traktDataService;
