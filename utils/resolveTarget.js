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

// Strict name matching: requires that EVERY word in the query is present
// in the participant's name (as a whole word, a prefix, or a substring).
// Returns ranked candidates. Caller decides what to do with ambiguity.
function findByName(participants, query, excludeIDs) {
        if (!query || !participants || !participants.length) return [];
        const exclude = new Set((excludeIDs || []).map(String));
        const nq = normalize(query.replace(/^@+/, ""));
        if (!nq) return [];
        const words = nq.split(" ").filter(Boolean);
        if (words.length === 0) return [];

        const scored = [];
        for (const p of participants) {
                if (!p || !p.id || exclude.has(String(p.id))) continue;
                const pname = normalize(p.name || p.firstName || "");
                if (!pname) continue;
                const pwords = pname.split(" ").filter(Boolean);

                // Exact full-name match — top priority
                if (pname === nq) { scored.push({ p, score: 10000, allMatched: true }); continue; }

                // Full phrase substring match
                if (pname.includes(nq) || nq.includes(pname)) {
                        scored.push({ p, score: 5000 + Math.min(nq.length, pname.length), allMatched: true });
                        continue;
                }

                // Per-word strict matching: every query word must hit
                let total = 0;
                let allMatched = true;
                for (const w of words) {
                        let best = 0;
                        for (const pw of pwords) {
                                if (pw === w) { best = Math.max(best, 10); }
                                else if (pw.startsWith(w) || w.startsWith(pw)) { best = Math.max(best, 6); }
                                else if (pw.includes(w) || w.includes(pw)) { best = Math.max(best, 3); }
                        }
                        if (best === 0) { allMatched = false; break; }
                        total += best;
                }
                if (allMatched) scored.push({ p, score: total, allMatched: true });
        }

        scored.sort((a, b) => b.score - a.score);
        return scored;
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
                return {
                        targets: mentionIDs.map(uid => ({
                                uid,
                                name: (mentions[uid] || "").replace(/^@/, "").trim() || null,
                                source: "mention"
                        })),
                        ambiguous: false
                };
        }

        // 2) Reply
        if (messageReply && messageReply.senderID) {
                return {
                        targets: [{ uid: String(messageReply.senderID), name: null, source: "reply" }],
                        ambiguous: false
                };
        }

        // 3) Numeric UID args (only those that look like FB IDs: 5+ digits)
        const uidArgs = (args || []).filter(a => /^\d{5,}$/.test(String(a)));
        if (uidArgs.length > 0) {
                return {
                        targets: uidArgs.map(u => ({ uid: String(u), name: null, source: "uid" })),
                        ambiguous: false
                };
        }

        // 4) Name search across thread participants (strict: all words must hit)
        const rawArgs = (args && args.length) ? args : ((body || "").trim().split(/\s+/).slice(1));
        const nameQuery = rawArgs.join(" ").trim();
        if (nameQuery) {
                try {
                        const info = await api.getThreadInfo(threadID);
                        const participants = info.userInfo || [];
                        const ranked = findByName(participants, nameQuery, exclude);
                        if (ranked.length === 0) {
                                return { targets: [], ambiguous: false, query: nameQuery };
                        }
                        const top = ranked[0];
                        // Ambiguous if 2+ candidates tied at top score
                        const tied = ranked.filter(r => r.score === top.score);
                        if (tied.length > 1) {
                                return {
                                        targets: [],
                                        ambiguous: true,
                                        query: nameQuery,
                                        candidates: tied.slice(0, 5).map(t => ({
                                                uid: String(t.p.id),
                                                name: t.p.name || null
                                        }))
                                };
                        }
                        return {
                                targets: [{
                                        uid: String(top.p.id),
                                        name: top.p.name || null,
                                        source: "name"
                                }],
                                ambiguous: false
                        };
                } catch (e) {
                        return { targets: [], ambiguous: false, error: e.message || String(e) };
                }
        }

        return { targets: [], ambiguous: false };
}

module.exports = { resolveTargets, extractMentionIDs, findByName, normalize };
