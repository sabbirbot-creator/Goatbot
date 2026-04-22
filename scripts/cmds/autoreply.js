const axios = require("axios");
const SABBIR_API = "https://sabbir-simisimi-api-71u6.onrender.com";
const CYBERBOT_API = "https://simsimi.cyberbot.top";

module.exports.config = {
  name: "autoreplybot",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "Ariful Islam Sabbir",
  hidden: true,
  usePrefix: false,
  category: "Chat",
  cooldowns: 2
};

module.exports.onChat = async function ({ message, event, api }) {
  const { body, senderID } = event;
  const botID = api.getCurrentUserID();

  if (!body || senderID == botID) return;

  const prefix = global.GoatBot?.config?.prefix || "/";
  if (body.startsWith(prefix)) return;

  const msg = body.toLowerCase().trim();

  // ১. ফিক্সড রিপ্লাই (আপনার আগেরগুলো)
  const responses = {
    "hi": "হেই😜",
    "hello": "বলো জান 🥰",
    "assalamualaikum": "Walaikumassalam❤️‍🩹",
    "salam": "Walaikumassalam❤️‍🩹",
    "bby": "ki oise ko",
    "i love you": "মেয়ে হলে আমার বস সাব্বির এর ইনবক্সে এখুনি গুঁতা দিন🫢😻",
    "love you": "মেয়ে হলে আমার বস সাব্বির এর ইনবক্সে এখুনি গুঁতা দিন🫢😻",
    "mc": "sem to u",
    "cudi": "গালি দিলে কিক ফ্রি"
  };

  if (responses[msg]) {
    return message.reply(responses[msg]);
  }

  // ২. এপিআই লজিক (সব মেসেজের জন্য রিপ্লাই দিবে)
  try {
    // প্রথমে আপনার Sabbir API-তে চেক করবে
    const resMy = await axios.get(`${SABBIR_API}/simsimi?text=${encodeURIComponent(body)}`);
    const myReply = resMy.data.text;

    // যদি আপনার ডাটাবেজে উত্তর না থাকে, তবে Cyberbot থেকে শিখবে
    if (!myReply || myReply.includes("I don't know") || myReply.includes("বুঝতে পারিনি")) {
      
      const resCyber = await axios.get(`${CYBERBOT_API}/simsimi?text=${encodeURIComponent(body)}`);
      const cyberReply = resCyber.data.text;

      if (cyberReply && !cyberReply.includes("I don't know")) {
        // আপনার Sabbir API-তে অটো-সেভ (Teach) করা
        const cleanReply = cyberReply.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '').trim();
        
        const teachUrl = `${SABBIR_API}/teach?ask=${encodeURIComponent(body)}&ans=${encodeURIComponent(cleanReply)}`;
        axios.get(teachUrl).catch(() => {}); // ব্যাকগ্রাউন্ডে সেভ হবে

        return message.reply(cyberReply);
      }
    } else {
      // আপনার ডাটাবেজে উত্তর থাকলে সেটাই দিবে
      return message.reply(myReply);
    }
  } catch (err) {
    console.log("API Error!");
  }
};

module.exports.onStart = async function ({ message, args }) {
  const input = args.join(" ");
  if (!input) return message.reply("কিছু একটা লিখে পাঠান...");

  try {
    const res = await axios.get(`${SABBIR_API}/simsimi?text=${encodeURIComponent(input)}`);
    return message.reply(res.data.text || "API-তে সমস্যা।");
  } catch (err) {
    return message.reply("সার্ভার এরর!");
  }
};
