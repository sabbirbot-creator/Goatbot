const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

// ResolveTarget ইউটিলিটি পাথ সেট করা হচ্ছে
const resolvePath = path.join(process.cwd(), 'utils', 'resolveTarget.js');
let resolveTargets;
try {
  resolveTargets = require(resolvePath).resolveTargets;
} catch (e) {
  console.log("resolveTarget utility not found.");
}

module.exports.config = {
  name: "details",
  version: "7.2.0",
  hasPermssion: 0,
  credits: "Ariful Islam Sabbir",
  description: "User details with stylish box and HD picture (Clean Version)",
  usePrefix: true,
  category: "Info",
  usages: "details [@mention | reply | UID]",
  cooldowns: 5
};

module.exports.onStart = async function ({ api, message, event, args }) {
  const { threadID, messageID, senderID } = event;

  try {
    let targetID = senderID;

    // মেনশন বা রিপ্লাই থেকে আইডি রিভলভ করা
    if (resolveTargets) {
      const result = await resolveTargets({ api, event, args });
      if (result.targets && result.targets.length > 0) {
        targetID = result.targets[0].uid;
      }
    } else {
      if (event.messageReply) {
        targetID = event.messageReply.senderID;
      } else if (Object.keys(event.mentions || {}).length > 0) {
        targetID = Object.keys(event.mentions)[0];
      } else if (args[0] && !isNaN(args[0])) {
        targetID = args[0];
      }
    }

    const userInfo = await api.getUserInfo(targetID);
    const user = userInfo[targetID];

    if (!user) return api.sendMessage("Error: User info not found.", threadID, messageID);

    const name = user.name || "N/A";
    const gender = user.gender === 2 ? "𝐌𝐚𝐥𝐞" : user.gender === 1 ? "𝐅𝐞𝐦𝐚𝐥𝐞" : "𝐔𝐧𝐤𝐧𝐨𝐰𝐧";
    const username = user.vanity || "𝐍/𝐀";

    // আপনার চাহিদা অনুযায়ী ৩টি অপশন বাদ দিয়ে নতুন ডিজাইন
    let msg = `╔════════════════════════════╗\n`;
    msg += `║    𝐒𝐀𝐁𝐁𝐈𝐑 𝐂𝐇𝐀𝐓 𝐁𝐎𝐓    ║\n`;
    msg += `╠════════════════════════════╣\n`;
    msg += `║ 𝐍𝐚𝐦𝐞      : ${name}\n`;
    msg += `║ 𝐒𝐭𝐚𝐭𝐮𝐬    : 𝐎𝐧𝐥𝐢𝐧𝐞\n`;
    msg += `║ 𝐔𝐈𝐃       : ${targetID}\n`;
    msg += `║ 𝐆𝐞𝐧𝐝𝐞𝐫    : ${gender}\n`;
    msg += `║ 𝐋𝐨𝐜𝐚𝐭𝐢𝐨𝐧  : 𝐍/𝐀\n`;
    msg += `║ 𝐔𝐬𝐞𝐫𝐧𝐚𝐦𝐞 : ${username}\n`;
    msg += `╠════════════════════════════╣\n`;
    msg += `║ 𝐏𝐫𝐨𝐟𝐢𝐥𝐞 𝐋𝐢𝐧𝐤          \n`;
    msg += `║ https://www.facebook.com/profile.php?id=${targetID}\n`;
    msg += `╚════════════════════════════╝`;

    // HD পিপি লজিক
    const avatarURL = `https://graph.facebook.com/${targetID}/picture?width=1024&height=1024&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
    
    const res = await axios.get(avatarURL, { responseType: "arraybuffer" });
    const cacheDir = path.join(process.cwd(), 'cache');
    await fs.ensureDir(cacheDir);
    const tmpPath = path.join(cacheDir, `details_${targetID}.jpg`);
    
    await fs.outputFile(tmpPath, res.data);

    await api.sendMessage({
      body: msg,
      attachment: fs.createReadStream(tmpPath)
    }, threadID, () => {
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    }, messageID);

  } catch (err) {
    return api.sendMessage("An error occurred. Make sure resolveTarget.js is in utils folder.", threadID, messageID);
  }
}
