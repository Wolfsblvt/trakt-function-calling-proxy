import traktClient from '../trakt/client.js';
import cacheManager, { CACHE_TYPES, DEFAULT_TTL } from './cache-manager.js';

/**
 * @typedef {object} WithForceRefresh
 * @property {boolean} [forceRefresh=false] - Whether to force a refresh from the API
 */

/**
 * @typedef {object} WithCacheFlag
 * @property {boolean} [_cached] - Whether the data was cached
 */

/**
 * CachedTraktClient class that wraps TraktClient and adds caching capabilities
 * using a proxy pattern to avoid duplicating all methods
 */
class CachedTraktClient {
    /** @type {object} The original Trakt client */
    #traktClient;

    /** @type {boolean} */
    #forceRefresh = false;

    /**
     * Creates a new CachedTraktClient instance
     * @param {object} client - The Trakt client to wrap
     */
    constructor(client) {
        this.#traktClient = client;

        // Create a proxy to intercept method calls and add caching
        return new Proxy(this, {
            get: (target, prop) => {
                // If the property exists on this object, return it
                if (prop in target) {
                    return target[prop];
                }

                // If the property is a function on the Trakt client, wrap it with caching
                if (typeof this.#traktClient[prop] === 'function') {
                    return this.#createCachedMethod(String(prop));
                }

                // Otherwise, return the property from the Trakt client
                return this.#traktClient[prop];
            },
        });
    }

    /**
     * Sets the force refresh flag for the next API call
     */
    forceRefreshNextCall() {
        this.#forceRefresh = true;
    }

    /**
     * Flush a specific type of cache
     * @param {CACHE_TYPES} cacheType - Type of cache to flush
     * @returns {Promise<number>} - Number of items deleted
     */
    async flushCache(cacheType) {
        return await cacheManager.flushType(cacheType);
    }

    /**
     * Flush all caches
     * @returns {Promise<boolean>} - Whether the operation was successful
     */
    async flushAllCaches() {
        return await cacheManager.flushAll();
    }

    /**
     * Creates a cached version of a Trakt client method
     * @param {string} methodName - The name of the method to cache
     * @returns {function} A cached version of the method
     */
    #createCachedMethod(methodName) {
        // Determine the cache type based on the method name
        const methodNameType = methodName.replace(/^get/i, '').toLowerCase();
        const cacheType = Object.values(CACHE_TYPES).find(type => methodNameType.startsWith(type.toLowerCase()))
            || methodNameType;

        // Return a function that wraps the original method with caching
        return async (...args) => {
            const forceRefresh = args?.[0]?.forceRefresh ?? this.#forceRefresh;

            // Reset the context flag after this call
            if (this.#forceRefresh) {
                this.#forceRefresh = false;
            }

            return await this.#cachedRequest(
                cacheType,
                (/** @type {any} */ p) => this.#traktClient[methodName](...p),
                args,
                { forceRefresh },
            );
        };
    }

    /**
     * Makes a cached API request or fetches fresh data
     * @template T
     * @param {string} cacheType - Type of cache (e.g., 'history', 'ratings')
     * @param {function} fetchFunction - Function to call if cache miss
     * @param {object} [params={}] - Parameters to pass to the fetch function
     * @param {object} [options={}] - Cache options
     * @param {boolean} [options.forceRefresh=false] - Whether to force a refresh
     * @param {number} [options.ttl] - Custom TTL in seconds
     * @returns {Promise<T>} - The cached or fresh data
     */
    async #cachedRequest(cacheType, fetchFunction, params = {}, { forceRefresh = false, ttl } = {}) {
        const cacheKey = cacheManager.createKey(cacheType, params);
        const effectiveTtl = ttl || DEFAULT_TTL[cacheType] || DEFAULT_TTL.DEFAULT;

        // Return cached data if available and not forcing refresh
        if (!forceRefresh) {
            const cachedData = await cacheManager.get(cacheKey);
            if (cachedData) {
                cachedData._cached = true;
                return cachedData;
            }
        }

        // Fetch fresh data
        try {
            const freshData = await fetchFunction(params);
            // Cache the fresh data
            await cacheManager.set(cacheKey, freshData, { ttl: effectiveTtl, useFuzzyTtl: true });
            return freshData;
        } catch (error) {
            // If forcing refresh and it fails, try to return stale data
            if (forceRefresh) {
                const staleData = await cacheManager.get(cacheKey);
                if (staleData) {
                    console.warn(`Failed to refresh ${cacheType} data, using stale data:`, error.message);
                    staleData._cached = true;
                    return staleData;
                }
            }
            throw error;
        }
    }
}

// Create a new instance of CachedTraktClient with the traktClient
const cachedTraktClient = new CachedTraktClient(traktClient);

/**
 * @typedef {import('../trakt/client.js').default & import('./cached-trakt-client.js').default} CachedTraktClientInstance
 */
/** @type {CachedTraktClientInstance} */
// @ts-expect-error - This proxy has all the original functions of TraktClient wrapped, so we can safely add them to the jsdoc
export default cachedTraktClient;
