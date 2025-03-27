import express from 'express';
import { config } from './config.js';
import auth from './middleware/auth.js';
import watchlistRouter from './routes/watchlist.js';
import historyRouter from './routes/history.js';
import ratingsRouter from './routes/ratings.js';
import trendingRouter from './routes/trending.js';

const app = express();

app.use(express.json());

// Apply API key auth middleware
app.use(auth);

// Define routes
app.use('/watchlist', watchlistRouter);
app.use('/history', historyRouter);
app.use('/ratings', ratingsRouter);
app.use('/trending', trendingRouter);

// Root endpoint
app.get('/', (_, res) => {
    res.json({ message: 'Welcome to TaktBridge API Proxy' });
});

app.listen(config.PORT, () => {
    console.log(`Server is running on port ${config.PORT}`);
});
