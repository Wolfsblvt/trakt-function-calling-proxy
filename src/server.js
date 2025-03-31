import express from 'express';

import { config } from './config.js';
import auth from './middleware/auth.js';
import { errorMiddleware } from './middleware/error-middleware.js';
import historyRouter from './routes/history.js';

const app = express();

app.use(express.json());

// Apply API key auth middleware
app.use(auth);

// Define routes
app.use('/history', historyRouter);

// Root endpoint
app.get('/', (_, res) => {
    res.json({ message: 'Welcome to TaktBridge API Proxy' });
});

// Global error handling middleware (must be after all routes)
app.use(errorMiddleware);

app.listen(config.PORT, () => {
    console.log(`Server is running on port ${config.PORT}`);
});
