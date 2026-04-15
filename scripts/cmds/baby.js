const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const DB_PATH = path.join(process.cwd(), "database", "teach.json");

function loadDB() {
  try {
    if (!fs.existsSync(DB_PATH)) fs.writeJsonSync(DB_PATH, {});
    return fs.readJsonSync(DB_PATH);
  } catch (e) {
    return {};
  }
}

function saveDB(data) {
  try {
    fs.writeJsonSync(DB_PATH, data, { spaces: 2 });
  } catch (e) {}
}

function normalize(str) {
  return (str || "").toLowerCase().trim().replace(/\s+/g, " ");
}

const TEACH_URL = "https://sabbir-baby-api.onrender.com/api/teach";
const CHAT_URL  = "https://sabbir-baby-api.onrender.com/api/chat";

module.exports.config = {
  name: "teach",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "Ariful Islam Sabbir",
  description: "Bot কে প্রশ্ন-উত্তর শেখাও",
  usePrefix: true,
  category: "Chat",
  usages: "teach q <প্রশ্ন> a <উত্তর> | reply করে /teach ans",
  cooldowns: 3
};

module.exports.onStart = async function ({ api, event, message }) {
  const { threadID, messageID, messageReply, body } = event;

  const fullText = (body || "").trim();
  const lower = normalize(fullText);

  if (lower === "teach ans" || lower.startsWith("teach ans ")) {
    if (!messageReply || !messageReply.body) {
      return message.reply(
        "❌ কোনো message এ reply করোনি!\n\n" +
        "📌 ব্যবহার:\n" +
        "  যে message টাকে প্রশ্ন হিসেবে সেট করতে চাও,\n" +
        "  সেটায় reply করে '/teach ans' লিখো"
      );
    }

    const question = messageReply.body.trim();
    if (!question) return message.reply("❌ Reply করা message এ কোনো text নেই!");

    const sentMsg = await message.reply(
      `❓ প্রশ্ন সেট হয়েছে:\n"${question}"\n\n` +
      `✏️ এখন এই message এ reply করে উত্তর লিখো:`
    );

    if (sentMsg && sentMsg.messageID) {
      global.GoatBot.onReply.set(sentMsg.messageID, {
        commandName: "teach",
        author: String(event.senderID),
        pendingQuestion: question
      });
    }
    return;
  }

  if (lower === "teach list") {
    const db = loadDB();
    const keys = Object.keys(db);
    if (keys.length === 0) return message.reply("📭 এখনো কিছু শেখানো হয়নি!\n\nশেখাতে: /teach q <প্রশ্ন> a <উত্তর>");
    let text = `📚 মোট ${keys.length}টি Q&A:\n\n`;
    keys.slice(0, 20).forEach((q, i) => {
      text += `${i + 1}. ❓ ${q}\n   ✅ ${db[q]}\n\n`;
    });
    if (keys.length > 20) text += `...আরো ${keys.length - 20}টি আছে`;
    return message.reply(text.trim());
  }

  if (lower.startsWith("teach del ")) {
    const toDelete = fullText.replace(/^\/teach\s+del\s+/i, "").trim();
    const db = loadDB();
    const key = Object.keys(db).find(k => normalize(k) === normalize(toDelete));
    if (!key) return message.reply(`❌ "${toDelete}" নামে কোনো Q&A পাওয়া যায়নি!`);
    delete db[key];
    saveDB(db);
    return message.reply(`✅ "${key}" মুছে ফেলা হয়েছে!`);
  }

  const args = fullText.replace(/^\/teach\s*/i, "").split(/\s+/);
  const qIdx = args.indexOf("q");
  const aIdx = args.indexOf("a");

  if (qIdx === -1 || aIdx === -1 || qIdx >= aIdx) {
    return message.reply(
      "📚 কীভাবে শেখাবে:\n\n" +
      "1️⃣ সরাসরি:\n   /teach q <প্রশ্ন> a <উত্তর>\n   উদাহরণ: /teach q তুমি কে a আমি SABBIR BOT\n\n" +
      "2️⃣ Reply দিয়ে:\n   কারো message এ reply করে /teach ans লিখো\n   তারপর Bot যা জিজ্ঞেস করবে তাতে reply করো\n\n" +
      "📋 সব দেখতে: /teach list\n" +
      "🗑️ মুছতে: /teach del <প্রশ্ন>"
    );
  }

  const question = args.slice(qIdx + 1, aIdx).join(" ").trim();
  const answer = args.slice(aIdx + 1).join(" ").trim();

  if (!question) return message.reply("❌ প্রশ্ন লিখোনি!");
  if (!answer) return message.reply("❌ উত্তর লিখোনি!");

  const db = loadDB();
  const existingKey = Object.keys(db).find(k => normalize(k) === normalize(question));
  db[existingKey || question] = answer;
  saveDB(db);

  let replyText = `✅ শেখানো হয়েছে!\n\n❓ প্রশ্ন: ${question}\n✅ উত্তর: ${answer}`;

  try {
    await axios.post(TEACH_URL, { question, answer }, {
      headers: { "Content-Type": "application/json" },
      timeout: 8000
    });
  } catch (e) {}

  return message.reply(replyText);
};

module.exports.onReply = async function ({ api, event, Reply, message }) {
  const { body, senderID } = event;
  if (String(senderID) !== String(Reply.author)) return;

  const answer = (body || "").trim();
  if (!answer) return message.reply("❌ উত্তর খালি রাখা যাবে না!");

  const question = Reply.pendingQuestion;
  if (!question) return;

  const db = loadDB();
  const existingKey = Object.keys(db).find(k => normalize(k) === normalize(question));
  db[existingKey || question] = answer;
  saveDB(db);

  Reply.delete();

  try {
    await axios.post(TEACH_URL, { question, answer }, {
      headers: { "Content-Type": "application/json" },
      timeout: 8000
    });
  } catch (e) {}

  return message.reply(
    `✅ শেখানো হয়েছে!\n\n❓ প্রশ্ন: ${question}\n✅ উত্তর: ${answer}`
  );
};

module.exports.onChat = async function ({ api, event, message }) {
  const body = (event.body || "").trim();
  if (!body || body.startsWith("/")) return;

  const db = loadDB();
  const normBody = normalize(body);
  const key = Object.keys(db).find(k => normalize(k) === normBody);
  if (!key) return;

  try {
    await message.reply(db[key]);
  } catch (e) {}
};
