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

/**
 * @typedef {object} EnrichedRatingsStats
 * @property {string} _info - Informational message
 * @property {number} total - Total number of ratings
 * @property {Trakt.StatsRatingsDistribution} distribution - Distribution of ratings
 * @property {number} [avg] - Average rating
 * @property {number} [median] - Median rating
 * @property {number} [mode] - Mode rating
 * @property {number} [std_dev] - Standard deviation of ratings
 * @property {number[]} [rating_spread] - Spread of ratings
 * @property {number} [percent_8_and_above] - Percentage of ratings 8 and above
 * @property {number} [percent_9_and_above] - Percentage of ratings 9 and above
 * @property {number} [percent_10s] - Percentage of ratings 10
 */

export { };
