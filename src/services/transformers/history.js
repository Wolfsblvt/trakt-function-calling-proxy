import { getItemKey } from '../../trakt/trakt-utils.js';
import indexedCacheService from '../indexed-cache-service.js';

/** @import * as Trakt from '../../trakt/types/trakt-types.js' */
/** @import * as Enriched from '../../trakt/types/enriched-types.js' */
/** @import * as Flattened from '../../trakt/types/flattened-types.js' */

/** @typedef {import('../indexed-cache-service.js').AllIndexedCaches} AllIndexedCaches */

/**
 * Enriches a batch of history items
 * @param {Trakt.HistoryItem[]} items
 * @returns {Promise<Enriched.EnrichedHistoryItem[]>}
 */
async function enrich(items) {
    const indexed = await indexedCacheService.all();
    return items.map(item => enrichItem(item, indexed));
}

/**
 * Enriches a single history item
 * @param {Trakt.HistoryItem} item
 * @param {AllIndexedCaches} indexed
 * @returns {Enriched.EnrichedHistoryItem}
 */
function enrichItem(item, indexed) {
    const key = getItemKey(item);
    const { rating, watched, favorite } = indexed.get(key);

    return {
        ...item,
        rating: rating?.rating,
        plays: watched?.plays || undefined,
        last_watched_at: watched?.last_watched_at,
        favorite: favorite ? true : undefined,
        favorite_note: favorite?.notes || undefined,
    };
}

/**
 * Flattens a batch of enriched history items
 * @param {Enriched.EnrichedHistoryItem[]} items
 * @returns {Flattened.FlattenedHistoryItem[]}
 */
function flatten(items) {
    return items.map(item => flattenItem(item));
}

/**
 * Flattens a single enriched history item
 * @param {Enriched.EnrichedHistoryItem} item
 * @returns {Flattened.FlattenedHistoryItem}
 */
function flattenItem(item) {
    /** @type {Flattened.FlattenedHistoryItem} */
    // @ts-expect-error We are setting the properties below, just in defined order
    const flattened = {
        type: item.type,
    };

    if (item.type === 'movie' && item.movie) {
        flattened.title = item.movie.title;
        flattened.year = item.movie.year;
    }

    if (item.type === 'show' && item.show) {
        flattened.title = item.show.title;
        flattened.year = item.show.year;
    }

    if (item.type === 'season' && item.season && item.show) {
        flattened.title = `${item.show.title} - Season ${item.season.number}`;
        flattened.show_title = item.show.title;
        flattened.show_year = item.show.year;
        flattened.season = item.season.number;
    }

    if (item.type === 'episode' && item.episode && item.show) {
        flattened.show_title = item.show.title;
        flattened.show_year = item.show.year;
        flattened.episode_title = item.episode.title;
        flattened.episode_number = item.episode.number;
        flattened.season = item.episode.season;
    }

    // Add enriched data at the end
    flattened.rating = item.rating;
    flattened.plays = item.plays ?? 0;
    flattened.watched_at = item.watched_at;
    flattened.last_watched_at = item.watched_at !== item.last_watched_at ? item.last_watched_at : undefined;
    flattened.favorite = item.favorite;
    flattened.favorite_note = item.favorite_note;

    /** @type {Flattened.FlattenedHistoryItem} */
    return flattened;
}

/**
 * Transforms a batch of history items (enrich + flatten)
 * @param {Trakt.HistoryItem[]} items
 * @returns {Promise<Flattened.FlattenedHistoryItem[]>}
 */
async function transform(items) {
    const enriched = await enrich(items);
    return flatten(enriched);
}

/**
 * Transforms a single history item (enrich + flatten)
 * @param {Trakt.HistoryItem} item
 * @returns {Promise<Flattened.FlattenedHistoryItem>}
 */
async function transformItem(item) {
    const indexed = await indexedCacheService.all();
    const enriched = enrichItem(item, indexed);
    return flattenItem(enriched);
}

/** @type {import('../transformer-service.js').Transformer<Trakt.HistoryItem, Enriched.EnrichedHistoryItem, Flattened.FlattenedHistoryItem>} */
export default {
    enrich,
    enrichItem,
    flatten,
    flattenItem,
    transform,
    transformItem,
};
