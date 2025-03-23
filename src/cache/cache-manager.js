import NodeCache from 'node-cache';

/**
 * Cache types enum
 * @readonly
 * @enum {string}
 */
export const CACHE_TYPES = Object.freeze({
    HISTORY: 'history',
    RATINGS: 'ratings',
    WATCHLIST: 'watchlist',
    TRENDING: 'trending',
    SEARCH: 'search',
});

/**
 * Default TTL values in seconds for different cache types
 * @readonly
 * @enum {number}
 */
export const DEFAULT_TTL = Object.freeze({
    [CACHE_TYPES.HISTORY]: 60 * 5,    // 5 minutes
    [CACHE_TYPES.RATINGS]: 60 * 10, // 10 minutes
    [CACHE_TYPES.WATCHLIST]: 60 * 15, // 15 minutes
    [CACHE_TYPES.TRENDING]: 60 * 30, // 30 minutes
    [CACHE_TYPES.SEARCH]: 60 * 5, // 5 minutes
});

/**
 * @typedef {Object} CacheItem
 * @property {*} value - The cached value
 * @property {number|undefined} expiresAt - Timestamp when the item expires (undefined means no expiration)
 */

/**
 * @typedef {Object} CacheOptions
 * @property {number?} [ttl=null] - Time to live in seconds
 * @property {boolean} [memoryOnly=false] - Whether to store only in memory
 */

/**
 * CacheManager class for handling in-memory and persistent caching
 */
class CacheManager {
    /** @type {Map<string, CacheItem>} */
    #memoryCache;
    /** @type {NodeCache} */
    #diskCache;

    constructor() {
        // Initialize in-memory cache using Map
        this.#memoryCache = new Map();

        // Initialize disk-based cache
        this.#diskCache = new NodeCache({
            stdTTL: 60 * 60, // Default TTL: 1 hour
            checkperiod: 60, // Check for expired keys every 60 seconds
            useClones: false, // Don't clone objects when getting/setting
        });

        // Set up memory cache cleanup interval (every 5 minutes)
        setInterval(() => this.#cleanupMemoryCache(), 5 * 60 * 1000);
    }

    /**
     * Cleans up expired items from memory cache
     */
    #cleanupMemoryCache() {
        const now = Date.now();
        for (const [key, { expiresAt }] of this.#memoryCache.entries()) {
            if (expiresAt && now >= expiresAt) {
                this.#memoryCache.delete(key);
            }
        }
    }

    /**
     * Creates a cache key based on endpoint and parameters
     * @param {string} cacheType - The type of cache (e.g., 'history', 'ratings')
     * @param {Object} [params={}] - Query parameters to include in the key
     * @returns {string} - The cache key
     */
    createKey(cacheType, params = {}) {
        const sortedParams = Object.entries(params || {})
            .filter(([_, value]) => value !== undefined && value !== null)
            .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
            .map(([key, value]) => `${key}=${value}`)
            .join('&');

        return sortedParams ? `${cacheType}?${sortedParams}` : cacheType;
    }

    /**
     * Gets an item from cache
     * @template T
     * @param {string} key - The cache key
     * @param {boolean} [useMemoryOnly=false] - Whether to use only memory cache
     * @returns {T?} - The cached item or null if not found
     */
    get(key, useMemoryOnly = false) {
        // Try memory cache first
        const memoryItem = this.#memoryCache.get(key);
        if (memoryItem && (!memoryItem.expiresAt || Date.now() < memoryItem.expiresAt)) {
            return memoryItem.value;
        }

        // If memory-only is requested or item not in memory, don't check disk
        if (useMemoryOnly) {
            return null;
        }

        // Try disk cache
        const diskItem = this.#diskCache.get(key);
        if (diskItem !== undefined) {
            // Also store in memory for faster access next time
            this.set(key, diskItem, { memoryOnly: true });
            return diskItem;
        }

        return null;
    }

    /**
     * Sets an item in cache
     * @param {string} key - The cache key
     * @param {any} value - The value to cache
     * @param {CacheOptions} [options={}] - Cache options
     * @returns {boolean} - Whether the operation was successful
     */
    set(key, value, { ttl = null, memoryOnly = false } = {}) {
        // Calculate expiration time for memory cache
        const expiresAt = ttl ? Date.now() + (ttl * 1000) : undefined;

        // Set in memory cache
        this.#memoryCache.set(key, { value, expiresAt });

        // Also set in disk cache unless memory-only is specified
        if (!memoryOnly) {
            // The diskCache.set returns true/false, so we can safely return it directly
            // Make sure we always return a boolean value
            return Boolean(this.#diskCache.set(key, value, ttl || 0));
        }

        return true;
    }

    /**
     * Deletes an item from cache
     * @param {string} key - The cache key
     * @returns {boolean} - Whether the operation was successful
     */
    delete(key) {
        this.#memoryCache.delete(key);
        return Boolean(this.#diskCache.del(key) > 0);
    }

    /**
     * Checks if a key exists in cache
     * @param {string} key - The cache key
     * @param {boolean} [checkMemoryOnly=false] - Whether to check only memory cache
     * @returns {boolean} - Whether the key exists
     */
    has(key, checkMemoryOnly = false) {
        const memoryItem = this.#memoryCache.get(key);
        const inMemory = Boolean(memoryItem && (!memoryItem.expiresAt || Date.now() < memoryItem.expiresAt));

        if (inMemory || checkMemoryOnly) {
            return inMemory;
        }
        return Boolean(this.#diskCache.has(key));
    }

    /**
     * Deletes all items of a specific cache type
     * @param {CACHE_TYPES} cacheType - The type of cache to flush
     * @returns {number} - Number of items deleted
     */
    flushType(cacheType) {
        let count = 0;

        // Get all keys from disk cache
        const diskKeys = this.#diskCache.keys();

        // Filter keys by cache type and delete them
        const keysToDelete = diskKeys.filter(key => key.startsWith(cacheType));
        keysToDelete.forEach(key => {
            this.#memoryCache.delete(key);
            this.#diskCache.del(key);
            count++;
        });

        return count;
    }

    /**
     * Flushes all caches
     * @returns {boolean} - Whether the operation was successful
     */
    flushAll() {
        this.#memoryCache.clear();
        this.#diskCache.flushAll();
        return true;
    }
}

const cacheManager = new CacheManager();
export default cacheManager;
