const lang = require("../../languages/bn.json");

const reactions = ["❤️", "😆", "😮", "😢", "😠", "👍", "🎉", "🔥", "💯", "😍", "🥰", "😂", "👏", "💪", "🙌"];

module.exports.config = {
  name: "autoreact",
  version: "1.0.3",
  role: {
    onStart: 0,
    onChat: 0
  },
  credits: "Sabbir",
  usePrefix: true,
  category: "System",
  countDown: 3,
  shortDescription: "প্রতিটা message এ auto react করে",
  longDescription: "Bot admin শুধু এই command টি on/off করতে পারবে",
  guide: {
    en: "{pn} on/off"
  }
};

module.exports.onStart = async function ({ event, args, message, threadsData }) {
  const { threadID, senderID } = event;
  const adminList = global.GoatBot?.config?.adminBot || [];

  if (!adminList.includes(String(senderID))) {
    return message.reply(lang.commands.autoreact.noPermission);
  }

  const action = (args[0] || "").toLowerCase();

  if (!["on", "off"].includes(action)) {
    return message.reply(
      "📌 ব্যবহার:\n"
      + "/autoreact on — চালু করতে\n"
      + "/autoreact off — বন্ধ করতে"
    );
  }

  const enabled = action === "on";

  try {
    const threadData = global.db.allThreadData.find(t => String(t.threadID) === String(threadID));
    if (threadData) {
      threadData.data.autoReact = enabled;
    }
    await threadsData.set(threadID, "autoReact", enabled);

    return message.reply(
      enabled
        ? `✅ AutoReact চালু হয়েছে!\nএখন থেকে সব message এ random react দেওয়া হবে:\n${reactions.join("  ")}`
        : "❌ AutoReact বন্ধ হয়েছে!"
    );
  } catch (e) {
    return message.reply("⚠️ কিছু একটা সমস্যা হয়েছে: " + (e?.message || e));
  }
};

module.exports.onChat = async function ({ api, event, threadsData }) {
  const { threadID, messageID, senderID } = event;

  if (String(senderID) === String(global.GoatBot?.botID)) return;

  const threadData = global.db.allThreadData.find(t => String(t.threadID) === String(threadID));
  const autoReact = threadData?.data?.autoReact
    ?? (await threadsData.get(threadID, "autoReact", false));

  if (!autoReact) return;

  const randomReact = reactions[Math.floor(Math.random() * reactions.length)];

  try {
    await api.setMessageReaction(randomReact, messageID, () => {}, true);
  } catch (e) {
    console.error("[AutoReact] React error:", e?.message || e);
  }
};
