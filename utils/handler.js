/**
 * GOAT-BOT: handler.js
 * এটি কমান্ড এবং ইভেন্টগুলোকে অটোমেটিক লোড করে।
 */

const fs = require('fs');
const path = require('path');
const logger = require('./logger');

module.exports = (client) => {
    const commandsPath = path.join(__dirname, '../commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if (command.name && command.execute) {
            client.commands.set(command.name, command);
        } else {
            logger.warn(`ফাইলটি লোড করা যায়নি: ${file} (নাম বা এক্সিকিউট ফাংশন নেই)`);
        }
    }
    logger.info(`${client.commands.size}টি কমান্ড সফলভাবে লোড হয়েছে।`);
    const eventsPath = path.join(__dirname, '../events');
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath);

        if (event.name && event.execute) {
            if (event.once) {
                client.once(event.name, (...args) => event.execute(...args, client));
            } else {
                client.on(event.name, (...args) => event.execute(...args, client));
            }
        }
    }
    logger.info(`${eventFiles.length}টি ইভেন্ট সফলভাবে লোড হয়েছে।`);
};
