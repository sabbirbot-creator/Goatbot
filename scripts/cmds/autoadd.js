module.exports.config = {
  name: "autoadd",
  version: "1.0.0",
  role: {
    onStart: 1,
    onEvent: 0
  },
  credits: "Ariful Islam Sabbir",
  usePrefix: true,
  hidden: false,
  category: "Group",
  countDown: 3,
  shortDescription: "কেউ leave করলে bot auto add করবে",
  longDescription: "Group admin এই command দিয়ে autoadd on/off করতে পারবে",
  guide: {
    en: "{pn} on/off",
    bn: "{pn} on/off"
  }
};

if (!global.autoAddEnabled) global.autoAddEnabled = new Map();

module.exports.onStart = async function ({ api, event, message, threadsData }) {
  const { threadID, messageID, senderID, body } = event;
  const args = (body || "").trim().split(/\s+/);
  const sub = (args[1] || "").toLowerCase();

  if (!sub || !["on", "off"].includes(sub)) {
    const status = global.autoAddEnabled.get(threadID) ? "✅ চালু" : "❌ বন্ধ";
    return message.reply(
      `🔄 AutoAdd Status: ${status}\n\n` +
      `📌 ব্যবহার:\n` +
      `• /autoadd on → চালু করো\n` +
      `• /autoadd off → বন্ধ করো\n\n` +
      `ℹ️ চালু থাকলে কেউ leave করলে bot তাকে auto add করবে।`
    );
  }

  const isEnable = sub === "on";
  global.autoAddEnabled.set(threadID, isEnable);

  await threadsData.set(threadID, "autoAdd", isEnable);

  return message.reply(
    isEnable
      ? `✅ AutoAdd চালু হয়েছে!\n🔄 এখন কেউ leave করলে bot তাকে আবার add করবে।`
      : `❌ AutoAdd বন্ধ হয়েছে!`
  );
};

module.exports.onLoad = async function ({ threadsData }) {
  try {
    const allThreads = global.db.allThreadData || [];
    for (const thread of allThreads) {
      const status = thread.data?.autoAdd;
      if (status === true) {
        global.autoAddEnabled.set(thread.threadID, true);
      }
    }
  } catch (e) {}
};

module.exports.onEvent = async function ({ api, event }) {
  try {
    const { threadID, logMessageType, logMessageData, author } = event;
    if (logMessageType !== "log:unsubscribe") return;

    const isEnabled = global.autoAddEnabled.get(threadID);
    if (!isEnabled) return;

    const leftUserID = String(
      logMessageData?.leftParticipantFbId ||
      logMessageData?.removedParticipantFbId ||
      event.userID ||
      author ||
      ""
    );

    if (!leftUserID) return;

    const botID = String(api.getCurrentUserID());
    if (leftUserID === botID) return;

    // সামান্য delay দিয়ে add করা
    setTimeout(async () => {
      try {
        await api.addUserToGroup(leftUserID, threadID);

        let userName = "User";
        try {
          const info = await api.getUserInfo([leftUserID]);
          if (info && info[leftUserID]) userName = info[leftUserID].name || "User";
        } catch (e) {}

        await api.sendMessage(
          `🔄 ${userName} leave করেছিল, bot আবার add করেছে! 😈`,
          threadID
        );
      } catch (err) {
        // add করতে না পারলে (permission না থাকলে) চুপ থাকবে
      }
    }, 2000);

  } catch (e) {}
};
