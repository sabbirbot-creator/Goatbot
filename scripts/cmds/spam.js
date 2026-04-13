const userCount = new Map();

const WARN_THRESHOLD = 3;
const KICK_THRESHOLD = 7;
const RESET_AFTER_MS = 30 * 1000;

function isSingleEmojiOrChar(body) {
  if (!body) return false;
  const trimmed = body.trim();
  return [...trimmed].length === 1;
}

async function handleSpam(api, threadID, senderID) {
  const adminList = global.GoatBot?.config?.adminBot || [];
  if (adminList.includes(String(senderID))) return;

  const botID = String(api.getCurrentUserID());
  if (String(senderID) === botID) return;

  const key = `${threadID}_${senderID}`;

  if (!userCount.has(key)) {
    userCount.set(key, { count: 0, warned: false, firstTime: Date.now() });
  }

  const entry = userCount.get(key);

  if (Date.now() - entry.firstTime > RESET_AFTER_MS) {
    entry.count = 0;
    entry.warned = false;
    entry.firstTime = Date.now();
  }

  entry.count++;

  if (entry.count >= KICK_THRESHOLD) {
    userCount.delete(key);
    try {
      await api.removeUserFromGroup(senderID, threadID);
      api.sendMessage(
        `🚫 Kicked!\n@${senderID} একটানা spam করেছে — group থেকে বের করা হয়েছে! 🦵`,
        threadID
      );
    } catch (e) {
      console.error("[SpamGuard] Kick error:", e?.message || e);
    }
    return;
  }

  if (entry.count === WARN_THRESHOLD && !entry.warned) {
    entry.warned = true;
    try {
      api.sendMessage(
        `⚠️ সতর্কতা!\n@${senderID} একটানা spam করা বন্ধ করো! 😤\nআরো ${KICK_THRESHOLD - WARN_THRESHOLD}টা করলেই kick! 🚫`,
        threadID
      );
    } catch (e) {
      console.error("[SpamGuard] Warning error:", e?.message || e);
    }
  }
}

function resetCount(threadID, senderID) {
  const key = `${threadID}_${senderID}`;
  userCount.delete(key);
}

module.exports.config = {
  name: "spam",
  version: "1.1.0",
  role: 0,
  credits: "Ariful Islam Sabbir",
  hasPermssion: 0,
  hidden: true,
  usePrefix: false,
  category: "System",
  countDown: 0,
  shortDescription: "Reaction + single emoji/msg spam guard",
  longDescription: "একটানা react বা single emoji/char msg দিলে warn ও kick করে",
  guide: { en: "" }
};

module.exports.onStart = async function () {};

module.exports.onChat = async function ({ api, event }) {
  const { threadID, senderID, body } = event;
  if (!body || !threadID || !senderID) return;

  const botID = String(api.getCurrentUserID());
  if (String(senderID) === botID) return;

  if (isSingleEmojiOrChar(body)) {
    await handleSpam(api, threadID, senderID);
  } else {
    resetCount(threadID, senderID);
  }
};

module.exports.onAnyEvent = async function ({ api, event }) {
  if (event.type !== "message_reaction") return;

  const { threadID, senderID, reaction } = event;
  if (!senderID || !threadID || !reaction) return;

  const botID = String(api.getCurrentUserID());
  if (String(senderID) === botID) return;

  await handleSpam(api, threadID, senderID);
};
