const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "install",
  version: "1.0.1",
  role: 2,
  credits: "Ariful Islam Sabbir",
  description: "Install JS command from Messenger file",
  usePrefix: true,
  category: "Admin",
  usages: "install (attach js file)",
  cooldowns: 5
};

module.exports.onStart = async function ({ api, event }) {
  const { threadID, messageID, attachments, messageReply } = event;

  const allAttachments = [
    ...(attachments || []),
    ...((messageReply && messageReply.attachments) || [])
  ];

  const jsFile = allAttachments.find(a =>
    a?.name?.endsWith(".js") || a?.filename?.endsWith(".js")
  );

  if (!jsFile) {
    return api.sendMessage("❌ কোনো JS ফাইল পাওয়া যায়নি!", threadID, messageID);
  }

  const fileName = jsFile.name || jsFile.filename;
  const fileUrl = jsFile.url;

  const dir = path.join(process.cwd(), "scripts", "cmds");
  const savePath = path.join(dir, fileName);

  fs.ensureDirSync(dir);

  api.sendMessage(`⏳ Installing "${fileName}"...`, threadID, messageID);

  try {
    const res = await axios.get(fileUrl, { responseType: "arraybuffer" });
    const fileContent = res.data.toString("utf8");

    fs.writeFileSync(savePath, fileContent);

    delete require.cache[require.resolve(savePath)];

    const command = require(savePath);

    if (!command?.config?.name || !command?.onStart) {
      fs.removeSync(savePath);
      return api.sendMessage("❌ Invalid command format!", threadID, messageID);
    }

    const name = command.config.name.toLowerCase();

    global.GoatBot = global.GoatBot || {};
    global.GoatBot.commands = global.GoatBot.commands || new Map();

    global.GoatBot.commands.set(name, command);

    return api.sendMessage(
      `✅ Installed successfully!\n📌 Command: /${name}`,
      threadID,
      messageID
    );

  } catch (err) {
    return api.sendMessage(
      `❌ Install failed!\n${err.message}`,
      threadID,
      messageID
    );
  }
};
