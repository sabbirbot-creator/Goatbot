const SABBIR = "Ariful Islam Sabbir";
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "pp",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Ariful Islam Sabbir",
  description: "নিজের বা অন্যের প্রোফাইল পিকচার দেখাও",
  usePrefix: true,
  category: "Info",
  usages: "pp [@mention | reply]",
  cooldowns: 5
};

async function resolveTarget(api, event) {
  const { mentions, senderID, messageReply, threadID, body } = event;

  const mentionIDs = mentions && typeof mentions === "object"
    ? Object.keys(mentions).filter(id => id && id !== "null" && id !== senderID)
    : [];

  if (mentionIDs.length > 0) {
    const uid = mentionIDs[0];
    const name = (mentions[uid] || "").replace(/^@/, "").trim() || uid;
    return { uid, name };
  }

  if (messageReply) {
    return { uid: messageReply.senderID, name: "Reply করা ব্যক্তির" };
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
        return { uid: matched.id, name: matched.name };
      }
    } catch (e) {}
  }

  return { uid: senderID, name: "তোমার" };
}

module.exports.onStart = async function ({ api, message, event }) {
  const { uid: targetID, name: targetName } = await resolveTarget(api, event);

  try {
    const avatarURL = `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

    const res = await axios.get(avatarURL, { responseType: "arraybuffer" });
    const tmpPath = path.join(__dirname, `../../tmp/pp_${targetID}.jpg`);
    await fs.outputFile(tmpPath, res.data);

    await message.reply({
      body: `🖼️ ${targetName} প্রোফাইল পিকচার\n🔢 UID: ${targetID}`,
      attachment: fs.createReadStream(tmpPath)
    });

    await fs.remove(tmpPath);
  } catch (err) {
    return message.reply(`❌ প্রোফাইল পিকচার আনতে পারিনি।`);
  }
};
