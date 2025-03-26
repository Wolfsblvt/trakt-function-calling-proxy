/** @typedef {import('./client.js').TRAKT_WATCH_TYPES} TRAKT_WATCH_TYPES */

/**
 * Options for pagination
 * @typedef {Object} PaginationProps
 * @property {number?} [limit] - Number of items per page
 * @property {number?} [page=1] - Page number
 * @property {boolean} [autoPaginate=false] - Whether to automatically fetch all pages
 * @property {number?} [maxPages=null] - Maximum number of pages to fetch
 */

/**
 * Options for getting the user's watch history
 * @typedef {Object} GetHistoryProps
 * @property {TRAKT_WATCH_TYPES?} [type=null] - Filter by type: movies, shows, seasons, episodes
 * @property {number?} [itemId=null] - Trakt ID for a specific item
 * @property {Date?} [startAt=null] - Starting date
 * @property {Date?} [endAt=null] - Ending date
*/

/**
 * Options for getting the user's ratings
 * @typedef {Object} GetRatingsProps
 * @property {TRAKT_WATCH_TYPES|'all'?} [type=null] - Filter by type: movies, shows, seasons, episodes
 * @property {number|number[]?} [rating=null] - Filter by rating (1-10) or array of ratings
 */

export { };
