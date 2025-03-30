/** @typedef {import('./client.js').TRAKT_WATCH_TYPES} TRAKT_WATCH_TYPES */

/**
 * Options for pagination
 * @typedef {object} PaginationProps
 * @property {number} [limit] - Maximum number of items to fetch (null for unlimited)
 */

/**
 * Options for getting the user's watch history
 * @typedef {object} GetHistoryProps
 * @property {'all'|TRAKT_WATCH_TYPES} [type='all'] - Filter by type: movies, shows, seasons, episodes
 * @property {Date?} [startAt=null] - Starting date
 * @property {Date?} [endAt=null] - Ending date
*/

/**
 * Options for getting the user's ratings
 * @typedef {object} GetRatingsProps
 * @property {'all'|TRAKT_WATCH_TYPES} [type] - Filter by type: movies, shows, seasons, episodes
 * @property {number|number[]?} [rating=null] - Filter by rating (1-10) or array of ratings
 */

export { };
