const { getName } = require("../../utils/getName.js");

module.exports.config = {
  name: "groupevents",
  version: "1.1.0",
  role: 0,
  credits: "Ariful Islam Sabbir",
  description: "Group এর সব event announce করে এবং bot memory update করে",
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

module.exports.onStart = async function ({ api, event, threadsData }) {
  const { threadID, logMessageType, logMessageData, author } = event;
  if (!logMessageType) return;

  const authorName = author ? await getName(api, author, "কেউ একজন") : "কেউ একজন";
  let msg = "";

  switch (logMessageType) {
    case "log:thread-name": {
      const newName = logMessageData?.name || "নতুন নাম";
      msg = `✏️ গ্রুপের নাম পরিবর্তন হয়েছে!\n\n👤 কে করেছে: ${authorName}\n📝 নতুন নাম: ${newName}`;
      await refreshThreadMemory(api, threadID, threadsData);
      break;
    }

    case "log:thread-icon": {
      const icon = logMessageData?.thread_icon || "🆕";
      msg = `🎭 গ্রুপের ইমোজি পরিবর্তন হয়েছে!\n\n👤 কে করেছে: ${authorName}\n✨ নতুন ইমোজি: ${icon}`;
      await refreshThreadMemory(api, threadID, threadsData);
      break;
    }

    case "log:thread-color": {
      const color = logMessageData?.theme_color || logMessageData?.color || "নতুন";
      msg = `🎨 গ্রুপের থিম পরিবর্তন হয়েছে!\n\n👤 কে করেছে: ${authorName}\n🌈 নতুন থিম কালার: ${color}`;
      await refreshThreadMemory(api, threadID, threadsData);
      break;
    }

    case "log:user-nickname": {
      const targetID = logMessageData?.participant_id || logMessageData?.target;
      const newNick = logMessageData?.nickname || null;
      const targetName = await getName(api, targetID, "একজন member");

      if (newNick) {
        msg = `📛 Nickname পরিবর্তন হয়েছে!\n\n👤 কে করেছে: ${authorName}\n🙍 কার: ${targetName}\n✏️ নতুন nickname: ${newNick}`;
      } else {
        msg = `📛 Nickname সরিয়ে দেওয়া হয়েছে!\n\n👤 কে করেছে: ${authorName}\n🙍 কার: ${targetName}`;
      }
      await refreshThreadMemory(api, threadID, threadsData);
      break;
    }

    case "log:thread-admins": {
      const targetID = logMessageData?.target_id;
      const adminEvent = logMessageData?.ADMIN_EVENT;
      const targetName = await getName(api, targetID, "একজন member");

      if (adminEvent === "add_admin") {
        msg = `🛡️ নতুন Admin যোগ হয়েছে!\n\n👤 কে করেছে: ${authorName}\n⭐ নতুন Admin: ${targetName}`;
      } else if (adminEvent === "remove_admin") {
        msg = `🛡️ Admin সরিয়ে দেওয়া হয়েছে!\n\n👤 কে করেছে: ${authorName}\n❌ Remove হয়েছে: ${targetName}`;
      }
      await refreshThreadMemory(api, threadID, threadsData);
      break;
    }

    case "log:thread-approval-mode": {
      const enabled = logMessageData?.approval_mode === 1 || logMessageData?.approval_mode === "1";
      msg = `🔐 Group এ Join Approval ${enabled ? "চালু" : "বন্ধ"} হয়েছে!\n\n👤 কে করেছে: ${authorName}`;
      break;
    }

    case "log:thread-quick-reaction": {
      const reaction = logMessageData?.thread_quick_reaction || "নতুন";
      msg = `⚡ Quick Reaction পরিবর্তন হয়েছে!\n\n👤 কে করেছে: ${authorName}\n💬 নতুন reaction: ${reaction}`;
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

  if (msg) {
    return api.sendMessage(msg, threadID);
  }
};
