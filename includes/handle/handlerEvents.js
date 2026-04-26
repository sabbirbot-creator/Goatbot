module.exports = function (api, threadModel, userModel, dashBoardModel, globalModel, usersData, threadsData, dashBoardData, globalData) {
	const { GoatBot, utils } = global;
	const { commands, eventCommands, aliases, config } = GoatBot;
	const log = utils.log;

	function safeGetThreadData(threadID) {
		try {
			return global.db.allThreadData.find(t => String(t.threadID) === String(threadID)) || null;
		} catch (_) { return null; }
	}

	function getPrefixForThread(threadID) {
		const td = safeGetThreadData(threadID);
		return (td && td.data && td.data.prefix) || config.prefix || "/";
	}

	function getThreadAdminIDs(threadID) {
		const td = safeGetThreadData(threadID);
		if (td && Array.isArray(td.adminIDs)) return td.adminIDs.map(a => String(a.id || a));
		if (td && td.threadInfo && Array.isArray(td.threadInfo.adminIDs))
			return td.threadInfo.adminIDs.map(a => String(a.id || a));
		return [];
	}

	function getRole(command) {
		if (!command || !command.config) return 0;
		if (typeof command.config.role === "number") return command.config.role;
		if (typeof command.config.hasPermssion === "number") return command.config.hasPermssion;
		if (typeof command.config.hasPermission === "number") return command.config.hasPermission;
		return 0;
	}

	function makeGetLang(cmd) {
		if (!cmd || !cmd.langs || typeof cmd.langs !== "object") return () => "";
		const lang = config.language || "en";
		const pack = cmd.langs[lang] || cmd.langs.en || {};
		return function (key, ...args) {
			let text = pack[key] || key;
			for (let i = 0; i < args.length; i++)
				text = text.replace(new RegExp("%" + (i + 1), "g"), args[i]);
			return text;
		};
	}

	return async function (event, message) {
		const threadID = event.threadID;
		const senderID = String(event.senderID || event.author || event.userID || "");
		const prefix = getPrefixForThread(threadID);

		// Parse possible command from body
		let body = (event.body || "").trim();

		// Mention support: if bot is mentioned at the start, treat as command
		try {
			const botID = String(GoatBot.botID || (api && api.getCurrentUserID && api.getCurrentUserID()));
			if (body && event.mentions && event.mentions[botID]) {
				const mentionText = String(event.mentions[botID] || "").trim();
				const escMention = mentionText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
				const stripped = body.replace(new RegExp("^\\s*" + escMention + "\\s*", "i"), "").trim();
				if (stripped !== body) {
					if (stripped.startsWith(prefix)) body = stripped;
					else if (stripped.length > 0) body = prefix + stripped;
				}
			}
		} catch (_) {}

		let args = [];
		let commandName = null;
		let command = null;
		if (body && body.startsWith(prefix)) {
			args = body.slice(prefix.length).trim().split(/\s+/);
			commandName = (args.shift() || "").toLowerCase();
			command = commands.get(commandName) || commands.get(aliases.get(commandName));
		}

		const baseObj = {
			api, event, message,
			threadModel, userModel, dashBoardModel, globalModel,
			threadsData, usersData, dashBoardData, globalData,
			models: { Thread: threadModel, User: userModel, DashBoard: dashBoardModel, Global: globalModel },
			Users: usersData, Threads: threadsData, Currencies: usersData,
			commandName, prefix
		};

		// onAnyEvent — fires for every event
		const onAnyEvent = async () => {
			for (const cmdName of (GoatBot.onAnyEvent || [])) {
				const cmd = commands.get(cmdName);
				if (!cmd || typeof cmd.onAnyEvent !== "function") continue;
				try { await cmd.onAnyEvent({ ...baseObj, getLang: makeGetLang(cmd) }); }
				catch (e) { log.err(cmdName, "onAnyEvent error:", e); }
			}
		};

		// onFirstChat — fires once per thread for the first message seen
		const onFirstChat = async () => {
			if (!threadID) return;
			for (const item of (GoatBot.onFirstChat || [])) {
				if (!item || !item.commandName) continue;
				if (item.threadIDsChattedFirstTime.includes(threadID)) continue;
				const cmd = commands.get(item.commandName);
				if (!cmd || typeof cmd.onFirstChat !== "function") continue;
				try {
					await cmd.onFirstChat({ ...baseObj, getLang: makeGetLang(cmd) });
					item.threadIDsChattedFirstTime.push(threadID);
				} catch (e) { log.err(item.commandName, "onFirstChat error:", e); }
			}
		};

		// onStart — runs the actual `/command` handler
		const onStart = async () => {
			if (!command) return;
			const role = getRole(command);
			const adminBot = config.adminBot || config.adminID || [];
			if (role >= 2 && !adminBot.includes(senderID)) {
				try { return await message.reply("⛔ এই কমান্ডটি শুধুমাত্র বটের অ্যাডমিনদের জন্য।"); } catch (_) { return; }
			}
			if (role === 1) {
				const groupAdmins = getThreadAdminIDs(threadID);
				if (!groupAdmins.includes(senderID) && !adminBot.includes(senderID)) {
					try { return await message.reply("❌ এই কমান্ডটি শুধুমাত্র গ্রুপ অ্যাডমিনদের জন্য।"); } catch (_) { return; }
				}
			}
			// Admin-only mode
			const adminOnly = config.adminOnly && (config.adminOnly.enable === true || config.adminOnly === true);
			const ignoreCmds = (config.adminOnly && Array.isArray(config.adminOnly.ignoreCommand)) ? config.adminOnly.ignoreCommand : [];
			if (adminOnly && !adminBot.includes(senderID) && !ignoreCmds.includes(commandName)) {
				try { return await message.reply("⛔ বর্তমানে বটটি শুধুমাত্র অ্যাডমিনরা ব্যবহার করতে পারবেন।"); } catch (_) { return; }
			}
			// Cooldown
			try {
				const cdKey = command.config.name + ":" + senderID;
				global.client.countDown[cdKey] = global.client.countDown[cdKey] || 0;
				const cooldownMs = (command.config.countDown || command.config.cooldowns || 1) * 1000;
				const now = Date.now();
				if (now - global.client.countDown[cdKey] < cooldownMs) {
					const wait = Math.ceil((cooldownMs - (now - global.client.countDown[cdKey])) / 1000);
					try { return await message.reply(`⏱️ অপেক্ষা করুন ${wait} সেকেন্ড।`); } catch (_) { return; }
				}
				global.client.countDown[cdKey] = now;
			} catch (_) {}

			const handler = command.onStart || command.run;
			if (typeof handler !== "function") return;
			try {
				await handler({ ...baseObj, args, role, getLang: makeGetLang(command) });
			} catch (e) {
				log.err(commandName, "onStart error:", e);
				try { await message.reply("🔴 কমান্ড চালানোর সময় সমস্যা হয়েছে।"); } catch (_) {}
			}
		};

		// onChat — every registered command's onChat sees every message
		const onChat = async () => {
			for (const cmdName of (GoatBot.onChat || [])) {
				const cmd = commands.get(cmdName);
				if (!cmd || typeof cmd.onChat !== "function") continue;
				try { await cmd.onChat({ ...baseObj, getLang: makeGetLang(cmd) }); }
				catch (e) { log.err(cmdName, "onChat error:", e); }
			}
		};

		// onReply — when user replies to a tracked bot message
		const onReply = async () => {
			if (!event.messageReply || !event.messageReply.messageID) return;
			const Reply = GoatBot.onReply.get(event.messageReply.messageID);
			if (!Reply) return;
			const cmd = commands.get(Reply.commandName);
			if (!cmd || typeof cmd.onReply !== "function") return;
			Reply.delete = () => GoatBot.onReply.delete(event.messageReply.messageID);
			try { await cmd.onReply({ ...baseObj, Reply, getLang: makeGetLang(cmd) }); }
			catch (e) { log.err(Reply.commandName, "onReply error:", e); }
		};

		// onReaction — when user reacts to a tracked bot message
		const onReaction = async () => {
			const msgID = event.messageID;
			if (!msgID) return;
			const Reaction = GoatBot.onReaction.get(msgID);
			if (!Reaction) return;
			const cmd = commands.get(Reaction.commandName);
			if (!cmd || typeof cmd.onReaction !== "function") return;
			Reaction.delete = () => GoatBot.onReaction.delete(msgID);
			try { await cmd.onReaction({ ...baseObj, Reaction, getLang: makeGetLang(cmd) }); }
			catch (e) { log.err(Reaction.commandName, "onReaction error:", e); }
		};

		// onEvent — every command with onEvent receives every event
		const onEvent = async () => {
			for (const cmdName of (GoatBot.onEvent || [])) {
				const cmd = commands.get(cmdName);
				if (!cmd || typeof cmd.onEvent !== "function") continue;
				try { await cmd.onEvent({ ...baseObj, getLang: makeGetLang(cmd) }); }
				catch (e) { log.err(cmdName, "onEvent error:", e); }
			}
		};

		// handlerEvent — runs scripts/events/* via their onStart for system event types
		const handlerEvent = async () => {
			for (const [name, evt] of eventCommands) {
				if (!evt || typeof evt.onStart !== "function") continue;
				try { await evt.onStart({ ...baseObj, getLang: makeGetLang(evt) }); }
				catch (e) { log.err(name, "event onStart error:", e); }
			}
		};

		const noop = () => {};

		return {
			onAnyEvent,
			onFirstChat,
			onStart,
			onChat,
			onReply,
			onEvent,
			handlerEvent,
			onReaction,
			typ: noop,
			presence: noop,
			read_receipt: noop
		};
	};
};
