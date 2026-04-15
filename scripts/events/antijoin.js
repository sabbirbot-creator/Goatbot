module.exports.config = {
  name: "antijoin",
  version: "1.0.0",
  role: 0,
  credits: "Ariful Islam Sabbir",
  description: "Group থেকে কেউ leave করলে auto re-add করে (per-group toggle আছে)",
  category: "Events",
  countDown: 0
};

if (!global.antijoinEnabled) global.antijoinEnabled = new Set();

module.exports.onStart = async function ({ api, event }) {
  if (event.logMessageType !== "log:unsubscribe") return;

  const { threadID, logMessageData, author } = event;

  if (!global.antijoinEnabled.has(threadID)) return;

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

  const wasKicked =
    logMessageData?.removedParticipantFbId &&
    String(logMessageData.removedParticipantFbId) === leftUserID &&
    String(author) !== leftUserID;

  if (wasKicked) return;

  await new Promise(r => setTimeout(r, 2000));

  try {
    await api.addUserToGroup(leftUserID, threadID);

    let name = "User";
    try {
      const info = await api.getUserInfo([leftUserID]);
      if (info && info[leftUserID]) name = info[leftUserID].name || "User";
    } catch (e) {}

    await api.sendMessage(
      `🔄 ${name} আবার add করা হয়েছে!\nAntiJoin চালু আছে — কেউ leave করতে পারবে না।`,
      threadID
    );
  } catch (err) {
    await api.sendMessage(
      `⚠️ Auto re-add করতে পারিনি!\n🐛 Error: ${err.message}`,
      threadID
    );
  }
};
