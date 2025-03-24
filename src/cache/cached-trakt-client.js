import traktClient from '../trakt/client.js';
import cacheManager, { CACHE_TYPES, DEFAULT_TTL } from './cache-manager.js';

/**
 * @typedef {object} WithForceRefresh
 * @property {boolean} [forceRefresh=false] - Whether to force a refresh from the API
 */

/**
 * CachedTraktClient class that wraps TraktClient and adds caching capabilities
 * using a proxy pattern to avoid duplicating all methods
 */
class CachedTraktClient {
    /** @type {Object} The original Trakt client */
    #traktClient;

    /** @type {boolean} */
    #forceRefresh = false;

    /**
     * Creates a new CachedTraktClient instance
     * @param {Object} client - The Trakt client to wrap
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
     * Creates a cached version of a Trakt client method
     * @param {string} methodName - The name of the method to cache
     * @returns {Function} A cached version of the method
     */
    #createCachedMethod(methodName) {
        // Determine the cache type based on the method name
        const cacheType = Object.values(CACHE_TYPES).find(type => methodName.toLowerCase().includes(type.toLowerCase())) || methodName;

        // Return a function that wraps the original method with caching
        return async (params = {}) => {
            const { forceRefresh: localForceRefresh, ...apiParams } = params;
            const forceRefresh = this.#forceRefresh || localForceRefresh;

            // Reset the context flag after this call
            if (this.#forceRefresh) {
                this.#forceRefresh = false;
            }

            return this.#cachedRequest(
                cacheType,
                (/** @type {any} */ p) => this.#traktClient[methodName](p),
                apiParams,
                { forceRefresh },
            );
        };
    }

    /**
     * Makes a cached API request or fetches fresh data
     * @template T
     * @param {string} cacheType - Type of cache (e.g., 'history', 'ratings')
     * @param {Function} fetchFunction - Function to call if cache miss
     * @param {Object} [params={}] - Parameters to pass to the fetch function
     * @param {Object} [options={}] - Cache options
     * @param {boolean} [options.forceRefresh=false] - Whether to force a refresh
     * @param {number} [options.ttl] - Custom TTL in seconds
     * @returns {Promise<T>} - The cached or fresh data
     */
    async #cachedRequest(cacheType, fetchFunction, params = {}, { forceRefresh = false, ttl } = {}) {
        const cacheKey = cacheManager.createKey(cacheType, params);
        const effectiveTtl = ttl || DEFAULT_TTL[cacheType] || 300; // Default to 5 minutes if not specified

        // Return cached data if available and not forcing refresh
        if (!forceRefresh) {
            const cachedData = cacheManager.get(cacheKey);
            if (cachedData) {
                return cachedData;
            }
        }

        // Fetch fresh data
        try {
            const freshData = await fetchFunction(params);
            // Cache the fresh data
            cacheManager.set(cacheKey, freshData, { ttl: effectiveTtl });
            return freshData;
        } catch (error) {
            // If forcing refresh and it fails, try to return stale data
            if (forceRefresh) {
                const staleData = cacheManager.get(cacheKey);
                if (staleData) {
                    console.warn(`Failed to refresh ${cacheType} data, using stale data:`, error.message);
                    return staleData;
                }
            }
            throw error;
        }
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
     * @returns {number} - Number of items deleted
     */
    flushCache(cacheType) {
        return cacheManager.flushType(cacheType);
    }

    /**
     * Flush all caches
     * @returns {boolean} - Whether the operation was successful
     */
    flushAllCaches() {
        return cacheManager.flushAll();
    }
}

// Create a new instance of CachedTraktClient with the traktClient
const cachedTraktClient = new CachedTraktClient(traktClient);

/**
 * @typedef {import('../trakt/client.js').default & import('./cached-trakt-client.js').default} CachedTraktClientInstance
 */
/** @type {CachedTraktClientInstance} */
// @ts-ignore - This proxy has all the original functions of TraktClient wrapped, so we can safely add them to the jsdoc
export default cachedTraktClient;
