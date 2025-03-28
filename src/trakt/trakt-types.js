/**
 * Not really a trakt type, but used for responses to signify pagination info
 * @typedef {object} Pagination
 * @property {number} itemCount - Total number of items
 * @property {number} pageCount - Total number of pages
 * @property {number} limit - Number of items per page
 * @property {number} page - Current page
 */

/**
 * @typedef {object} ErrorResponse
 * @property {string} error
 * @property {string} error_description
 */

/**
 * @typedef {object} OAuthTokenResponse
 * @property {string} access_token
 * @property {string} refresh_token
 * @property {number} expires_in
 */

/**
 * @typedef {object} TraktIds
 * @property {number} trakt - Trakt ID
 * @property {string} [slug] - Slug (unique identifier for urls or similar)
 * @property {string} [imdb] - IMDB ID
 * @property {number} [tmdb] - TMDB ID
 * @property {number} [tvdb] - TVDB ID
 */

/**
 * @typedef {object} TraktMovie
 * @property {string} title - Movie title
 * @property {number} year - Release year
 * @property {TraktIds} ids - Movie IDs
 */

/**
 * @typedef {object} TraktShow
 * @property {string} title - Show title
 * @property {number} year - First air year
 * @property {TraktIds} ids - Show IDs
 */

/**
 * @typedef {object} TraktSeason
 * @property {number} number - Season number
 * @property {TraktIds} ids - Season IDs
 */

/**
 * @typedef {object} TraktEpisode
 * @property {number} season - Season number
 * @property {number} number - Episode number
 * @property {string} title - Episode title
 * @property {TraktIds} ids - Episode IDs
 */

/**
 * @typedef {object} TraktPerson
 * @property {string} name - Person name
 * @property {TraktIds} ids - Person IDs
 */

/**
 * @typedef {object} WatchlistItem
 * @property {number} id - Watchlist ID
 * @property {number} rank - Rank of the item in the watchlist
 * @property {string} [notes] - User-added notes for the watchlist item
 * @property {string} listed_at - ISO 8601 UTC datetime when the item was added to the watchlist
 * @property {'movies'|'shows'|'seasons'|'episodes'} type - Type of item: movie, show, season, episode
 * @property {TraktMovie} [movie] - Movie data if type is movie
 * @property {TraktShow} [show] - Show data if type is show
 * @property {TraktSeason} [season] - Season data if type is season
 * @property {TraktEpisode} [episode] - Episode data if type is episode
 */

/**
 * @typedef {object} HistoryItem
 * @property {number} id - History ID
 * @property {string} watched_at - ISO 8601 UTC datetime when the item was watched
 * @property {string} action - Action (scrobble, checkin, etc.)
 * @property {'movies'|'shows'|'seasons'|'episodes'} type - Type of item: movie, show, season, episode
 * @property {TraktMovie} [movie] - Movie data if type is movie
 * @property {TraktShow} [show] - Show data if type is show
 * @property {TraktSeason} [season] - Season data if type is season
 * @property {TraktEpisode} [episode] - Episode data if type is episode
 */

/**
 * @typedef {object} RatingItem
 * @property {number} rating - Rating (1-10)
 * @property {string} rated_at - ISO 8601 UTC datetime when the item was rated
 * @property {'movies'|'shows'|'seasons'|'episodes'} type - Type of item: movie, show, season, episode
 * @property {TraktMovie} [movie] - Movie data if type is movie
 * @property {TraktShow} [show] - Show data if type is show
 * @property {TraktSeason} [season] - Season data if type is season
 * @property {TraktEpisode} [episode] - Episode data if type is episode
 */

/**
 * @typedef {object} FavoriteItem
 * @property {number} id - Favorite ID
 * @property {number} rank - Rank of the favorite
 * @property {string} [notes] - User-added notes for the favorite
 * @property {string} listed_at - ISO 8601 UTC datetime when the item was favorited
 * @property {'movies'|'shows'|'seasons'|'episodes'} type - Type of item: movie, show, season, episode
 * @property {TraktMovie} [movie] - Movie data if type is movie
 * @property {TraktShow} [show] - Show data if type is show
 * @property {TraktSeason} [season] - Season data if type is season
 * @property {TraktEpisode} [episode] - Episode data if type is episode
 */

/**
 * @typedef {object} WatchedItem
 * @property {number} plays - Number of plays for the item
 * @property {string} last_watched_at - ISO 8601 UTC datetime when the item was last watched
 * @property {string} last_updated_at - ISO 8601 UTC datetime when the item was last updated
 * @property {string} [reset_at] - ISO 8601 UTC datetime when the item was reset (available for shows and seasons, for a rewatch)
 * @property {TraktShow} [show] - Show data if type is show
 * @property {WatchedSeason[]} [seasons] - Array of watched seasons with episode details
 * @property {TraktMovie} [movie] - Movie data if type is movie
 * @property {TraktEpisode} [episode] - Episode data if type is episode
 */

/**
 * @typedef {object} WatchedSeason
 * @property {number} number - Season number
 * @property {WatchedEpisode[]} episodes - Array of watched episodes in this season
 */

/**
 * @typedef {object} WatchedEpisode
 * @property {number} number - Episode number
 * @property {number} plays - Number of plays for this episode
 * @property {string} last_watched_at - ISO 8601 UTC datetime when this episode was last watched
 */

/**
 * @typedef {object} TrendingItem
 * @property {number} watchers - Number of users watching
 * @property {TraktMovie} [movie] - Movie data if type is movie
 * @property {TraktShow} [show] - Show data if type is show
 */

/**
 * @typedef {object} SearchResult
 * @property {'movies'|'shows'|'episodes'|'person'|'list'} type - Type of result: movie, show, episode, person, list
 * @property {number} score - Search score
 * @property {TraktMovie} [movie] - Movie data if type is movie
 * @property {TraktShow} [show] - Show data if type is show
 * @property {TraktEpisode} [episode] - Episode data if type is episode
 * @property {TraktPerson} [person] - Person data if type is person
 * @property {object} [list] - List data if type is list
 */

export { };
