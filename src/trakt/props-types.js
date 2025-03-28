/** @typedef {import('./client.js').TRAKT_WATCH_TYPES} TRAKT_WATCH_TYPES */

/**
 * Options for pagination
 * @typedef {object} PaginationProps
 * @property {number} [limit] - Number of items per page
 * @property {number} [page=1] - Page number
 */

/**
 * Options for getting the user's watch history
 * @typedef {object} GetHistoryProps
 * @property {TRAKT_WATCH_TYPES?} [type=null] - Filter by type: movies, shows, seasons, episodes
 * @property {Date?} [startAt=null] - Starting date
 * @property {Date?} [endAt=null] - Ending date
*/

/**
 * Options for getting the user's ratings
 * @typedef {object} GetRatingsProps
 * @property {TRAKT_WATCH_TYPES|'all'?} [type=null] - Filter by type: movies, shows, seasons, episodes
 * @property {number|number[]?} [rating=null] - Filter by rating (1-10) or array of ratings
 */

export { };
