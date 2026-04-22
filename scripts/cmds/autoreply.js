const axios = require("axios");

// আপনার ডাটাবেজ API
const SABBIR_API = "https://sabbir-simisimi-api-71u6.onrender.com";
// সোর্স API (Cyberbot)
const CYBERBOT_API = "https://simsimi.cyberbot.top";

module.exports.config = {
  name: "autoreplybot",
  version: "3.1.0",
  hasPermssion: 0,
  credits: "Ariful Islam Sabbir",
  hidden: true,
  usePrefix: false,
  category: "Chat",
  cooldowns: 2
};

module.exports.onChat = async function ({ message, event, api }) {
  const { body, senderID, threadID } = event;
  const botID = api.getCurrentUserID();

  // ১. বেসিক চেক
  if (!body || senderID == botID) return;

  const prefix = global.GoatBot?.config?.prefix || "/";
  if (body.startsWith(prefix)) return;

  const msg = body.toLowerCase().trim();

  // ২. ফিক্সড রিপ্লাই
  const quickResponses = {
    "hi": "হেই😜",
    "hello": "বলো জান 🥰",
    "salam": "Walaikumassalam❤️‍🩹",
    "assalamualaikum": "Walaikumassalam❤️‍🩹"
  };

  if (quickResponses[msg]) return message.reply(quickResponses[msg]);

  try {
    // ৩. আপনার Sabbir API-তে চেক করা
    // এখানে getNameUser বাদ দিয়েছি এরর এড়াতে
    const resMy = await axios.get(`${SABBIR_API}/simsimi?text=${encodeURIComponent(body)}`);
    let myReply = resMy.data.text || resMy.data.reply;

    // ৪. যদি আপনার কাছে উত্তর না থাকে, তবে Cyberbot থেকে শেখা
    if (!myReply || myReply.includes("I don't know") || myReply.includes("বুঝতে পারিনি")) {
      
      const resCyber = await axios.get(`${CYBERBOT_API}/simsimi?text=${encodeURIComponent(body)}`);
      // Cyberbot থেকে আসা উত্তর (এটি .text বা .response হতে পারে, আপনার আগের ফাইল অনুযায়ী .text দিলাম)
      const cyberReply = resCyber.data.text || resCyber.data.response;

      if (cyberReply && !cyberReply.includes("I don't know")) {
        
        // ৫. আপনার Sabbir API-তে অটো-সেভ করা (Teach)
        const teachUrl = `${SABBIR_API}/teach?ask=${encodeURIComponent(body)}&ans=${encodeURIComponent(cyberReply)}&senderID=${senderID}&groupID=${threadID}`;
        
        // ব্যাকগ্রাউন্ডে সেভ হবে
        axios.get(teachUrl).catch(() => {}); 

        return message.reply(cyberReply);
      }
    } else {
      // আপনার কাছে উত্তর থাকলে সেটাই দিবে
      return message.reply(myReply);
    }
  } catch (err) {
    // এরর আসলে কনসোলে দেখাবে কিন্তু বট ক্রাশ করবে না
    console.log("Simi Error: " + err.message);
  }
};

module.exports.onStart = async function ({ message, args }) {
  const input = args.join(" ");
  if (!input) return message.reply("কিছু একটা বলো...");

  try {
    const res = await axios.get(`${SABBIR_API}/simsimi?text=${encodeURIComponent(input)}`);
    return message.reply(res.data.text || res.data.reply || "উমম...");
  } catch (err) {
    return message.reply("সার্ভার এরর!");
  }
};
