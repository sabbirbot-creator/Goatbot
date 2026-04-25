const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const FILE = path.join(DATA_DIR, "lastSeen.json");

let map = {};
let dirty = false;

function load() {
        try {
                if (fs.existsSync(FILE)) {
                        map = JSON.parse(fs.readFileSync(FILE, "utf8")) || {};
                }
        } catch (e) {
                console.log("[activityTracker] load error:", e.message);
                map = {};
        }
}

function save() {
        try {
                if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
                fs.writeFileSync(FILE, JSON.stringify(map));
                dirty = false;
        } catch (e) {
                console.log("[activityTracker] save error:", e.message);
        }
}

function record(threadID, userID) {
        if (!threadID || !userID) return;
        const t = String(threadID), u = String(userID);
        if (!map[t]) map[t] = {};
        map[t][u] = Date.now();
        dirty = true;
}

function getLastSeen(threadID, userID) {
        const t = map[String(threadID)];
        return t ? (t[String(userID)] || null) : null;
}

function getAllForThread(threadID) {
        return map[String(threadID)] || {};
}

setInterval(() => { if (dirty) save(); }, 30000);
process.on("SIGINT", () => { save(); process.exit(0); });
process.on("SIGTERM", () => { save(); process.exit(0); });

load();

module.exports = { record, getLastSeen, getAllForThread, save };
