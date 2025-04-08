/** @import * as Trakt from './types/trakt-types.js' */

import { paramParser } from '../utils/param-parser.js';

/**
 * Create a unique key for an item based on its type and ID
 * @param {Trakt.IWithTypedData|Trakt.IWithIds|object} item - The item to create a key for
 * @param {'movie'|'show'|'season'|'episode'?} [type=null] - The type of the item
 * @returns {string} - The unique key for the item
 */
export function getItemKey(item, type = null) {
    type ??= item.type;

    if (!type) {
        console.error('Item type must be supplied for non-typed items', item);
        throw new Error('Item type must be supplied for non-typed items');
    }

    if ('ids' in item[type]) {
        return `${type}:${item[type].ids.trakt}`;
    }
    if ('ids' in item) {
        return `${type}:${item.ids.trakt}`;
    }
    if ('id' in item) {
        return `${type}:${item.id}`;
    }
    throw new Error('Item must have an ID');
}

/**
 * Parses a Trakt type parameter from a request query with automatic alias generation.
 * @param {any} param - The parameter to parse
 * @param {('all'|'movies'|'shows'|'seasons'|'episodes')[]} enumValues - The allowed enum values
 * @param {string} paramName - Name of the parameter for error messages
 * @returns {string|undefined} - The parsed enum value if it is a valid enum value
 */
export function parseTraktTypeWithAliases(param, enumValues, paramName) {
    const aliasMap = {
        'movies': ['movie'],
        'shows': ['show'],
        'seasons': ['season'],
        'episodes': ['episode'],
    };

    /** @type {Record<string, string[]>} */
    const acceptedAliases = {};
    for (const enumValue of enumValues) {
        acceptedAliases[enumValue] = aliasMap[enumValue] || [];
    }

    return paramParser.enum(param, enumValues, paramName, { acceptedAliases });
}
