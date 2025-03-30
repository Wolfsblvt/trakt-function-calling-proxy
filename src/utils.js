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
