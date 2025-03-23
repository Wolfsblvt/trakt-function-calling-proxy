import { config } from '../config.js';

// API key authentication middleware
// Checks for a valid x-api-key header and compares it against the API_KEY from environment variables
export default function auth(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== config.API_KEY) {
        return res.status(401).json({ error: 'Unauthorized: Invalid API key' });
    }
    next();
}
