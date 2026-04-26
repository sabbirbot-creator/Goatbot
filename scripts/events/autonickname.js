const { getName } = require("../../utils/getName.js");

module.exports.config = {
  name: "autonickname",
  version: "1.0.0",
  role: 0,
  credits: "Ariful Islam Sabbir",
  description: "Group এ কেউ join করলে automatic nickname সেট করে দেয়",
  category: "Events",
  countDown: 0
};

function applyTemplate(template, fullName) {
  const safe = (template || "").toString();
  const firstName = (fullName || "").trim().split(/\s+/)[0] || fullName || "";
  return safe
    .replace(/\{name\}/gi, fullName || "")
    .replace(/\{firstname\}/gi, firstName)
    .trim();
}

module.exports.onStart = async function ({ api, event, threadsData }) {
  if (event.logMessageType !== "log:subscribe") return;

  const { threadID, logMessageData } = event;
  const addedIDs = (logMessageData && logMessageData.addedParticipants) || [];
  if (addedIDs.length === 0) return;

  let td = null;
  try { td = await threadsData.getData(threadID); } catch (_) {}
  const cfg = (td && td.data && td.data.autoNickname) || null;
  if (!cfg || cfg.enabled !== true) return;

  const template = cfg.template || "Member {firstname}";
  const botID = String(api.getCurrentUserID());

  for (const added of addedIDs) {
    const userID = String(added.userFbId || added.id || "").replace(/^fbid:/, "");
    if (!userID || userID === botID) continue;

    let name = added.fullName || added.name || "";
    if (!name || name === "Facebook User") {
      try { name = await getName(api, userID, ""); } catch (_) {}
    }

    const nickname = applyTemplate(template, name);
    if (!nickname) continue;

    try {
      await api.changeNickname(nickname, threadID, userID);
    } catch (e) {
      try { console.log(`[autonickname] failed for ${userID} in ${threadID}: ${e && e.error || e && e.message || e}`); } catch (_) {}
    }
  }
};
