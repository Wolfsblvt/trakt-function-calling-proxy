

/** @import * as Trakt from '../../trakt/trakt-types.js' */

/**
 * @typedef {Object} TraktItemBase
 * @property {string} type - The type of the item (movie, show, episode, etc.)
 * @property {Object} [movie] - Movie data if type is movie
 * @property {Object} [show] - Show data if type is show
 * @property {Object} [episode] - Episode data if type is episode
 * @property {Object} [season] - Season data if type is season
 * @property {Object} [person] - Person data if type is person
 */

/**
 * @typedef {(Trakt.HistoryItem|Trakt.RatingItem|Trakt.WatchlistItem|Trakt.TrendingItem|Trakt.SearchResult) & TraktItemBase} TraktItem
 */

/**
 * @typedef {Object} EnrichedWithRating
 * @property {number|null} rating - The user's rating for the item
 */

/**
 * @typedef {Object} EnrichedWithHistory
 * @property {string|null} watched_at - When the item was watched
 * @property {string|null} action - The action taken (e.g., 'watch', 'checkin')
 */
