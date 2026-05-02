module.exports = {
  config: {
    name: "botset",
    version: "5.0.0",
    author: "Ariful Islam Sabbir",
    countDown: 5,
    role: 2,
    description: "Update Bot PP and Bio using custom FCA",
    category: "Admin",
    guide: "{pn} [pp | bio]"
  },

  onStart: async function ({ api, event, args, message }) {
    const { type, messageReply, senderID } = event;

    // Admin Verification
    if (!global.GoatBot.config.adminBot.includes(senderID)) {
      return message.reply("⚠️ Access Denied.");
    }

    const action = args[0]?.toLowerCase();

    // 1. Profile Picture Change
    if (action === "pp") {
      if (type !== "message_reply" || !messageReply.attachments || messageReply.attachments[0]?.type !== "photo") {
        return message.reply("❌ Please reply to a photo with '/botset pp'");
      }

      const imgUrl = messageReply.attachments[0].url;

      try {
        if (typeof api.changeAvt === "function") {
          message.reply("⏳ Updating Profile Picture...");
          await api.changeAvt(imgUrl); 
          return message.reply("✅ Bot Profile Picture updated!");
        } else {
          return message.reply("❌ Error: api.changeAvt not found in your FCA.");
        }
      } catch (err) {
        return message.reply(`❌ PP Update Failed: ${err.message}`);
      }
    }

    // 2. Bio Change
    else if (action === "bio") {
      const newBio = args.slice(1).join(" ");
      if (!newBio) return message.reply("❌ Usage: /botset bio [Your Bio Text]");

      try {
        if (typeof api.changeBio === "function") {
          message.reply("⏳ Updating Bio...");
          await api.changeBio(newBio); 
          return message.reply(`✅ Bot Bio updated to: "${newBio}"`);
        } else {
          return message.reply("❌ Error: api.changeBio not found in your FCA.");
        }
      } catch (err) {
        return message.reply(`❌ Bio Update Failed: ${err.message}`);
      }
    }

    else {
      message.reply("ℹ️ Bot Settings:\n1. Reply to photo: /botset pp\n2. Type: /botset bio [Your Text]");
    }
  }
};
