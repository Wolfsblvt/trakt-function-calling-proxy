import express from 'express';

import { config } from './config.js';
import auth from './middleware/auth.js';
import ratingsRouter from './routes/ratings.js';

const app = express();

app.use(express.json());

// Apply API key auth middleware
app.use(auth);

// Define routes
app.use('/ratings', ratingsRouter);

// Root endpoint
app.get('/', (_, res) => {
    res.json({ message: 'Welcome to TaktBridge API Proxy' });
});

app.listen(config.PORT, () => {
    console.log(`Server is running on port ${config.PORT}`);
});
