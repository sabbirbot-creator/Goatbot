module.exports.config = {
  name: "kick",
  version: "1.0.0",
  hasPermssion: 1,
  credits: "sabbir",
  description: "Group থেকে কাউকে বের করো",
  usePrefix: true,
  category: "Group",
  usages: "kick @mention",
  cooldowns: 5
};

module.exports.onStart = async function ({ api, message, event }) {
  const { mentions, threadID, senderID } = event;
  const mentionIDs = Object.keys(mentions || {});

  if (mentionIDs.length === 0) {
    return message.reply("❌ কাকে kick করবে? কাউকে mention করো!\nযেমন: /kick @name");
  }

  const adminList = global.GoatBot?.config?.adminBot || [];
  const botID = String(api.getCurrentUserID());

  for (const uid of mentionIDs) {
    if (adminList.includes(String(uid)) || String(uid) === botID) {
      return message.reply(`🚫 Admin বা Bot কে kick করা যাবে না!`);
    }
  }

  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const adminIDs = (threadInfo.adminIDs || []).map(a => String(a.id));

    if (!adminIDs.includes(String(senderID)) && !adminList.includes(String(senderID))) {
      return message.reply("🚫 শুধু group admin kick করতে পারবে!");
    }

    for (const uid of mentionIDs) {
      const name = mentions[uid].replace("@", "");
      await api.removeUserFromGroup(uid, threadID);
      await message.reply(`✅ ${name} কে group থেকে বের করা হয়েছে! 🦵`);
    }
  } catch (err) {
    return message.reply("❌ Kick করতে পারিনি। Bot এর admin permission আছে কি?");
  }
};
