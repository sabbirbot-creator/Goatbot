module.exports.config = {
  name: "help",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "Ariful Islam Sabbir",
  description: "সব command এর লিস্ট দেখাও — Next/Prev বাটন সহ",
  usePrefix: true,
  category: "Info",
  usages: "help [page | command name]",
  cooldowns: 5
};

const PER_PAGE = 10;

function buildPage(cmdList, page, totalPages, prefix) {
  const totalCmds = cmdList.length;
  const start = (page - 1) * PER_PAGE;
  const slice = cmdList.slice(start, start + PER_PAGE);

  let text = `╔══✨ SABBiR CHAT BOT ✨══╗\n\n`;
  text += `👑 Owner: Ariful Islam Sabbir\n`;
  text += `🤖 Bot: Sabbir Chat Bot\n`;
  text += `📄 Page: ${page}/${totalPages}  |  📦 Total: ${totalCmds}\n`;
  text += `──────────────────────\n`;

  for (const name of slice) {
    text += `  ➤ ${prefix}${name}\n`;
  }

  text += `──────────────────────\n`;

  const nav = [];
  if (page > 1) nav.push(`◀ prev`);
  if (page < totalPages) nav.push(`next ▶`);

  if (nav.length > 0) {
    text += `📌 Navigation: ${nav.join("  |  ")}\n`;
    text += `💬 Reply করো উপরের যেকোনো একটি লিখে\n`;
  }

  text += `\n💡 /help <command> → বিস্তারিত\n`;
  text += `╚══════════════════════╝`;

  return text;
}

module.exports.onStart = async function ({ api, event, message, args }) {
  const prefix = global.GoatBot?.config?.prefix || "/";
  const commands = global.GoatBot.commands;

  const cmdList = [];
  for (const [, cmd] of commands) {
    const c = cmd.config;
    if (!c || !c.name || c.hidden) continue;
    cmdList.push(c.name);
  }
  cmdList.sort();

  const totalCmds = cmdList.length;
  const totalPages = Math.ceil(totalCmds / PER_PAGE);

  if (args[0]) {
    const pageNum = parseInt(args[0]);

    if (!isNaN(pageNum)) {
      const page = Math.max(1, Math.min(pageNum, totalPages));
      const text = buildPage(cmdList, page, totalPages, prefix);
      const sentMsg = await message.reply(text);

      if (totalPages > 1 && sentMsg && sentMsg.messageID) {
        global.GoatBot.onReply.set(sentMsg.messageID, {
          commandName: "help",
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
    const cmd = commands.get(cmdName);
    if (!cmd) {
      return message.reply(
        `❌ "${cmdName}" নামে কোনো command পাওয়া যায়নি।\n📋 সব command দেখতে: ${prefix}help`
      );
    }
    const c = cmd.config;
    return message.reply(
      `╔══✨ COMMAND INFO ✨══╗\n\n` +
      `📌 Command: ${prefix}${c.name}\n` +
      `📝 বিবরণ: ${c.description || "নেই"}\n` +
      `🔧 ব্যবহার: ${prefix}${c.usages || c.name}\n` +
      `📂 Category: ${c.category || "General"}\n` +
      `⏱ Cooldown: ${c.cooldowns || 0}s\n` +
      `👑 Credits: ${c.credits || "—"}\n\n` +
      `╚══════════════════════╝`
    );
  }

  const text = buildPage(cmdList, 1, totalPages, prefix);
  const sentMsg = await message.reply(text);

  if (totalPages > 1 && sentMsg && sentMsg.messageID) {
    global.GoatBot.onReply.set(sentMsg.messageID, {
      commandName: "help",
      author: String(event.senderID),
      currentPage: 1,
      cmdList,
      totalPages,
      prefix
    });
  }
};

module.exports.onReply = async function ({ api, event, Reply, message }) {
  const { body, senderID } = event;
  const input = (body || "").toLowerCase().trim();

  if (String(senderID) !== String(Reply.author)) return;

  const { currentPage, cmdList, totalPages, prefix } = Reply;

  let nextPage = currentPage;

  if (input === "next" || input === "next ▶" || input === "▶") {
    nextPage = Math.min(currentPage + 1, totalPages);
  } else if (input === "prev" || input === "◀ prev" || input === "◀") {
    nextPage = Math.max(currentPage - 1, 1);
  } else {
    return;
  }

  Reply.delete();

  const text = buildPage(cmdList, nextPage, totalPages, prefix);
  const sentMsg = await message.reply(text);

  if (sentMsg && sentMsg.messageID) {
    global.GoatBot.onReply.set(sentMsg.messageID, {
      commandName: "help",
      author: String(senderID),
      currentPage: nextPage,
      cmdList,
      totalPages,
      prefix
    });
  }
};
