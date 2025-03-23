import express from 'express';
import traktClient from '../trakt/client.js';

const router = express.Router();

// GET /history - Fetches recently watched items
router.get('/', async (req, res) => {
    try {
    // TODO: Implement logic to fetch recently watched items from Trakt API
        const history = await traktClient.getHistory();
        res.json({ history });
    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).json({ error: 'Error fetching history' });
    }
});

export default router;
