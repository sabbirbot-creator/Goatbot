module.exports.config = {
  name: "tag",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "sabbir",
  description: "Mention করো — reply দিলে সেই ব্যক্তিকে, /tag all দিলে সবাইকে",
  usePrefix: true,
  category: "Group",
  usages: "tag [all] | reply করে tag",
  cooldowns: 5
};

module.exports.onStart = async function ({ api, message, event }) {
  const { threadID, senderID, messageReply, body } = event;

  const args = (body || "").trim().split(/\s+/);
  const sub = (args[1] || "").toLowerCase();

  if (sub === "all") {
    try {
      const threadInfo = await api.getThreadInfo(threadID);
      const botID = String(api.getCurrentUserID());
      const participants = (threadInfo.userInfo || []).filter(
        p => String(p.id) !== botID && String(p.id) !== String(senderID)
      );

      if (participants.length === 0) {
        return message.reply("❌ Tag করার মতো কেউ নেই।");
      }

      const CHUNK = 20;
      for (let i = 0; i < participants.length; i += CHUNK) {
        const chunk = participants.slice(i, i + CHUNK);
        const mentions = chunk.map(p => ({
          tag: `@${p.name}`,
          id: p.id,
          fromIndex: 0
        }));

        const tagText = chunk.map(p => `@${p.name}`).join(" ");
        await api.sendMessage({ body: tagText, mentions }, threadID);
      }
    } catch (err) {
      return message.reply("❌ সবাইকে tag করতে পারিনি।");
    }
    return;
  }

  if (messageReply) {
    const targetID = messageReply.senderID;
    let targetName = "User";

    try {
      const info = await api.getUserInfo([targetID]);
      if (info && info[targetID]) {
        targetName = info[targetID].name || "User";
      }
    } catch (e) {}

    const tagText = `@${targetName}`;
    const customMsg = args.slice(1).join(" ").trim();
    const body = customMsg ? `${tagText} ${customMsg}` : tagText;

    return api.sendMessage(
      {
        body,
        mentions: [{ tag: tagText, id: targetID, fromIndex: 0 }]
      },
      threadID
    );
  }

  return message.reply(
    "❓ কীভাবে ব্যবহার করবে:\n\n" +
    "• /tag all → সবাইকে mention করবে\n" +
    "• কোনো message এ reply করে /tag → সেই ব্যক্তিকে mention করবে"
  );
};
