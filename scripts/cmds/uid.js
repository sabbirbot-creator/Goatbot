module.exports.config = {
  name: "uid",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Ariful Islam Sabbir",
  description: "নিজের বা অন্যের UID দেখাও",
  usePrefix: true,
  category: "Info",
  usages: "uid [@mention | reply]",
  cooldowns: 3
};

async function resolveTargets(api, event) {
  const { mentions, senderID, messageReply, threadID, body } = event;

  const mentionIDs = mentions && typeof mentions === "object"
    ? Object.keys(mentions).filter(id => id && id !== "null" && id !== senderID)
    : [];

  if (mentionIDs.length > 0) {
    return mentionIDs.map(uid => ({
      uid,
      name: (mentions[uid] || "").replace(/^@/, "").trim() || uid
    }));
  }

  if (messageReply) {
    return [{ uid: messageReply.senderID, name: null }];
  }

  const args = (body || "").trim().split(/\s+/);
  const nameQuery = args.slice(1).join(" ").replace(/^@/, "").toLowerCase().trim();

  if (nameQuery) {
    try {
      const threadInfo = await api.getThreadInfo(threadID);
      const participants = threadInfo.userInfo || [];
      const matched = participants.find(p =>
        p.name && p.name.toLowerCase().includes(nameQuery)
      );
      if (matched) {
        return [{ uid: matched.id, name: matched.name }];
      }
    } catch (e) {}
  }

  return [{ uid: senderID, name: null }];
}

module.exports.onStart = async function ({ api, message, event }) {
  const targets = await resolveTargets(api, event);

  if (targets.length === 1 && targets[0].uid === event.senderID && !targets[0].name) {
    return message.reply(`🆔 তোমার UID:\n\n🔢 ${event.senderID}`);
  }

  if (targets.length === 1 && event.messageReply && targets[0].uid === event.messageReply.senderID) {
    return message.reply(`🆔 Reply করা ব্যক্তির UID:\n\n🔢 ${targets[0].uid}`);
  }

  let text = `🆔 UID তথ্য:\n\n`;
  for (const t of targets) {
    const label = t.name ? `👤 ${t.name}\n` : "";
    text += `${label}🔢 UID: ${t.uid}\n\n`;
  }
  return message.reply(text.trim());
};
