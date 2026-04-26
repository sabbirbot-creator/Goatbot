const SABBIR = "Ariful Islam Sabbir";

module.exports.config = {
  name: "help",
  version: "4.0.0",
  hasPermssion: 0,
  credits: SABBIR,
  description: "সব command এর লিস্ট দেখাও — Next/Prev reaction সহ pagination",
  usePrefix: true,
  category: "Info",
  usages: "help [page | command name]",
  cooldowns: 5
};

const SABBIR_PER_PAGE = 10;
const SABBIR_NEXT_EMOJI = "➡";
const SABBIR_PREV_EMOJI = "⬅";

function buildPage(cmdList, page, totalPages, prefix) {
  const start = (page - 1) * SABBIR_PER_PAGE;
  const slice = cmdList.slice(start, start + SABBIR_PER_PAGE);

  const lines = [];
  lines.push("╔══✨ SABBiR CHAT BOT ✨══╗");
  lines.push(`👑 Owner: ${SABBIR}`);
  lines.push(`📄 Page ${page} / ${totalPages}  •  📦 Total ${cmdList.length}`);
  lines.push("──────────────────────");
  for (let i = 0; i < slice.length; i++) {
    lines.push(`  ${start + i + 1}. ${prefix}${slice[i]}`);
  }
  lines.push("──────────────────────");

  const navParts = [];
  if (page > 1) navParts.push(`${SABBIR_PREV_EMOJI} Prev`);
  if (page < totalPages) navParts.push(`${SABBIR_NEXT_EMOJI} Next`);
  if (navParts.length > 0) {
    lines.push(`📌 React below: ${navParts.join("   ")}`);
  } else {
    lines.push(`📌 শেষ page এ আছেন`);
  }
  lines.push(`💡 ${prefix}help <command> — বিস্তারিত`);
  lines.push("╚══════════════════════╝");

  return lines.join("\n");
}

function getCmdList() {
  const commands = global.GoatBot.commands;
  const cmdList = [];
  for (const [, cmd] of commands) {
    const c = cmd && cmd.config;
    if (!c || !c.name || c.hidden) continue;
    cmdList.push(c.name);
  }
  cmdList.sort();
  return cmdList;
}

async function setNavReactions(api, messageID) {
  try { await api.setMessageReaction(SABBIR_PREV_EMOJI, messageID, () => {}, true); } catch (_) {}
  await new Promise(r => setTimeout(r, 200));
  try { await api.setMessageReaction(SABBIR_NEXT_EMOJI, messageID, () => {}, true); } catch (_) {}
}

function sendOnce(api, threadID, body, replyToMessageID) {
  return new Promise((resolve, reject) => {
    const cb = (err, info) => err ? reject(err) : resolve(info);
    if (replyToMessageID) {
      api.sendMessage({ body }, threadID, cb, replyToMessageID);
    } else {
      api.sendMessage({ body }, threadID, cb);
    }
  });
}

async function editOnce(api, messageID, body) {
  if (typeof api.editMessage !== "function") return false;
  try {
    await api.editMessage(messageID, body);
    return true;
  } catch (_) {
    return false;
  }
}

module.exports.onStart = async function ({ api, event, message, args }) {
  const prefix = (global.GoatBot && global.GoatBot.config && global.GoatBot.config.prefix) || "/";
  const cmdList = getCmdList();
  const totalPages = Math.max(1, Math.ceil(cmdList.length / SABBIR_PER_PAGE));

  if (args[0]) {
    const pageNum = parseInt(args[0]);
    if (!isNaN(pageNum)) {
      const page = Math.max(1, Math.min(pageNum, totalPages));
      const body = buildPage(cmdList, page, totalPages, prefix);
      const sent = await sendOnce(api, event.threadID, body, event.messageID).catch(() => null);
      if (sent && sent.messageID && totalPages > 1) {
        global.GoatBot.onReaction.set(sent.messageID, {
          commandName: "help",
          author: String(event.senderID),
          currentPage: page,
          cmdList,
          totalPages,
          prefix
        });
        await setNavReactions(api, sent.messageID);
      }
      return;
    }

    const cmdName = args[0].toLowerCase();
    const cmd = global.GoatBot.commands.get(cmdName);
    if (!cmd) {
      return message.reply(
        `❌ "${cmdName}" নামে কোনো command পাওয়া যায়নি।\n📋 সব command দেখতে: ${prefix}help`
      );
    }
    const c = cmd.config;
    const detail = [
      `╔══✨ COMMAND INFO ✨══╗`,
      `📌 Command: ${prefix}${c.name}`,
      `📝 বিবরণ: ${c.description || c.shortDescription || "নেই"}`,
      `🔧 ব্যবহার: ${prefix}${c.usages || c.name}`,
      `📂 Category: ${c.category || "General"}`,
      `⏱ Cooldown: ${c.cooldowns || c.countDown || 0}s`,
      `👑 Credits: ${c.credits || SABBIR}`,
      `╚══════════════════════╝`
    ].join("\n");
    await sendOnce(api, event.threadID, detail, event.messageID).catch(() => null);
    return;
  }

  const body = buildPage(cmdList, 1, totalPages, prefix);
  const sent = await sendOnce(api, event.threadID, body, event.messageID).catch(() => null);

  if (sent && sent.messageID && totalPages > 1) {
    global.GoatBot.onReaction.set(sent.messageID, {
      commandName: "help",
      author: String(event.senderID),
      currentPage: 1,
      cmdList,
      totalPages,
      prefix
    });
    await setNavReactions(api, sent.messageID);
  }
};

module.exports.onReaction = async function ({ api, event, Reaction }) {
  const userID = String(event.userID || event.senderID || "");
  if (userID !== String(Reaction.author)) return;

  const reaction = (event.reaction || "").trim();
  const { currentPage, cmdList, totalPages, prefix } = Reaction;

  let nextPage = currentPage;
  if (reaction === SABBIR_NEXT_EMOJI || reaction === "▶" || reaction === "▶️") {
    nextPage = currentPage + 1;
    if (nextPage > totalPages) nextPage = 1;
  } else if (reaction === SABBIR_PREV_EMOJI || reaction === "◀" || reaction === "◀️") {
    nextPage = currentPage - 1;
    if (nextPage < 1) nextPage = totalPages;
  } else {
    return;
  }
  if (nextPage === currentPage) return;

  const messageID = event.messageID;
  const body = buildPage(cmdList, nextPage, totalPages, prefix);
  const ok = await editOnce(api, messageID, body);

  if (!ok) {
    try {
      await new Promise((resolve) => {
        api.sendMessage({ body }, event.threadID, () => resolve(), messageID);
      });
    } catch (_) {}
  }

  Reaction.currentPage = nextPage;
  global.GoatBot.onReaction.set(messageID, {
    commandName: "help",
    author: Reaction.author,
    currentPage: nextPage,
    cmdList,
    totalPages,
    prefix
  });
};
