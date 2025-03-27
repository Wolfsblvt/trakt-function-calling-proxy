import cachedTraktClient from '../cache/cached-trakt-client.js';
import { DEFAULT_PAGE_SIZES } from '../trakt/client.js';
import dataEnricher from './enrichers/data-enricher.js';

/** @import * as Trakt from '../trakt/trakt-types.js' */
/** @import * as Props from '../trakt/props-types.js' */

/** @typedef {import('../trakt/client.js').TRAKT_WATCH_TYPES} TRAKT_WATCH_TYPES */
/** @typedef {import('../cache/cached-trakt-client.js').WithForceRefresh} AllowForceRefresh */

/**
 * DataProcessor class for processing and enriching Trakt data
 */
class DataProcessor {
    /**
     * Gets the user's watchlist enriched with ratings and watch history
     * @param {object} [options] - Optional parameters
     * @param {string} [options.type] - Filter by type: movies, shows, seasons, episodes
     * @param {string} [options.sort='rank'] - How to sort: rank, added, released, title
     * @param {number} [options.limit] - Number of items to return
     * @param {number} [options.page=1] - Page number
     * @param {boolean} [options.forceRefresh=false] - Whether to force a refresh
     * @param {boolean} [options.autoPaginate=true] - Whether to automatically fetch all pages
     * @param {number|null} [options.maxPages=null] - Maximum number of pages to fetch
     * @returns {Promise<{items: Array, pagination: {itemCount: number, pageCount: number, limit: number}}>} - The enriched watchlist with pagination info
     */
    async getEnrichedWatchlist({ type, sort = 'rank', limit, page = 1, forceRefresh = false, autoPaginate = true, maxPages = null } = {}) {
        // Get the watchlist
        forceRefresh && this.#force();
        const watchlistResponse = await cachedTraktClient.getWatchlist({
            type,
            sort,
            limit,
            page,
            autoPaginate,
            maxPages,
        });

        const { data: watchlist, pagination } = watchlistResponse;

        // If the watchlist is empty, return it as is with pagination info
        if (!watchlist?.length) {
            return { items: [], pagination };
        }

        // Get history and ratings sequentially
        forceRefresh && this.#force();
        const historyResponse = await cachedTraktClient.getHistory({ limit: 100, autoPaginate: true });
        forceRefresh && this.#force();
        const ratingsResponse = await cachedTraktClient.getRatings({ autoPaginate: true });

        // Enrich the watchlist with ratings and watch history
        const enrichedItems = dataEnricher.enrichWithRatingsAndHistory(
            watchlist,
            ratingsResponse.data,
            historyResponse.data,
        );

        return { items: enrichedItems, pagination };
    }

    /**
     * Gets trending items enriched with ratings and watch history
     * @param {object} [options] - Optional parameters
     * @param {string} [options.type='movies'] - Type: movies or shows
     * @param {number} [options.limit=10] - Number of items to return
     * @param {number} [options.page=1] - Page number
     * @param {boolean} [options.forceRefresh=false] - Whether to force a refresh
     * @param {boolean} [options.autoPaginate=true] - Whether to automatically fetch all pages
     * @param {number|null} [options.maxPages=null] - Maximum number of pages to fetch
     * @returns {Promise<{items: Array, pagination: {itemCount: number, pageCount: number, limit: number}}>} - The enriched trending items with pagination info
     */
    async getEnrichedTrending({ type = 'movies', limit = 10, page = 1, forceRefresh = false, autoPaginate = true, maxPages = null } = {}) {
        // Get trending
        forceRefresh && this.#force();
        const trendingResponse = await cachedTraktClient.getTrending({
            type,
            limit,
            page,
            autoPaginate,
            maxPages,
        });

        const { data: trending, pagination } = trendingResponse;

        // Get ratings and history sequentially
        forceRefresh && this.#force();
        const ratingsResponse = await cachedTraktClient.getRatings({ autoPaginate: true });
        forceRefresh && this.#force();
        const historyResponse = await cachedTraktClient.getHistory({ limit: 100, autoPaginate: true });

        // Enrich trending items with ratings and watch history
        const enrichedItems = dataEnricher.enrichWithRatingsAndHistory(
            trending.map(item => ({ ...item, type })),
            ratingsResponse.data,
            historyResponse.data,
        );

        return { items: enrichedItems, pagination };
    }

