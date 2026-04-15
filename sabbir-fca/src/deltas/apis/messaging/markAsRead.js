"use strict";
// @ChoruOfficial
const utils = require('../../../utils');

/**
 * @param {Object} defaultFuncs
 * @param {Object} api
 * @param {Object} ctx
 */
module.exports = function (defaultFuncs, api, ctx) {
  return async function markAsRead(threadID, read, callback) {
    if (
      utils.getType(read) === "Function" ||
      utils.getType(read) === "AsyncFunction"
    ) {
      callback = read;
      read = true;
    }
    if (read == undefined) read = true;
    if (!callback) callback = () => {};

    // Build form for HTTP endpoint
    const form = {};
    form["ids[" + threadID + "]"] = read;
    form["watermarkTimestamp"] = new Date().getTime();
    form["shouldSendReadReceipt"] = true;
    form["commerce_last_message_type"] = "";

    if (typeof ctx.globalOptions.pageID !== "undefined") {
      form["source"] = "PagesManagerMessagesInterface";
      form["request_user_id"] = ctx.globalOptions.pageID;
    }

    // Try HTTP first
    try {
      const resData = await defaultFuncs
        .post(
          "https://www.facebook.com/ajax/mercury/change_read_status.php",
          ctx.jar,
          form
        )
        .then(utils.saveCookies(ctx.jar))
        .then(utils.parseAndCheckLogin(ctx, defaultFuncs));

      if (resData && resData.error) {
        throw new Error(String(resData.error));
      }

      callback();
      return null;
    } catch (httpErr) {
      // Fallback: MQTT
      try {
        if (ctx.mqttClient) {
          const err = await new Promise(function(r) {
            ctx.mqttClient.publish(
              "/mark_thread",
              JSON.stringify({ threadID: threadID, mark: "read", state: read }),
              { qos: 1, retain: false },
              r
            );
          });
          if (err) throw err;
          callback();
          return null;
        } else {
          throw { error: "No MQTT client available." };
        }
      } catch (mqttErr) {
        callback(mqttErr);
        return mqttErr;
      }
    }
  };
};
