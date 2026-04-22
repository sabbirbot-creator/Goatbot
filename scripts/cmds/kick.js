module.exports.config = {
  name: "kick",
  version: "1.3.0",
  hasPermssion: 1,
  credits: "Ariful Islam Sabbir",
  description: "Group theke kick kora",
  usePrefix: true,
  category: "system",
  usages: "[tag]",
  cooldowns: 0
};

module.exports.onStart = async function({ api, event, getText, Threads }) {
  const { threadID, messageID, senderID, mentions } = event;
  const mention = Object.keys(mentions);

  try {
    // ১. থ্রেড ডাটা এবং অ্যাডমিন লিস্ট চেক করা
    const threadInfo = await api.getThreadInfo(threadID);
    const botID = api.getCurrentUserID();

    // ২. বট নিজে অ্যাডমিন কি না চেক করা
    const isBotAdmin = threadInfo.adminIDs.some(item => item.id == botID);
    if (!isBotAdmin) return api.sendMessage(getText("commands.kick.error"), threadID, messageID);

    // ৩. কাউকে ট্যাগ করা হয়েছে কি না চেক
    if (mention.length === 0) return api.sendMessage(getText("commands.kick.noMention"), threadID, messageID);

    // ৪. যে কমান্ড দিচ্ছে সে অ্যাডমিন কি না চেক
    const isSenderAdmin = threadInfo.adminIDs.some(item => item.id == senderID);
    if (!isSenderAdmin) return api.sendMessage(getText("commands.kick.notGroupAdmin"), threadID, messageID);

    // ৫. কিক প্রসেস শুরু
    for (const id of mention) {
      // বট নিজে বা বট অ্যাডমিনকে কিক করা আটকানো (সুরক্ষার জন্য)
      if (id == botID) return api.sendMessage(getText("commands.kick.cantKickAdmin"), threadID, messageID);

      setTimeout(() => {
        api.removeUserFromGroup(id, threadID, (err) => {
          if (err) return api.sendMessage(getText("commands.kick.error"), threadID);
          
          // সফল হলে সাকসেস মেসেজ (নাম রিপ্লেস করে)
          const name = mentions[id].replace("@", "");
          api.sendMessage(getText("commands.kick.success", name), threadID);
        });
      }, 1500);
    }
  } catch (e) {
    console.error(e);
    return api.sendMessage(getText("commands.kick.error"), threadID, messageID);
  }
};
