const axios = require("axios");

// API লিঙ্কগুলো
const SABBIR_API = "https://sabbir-simisimi-api-71u6.onrender.com";
const CYBERBOT_API = "https://simsimi.cyberbot.top";

module.exports.config = {
  name: "autoteach",
  version: "3.1.0",
  hasPermssion: 0,
  credits: "Ariful Islam Sabbir",
  description: "ব্যাকগ্রাউন্ডে প্রশ্ন-উত্তর ০, ১, ২ ফরম্যাটে সেভ করা",
  usePrefix: false,
  category: "Chat",
  hidden: true, // আপনার চাওয়া অনুযায়ী হাইড করা হলো
  cooldowns: 1
};

module.exports.onChat = async function ({ event, api }) {
  const { body, senderID } = event;
  const botID = api.getCurrentUserID();

  // ১. বেসিক ফিল্টার
  if (!body || senderID == botID) return;
  const prefix = global.GoatBot?.config?.prefix || "/";
  if (body.startsWith(prefix) || body.startsWith("!")) return;

  try {
    // ২. সাইবারবট থেকে উত্তর সংগ্রহ
    const res = await axios.get(`${CYBERBOT_API}/simsimi?text=${encodeURIComponent(body)}`);
    const reply = res.data.text || res.data.response;

    // ৩. ভ্যালিড উত্তর চেক ও ইমোজি ক্লিন
    if (reply && !reply.includes("I don't know") && !reply.includes("বুঝতে পারিনি")) {
      
      const cleanAns = reply.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '').trim();

      if (cleanAns.length > 0) {
        // ৪. আপনার রেন্ডার এপিআই-তে পাঠানো (০, ১, ২ ফরম্যাটের জন্য)
        const teachUrl = `${SABBIR_API}/teach?ask=${encodeURIComponent(body)}&ans=${encodeURIComponent(cleanAns)}`;
        
        axios.get(teachUrl)
          .then((response) => {
            if (response.data.status === "success") {
              console.log(`[Auto-Teach] Saved: ${body} -> ${cleanAns}`);
            }
          })
          .catch((err) => {
            console.log("[Auto-Teach] API is likely sleeping.");
          });
      }
    }
  } catch (error) {
    // সাইলেন্ট এরর হ্যান্ডেল
  }
};
