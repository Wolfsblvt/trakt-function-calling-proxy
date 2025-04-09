import cachedTraktClient from '../cache/cached-trakt-client.js';
import { DEFAULT_LIMITS } from '../trakt/client.js';
import { itemTypeMatchesFilter } from '../utils/utils.js';
import { transformerService } from './transformer-service.js';

/** @import * as Enriched from '../trakt/types/enriched-types.js' */
/** @import * as Flattened from '../trakt/types/flattened-types.js' */
/** @import * as Props from '../trakt/types/props-types.js' */
/** @import * as Trakt from '../trakt/types/trakt-types.js' */

/**
 * @template T
 * @typedef {object} DataServiceResponse
 * @property {T[]} data - The response data array
 * @property {Record<string,*>|undefined} [additionalData=undefined] - Additional data to include in the response
 * @property {Trakt.Pagination} pagination - Pagination metadata
 */

/**
 * DataService class for handling data fetching, caching, and enrichment
 */
class DataService {
    /**
     * Get the user's watch history (paginated with auto-pagination support)
     * @param {Props.GetHistoryProps & Props.PaginationProps} [options={}] - Optional parameters
     * @returns {Promise<DataServiceResponse<Flattened.FlattenedHistoryItem>>} - The history with pagination info
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
     * @returns {Promise<DataServiceResponse<Flattened.FlattenedRatingItem>>} - The ratings with pagination info
     */
    async getRatings({ type = 'all', minRating = null, maxRating = null, limit = DEFAULT_LIMITS.RATINGS, sortBy = 'rated_at', order = 'desc', includeUnwatched = false, includeStats = true } = {}) {
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

        const stats = await cachedTraktClient.getStats();
        const additionalData = {
            stats: includeStats ? this.#enrichRatingsStats(stats.ratings) : undefined,
        };

        return { data: flattenedRatings, pagination, additionalData };
    }

    /**
     * Enriches ratings statistics with calculated metrics
     * @param {Trakt.StatsRatings} ratingsStats - The ratings stats object from Trakt API
     * @returns {Enriched.EnrichedRatingsStats} - Enhanced statistics with additional calculated metrics
     */
    #enrichRatingsStats(ratingsStats) {
        const distribution = ratingsStats?.distribution;
        const total = ratingsStats?.total || (distribution ? Object.values(distribution).reduce((sum, count) => sum + count, 0) : 0);

        if (!distribution || total === 0) {
            return {
                _info: 'No ratings found for user',
                total: 0,
                distribution: /** @type {Trakt.StatsRatingsDistribution} */ ({}),
            };
        }

        // Calculate average rating
        let sum = 0;
        for (const [rating, count] of Object.entries(distribution)) {
            sum += Number(rating) * count;
        }
        const avg = Number((sum / total).toFixed(2));

        // Calculate median and prepare data for other calculations
        const ratings = [];
        let maxCount = 0;
        let mode = 0;
        let minRating = 10;
        let maxRating = 1;

        for (const [rating, count] of Object.entries(distribution)) {
            const ratingNum = Number(rating);

            // For median calculation
            for (let i = 0; i < count; i++) {
                ratings.push(ratingNum);
            }

            // For mode calculation
            if (count > maxCount) {
                maxCount = count;
                mode = ratingNum;
            }

            // For rating spread calculation
            if (count > 0) {
                minRating = Math.min(minRating, ratingNum);
                maxRating = Math.max(maxRating, ratingNum);
            }
        }

        ratings.sort((a, b) => a - b);
        const medianIndex = Math.floor(ratings.length / 2);
        const median = ratings.length % 2 === 0
            ? (ratings[medianIndex - 1] + ratings[medianIndex]) / 2
            : ratings[medianIndex];

        // Calculate standard deviation
        let sumSquaredDiff = 0;
        for (const [rating, count] of Object.entries(distribution)) {
            const diff = Number(rating) - avg;
            sumSquaredDiff += diff * diff * count;
        }
        const stdDev = Number(Math.sqrt(sumSquaredDiff / total).toFixed(2));

        // Calculate percentage statistics
        const highRatings8Plus = (distribution['8'] || 0) + (distribution['9'] || 0) + (distribution['10'] || 0);
        const highRatings9Plus = (distribution['9'] || 0) + (distribution['10'] || 0);
        const highRatings10 = distribution['10'] || 0;

        const percent_8_and_above = Number((highRatings8Plus / total * 100).toFixed(1));
        const percent_9_and_above = Number((highRatings9Plus / total * 100).toFixed(1));
        const percent_10s = Number((highRatings10 / total * 100).toFixed(1));

        return {
            _info: 'Global rating statistics for user',
            total,
            distribution,
            avg,
            median,
            mode,
            std_dev: stdDev,
            rating_spread: [minRating, maxRating],
            percent_8_and_above,
            percent_9_and_above,
            percent_10s,
        };
    }
}

const dataService = new DataService();
export default dataService;
