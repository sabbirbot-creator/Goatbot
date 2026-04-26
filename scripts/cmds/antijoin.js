const SABBIR = "Ariful Islam Sabbir";
module.exports.config = {
  name: "antijoin",
  version: "1.0.0",
  role: 1,
  credits: "Ariful Islam Sabbir",
  description: "AntiJoin চালু/বন্ধ করো — leave করলে auto re-add হবে",
  usePrefix: true,
  category: "Group",
  usages: "antijoin [on/off]",
  cooldowns: 3
};

module.exports.onStart = async function ({ api, event }) {
  const { threadID, messageID, body } = event;

  if (!global.antijoinEnabled) global.antijoinEnabled = new Set();

  const args = (body || "").trim().split(/\s+/);
  const sub = (args[1] || "").toLowerCase();

  if (!sub || (sub !== "on" && sub !== "off")) {
    const status = global.antijoinEnabled.has(threadID) ? "✅ চালু" : "❌ বন্ধ";
    return api.sendMessage(
      `🛡️ AntiJoin Status: ${status}\n\n📌 ব্যবহার:\n• /antijoin on → চালু করো\n• /antijoin off → বন্ধ করো`,
      threadID,
      messageID
    );
  }

  if (sub === "on") {
    global.antijoinEnabled.add(threadID);
    return api.sendMessage(
      "✅ AntiJoin চালু হয়েছে!\n🔄 এখন কেউ leave করলে auto re-add করা হবে।",
      threadID,
      messageID
    );
  } else {
    global.antijoinEnabled.delete(threadID);
    return api.sendMessage(
      "❌ AntiJoin বন্ধ হয়েছে!\nএখন কেউ leave করলে re-add করা হবে না।",
      threadID,
      messageID
    );
  }
};
