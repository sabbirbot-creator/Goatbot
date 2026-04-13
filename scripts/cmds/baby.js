const axios = require("axios");

const TEACH_URL = "https://sabbir-baby-api.onrender.com/api/teach";
const CHAT_URL = "https://sabbir-baby-api.onrender.com/api/chat";

module.exports.config = {
  name: "teach",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Ariful Islam Sabbir",
  description: "Baby Bot কে নতুন কথা শেখাও",
  usePrefix: true,
  category: "Chat",
  usages: "teach q <প্রশ্ন> a <উত্তর>",
  cooldowns: 3
};

module.exports.onStart = async function ({ message, args }) {
  if (args.length === 0) {
    return message.reply(
      "📚 Baby Bot শেখানোর নিয়ম:\n\n" +
      "/teach q <প্রশ্ন> a <উত্তর>\n\n" +
      "উদাহরণ:\n" +
      "/teach q hi a hum\n" +
      "/teach q তুমি কেমন আছো a আলহামদুলিল্লাহ ভালো আছি"
    );
  }

  const qIndex = args.indexOf("q");
  const aIndex = args.indexOf("a");

  if (qIndex === -1 || aIndex === -1 || qIndex >= aIndex) {
    return message.reply(
      "❌ ভুল format!\n\n" +
      "সঠিক নিয়ম:\n" +
      "/teach q <প্রশ্ন> a <উত্তর>\n\n" +
      "যেমন: /teach q hi a hum"
    );
  }

  const question = args.slice(qIndex + 1, aIndex).join(" ").trim();
  const answer = args.slice(aIndex + 1).join(" ").trim();

  if (!question || !answer) {
    return message.reply(
      "❌ প্রশ্ন বা উত্তর খালি রাখা যাবে না!\n\n" +
      "যেমন: /teach q hi a hum"
    );
  }

  try {
    await axios.post(TEACH_URL, { question, answer }, {
      headers: { "Content-Type": "application/json" }
    });

    // verify it was saved
    const check = await axios.get(`${CHAT_URL}?msg=${encodeURIComponent(question)}`);
    const botReply = check.data.reply || "";

    return message.reply(
      `✅ শিখানো হয়েছে!\n\n` +
      `❓ প্রশ্ন: ${question}\n` +
      `💬 উত্তর: ${answer}\n\n` +
      `🔍 Test: ${botReply}`
    );
  } catch (err) {
    return message.reply("❌ সেভ করতে সমস্যা হয়েছে, একটু পরে আবার চেষ্টা করো।");
  }
};
