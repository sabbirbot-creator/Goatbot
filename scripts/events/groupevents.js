const SABBIR = "Ariful Islam Sabbir";
const { getName } = require("../../utils/getName.js");
const { animateSendLines } = require("../../utils/animation.js");

module.exports.config = {
  name: "groupevents",
  version: "1.2.0",
  role: 0,
  credits: "Ariful Islam Sabbir",
  description: "Group এর সব event animation style এ announce করে এবং bot memory update করে",
  category: "Events",
  countDown: 0
};

async function refreshThreadMemory(api, threadID, threadsData) {
  try {
    const info = await api.getThreadInfo(threadID);
    if (!info) return;

    const adminIDs = (info.adminIDs || []).map(a => (a && a.id) ? String(a.id) : String(a));
    const participantIDs = (info.participantIDs || []).map(String);

    const update = {
      threadName: info.threadName || info.name || "",
      memberCount: participantIDs.length,
      adminIDs,
      members: participantIDs,
      nicknames: info.nicknames || {},
      emoji: info.emoji || "",
      imageSrc: info.imageSrc || "",
      isGroup: info.isGroup !== false
    };

    if (threadsData && typeof threadsData.refreshInfo === "function") {
      await threadsData.refreshInfo(threadID, update);
    }

    if (global.db && Array.isArray(global.db.allThreadData)) {
      const idx = global.db.allThreadData.findIndex(t => String(t.threadID) === String(threadID));
      if (idx > -1) {
        global.db.allThreadData[idx] = { ...global.db.allThreadData[idx], ...update };
      } else {
        global.db.allThreadData.push({ threadID: String(threadID), ...update, data: {}, settings: {} });
      }
    }
  } catch (e) {}
}

async function announce(api, threadID, lines) {
  return animateSendLines(api, threadID, lines, {
    initialBody: "✨ ...",
    perLineMs: 180,
    isGroup: true,
    showTyping: true,
    typingMs: 1000
  });
}

module.exports.onStart = async function ({ api, event, threadsData }) {
  const { threadID, logMessageType, logMessageData, author } = event;
  if (!logMessageType) return;

  const authorName = author ? await getName(api, author, "কেউ একজন") : "কেউ একজন";
  let lines = null;

  switch (logMessageType) {
    case "log:thread-name": {
      const newName = (logMessageData && logMessageData.name) || "নতুন নাম";
      lines = [
        "╔══ ✏️ NAME CHANGED ✏️ ══╗",
        `👤 কে করেছে: ${authorName}`,
        `📝 নতুন নাম: ${newName}`,
        "╚══════════════════════╝"
      ];
      await refreshThreadMemory(api, threadID, threadsData);
      break;
    }

    case "log:thread-icon": {
      const icon = (logMessageData && logMessageData.thread_icon) || "🆕";
      lines = [
        "╔══ 🎭 EMOJI CHANGED 🎭 ══╗",
        `👤 কে করেছে: ${authorName}`,
        `✨ নতুন ইমোজি: ${icon}`,
        "╚══════════════════════╝"
      ];
      await refreshThreadMemory(api, threadID, threadsData);
      break;
    }

    case "log:thread-color": {
      const color = (logMessageData && (logMessageData.theme_color || logMessageData.color)) || "নতুন";
      lines = [
        "╔══ 🎨 THEME CHANGED 🎨 ══╗",
        `👤 কে করেছে: ${authorName}`,
        `🌈 নতুন থিম: ${color}`,
        "╚══════════════════════╝"
      ];
      await refreshThreadMemory(api, threadID, threadsData);
      break;
    }

    case "log:user-nickname": {
      const targetID = String((logMessageData && (logMessageData.participant_id || logMessageData.target)) || "");
      const botID = String(api.getCurrentUserID());
      await refreshThreadMemory(api, threadID, threadsData);
      if (targetID === botID) return;

      const newNick = (logMessageData && logMessageData.nickname) || null;
      const targetName = await getName(api, targetID, "একজন member");

      if (newNick) {
        lines = [
          "╔══ 📛 NICKNAME UPDATED 📛 ══╗",
          `👤 কে করেছে: ${authorName}`,
          `🙍 কার: ${targetName}`,
          `✏️ নতুন nickname: ${newNick}`,
          "╚══════════════════════╝"
        ];
      } else {
        lines = [
          "╔══ 📛 NICKNAME REMOVED 📛 ══╗",
          `👤 কে করেছে: ${authorName}`,
          `🙍 কার: ${targetName}`,
          "╚══════════════════════╝"
        ];
      }
      break;
    }

    case "log:thread-admins": {
      const targetID = logMessageData && logMessageData.target_id;
      const adminEvent = logMessageData && logMessageData.ADMIN_EVENT;
      const targetName = await getName(api, targetID, "একজন member");

      if (adminEvent === "add_admin") {
        lines = [
          "╔══ 🛡️ NEW ADMIN 🛡️ ══╗",
          `👤 কে করেছে: ${authorName}`,
          `⭐ নতুন Admin: ${targetName}`,
          "╚══════════════════════╝"
        ];
      } else if (adminEvent === "remove_admin") {
        lines = [
          "╔══ 🛡️ ADMIN REMOVED 🛡️ ══╗",
          `👤 কে করেছে: ${authorName}`,
          `❌ Remove হয়েছে: ${targetName}`,
          "╚══════════════════════╝"
        ];
      }
      await refreshThreadMemory(api, threadID, threadsData);
      break;
    }

    case "log:thread-approval-mode": {
      const enabled = (logMessageData && (logMessageData.approval_mode === 1 || logMessageData.approval_mode === "1"));
      lines = [
        "╔══ 🔐 APPROVAL MODE 🔐 ══╗",
        `👤 কে করেছে: ${authorName}`,
        `📌 অবস্থা: ${enabled ? "✅ চালু" : "❌ বন্ধ"}`,
        "╚══════════════════════╝"
      ];
      break;
    }

    case "log:thread-quick-reaction": {
      const reaction = (logMessageData && logMessageData.thread_quick_reaction) || "নতুন";
      lines = [
        "╔══ ⚡ QUICK REACTION ⚡ ══╗",
        `👤 কে করেছে: ${authorName}`,
        `💬 নতুন reaction: ${reaction}`,
        "╚══════════════════════╝"
      ];
      break;
    }

    case "log:subscribe":
    case "log:unsubscribe": {
      await refreshThreadMemory(api, threadID, threadsData);
      return;
    }

    default:
      return;
  }

  if (lines && lines.length > 0) {
    try { await announce(api, threadID, lines); } catch (_) {}
  }
};
