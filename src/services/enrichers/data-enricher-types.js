/** @import * as Trakt from '../../trakt/trakt-types.js' */

/**
 * @typedef {object} TraktItemBase
 * @property {string} type - The type of the item (movie, show, episode, etc.)
 * @property {object} [movie] - Movie data if type is movie
 * @property {object} [show] - Show data if type is show
 * @property {object} [episode] - Episode data if type is episode
 * @property {object} [season] - Season data if type is season
 * @property {object} [person] - Person data if type is person
 */

/**
 * @typedef {(Trakt.HistoryItem|Trakt.RatingItem|Trakt.WatchlistItem|Trakt.TrendingItem|Trakt.SearchResult) & TraktItemBase} TraktItem
 */

/**
 * @typedef {object} EnrichedWithRating
 * @property {number|null} rating - The user's rating for the item
 */

/**
 * @typedef {object} EnrichedWithHistory
 * @property {string|null} watched_at - When the item was watched
 * @property {string|null} action - The action taken (e.g., 'watch', 'checkin')
 */

export { };
