const fs = require("fs-extra");
const path = require("path");

module.exports = (api, event, logger, getText) => {
    const commandPath = path.join(__dirname, "../scripts/commands");
    const message = event.body?.toLowerCase() || "";
    const args = message.split(/\s+/);
    const commandName = args.shift();

    if (!fs.existsSync(commandPath)) return;

    const commandFiles = fs.readdirSync(commandPath).filter(file => file.endsWith(".js"));

    for (const file of commandFiles) {
        const command = require(path.join(commandPath, file));
        if (command.config.name === commandName) {
            try {
                return command.run({ api, event, args, logger, getText });
            } catch (e) {
                logger(getText("system.commandError", file), "ERROR");
            }
        }
    }
};
