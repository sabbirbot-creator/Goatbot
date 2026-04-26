# Sabbir Chat Bot

A Facebook Messenger chat bot (based on the Goat-Bot V2 / Fca-Horizon-Remastered stack) by Md Ariful Islam Sabbir.

## How it runs on Replit

- **Runtime:** Node.js 20 (`nodejs-20` module)
- **Workflow / Start command:** `npm start` → `node Sabbir.js`
- **Web preview port:** `5000` (host `0.0.0.0`)
- **Deployment target:** Reserved VM (`vm`) — the bot must stay running 24/7 to keep its Messenger listener alive. Autoscale is not appropriate.

### Process layout

1. `Sabbir.js` (root entry, run by `npm start`)
   - Prints the banner.
   - Starts an Express **keep-alive web server on port 5000 / 0.0.0.0**, which is what the Replit preview iframe shows.
   - Spawns the actual bot (`sabbir.js`) as a **child process**.
   - If the child exits (for example because Facebook cookies expired and the bot called `process.exit()`), the wrapper logs the exit and **automatically restarts the child after 10 seconds**.
   - The keep-alive page (`/`) shows bot status, restart count, last exit code, and last exit time.
   - `/healthz` returns the same info as JSON.

2. `sabbir.js` (the actual bot)
   - Sets up `global.GoatBot`, `global.db`, `global.client`.
   - Calls `require('./utils/login.js')` which logs into Facebook using cookies in `account.txt` and starts the Messenger listener.
   - The duplicate Express server inside this file is gated behind `if (!process.env.BOT_NO_HTTP)`. The wrapper sets `BOT_NO_HTTP=1` so only the parent serves port 5000 (avoids `EADDRINUSE`).

## Required system / native dependencies

These were installed via Replit's package manager:

- `python3` — required at install time by `yt-dlp-exec`'s post-install script.
- `libuuid` — required at runtime by the `canvas` native module (`libuuid.so.1`).

`better-sqlite3` is consumed from the root `node_modules` (v9.x has a prebuilt binary for Node 20). The `sabbir-fca` subpackage's `require("better-sqlite3")` falls back to the parent `node_modules`.

## Configuration files

- `config.json` — bot settings (prefix, admin IDs, FCA options, dashboard, log events).
- `configCommands.json` — env / banned-command state (auto-managed).
- `account.txt` — Facebook appstate (cookies). **The cookies in this repo are expired**; the bot will print `Appstate Cookie Của Bạn Đã Bị Lỗi` and exit until fresh cookies are dropped in. The keep-alive web server stays up regardless.
- `FastConfigFca.json` — settings for the FCA library. `HTML.HTML` is set to `false` so the FCA does not try to bind its own server on port 80 (which is unavailable in this container and would conflict with port 5000 anyway).

## Bot is not connecting to Facebook

That is expected on a fresh import — the saved cookies are stale. To re-enable the bot, replace the contents of `account.txt` with a fresh appstate exported from a logged-in Facebook session, then restart the workflow. The wrapper will pick it up on the next restart cycle.
