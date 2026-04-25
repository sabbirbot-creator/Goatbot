const { resolveTargets } = require("../../utils/resolveTarget.js");

module.exports.config = {
  name: "uid",
  version: "1.1.0",
  hasPermssion: 0,
  credits: "Ariful Islam Sabbir",
  description: "নিজের বা অন্যের UID দেখাও",
  usePrefix: true,
  category: "Info",
  usages: "uid [@mention | @name | reply | uid]",
  cooldowns: 3
};

module.exports.onStart = async function ({ api, message, event, args }) {
  const targets = await resolveTargets({ api, event, args });

  // Kichu na pawa gele nije'r UID return koro
  if (targets.length === 0) {
    return message.reply(`🆔 তোমার UID:\n\n🔢 ${event.senderID}`);
  }

  if (targets.length === 1 && targets[0].source === "reply") {
    return message.reply(`🆔 Reply করা ব্যক্তির UID:\n\n🔢 ${targets[0].uid}`);
  }

  let text = `🆔 UID তথ্য:\n\n`;
  for (const t of targets) {
    const label = t.name ? `👤 ${t.name}\n` : "";
    text += `${label}🔢 UID: ${t.uid}\n\n`;
  }
  return message.reply(text.trim());
};
