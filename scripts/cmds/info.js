const moment = require("moment-timezone");

module.exports.config = {
  name: "info",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "sabbir",
  description: "Bot এর সব তথ্য দেখাও",
  usePrefix: true,
  category: "Info",
  usages: "info",
  cooldowns: 5
};

module.exports.onStart = async function ({ api, message }) {
  const totalSeconds = Math.floor(process.uptime());
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  const totalCmds = global.GoatBot?.commands?.size || 0;
  const prefix = global.GoatBot?.config?.prefix || "/";
  const botName = global.GoatBot?.config?.botName || "Sabbir Chat Bot";
  const botID = api.getCurrentUserID();
  const now = moment().tz("Asia/Dhaka").format("DD/MM/YYYY hh:mm A");

  return message.reply(
    `╔══✨ BOT INFO ✨═══╗\n\n` +
    `🤖 নাম: ${botName}\n` +
    `🔢 Bot ID: ${botID}\n` +
    `👑 Owner: Ariful Islam Sabbir\n` +
    `📌 Prefix: ${prefix}\n` +
    `📦 Commands: ${totalCmds}টি\n` +
    `⏱ Uptime: ${days}d ${hours}h ${minutes}m\n` +
    `🕐 সময়: ${now}\n` +
    `⚙️ Node: ${process.version}\n\n` +
    `╠══════════════════════╣\n` +
    `   💖 Powered by\n` +
    `   Sabbir Chat Bot\n` +
    `╚══════════════════════╝`
  );
};
