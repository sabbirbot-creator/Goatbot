const { log } = global.utils;

module.exports = async function ({ api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, getText }) {
        // This is where you can add your custom code to the bot.
        // The bot will run this code every time it starts up (after logging in and loading data from the database).

        if (typeof api.addUserToGroup !== "function") {
                api.addUserToGroup = function (userIDs, threadID, callback) {
                        const ids = Array.isArray(userIDs) ? userIDs.map(String) : [String(userIDs)];
                        return new Promise((resolve, reject) => {
                                if (typeof api.gcmember !== "function") {
                                        const e = new Error("api.gcmember is not available");
                                        if (typeof callback === "function") callback(e);
                                        return reject(e);
                                }
                                api.gcmember("add", ids, String(threadID), (err, info) => {
                                        if (err) {
                                                if (typeof callback === "function") callback(err);
                                                return reject(err);
                                        }
                                        if (info && info.type === "error_gc") {
                                                const e = new Error(info.error || "gcmember add failed");
                                                if (typeof callback === "function") callback(e);
                                                return reject(e);
                                        }
                                        if (typeof callback === "function") callback(null, info);
                                        resolve(info);
                                });
                        });
                };
        }

        if (typeof api.removeUserFromGroup !== "function") {
                api.removeUserFromGroup = function (userID, threadID, callback) {
                        return new Promise((resolve, reject) => {
                                if (typeof api.gcmember !== "function") {
                                        const e = new Error("api.gcmember is not available");
                                        if (typeof callback === "function") callback(e);
                                        return reject(e);
                                }
                                api.gcmember("remove", String(userID), String(threadID), (err, info) => {
                                        if (err) {
                                                if (typeof callback === "function") callback(err);
                                                return reject(err);
                                        }
                                        if (info && info.type === "error_gc") {
                                                const e = new Error(info.error || "gcmember remove failed");
                                                if (typeof callback === "function") callback(e);
                                                return reject(e);
                                        }
                                        if (typeof callback === "function") callback(null, info);
                                        resolve(info);
                                });
                        });
                };
        }

        setInterval(async () => {
                api.refreshFb_dtsg()
                        .then(() => {
                                log.succes("refreshFb_dtsg", getText("custom", "refreshedFb_dtsg"));
                        })
                        .catch((err) => {
                                log.error("refreshFb_dtsg", getText("custom", "refreshedFb_dtsgError"), err);
                        });
        }, 1000 * 60 * 60 * 48); // 48h
};