const { animateSendLines, animateEditLines, sleep } = require("../../utils/animation.js");

module.exports.config = {
  name: "help",
  version: "3.0.0",
  hasPermssion: 0,
  credits: "Ariful Islam Sabbir",
  description: "সব command এর লিস্ট দেখাও — Next/Prev reaction সহ animation",
  usePrefix: true,
  category: "Info",
  usages: "help [page | command name]",
  cooldowns: 5
};

const PER_PAGE = 8;
const NEXT_EMOJI = "➡";
const PREV_EMOJI = "⬅";

function buildLines(cmdList, page, totalPages, prefix) {
  const start = (page - 1) * PER_PAGE;
  const slice = cmdList.slice(start, start + PER_PAGE);

  const lines = [];
  lines.push("╔══✨ SABBiR CHAT BOT ✨══╗");
  lines.push(`👑 Owner: Ariful Islam Sabbir`);
  lines.push(`📄 Page ${page} / ${totalPages}  •  📦 Total ${cmdList.length}`);
  lines.push("──────────────────────");
  for (const name of slice) {
    lines.push(`  ➤ ${prefix}${name}`);
  }
  lines.push("──────────────────────");
  const navParts = [];
  if (page > 1) navParts.push(`${PREV_EMOJI} Prev`);
  if (page < totalPages) navParts.push(`${NEXT_EMOJI} Next`);
  if (navParts.length > 0) {
    lines.push(`📌 React: ${navParts.join("   ")}`);
  }
  lines.push(`💡 ${prefix}help <command> — বিস্তারিত`);
  lines.push("╚══════════════════════╝");

  return lines;
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
  try { await api.setMessageReaction(PREV_EMOJI, messageID, () => {}, true); } catch (_) {}
  await sleep(150);
  try { await api.setMessageReaction(NEXT_EMOJI, messageID, () => {}, true); } catch (_) {}
}

module.exports.onStart = async function ({ api, event, message, args }) {
  const prefix = (global.GoatBot && global.GoatBot.config && global.GoatBot.config.prefix) || "/";
  const cmdList = getCmdList();
  const totalPages = Math.max(1, Math.ceil(cmdList.length / PER_PAGE));

  if (args[0]) {
    const pageNum = parseInt(args[0]);
    if (!isNaN(pageNum)) {
      const page = Math.max(1, Math.min(pageNum, totalPages));
      const lines = buildLines(cmdList, page, totalPages, prefix);

      const sent = await animateSendLines(api, event.threadID, lines, {
        initialBody: "✨ Loading help menu...",
        perLineMs: 180,
        replyToMessageID: event.messageID,
        isGroup: !!event.isGroup,
        showTyping: true,
        typingMs: 1000
      });

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
    const detailLines = [
      `╔══✨ COMMAND INFO ✨══╗`,
      `📌 Command: ${prefix}${c.name}`,
      `📝 বিবরণ: ${c.description || "নেই"}`,
      `🔧 ব্যবহার: ${prefix}${c.usages || c.name}`,
      `📂 Category: ${c.category || "General"}`,
      `⏱ Cooldown: ${c.cooldowns || c.countDown || 0}s`,
      `👑 Credits: ${c.credits || "—"}`,
      `╚══════════════════════╝`
    ];
    await animateSendLines(api, event.threadID, detailLines, {
      initialBody: "✨ Loading...",
      perLineMs: 180,
      replyToMessageID: event.messageID,
      isGroup: !!event.isGroup,
      showTyping: true,
      typingMs: 800
    });
    return;
  }

  const lines = buildLines(cmdList, 1, totalPages, prefix);
  const sent = await animateSendLines(api, event.threadID, lines, {
    initialBody: "✨ Loading help menu...",
    perLineMs: 180,
    replyToMessageID: event.messageID,
    isGroup: !!event.isGroup,
    showTyping: true,
    typingMs: 1000
  });

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
  if (reaction === NEXT_EMOJI || reaction === "▶" || reaction === "▶️") {
    nextPage = Math.min(currentPage + 1, totalPages);
  } else if (reaction === PREV_EMOJI || reaction === "◀" || reaction === "◀️") {
    nextPage = Math.max(currentPage - 1, 1);
  } else {
    return;
  }
  if (nextPage === currentPage) return;

  const messageID = event.messageID;
  const lines = buildLines(cmdList, nextPage, totalPages, prefix);

  const ok = await animateEditLines(api, messageID, lines, {
    perLineMs: 150,
    clearText: nextPage > currentPage ? "➡ Loading next page..." : "⬅ Loading previous page..."
  });

  if (!ok) {
    try { await api.sendMessage({ body: lines.join("\n") }, event.threadID); } catch (_) {}
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
