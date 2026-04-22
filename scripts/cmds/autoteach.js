module.exports.config = {
  name: "autoteach",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Ariful Islam Sabbir",
  hidden: true,
  usePrefix: false,
  category: "Chat",
  cooldowns: 1
};
const axios = require("axios");

// আপনার আপডেট করা রেন্ডার এপিআই লিঙ্ক
const SABBIR_API = "https://sabbir-simisimi-api-71u6.onrender.com";
const CYBERBOT_API = "https://simsimi.cyberbot.top";

module.exports.config = {
  name: "autoteach",
  version: "3.0.0",
  hasPermssion: 0,
  credits: "Ariful Islam Sabbir",
  description: "ব্যাকগ্রাউন্ডে প্রশ্ন-উত্তর ০, ১, ২ ফরম্যাটে সেভ করা",
  usePrefix: false,
  category: "system"
};

module.exports.onChat = async function ({ event, api }) {
  const { body, senderID } = event;
  const botID = api.getCurrentUserID();

  // ১. বট নিজে বা কোনো কমান্ড হলে সেটা সেভ করবে না
  if (!body || senderID == botID) return;
  const prefix = global.GoatBot?.config?.prefix || "/";
  if (body.startsWith(prefix) || body.startsWith("!")) return;

  try {
    // ২. সাইবারবট থেকে উত্তর সংগ্রহ করা
    const res = await axios.get(`${CYBERBOT_API}/simsimi?text=${encodeURIComponent(body)}`);
    const reply = res.data.text || res.data.response;

    // ৩. ভ্যালিড উত্তর চেক করা (ইমোজি ক্লিন করে)
    if (reply && !reply.includes("I don't know") && !reply.includes("বুঝতে পারিনি")) {
      
      // ডাটাবেজ ক্লিন রাখতে ইমোজি রিমুভ করা
      const cleanAns = reply.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '').trim();

      if (cleanAns.length > 0) {
        // ৪. আপনার রেন্ডার এপিআই-তে পাঠানো
        // আপনার এপিআই এখন অটোমেটিক ০, ১, ২ ইনডেক্স করে সেভ করবে
        const teachUrl = `${SABBIR_API}/teach?ask=${encodeURIComponent(body)}&ans=${encodeURIComponent(cleanAns)}`;
        
        axios.get(teachUrl)
          .then((response) => {
            if (response.data.status === "success") {
              console.log(`[Auto-Teach] Saved: ${body} -> ${cleanAns}`);
            } else if (response.data.status === "duplicate") {
              console.log(`[Auto-Teach] Skip: Duplicate answer for "${body}"`);
            }
          })
          .catch((err) => {
            // এপিআই অফলাইন বা স্লিপ মোডে থাকলে কনসোলে দেখাবে
            console.log("[Auto-Teach] API Connection Error or Sleeping.");
          });
      }
    }
  } catch (error) {
    // সাইলেন্টলি এরর হ্যান্ডেল করা
  }
};

