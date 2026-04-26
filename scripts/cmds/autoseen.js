"use strict";

const SABBIR = "Ariful Islam Sabbir";
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

const sabbirState = loadState();

async function sabbirMarkSeen(api, threadID, messageID) {
  if (!api || !threadID) return;

  if (typeof api.markAsRead === "function") {
    try { await api.markAsRead(threadID, true); } catch (_) {}
  }

  if (typeof api.markAsReadAll === "function") {
    try { await api.markAsReadAll(); } catch (_) {}
  }

  if (messageID && typeof api.markAsDelivered === "function") {
    try { await api.markAsDelivered(threadID, messageID); } catch (_) {}
  }

  if (typeof api.markAsSeen === "function") {
    try { await api.markAsSeen(Date.now()); } catch (_) {}
  }
}

module.exports.config = {
  name: "autoseen",
  version: "8.0.0",
  role: 2,
  credits: SABBIR,
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
  const fresh = loadState();
  sabbirState.enabled = fresh.enabled;
};

module.exports.onStart = async function ({ message, args }) {
  const sub = (args[0] || "status").toLowerCase();

  if (sub === "on" || sub === "enable") {
    sabbirState.enabled = true;
    saveState(sabbirState);
    return message.reply("✅ Auto-seen চালু করা হয়েছে — সব message সাথে সাথে seen হবে।");
  }
  if (sub === "off" || sub === "disable") {
    sabbirState.enabled = false;
    saveState(sabbirState);
    return message.reply("⛔ Auto-seen বন্ধ করা হয়েছে।");
  }
  if (sub === "status" || sub === "stat") {
    return message.reply(`📖 Auto-seen status: ${sabbirState.enabled ? "✅ ON" : "⛔ OFF"}`);
  }
  return message.reply("📖 Usage:\n• autoseen on\n• autoseen off\n• autoseen status");
};

module.exports.onAnyEvent = async function ({ api, event }) {
  if (!sabbirState.enabled) return;
  if (!event || !event.threadID) return;

  const ignoreTypes = new Set(["typ", "presence"]);
  if (ignoreTypes.has(event.type)) return;

  const messageID =
    event.messageID ||
    (event.messageReply && event.messageReply.messageID) ||
    null;

  sabbirMarkSeen(api, event.threadID, messageID).catch(() => {});
};
