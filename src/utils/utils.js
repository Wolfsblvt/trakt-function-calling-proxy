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
 * @param {object} [options={}] - Optional parameters
 * @param {Record<string, *>|undefined} [options.additionalData] - Additional data to include in the response
 * @param {boolean} [options.addAfter=false] - Whether to add additional data after the data array
 * @returns {ApiResponse<T>} - Standardized response object
 */
export function createApiResponse(data, pagination, { additionalData = undefined, addAfter = false } = {}) {
    return {
        count: data.length,
        total: pagination.itemCount ?? data.length,
        _info: undefined,
        _tips: undefined,
        ...(!addAfter ? additionalData : {}),
        data,
        ...(addAfter ? additionalData : {}),
    };
}

/**
 * Creates a standardized API response object
 * @template T
 * @param {object} options - Options for creating the response
 * @param {T[]} options.data - The response data array
 * @param {{itemCount: number}} options.pagination - Pagination metadata
 * @param {Record<string, *>|undefined} [options.additionalData] - Additional data to include in the response
 * @param {boolean} [options.addAfter=false] - Whether to add additional data after the data array
 * @returns {ApiResponse<T>} - Standardized response object
 */
export function createApiResponseFromProps({ data, pagination, additionalData = undefined, addAfter = false }) {
    return createApiResponse(data, pagination, { additionalData, addAfter });
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

/**
 * Checks if the given item type matches the given type filter
 * @param {'movie'|'show'|'season'|'episode'} item_type - The type of the item. Can be "movie", "show", "season" or "episode".
 * @param {'all'|'movies'|'shows'|'seasons'|'episodes'} type_filter - The type filter to apply. Can be "movies", "shows", "seasons", "episodes" or "all".
 * @returns {boolean} - true if the item type matches the type filter, false otherwise
 */
export function itemTypeMatchesFilter(item_type, type_filter) {
    switch (type_filter) {
        case 'all':
            return true;
        case 'movies':
            return item_type === 'movie';
        case 'shows':
            return item_type === 'show';
        case 'seasons':
            return item_type === 'season';
        case 'episodes':
            return item_type === 'episode';
        default:
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            throw new Error(`Unknown type filter: ${type_filter}`);
    }
}


