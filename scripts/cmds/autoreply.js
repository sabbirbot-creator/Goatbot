const axios = require('axios');

module.exports = {
  config: {
    name: "simiAuto",
    version: "9.0.0",
    author: "Sabbir",
    category: "system"
  },

  onChat: async function ({ api, event }) {
    if (!event.body || event.senderID == api.getCurrentUserID()) return;

    const input = event.body.toLowerCase().trim();
    const sabbirApi = "https://sabbir-simisimi-api-71u6.onrender.com";
    const cyberbotApi = "https://simsimi.cyberbot.top";

    try {
      // ১. প্রথমে আপনার নিজের (Sabbir API) ডাটাবেজে চেক করা
      const checkMyDb = await axios.get(`${sabbirApi}/simsimi?text=${encodeURIComponent(input)}`);
      
      // আপনার API যদি উত্তর দিতে না পারে (I don't know...) তবেই শিখতে যাবে
      if (!checkMyDb.data || checkMyDb.data.text.includes("I don't know")) {
        
        // ২. Cyberbot API থেকে উত্তর নিয়ে আসা
        const resCyber = await axios.get(`${cyberbotApi}/simsimi?text=${encodeURIComponent(input)}`);
        const cyberReply = resCyber.data.text;

        if (cyberReply && !cyberReply.includes("I don't know")) {
          // ৩. ইমোজি সরিয়ে আপনার Sabbir API-তে Teach করা
          const cleanReply = cyberReply.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '').trim();

          if (cleanReply.length > 0) {
            const teachUrl = `${sabbirApi}/teach?ask=${encodeURIComponent(input)}&ans=${encodeURIComponent(cleanReply)}`;
            
            // ব্যাকগ্রাউন্ডে আপনার ডাটাবেজে সেভ হচ্ছে
            axios.get(teachUrl).catch(e => console.log("Sabbir DB Save Error"));
          }

          // ইউজারকে রিপ্লাই দেওয়া (অরিজিনাল উত্তরটিই দিবে)
          return api.sendMessage(cyberReply, event.threadID, event.messageID);
        }
      } else {
        // ৪. যদি আপনার নিজের ডাটাবেজেই উত্তর থাকে, তবে সেখান থেকেই রিপ্লাই দিবে
        return api.sendMessage(checkMyDb.data.text, event.threadID, event.messageID);
      }
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

    } catch (error) {
      console.error("System Error:", error.message);
    }
  }
};
