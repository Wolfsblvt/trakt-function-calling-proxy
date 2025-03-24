/** @import * as Trakt from '../../trakt/trakt-types.js' */
/** @import * as Props from '../../trakt/props-types.js' */

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
     * @param {Array<Trakt.RatingItem>} ratings - The ratings to use for enrichment
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
     * @param {Array<Trakt.HistoryItem>} history - The history to use for enrichment
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
     * @param {Array<Trakt.RatingItem>} ratings - The ratings to use for enrichment
     * @param {Array<Trakt.HistoryItem>} history - The history to use for enrichment
     * @returns {Array<T & TraktItemBase & EnrichedWithRating & EnrichedWithHistory>} The enriched items
     */
    enrichWithRatingsAndHistory(items, ratings, history) {
        const withRatings = this.enrichWithRatings(items, ratings);
        return this.enrichWithWatchHistory(withRatings, history);
    }
}

const dataEnricher = new DataEnricher();
export default dataEnricher;
