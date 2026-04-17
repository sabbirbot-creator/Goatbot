const reactions = [
  "❤️", "😆", "😮", "😢", "😠", "👍", "🎉", "🔥", "💯", "😍", "🥰", "😂", "👏", "💪", "🙌", "✨", "🚀", "🌈", "⭐", "🎈",
  "😎", "🤩", "🤔", "🧐", "🙄", "😏", "🥳", "😭", "😤", "🤯", "😴", "😇", "🥳", "😜", "🤑", "😲", "🤐", "😴", "🤤", "😵",
  "🤠", "👽", "👾", "🤖", "🎃", "😺", "😸", "😻", "😽", "🤘", "🤝", "✌️", "🤞", "🤙", "🖐️", "👊", "💥", "💢", "💎", "👑",
  "🌻", "🌹", "🍀", "🍎", "🍕", "🍔", "🍦", "🍩", "🌍", "🌕", "☀️", "⛈️", "⚡", "🔥", "💧", "🌊", "🏀", "⚽", "🎮", "🎸",
  "📱", "💻", "💡", "💰", "✉️", "🎁", "🚩", "🏁", "✅", "❌", "🌀", "🧿", "🎵", "🎶", "🔔", "📣", "💬", "💭", "🉐", "㊙️",
  "㊗️", "🔞", "📍"
];

module.exports.config = {
  name: "autoreact",
  version: "1.1.0",
  role: 2,
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

module.exports.onStart = async function ({ event, args, message, threadsData }) {
  const { threadID } = event;
  const action = (args[0] || "").toLowerCase();

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
      ? `✅ AutoReact চালু হয়েছে!`
      : "❌ এই গ্রুপে AutoReact বন্ধ করা হয়েছে!"
  );
};

module.exports.onChat = async function ({ api, event, threadsData }) {
  try {
    const { threadID, messageID, senderID, body } = event;

    // নিজের মেসেজে এবং কমান্ড মেসেজে রিয়্যাক্ট করবে না
    if (!body || senderID == api.getCurrentUserID() || body.startsWith(global.GoatBot.config.prefix)) return;

    // ডাটাবেস থেকে চেক করা
    const threadInfo = await threadsData.get(threadID);
    const autoReactStatus = threadInfo.data ? threadInfo.data.autoReact : false;

    if (autoReactStatus === true) {
      const randomReact = reactions[Math.floor(Math.random() * reactions.length)];
      
      // সামান্য ডিলে দেওয়া হয়েছে যাতে ফেসবুক স্প্যাম ডিটেক্ট না করে
      setTimeout(() => {
        api.setMessageReaction(randomReact, messageID, (err) => {
          if (err) console.error("Reaction Error:", err);
        }, true);
      }, 500); 
    }
  } catch (e) {
    // কোনো এরর হলে কনসোলে দেখাবে
  }
};
