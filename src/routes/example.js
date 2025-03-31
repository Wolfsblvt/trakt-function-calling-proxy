import express from 'express';

import { NotFoundError } from '../utils/error-handler.js';
import { paramParser } from '../utils/param-parser.js';
import { createApiResponse } from '../utils/utils.js';

/** @import * as Props from '../trakt/types/props-types.js' */

const router = express.Router();

/**
 * Example route demonstrating proper error handling
 * @param {string} id - The resource identifier
 * @returns {Promise<any>} - The requested resource
 */
router.get('/:id', (req, res, next) => {
    try {
        // Parameter validation using paramParser
        const id = paramParser.stringStrict(req.params.id);

        // Simulate a database lookup
        const item = findItemById(id);

        // If item not found, throw a specific error
        if (!item) {
            throw new NotFoundError('Item', id);
        }

        // Create standardized response
        const response = createApiResponse([item], { itemCount: 1 });
        res.json(response);
    } catch (error) {
        // Pass any error to the global error handler
        next(error);
    }
});

/**
 * Mock function to simulate finding an item
 * @param {string} id - The item ID to find
 * @returns {object|null} - The found item or null
 */
function findItemById(id) {
    // Simulate database lookup
    if (id === 'test') {
        return { id: 'test', name: 'Test Item' };
    }
    return null;
}

export default router;
