module.exports.config = {
  name: "kick",
  version: "1.3.0",
  hasPermssion: 0,
  credits: "Ariful Islam Sabbir",
  description: "Group থেকে কাউকে বের করো",
  usePrefix: true,
  category: "Group",
  usages: "kick @mention | reply করে kick | kick <UID>",
  cooldowns: 5
};

function normalize(str) {
  return (str || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function similarity(a, b) {
  a = normalize(a);
  b = normalize(b);
  if (a === b) return 1;
  if (b.includes(a) || a.includes(b)) return 0.9;
  const aWords = a.split(" ");
  const bWords = b.split(" ");
  let matched = 0;
  for (const w of aWords) {
    if (bWords.some(bw => bw.includes(w) || w.includes(bw))) matched++;
  }
  return matched / Math.max(aWords.length, bWords.length);
}

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
    let name = uid;
    try {
      const info = await api.getUserInfo([uid]);
      if (info && info[uid]) name = info[uid].name || uid;
    } catch (e) {}
    targets.push({ uid, name });
  }

  if (targets.length === 0) {
    const args = (body || "").trim().split(/\s+/);

    if (args[1] && /^\d{10,}$/.test(args[1])) {
      const uid = args[1];
      let name = uid;
      try {
        const info = await api.getUserInfo([uid]);
        if (info && info[uid]) name = info[uid].name || uid;
      } catch (e) {}
      targets.push({ uid, name });
    } else {
      const rawText = (body || "").replace(/^\/kick\s*/i, "").replace(/^@/, "").trim();
      if (rawText.length > 0) {
        const members = threadInfo.userInfo || [];
        let bestMatch = null;
        let bestScore = 0;

        for (const member of members) {
          const score = similarity(rawText, member.name || "");
          if (score > bestScore) {
            bestScore = score;
            bestMatch = member;
          }
        }

        if (bestMatch && bestScore >= 0.4) {
          targets.push({ uid: String(bestMatch.id), name: bestMatch.name });
        }
      }
    }
  }

  if (targets.length === 0) {
    return api.sendMessage(
      `${lang.noMention}\n\n` +
      `📌 ৩ ভাবে kick করা যায়:\n` +
      `• কারো message এ reply করে /kick\n` +
      `• /kick <UID নম্বর>\n` +
      `• /kick @নাম`,
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
