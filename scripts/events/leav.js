module.exports.config = {
  name: "leav",
  version: "1.0.0",
  role: 0,
  credits: "Ariful Islam Sabbir",
  description: "Group থেকে কেউ leave করলে বিদায় message পাঠায়",
  category: "Events",
  countDown: 0
};

module.exports.onStart = async function ({ api, event }) {
  if (event.logMessageType !== "log:unsubscribe") return;

  const { threadID, logMessageData, author } = event;

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

  let leftName = "কেউ একজন";
  try {
    const info = await api.getUserInfo([leftUserID]);
    if (info && info[leftUserID]) leftName = info[leftUserID].name || leftName;
  } catch (e) {}

  const wasKicked =
    logMessageData?.removedParticipantFbId &&
    String(logMessageData.removedParticipantFbId) === leftUserID &&
    String(author) !== leftUserID;

  let leaveMsg;
  if (wasKicked) {
    leaveMsg =
      `👢 ${leftName} কে group থেকে বের করা হয়েছে!\n` +
      `😔 Rules না মানলে এমনই হয়।`;
  } else {
    leaveMsg =
      `😢 ${leftName} group ছেড়ে চলে গেছে!\n\n` +
      `💔 তোমাকে মনে রাখব। বিদায়! 👋`;
  }

  try {
    await api.sendMessage(leaveMsg, threadID);
  } catch (e) {}
};
