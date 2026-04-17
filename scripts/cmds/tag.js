  module.exports.config = {
  name: "tag",
  version: "6.0.0",
  hasPermssion: 0,
  credits: "SABBIR",
  description: "Reply, mention, বা সবাইকে tag করা",
  commandCategory: "group",
  usages: "/tag [@mention/all]",
  cooldowns: 2
};

module.exports.run = async ({ api, event, args }) => {
  const threadID = event.threadID;

  let mentions = [];
  let body = "";

  // ✅ 1. Reply দিলে → ওই user tag
  if (event.type === "message_reply") {
    const uid = event.messageReply.senderID;

    try {
      const userInfo = await api.getUserInfo(uid);                                                                                                                                                                         const name = userInfo[uid]?.name || "User";

      mentions.push({
        tag: name,
        id: uid
      });

      body = `📢 ${name} — তোরে ডাকা হচ্ছে 🐸`;

    } catch (e) {
      return api.sendMessage("❌ Name আনতে সমস্যা হয়েছে", threadID);
    }
  }

  // ✅ 2. args থাকলে
  else if (args.length > 0) {
    const input = args.join(" ").toLowerCase();

    // 👉 all দিলে
    if (input === "all" || input === "everyone") {
      try {
        const threadInfo = await api.getThreadInfo(threadID);

        mentions = threadInfo.participantIDs
          .filter(id => id != api.getCurrentUserID())
          .map(id => ({
            tag: "@everyone",
            id: id
          }));

        body = "📢 @everyone\nসবাই চিপা থেকে বের হও 🐸";

      } catch (e) {
        return api.sendMessage("❌ Group info নিতে পারছি না", threadID);
      }
    }

    // 👉 @mention দিলে
    else if (Object.keys(event.mentions).length > 0) {
      for (let id in event.mentions) {
        mentions.push({
          tag: event.mentions[id],
          id: id
        });
      }

      body = `📢 ${Object.values(event.mentions).join(", ")} — তোরে ডাকা হচ্ছে 🐸`;
    }

    else {
      return api.sendMessage("⚠️ কাউকে tag করতে @mention বা reply ব্যবহার করো", threadID);
    }
  }

  // ❌ কিছুই না দিলে
  else {
    return api.sendMessage("⚠️ Reply দাও বা @mention ব্যবহার করো", threadID);
  }

  // ✅ Final send
  return api.sendMessage({
    body,
    mentions
  }, threadID);
};
