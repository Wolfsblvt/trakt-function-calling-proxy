import dotenv from 'dotenv';
import fs from 'node:fs';

dotenv.config();

/**
 * @typedef {object} Config
 * @property {string} APP_CLIENT_ID
 * @property {string} APP_CLIENT_SECRET
 * @property {string} REFRESH_TOKEN
 * @property {string} API_KEY
 * @property {number} PORT
 */

/** @type {Config} */
export const config = {
    API_KEY: process.env.API_KEY || '',
    APP_CLIENT_ID: process.env.APP_CLIENT_ID || '',
    APP_CLIENT_SECRET: process.env.APP_CLIENT_SECRET || '',
    REFRESH_TOKEN: process.env.REFRESH_TOKEN || '',
    PORT: Number(process.env.PORT) || 3_000,
};

/**
 * Saves the config persistently to the `.env` file
 */
export function saveConfig() {
    const envFile = Object.entries(config).map(([key, value]) => `${key}=${value}`).join('\n');
    fs.writeFileSync('.env', envFile);
}

