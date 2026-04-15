const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "install",
  version: "1.0.0",
  role: 2,
  credits: "Ariful Islam Sabbir",
  description: "Messenger থেকে JS কমান্ড ফাইল ইন্সটল করো",
  usePrefix: true,
  category: "Admin",
  usages: "install (JS ফাইল attach করে পাঠাও)",
  cooldowns: 5
};

module.exports.onStart = async function ({ api, event }) {
  const { threadID, messageID, attachments, messageReply } = event;

  const allAttachments = [
    ...(attachments || []),
    ...((messageReply && messageReply.attachments) || [])
  ];

  const jsFile = allAttachments.find(att =>
    att.type === "file" &&
    att.name &&
    att.name.endsWith(".js")
  );

  if (!jsFile) {
    return api.sendMessage(
      "❌ কোনো JS ফাইল পাওয়া যায়নি!\n\n📌 কীভাবে ব্যবহার করবে:\n• /install লিখে সাথে .js ফাইল attach করে পাঠাও\n• অথবা কোনো .js ফাইল এর reply এ /install লিখো",
      threadID,
      messageID
    );
  }

  const fileName = jsFile.name;
  const fileUrl = jsFile.url;
  const savePath = path.normalize(path.join(process.cwd(), "scripts", "cmds", fileName));

  await api.sendMessage(`⏳ "${fileName}" ডাউনলোড হচ্ছে...`, threadID);

  try {
    const response = await axios.get(fileUrl, { responseType: "text", timeout: 15000 });
    const fileContent = response.data;

    fs.writeFileSync(savePath, fileContent, "utf8");

    let command;
    try {
      delete require.cache[require.resolve(savePath)];
      command = require(savePath);
    } catch (loadErr) {
      fs.removeSync(savePath);
      return api.sendMessage(
        `❌ ফাইলটি সেভ হয়েছে কিন্তু লোড করতে সমস্যা হয়েছে!\n\n🐛 Error: ${loadErr.message}`,
        threadID,
        messageID
      );
    }

    const config = command.config;

    if (!config || !config.name || !config.category || typeof command.onStart !== "function") {
      fs.removeSync(savePath);
      return api.sendMessage(
        `❌ ফাইলটি সঠিক format এ নেই!\n\nদরকারি field:\n• config.name\n• config.category\n• onStart function`,
        threadID,
        messageID
      );
    }

    const commandName = config.name.toLowerCase();

    if (global.GoatBot.commands.has(commandName)) {
      global.GoatBot.commands.delete(commandName);

      const aliasesToRemove = [];
      for (const [alias, name] of global.GoatBot.aliases) {
        if (name === commandName) aliasesToRemove.push(alias);
      }
      aliasesToRemove.forEach(a => global.GoatBot.aliases.delete(a));

      const idx = global.GoatBot.commandFilesPath.findIndex(f =>
        f.commandName.includes(commandName)
      );
      if (idx !== -1) global.GoatBot.commandFilesPath.splice(idx, 1);
    }

    command.location = savePath;
    global.GoatBot.commands.set(commandName, command);

    if (config.aliases && Array.isArray(config.aliases)) {
      for (const alias of config.aliases) {
        global.GoatBot.aliases.set(alias.toLowerCase(), commandName);
      }
    }

    if (typeof command.onChat === "function" && !global.GoatBot.onChat.includes(commandName)) {
      global.GoatBot.onChat.push(commandName);
    }
    if (typeof command.onEvent === "function" && !global.GoatBot.onEvent.includes(commandName)) {
      global.GoatBot.onEvent.push(commandName);
    }

    global.GoatBot.commandFilesPath.push({
      filePath: savePath,
      commandName: [commandName, ...(config.aliases || [])]
    });

    if (typeof command.onLoad === "function") {
      try {
        await command.onLoad({ api });
      } catch (e) {}
    }

    return api.sendMessage(
      `✅ "${fileName}" সফলভাবে ইন্সটল হয়েছে!\n\n📌 কমান্ড নাম: /${config.name}\n📂 Category: ${config.category}\n🔖 Version: ${config.version || "1.0.0"}\n\nএখনই ব্যবহার করতে পারবে — bot restart না দিলেও চলবে!`,
      threadID,
      messageID
    );

  } catch (err) {
    return api.sendMessage(
      `❌ ফাইল ডাউনলোড বা সেভ করতে সমস্যা হয়েছে!\n\n🐛 Error: ${err.message}`,
      threadID,
      messageID
    );
  }
};
