function normalize(s) {
        return String(s || "")
                .toLowerCase()
                .normalize("NFKD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^\p{L}\p{N}\s]/gu, " ")
                .replace(/\s+/g, " ")
                .trim();
}

function extractMentionIDs(mentions, excludeIDs) {
        const exclude = new Set((excludeIDs || []).map(String));
        if (!mentions) return [];
        if (Array.isArray(mentions)) {
                return mentions
                        .map(m => String(m && (m.id || m.userID || m) || ""))
                        .filter(id => id && !exclude.has(id));
        }
        if (typeof mentions === "object") {
                return Object.keys(mentions)
                        .map(String)
                        .filter(id => id && id !== "null" && !exclude.has(id));
        }
        return [];
}

function findByName(participants, query) {
        if (!query || !participants || !participants.length) return [];
        const nq = normalize(query.replace(/^@+/, ""));
        if (!nq) return [];
        const words = nq.split(" ").filter(Boolean);

        const scored = [];
        for (const p of participants) {
                const pname = normalize(p.name || p.firstName || "");
                if (!pname) continue;

                if (pname === nq) { scored.push({ p, score: 1000 }); continue; }
                if (pname.includes(nq)) { scored.push({ p, score: 500 + (nq.length / pname.length) * 100 }); continue; }

                const pwords = pname.split(" ").filter(Boolean);
                let matched = 0;
                for (const w of words) {
                        if (!w) continue;
                        if (pwords.some(pw => pw === w)) matched += 2;
                        else if (pwords.some(pw => pw.startsWith(w) || w.startsWith(pw))) matched += 1;
                        else if (pname.includes(w)) matched += 0.5;
                }
                if (matched > 0) scored.push({ p, score: matched });
        }

        scored.sort((a, b) => b.score - a.score);
        if (scored.length === 0) return [];
        const best = scored[0].score;
        if (best < 1) return [];
        return scored.filter(s => s.score === best).map(s => s.p);
}

async function resolveTargets({ api, event, args, includeSelfFromMention = false, includeBot = false }) {
        const { mentions, senderID, messageReply, threadID, body } = event;
        const botID = String(api.getCurrentUserID());
        const exclude = [];
        if (!includeBot) exclude.push(botID);
        if (!includeSelfFromMention) exclude.push(String(senderID));

        // 1) Real FB mentions
        const mentionIDs = extractMentionIDs(mentions, exclude);
        if (mentionIDs.length > 0) {
                return mentionIDs.map(uid => ({
                        uid,
                        name: (mentions[uid] || "").replace(/^@/, "").trim() || null,
                        source: "mention"
                }));
        }

        // 2) Reply
        if (messageReply && messageReply.senderID) {
                return [{ uid: String(messageReply.senderID), name: null, source: "reply" }];
        }

        // 3) Numeric UID args
        const uidArgs = (args || []).filter(a => /^\d{5,}$/.test(String(a)));
        if (uidArgs.length > 0) {
                return uidArgs.map(u => ({ uid: String(u), name: null, source: "uid" }));
        }

        // 4) Name search: take whole tail of body (after the command name)
        const rawArgs = (args && args.length) ? args : ((body || "").trim().split(/\s+/).slice(1));
        const nameQuery = rawArgs.join(" ").trim();
        if (nameQuery) {
                try {
                        const info = await api.getThreadInfo(threadID);
                        const participants = info.userInfo || [];
                        const matched = findByName(participants, nameQuery);
                        if (matched.length > 0) {
                                return matched.map(m => ({
                                        uid: String(m.id),
                                        name: m.name || null,
                                        source: "name"
                                }));
                        }
                } catch (e) { /* ignore */ }
        }

        return [];
}

module.exports = { resolveTargets, extractMentionIDs, findByName, normalize };
