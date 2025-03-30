import fetch from 'node-fetch';

import { config, saveConfig } from '../config.js';
import { parseJson } from '../utils.js';

/** @import * as Trakt from './types/trakt-types.js' */
/** @import * as Props from './types/props-types.js' */

const TRAKT_API_URL = 'https://api.trakt.tv';
const TRAKT_API_VERSION = '2';

/**
 * Enum for watched types
 * @enum {'movies'|'shows'|'seasons'|'episodes'}
 */
export const TRAKT_WATCH_TYPES = Object.freeze({
    MOVIES: 'movies',
    SHOWS: 'shows',
    SEASONS: 'seasons',
    EPISODES: 'episodes',
});
/**
 * Enum for all trakt types
 * @enum {'movies'|'shows'|'seasons'|'episodes'|'person'}
 */
export const TRAKT_CONTENT_TYPES = Object.freeze({
    ...TRAKT_WATCH_TYPES,
    PERSON: 'person',
});

/**
 * Constants for default page sizes
 * @enum {number|null}
 */
export const DEFAULT_PAGE_SIZES = Object.freeze({
    DEFAULT: 1_000,
    HISTORY: 100,
    RATINGS: null,
});

/**
 * Constants for default limits
 * @enum {number}
 */
export const DEFAULT_LIMITS = Object.freeze({
    DEFAULT: 50,
    HISTORY: 50,
});

class TraktClient {
    /** @type {string} */
    #clientId;
    /** @type {string} */
    #clientSecret;
    /** @type {string} */
    #refreshToken;
    /** @type {string?} */
    #accessToken = null;
    /** @type {?number} */
    #tokenExpiresAt = null; // Timestamp in ms when the token expires

    constructor() {
        this.#clientId = config.APP_CLIENT_ID;
        this.#clientSecret = config.APP_CLIENT_SECRET;
        this.#refreshToken = config.REFRESH_TOKEN;
        this.#validate();
    }

