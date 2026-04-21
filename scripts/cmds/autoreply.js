const axios = require("axios");
const API_URL = "https://simsimi.cyberbot.top";

module.exports.config = {
  name: "autoreplybot",
  version: "1.2.0",
  hasPermssion: 0,
  credits: "Ariful Islam Sabbir",
  hidden: true,
  usePrefix: false,
  category: "Chat",
  cooldowns: 2
};

module.exports.onChat = async function ({ message, event, api }) {
  const { body, messageReply, senderID } = event;
  const botID = api.getCurrentUserID();

  // ১. যদি মেসেজ না থাকে বা মেসেজটি বট নিজে পাঠায়, তবে থেমে যাও
  if (!body || senderID == botID) return;

  const prefix = global.GoatBot?.config?.prefix || "/";
  // ২. যদি মেসেজটি কোনো কমান্ড হয় (যেমন /help), তবে এই অটো রিপ্লাই কাজ করবে না
  if (body.startsWith(prefix)) return;

  const msg = body.toLowerCase().trim();

  // ৩. ফিক্সড রিপ্লাই চেক (এখানে স্প্যাম হওয়ার ভয় নেই)
  const responses = {
    "hi": " হেই😜",
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

  // ৪. যদি কেউ বটের মেসেজে রিপ্লাই দেয়, শুধু তখনই API কল হবে
  if (messageReply && String(messageReply.senderID) === String(botID)) {
    try {
      const res = await axios.get(`${API_URL}?msg=${encodeURIComponent(body)}`);
      const reply = res.data.reply || "বুঝতে পারিনি সোনা!";
      return message.reply(reply);
    } catch (err) {
      // API এরর দিলে বারবার মেসেজ না পাঠিয়ে চুপ থাকা ভালো
      return; 
    }
  }
};

module.exports.onStart = async function ({ message, args }) {
  const input = args.join(" ");
  if (!input) return message.reply("কিছু একটা লিখে পাঠান...");

  try {
    const res = await axios.get(`${API_URL}?msg=${encodeURIComponent(input)}`);
    const reply = res.data.reply || "বুঝতে পারিনি সোনা!";
    return message.reply(reply);
  } catch (err) {
    return message.reply("API এ সমস্যা হচ্ছে, পরে ট্রাই করো।");
  }
};
