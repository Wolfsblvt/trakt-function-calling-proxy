// import favorites from './transformers/favorites.js';
import history from './transformers/history.js';
// import ratings from './transformers/ratings.js';
// import watchlist from './transformers/watchlist.js';

/** @import * as Trakt from '../trakt/types/trakt-types.js' */
/** @import * as Enriched from '../trakt/types/enriched-types.js' */
/** @import * as Flattened from '../trakt/types/flattened-types.js' */

/** @typedef {import('./indexed-cache-service.js').AllIndexedCaches} AllIndexedCaches */

/**
 * @template Input
 * @template Enriched
 * @template Flattened
 * @typedef {object} Transformer
 * @property {(items: Input[]) => Promise<Enriched[]>} enrich - Enriches a collection of items with additional data
 * @property {(item: Input, indexed: AllIndexedCaches) => Enriched} enrichItem - Enriches a single item with additional data
 * @property {(items: Enriched[]) => Flattened[]} flatten - Flattens a collection of enriched items
 * @property {(item: Enriched, indexed: AllIndexedCaches) => Flattened} flattenItem - Flattens a single enriched item
 * @property {(items: Input[]) => Promise<Flattened[]>} transform - Transforms a collection of items by enriching and flattening
 * @property {(item: Input, indexed: AllIndexedCaches) => Promise<Flattened>} transformItem - Transforms a single item by enriching and flattening
 */

/**
 * Data transformer service with modular transformers for different data types
 *
 * Each transformer module implements the following functions:
 * - enrich(items): Enriches a collection of items with additional data
 * - enrichItem(item, indexed): Enriches a single item with additional data
 * - flatten(items): Flattens a collection of enriched items
 * - flattenItem(item, indexed): Flattens a single enriched item
 * - transform(items): Transforms a collection of items by enriching and flattening
 * - transformItem(item, indexed): Transforms a single item by enriching and flattening
 */

/**
 * @typedef {object} TransformerService
 * @property {Transformer<Trakt.HistoryItem, Enriched.EnrichedHistoryItem, Flattened.FlattenedHistoryItem>} history
 * @property {Transformer<Trakt.HistoryItem, Enriched.EnrichedHistoryItem, Flattened.FlattenedHistoryItem>} ratings
 * @property {Transformer<Trakt.HistoryItem, Enriched.EnrichedHistoryItem, Flattened.FlattenedHistoryItem>} watchlist
 * @property {Transformer<Trakt.HistoryItem, Enriched.EnrichedHistoryItem, Flattened.FlattenedHistoryItem>} favorites
*/

/** @type {TransformerService} */
export const transformerService = {
    history,
    ratings: history,
    watchlist: history,
    favorites: history,
};

export default transformerService;
