/**
 * @Sabbir-mirai-bot - utils/handle/handleCommand.js
 * Full Logic (No Skip Version)
 */

module.exports = function ({ api, models, Users, Threads, Currencies }) {
    const stringSimilarity = require('string-similarity');
    const logger = require("../../utils/log");
    const moment = require("moment-timezone");

    return async function ({ event }) {
        const { threadID, messageID, senderID } = event;
        let { body } = event;
        const { commands, cooldowns, eventRegistered } = global.client;
        const { PREFIX, ADMINBOT, DEVELOPER, adminOnly } = global.config;

        // --- MENTION SUPPORT: if bot is mentioned at the start, treat as command call ---
        try {
            const botID = String(api.getCurrentUserID());
            if (body && event.mentions && event.mentions[botID]) {
                const mentionText = String(event.mentions[botID] || "").trim();
                const escMention = mentionText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                const stripped = body.replace(new RegExp(`^\\s*${escMention}\\s*`, "i"), "").trim();
                if (stripped !== body) {
                    if (stripped.startsWith(PREFIX)) body = stripped;
                    else if (stripped.length > 0) body = PREFIX + stripped;
                }
            }
        } catch (e) { /* ignore */ }

        if (!body || !body.startsWith(PREFIX)) return;

        // --- ১. কমান্ড আর আর্গুমেন্ট আলাদা করা ---
        const args = body.slice(PREFIX.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        var command = commands.get(commandName) || commands.get(global.client.aliases.get(commandName));

        // --- ২. কমান্ড না পাওয়া গেলে সাজেশন দেওয়া ---
        if (!command) {
            const allCommands = Array.from(commands.keys());
            const checker = stringSimilarity.findBestMatch(commandName, allCommands);
            if (checker.bestMatch.rating >= 0.4) {
                return api.sendMessage(`⚠️ "${commandName}" নামে কোনো কমান্ড নেই। আপনি কি "${checker.bestMatch.target}" ব্যবহার করতে চান?`, threadID, messageID);
            }
            return api.sendMessage(`❌ ভুল কমান্ড! বটের প্রিফিক্স হলো: ${PREFIX}\nসব কমান্ড দেখতে ${PREFIX}help লিখুন।`, threadID, messageID);
        }

        // --- ৩. এডমিন অনলি মোড চেক ---
        if (adminOnly && !ADMINBOT.includes(senderID) && !DEVELOPER.includes(senderID)) {
            return api.sendMessage("⛔ বর্তমানে বটটি শুধুমাত্র এডমিনরা ব্যবহার করতে পারবেন।", threadID, messageID);
        }

        // --- ৪. পারমিশন (Permission) চেক ---
        const permission = command.config.hasPermssion;
        if (permission == 1 && !ADMINBOT.includes(senderID)) {
            return api.sendMessage("❌ এই কমান্ডটি শুধুমাত্র গ্রুপ এডমিনদের জন্য!", threadID, messageID);
        }
        if (permission == 2 && !ADMINBOT.includes(senderID) && !DEVELOPER.includes(senderID)) {
            return api.sendMessage("❌ এই কমান্ডটি শুধুমাত্র বটের মূল এডমিনের জন্য!", threadID, messageID);
        }

        // --- ৫. কুলডাউন (Cooldown) লজিক ---
        if (!cooldowns.has(command.config.name)) cooldowns.set(command.config.name, new Map());
        const timestamps = cooldowns.get(command.config.name);
        const cooldownAmount = (command.config.cooldowns || 1) * 1000;
        if (timestamps.has(senderID)) {
            const expirationTime = timestamps.get(senderID) + cooldownAmount;
            if (Date.now() < expirationTime) {
                return api.sendMessage(`⏱️ আপনি খুব দ্রুত কমান্ড দিচ্ছেন! দয়া করে ${Math.ceil((expirationTime - Date.now()) / 1000)} সেকেন্ড অপেক্ষা করুন।`, threadID, messageID);
            }
        }

        // --- ৬. কমান্ড চালানো ---
        try {
            const Obj = {
                api, event, args, models, Users, Threads, Currencies
            };
            command.run(Obj);
            timestamps.set(senderID, Date.now());
            
            // লগ হিসেবে কনসোলে দেখানো
            logger.log(`Command: ${command.config.name} | User: ${senderID} | Thread: ${threadID}`, "EXECUTED");
        } catch (error) {
            logger.error(JSON.stringify(error), "COMMAND ERROR");
            api.sendMessage("🔴 কমান্ডটি চালানোর সময় সিস্টেমে এরর হয়েছে!", threadID, messageID);
        }
    };
};
