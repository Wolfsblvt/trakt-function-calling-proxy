import cacheManager, { CACHE_TYPES } from '../cache/cache-manager.js';
import cachedTraktClient from '../cache/cached-trakt-client.js';
import { getItemKey } from '../trakt/trakt-utils.js';

/** @import * as Trakt from '../trakt/types/trakt-types.js' */
/** @import * as Props from '../trakt/types/props-types.js' */
/** @import * as Enriched from '../trakt/types/enriched-types.js' */

/** @typedef {import('../trakt/client.js').TRAKT_WATCH_TYPES} TRAKT_WATCH_TYPES */
/** @typedef {import('../cache/cached-trakt-client.js').WithForceRefresh} AllowForceRefresh */
/** @typedef {import('../cache/cached-trakt-client.js').WithCacheFlag} WithCacheFlag */

/** @typedef {string} IndexId */

/**
 * TransformerService class for handling data fetching, caching, and enrichment
 */
export class TransformerService {
    index;

    constructor() {
        this.index = new this.IndexedCacheStore();
    }

    /**
     * Enrich a history item
     * @param {Trakt.HistoryItem[]} history - The history items to enrich
     * @returns {Promise<Enriched.EnrichedHistoryItem[]>} - The enriched history items
     */
    async enrichHistory(history) {
        const indexed = await this.index.all();
        const enrichedHistory = history.map(item => this.enrichHistoryItem(item, indexed));
        return enrichedHistory;
    }

    /**
     * Enrich a single history item
     * @param {Trakt.HistoryItem} item - The history item to enrich
     * @param {AllIndexedCaches} indexed - The indexed caches
     * @returns {Enriched.EnrichedHistoryItem} - The enriched history item with additional fields
     */
    enrichHistoryItem(item, indexed) {
        const key = getItemKey(item);
        const { rating, watched, favorite } = indexed.get(key);
        return {
            ...item,
            rating: rating?.rating,
            plays: watched?.plays || undefined,
            last_watched_at: watched?.last_watched_at,
            rewatch_started: watched?.reset_at,
            favorite: favorite ? true : undefined,
            favorite_note: favorite?.notes || undefined,
        };
    }

    /**
     * @typedef {object} AllIndexedCaches
     * @property {Map<IndexId, Trakt.RatingItem>} ratings
     * @property {Map<IndexId, Trakt.WatchedItem>} watched
     * @property {Map<IndexId, Trakt.FavoriteItem>} favorites
     * @property {function(IndexId): { rating?: Trakt.RatingItem, watched?: Trakt.WatchedItem, favorite?: Trakt.FavoriteItem }} get
     */

    /**
     * IndexedCacheStore class for handling data fetching, caching, and enrichment
     * @private
     */
    IndexedCacheStore = class {
        /** @type {Map<IndexId, Trakt.RatingItem>|undefined} */
        #ratings;
        /** @type {Map<IndexId, Trakt.WatchedItem>|undefined} */
        #watched;
        /** @type {Map<IndexId, Trakt.FavoriteItem>|undefined} */
        #favorites;

        /**
         * Returns a promise that resolves to an object with all the different indexed caches
         * @returns {Promise<AllIndexedCaches>}
         */
        async all() {
            const [ratings, watched, favorites] = await Promise.all([
                this.ratings(),
                this.watched(),
                this.favorites(),
            ]);

            return {
                ratings,
                watched,
                favorites,
                get(key) {
                    return {
                        rating: ratings.get(key),
                        watched: watched.get(key),
                        favorite: favorites.get(key),
                    };
                },
            };
        }

        /** @returns {Promise<Map<IndexId, Trakt.RatingItem>>} */
        async ratings() {
            if (this.#ratings && (await cacheManager.has(CACHE_TYPES.RATINGS))) {
                return this.#ratings;
            }
            const ratings = await cachedTraktClient.getRatings();
            this.#ratings = new Map();
            for (const rating of ratings) {
                const key = getItemKey(rating);
                this.#ratings.set(key, rating);
            }
            console.debug(`Built ratings index with ${this.#ratings.size} items`);
            return this.#ratings;
        };

        /** @returns {Promise<Map<IndexId, Trakt.WatchedItem>>} */
        async watched() {
            if (this.#watched && (await cacheManager.has(CACHE_TYPES.WATCHED))) {
                return this.#watched;
            }
            const watched = this.#watched = new Map();

            /**
             * @param {'movies'|'shows'|'episodes'} queryType
             * @param {'movie'|'show'|'episode'} itemType
             */
            const getWatched = async (queryType, itemType) => {
                const items = await cachedTraktClient.getWatched(queryType);
                for (const item of items) {
                    const key = getItemKey(item, itemType);
                    watched.set(key, item);
                }
            };
            await Promise.all([
                getWatched('movies', 'movie'),
                getWatched('shows', 'show'),
                getWatched('episodes', 'episode'),
            ]);
            console.debug(`Built watched index with ${this.#watched.size} items`);
            return this.#watched;
        };

        /** @returns {Promise<Map<IndexId, Trakt.FavoriteItem>>} */
        async favorites() {
            if (this.#favorites && (await cacheManager.has(CACHE_TYPES.FAVORITES))) {
                return this.#favorites;
            }
            const favorites = await cachedTraktClient.getFavorites();
            this.#favorites = new Map();
            for (const favorite of favorites) {
                const key = getItemKey(favorite);
                this.#favorites.set(key, favorite);
            }
            console.debug(`Built favorites index with ${this.#favorites.size} items`);
            return this.#favorites;
        };
    };
}

const transformerService = new TransformerService();
export default transformerService;