    /**
     * Gets the user's watch history enriched with ratings
     * @param {Props.GetHistoryProps & Props.PaginationProps & AllowForceRefresh} [options={}] - Optional parameters
     * @returns {Promise<{items: Array, pagination: {itemCount: number, pageCount: number, limit: number}}>} - The enriched history with pagination info
     */
    async getEnrichedHistory({ type = null, itemId = null, startAt, endAt, limit = DEFAULT_PAGE_SIZES.HISTORY, page = 1, forceRefresh = false, autoPaginate = true, maxPages = null } = {}) {
    // Get the history - always fetch all history and filter client-side for better caching
        forceRefresh && this.#force();
        const historyResponse = await cachedTraktClient.getHistory({
            // If specific item is requested, use the provided filters
            ...(itemId ? { type, itemId, startAt, endAt, limit, page } : {}),
            autoPaginate,
            maxPages,
        });

        const { data: history, pagination } = historyResponse;

        // If the history is empty, return an empty array with pagination info
        if (!history?.length) {
            return { items: [], pagination };
        }

        // Get ratings
        forceRefresh && this.#force();
        const ratingsResponse = await cachedTraktClient.getRatings({ autoPaginate: true });

        // Enrich history with ratings
        let enrichedItems = dataEnricher.enrichWithRatings(history, ratingsResponse.data);

        // Apply filters client-side if we have a full dataset and no specific item was requested
        if (!itemId && autoPaginate) {
            // Filter by type if specified
            if (type) {
                enrichedItems = enrichedItems.filter(item => item.type === type);
            }
            // Filter by date range if specified
            if (startAt) {
                const startDate = startAt instanceof Date ? startAt : new Date(startAt);
                enrichedItems = enrichedItems.filter(item => new Date(item.watched_at) >= startDate);
            }
            if (endAt) {
                const endDate = endAt instanceof Date ? endAt : new Date(endAt);
                enrichedItems = enrichedItems.filter(item => new Date(item.watched_at) <= endDate);
            }
            // Apply pagination client-side if needed
            if (limit || page > 1) {
                const pageSize = limit || DEFAULT_PAGE_SIZES.HISTORY;
                const startIndex = (page - 1) * pageSize;
                enrichedItems = enrichedItems.slice(startIndex, startIndex + pageSize);
                // Update pagination info for client-side pagination
                const totalItems = enrichedItems.length;
                pagination.itemCount = totalItems;
                pagination.pageCount = Math.ceil(totalItems / (pageSize || 1));
                pagination.limit = pageSize;
            }
        }

        return { items: enrichedItems, pagination };
    }

    /**
     * Searches for items and enriches them with ratings and watch history
     * @param {object} options - Search parameters
     * @param {string} options.query - Search query
     * @param {string} [options.type] - Filter by type: movie, show, episode, person, list
     * @param {number} [options.limit=10] - Number of items to return
     * @param {number} [options.page=1] - Page number
     * @param {boolean} [options.forceRefresh=false] - Whether to force a refresh
     * @param {boolean} [options.autoPaginate=true] - Whether to automatically fetch all pages
     * @param {number|null} [options.maxPages=null] - Maximum number of pages to fetch
     * @returns {Promise<{items: Array, pagination: {itemCount: number, pageCount: number, limit: number}}>} - The enriched search results with pagination info
     */
    async getEnrichedSearch({ query, type, limit = 10, page = 1, forceRefresh = false, autoPaginate = true, maxPages = null }) {
        // Get search results
        forceRefresh && this.#force();
        const searchResponse = await cachedTraktClient.search({
            query,
            type,
            limit,
            page,
            autoPaginate,
            maxPages,
        });

        const { data: searchResults, pagination } = searchResponse;

        // Get ratings and history sequentially
        forceRefresh && this.#force();
        const ratingsResponse = await cachedTraktClient.getRatings({ autoPaginate: true });
        forceRefresh && this.#force();
        const historyResponse = await cachedTraktClient.getHistory({ limit: 100, autoPaginate: true });

        // Enrich search results with ratings and watch history
        const enrichedItems = dataEnricher.enrichWithRatingsAndHistory(
            searchResults,
            ratingsResponse.data,
            historyResponse.data,
        );

        return { items: enrichedItems, pagination };
    }

