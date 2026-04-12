module.exports.config = {
  name: "restart",
  version: "1.0.0",
  hasPermssion: 2,
  credits: "sabbir",
  description: "Bot restart করো",
  usePrefix: true,
  category: "Admin",
  usages: "restart",
  cooldowns: 5
};

module.exports.onStart = async function ({ api, message, event }) {
  const adminList = global.GoatBot?.config?.adminBot || global.GoatBot?.config?.adminID || [];
  const senderID = event.senderID;

  if (!adminList.includes(senderID) && !adminList.includes(String(senderID))) {
    return message.reply("❌ শুধুমাত্র Admin এই command ব্যবহার করতে পারবে!");
  }

  await message.reply(
    `🔄 Bot restart হচ্ছে...\n` +
    `⏳ কিছুক্ষণ অপেক্ষা করুন।`
  );

  setTimeout(() => {
    process.exit(2);
  }, 2000);
};
