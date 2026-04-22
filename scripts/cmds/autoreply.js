const axios = require("axios");

// আপনার ডাটাবেজ API
const SABBIR_API = "https://sabbir-simisimi-api-71u6.onrender.com";
// সোর্স API (Cyberbot)
const CYBERBOT_API = "https://simsimi.cyberbot.top";

module.exports.config = {
  name: "autoreplybot",
  version: "3.0.0",
  hasPermssion: 0,
  credits: "Ariful Islam Sabbir",
  hidden: true,
  usePrefix: false,
  category: "Chat",
  cooldowns: 2
};

module.exports.onChat = async function ({ message, event, api, Users }) {
  const { body, senderID, threadID } = event;
  const botID = api.getCurrentUserID();

  if (!body || senderID == botID) return;

  const prefix = global.GoatBot?.config?.prefix || "/";
  if (body.startsWith(prefix)) return;

  const msg = body.toLowerCase().trim();

  // ১. ফিক্সড রিপ্লাই (স্প্যামিং এড়াতে)
  const quickResponses = {
    "hi": "হেই😜",
    "hello": "বলো জান 🥰",
    "salam": "Walaikumassalam❤️‍🩹",
    "assalamualaikum": "Walaikumassalam❤️‍🩹",
    "i love you": "মেয়ে হলে আমার বস সাব্বির এর ইনবক্সে এখুনি গুঁতা দিন🫢😻"
  };

  if (quickResponses[msg]) return message.reply(quickResponses[msg]);

  try {
    const senderName = await Users.getNameUser(senderID);

    // ২. প্রথমে আপনার Sabbir API-তে উত্তর খোঁজা
    // নোট: আপনার এন্ডপয়েন্ট অনুযায়ী এখানে ?text= ব্যবহার করা হয়েছে
    const resMy = await axios.get(`${SABBIR_API}/simsimi?text=${encodeURIComponent(body)}`);
    let myReply = resMy.data.text || resMy.data.reply;

    // ৩. যদি আপনার ডাটাবেজে উত্তর না থাকে (বা এরর দেয়)
    if (!myReply || myReply.includes("I don't know") || myReply.includes("বুঝতে পারিনি")) {
      
      // Cyberbot থেকে উত্তর নিয়ে আসা
      const resCyber = await axios.get(`${CYBERBOT_API}/simsimi?text=${encodeURIComponent(body)}&senderName=${encodeURIComponent(senderName)}`);
      
      // Cyberbot এর রেসপন্স 'response' কি-তে থাকে
      const cyberReply = resCyber.data.response;

      if (cyberReply && !cyberReply.includes("I don't know")) {
        
        // ৪. আপনার Sabbir API-তে অটো-সেভ (Teach) করা
        const cleanReply = cyberReply.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '').trim();

        if (cleanReply.length > 0) {
          // আপনার API-এর teach এন্ডপয়েন্ট অনুযায়ী প্যারামিটার সেট করা
          const teachUrl = `${SABBIR_API}/teach?ask=${encodeURIComponent(body)}&ans=${encodeURIComponent(cleanReply)}&senderID=${senderID}&senderName=${encodeURIComponent(senderName)}&groupID=${threadID}`;
          axios.get(teachUrl).catch(() => {}); 
        }

        return message.reply(cyberReply);
      }
    } else {
      // আপনার কাছে উত্তর থাকলে সেটাই দিবে
      return message.reply(myReply);
    }
  } catch (err) {
    console.log("Simi API Error: " + err.message);
  }
};

module.exports.onStart = async function ({ message, args }) {
  // ম্যানুয়াল কমান্ডের জন্য (যেমন: !simi hello)
  const input = args.join(" ");
  if (!input) return message.reply("কিছু একটা লিখে পাঠান...");

  try {
    const res = await axios.get(`${SABBIR_API}/simsimi?text=${encodeURIComponent(input)}`);
    return message.reply(res.data.text || res.data.reply || "উমম... কিছু বুঝলাম না!");
  } catch (err) {
    return message.reply("সার্ভারে সমস্যা হচ্ছে।");
  }
};
