module.exports.config = {
  name: "groupevents",
  version: "1.0.0",
  role: 0,
  credits: "Ariful Islam Sabbir",
  description: "Group এর সব event announce করে (nickname, theme, icon, name, admin ইত্যাদি)",
  category: "Events",
  countDown: 0
};

async function getName(api, userID) {
  try {
    const info = await api.getUserInfo([String(userID)]);
    return (info && info[userID]) ? info[userID].name || "কেউ একজন" : "কেউ একজন";
  } catch (e) {
    return "কেউ একজন";
  }
}

module.exports.onStart = async function ({ api, event }) {
  const { threadID, logMessageType, logMessageData, author } = event;
  if (!logMessageType) return;

  const authorName = author ? await getName(api, author) : "কেউ একজন";
  let msg = null;

  switch (logMessageType) {

    // ─── Group name change ───
    case "log:thread-name": {
      const newName = logMessageData?.name || "নতুন নাম";
      msg =
        `✏️ গ্রুপের নাম পরিবর্তন হয়েছে!\n\n` +
        `👤 কে করেছে: ${authorName}\n` +
        `📝 নতুন নাম: ${newName}`;
      break;
    }

    // ─── Group icon/emoji change ───
    case "log:thread-icon": {
      const icon = logMessageData?.thread_icon || "🆕";
      msg =
        `🎭 গ্রুপের ইমোজি পরিবর্তন হয়েছে!\n\n` +
        `👤 কে করেছে: ${authorName}\n` +
        `✨ নতুন ইমোজি: ${icon}`;
      break;
    }

    // ─── Group theme/color change ───
    case "log:thread-color": {
      const color = logMessageData?.theme_color || logMessageData?.color || "নতুন";
      msg =
        `🎨 গ্রুপের থিম পরিবর্তন হয়েছে!\n\n` +
        `👤 কে করেছে: ${authorName}\n` +
        `🌈 নতুন থিম কালার: ${color}`;
      break;
    }

    // ─── Nickname change ───
    case "log:user-nickname": {
      const targetID = logMessageData?.participant_id || logMessageData?.target;
      const newNick = logMessageData?.nickname || null;
      const targetName = targetID ? await getName(api, targetID) : "কেউ একজন";
      if (newNick) {
        msg =
          `📛 Nickname পরিবর্তন হয়েছে!\n\n` +
          `👤 কে করেছে: ${authorName}\n` +
          `🙍 কার: ${targetName}\n` +
          `✏️ নতুন nickname: ${newNick}`;
      } else {
        msg =
          `📛 Nickname সরিয়ে দেওয়া হয়েছে!\n\n` +
          `👤 কে করেছে: ${authorName}\n` +
          `🙍 কার: ${targetName}`;
      }
      break;
    }

    // ─── Admin change ───
    case "log:thread-admins": {
      const targetID = logMessageData?.target_id || logMessageData?.adminEventType;
      const isAdded = logMessageData?.adminEventType === "change_thread_admin_setting"
        ? null
        : String(logMessageData?.ADMIN_EVENT) !== "remove_admin";
      const targetName = targetID ? await getName(api, targetID) : "কেউ একজন";

      if (isAdded === null) {
        msg =
          `🛡️ Admin সেটিং পরিবর্তন হয়েছে!\n\n` +
          `👤 কে করেছে: ${authorName}`;
      } else if (isAdded) {
        msg =
          `🛡️ নতুন Admin যোগ হয়েছে!\n\n` +
          `👤 কে করেছে: ${authorName}\n` +
          `⭐ নতুন Admin: ${targetName}`;
      } else {
        msg =
          `🛡️ Admin সরিয়ে দেওয়া হয়েছে!\n\n` +
          `👤 কে করেছে: ${authorName}\n` +
          `❌ Remove হয়েছে: ${targetName}`;
      }
      break;
    }

    // ─── Approval mode change ───
    case "log:thread-approval-mode": {
      const enabled = logMessageData?.approval_mode === 1 || logMessageData?.approval_mode === "1";
      msg =
        `🔐 Group এ Join Approval ${enabled ? "চালু" : "বন্ধ"} হয়েছে!\n\n` +
        `👤 কে করেছে: ${authorName}`;
      break;
    }

    // ─── Message pinned (if supported) ───
    case "log:thread-pinned-message": {
      msg =
        `📌 একটি message pin করা হয়েছে!\n\n` +
        `👤 কে করেছে: ${authorName}`;
      break;
    }

    // ─── Quick reactions changed ───
    case "log:thread-quick-reaction": {
      const reaction = logMessageData?.thread_quick_reaction || "নতুন";
      msg =
        `⚡ Quick Reaction পরিবর্তন হয়েছে!\n\n` +
        `👤 কে করেছে: ${authorName}\n` +
        `💬 নতুন reaction: ${reaction}`;
      break;
    }

    default:
      return;
  }

  if (msg) {
    try {
      await api.sendMessage(msg, threadID);
    } catch (e) {}
  }
};
