import fetch from 'node-fetch';
import { config } from '../config.js';
import { parseJson } from '../utils.js';

const TRAKT_API_URL = 'https://api.trakt.tv';
const TRAKT_API_VERSION = '2';

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
            ...initOptions.headers,
        };

        const response = await fetch(url, { ...initOptions, headers });
        if (response.status === 401 && retry) {
            // Unauthorized: refresh token and retry
            await this.#refreshAccessToken();
            return await this.#makeRequest(endpoint, initOptions, { retry: false });
        }

        if (!response.ok) {
            throw new Error(`Trakt API responded with ${response.status}`);
        }

        return /** @type {T} */ (await response.json());
    }

    async #ensureTokenValid() {
        if (this.#tokenExpiresAt && Date.now() >= this.#tokenExpiresAt) {
            await this.#refreshAccessToken();
        }
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
                throw new Error(`Failed to refresh token: ${response.status}`);
            }

            /** @type {import('./trakt-types.js').OAuthTokenResponse} */
            const data = await parseJson(response);
            this.#accessToken = data.access_token;
            this.#refreshToken = data.refresh_token;
            this.#tokenExpiresAt = Date.now() + data.expires_in * 1000;
        } catch (error) {
            console.error('Error refreshing Trakt access token:', error);
            throw error;
        }
    }

    /**
     * Builds a URL with query parameters
     * @param {string} baseUrl - The base URL
     * @param {Object} [params={}] - Query parameters to add
     * @returns {string} - The complete URL with query parameters
     */
    #buildUrl(baseUrl, params = {}) {
        const url = new URL(baseUrl);
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                url.searchParams.append(key, String(value));
            }
        });
        return url.toString();
    }

    /**
     * Get the user's watchlist
     * @param {Object} [options] - Optional parameters
     * @param {string} [options.type] - Filter by type: movies, shows, seasons, episodes
     * @param {string} [options.sort='rank'] - How to sort: rank, added, released, title
     * @param {number} [options.limit] - Number of items to return
     * @param {number} [options.page=1] - Page number
     * @returns {Promise<import('./trakt-types.js').WatchlistItem[]>}
     */
    async getWatchlist({ type, sort = 'rank', limit, page = 1 } = {}) {
        const url = this.#buildUrl(`${TRAKT_API_URL}/users/me/watchlist`, { type, sort, limit, page });
        return this.#makeRequest(url);
    }

    /**
     * Get the user's watch history
     * @param {Object} [options] - Optional parameters
     * @param {string} [options.type] - Filter by type: movies, shows, seasons, episodes
     * @param {string} [options.id] - Trakt ID for a specific item
     * @param {string} [options.startAt] - Start date in ISO format (YYYY-MM-DD)
     * @param {string} [options.endAt] - End date in ISO format (YYYY-MM-DD)
     * @param {number} [options.limit] - Number of items to return
     * @param {number} [options.page=1] - Page number
     * @returns {Promise<import('./trakt-types.js').HistoryItem[]>}
     */
    async getHistory({ type, id, startAt, endAt, limit, page = 1 } = {}) {
        const params = { start_at: startAt, end_at: endAt, limit, page };

        let url;
        if (type && id) {
            url = this.#buildUrl(`${TRAKT_API_URL}/users/me/history/${type}/${id}`, params);
        } else if (type) {
            url = this.#buildUrl(`${TRAKT_API_URL}/users/me/history/${type}`, params);
        } else {
            url = this.#buildUrl(`${TRAKT_API_URL}/users/me/history`, params);
        }

        return this.#makeRequest(url);
    }

    /**
     * Get the user's ratings
     * @param {Object} [options] - Optional parameters
     * @param {string} [options.type] - Filter by type: movies, shows, seasons, episodes
     * @param {string} [options.rating] - Filter by rating (1-10)
     * @param {number} [options.limit] - Number of items to return
     * @param {number} [options.page=1] - Page number
     * @returns {Promise<import('./trakt-types.js').RatingItem[]>}
     */
    async getRatings({ type, rating, limit, page = 1 } = {}) {
        let url;
        if (type) {
            url = this.#buildUrl(`${TRAKT_API_URL}/users/me/ratings/${type}`, { rating, limit, page });
        } else {
            url = this.#buildUrl(`${TRAKT_API_URL}/users/me/ratings`, { rating, limit, page });
        }
        return this.#makeRequest(url);
    }

    /**
     * Get trending movies or shows
     * @param {Object} [options] - Optional parameters
     * @param {string} [options.type='movies'] - Type: movies or shows
     * @param {number} [options.limit=10] - Number of items to return
     * @param {number} [options.page=1] - Page number
     * @returns {Promise<import('./trakt-types.js').TrendingItem[]>}
     */
    async getTrending({ type = 'movies', limit = 10, page = 1 } = {}) {
        const url = this.#buildUrl(`${TRAKT_API_URL}/trending/${type}`, { limit, page });
        return this.#makeRequest(url);
    }

    /**
     * Search for movies, shows, episodes, people, or lists
     * @param {Object} options - Search parameters
     * @param {string} options.query - Search query
     * @param {string} [options.type] - Filter by type: movie, show, episode, person, list
     * @param {number} [options.limit=10] - Number of items to return
     * @param {number} [options.page=1] - Page number
     * @returns {Promise<import('./trakt-types.js').SearchResult[]>}
     */
    async search({ query, type, limit = 10, page = 1 }) {
        const url = this.#buildUrl(`${TRAKT_API_URL}/search/${type || 'movie,show'}`, { query, limit, page });
        return this.#makeRequest(url);
    }
}

const traktClient = new TraktClient();
export default traktClient;
