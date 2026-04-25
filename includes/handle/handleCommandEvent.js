module.exports = function ({ api, models, Users, Threads, Currencies }) {
    const logger = require("../../utils/log.js");

    return function ({ event }) {

        // 🚨 SAFE FILTER (IMPORTANT FIX)
        if (!event || !event.threadID) return;
        if (event.type !== "message" && event.type !== "message_reply") return;

        const { allowInbox } = global.config;
        const { userBanned, threadBanned } = global.data;
        const { commands, eventRegistered } = global.client;

        var { senderID, threadID } = event;

        senderID = String(senderID);
        threadID = String(threadID);

        if (
            userBanned.has(senderID) ||
            threadBanned.has(threadID) ||
            (allowInbox == false && senderID == threadID)
        ) return;

        for (const eventReg of eventRegistered) {

            const cmd = commands.get(eventReg);
            if (!cmd) continue;

            let getText2;

            if (cmd.languages && typeof cmd.languages == 'object') {
                getText2 = (...values) => {
                    const commandModule = cmd.languages || {};

                    if (!commandModule.hasOwnProperty(global.config.language))
                        return api.sendMessage(
                            global.getText('handleCommand', 'notFoundLanguage', cmd.config.name),
                            threadID
                        );

                    let lang = cmd.languages[global.config.language][values[0]] || '';

                    for (let i = values.length - 1; i >= 0; i--) {
                        const expReg = new RegExp('%' + (i + 1), 'g');
                        lang = lang.replace(expReg, values[i]);
                    }

                    return lang;
                };
            } else {
                getText2 = () => {};
            }

            try {
                const Obj = {
                    event,
                    api,
                    models,
                    Users,
                    Threads,
                    Currencies,
                    getText: getText2
                };

                cmd.handleEvent(Obj);

            } catch (error) {
                logger(
                    global.getText('handleCommandEvent', 'moduleError', cmd.config.name),
                    'error'
                );
            }
        }
    };
};
