module.exports.config = {
  name: "autoseen",
  version: "6.1.0",
  role: 0,
  credits: "Ariful Islam Sabbir",
  hidden: true,
  usePrefix: false,
  category: "System",
  countDown: 0,
  shortDescription: "সব message auto seen করে"
};

module.exports.onStart = async function () {};

module.exports.onChat = async function ({ api, event }) {
  const threadID = event.threadID;
  if (!threadID) return;

  try {
    const messageID = event.messageID || (event.messageReply && event.messageReply.messageID);
    if (messageID && typeof api.markAsDelivered === "function") {
      await api.markAsDelivered(threadID, messageID);
    }
  } catch (e) {}

  try {
    await api.markAsRead(threadID, true);
  } catch (e) {
    try { await api.markAsReadAll(); } catch (_) {}
  }

  try {
    await api.markAsSeen(Date.now());
  } catch (e) {}
};
