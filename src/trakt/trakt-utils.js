/** @import * as Trakt from './types/trakt-types.js' */

/**
 * Create a unique key for an item based on its type and ID
 * @param {Trakt.IWithTypedData|Trakt.IWithIds|object} item - The item to create a key for
 * @param {'movie'|'show'|'season'|'episode'?} [type=null] - The type of the item
 * @returns {string} - The unique key for the item
 */
export function getItemKey(item, type = null) {
    type ??= item.type;

    if (!type) throw new Error('Item type must be supplied for non-typed items');

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