    #validate() {
        if (!this.#clientId || !this.#clientSecret || !this.#refreshToken) {
            throw new Error('TraktClient not properly configured: missing clientId, clientSecret, or refreshToken.');
        }
    }

    /**
     * Get the user's watchlist (all watchlist items)
     * @returns {Promise<Trakt.WatchlistItem[]>} - The watchlist
     */
    async getWatchlist() {
        const url = this.#buildUrl(`${TRAKT_API_URL}/users/me/watchlist`);
        const { data: watchlist } = (await this.#makeRequest(url, {}));
        return watchlist;
    }

    /**
     * Get the user's ratings (all ratings)
     * @returns {Promise<Trakt.RatingItem[]>} - The ratings
     */
    async getRatings() {
        const url = this.#buildUrl(`${TRAKT_API_URL}/users/me/ratings`);
        const { data: ratings } = await this.#makeRequest(url);
        return ratings;
    }

    /**
     * Get the user's favorites (all favorites)
     * @returns {Promise<Trakt.FavoriteItem[]>} - The favorites
     */
    async getFavorites() {
        const url = this.#buildUrl(`${TRAKT_API_URL}/users/me/favorites`);
        const { data: favorites } = await this.#makeRequest(url);
        return favorites;
    }

    /**
     * Get the user's watched items (all watched items)
     * @param {'movies'|'shows'|'episodes'} type - The type of content to get watched data for
     * @returns {Promise<Trakt.WatchedItem[]>} - The watched items
     */
    async getWatched(type) {
        if (!['movies', 'shows', 'episodes'].includes(type)) throw new Error(`TraktClient.getWatched requires a valid type parameter ('movies', 'shows', or 'episodes'), but was: '${type}'.`);

        const url = this.#buildUrl(`${TRAKT_API_URL}/users/me/watched/:type`, { type });
        const { data: watched } = await this.#makeRequest(url);
        return watched;
    }

    /**
     * Get the user's watch history (paginated with auto-pagination support)
     * @param {Props.GetHistoryProps & Props.PaginationProps} [options={}] - Optional parameters
     * @returns {Promise<{data: Trakt.HistoryItem[], pagination: Trakt.Pagination}>} - The history with pagination info
     */
    async getHistory({ type = 'all', startAt = null, endAt = null, limit = DEFAULT_LIMITS.HISTORY } = {}) {
        const url = this.#buildUrl(`${TRAKT_API_URL}/users/me/history/:type`, {
            type,
            start_at: startAt?.toISOString(),
            end_at: endAt?.toISOString(),
            ...this.#buildPagination(DEFAULT_PAGE_SIZES.HISTORY),
        });
        return await this.#makePaginatedRequest(url, {}, { autoPaginate: true, limit });
    }

    /**
     * Get user statistics
     * @returns {Promise<Trakt.StatsResponse>} - User statistics
     */
    async getStats() {
        const url = this.#buildUrl(`${TRAKT_API_URL}/users/me/stats`);
        const { data: stats } = await this.#makeRequest(url);
        return stats;
    }

    // /**
    //  * Get trending items with auto-pagination support
    //  * @param {object} [options] - Optional parameters
    //  * @param {string} [options.type='movies'] - Type: movies or shows
    //  * @param {Props.PaginationProps} [options.pagination] - Pagination options
    //  * @returns {Promise<{data: Trakt.TrendingItem[], pagination: Trakt.Pagination}>} - The trending items with pagination info
    //  */
    // async getTrending({ type = 'movies', pagination = {} } = {}) {
    //     const url = this.#buildUrl(`${TRAKT_API_URL}/trending/${type}`, { ...this.#buildPagination(pagination.pageSize, pagination.page) });
    //     return await this.#makePaginatedRequest(url, {}, { autoPaginate: pagination.autoPaginate, limit: pagination.limit });
    // }

    // /**
    //  * Get search results with auto-pagination support
    //  * @param {object} options - Search parameters
    //  * @param {string} options.query - Search query
    //  * @param {string} [options.type] - Filter by type: movie, show, episode, person, list
    //  * @param {Props.PaginationProps} [options.pagination] - Pagination options
    //  * @returns {Promise<{data: Trakt.SearchResult[], pagination: Trakt.Pagination}>} - The search results with pagination info
    //  */
    // async search({ query, type, pagination = {} }) {
    //     const url = this.#buildUrl(`${TRAKT_API_URL}/search/${type || 'movie,show'}`, { query, ...this.#buildPagination(pagination.pageSize, pagination.page) });
    //     return await this.#makePaginatedRequest(url, {}, { autoPaginate: pagination.autoPaginate, limit: pagination.limit });
    // }

    /**
     * @template T
     * @param {string} endpoint
     * @param {import('node-fetch').RequestInit} [initOptions={}]
     * @param {object} [options={}] - Optional options
     * @param {boolean} [options.retry=true] - Whether to retry on 401
     * @returns {Promise<{data: T, response: import('node-fetch').Response}>}
     */
    async #makeRequest(endpoint, initOptions = {}, { retry = true } = {}) {
        await this.#ensureTokenValid();
        const url = endpoint;
        /** @type {import('node-fetch').HeadersInit} */
        const headers = {
            'Authorization': `Bearer ${this.#accessToken}`,
            'trakt-api-version': TRAKT_API_VERSION,
            'trakt-api-key': this.#clientId,
            ...(initOptions.headers ? Object.fromEntries(Object.entries(initOptions.headers)) : {}),
        };

        const response = await fetch(url, { ...initOptions, headers });
        if (response.status === 401 && retry) {
            // Unauthorized: refresh token and retry
            await this.#refreshAccessToken();
            return await this.#makeRequest(endpoint, initOptions, { retry: false });
        }

        if (!response.ok) {
            /** @type {Trakt.ErrorResponse} */
            const errorData = await parseJson(response);
            throw new Error(`Trakt API responded [${response.status} - ${errorData.error}] ${errorData.error_description}`);
        }

        const data = /** @type {T} */ (await response.json());
        return { data, response };
    }

    /**
     * Makes a paginated request to the Trakt API, automatically fetching all pages
     * @template T
     * @param {string} endpoint - API endpoint
     * @param {import('node-fetch').RequestInit} [initOptions={}] - Request options
     * @param {object} [options={}] - Additional options
     * @param {boolean} [options.autoPaginate=false] - Whether to automatically fetch all pages
     * @param {number?} [options.limit=null] - Maximum number of items to fetch (null for unlimited)
     * @returns {Promise<{data: T[], pagination: Trakt.Pagination}>}
     */
    async #makePaginatedRequest(endpoint, initOptions = {}, { autoPaginate = false, limit = null } = {}) {
        // Make the initial request
        const { data, response } = await this.#makeRequest(endpoint, initOptions);

        // Parse pagination headers
        const itemCount = Number(response.headers.get('x-pagination-item-count')) || 0;
        const pageCount = Number(response.headers.get('x-pagination-page-count')) || 1;
        const pageSize = Number(response.headers.get('x-pagination-limit')) || 0;
        let page = Number(response.headers.get('x-pagination-page')) || 1;

        // if limit is set, calculate the untilPage based on the page size
        let untilPage = limit
            ? Math.min(pageCount, Math.ceil(limit / pageSize))
            : pageCount;

        // If auto-pagination is disabled or we're on the last page, return the data
        if (!autoPaginate || page >= untilPage) {
            const slicedData = this.#sliceData(data, limit);
            return { data: slicedData, pagination: { itemCount, pageCount, pageSize, page } };
        }

        // Otherwise, fetch the remaining pages
        const pagePromises = [];

        for (page = page + 1; page <= untilPage; page++) {
            // Create a new URL with the updated page parameter
            const url = new URL(endpoint);
            url.searchParams.set('page', String(page));

            // Add the request to the promises array
            pagePromises.push(this.#makeRequest(url.toString(), initOptions));
        }

        // Wait for all pages to be fetched
        const additionalData = await Promise.all(pagePromises);

        // Combine all the data
        const allData = [...data, ...additionalData.flat()];

        // if limit is set, truncate the data to the limit
        const slicedData = this.#sliceData(allData, limit);

        return {
            data: slicedData,
            pagination: { itemCount, pageCount, pageSize, page },
        };
    }

    async #ensureTokenValid() {
        if (this.#accessToken && this.#tokenExpiresAt && Date.now() < this.#tokenExpiresAt) {
            return;
        }
        await this.#refreshAccessToken();
    }

    async #refreshAccessToken() {
        try {
            const response = await fetch(`${TRAKT_API_URL}/oauth/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    client_id: this.#clientId,
                    client_secret: this.#clientSecret,
                    grant_type: 'refresh_token',
                    redirect_uri: 'urn:ietf:wg:oauth:2.0:oob',
                    refresh_token: this.#refreshToken,
                }),
            });
            if (!response.ok) {
                /** @type {Trakt.ErrorResponse} */
                const errorData = await parseJson(response);
                throw new Error(`Failed to refresh token [${response.status} - ${errorData.error}] ${errorData.error_description}`);
            }

            /** @type {Trakt.OAuthTokenResponse} */
            const data = await parseJson(response);
            this.#accessToken = data.access_token;
            this.#refreshToken = data.refresh_token;
            this.#tokenExpiresAt = Date.now() + data.expires_in * 1_000;

            console.debug(`Access Token: ${this.#accessToken}`);

            // Save the new refresh token to the .env file
            config.REFRESH_TOKEN = this.#refreshToken;
            saveConfig();
        } catch (error) {
            console.error('Error refreshing Trakt access token:', error);
            throw error;
        }
    }

    /**
     * Builds a URL with optional route segments and query parameters
     * @param {string} baseUrl - The base URL with optional segment placeholders (e.g., ":type")
     * @param {object} [params={}] - Parameters that can be used as segments or query parameters
     * @returns {string} - The complete URL with segments and query parameters
     */
    #buildUrl(baseUrl, params = {}) {
        // Create URL object
        let url = new URL(baseUrl);

        // Process each parameter
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null) {
                // If the key matches a segment placeholder in the URL, use it as a segment
                if (url.pathname.includes(`:${key}`)) {
                    url.pathname = url.pathname.replace(`:${key}`, value);
                } else {
                // Otherwise, add it as a query parameter
                    url.searchParams.append(key, String(value));
                }
            }
        }

        // Remove any remaining segment placeholders and their slashes
        const segmentPattern = /\/?:\w+/g;
        url.pathname = url.pathname.replaceAll(segmentPattern, '');

        // Normalize the path to remove any double slashes
        url.pathname = url.pathname.replaceAll(/\/+/g, '/');

        return url.toString();
    }

    /**
     * Builds pagination parameters for a Trakt API request
     * @param {number?} [pageSize=null] - Number of items to return
     * @param {number?} [page=1] - Page number. If `pageSize` is null or `page` is 1, `page` will be null.
     * @returns {{ limit: ?number; page: ?number }} - Pagination parameters
     */
    #buildPagination(pageSize = null, page = 1) {
        if (pageSize === null || page === 1) {
            return { limit: pageSize, page: null };
        }
        return { limit: pageSize, page };
    }

    /**
     * Slices the data to the specified maximum number of items
     * @template T
     * @param {T[]} data
     * @param {?number} limit
     * @returns {T[]}
     */
    #sliceData(data, limit) {
        if (limit) {
            return data.slice(0, limit);
        }
        return data;
    }
}

const traktClient = new TraktClient();
export default traktClient;
