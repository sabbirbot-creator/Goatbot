const axios = require("axios");

const SABBIR_API = "https://sabbir-simisimi-api-71u6.onrender.com";
const CYBERBOT_API = "https://simsimi.cyberbot.top";

module.exports.config = {
  name: "autoreplybot",
  version: "4.1.0",
  hasPermssion: 0,
  credits: "Ariful Islam Sabbir",
  hidden: true,
  usePrefix: false,
  category: "Chat",
  cooldowns: 1
};

module.exports.onChat = async function ({ message, event, api }) {
  const { body, senderID, threadID } = event;
  const botID = api.getCurrentUserID();

  if (!body || senderID == botID) return;

  const prefix = global.GoatBot?.config?.prefix || "/";
  if (body.startsWith(prefix) || body.startsWith("!")) return;

  const msg = body.toLowerCase().trim();

  // ১. ফিক্সড রিপ্লাই
  const quickResponses = {
    "hi": "হেই😜",
    "hello": "বলো জান 🥰",
    "salam": "Walaikumassalam❤️‍🩹",
    "assalamualaikum": "Walaikumassalam❤️‍🩹"
  };
  if (quickResponses[msg]) return message.reply(quickResponses[msg]);

  try {
    let botReply = "";

    // ২. আপনার ডাটাবেজে চেক করা (স্লিপ মোড হ্যান্ডেল করতে ১০ সেকেন্ড টাইমআউট)
    try {
      const resMy = await axios.get(`${SABBIR_API}/simsimi?text=${encodeURIComponent(body)}`, { timeout: 10000 });
      botReply = resMy.data.text || resMy.data.reply;
    } catch (e) {
      console.log("Sabbir API is starting up or unreachable.");
    }

    // ৩. আপনার কাছে না থাকলে Cyberbot থেকে উত্তর আনা
    if (!botReply || botReply.includes("I don't know") || botReply.includes("বুঝতে পারিনি")) {
      const resCyber = await axios.get(`${CYBERBOT_API}/simsimi?text=${encodeURIComponent(body)}`);
      const originalReply = resCyber.data.text || resCyber.data.response;

      if (originalReply && !originalReply.includes("I don't know")) {
        
        // ৪. ইমোজি ফিল্টার করা (ডাটাবেজে সেভ করার জন্য)
        const emojiRegex = /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g;
        const cleanReply = originalReply.replace(emojiRegex, '').replace(/\s+/g, ' ').trim();

        // ৫. ব্যাকগ্রাউন্ডে Teach করা (ইমোজি ছাড়া)
        if (cleanReply.length > 0) {
          const teachUrl = `${SABBIR_API}/teach?ask=${encodeURIComponent(body)}&ans=${encodeURIComponent(cleanReply)}&senderID=${senderID}&groupID=${threadID}`;
          
          // await ব্যবহার করিনি যাতে বট রিপ্লাই দিতে দেরি না করে
          axios.get(teachUrl)
            .then(() => console.log("Cleaned reply saved to Sabbir API!"))
            .catch(() => console.log("Teaching failed (Server sleep/Error)."));
        }

        // ইউজারকে অরিজিনাল রিপ্লাই দিবে (ইমোজি সহ)
        return message.reply(originalReply);
      }
    } else {
      // আপনার ডাটাবেজে উত্তর থাকলে সেটিই দিবে
      return message.reply(botReply);
    }

  } catch (err) {
    console.log("System Error: " + err.message);
  }
};

module.exports.onStart = async function ({ message, args }) {
  const input = args.join(" ");
  if (!input) return message.reply("বলো জান...");
  try {
    const res = await axios.get(`${CYBERBOT_API}/simsimi?text=${encodeURIComponent(input)}`);
    message.reply(res.data.text || res.data.response || "হুমম?");
  } catch (e) {
    message.reply("API ডাউন!");
  }
};
