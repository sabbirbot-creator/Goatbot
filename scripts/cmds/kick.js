module.exports.config = {
  name: "kick",
  version: "1.2.0",
  hasPermssion: 0,
  credits: "sabbir",
  description: "Group থেকে কাউকে বের করো",
  usePrefix: true,
  category: "Group",
  usages: "kick @mention | reply করে kick | kick <UID>",
  cooldowns: 5
};

module.exports.onStart = async function ({ api, event }) {
  const { mentions, threadID, senderID, messageReply, body } = event;
  const lang = global.getText("commands", "kick");
  const adminList = (global.GoatBot?.config?.adminBot || global.GoatBot?.config?.adminID || []).map(String);
  const botID = String(api.getCurrentUserID());

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

  const targets = [];

  const mentionIDs = Object.keys(mentions || {});
  if (mentionIDs.length > 0) {
    for (const uid of mentionIDs) {
      const name = (mentions[uid] || "").replace(/^@/, "") || uid;
      targets.push({ uid, name });
    }
  }

  if (targets.length === 0 && messageReply) {
    const uid = String(messageReply.senderID);
    let name = "User";
    try {
      const info = await api.getUserInfo([uid]);
      if (info && info[uid]) name = info[uid].name || uid;
    } catch (e) {}
    targets.push({ uid, name });
  }

  if (targets.length === 0) {
    const args = (body || "").trim().split(/\s+/);
    const uidArg = args[1];
    if (uidArg && /^\d{10,}$/.test(uidArg)) {
      let name = uidArg;
      try {
        const info = await api.getUserInfo([uidArg]);
        if (info && info[uidArg]) name = info[uidArg].name || uidArg;
      } catch (e) {}
      targets.push({ uid: uidArg, name });
    }
  }

  if (targets.length === 0) {
    return api.sendMessage(
      `${lang.noMention}\n\n` +
      `📌 ৩ ভাবে kick করা যায়:\n` +
      `• কারো message এ reply করে /kick\n` +
      `• /kick <UID নম্বর>\n` +
      `• /kick @mention`,
      threadID, event.messageID
    );
  }

  for (const { uid, name } of targets) {
    if (adminList.includes(uid) || uid === botID) {
      await api.sendMessage(lang.cantKickAdmin, threadID, event.messageID);
      continue;
    }
    try {
      await api.removeUserFromGroup(uid, threadID);
      await api.sendMessage(lang.success.replace("%1", name), threadID);
    } catch (err) {
      await api.sendMessage(lang.error, threadID, event.messageID);
    }
  }
};
