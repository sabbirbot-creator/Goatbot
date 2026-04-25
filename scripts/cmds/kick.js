const { getName } = require("../../utils/getName.js");
const { resolveTargets } = require("../../utils/resolveTarget.js");

if (!global.recentKicks) global.recentKicks = new Map();

module.exports.config = {
  name: "kick",
  version: "1.5.0",
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

function extractMentionIDs(mentions) {
  if (!mentions) return [];
  if (Array.isArray(mentions)) {
    return mentions
      .map(m => String(m && (m.id || m.userID || m) || ""))
      .filter(Boolean);
  }
  if (typeof mentions === "object") {
    return Object.keys(mentions).map(String);
  }
  return [];
}

module.exports.onStart = async function ({ api, event, args, message }) {
  const { threadID, senderID, mentions, type, messageReply } = event;

  let threadInfo;
  try {
    threadInfo = await api.getThreadInfo(threadID);
  } catch (e) {
    console.error("kick getThreadInfo:", e);
    return message.reply(`❌ Group info নিতে পারছি না\n${e.message || ""}`);
  }

  const botID = String(api.getCurrentUserID());
  const adminIDs = (threadInfo.adminIDs || []).map(a => String((a && a.id) ? a.id : a));

  if (!adminIDs.includes(botID))
    return message.reply("⚠️ Bot এই group এর admin না, তাই কাউকে kick করতে পারবে না।");

  if (!adminIDs.includes(String(senderID)))
    return message.reply("⛔ এই কাজটি শুধুমাত্র group admin করতে পারবে।");

  const result = await resolveTargets({ api, event, args });

  if (result.ambiguous) {
    let text = `⚠️ "${result.query}" — eki rokom name er ekadhik jon paoa gechhe. Specific kore din:\n\n`;
    result.candidates.forEach((c, i) => {
      text += `${i + 1}. ${c.name || "(no name)"} — 🔢 ${c.uid}\n`;
    });
    text += `\nUID diye abar /kick chalan, eg:\n/kick ${result.candidates[0].uid}`;
    return message.reply(text.trim());
  }

  let targets = result.targets.map(r => r.uid);

  if (targets.length === 0) {
    if (result.error) return message.reply(`❌ Group info ana jaai ni: ${result.error}`);
    if (result.query) return message.reply(`❌ "${result.query}" name er kau ke group e paini. Real @mention, reply, ba direct UID use korun.`);
    return message.reply("📌 ব্যবহার:\n• /kick @mention\n• /kick @name (group member er name)\n• Reply দিয়ে /kick\n• /kick <UID>");
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

    global.recentKicks.set(`${threadID}_${sid}`, Date.now());

    try {
      await api.removeUserFromGroup(sid, threadID);
      await api.sendMessage(`👢 ${name} কে group থেকে বের করে দেওয়া হয়েছে!`, threadID);
    } catch (kerr) {
      global.recentKicks.delete(`${threadID}_${sid}`);
      console.error("kick failed:", kerr);
      await api.sendMessage(`❌ ${name} কে kick করা যায়নি!\n${kerr.message || kerr.error || ""}`, threadID);
    }

    await new Promise(r => setTimeout(r, 600));
  }
};
