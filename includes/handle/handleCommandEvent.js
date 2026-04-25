module.exports = function ({ api, models, Users, Threads, Currencies }) {
    const logger = require("../../utils/log.js");

    return async function ({ event }) {

        const { userBanned, threadBanned } = global.data;
        const { commands, eventRegistered } = global.client;

        if (!event || !event.threadID || !event.senderID) return;

        const senderID = String(event.senderID);
        const threadID = String(event.threadID);

        const allowInbox = global.config?.allowInbox;

        // SAFE FILTER (FIXED)
        if (userBanned.has(senderID)) return;
        if (threadBanned.has(threadID)) return;

        if (allowInbox === false && senderID === threadID) return;

        for (const eventReg of eventRegistered || []) {

            const cmd = commands.get(eventReg);
            if (!cmd) continue;

            let getText2 = () => {};

            try {
                if (cmd.languages?.[global.config.language]) {
                    getText2 = (...values) => {
                        let lang = cmd.languages[global.config.language][values[0]] || '';
                        for (let i = values.length - 1; i >= 0; i--) {
                            lang = lang.replace(new RegExp('%' + (i + 1), 'g'), values[i]);
                        }
                        return lang;
                    };
                }

                const Obj = {
                    event,
                    api,
                    models,
                    Users,
                    Threads,
                    Currencies,
                    getText: getText2
                };

                // IMPORTANT: await added
                if (typeof cmd.handleEvent === "function") {
                    await cmd.handleEvent(Obj);
                }

            } catch (error) {
                logger(
                    `Event Error in ${cmd?.config?.name || "unknown"}: ${error.message}`,
                    "error"
                );
            }
        }
    };
};
