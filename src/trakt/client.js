import fetch from 'node-fetch';
import { config, saveConfig } from '../config.js';
import { parseJson } from '../utils.js';

/** @import * as Trakt from './trakt-types.js' */
/** @import * as Props from './props-types.js' */

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
 * @enum {number?}
 */
export const DEFAULT_PAGE_SIZES = Object.freeze({
    DEFAULT: 1_000,
    HISTORY: 1_000,
    RATINGS: null,
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
     * @template T
     * @param {string} endpoint
     * @param {import('node-fetch').RequestInit} [initOptions={}]
     * @param {object} [options={}] - Optional options
     * @param {boolean} [options.retry=true] - Whether to retry on 401
     * @returns {Promise<T>}
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

        return /** @type {T} */ (await response.json());
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
            this.#tokenExpiresAt = Date.now() + data.expires_in * 1000;

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
     * @param {Object} [params={}] - Parameters that can be used as segments or query parameters
     * @returns {string} - The complete URL with segments and query parameters
     */
    #buildUrl(baseUrl, params = {}) {
        // Create URL object
        let url = new URL(baseUrl);

        // Process each parameter
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                // If the key matches a segment placeholder in the URL, use it as a segment
                if (url.pathname.includes(`:${key}`)) {
                    url.pathname = url.pathname.replace(`:${key}`, value);
                } else {
                // Otherwise, add it as a query parameter
                    url.searchParams.append(key, String(value));
                }
            }
        });

        // Remove any remaining segment placeholders and their slashes
        const segmentPattern = /\/?:\w+/g;
        url.pathname = url.pathname.replace(segmentPattern, '');

        // Normalize the path to remove any double slashes
        url.pathname = url.pathname.replace(/\/+/g, '/');

        return url.toString();
    }

    /**
     * Builds pagination parameters for a Trakt API request
     * @param {number?} [limit=null] - Number of items to return
     * @param {number?} [page=1] - Page number. If `limit` is null or `page` is 1, `page` will be null.
     * @returns {{ limit: number?; page: number? }} - Pagination parameters
     */
    #buildPagination(limit = null, page = 1) {
        if (limit === null || page === 1) {
            return { limit, page: null };
        }
        return { limit, page };
    }

    /**
     * Get the user's watchlist
     * @param {Object} [options] - Optional parameters
     * @param {string} [options.type] - Filter by type: movies, shows, seasons, episodes
     * @param {string} [options.sort='rank'] - How to sort: rank, added, released, title
     * @param {number} [options.limit] - Number of items to return
     * @param {number} [options.page=1] - Page number
     * @returns {Promise<Trakt.WatchlistItem[]>}
     */
    async getWatchlist({ type, sort = 'rank', limit, page = 1 } = {}) {
        const url = this.#buildUrl(`${TRAKT_API_URL}/users/me/watchlist`, { type, sort, limit, page });
        return await this.#makeRequest(url);
    }

    /**
     * Get the user's watch history
     * @param {Props.GetHistoryProps} [options={}] - Optional parameters
     * @returns {Promise<Trakt.HistoryItem[]>}
     */
    async getHistory({ type = null, itemId = null, startAt, endAt, limit = DEFAULT_PAGE_SIZES.HISTORY, page = 1 } = {}) {
        const url = this.#buildUrl(`${TRAKT_API_URL}/users/me/history/:type/:item_id`, {
            type,
            item_id: itemId,
            start_at: startAt?.toISOString(),
            end_at: endAt?.toISOString(),
            ...this.#buildPagination(limit, page),
        });
        return await this.#makeRequest(url);
    }

    /**
     * Get the user's ratings
     * @param {Props.GetRatingsProps} [options={}] - Optional parameters
     * @returns {Promise<Trakt.RatingItem[]>}
     */
    async getRatings({ type = null, rating = null, limit = DEFAULT_PAGE_SIZES.RATINGS, page = 1 } = {}) {
        const url = this.#buildUrl(`${TRAKT_API_URL}/users/me/ratings/:type/:rating`, {
            type: type,
            rating: rating && (Array.isArray(rating) ? rating.join(',') : rating),
            ...this.#buildPagination(limit, page),
        });
        return await this.#makeRequest(url);
    }

    /**
     * Get trending movies or shows
     * @param {Object} [options] - Optional parameters
     * @param {string} [options.type='movies'] - Type: movies or shows
     * @param {number} [options.limit=10] - Number of items to return
     * @param {number} [options.page=1] - Page number
     * @returns {Promise<Trakt.TrendingItem[]>}
     */
    async getTrending({ type = 'movies', limit = 10, page = 1 } = {}) {
        const url = this.#buildUrl(`${TRAKT_API_URL}/trending/${type}`, { limit, page });
        return await this.#makeRequest(url);
    }

    /**
     * Search for movies, shows, episodes, people, or lists
     * @param {Object} options - Search parameters
     * @param {string} options.query - Search query
     * @param {string} [options.type] - Filter by type: movie, show, episode, person, list
     * @param {number} [options.limit=10] - Number of items to return
     * @param {number} [options.page=1] - Page number
     * @returns {Promise<Trakt.SearchResult[]>}
     */
    async search({ query, type, limit = 10, page = 1 }) {
        const url = this.#buildUrl(`${TRAKT_API_URL}/search/${type || 'movie,show'}`, { query, limit, page });
        return await this.#makeRequest(url);
    }
}

const traktClient = new TraktClient();
export default traktClient;
