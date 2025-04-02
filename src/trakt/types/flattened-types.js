/**
 * @typedef {object} FlattenedHistoryItem
 * @property {'movie'|'show'|'season'|'episode'} type - The type of media item
 *
 * @property {string} [title] - The main title (movie/show/episode)
 * @property {number} [year] - The release year of the item
 *
 * @property {string} [show_title] - Title of the show (for episodes/seasons)
 * @property {number} [show_year] - The release year of the show (for episodes/seasons)
 * @property {string} [episode_title] - Title of the episode (for episodes)
 * @property {number} [episode_number] - The episode number (for episodes)
 * @property {number} [season] - The season number (for episodes/seasons)
 *
 * @property {number} [rating] - User rating from 1 to 10 (if rated)
 * @property {number} plays - How many times the item has been watched
 * @property {string} watched_at - When the item was watched (ISO 8601)
 * @property {string} [last_watched_at] - Timestamp of most recent watch (ISO 8601)
 *
 * @property {boolean} [favorite] - Whether the item is marked as a favorite
 * @property {string} [favorite_note] - Optional user note explaining the favorite
 */

export { };
