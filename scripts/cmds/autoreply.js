const axios = require("axios");

const SABBIR_API = "https://sabbir-simisimi-api-71u6.onrender.com";
const CYBERBOT_API = "https://simsimi.cyberbot.top";

module.exports.config = {
  name: "autoreplybot",
  version: "3.2.0",
  hasPermssion: 0,
  credits: "Ariful Islam Sabbir",
  hidden: true,
  usePrefix: false,
  category: "Chat",
  cooldowns: 1
};

module.exports.onChat = async function ({ message, event, api }) {
  const { body, senderID, threadID } = event;
  if (!body || senderID == api.getCurrentUserID()) return;

  const prefix = global.GoatBot?.config?.prefix || "/";
  if (body.startsWith(prefix)) return;

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

    try {
      // ২. আপনার Sabbir API ট্রাই করা
      const resMy = await axios.get(`${SABBIR_API}/simsimi?text=${encodeURIComponent(body)}`, { timeout: 5000 });
      botReply = resMy.data.text || resMy.data.reply;
    } catch (e) {
      console.log("Sabbir API (502/Timeout) - Switching to Cyberbot");
    }

    // ৩. আপনার API-তে উত্তর না থাকলে বা এরর হলে Cyberbot ব্যবহার করা
    if (!botReply || botReply.includes("I don't know") || botReply.includes("বুঝতে পারিনি")) {
      const resCyber = await axios.get(`${CYBERBOT_API}/simsimi?text=${encodeURIComponent(body)}`);
      botReply = resCyber.data.text || resCyber.data.response;

      if (botReply && !botReply.includes("I don't know")) {
        // ৪. ব্যাকগ্রাউন্ডে আপনার API-তে Teach করা
        const teachUrl = `${SABBIR_API}/teach?ask=${encodeURIComponent(body)}&ans=${encodeURIComponent(botReply)}&senderID=${senderID}&groupID=${threadID}`;
        axios.get(teachUrl).catch(() => {}); 
      }
    }

    if (botReply) return message.reply(botReply);

  } catch (err) {
    console.log("Final Error: " + err.message);
  }
};

module.exports.onStart = async function ({ message, args }) {
  const input = args.join(" ");
  if (!input) return message.reply("বলো বেবি...");
  try {
    const res = await axios.get(`${CYBERBOT_API}/simsimi?text=${encodeURIComponent(input)}`);
    message.reply(res.data.text || res.data.response || "হুমম...");
  } catch (e) {
    message.reply("API ডাউন আছে।");
  }
};
