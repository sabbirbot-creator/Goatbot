"use strict";

const axios = require("axios");

module.exports.config = {
  name: "imgvoice",
  version: "1.0.0",
  role: 0,
  credits: "Ariful Islam Sabbir",
  hidden: true,
  usePrefix: false,
  category: "Fun",
  countDown: 5,
  shortDescription: "ইমেজ/স্টিকার পেলে ভয়েস মেসেজ দেয়"
};

module.exports.onStart = async function () {};

const voiceMessages = [
  "সুন্দর ছবি পাঠিয়েছো!",
  "বাহ! দারুণ তো!",
  "আরে! এটা কী পাঠালে?",
  "হাহা! মজার ছবি!",
  "ছবিটা দেখলাম!"
];

module.exports.onChat = async function ({ api, event, message }) {
  try {
    const { attachments, senderID } = event;

    if (!attachments || attachments.length === 0) return;

    const hasImage = attachments.some(a =>
      ["photo", "sticker", "animated_image", "gif"].includes(a.type)
    );

    if (!hasImage) return;

    if (String(senderID) === String(global.GoatBot?.botID)) return;

    const text = voiceMessages[Math.floor(Math.random() * voiceMessages.length)];

    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=gtx&tl=bn&q=${encodeURIComponent(text)}`;

    const res = await axios.get(ttsUrl, {
      responseType: "stream",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      },
      timeout: 10000
    });

    await message.reply({ attachment: res.data });
  } catch (e) {
    // silent fail
  }
};
