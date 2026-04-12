module.exports.config = {
  name: "kick",
  version: "1.1.0",
  hasPermssion: 1,
  credits: "sabbir",
  description: "Group থেকে কাউকে বের করো",
  usePrefix: true,
  category: "Group",
  usages: "kick @mention",
  cooldowns: 5
};

module.exports.onStart = async function ({ api, event }) {
  const { mentions, threadID, senderID } = event;
  const mentionIDs = Object.keys(mentions || {});
  const lang = global.getText("commands", "kick");

  if (mentionIDs.length === 0) {
    return api.sendMessage(lang.noMention, threadID, event.messageID);
  }

  const adminList = (global.GoatBot?.config?.adminBot || []).map(String);
  const botID = String(api.getCurrentUserID());

  for (const uid of mentionIDs) {
    if (adminList.includes(String(uid)) || String(uid) === botID) {
      return api.sendMessage(lang.cantKickAdmin, threadID, event.messageID);
    }
  }

  let threadInfo;
  try {
    threadInfo = await api.getThreadInfo(threadID);
  } catch (err) {
    return api.sendMessage(lang.error, threadID, event.messageID);
  }

  const groupAdminIDs = (threadInfo.adminIDs || []).map(a => String(a.id));
  const senderIsGroupAdmin = groupAdminIDs.includes(String(senderID));
  const senderIsBotAdmin = adminList.includes(String(senderID));

  if (!senderIsGroupAdmin && !senderIsBotAdmin) {
    return api.sendMessage(lang.notGroupAdmin, threadID, event.messageID);
  }

  for (const uid of mentionIDs) {
    const name = (mentions[uid] || "").replace(/^@/, "");
    try {
      await api.removeUserFromGroup(uid, threadID);
      await api.sendMessage(
        lang.success.replace("%1", name),
        threadID
      );
    } catch (err) {
      await api.sendMessage(lang.error, threadID, event.messageID);
    }
  }
};
