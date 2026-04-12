# Project Overview

This is a Node.js Messenger bot project based on Goat Bot V2. The main startup entrypoint is `Sabbir.js`, which launches `sabbir.js`.

# Replit Configuration

- Runtime: Node.js 20
- Main workflow: `Start application`
- Startup command: `PORT=5000 node Sabbir.js`
- Expected web preview port: 5000
- Important local credential/runtime files such as `account.txt` and SQLite database files should not be committed.

# Recent Changes

- Installed existing npm dependencies for the Replit environment.
- Added local runtime and credential files to `.gitignore`.
- Added the expected `scripts/events` directory so command/event loading completes cleanly.
- Configured the Replit workflow to serve the web preview on port 5000.
