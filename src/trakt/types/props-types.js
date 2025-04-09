/** @typedef {import('../client.js').TRAKT_WATCH_TYPES} TRAKT_WATCH_TYPES */

/**
 * Options for pagination
 * @typedef {object} PaginationProps
 * @property {?number} [limit] - Maximum number of items to fetch (null for unlimited)
 */

/**
 * Options for getting the user's watch history
 * @typedef {object} GetHistoryProps
 * @property {HistoryFilterType} [type='all'] - Filter by type: movies, shows, seasons, episodes
 * @property {?Date} [startAt=null] - Starting date
 * @property {?Date} [endAt=null] - Ending date
*/
/** @typedef {'all'|'movies'|'shows'|'seasons'|'episodes'} HistoryFilterType */

/**
 * Options for getting the user's ratings
 * @typedef {object} GetRatingsProps
 * @property {RatingsFilterType} [type='all'] - Filter by type: movies, shows, episodes
 * @property {?number} [minRating=null] - Minimum rating to include (1-10)
 * @property {?number} [maxRating=null] - Maximum rating to include (1-10)
 * @property {'rating'|'rated_at'} [sortBy='rated_at'] - Field to sort by
 * @property {'asc'|'desc'} [order='desc'] - Sort order
 * @property {boolean} [includeUnwatched=false] - Whether to include items that haven't been watched
 * @property {boolean} [includeStats=true] - Whether to include statistics
 */
/** @typedef {'all'|'movies'|'shows'|'seasons'|'episodes'} RatingsFilterType */

export { };
