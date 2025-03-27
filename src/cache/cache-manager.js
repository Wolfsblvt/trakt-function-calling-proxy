import storage from 'node-persist';

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
    DEFAULT: 60 * 60, // 1 hour
    [CACHE_TYPES.HISTORY]: 60 * 5,    // 5 minutes
    [CACHE_TYPES.RATINGS]: 60 * 5,     // 5 minutes
    [CACHE_TYPES.WATCHLIST]: 60 * 5,   // 5 minutes
    [CACHE_TYPES.TRENDING]: 60 * 60,    // 60 minutes
    [CACHE_TYPES.SEARCH]: 60 * 60,       // 60 minutes
});

const MEM_CACHE_CLEANUP_INTERVAL = 5 * 60 * 1_000;

/**
 * CacheManager class for handling in-memory and persistent caching
 */
class CacheManager {
    /** @type {Map<string, {value: any, expiresAt: number|undefined}>} */
    #memoryCache;

    constructor() {
        // Initialize in-memory cache using Map
        this.#memoryCache = new Map();
    }

    async init() {
        // Initialize disk-based cache using node-persist
        await storage.init({
            dir: './.cache/queries',             // Directory for disk persistence
            stringify: JSON.stringify,
            parse: JSON.parse,
            encoding: 'utf8',
            logging: false,
            ttl: DEFAULT_TTL.DEFAULT * 1_000,         // Default TTL: 1 hour (in ms)
        });
        console.log('Disk cache initialized');

        // Set up memory cache cleanup interval (every 5 minutes)
        setInterval(() => this.#cleanupMemoryCache(), MEM_CACHE_CLEANUP_INTERVAL);
    }

    /**
     * Creates a cache key based on endpoint and parameters
     * @param {string} cacheType - The type of cache (e.g., 'history', 'ratings')
     * @param {object} [params={}] - Query parameters to include in the key
     * @returns {string} - The cache key
     */
    createKey(cacheType, params = {}) {
        const sortedParams = Object.entries(params)
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
     * @returns {Promise<T|null>} - The cached item or null if not found
     */
    async get(key, useMemoryOnly = false) {
        // Try memory cache first
        const memoryItem = this.#memoryCache.get(key);
        if (memoryItem && (!memoryItem.expiresAt || Date.now() < memoryItem.expiresAt)) {
            return memoryItem.value;
        }

        // If memory-only is requested, don't check disk
        if (useMemoryOnly) {
            return null;
        }

        // Try disk cache
        const diskItem = await storage.getItem(key);
        if (diskItem !== undefined && diskItem !== null) {
            // Also store in memory for faster access next time
            await this.set(key, diskItem, { memoryOnly: true });
            return diskItem;
        }

        return null;
    }

    /**
     * Sets an item in cache
     * @param {string} key - The cache key
     * @param {any} value - The value to cache
     * @param {object} [options={}] - Cache options
     * @param {number|null} [options.ttl=null] - Time to live in seconds
     * @param {boolean} [options.memoryOnly=false] - Whether to store only in memory
     * @returns {Promise<boolean>} - Whether the operation was successful
     */
    async set(key, value, { ttl = null, memoryOnly = false } = {}) {
        // Calculate expiration time for memory cache
        const expiresAt = ttl ? Date.now() + (ttl * 1_000) : undefined;
        this.#memoryCache.set(key, { value, expiresAt });

        // Also set in disk cache unless memory-only is specified
        if (!memoryOnly) {
            await storage.setItem(key, value, { ttl: ttl ? ttl * 1_000 : undefined });
        }
        return true;
    }

    /**
     * Deletes an item from cache
     * @param {string} key - The cache key
     * @returns {Promise<boolean>} - Whether the operation was successful
     */
    async delete(key) {
        this.#memoryCache.delete(key);
        await storage.removeItem(key);
        return true;
    }

    /**
     * Checks if a key exists in cache
     * @param {string} key - The cache key
     * @param {boolean} [checkMemoryOnly=false] - Whether to check only memory cache
     * @returns {Promise<boolean>} - Whether the key exists
     */
    async has(key, checkMemoryOnly = false) {
        const memoryItem = this.#memoryCache.get(key);
        const inMemory = Boolean(memoryItem && (!memoryItem.expiresAt || Date.now() < memoryItem.expiresAt));
        if (inMemory || checkMemoryOnly) {
            return inMemory;
        }
        const diskItem = await storage.getItem(key);
        return diskItem !== undefined && diskItem !== null;
    }

    /**
     * Deletes all items of a specific cache type
     * @param {string} cacheType - The type of cache to flush
     * @returns {Promise<number>} - Number of items deleted
     */
    async flushType(cacheType) {
        let count = 0;
        const keys = await storage.keys();
        for (const key of keys) {
            if (key.startsWith(cacheType)) {
                this.#memoryCache.delete(key);
                await storage.removeItem(key);
                count++;
            }
        }
        return count;
    }

    /**
     * Flushes all caches
     * @returns {Promise<boolean>} - Whether the operation was successful
     */
    async flushAll() {
        this.#memoryCache.clear();
        await storage.clear();
        return true;
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
}

const cacheManager = new CacheManager();
await cacheManager.init();
export default cacheManager;
