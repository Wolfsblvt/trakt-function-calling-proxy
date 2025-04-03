import cachedTraktClient from '../cache/cached-trakt-client.js';
import { DEFAULT_LIMITS } from '../trakt/client.js';
import { itemTypeMatchesFilter } from '../utils/utils.js';
import { transformerService } from './transformer-service.js';

/** @import * as Trakt from '../trakt/types/trakt-types.js' */
/** @import * as Props from '../trakt/types/props-types.js' */
/** @import * as Enriched from '../trakt/types/enriched-types.js' */
/** @import * as Flattened from '../trakt/types/flattened-types.js' */

/** @typedef {import('../trakt/client.js').TRAKT_WATCH_TYPES} TRAKT_WATCH_TYPES */
/** @typedef {import('../cache/cached-trakt-client.js').WithForceRefresh} AllowForceRefresh */

/**
 * DataService class for handling data fetching, caching, and enrichment
 */
class DataService {

    /**
     * Get the user's watch history (paginated with auto-pagination support)
     * @param {Props.GetHistoryProps & Props.PaginationProps} [options={}] - Optional parameters
     * @returns {Promise<{data: Flattened.FlattenedHistoryItem[], pagination: Trakt.Pagination}>} - The history with pagination info
     */
    async getHistory({ type = 'all', startAt = null, endAt = null, limit = DEFAULT_LIMITS.HISTORY } = {}) {
        // Fetch history from Trakt API
        const { data: history, pagination } = await cachedTraktClient.getHistory({ type, startAt, endAt, limit });

        // Transform the history items in a more model-friendly design
        const flattenedHistory = await transformerService.history.transform(history);

        return { data: flattenedHistory, pagination };
    }

    /**
     * Get the user's ratings with filtering and sorting options
     * @param {Props.GetRatingsProps & Props.PaginationProps} [options={}] - Optional parameters
     * @returns {Promise<{data: Flattened.FlattenedRatingItem[], pagination: Trakt.Pagination}>} - The ratings with pagination info
     */
    async getRatings({ type = 'all', minRating = null, maxRating = null, limit = DEFAULT_LIMITS.RATINGS, sortBy = 'rated_at', order = 'desc', includeUnwatched = false } = {}) {
        // Fetch all ratings from Trakt API (this endpoint is not paginated)
        const ratings = await cachedTraktClient.getRatings();

        // Transform the ratings items in a more model-friendly design
        let flattenedRatings = await transformerService.ratings.transform(ratings);

        // Apply filters
        if (type !== 'all') {
            flattenedRatings = flattenedRatings.filter(item => itemTypeMatchesFilter(item.type, type));
        }
        if (minRating !== null) {
            flattenedRatings = flattenedRatings.filter(item => item.rating >= minRating);
        }
        if (maxRating !== null) {
            flattenedRatings = flattenedRatings.filter(item => item.rating <= maxRating);
        }
        if (!includeUnwatched) {
            flattenedRatings = flattenedRatings.filter(item => item.plays > 0);
        }

        // Apply sorting
        flattenedRatings.sort((a, b) => {
            const valueA = sortBy === 'rating' ? a.rating : new Date(a.rated_at).getTime();
            const valueB = sortBy === 'rating' ? b.rating : new Date(b.rated_at).getTime();

            return order === 'asc' ? valueA - valueB : valueB - valueA;
        });

        // Apply limit
        const itemCount = flattenedRatings.length;
        if (limit && flattenedRatings.length > limit) {
            flattenedRatings = flattenedRatings.slice(0, limit);
        }

        // Create a simple pagination object for consistency with other endpoints
        /** @type {Trakt.Pagination} */
        const pagination = {
            itemCount: itemCount,
            pageCount: limit ? Math.ceil(itemCount / limit) : 1,
            pageSize: limit ?? 0,
            page: 1,
        };

        return { data: flattenedRatings, pagination };
    }
}

const dataService = new DataService();
export default dataService;
