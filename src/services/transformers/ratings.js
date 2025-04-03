import indexedCacheService from '../../services/indexed-cache-service.js';

/** @import * as Trakt from '../../trakt/types/trakt-types.js' */
/** @import * as Enriched from '../../trakt/types/enriched-types.js' */
/** @import * as Flattened from '../../trakt/types/flattened-types.js' */

/** @typedef {import('../indexed-cache-service.js').AllIndexedCaches} AllIndexedCaches */

/**
 * Enriches a batch of rating items with additional data
 * @param {Trakt.RatingItem[]} items
 * @returns {Promise<Enriched.EnrichedRatingItem[]>}
 */
async function enrich(items) {
    const indexed = await indexedCacheService.all();
    return items.map(item => enrichItem(item, indexed));
}

/**
 * Enriches a single rating item with additional data
 * @param {Trakt.RatingItem} item
 * @param {AllIndexedCaches} indexed
 * @returns {Enriched.EnrichedRatingItem}
 */
function enrichItem(item, indexed) {
    const itemKey = `${item.type}:${item[item.type]?.ids?.trakt}`;
    const { watched, favorite } = indexed.get(itemKey);

    /** @type {Enriched.EnrichedRatingItem} */
    const enriched = {
        ...item,
        // Add watched information if available
        plays: watched?.plays ?? 0,
        last_watched_at: watched?.last_watched_at,
        rewatch_started: watched?.reset_at,
        // Add favorite information if available
        favorite: favorite ? true : undefined,
        favorite_note: favorite?.notes,
    };

    return enriched;
}

/**
 * Flattens a batch of enriched rating items
 * @param {Enriched.EnrichedRatingItem[]} items
 * @returns {Flattened.FlattenedRatingItem[]}
 */
function flatten(items) {
    return items.map(item => flattenItem(item));
}

/**
 * Flattens a single enriched rating item
 * @param {Enriched.EnrichedRatingItem} item
 * @returns {Flattened.FlattenedRatingItem}
 */
function flattenItem(item) {
    /** @type {Flattened.FlattenedRatingItem} */
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
    flattened.rated_at = item.rated_at;
    flattened.plays = item.plays ?? 0;
    flattened.last_watched_at = item.last_watched_at;
    flattened.favorite = item.favorite;
    flattened.favorite_note = item.favorite_note;

    return flattened;
}

/**
 * Transforms a batch of rating items (enrich + flatten)
 * @param {Trakt.RatingItem[]} items
 * @returns {Promise<Flattened.FlattenedRatingItem[]>}
 */
async function transform(items) {
    const enriched = await enrich(items);
    return flatten(enriched);
}

/**
 * Transforms a single rating item (enrich + flatten)
 * @param {Trakt.RatingItem} item
 * @returns {Promise<Flattened.FlattenedRatingItem>}
 */
async function transformItem(item) {
    const indexed = await indexedCacheService.all();
    const enriched = enrichItem(item, indexed);
    return flattenItem(enriched);
}

/** @type {import('../transformer-service.js').Transformer<Trakt.RatingItem, Enriched.EnrichedRatingItem, Flattened.FlattenedRatingItem>} */
export default {
    enrich,
    enrichItem,
    flatten,
    flattenItem,
    transform,
    transformItem,
};
