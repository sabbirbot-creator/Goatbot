"use strict";

const { printBanner } = require("./utils/branding");
printBanner();

const express = require("express");
const { spawn } = require("child_process");
const path = require("path");

const PORT = process.env.PORT || 5000;

const app = express();
let lastBotStatus = "starting";
let lastBotExitCode = null;
let lastBotExitTime = null;
let restartCount = 0;
const startedAt = Date.now();

app.get("/", (req, res) => {
    res.type("html").send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>SABBIR CHAT BOT</title>
<style>
body{font-family:system-ui,Segoe UI,Arial,sans-serif;background:#0f172a;color:#e2e8f0;margin:0;padding:40px;}
.card{max-width:560px;margin:40px auto;background:#1e293b;border-radius:14px;padding:32px;box-shadow:0 10px 30px rgba(0,0,0,.35);}
h1{margin:0 0 8px;font-size:24px;}
.tag{display:inline-block;padding:4px 10px;border-radius:999px;background:#22c55e;color:#0f172a;font-weight:600;font-size:12px;}
.tag.warn{background:#f59e0b;}
.tag.err{background:#ef4444;color:#fff;}
.row{margin-top:14px;display:flex;justify-content:space-between;border-bottom:1px solid #334155;padding:8px 0;}
.row b{color:#94a3b8;font-weight:500;}
small{color:#94a3b8;}
</style>
</head>
<body>
<div class="card">
<h1>SABBIR CHAT BOT</h1>
<p><span class="tag ${lastBotStatus === "running" ? "" : lastBotStatus === "starting" ? "warn" : "err"}">${lastBotStatus.toUpperCase()}</span></p>
<div class="row"><b>Owner</b><span>Md Ariful Islam Sabbir</span></div>
<div class="row"><b>Server uptime</b><span>${Math.floor((Date.now() - startedAt) / 1000)}s</span></div>
<div class="row"><b>Restart attempts</b><span>${restartCount}</span></div>
<div class="row"><b>Last bot exit code</b><span>${lastBotExitCode === null ? "—" : lastBotExitCode}</span></div>
<div class="row"><b>Last bot exit time</b><span>${lastBotExitTime ? new Date(lastBotExitTime).toLocaleString() : "—"}</span></div>
<p><small>This page is the keep-alive endpoint. The Messenger bot runs as a child process and will be restarted automatically when it stops.</small></p>
</div>
</body>
</html>`);
});

app.get("/healthz", (req, res) => {
    res.json({
        ok: true,
        botStatus: lastBotStatus,
        restartCount,
        lastBotExitCode,
        lastBotExitTime,
        uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000)
    });
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`[KEEP-ALIVE] Server is running on port ${PORT}`);
});

function startBotProcess() {
    lastBotStatus = "running";
    restartCount += 1;
    const child = spawn(process.execPath, [path.join(__dirname, "sabbir.js")], {
        cwd: __dirname,
        stdio: "inherit",
        env: { ...process.env, BOT_NO_HTTP: "1" }
    });

    child.on("exit", (code, signal) => {
        lastBotStatus = "stopped";
        lastBotExitCode = code !== null ? code : signal;
        lastBotExitTime = Date.now();
        const delay = 10000;
        console.log(`[KEEP-ALIVE] Bot exited (code=${code}, signal=${signal}). Restarting in ${delay / 1000}s...`);
        setTimeout(startBotProcess, delay);
    });
}

startBotProcess();

process.on("unhandledRejection", (err) => console.error("[KEEP-ALIVE] unhandledRejection:", err));
process.on("uncaughtException", (err) => console.error("[KEEP-ALIVE] uncaughtException:", err));
