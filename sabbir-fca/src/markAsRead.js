"use strict";

var utils = require("../utils");
var log = require("npmlog");

module.exports = function (defaultFuncs, api, ctx) {
  return async function markAsRead(threadID, read, callback) {
    if (utils.getType(read) === 'Function' || utils.getType(read) === 'AsyncFunction') {
      callback = read;
      read = true;
    }
    if (read == undefined) read = true;

    if (!callback) callback = () => { };

    var form = {};

    if (typeof ctx.globalOptions.pageID !== 'undefined') {
      form["source"] = "PagesManagerMessagesInterface";
      form["request_user_id"] = ctx.globalOptions.pageID;
      form["ids[" + threadID + "]"] = read;
      form["watermarkTimestamp"] = new Date().getTime();
      form["shouldSendReadReceipt"] = true;
      form["commerce_last_message_type"] = "";
      //form["titanOriginatedThreadId"] = utils.generateThreadingID(ctx.clientID);

      let resData;
      try {
        resData = await (
          defaultFuncs
            .post("https://www.facebook.com/ajax/mercury/change_read_status.php", ctx.jar, form)
            .then(utils.saveCookies(ctx.jar))
            .then(utils.parseAndCheckLogin(ctx, defaultFuncs))
        );
      }
      catch (e) {
        callback(e);
        return e;
      }

      if (resData.error) {
        let err = resData.error;
        log.error("markAsRead", err);
        if (utils.getType(err) == "Object" && err.error === "Not logged in.") ctx.loggedIn = false;
        callback(err);
        return err;
      }

      callback();
      return null;
    }
    else {
      // Try MQTT first (faster, no extra HTTP). If MQTT isn't ready, fall back to the
      // legacy HTTP mark_seen endpoint so autoseen still works during reconnects.
      try {
        if (ctx.mqttClient) {
          let err = await new Promise(r => ctx.mqttClient.publish("/mark_thread", JSON.stringify({
            threadID,
            mark: "read",
            state: read
          }), { qos: 1, retain: false }, r));
          if (err) throw err;
          callback();
          return null;
        }
        // No mqttClient — fall through to HTTP fallback below
        throw { error: "mqtt_not_ready" };
      }
      catch (_e) {
        try {
          const httpForm = {
            "watermarkTimestamp": new Date().getTime(),
            "shouldSendReadReceipt": true,
            "commerce_last_message_type": ""
          };
          httpForm["ids[" + threadID + "]"] = read;
          const resData = await (
            defaultFuncs
              .post("https://www.facebook.com/ajax/mercury/change_read_status.php", ctx.jar, httpForm)
              .then(utils.saveCookies(ctx.jar))
              .then(utils.parseAndCheckLogin(ctx, defaultFuncs))
          );
          if (resData && resData.error) {
            log.error("markAsRead", resData.error);
            if (utils.getType(resData.error) == "Object" && resData.error.error === "Not logged in.") ctx.loggedIn = false;
            callback(resData.error);
            return resData.error;
          }
          callback();
          return null;
        } catch (e2) {
          callback(e2);
          return e2;
        }
      }
    }
  };
};
