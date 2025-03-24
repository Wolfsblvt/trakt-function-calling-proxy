import express from 'express';
import traktClient from '../trakt/client.js';

const router = express.Router();

// GET /watchlist - Fetches the user's Trakt watchlist
router.get('/', async (req, res) => {
    try {
        const watchlist = await traktClient.getWatchlist();
        res.status(200).json({ watchlist });
    } catch (error) {
        console.error('Error fetching watchlist:', error);
        res.status(500).json({ error: 'Error fetching watchlist' });
    }
});

export default router;
