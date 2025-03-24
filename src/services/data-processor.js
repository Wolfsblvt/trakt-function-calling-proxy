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
     * Private function that sets the force refresh flag for the next API call
     */
    #force() {
        cachedTraktClient.forceRefreshNextCall();
    }

    /**
     * Gets the user's watchlist enriched with ratings and watch history
     * @param {Object} [options] - Optional parameters
     * @param {string} [options.type] - Filter by type: movies, shows, seasons, episodes
     * @param {string} [options.sort='rank'] - How to sort: rank, added, released, title
     * @param {number} [options.limit] - Number of items to return
     * @param {number} [options.page=1] - Page number
     * @param {boolean} [options.forceRefresh=false] - Whether to force a refresh
     * @returns {Promise<Array>} - The enriched watchlist
     */
    async getEnrichedWatchlist({ type, sort = 'rank', limit, page = 1, forceRefresh = false } = {}) {
        // Get the watchlist
        forceRefresh && this.#force();
        const watchlist = await cachedTraktClient.getWatchlist({ type, sort, limit, page });

        // If the watchlist is empty, return it as is
        if (!watchlist || !watchlist.length) {
            return watchlist;
        }

        // Get history and ratings sequentially
        forceRefresh && this.#force();
        const history = await cachedTraktClient.getHistory({ limit: 100 });
        forceRefresh && this.#force();
        const ratings = await cachedTraktClient.getRatings();

        // Enrich the watchlist with ratings and watch history
        return dataEnricher.enrichWithRatingsAndHistory(watchlist, ratings, history);
    }

    /**
     * Gets trending items enriched with ratings and watch history
     * @param {Object} [options] - Optional parameters
     * @param {string} [options.type='movies'] - Type: movies or shows
     * @param {number} [options.limit=10] - Number of items to return
     * @param {number} [options.page=1] - Page number
     * @param {boolean} [options.forceRefresh=false] - Whether to force a refresh
     * @returns {Promise<Array>} - The enriched trending items
     */
    async getEnrichedTrending({ type = 'movies', limit = 10, page = 1, forceRefresh = false } = {}) {
        // Get trending
        forceRefresh && this.#force();
        const trending = await cachedTraktClient.getTrending({ type, limit, page });

        // Get ratings and history sequentially
        forceRefresh && this.#force();
        const ratings = await cachedTraktClient.getRatings();
        forceRefresh && this.#force();
        const history = await cachedTraktClient.getHistory({ limit: 100 });

        // Enrich trending items with ratings and watch history
        return dataEnricher.enrichWithRatingsAndHistory(trending.map(item => ({ ...item, type })), ratings, history);
    }

    /**
     * Gets the user's watch history enriched with ratings
     * @param {Props.GetHistoryProps & AllowForceRefresh} [options={}] - Optional parameters
     * @returns {Promise<(Trakt.HistoryItem & TraktItemBase & EnrichedWithRating)[]>} - The enriched history
     */
    async getEnrichedHistory({ type = null, itemId = null, startAt, endAt, limit = DEFAULT_PAGE_SIZES.HISTORY, page = 1, forceRefresh = false } = {}) {
        // Get the history
        forceRefresh && this.#force();
        const history = await cachedTraktClient.getHistory({ type, itemId, startAt, endAt, limit, page });

        // If the history is empty, return an empty array
        if (!history || !history.length) {
            return [];
        }

        // Get ratings
        forceRefresh && this.#force();
        const ratings = await cachedTraktClient.getRatings();

        // Enrich history with ratings
        return dataEnricher.enrichWithRatings(history, ratings);
    }

    /**
     * Searches for items and enriches them with ratings and watch history
     * @param {Object} options - Search parameters
     * @param {string} options.query - Search query
     * @param {string} [options.type] - Filter by type: movie, show, episode, person, list
     * @param {number} [options.limit=10] - Number of items to return
     * @param {number} [options.page=1] - Page number
     * @param {boolean} [options.forceRefresh=false] - Whether to force a refresh
     * @returns {Promise<Array>} - The enriched search results
     */
    async getEnrichedSearch({ query, type, limit = 10, page = 1, forceRefresh = false }) {
        // Get search results
        forceRefresh && this.#force();
        const searchResults = await cachedTraktClient.search({ query, type, limit, page });

        // Get ratings and history sequentially
        forceRefresh && this.#force();
        const ratings = await cachedTraktClient.getRatings();
        forceRefresh && this.#force();
        const history = await cachedTraktClient.getHistory({ limit: 100 });

        // Enrich search results with ratings and watch history
        return dataEnricher.enrichWithRatingsAndHistory(searchResults, ratings, history);
    }

    /**
     * Gets the user's ratings
     * @param {Props.GetRatingsProps & AllowForceRefresh} [options={}] - Optional parameters
     * @returns {Promise<Array>} - The ratings
     */
    async getRatings({ type, rating, limit, page = 1, forceRefresh = false } = {}) {
        forceRefresh && this.#force();
        return cachedTraktClient.getRatings({ type, rating, limit, page });
    }

    /**
     * Gets trending items with additional information
     * @param {Object} [options] - Optional parameters
     * @param {boolean} [options.forceRefresh=false] - Whether to force a refresh
     * @returns {Promise<Object>} - Object containing trending movies and shows with history and ratings
     */
    async getFullTrending({ forceRefresh = false } = {}) {
        // Get trending movies and shows
        let trendingMovies, trendingShows;
        if (forceRefresh) {
            this.#force();
            trendingMovies = await cachedTraktClient.getTrending({ type: 'movies' });
            trendingShows = await cachedTraktClient.getTrending({ type: 'shows' });
        } else {
            trendingMovies = await cachedTraktClient.getTrending({ type: 'movies' });
            trendingShows = await cachedTraktClient.getTrending({ type: 'shows' });
        }

        // Get history and ratings concurrently
        const [history, ratings] = await Promise.all([
            cachedTraktClient.getHistory({ limit: 100 }),
            cachedTraktClient.getRatings(),
        ]);

        // Enrich trending items with ratings and watch history
        const enrichedMovies = dataEnricher.enrichWithRatingsAndHistory(trendingMovies.map(item => ({ ...item, type: 'movies' })), ratings, history);
        const enrichedShows = dataEnricher.enrichWithRatingsAndHistory(trendingShows.map(item => ({ ...item, type: 'shows' })), ratings, history);

        return {
            movies: enrichedMovies,
            shows: enrichedShows,
        };
    }
}

const dataProcessor = new DataProcessor();
export default dataProcessor;