    /**
     * Gets the user's ratings
     * @param {Props.GetRatingsProps & Props.PaginationProps & AllowForceRefresh} [options={}] - Optional parameters
     * @returns {Promise<{items: Trakt.RatingItem[], pagination: Trakt.Pagination}>} - The ratings with pagination info
     */
    async getRatings({ type, rating, limit, page = 1, forceRefresh = false, autoPaginate = true, maxPages = null } = {}) {
    // Always fetch all ratings and filter client-side for better caching
        forceRefresh && this.#force();
        const response = await cachedTraktClient.getRatings({
            autoPaginate,
            maxPages,
        });

        let { data: ratings, pagination } = response;
        // Apply filters client-side if we have a full dataset
        if (autoPaginate) {
            if (type) {
                ratings = ratings.filter(item => item.type === type);
            }
            if (rating) {
                ratings = ratings.filter(item => item.rating === rating);
            }
            // Apply pagination client-side if needed
            const pageSize = limit || DEFAULT_PAGE_SIZES.RATINGS;
            if (pageSize && (limit || page > 1)) {
                const startIndex = (page - 1) * pageSize;
                ratings = ratings.slice(startIndex, startIndex + pageSize);
                // Update pagination info for client-side pagination
                const totalItems = ratings.length;
                pagination.itemCount = totalItems;
                pagination.pageCount = Math.ceil(totalItems / pageSize);
                pagination.limit = pageSize;
            }
        }
        return { items: ratings, pagination };
    }

    /**
     * Gets trending items with additional information
     * @param {object} [options] - Optional parameters
     * @param {boolean} [options.forceRefresh=false] - Whether to force a refresh
     * @param {boolean} [options.autoPaginate=true] - Whether to automatically fetch all pages
     * @param {number|null} [options.maxPages=null] - Maximum number of pages to fetch
     * @returns {Promise<{movies: {items: Array, pagination: object}, shows: {items: Array, pagination: object}}>} - Object containing trending movies and shows with history and ratings
     */
    async getFullTrending({ forceRefresh = false, autoPaginate = true, maxPages = null } = {}) {
        // Get trending movies and shows
        let moviesResponse, showsResponse;
        if (forceRefresh) {
            this.#force();
            moviesResponse = await cachedTraktClient.getTrending({
                type: 'movies',
                autoPaginate,
                maxPages,
            });
            this.#force();
            showsResponse = await cachedTraktClient.getTrending({
                type: 'shows',
                autoPaginate,
                maxPages,
            });
        } else {
            moviesResponse = await cachedTraktClient.getTrending({
                type: 'movies',
                autoPaginate,
                maxPages,
            });
            showsResponse = await cachedTraktClient.getTrending({
                type: 'shows',
                autoPaginate,
                maxPages,
            });
        }

        const { data: trendingMovies, pagination: moviesPagination } = moviesResponse;
        const { data: trendingShows, pagination: showsPagination } = showsResponse;

        // Get history and ratings concurrently
        const [historyResponse, ratingsResponse] = await Promise.all([
            cachedTraktClient.getHistory({ limit: 100, autoPaginate: true }),
            cachedTraktClient.getRatings({ autoPaginate: true }),
        ]);

        const { data: history } = historyResponse;
        const { data: ratings } = ratingsResponse;

        // Enrich trending items with ratings and watch history
        const enrichedMovies = dataEnricher.enrichWithRatingsAndHistory(
            trendingMovies.map(item => ({ ...item, type: 'movies' })),
            ratings,
            history,
        );
        const enrichedShows = dataEnricher.enrichWithRatingsAndHistory(
            trendingShows.map(item => ({ ...item, type: 'shows' })),
            ratings,
            history,
        );

        return {
            movies: { items: enrichedMovies, pagination: moviesPagination },
            shows: { items: enrichedShows, pagination: showsPagination },
        };
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
