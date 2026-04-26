const fs = require("fs");
const path = require("path");

const SABBIR_DIR = path.join(__dirname, "..", "..", "data");
const SABBIR_FILE = path.join(SABBIR_DIR, "autoseen.json");

function ensureDir() {
  try { if (!fs.existsSync(SABBIR_DIR)) fs.mkdirSync(SABBIR_DIR, { recursive: true }); } catch (_) {}
}

function loadState() {
  ensureDir();
  try {
    if (!fs.existsSync(SABBIR_FILE)) return { enabled: true };
    const raw = fs.readFileSync(SABBIR_FILE, "utf8");
    const data = JSON.parse(raw);
    return { enabled: data.enabled !== false };
  } catch (_) {
    return { enabled: true };
  }
}

function saveState(state) {
  ensureDir();
  try { fs.writeFileSync(SABBIR_FILE, JSON.stringify(state, null, 2)); } catch (_) {}
}

let state = loadState();

const recentSeen = new Map();
const SEEN_WINDOW_MS = 1500;

function shouldSeen(threadID) {
  const now = Date.now();
  const last = recentSeen.get(threadID) || 0;
  if (now - last < SEEN_WINDOW_MS) return false;
  recentSeen.set(threadID, now);
  if (recentSeen.size > 200) {
    const cutoff = now - SEEN_WINDOW_MS * 4;
    for (const [k, v] of recentSeen) if (v < cutoff) recentSeen.delete(k);
  }
  return true;
}

async function markThreadSeen(api, threadID, messageID) {
  if (!api || !threadID) return;
  try {
    if (messageID && typeof api.markAsDelivered === "function") {
      await api.markAsDelivered(threadID, messageID);
    }
  } catch (_) {}
  try {
    if (typeof api.markAsRead === "function") {
      await api.markAsRead(threadID, true);
    }
  } catch (_) {
    try { if (typeof api.markAsReadAll === "function") await api.markAsReadAll(); } catch (_) {}
  }
  try {
    if (typeof api.markAsSeen === "function") await api.markAsSeen(Date.now());
  } catch (_) {}
}

module.exports.config = {
  name: "autoseen",
  version: "7.0.0",
  role: 2,
  credits: "Ariful Islam Sabbir",
  hidden: false,
  usePrefix: true,
  category: "System",
  countDown: 0,
  shortDescription: "যেকোনো message সাথে সাথে seen করে",
  longDescription: "Bot যেই message পাবে সেটাই (text, sticker, attachment, reaction সহ) সাথে সাথে seen করে দিবে। Admin চাইলে on/off করতে পারবে।",
  guide: {
    bn: "{pn} on | off | status"
  }
};

module.exports.onLoad = function () {
  state = loadState();
};

module.exports.onStart = async function ({ message, args }) {
  const sub = (args[0] || "status").toLowerCase();
  if (sub === "on" || sub === "enable") {
    state.enabled = true;
    saveState(state);
    return message.reply("✅ Auto-seen চালু করা হয়েছে — সব message সাথে সাথে seen হবে।");
  }
  if (sub === "off" || sub === "disable") {
    state.enabled = false;
    saveState(state);
    return message.reply("⛔ Auto-seen বন্ধ করা হয়েছে।");
  }
  if (sub === "status" || sub === "stat") {
    return message.reply(`📖 Auto-seen status: ${state.enabled ? "✅ ON" : "⛔ OFF"}`);
  }
  return message.reply("📖 Usage:\n• autoseen on\n• autoseen off\n• autoseen status");
};

module.exports.onAnyEvent = async function ({ api, event }) {
  if (!state.enabled) return;
  if (!event || !event.threadID) return;

  const ignoreTypes = new Set(["typ", "presence", "read_receipt"]);
  if (ignoreTypes.has(event.type)) return;

  if (!shouldSeen(event.threadID)) return;

  const messageID =
    event.messageID ||
    (event.messageReply && event.messageReply.messageID) ||
    null;

  await markThreadSeen(api, event.threadID, messageID);
};
