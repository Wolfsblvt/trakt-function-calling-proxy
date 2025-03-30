import cachedTraktClient from '../cache/cached-trakt-client.js';
import { DEFAULT_LIMITS } from '../trakt/client.js';
import transformerService from './transformer-service.js';

/** @import * as Trakt from '../trakt/types/trakt-types.js' */
/** @import * as Props from '../trakt/types/props-types.js' */
/** @import * as Enriched from '../trakt/types/enriched-types.js' */

/** @typedef {import('../trakt/client.js').TRAKT_WATCH_TYPES} TRAKT_WATCH_TYPES */
/** @typedef {import('../cache/cached-trakt-client.js').WithForceRefresh} AllowForceRefresh */

/**
 * DataService class for handling data fetching, caching, and enrichment
 */
class DataService {

    /**
     * Get the user's watch history (paginated with auto-pagination support)
     * @param {Props.GetHistoryProps & Props.PaginationProps} [options={}] - Optional parameters
     * @returns {Promise<{data: Enriched.EnrichedHistoryItem[], pagination: Trakt.Pagination}>} - The history with pagination info
     */
    async getHistory({ type = 'all', startAt = null, endAt = null, limit = DEFAULT_LIMITS.HISTORY } = {}) {
        // Fetch history from Trakt API
        const response = await cachedTraktClient.getHistory({ type, startAt, endAt, limit });

        // If extended info is requested, enrich the history items
        const enrichedData = await transformerService.enrichHistory(response.data);
        response.data = enrichedData;

        return response;
    }
}

const dataService = new DataService();
export default dataService;
