module.exports.config = {
  name: "help",
  version: "1.1.0",
  hasPermssion: 0,
  credits: "sabbir",
  description: "সব command এর লিস্ট দেখাও",
  usePrefix: true,
  category: "Info",
  usages: "help [page | command]",
  cooldowns: 5
};

module.exports.onStart = async function ({ message, args }) {
  const prefix = global.GoatBot?.config?.prefix || "/";
  const commands = global.GoatBot.commands;
  const PER_PAGE = 10;

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
      const page = pageNum;
      if (page < 1 || page > totalPages) {
        return message.reply(`❌ Page ${page} নেই! মোট ${totalPages}টি page আছে।\nযেমন: ${prefix}help 1`);
      }
      const start = (page - 1) * PER_PAGE;
      const slice = cmdList.slice(start, start + PER_PAGE);

      let text = `╔══✨ SABBiR CHAT BOT ✨═══╗\n\n`;
      text += `👑 Owner: Ariful Islam Sabbir\n`;
      text += `🤖 Bot: Sabbir Chat Bot\n`;
      text += `📄 Page: ${page}/${totalPages}  |  📦 Total: ${totalCmds}\n\n`;
      for (const name of slice) {
        text += `➤ ${prefix}${name}\n`;
      }
      text += `\n╠══════════════════════╣\n`;
      if (page < totalPages) {
        text += `   ▶ পরের page: ${prefix}help ${page + 1}\n`;
      }
      text += `   💖 Powered by\n`;
      text += `   Sabbir Chat Bot\n`;
      text += `╚══════════════════════╝`;
      return message.reply(text);
    }

    const cmdName = args[0].toLowerCase();
    const cmd = commands.get(cmdName);
    if (!cmd) {
      return message.reply(`❌ "${cmdName}" নামে কোনো command পাওয়া যায়নি।\nসব command দেখতে: ${prefix}help`);
    }
    const c = cmd.config;
    return message.reply(
      `╔══✨ COMMAND INFO ✨═══╗\n\n` +
      `📌 Command: ${prefix}${c.name}\n` +
      `📝 বিবরণ: ${c.description || "নেই"}\n` +
      `🔧 ব্যবহার: ${prefix}${c.usages || c.name}\n` +
      `📂 ধরন: ${c.category || "General"}\n` +
      `⏱ Cooldown: ${c.cooldowns || 0}s\n\n` +
      `╚══════════════════════╝`
    );
  }

  const slice = cmdList.slice(0, PER_PAGE);

  let text = `╔══✨ SABBiR CHAT BOT ✨═══╗\n\n`;
  text += `👑 Owner: Ariful Islam Sabbir\n`;
  text += `🤖 Bot: Sabbir Chat Bot\n`;
  text += `📄 Page: 1/${totalPages}  |  📦 Total: ${totalCmds}\n\n`;
  for (const name of slice) {
    text += `➤ ${prefix}${name}\n`;
  }
  text += `\n╠══════════════════════╣\n`;
  if (totalPages > 1) {
    text += `   ▶ পরের page: ${prefix}help 2\n`;
  }
  text += `   💖 Powered by\n`;
  text += `   Sabbir Chat Bot\n`;
  text += `╚══════════════════════╝`;

  return message.reply(text);
};
