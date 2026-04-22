const axios = require("axios");

const CYBERBOT_API = "https://simsimi.cyberbot.top";

module.exports.config = {
  name: "autoreplybot",
  version: "4.0.0",
  hasPermssion: 0,
  credits: "Ariful Islam Sabbir",
  hidden: true,
  usePrefix: false,
  category: "Chat",
  cooldowns: 1
};

module.exports.onChat = async function ({ message, event, api }) {
  const { body, senderID } = event;
  const botID = api.getCurrentUserID();

  // ১. বট নিজে নিজেকে রিপ্লাই দিবে না
  if (!body || senderID == botID) return;

  const prefix = global.GoatBot?.config?.prefix || "/";
  if (body.startsWith(prefix)) return;

  const msg = body.toLowerCase().trim();

  // ২. ফিক্সড রিপ্লাই (এগুলো থেকেও ইমোজি সরাতে চাইলে সরাতে পারেন)
  const quickResponses = {
    "hi": "হেই",
    "hello": "বলো জান",
    "salam": "Walaikumassalam",
    "assalamualaikum": "Walaikumassalam"
  };
  
  if (quickResponses[msg]) return message.reply(quickResponses[msg]);

  try {
    // ৩. সাইবারবট থেকে রিপ্লাই নেওয়া
    const resCyber = await axios.get(`${CYBERBOT_API}/simsimi?text=${encodeURIComponent(body)}`);
    let botReply = resCyber.data.text || resCyber.data.response;

    if (botReply && !botReply.includes("I don't know")) {
      
      // ৪. ইমোজি ব্লকার (Regex ব্যবহার করে সব ইমোজি মুছে ফেলা)
      const cleanReply = botReply.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '').trim();

      // যদি ইমোজি সরানোর পর কিছু লেখা বাকি থাকে তবে সেটা পাঠাবে, নয়তো অরিজিনাল মেসেজ (যদি শুধু ইমোজিই উত্তর হয়)
      const finalMsg = cleanReply || "হুমম..."; 
      return message.reply(finalMsg);
    }

  } catch (err) {
    console.log("Reply Error: " + err.message);
  }
};

module.exports.onStart = async function ({ message, args }) {
  const input = args.join(" ");
  if (!input) return message.reply("বলো...");
  try {
    const res = await axios.get(`${CYBERBOT_API}/simsimi?text=${encodeURIComponent(input)}`);
    let reply = res.data.text || res.data.response;
    
    // স্টার্ট কমান্ডেও ইমোজি ফিল্টার
    const cleanReply = reply.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '').trim();
    
    message.reply(cleanReply || "হুমম...");
  } catch (e) {
    message.reply("সার্ভার ডাউন।");
  }
};
