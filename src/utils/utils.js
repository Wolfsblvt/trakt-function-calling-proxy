import moment from 'moment';

/**
 * @template T
 * @param {import('node-fetch').Response} response
 * @returns {Promise<T>}
 */
export async function parseJson(response) {
    return /** @type {T} */ (await response.json());
}

/**
 * @template T
 * @typedef {object} ApiResponse
 * @property {number} count - Number of items in the response
 * @property {number|undefined} total - Total number of items available
 * @property {string|undefined} _info - Additional information about the response
 * @property {string[]|undefined} _tips - Tips about the response
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
        _tips: undefined,
        data,
    };
}

/**
 * Gets the minimum and maximum times from an array of items.
 * @template T
 * @param {T[]} items - The array of items.
 * @param {(item: T) => Date|number} getTime - A function that returns the time for a given item.
 * @returns {[?Date, ?Date]} - An array containing the minimum and maximum dates, or [null, null] if the input array is empty.
 */
export function getMinMaxOfItems(items, getTime) {
    if (items.length === 0) {
        return [null, null];
    }

    const times = items.map(x => {
        const time = getTime(x);
        return time instanceof Date ? time.getTime() : time;
    });
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    return [new Date(minTime), new Date(maxTime)];
};

/**
 * Gets the duration between two dates.
 * @template T
 * @param {T[]} items - The array of items.
 * @param {(item: T) => Date|number} getTime - A function that returns the time for a given item.
 * @returns {?moment.Duration} - The duration between the two dates, or null if either date is null.
 */
export function getDurationOfItems(items, getTime) {
    const [minTime, maxTime] = getMinMaxOfItems(items, getTime);
    if (!minTime || !maxTime) return null;
    return moment.duration(maxTime.getTime() - minTime.getTime());
};


