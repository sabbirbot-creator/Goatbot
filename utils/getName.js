"use strict";

const _cache = new Map();
const TTL = 10 * 60 * 1000;

function cacheGet(id) {
  const v = _cache.get(id);
  if (!v) return null;
  if (Date.now() - v.t > TTL) {
    _cache.delete(id);
    return null;
  }
  return v.name;
}

function cacheSet(id, name) {
  if (!name || name === "Facebook User") return;
  _cache.set(id, { name, t: Date.now() });
}

async function getName(api, userID, fallback = "Facebook User") {
  if (!userID) return fallback;
  const id = String(userID);

  const cached = cacheGet(id);
  if (cached) return cached;

  try {
    if (global.db && Array.isArray(global.db.allUserData)) {
      const row = global.db.allUserData.find(u => String(u.userID) === id);
      if (row && row.name && row.name !== "Facebook User") {
        cacheSet(id, row.name);
        return row.name;
      }
    }
  } catch (e) {}

  try {
    const info = await api.getUserInfo([id]);
    const obj = info && (info[id] || info[Number(id)]);
    if (obj && obj.name) {
      cacheSet(id, obj.name);
      return obj.name;
    }
  } catch (e) {}

  try {
    const single = await api.getUserInfo(id);
    if (single && typeof single === "object") {
      const name = single.name || (single[id] && single[id].name);
      if (name) {
        cacheSet(id, name);
        return name;
      }
    }
  } catch (e) {}

  return fallback;
}

module.exports = { getName };
