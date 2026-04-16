const reactions = ["❤️", "😆", "😮", "😢", "😠", "👍", "🎉", "🔥", "💯", "😍", "🥰", "😂", "👏", "💪", "🙌"];

module.exports.config = {
  name: "autoreact",
  version: "1.0.5",
  role: 0,
  credits: "Ariful Islam Sabbir",
  usePrefix: true,
  category: "System",
  countDown: 3,
  shortDescription: "প্রতিটা message এ auto react করে",
  longDescription: "বট এডমিন শুধু এই কমান্ডটি অন/অফ করতে পারবে",
  guide: {
    en: "{pn} on/off",
    bn: "{pn} on/off"
  }
};

module.exports.onStart = async function ({ event, args, message, threadsData, role }) {
  const { threadID } = event;
  const action = (args[0] || "").toLowerCase();

  // Role 2 সাধারণত বট এডমিনদের জন্য হয়, তাই role চেক করাই যথেষ্ট
  if (role < 2) {
    return message.reply("⚠️ এই কমান্ডটি শুধুমাত্র বট এডমিনদের জন্য!");
  }

  if (!["on", "off"].includes(action)) {
    return message.reply(
      "📌 ব্যবহার:\n"
      + "autoreact on — চালু করতে\n"
      + "autoreact off — বন্ধ করতে"
    );
  }

  const isEnable = action === "on";
  await threadsData.set(threadID, isEnable, "data.autoReact");

  return message.reply(
    isEnable
      ? `✅ এই গ্রুপে AutoReact চালু করা হয়েছে!`
      : "❌ এই গ্রুপে AutoReact বন্ধ করা হয়েছে!"
  );
};

module.exports.onChat = async function ({ api, event, threadsData }) {
  const { threadID, messageID, senderID, body } = event;

  // নিজের মেসেজে রিয়্যাক্ট করবে না
  if (!body || senderID == api.getCurrentUserID()) return;

  // ডাটাবেস থেকে চেক করা
  const autoReactStatus = await threadsData.get(threadID, "data.autoReact");

  if (autoReactStatus === true) {
    const randomReact = reactions[Math.floor(Math.random() * reactions.length)];
    api.setMessageReaction(randomReact, messageID, (err) => {
      if (err) console.error(err);
    }, true);
  }
};
