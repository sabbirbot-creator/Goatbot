module.exports.config = {
  name: "autoseen",
  version: "3.0.0",
  role: 0,
  credits: "Ariful Islam Sabbir",
  hidden: true,
  usePrefix: false,
  category: "System",
  countDown: 0,
  shortDescription: "DM ও Group-এ message automatic seen করে"
};

module.exports.config = {
  name: "autoseen",
  version: "3.1.0",
  role: 0,
  credits: "Ariful Islam Sabbir",
  hidden: true,
  usePrefix: false,
  category: "System",
  countDown: 0,
  shortDescription: "DM ও Group-এ message automatic seen করে"
};

module.exports.onStart = async function () {};

module.exports.onChat = async function ({ api, event }) {
  if (event.body) {
    try {
      // এটি মেসেজটিকে সিন (Seen) হিসেবে মার্ক করবে
      await api.markAsRead(event.threadID);
    } catch (e) {
      // console.log(e);
    }
  }
};
