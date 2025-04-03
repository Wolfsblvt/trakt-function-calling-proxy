/** @import * as Trakt from './trakt-types.js' */

/** @typedef {Trakt.HistoryItem & IEnriched} EnrichedHistoryItem */
/** @typedef {Trakt.RatingItem & IEnriched} EnrichedRatingItem */

/**
 * @typedef {object} IEnriched
 * @property {number} [rating] - User rating (1-10)
 * @property {number} [plays] - Number of times the item has been watched
 * @property {string} [last_watched_at] - ISO 8601 timestamp of last watch
 * @property {string} [rewatch_started] - ISO 8601 timestamp when rewatch began
 * @property {boolean} [favorite] - Whether the item is marked as favorite
 * @property {string} [favorite_note] - Optional note associated with favorite
 */

export { };
