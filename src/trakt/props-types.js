/** @typedef {import('./client.js').TRAKT_WATCH_TYPES} TRAKT_WATCH_TYPES */

/**
 * Options for getting the user's watch history
 * @typedef {Object} GetHistoryProps
 * @property {TRAKT_WATCH_TYPES?} [type=null] - Filter by type: movies, shows, seasons, episodes
 * @property {number?} [itemId=null] - Trakt ID for a specific item
 * @property {Date?} [startAt=null] - Starting date
 * @property {Date?} [endAt=null] - Ending date
 * @property {number} [limit=DEFAULT_PAGE_SIZES.HISTORY] - Number of items to return
 * @property {number} [page=1] - Page number
*/

/**
 * @typedef {Object} GetRatingsProps
 * @property {TRAKT_WATCH_TYPES|'all'?} [type=null] - Filter by type: movies, shows, seasons, episodes
 * @property {number|number[]?} [rating=null] - Filter by rating (1-10) or array of ratings
 * @property {number?} [limit=DEFAULT_PAGE_SIZES.RATINGS] - Number of items to return. Ratings has optional pagination, allowing unlimited items.
 * @property {number} [page=1] - Page number
 */

export { };

