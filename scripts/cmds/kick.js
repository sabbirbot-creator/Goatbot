module.exports.config = {
  name: "kick",
  version: "1.3.0",
  hasPermssion: 0,
  credits: "Ariful Islam Sabbir",
  description: "Group থেকে কাউকে বের করো",
  usePrefix: true,
  category: "Group",
  usages: "kick @mention | reply করে kick | kick <UID>",
  cooldowns: 5
};
module.exports.run = async function({ api, event, getText, Threads }) {
	var mention = Object.keys(event.mentions);
	try {
		let dataThread = (await Threads.getData(event.threadID)).threadInfo;
		if (!dataThread.adminIDs.some(item => item.id == api.getCurrentUserID())) return api.sendMessage(getText("needPermssion"), event.threadID, event.messageID);
		if(!mention[0]) return api.sendMessage("You have to tag the need to kick",event.threadID);
		if (dataThread.adminIDs.some(item => item.id == event.senderID)) {
			for (const o in mention) {
				setTimeout(() => {
					api.removeUserFromGroup(mention[o],event.threadID) 
				},3000)
			}
		}
	} catch { return api.sendMessage(getText("error"),event.threadID) }
}
