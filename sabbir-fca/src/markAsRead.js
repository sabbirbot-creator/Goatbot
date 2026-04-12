"use strict";

const utils = require("../utils");
const log = require("npmlog");

module.exports = function (defaultFuncs, api, ctx) {
	return async function markAsRead(threadID, read, callback) {
		if (utils.getType(read) === 'Function' || utils.getType(read) === 'AsyncFunction') {
			callback = read;
			read = true;
		}
		if (read == undefined) {
			read = true;
		}

		if (!callback) {
			callback = () => { };
		}

		const form = {};

		if (typeof ctx.globalOptions.pageID !== 'undefined') {
			form["source"] = "PagesManagerMessagesInterface";
			form["request_user_id"] = ctx.globalOptions.pageID;
		}

		form["ids[" + threadID + "]"] = read;
		form["watermarkTimestamp"] = new Date().getTime();
		form["shouldSendReadReceipt"] = true;
		form["commerce_last_message_type"] = "";

		let resData;
		try {
			resData = await (
				defaultFuncs
					.post(
						"https://www.facebook.com/ajax/mercury/change_read_status.php",
						ctx.jar,
						form
					)
					.then(utils.saveCookies(ctx.jar))
					.then(utils.parseAndCheckLogin(ctx, defaultFuncs))
			);
		} catch (e) {
			callback(e);
			return e;
		}

		if (resData.error) {
			const err = resData.error;
			log.error("markAsRead", err);
			if (utils.getType(err) == "Object" && err.error === "Not logged in.") {
				ctx.loggedIn = false;
			}
			callback(err);
			return err;
		}

		callback();
		return null;
	};
};
