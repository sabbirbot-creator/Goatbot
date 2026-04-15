# SABBIR CHAT BOT

## Overview
A Facebook Messenger chat bot built on Node.js. It automates responses, handles commands, and manages Facebook group/user interactions. Based on a customized Goat-Bot-V2/Mirai architecture.

## Architecture
- **Runtime:** Node.js v20
- **Entry Point:** `Sabbir.js` (process manager) → spawns `sabbir.js` (main bot logic)
- **Facebook API:** Custom local library at `sabbir-fca/` (ws3-fca v3.5.2)
- **Database:** SQLite via Sequelize ORM (`includes/data.sqlite`)
- **Web Server:** Express.js keepalive server on port 3000
- **Package Manager:** npm

## Project Structure
- `Sabbir.js` - Process manager wrapper with auto-restart
- `sabbir.js` - Main bot initialization and Express server
- `bot/` - Core login and session management
- `scripts/cmds/` - Bot commands (16 loaded)
- `scripts/events/` - Event handlers
- `includes/` - Database models, controllers, message handlers
- `sabbir-fca/` - Local Facebook Chat API library
- `languages/` - Localization files (English, Bengali)
- `config.json` - Bot configuration (admin IDs, prefix, FCA options)
- `account.txt` - Facebook session cookies (fbstate)
- `configCommands.json` - Command-specific configuration

## Key Configuration
- Bot prefix: `/`
- Language: Bengali (bn.json)
- Express server port: 3000 (PORT env var)
- Time zone: Asia/Dhaka

## System Dependencies
- `python3` - Required by yt-dlp-exec package
- `libuuid` - Required by canvas package

## Running
```bash
npm start
```

## Notes
- Bot connects to Facebook Messenger via MQTT WebSocket
- Reconnects automatically every ~49 minutes
- One command (`autoseen.js`) has a known minor error but doesn't prevent the bot from running
