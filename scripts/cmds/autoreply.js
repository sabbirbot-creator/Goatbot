const axios = require("axios");

// আপনার API এবং CyberBot API লিঙ্ক
const SABBIR_API = "https://sabbir-simisimi-api-71u6.onrender.com";
const CYBERBOT_API = "https://simsimi.cyberbot.top";

module.exports.config = {
  name: "autoreplybot",
  version: "5.0.0",
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

  // ১. ফিল্টার: বট নিজে নিজেকে বা কোনো কমান্ড রিপ্লাই দিবে না
  if (!body || senderID == botID) return;
  const prefix = global.GoatBot?.config?.prefix || "/";
  if (body.startsWith(prefix) || body.startsWith("!")) return;

  const msg = body.toLowerCase().trim();

  // ২. ফিক্সড রিপ্লাই
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

    if (botReply && !botReply.includes("I don't know") && !botReply.includes("বুঝতে পারিনি")) {
      
      // ৪. ইমোজি ফিল্টার
      const cleanReply = botReply.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '').trim();

      const finalMsg = cleanReply || "হুমম..."; 
      
      // ৫. ইউজারকে রিপ্লাই পাঠানো
      message.reply(finalMsg);

      // ৬. অটো-সেভ লজিক (সাইলেন্টলি আপনার এপিআই-তে সেভ হবে)
      if (finalMsg !== "হুমম...") {
        const teachUrl = `${SABBIR_API}/teach?ask=${encodeURIComponent(body)}&ans=${encodeURIComponent(finalMsg)}`;
        
        axios.get(teachUrl)
          .then((res) => {
            if (res.data.status === "success") {
              console.log(`[Auto-Save] ${body} -> ${finalMsg}`);
            }
          })
          .catch(() => {
            // এপিআই অফলাইন থাকলে কনসোলে কোনো ঝামেলা করবে না
          });
      }
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
    
    const cleanReply = reply.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '').trim();
    
    message.reply(cleanReply || "হুমম...");
  } catch (e) {
    message.reply("সার্ভার ডাউন।");
  }
};
