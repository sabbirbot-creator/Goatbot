module.exports.config = {
  name: "groupevents",
  version: "1.0.1",
  role: 0,
  credits: "Ariful Islam Sabbir",
  description: "Group এর সব event announce করে (nickname, theme, icon, name, admin ইত্যাদি)",
  category: "Events",
  countDown: 0
};

// নাম পাওয়ার জন্য উন্নত ফাংশন
async function getName(api, userID) {
  try {
    const info = await api.getUserInfo(String(userID));
    if (info && info[userID]) {
      return info[userID].name || "Facebook User";
    } else {
      return "কেউ একজন";
    }
  } catch (e) {
    console.log("Error getting name:", e);
    return "কেউ একজন";
  }
}

module.exports.onStart = async function ({ api, event }) {
  const { threadID, logMessageType, logMessageData, author } = event;
  if (!logMessageType) return;

  // Author এর নাম বের করা
  let authorName = "কেউ একজন";
  if (author) {
      authorName = await getName(api, author);
  }
  
  let msg = "";

  switch (logMessageType) {
    case "log:thread-name": {
      const newName = logMessageData?.name || "নতুন নাম";
      msg = `✏️ গ্রুপের নাম পরিবর্তন হয়েছে!\n\n👤 কে করেছে: ${authorName}\n📝 নতুন নাম: ${newName}`;
      break;
    }

    case "log:thread-icon": {
      const icon = logMessageData?.thread_icon || "🆕";
      msg = `🎭 গ্রুপের ইমোজি পরিবর্তন হয়েছে!\n\n👤 কে করেছে: ${authorName}\n✨ নতুন ইমোজি: ${icon}`;
      break;
    }

    case "log:thread-color": {
      const color = logMessageData?.theme_color || logMessageData?.color || "নতুন";
      msg = `🎨 গ্রুপের থিম পরিবর্তন হয়েছে!\n\n👤 কে করেছে: ${authorName}\n🌈 নতুন থিম কালার: ${color}`;
      break;
    }

    case "log:user-nickname": {
      const targetID = logMessageData?.participant_id || logMessageData?.target;
      const newNick = logMessageData?.nickname || null;
      const targetName = await getName(api, targetID);
      
      if (newNick) {
        msg = `📛 Nickname পরিবর্তন হয়েছে!\n\n👤 কে করেছে: ${authorName}\n🙍 কার: ${targetName}\n✏️ নতুন nickname: ${newNick}`;
      } else {
        msg = `📛 Nickname সরিয়ে দেওয়া হয়েছে!\n\n👤 কে করেছে: ${authorName}\n🙍 কার: ${targetName}`;
      }
      break;
    }

    case "log:thread-admins": {
      const targetID = logMessageData?.target_id;
      const adminEvent = logMessageData?.ADMIN_EVENT;
      const targetName = await getName(api, targetID);

      if (adminEvent === "add_admin") {
        msg = `🛡️ নতুন Admin যোগ হয়েছে!\n\n👤 কে করেছে: ${authorName}\n⭐ নতুন Admin: ${targetName}`;
      } else if (adminEvent === "remove_admin") {
        msg = `🛡️ Admin সরিয়ে দেওয়া হয়েছে!\n\n👤 কে করেছে: ${authorName}\n❌ Remove হয়েছে: ${targetName}`;
      }
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

    default:
      return;
  }

  if (msg) {
    return api.sendMessage(msg, threadID);
  }
};
