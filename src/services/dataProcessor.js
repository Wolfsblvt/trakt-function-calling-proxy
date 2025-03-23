import traktClient from '../trakt/client.js';

/**
 * DataProcessor class for fetching and enriching Trakt data
 */
class DataProcessor {
    /**
     * Fetches and enriches the watchlist data with ratings.
     * @param {Object} [options] - Optional parameters
     * @param {number} [options.limit] - Number of items to return
     * @param {number} [options.page=1] - Page number
     * @returns {Promise<Array<import('../trakt/trakt-types.js').HistoryItem & {rating: number|null}>>} Enriched watchlist data
     */
    async getEnrichedWatchlist({ limit, page = 1 } = {}) {
        const [history, ratings] = await Promise.all([
            traktClient.getHistory({ limit, page }),
            traktClient.getRatings(),
        ]);

        // Create a map of ratings by item type and ID for efficient lookup
        const ratingMap = new Map();
        for (const item of ratings) {
            const key = this.#createItemKey(item);
            ratingMap.set(key, item.rating);
        }

        // Enrich history items with ratings
        return history.map(item => {
            const key = this.#createItemKey(item);
            return {
                ...item,
                rating: ratingMap.get(key) || null,
            };
        });
    }

    /**
     * Creates a unique key for an item based on its type and ID
     * @param {import('../trakt/trakt-types.js').HistoryItem|import('../trakt/trakt-types.js').RatingItem} item - The item to create a key for
     * @returns {string} A unique key for the item
     */
    #createItemKey(item) {
        if (!item || !item.type) {
            return '';
        }

        // Get the appropriate ID based on the item type
        const itemData = item[item.type];
        if (!itemData || !itemData.ids || !itemData.ids.trakt) {
            return '';
        }

        return `${item.type}:${itemData.ids.trakt}`;
    }

    /**
     * Gets trending movies or shows with ratings if available
     * @param {Object} [options] - Optional parameters
     * @param {string} [options.type='movies'] - Type: movies or shows
     * @param {number} [options.limit=10] - Number of items to return
     * @returns {Promise<Array<import('../trakt/trakt-types.js').TrendingItem & {rating: number|null}>>} Trending items with ratings
     */
    async getTrendingWithRatings({ type = 'movies', limit = 10 } = {}) {
        const [trending, ratings] = await Promise.all([
            traktClient.getTrending({ type, limit }),
            traktClient.getRatings({ type }),
        ]);

        // Create a map of ratings by item ID
        const ratingMap = new Map();
        for (const item of ratings) {
            const itemData = item[item.type];
            if (itemData && itemData.ids && itemData.ids.trakt) {
                ratingMap.set(itemData.ids.trakt, item.rating);
            }
        }

        // Enrich trending items with ratings
        return trending.map(item => {
            const itemData = item[type === 'movies' ? 'movie' : 'show'];
            const traktId = itemData?.ids?.trakt;
            return {
                ...item,
                rating: traktId ? ratingMap.get(traktId) || null : null,
            };
        });
    }
}

const dataProcessor = new DataProcessor();
export default dataProcessor;
