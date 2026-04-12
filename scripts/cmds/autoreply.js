const axios = require("axios");

const API_URL = "https://sabbir-baby-api.onrender.com/api/chat";

module.exports.config = {
  name: "autoreplybot",
  version: "1.1.0",
  hasPermssion: 0,
  credits: "sabbir",
  hidden: true,
  usePrefix: false,
  category: "Chat",
  cooldowns: 0
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

module.exports.onChat = async function ({ message, event }) {
  const { body, messageReply, senderID } = event;
  if (!body) return;

  const prefix = global.GoatBot?.config?.prefix || "/";

  if (body.startsWith(prefix)) return;

  const msg = body.toLowerCase().trim();
  const botID = global.GoatBot.botID;

  if (messageReply && String(messageReply.senderID) === String(botID)) {
    try {
      const res = await axios.get(`${API_URL}?msg=${encodeURIComponent(body)}`);
      const reply = res.data.reply || "বুঝতে পারিনি সোনা!";
      return message.reply(reply);
    } catch (err) {
      return message.reply("API এ সমস্যা হচ্ছে, পরে ট্রাই করো।");
    }
  }

  const responses = {
    "hi": "বলো জান 🥰",
    "hello": "বলো জান 🥰",
    "sabbir": "উনি এখন কাজে বিজি আছে কি বলবেন আমাকে বলতে পারেন..!😘",
    "assalamualaikum": "Walaikumassalam❤️‍🩹",
    "salam": "Walaikumassalam❤️‍🩹",
    "miss you": "অরেক বেডারে Miss না করে xan মেয়ে হলে বস সাব্বির রে হাঙ্গা করো😶👻😘",
    "i love you": "মেয়ে হলে আমার বস সাব্বির এর ইনবক্সে এখুনি গুঁতা দিন🫢😻",
    "love you": "মেয়ে হলে আমার বস সাব্বির এর ইনবক্সে এখুনি গুঁতা দিন🫢😻",
    "ok": "Okay সোনা 🥰",
    "hmm": "Hmmm কিসের হুমম জানু 🥵",
    "ভালো আছো": "হ্যাঁ ভালো আছি, তুমি কেমন আছো? 😊",
    "কেমন আছো": "আলহামদুলিল্লাহ ভালো আছি 😊 তুমি?"
  };

  if (responses[msg]) {
    return message.reply(responses[msg]);
  }
};
