"use strict";

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function typeAndDelay(api, threadID, isGroup, ms) {
  if (typeof ms !== "number") ms = 2000;
  let end = null;
  try {
    if (typeof api.sendTypingIndicator === "function") {
      end = api.sendTypingIndicator(threadID, () => {}, !!isGroup);
    }
  } catch (_) {}
  await sleep(ms);
  if (typeof end === "function") {
    try { end(() => {}); } catch (_) {}
  }
}

function _sendApi(api, msgObj, threadID, replyToMessageID) {
  return new Promise((resolve, reject) => {
    const cb = (err, info) => {
      if (err) return reject(err);
      resolve(info);
    };
    if (replyToMessageID) {
      api.sendMessage(msgObj, threadID, cb, replyToMessageID);
    } else {
      api.sendMessage(msgObj, threadID, cb);
    }
  });
}

async function _editApi(api, messageID, newText) {
  if (typeof api.editMessage !== "function") return false;
  try {
    await api.editMessage(messageID, newText);
    return true;
  } catch (_) {
    return false;
  }
}

async function animateSendLines(api, threadID, lines, opts) {
  opts = opts || {};
  const initialBody = opts.initialBody || "✨ ...";
  const perLineMs = typeof opts.perLineMs === "number" ? opts.perLineMs : 220;
  const replyToMessageID = opts.replyToMessageID || null;
  const isGroup = opts.isGroup;
  const showTyping = opts.showTyping !== false;
  const typingMs = typeof opts.typingMs === "number" ? opts.typingMs : 1500;

  if (showTyping) {
    await typeAndDelay(api, threadID, isGroup, typingMs);
  }

  let sent;
  try {
    sent = await _sendApi(api, { body: initialBody }, threadID, replyToMessageID);
  } catch (_) {
    try {
      const fullBody = lines.join("\n");
      sent = await _sendApi(api, { body: fullBody }, threadID, replyToMessageID);
    } catch (_) {}
    return sent;
  }

  if (!sent || !sent.messageID) return sent;

  let current = "";
  for (let i = 0; i < lines.length; i++) {
    current = current ? current + "\n" + lines[i] : lines[i];
    const ok = await _editApi(api, sent.messageID, current);
    if (!ok) {
      try { await _sendApi(api, { body: lines.slice(i).join("\n") }, threadID, null); } catch (_) {}
      break;
    }
    if (i < lines.length - 1) await sleep(perLineMs);
  }

  return sent;
}

async function animateEditLines(api, messageID, lines, opts) {
  opts = opts || {};
  const perLineMs = typeof opts.perLineMs === "number" ? opts.perLineMs : 220;
  const clearText = opts.clearText || "✨ ...";

  let ok = await _editApi(api, messageID, clearText);
  if (!ok) return false;
  await sleep(150);

  let current = "";
  for (let i = 0; i < lines.length; i++) {
    current = current ? current + "\n" + lines[i] : lines[i];
    ok = await _editApi(api, messageID, current);
    if (!ok) return false;
    if (i < lines.length - 1) await sleep(perLineMs);
  }
  return true;
}

module.exports = {
  sleep,
  typeAndDelay,
  animateSendLines,
  animateEditLines
};
