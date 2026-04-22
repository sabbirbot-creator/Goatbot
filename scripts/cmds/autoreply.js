const axios = require("axios");
const https = require("https");

const SABBIR_API = "https://sabbir-simisimi-api-71u6.onrender.com";
const CYBERBOT_API = "https://simsimi.cyberbot.top";

// সিকিউরিটি ওয়ার্নিং বাইপাস করার এজেন্ট
const agent = new https.Agent({  
  rejectUnauthorized: false 
});

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
  const { body, senderID, threadID } = event;
  if (!body || senderID == api.getCurrentUserID()) return;

  if (body.startsWith("/") || body.startsWith("!")) return;

  try {
    let botReply = "";

    // ১. আপনার API থেকে উত্তর খোঁজা
    try {
      const resMy = await axios.get(`${SABBIR_API}/simsimi?text=${encodeURIComponent(body)}`, { 
        httpsAgent: agent,
        timeout: 15000 // Render জাগতে সময় নেয় তাই ১৫ সেকেন্ড দেওয়া হয়েছে
      });
      botReply = resMy.data.text || resMy.data.reply;
    } catch (e) {
      console.log("Sabbir API response error, switching source...");
    }

    // ২. যদি উত্তর না থাকে তবে Cyberbot থেকে শেখা
    if (!botReply || botReply.includes("I don't know") || botReply.includes("বুঝতে পারিনি")) {
      const resCyber = await axios.get(`${CYBERBOT_API}/simsimi?text=${encodeURIComponent(body)}`);
      const originalReply = resCyber.data.text || resCyber.data.response;

      if (originalReply && !originalReply.includes("I don't know")) {
        
        // ৩. ইমোজি ছাড়া ক্লিন রিপ্লাই (আপনার পছন্দমতো)
        const cleanReply = originalReply.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '').trim();

        // ৪. Teach করার আসল লজিক
        if (cleanReply.length > 0) {
          const teachUrl = `${SABBIR_API}/teach?ask=${encodeURIComponent(body)}&ans=${encodeURIComponent(cleanReply)}`;
          
          // এখানে headers যোগ করা হয়েছে যেন Render ব্লক না করে
          axios.get(teachUrl, { 
            httpsAgent: agent,
            headers: {
              'User-Agent': 'Mozilla/5.0'
            }
          })
          .then(() => console.log("Success: Learned new words!"))
          .catch(err => console.log("Teach failed: " + err.message));
        }

        return message.reply(originalReply);
      }
    } else {
      return message.reply(botReply);
    }
  } catch (err) {
    console.log("Chat error: " + err.message);
  }
};
