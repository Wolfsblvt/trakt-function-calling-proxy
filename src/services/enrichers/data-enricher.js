/**
 * @typedef {import('../../trakt/trakt-types.js').HistoryItem} HistoryItem
 * @typedef {import('../../trakt/trakt-types.js').RatingItem} RatingItem
 * @typedef {import('../../trakt/trakt-types.js').WatchlistItem} WatchlistItem
 * @typedef {import('../../trakt/trakt-types.js').TrendingItem} TrendingItem
 * @typedef {import('../../trakt/trakt-types.js').SearchResult} SearchResult
 */

/**
 * @typedef {Object} TraktItemBase
 * @property {string} type - The type of the item (movie, show, episode, etc.)
 * @property {Object} [movie] - Movie data if type is movie
 * @property {Object} [show] - Show data if type is show
 * @property {Object} [episode] - Episode data if type is episode
 * @property {Object} [season] - Season data if type is season
 * @property {Object} [person] - Person data if type is person
 */

/**
 * @typedef {(HistoryItem|RatingItem|WatchlistItem|TrendingItem|SearchResult) & TraktItemBase} TraktItem
 */

/**
 * @typedef {Object} EnrichedWithRating
 * @property {number|null} rating - The user's rating for the item
 */

/**
 * @typedef {Object} EnrichedWithHistory
 * @property {string|null} watched_at - When the item was watched
 * @property {string|null} action - The action taken (e.g., 'watch', 'checkin')
 */

/**
 * DataEnricher class for enriching Trakt data with additional information
 */
class DataEnricher {
    /**
     * Creates a unique key for an item based on its type and ID
     * @param {TraktItemBase} item - The item to create a key for
     * @returns {string} A unique key for the item
     */
    createItemKey(item) {
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
     * Enriches items with ratings
     * @template T
     * @param {Array<T & TraktItemBase>} items - The items to enrich
     * @param {Array<RatingItem>} ratings - The ratings to use for enrichment
     * @returns {Array<T & TraktItemBase & EnrichedWithRating>} The enriched items
     */
    enrichWithRatings(items, ratings) {
        if (!items || !items.length || !ratings || !ratings.length) {
            // @ts-ignore - We're handling the return type explicitly
            return items || [];
        }

        // Create a map of ratings by item type and ID for efficient lookup
        const ratingMap = new Map();
        for (const item of ratings) {
            const key = this.createItemKey(item);
            if (key) {
                ratingMap.set(key, item.rating);
            }
        }

        // Enrich items with ratings
        return items.map(item => {
            const key = this.createItemKey(item);
            return {
                ...item,
                rating: key ? (ratingMap.get(key) || null) : null,
            };
        });
    }

    /**
     * Enriches items with watch history
     * @template T
     * @param {Array<T & TraktItemBase>} items - The items to enrich
     * @param {Array<HistoryItem>} history - The history to use for enrichment
     * @returns {Array<T & TraktItemBase & EnrichedWithHistory>} The enriched items
     */
    enrichWithWatchHistory(items, history) {
        if (!items || !items.length || !history || !history.length) {
            // @ts-ignore - We're handling the return type explicitly
            return items || [];
        }

        // Create a map of watch history by item type and ID for efficient lookup
        const historyMap = new Map();
        for (const item of history) {
            const key = this.createItemKey(item);
            if (key) {
                // If we already have an entry for this item, we're only interested in the most recent watch
                const existing = historyMap.get(key);
                if (!existing || new Date(item.watched_at) > new Date(existing.watched_at)) {
                    historyMap.set(key, {
                        watched_at: item.watched_at,
                        action: item.action,
                    });
                }
            }
        }

        // Enrich items with watch history
        return items.map(item => {
            const key = this.createItemKey(item);
            const watchHistory = key ? historyMap.get(key) : null;
            return {
                ...item,
                watched_at: watchHistory ? watchHistory.watched_at : null,
                action: watchHistory ? watchHistory.action : null,
            };
        });
    }

    /**
     * Enriches items with both ratings and watch history
     * @template T
     * @param {Array<T & TraktItemBase>} items - The items to enrich
     * @param {Array<RatingItem>} ratings - The ratings to use for enrichment
     * @param {Array<HistoryItem>} history - The history to use for enrichment
     * @returns {Array<T & TraktItemBase & EnrichedWithRating & EnrichedWithHistory>} The enriched items
     */
    enrichWithRatingsAndHistory(items, ratings, history) {
        const withRatings = this.enrichWithRatings(items, ratings);
        return this.enrichWithWatchHistory(withRatings, history);
    }
}

const dataEnricher = new DataEnricher();
export default dataEnricher;
