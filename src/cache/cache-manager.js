import moment from 'moment';
import storage from 'node-persist';

import { formatNumberWithSign, getStringifiedValue } from '../utils/utils.js';

/**
 * Cache types enum
 * @readonly
 * @enum {'history'|'ratings'|'watchlist'|'trending'|'search'}
 */
export const CACHE_TYPES = Object.freeze({
    HISTORY: 'history',
    RATINGS: 'ratings',
    FAVORITES: 'favorites',
    WATCHED: 'watched',
    STATS: 'stats',
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
    DEFAULT: 60 * 60,                   // 60 minutes
    [CACHE_TYPES.HISTORY]: 60 * 5,      //  5 minutes
    [CACHE_TYPES.RATINGS]: 60 * 5,      //  5 minutes
    [CACHE_TYPES.FAVORITES]: 60 * 5,    //  5 minutes
    [CACHE_TYPES.WATCHED]: 60 * 5,      //  5 minutes
    [CACHE_TYPES.STATS]: 60 * 5,        //  5 minutes
    [CACHE_TYPES.WATCHLIST]: 60 * 60,   // 60 minutes
    [CACHE_TYPES.TRENDING]: 60 * 60,    // 60 minutes
    [CACHE_TYPES.SEARCH]: 60 * 60,      // 60 minutes
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
            ttl: DEFAULT_TTL.DEFAULT * 1_000,         // Default TTL: 60 minutes (in ms)
        });
        console.log('Disk cache initialized');

        // Set up memory cache cleanup interval (every 5 minutes)
        setInterval(() => this.#cleanupMemoryCache(), MEM_CACHE_CLEANUP_INTERVAL);
    }

    /**
     * Creates a cache key based on endpoint and parameters
     * @param {string} cacheType - The type of cache (e.g., 'history', 'ratings')
     * @param {any[]} [params=[]] - Query parameters to include in the key
     * @returns {string} - The cache key
     */
    createKey(cacheType, params = []) {
        const keyParts = [cacheType];

        for (const param of params) {
            if (typeof param === 'object' && param !== null) {
                const sortedParams = Object.entries(param)
                    .filter(([_, value]) => value !== undefined && value !== null)
                    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
                    .map(([key, value]) => `${key}=${getStringifiedValue(value)}`)
                    .join('&');
                keyParts.push(`?${sortedParams}`);
            } else {
                keyParts.push(`:${getStringifiedValue(param)}`);
            }
        }

        return keyParts.join('');
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
            // The typedocs are wrong, this is a promise function
            // eslint-disable-next-line @typescript-eslint/await-thenable
            const storeDatum = await storage.getDatum(key);
            const ttlMilliseconds = storeDatum?.ttl ? Math.max(0, storeDatum.ttl - Date.now()) : undefined;
            if (ttlMilliseconds !== 0) {
                await this.set(key, diskItem, { memoryOnly: true, ttl: ttlMilliseconds ? Math.round(ttlMilliseconds / 1_000) : ttlMilliseconds });
            }
            console.debug(`Retrieved ${key} from disk cache, restored to memory cache with TTL ${(ttlMilliseconds ? moment.duration(ttlMilliseconds, 'milliseconds').humanize() : 'undefined')}`);
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
     * @param {boolean} [options.useFuzzyTtl=false] - Whether to use fuzzy TTL (randomizing TTL by +-10% to not bulk refreshes at the exact sime time)
     * @returns {Promise<boolean>} - Whether the operation was successful
     */
    async set(key, value, { ttl = null, memoryOnly = false, useFuzzyTtl = false } = {}) {
        // Define actual TTL in seconds
        const actualTtl = useFuzzyTtl && ttl ? Math.round(ttl * (1 + (Math.random() * 0.2 - 0.1))) : ttl;

        // Calculate expiration time for memory cache
        const expiresAt = actualTtl ? Date.now() + (actualTtl * 1_000) : undefined;
        this.#memoryCache.set(key, { value, expiresAt });

        // Also set in disk cache unless memory-only is specified
        if (!memoryOnly) {
            await storage.setItem(key, value, { ttl: actualTtl ? actualTtl * 1_000 : undefined });
        };
        const fuzzyDisplay = formatNumberWithSign(useFuzzyTtl && actualTtl && ttl ? Math.round(((actualTtl / ttl) - 1) * 100) : undefined, { suffix: '%' });
        console.debug(`Set ${key} in cache with TTL ${(actualTtl ? moment.duration(actualTtl, 'seconds').humanize() : 'undefined')}${fuzzyDisplay ? ` (${fuzzyDisplay})` : ''}${memoryOnly ? ' (memory-only)' : ''}`);

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
