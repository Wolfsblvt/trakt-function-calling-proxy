import fetch from 'node-fetch';
import { config } from '../config.js';
import { parseJson } from '../utils.js';

const TRAKT_API_URL = 'https://api.trakt.tv';
const TRAKT_API_VERSION = 2;

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

            /** @type {OAuthTokenResponse} */
            const data = await parseJson(response);
            this.#accessToken = data.access_token;
            this.#refreshToken = data.refresh_token;
            this.#tokenExpiresAt = Date.now() + data.expires_in * 1000;
        } catch (error) {
            console.error('Error refreshing Trakt access token:', error);
            throw error;
        }
    }


    async getWatchlist() {
        return this.#makeRequest(`${TRAKT_API_URL}/users/me/watchlist`);
    }

    /** @returns {Promise<Array>} */
    async getHistory() {
        // TODO: Implement API call to fetch history
        return [];
    }

    /** @returns {Promise<Array>} */
    async getRatings() {
        // TODO: Implement API call to fetch ratings
        return [];
    }
}

const traktClient = new TraktClient();
export default traktClient;
