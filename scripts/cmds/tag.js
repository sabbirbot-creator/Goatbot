const { getName } = require("../../utils/getName.js");

module.exports.config = {
  name: "tag",
  version: "1.3.0",
  role: 0,
  credits: "Ariful Islam Sabbir",
  hidden: false,
  usePrefix: true,
  category: "Chat",
  countDown: 2
};

module.exports.onStart = async ({ api, event, args, message }) => {
  const { threadID, type, messageReply, mentions } = event;

  let mentionsArr = [];
  let body = "";

  if (type === "message_reply" && messageReply) {
    const uid = String(messageReply.senderID);
    const name = await getName(api, uid, "User");
    mentionsArr.push({ tag: name, id: uid });
    body = `📢 ${name} — তোরে ডাকা হচ্ছে 🐸`;
  }
  else if (mentions && Object.keys(mentions).length > 0) {
    for (const id in mentions) {
      const tag = (mentions[id] || "").replace(/^@/, "") || await getName(api, id, "User");
      mentionsArr.push({ tag, id: String(id) });
    }
    body = `📢 ${mentionsArr.map(m => m.tag).join(", ")} — তোরে ডাকা হচ্ছে 🐸`;
  }
  else if (args.length > 0) {
    const input = args.join(" ").toLowerCase();
    if (input === "all" || input === "everyone") {
      try {
        const threadInfo = await api.getThreadInfo(threadID);
        const botID = String(api.getCurrentUserID());
        mentionsArr = (threadInfo.participantIDs || [])
          .map(String)
          .filter(id => id !== botID)
          .map(id => ({ tag: "@everyone", id }));
        body = "📢 @everyone\nসবাই চিপা থেকে বের হও 🐸";
      } catch (e) {
        return message.reply("❌ Group info নিতে পারছি না");
      }
    } else {
      return message.reply("⚠️ কাউকে tag করতে @mention বা reply ব্যবহার করো\n📌 সবাইকে tag করতে: /tag all");
    }
  }
  else {
    return message.reply("⚠️ Reply দাও, @mention করো অথবা /tag all লিখো");
  }

  return api.sendMessage({ body, mentions: mentionsArr }, threadID);
};
