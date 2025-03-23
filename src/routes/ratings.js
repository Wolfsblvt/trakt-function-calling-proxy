import express from 'express';
import traktClient from '../trakt/client.js';

const router = express.Router();

// GET /ratings - Fetches user ratings
router.get('/', async (req, res) => {
    try {
    // TODO: Implement logic to fetch user ratings from Trakt API
        const ratings = await traktClient.getRatings();
        res.json({ ratings });
    } catch (error) {
        console.error('Error fetching ratings:', error);
        res.status(500).json({ error: 'Error fetching ratings' });
    }
});

export default router;
