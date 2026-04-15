module.exports.config = {
  name: "autoseen",
  version: "6.0.0",
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
  try {
    await api.markAsRead(event.threadID, true);
  } catch (e) {}
  try {
    await api.markAsSeen(Date.now());
  } catch (e) {}
};
