const axios = require("axios");

const SABBIR_API = "https://sabbir-simisimi-api-71u6.onrender.com";
const CYBERBOT_API = "https://simsimi.cyberbot.top";

module.exports.config = {
  name: "autoreplybot",
  version: "6.0.0",
  hasPermssion: 0,
  credits: "Ariful Islam Sabbir",
  hidden: true,
  usePrefix: false,
  category: "Chat",
  cooldowns: 1
};

module.exports.onChat = async function ({ message, event, api }) {
  const { body, senderID, type, messageReply } = event;
  const botID = api.getCurrentUserID();

  if (!body || senderID == botID) return;
  const prefix = global.GoatBot?.config?.prefix || "/";
  if (body.startsWith(prefix) || body.startsWith("!")) return;

  const msg = body.toLowerCase().trim();

  // ১. নির্দিষ্ট কিওয়ার্ড চেক (এগুলো থাকলে সরাসরি উত্তর দিবে)
  const quickResponses = {
    "hi": "হেই",
    "hello": "বলো জান",
    "bby": "ki oise bby🥹",
    "assalamualaikum": "Walaikumassalam"
  };
  
  if (quickResponses[msg]) return message.reply(quickResponses[msg]);

  // ২. রিপ্লাই চেক: যদি কেউ বটের মেসেজে রিপ্লাই না দেয়, তবে বট চুপ থাকবে
  // শুধুমাত্র নির্দিষ্ট কিওয়ার্ড ছাড়া অন্য সব কথার জন্য এই নিয়ম
  if (type !== "message_reply" || messageReply.senderID !== botID) return;

  try {
    const resCyber = await axios.get(`${CYBERBOT_API}/simsimi?text=${encodeURIComponent(body)}`);
    let botReply = resCyber.data.text || resCyber.data.response;

    if (botReply && !botReply.includes("I don't know")) {
      const cleanReply = botReply.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '').trim();
      const finalMsg = cleanReply || "হুমম..."; 
      
      message.reply(finalMsg);

      // ৩. অটো-সেভ (সাইলেন্টলি আপনার ০,১,২ ফরম্যাটে সেভ হবে)
      if (finalMsg !== "হুমম...") {
        const teachUrl = `${SABBIR_API}/teach?ask=${encodeURIComponent(body)}&ans=${encodeURIComponent(finalMsg)}`;
        axios.get(teachUrl).catch(() => {});
      }
    }
  } catch (err) {
    console.log("Reply Error: " + err.message);
  }
};

module.exports.onStart = async function ({ message, args }) {
  // onStart সাধারণত কমান্ড দিলে কাজ করে, তাই এখানে আগের মতোই থাকলো
  const input = args.join(" ");
  if (!input) return message.reply("বলো...");
  try {
    const res = await axios.get(`${CYBERBOT_API}/simsimi?text=${encodeURIComponent(input)}`);
    let reply = res.data.text || res.data.response;
    const cleanReply = reply.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '').trim();
    message.reply(cleanReply || "হুমম...");
  } catch (e) {
    message.reply("সার্ভার ডাউন।");
  }
};
