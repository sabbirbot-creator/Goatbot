const SABBIR = "Ariful Islam Sabbir";

module.exports.config = {
  name: "help",
  version: "5.0.0",
  hasPermssion: 0,
  credits: SABBIR,
  description: "সব command এর লিস্ট দেখাও — reply দিয়ে next/prev navigation",
  usePrefix: true,
  category: "Info",
  usages: "help [page | command name]",
  cooldowns: 5
};

const SABBIR_PER_PAGE = 10;

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
  if (page > 1) navParts.push(`⬅ "prev"`);
  if (page < totalPages) navParts.push(`"next" ➡`);
  if (navParts.length > 0) {
    lines.push(`📌 Reply: ${navParts.join("   |   ")}`);
    lines.push(`   (অথবা reply এ page number দিন)`);
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

function registerReplyNav(messageID, payload) {
  global.GoatBot.onReply.set(messageID, {
    commandName: "help",
    messageID,
    ...payload
  });
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
        registerReplyNav(sent.messageID, {
          author: String(event.senderID),
          currentPage: page,
          cmdList,
          totalPages,
          prefix
        });
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
    registerReplyNav(sent.messageID, {
      author: String(event.senderID),
      currentPage: 1,
      cmdList,
      totalPages,
      prefix
    });
  }
};

module.exports.onReply = async function ({ api, event, Reply }) {
  const userID = String(event.senderID || event.userID || "");
  if (Reply.author && userID !== String(Reply.author)) return;

  const raw = (event.body || "").trim().toLowerCase();
  if (!raw) return;

  const { currentPage, cmdList, totalPages, prefix, messageID } = Reply;

  let nextPage = currentPage;
  if (raw === "next" || raw === "n" || raw === "→" || raw === "->" || raw === ">>") {
    nextPage = currentPage + 1;
    if (nextPage > totalPages) nextPage = 1;
  } else if (raw === "prev" || raw === "previous" || raw === "p" || raw === "back" || raw === "b" || raw === "←" || raw === "<-" || raw === "<<") {
    nextPage = currentPage - 1;
    if (nextPage < 1) nextPage = totalPages;
  } else {
    const num = parseInt(raw);
    if (!isNaN(num) && num >= 1 && num <= totalPages) {
      nextPage = num;
    } else {
      return;
    }
  }

  if (nextPage === currentPage) return;

  const body = buildPage(cmdList, nextPage, totalPages, prefix);
  const ok = await editOnce(api, messageID, body);

  if (!ok) {
    const sent = await sendOnce(api, event.threadID, body, event.messageID).catch(() => null);
    if (sent && sent.messageID) {
      registerReplyNav(sent.messageID, {
        author: Reply.author,
        currentPage: nextPage,
        cmdList,
        totalPages,
        prefix
      });
    }
  } else {
    registerReplyNav(messageID, {
      author: Reply.author,
      currentPage: nextPage,
      cmdList,
      totalPages,
      prefix
    });
  }

  try {
    if (typeof api.unsendMessage === "function" && event.messageID) {
      await api.unsendMessage(event.messageID).catch(() => {});
    }
  } catch (_) {}
};
