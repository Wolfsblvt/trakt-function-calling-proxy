import traktClient from '../trakt/client.js';

class DataProcessor {
    constructor() {
    }

    /**
     * Fetches and enriches the watchlist data with ratings.
     * @returns {Promise<Array>} Enriched watchlist data
     */
    async getEnrichedWatchlist() {
        const [history, ratings] = await Promise.all([
            traktClient.getHistory(),
            traktClient.getRatings(),
        ]);

        const ratingMap = new Map();
        for (const item of ratings) {
            const key = `${item.type}:${item[item.type].ids.trakt}`;
            ratingMap.set(key, item.rating);
        }

        return history.map(item => {
            const key = `${item.type}:${item[item.type].ids.trakt}`;
            return {
                ...item,
                rating: ratingMap.get(key) || null,
            };
        });
    }
}

export default DataProcessor;
