# TaktBridge

[![Status: historical prototype](https://img.shields.io/badge/status-historical_prototype-6b7280?style=flat-square)](#maintenance-status)
[![Surface: read-only HTTP JSON](https://img.shields.io/badge/surface-read--only_HTTP_JSON-2563eb?style=flat-square)](#exposed-http-api)
[![Source target: Trakt API v2](https://img.shields.io/badge/source_target-Trakt_API_v2-e11d48?style=flat-square)](#provider-and-integration-age)

**A single-user Trakt proxy that reshapes watch history and ratings into compact JSON for model-facing tools.**

> [!WARNING]
> **This is historical source, not a maintained production service.** The current implementation logs the Trakt access token to process output during OAuth refresh, keeps credentials in `.env`, and caches account data on disk. Current Trakt, Render, Custom GPT, and SillyTavern compatibility has not been verified. Do not expose it unchanged.

TaktBridge was built to put a narrow, model-friendly layer in front of the much broader [Trakt](https://trakt.tv) API. A caller sends authenticated HTTP `GET` requests; the service fetches one user's Trakt data, enriches related records, flattens nested provider responses, and returns a smaller JSON shape with counts, context, and usage tips.

Here, **“function-callable” is the project's original name for ordinary HTTP JSON endpoints shaped for an external tool**. This repository does not contain an OpenAPI document, Custom GPT Action schema, MCP server, or SillyTavern extension.

## Architecture

```text
caller or model-facing client
          |
          | HTTP GET + x-api-key
          v
Express routes and parameter validation
          |
          v
data service + persistent query cache  ---->  .cache/queries
          |
          | cache miss / enrichment reads
          v
single-user Trakt client (API v2)
          |
          | OAuth refresh token from .env
          v
Trakt API
          |
          v
enrichment + flattening -> compact JSON response
```

The main pieces are:

- [`src/server.js`](src/server.js) — Express startup, global API-key middleware, and mounted routes.
- [`src/routes/`](src/routes/) — the exposed history and ratings HTTP surface.
- [`src/trakt/client.js`](src/trakt/client.js) — Trakt API v2 requests, pagination, and OAuth refresh.
- [`src/cache/`](src/cache/) — in-memory and `node-persist` disk caching.
- [`src/services/`](src/services/) — enrichment, filtering, statistics, and response flattening.

## Exposed HTTP API

Every route, including `/`, requires this header:

```http
x-api-key: <the value of API_KEY>
```

| Method and path | Current source behavior |
| --- | --- |
| `GET /` | Returns an authenticated welcome response. Useful as a process-level smoke check only; it does not contact Trakt or prove provider compatibility. |
| `GET /history` | Returns flattened watch history. Supports `type`, `limit`, and `last_x_days`; the default limit is 50. |
| `GET /history/get-by-date-range` | Returns history between required ISO-8601 `start_at` and `end_at` values, with optional `type`. |
| `GET /ratings` | Returns flattened ratings. Supports `type`, `min_rating`, `max_rating`, `limit`, `sort_by`, `order`, `include_unwatched`, and `include_stats`; the default limit is 50. |

Successful collection responses follow this general shape:

```json
{
  "count": 2,
  "total": 137,
  "_info": "Human-readable context about the result",
  "_tips": ["Optional usage guidance"],
  "data": []
}
```

Ratings may also include a top-level `stats` object. History and ratings are enriched from additional Trakt datasets such as watched items, favorites, ratings, and account statistics before being flattened.

The Trakt client contains internal methods for watchlists and other datasets, but **the current server does not mount a `/watchlist` route**. The old README advertised one; the running HTTP surface in `src/server.js` does not provide it.

## Run the historical implementation

Use this route only in a private development environment while assessing and repairing the implementation.

### Prerequisites

- Node.js and npm. The repository does **not** declare a supported Node.js version.
- An existing Trakt application client ID and client secret.
- A refresh token for one Trakt user. This repository does not implement the user authorization/bootstrap flow that obtains it.
- A separate random secret to use as the proxy's `API_KEY`.

### Install and configure

```bash
git clone https://github.com/Wolfsblvt/trakt-function-calling-proxy.git
cd trakt-function-calling-proxy
npm ci
```

Copy `.env.example` to `.env`:

```bash
# POSIX shells
cp .env.example .env

# PowerShell
Copy-Item .env.example .env
```

Then set:

```dotenv
API_KEY=replace-with-a-random-proxy-secret
APP_CLIENT_ID=replace-with-your-trakt-client-id
APP_CLIENT_SECRET=replace-with-your-trakt-client-secret
REFRESH_TOKEN=replace-with-the-user-refresh-token
PORT=3000
```

Do not commit `.env`. It is ignored by Git, but the application rewrites it when Trakt rotates the refresh token.

### Start and reach the first local response

```bash
npm start
```

In another shell:

```bash
curl -H "x-api-key: replace-with-a-random-proxy-secret" \
  http://localhost:3000/
```

Expected process-level response:

```json
{"message":"Welcome to TaktBridge API Proxy"}
```

That response proves only that Express started and accepted the proxy key. A provider-backed request would be:

```bash
curl -H "x-api-key: replace-with-a-random-proxy-secret" \
  "http://localhost:3000/history?limit=10"
```

No Trakt or other provider request was made while qualifying this README, so successful OAuth refresh and current response compatibility remain unobserved.

## Trust and data boundary

This proxy holds substantially more authority and data than its small HTTP surface suggests:

| Material | Current behavior |
| --- | --- |
| Proxy access | One static `API_KEY` protects every route through exact `x-api-key` comparison. There are no users, roles, scopes, or built-in key rotation. |
| Trakt credentials | One client secret and one user's refresh token are loaded from `.env`. Refresh-token rotation rewrites that file in plaintext. |
| Access token | Kept in memory, but the current refresh path also prints it to process output. Treat existing logs as sensitive. |
| Account data | Trakt responses are cached in memory and under `.cache/queries`; history, ratings, watched items, favorites, and statistics may all be fetched for enrichment. |
| Transport and abuse controls | The Express application supplies no HTTPS termination, rate limiting, or multi-user isolation. The included Render declaration does not document those controls. |

The exposed account-data operations are read-only `GET` requests. OAuth token refresh is a credential operation, and the service's local cache and logs remain operator-controlled copies of private account data.

Before any real deployment, at minimum remove secret logging, establish a current Trakt authorization flow, define credential and cache lifecycle, add transport/rate-limit controls, and test the exact consumer integration.

## Provider and integration age

| Surface | Established by this repository | Not established |
| --- | --- | --- |
| Trakt | Source targets `https://api.trakt.tv`, sends `trakt-api-version: 2`, refreshes OAuth tokens, and uses an out-of-band redirect URI. | Whether those endpoints, parameters, token behavior, or redirect assumptions are accepted by Trakt now. |
| Model/tool integration | Compact JSON endpoints and model-oriented `_info` / `_tips` fields. | Any current Custom GPT, SillyTavern, OpenAPI, MCP, or function-schema compatibility. |
| Render | [`render.yaml`](render.yaml) declares a Node web service using `npm install` and `npm start`. | A live deployment, current plan compatibility, configured secrets, persistent cache, TLS policy, or successful provider traffic. |
| API documentation helper | `npm run dev:download-docs:trakt` downloads an API Blueprint document from the source-era Apiary endpoint into ignored `.docs/`. | That the downloaded document is current or that the application conforms to it. |

No successor is named in this repository.

## Development and verification

The codebase is JavaScript ES modules with JSDoc types and `checkJs` enabled through [`jsconfig.json`](jsconfig.json).

Available package scripts:

| Command | Purpose |
| --- | --- |
| `npm start` | Run `node src/server.js`. |
| `npm run dev:start` | Run the server through `nodemon`. |
| `npm run dev:download-docs:trakt` | Contact the configured source-era documentation endpoint and write `.docs/trakt.apib`. |

There is no checked-in automated test suite, no GitHub Actions workflow, and no `test`, `lint`, `typecheck`, or build script in `package.json`. The repository therefore supplies source structure, not a maintained executable compatibility proof.

## Maintenance status

TaktBridge is a **dormant historical prototype**. Runtime code last changed on **10 April 2025**. The repository has no published releases, no automated test/CI surface, and no source-named successor.

It remains useful as a compact reference for:

- wrapping a provider API behind a small authenticated HTTP surface;
- paginating and caching account data;
- enriching related Trakt records; and
- flattening nested media data for a constrained model context.

Treat it as source to study or fork, not a service to deploy unchanged. A maintained revival would need current provider qualification, security repair, integration schemas, tests, and an explicit support/compatibility boundary.

## License

TaktBridge is licensed under the [GNU Affero General Public License v3.0](LICENSE).
