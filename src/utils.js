/**
 * @template T
 * @param {import('node-fetch').Response} response
 * @returns {Promise<T>}
 */
export async function parseJson(response) {
    return /** @type {T} */ (await response.json());
}

/**
 * Parses a numerical parameter from a request query
 * @param {any} param - The request query parameter
 * @returns {number|undefined} - The parsed number if it is a valid number, undefined otherwise
 */
export function parseNumberParam(param) {
    const parsed = Number(param);
    return !Number.isNaN(parsed) ? parsed : undefined;
}

/**
 * @template T
 * @typedef {object} ApiResponse
 * @property {number} count - Number of items in the response
 * @property {number|undefined} total - Total number of items available
 * @property {string|undefined} _info - Additional information about the response
 * @property {string|undefined} _note - Note about the response
 * @property {T[]} data - The response data array
 */

/**
 * Creates a standardized API response object
 * @template T
 * @param {T[]} data - The response data array
 * @param {object} pagination - Pagination metadata
 * @param {number} pagination.itemCount - Total number of items available
 * @returns {ApiResponse<T>} - Standardized response object
 */
export function createApiResponse(data, pagination) {
    return {
        count: data.length,
        total: pagination.itemCount !== data.length ? pagination.itemCount : undefined,
        _info: undefined,
        _note: undefined,
        data,
    };
}
