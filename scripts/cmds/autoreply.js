const axios = require("axios");
const https = require("https");

const SABBIR_API = "https://sabbir-simisimi-api-71u6.onrender.com";
const CYBERBOT_API = "https://simsimi.cyberbot.top";

// সিকিউরিটি ওয়ার্নিং বা SSL ব্লক এড়ানোর জন্য এজেন্ট
const agent = new https.Agent({  
  rejectUnauthorized: false 
});

module.exports.config = {
  name: "autoreplybot",
  version: "4.2.0",
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
  if (body.startsWith(prefix) || body.startsWith("!")) return;

  try {
    let botReply = "";

    // ১. আপনার API থেকে উত্তর খোঁজা
    try {
      const resMy = await axios.get(`${SABBIR_API}/simsimi?text=${encodeURIComponent(body)}`, { 
        timeout: 8000,
        httpsAgent: agent // সিকিউরিটি বাইপাস
      });
      botReply = resMy.data.text || resMy.data.reply;
    } catch (e) {
      console.log("Sabbir API Sleep mode e ache...");
    }

    // ২. আপনার কাছে উত্তর না থাকলে Cyberbot থেকে আনা
    if (!botReply || botReply.includes("I don't know") || botReply.includes("বুঝতে পারিনি")) {
      const resCyber = await axios.get(`${CYBERBOT_API}/simsimi?text=${encodeURIComponent(body)}`);
      const originalReply = resCyber.data.text || resCyber.data.response;

      if (originalReply && !originalReply.includes("I don't know")) {
        
        // ৩. ইমোজি ফিল্টার করা (ডাটাবেজে সেভ করার জন্য)
        const emojiRegex = /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g;
        const cleanReply = originalReply.replace(emojiRegex, '').trim();

        // ৪. Teach করার রিকোয়েস্ট (জোরপূর্বক পাঠানো)
        if (cleanReply.length > 0) {
          const teachUrl = `${SABBIR_API}/teach?ask=${encodeURIComponent(body)}&ans=${encodeURIComponent(cleanReply)}&senderID=${senderID}&groupID=${threadID}`;
          
          axios.get(teachUrl, { httpsAgent: agent })
            .then(() => console.log("—> Sabbir API-te Teach hoyeche!"))
            .catch(err => console.log("—> Teach failed again: " + err.message));
        }

        return message.reply(originalReply);
      }
    } else {
      return message.reply(botReply);
    }

  } catch (err) {
    console.log("Main Error: " + err.message);
  }
};
