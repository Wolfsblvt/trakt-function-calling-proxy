# TaktBridge

TaktBridge is a self-hosted proxy for accessing the [Trakt.tv](https://trakt.tv) API in a function-callable way. This backend-only API server is designed to work with tools like Custom GPTs or SillyTavern.

## Features
- Proxy for Trakt.tv API using raw fetch requests
- API key authentication via `x-api-key` header
- Modular and clean structure
- Easy to extend for multi-user auth/token setups in the future

## Setup
1. Rename `.env.example` to `.env` and fill in your API credentials.
2. Run `npm install` to install dependencies.
3. Run `npm start` to start the server.

## Endpoints
- `GET /watchlist` - Fetches the user's Trakt watchlist
- `GET /history` - Fetches the user's recently watched items
- `GET /ratings` - Fetches the user's ratings

## Deployment
A `render.yaml` file is included for deploying on Render.com.
