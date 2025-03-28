import cachedTraktClient from '../cache/cached-trakt-client.js';
import { DEFAULT_PAGE_SIZES } from '../trakt/client.js';

/** @import * as Trakt from '../trakt/trakt-types.js' */
/** @import * as Props from '../trakt/props-types.js' */

/** @typedef {import('../trakt/client.js').TRAKT_WATCH_TYPES} TRAKT_WATCH_TYPES */
/** @typedef {import('../cache/cached-trakt-client.js').WithForceRefresh} AllowForceRefresh */

/**
 * DataProcessor class for processing and enriching Trakt data
 */
class DataProcessor {
    /**
     * Gets the user's ratings
     * @param {Props.GetRatingsProps & Props.PaginationProps & AllowForceRefresh} [options={}] - Optional parameters
     * @returns {Promise<{items: Trakt.RatingItem[], pagination: Trakt.Pagination?}>} - The ratings with pagination info
     */
    async getRatings({ type, rating, limit, page = 1, forceRefresh = false } = {}) {
    // Always fetch all ratings and filter client-side for better caching
        forceRefresh && this.#force();
        let ratings = await cachedTraktClient.getRatings();

        // Apply filters client-side if we have a full dataset
        if (type) {
            ratings = ratings.filter(item => item.type === type);
        }
        if (rating) {
            ratings = ratings.filter(item => Array.isArray(rating) ? rating.includes(item.rating) : item.rating === rating);
        }
        // Apply pagination client-side if needed
        const pageSize = limit || DEFAULT_PAGE_SIZES.RATINGS;
        let pagination = null;
        if (pageSize && (limit || page > 1)) {
            const startIndex = (page - 1) * pageSize;
            ratings = ratings.slice(startIndex, startIndex + pageSize);
            // Update pagination info for client-side pagination
            const totalItems = ratings.length;
            pagination = {
                itemCount: totalItems,
                pageCount: Math.ceil(totalItems / pageSize),
                limit: pageSize,
                page,
            };
        }
        return { items: ratings, pagination };
    }

    /**
     * Private function that sets the force refresh flag for the next API call
     */
    #force() {
        cachedTraktClient.forceRefreshNextCall();
    }
}

const dataProcessor = new DataProcessor();
export default dataProcessor;
