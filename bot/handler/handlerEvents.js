const fs = require("fs-extra");

const nullAndUndefined = [undefined, null];

function getType(obj) {
    return Object.prototype.toString.call(obj).slice(8, -1);
}

function getRole(threadData, senderID) {
    const adminBot = global.GoatBot?.config?.adminBot || [];
    if (!senderID) return 0;

    const adminBox = threadData?.adminIDs || [];
    return adminBot.includes(senderID) ? 2 : adminBox.includes(senderID) ? 1 : 0;
}

function isBannedOrOnlyAdmin(userData, threadData, senderID, threadID, isGroup, commandName, message, lang) {
    const config = global.GoatBot.config;
    const { adminBot, hideNotiMessage } = config;

    const userBan = userData?.banned || {};
    if (userBan.status) return true;

    const adminOnly = config.adminOnly || {};
    if (adminOnly.enable && !adminBot.includes(senderID)) {
        return true;
    }

    if (isGroup) {
        const threadBan = threadData?.banned || {};
        if (threadBan.status) return true;
    }

    return false;
}

module.exports = function (api, threadModel, userModel, dashBoardModel, globalModel, usersData, threadsData, dashBoardData, globalData) {
    return async function (event, message) {

        const { utils, GoatBot } = global;
        const { getPrefix } = utils;

        const { body, messageID, threadID, isGroup } = event;

        if (!threadID) return;

        const senderID = event.userID || event.senderID || event.author;

        // =============================
        // SAFE THREAD INIT (FIXED)
        // =============================
        let threadData = global.db.allThreadData?.find(t => t.threadID == threadID);
        let userData = global.db.allUserData?.find(u => u.userID == senderID);

        if (!global.db.receivedTheFirstMessage)
            global.db.receivedTheFirstMessage = {};

        if (!userData && senderID && !isNaN(senderID)) {
            userData = await usersData.create(senderID);
        }

        if (!threadData && threadID && !isNaN(threadID)) {
            threadData = await threadsData.create(threadID);
        }

        const prefix = getPrefix(threadID);
        const role = getRole(threadData, senderID);

        const parameters = {
            api, usersData, threadsData, message, event,
            prefix, role
        };

        const langCode = threadData?.data?.lang || "en";

        // =============================
        // COMMAND HANDLER
        // =============================
        async function onStart() {
            let cmdBody = body;

            if (!cmdBody || !cmdBody.startsWith(prefix)) return;

            const args = cmdBody.slice(prefix.length).trim().split(/ +/);
            let commandName = args.shift().toLowerCase();

            let command =
                GoatBot.commands.get(commandName) ||
                GoatBot.commands.get(GoatBot.aliases.get(commandName));

            if (!command) return;

            commandName = command.config.name;

            if (isBannedOrOnlyAdmin(userData, threadData, senderID, threadID, isGroup, commandName, message, langCode))
                return;

            try {
                await command.onStart({
                    ...parameters,
                    args,
                    commandName
                });
            } catch (e) {
                console.log(e);
            }
        }

        // =============================
        // ON CHAT
        // =============================
        async function onChat() {
            const allOnChat = GoatBot.onChat || [];

            const args = body ? body.split(/ +/) : [];

            for (const key of allOnChat) {
                const command = GoatBot.commands.get(key);
                if (!command) continue;

                try {
                    await command.onChat({
                        ...parameters,
                        args
                    });
                } catch (e) {
                    console.log(e);
                }
            }
        }

        // =============================
        // ON EVENT
        // =============================
        async function onEvent() {
            const allOnEvent = GoatBot.onEvent || [];

            for (const key of allOnEvent) {
                const command = GoatBot.commands.get(key);
                if (!command) continue;

                try {
                    await command.onEvent({
                        ...parameters
                    });
                } catch (e) {
                    console.log(e);
                }
            }
        }

        // =============================
        // EXECUTION FLOW (IMPORTANT)
        // =============================
        await onStart();
        await onChat();
        await onEvent();

        return {
            onStart,
            onChat,
            onEvent
        };
    };
};
