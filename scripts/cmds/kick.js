const { getName } = require("../../utils/getName.js");

module.exports.config = {
  name: "kick",
  version: "1.4.0",
  role: 1,
  hasPermssion: 1,
  credits: "Ariful Islam Sabbir",
  description: "Group theke user kick kora",
  usePrefix: true,
  category: "group",
  usages: "[@tag] / [reply] / [uid]",
  countDown: 2,
  cooldowns: 0
};

module.exports.onStart = async function ({ api, event, args, message }) {
  const { threadID, messageID, senderID, mentions, type, messageReply } = event;

  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const botID = String(api.getCurrentUserID());
    const adminIDs = (threadInfo.adminIDs || []).map(a => String((a && a.id) ? a.id : a));

    if (!adminIDs.includes(botID))
      return message.reply("⚠️ Bot এই group এর admin না, তাই কাউকে kick করতে পারবে না।");

    if (!adminIDs.includes(String(senderID)))
      return message.reply("⛔ এই কাজটি শুধুমাত্র group admin করতে পারবে।");

    let targets = [];

    if (mentions && Object.keys(mentions).length > 0) {
      targets = Object.keys(mentions);
    } else if (type === "message_reply" && messageReply && messageReply.senderID) {
      targets = [String(messageReply.senderID)];
    } else if (args[0] && /^\d+$/.test(args[0])) {
      targets = [args[0]];
    } else {
      return message.reply("📌 ব্যবহার:\n• /kick @mention\n• Reply দিয়ে /kick\n• /kick <UID>");
    }

    for (const id of targets) {
      const sid = String(id);

      if (sid === botID) {
        await message.reply("🙃 আমি নিজেকে kick করতে পারব না!");
        continue;
      }

      if (adminIDs.includes(sid)) {
        const aname = await getName(api, sid, "একজন admin");
        await message.reply(`🛡️ ${aname} group admin, তাকে kick করা যাবে না।`);
        continue;
      }

      const name = await getName(api, sid, "এই user");

      await new Promise(r => setTimeout(r, 800));
      try {
        await api.removeUserFromGroup(sid, threadID);
        await api.sendMessage(`👢 ${name} কে group থেকে বের করে দেওয়া হয়েছে!`, threadID);
      } catch (kerr) {
        console.error("kick failed:", kerr);
        await api.sendMessage(`❌ ${name} কে kick করা যায়নি!\n${kerr.message || kerr.error || ""}`, threadID);
      }
    }
  } catch (e) {
    console.error("kick error:", e);
    return message.reply(`❌ Kick command এ সমস্যা হয়েছে!\n${e.message || ""}`);
  }
};
