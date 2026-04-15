module.exports.config = {
  name: "tag",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "Ariful Islam Sabbir",
  description: "Mention করো — reply দিলে সেই ব্যক্তিকে, /tag all দিলে সবাইকে",
  usePrefix: true,
  category: "Group",
  usages: "tag [all | msg] | reply করে /tag",
  cooldowns: 5
};

module.exports.onStart = async function ({ api, event }) {
  const { threadID, senderID, messageReply, body } = event;

  const args = (body || "").trim().split(/\s+/);
  const sub = (args[1] || "").toLowerCase();
  const customMsg = args.slice(2).join(" ").trim();

  if (sub === "all") {
    let threadInfo;
    try {
      threadInfo = await api.getThreadInfo(threadID);
    } catch (err) {
      return api.sendMessage("❌ Group info পেতে পারিনি!", threadID, event.messageID);
    }

    const botID = String(api.getCurrentUserID());
    const participants = [];

    const rawIDs = threadInfo.participantIDs || [];
    const userInfoMap = {};
    if (threadInfo.userInfo && Array.isArray(threadInfo.userInfo)) {
      for (const u of threadInfo.userInfo) {
        userInfoMap[String(u.id)] = u.name || "User";
      }
    }

    for (const id of rawIDs) {
      const uid = String(id);
      if (uid === botID || uid === String(senderID)) continue;
      participants.push({ id: uid, name: userInfoMap[uid] || "User" });
    }

    if (participants.length === 0) {
      return api.sendMessage("❌ Tag করার মতো কেউ নেই।", threadID, event.messageID);
    }

    let bodyText = "";
    const mentions = [];

    for (const p of participants) {
      const tag = `@${p.name}`;
      mentions.push({
        tag,
        id: p.id,
        fromIndex: bodyText.length,
        length: tag.length
      });
      bodyText += tag + " ";
    }

    if (customMsg) bodyText = bodyText.trim() + "\n" + customMsg;
    else bodyText = bodyText.trim();

    try {
      await api.sendMessage({ body: bodyText, mentions }, threadID);
    } catch (err) {
      return api.sendMessage("❌ সবাইকে tag করতে পারিনি। Error: " + err.message, threadID, event.messageID);
    }
    return;
  }

  if (messageReply) {
    const targetID = String(messageReply.senderID);
    let targetName = "User";
    try {
      const info = await api.getUserInfo([targetID]);
      if (info && info[targetID]) targetName = info[targetID].name || "User";
    } catch (e) {}

    const tagText = `@${targetName}`;
    const extraMsg = args.slice(1).join(" ").trim();
    const msgBody = extraMsg ? `${tagText} ${extraMsg}` : tagText;

    try {
      await api.sendMessage(
        {
          body: msgBody,
          mentions: [{ tag: tagText, id: targetID, fromIndex: 0, length: tagText.length }]
        },
        threadID
      );
    } catch (err) {
      return api.sendMessage("❌ Tag করতে পারিনি! Error: " + err.message, threadID, event.messageID);
    }
    return;
  }

  return api.sendMessage(
    "📌 ব্যবহার:\n• /tag all → সবাইকে mention\n• /tag all বার্তা → mention সহ বার্তা\n• কারো message এ reply করে /tag → সেই ব্যক্তিকে mention",
    threadID,
    event.messageID
  );
};
