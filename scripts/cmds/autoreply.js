const axios = require("axios");

module.exports.config = {
  name: "autoreply",
  version: "1.3.0",
  hasPermssion: 0,
  credits: "Sabbir",
  description: "Reply on Bot's message or specific keywords",
  usePrefix: false,
  category: "chat"
};

module.exports.onStart = async function ({ message, event, api }) {
  const { body, messageReply, senderID } = event;
  const botID = api.getCurrentUserID();

  if (!body || senderID == botID) return;
  const msg = body.toLowerCase().trim();

  // ১. ফিক্সড কিওয়ার্ড রিপ্লাই (বট সরাসরি এগুলো বলবে)
  const fixedReplies = {
    "hi": "হেই জানু! বলো কী খবর? 😍",
    "hello": "হ্যালো কিউট বেবি! 🥰",
    "সালাম": "ওয়ালাইকুম আসসালাম রহমতুল্লাহ! ❤️",
    "assalamualaikum": "ওয়ালাইকুম আসসালাম! ❤️",
    "কি করো": "তোমার কথা ভাবছি! 🙈"
  };

  if (fixedReplies[msg]) {
    return message.reply(fixedReplies[msg]);
  }

  // ২. চেক: বটের মেসেজে রিপ্লাই অথবা কিওয়ার্ড দিয়ে শুরু
  const isReplyToBot = messageReply && String(messageReply.senderID) === String(botID);
  
  const keywords = ["bby", "baby", "jan", "suna", "robot", "simi", "বট", "বেবি"];
  const hasKeyword = keywords.some(word => msg.startsWith(word));

  if (isReplyToBot || hasKeyword) {
    // কিওয়ার্ড বাদ দিয়ে মেইন প্রশ্ন বের করা
    let query = body;
    keywords.forEach(word => {
      if (msg.startsWith(word)) {
        query = body.slice(word.length).trim();
      }
    });

    try {
      // ৩. সাইবারবট থেকে ডাইনামিক রিপ্লাই আনা
      const res = await axios.get(`https://simsimi.cyberbot.top/simsimi?text=${encodeURIComponent(query || body)}`);
      const reply = res.data.text || res.data.response;
      
      if (reply && !reply.includes("I don't know")) {
        return message.reply(reply);
      } else {
        return message.reply("হুমম, বলো শুনছি! 😇");
      }
    } catch (err) {
      console.error("Reply Error: " + err.message);
    }
  }
};
