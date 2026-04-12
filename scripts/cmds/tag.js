module.exports.config = {
  name: "tag",
  version: "1.1.0",
  hasPermssion: 0,
  credits: "sabbir",
  description: "Mention করো — reply দিলে সেই ব্যক্তিকে, /tag all দিলে @everyone দিয়ে সবাইকে",
  usePrefix: true,
  category: "Group",
  usages: "tag [all] | reply করে tag",
  cooldowns: 5
};

module.exports.onStart = async function ({ api, event }) {
  const { threadID, senderID, messageReply, body } = event;
  const lang = global.getText("commands", "tag");

  const args = (body || "").trim().split(/\s+/);
  const sub = (args[1] || "").toLowerCase();

  if (sub === "all") {
    let threadInfo;
    try {
      threadInfo = await api.getThreadInfo(threadID);
    } catch (err) {
      return api.sendMessage(lang.tagAllError, threadID, event.messageID);
    }

    const botID = String(api.getCurrentUserID());
    const participants = (threadInfo.userInfo || []).filter(
      p => String(p.id) !== botID && String(p.id) !== String(senderID)
    );

    if (participants.length === 0) {
      return api.sendMessage(lang.noParticipants, threadID, event.messageID);
    }

    const everyoneText = "@everyone";
    const mentions = participants.map(p => ({
      tag: everyoneText,
      id: p.id,
      fromIndex: 0,
      length: everyoneText.length
    }));

    try {
      await api.sendMessage({ body: everyoneText, mentions }, threadID);
    } catch (err) {
      return api.sendMessage(lang.tagAllError, threadID, event.messageID);
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
    const msgBody = customMsg ? `${tagText} ${customMsg}` : tagText;

    try {
      return api.sendMessage(
        {
          body: msgBody,
          mentions: [{ tag: tagText, id: targetID, fromIndex: 0, length: tagText.length }]
        },
        threadID
      );
    } catch (err) {
      return api.sendMessage(lang.replyError, threadID, event.messageID);
    }
  }

  return api.sendMessage(lang.usage, threadID, event.messageID);
};
