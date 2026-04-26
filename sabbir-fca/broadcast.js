'use strict';

const logger = require('./logger');

// Node 20 ships a global `fetch`. We avoid `got` here because the version
// pulled in by this dependency tree is ESM-only and removed the `.get` /
// `.post` shortcuts, which is what produced the historical
// `Fetch.get is not a function` warning during startup.

const broadcastConfig = {
  enabled: false,
  data: [],
};

const fetchBroadcastData = async () => {
  try {
    const response = await fetch(
      'https://raw.githubusercontent.com/KanzuXHorizon/Global_Horizon/main/Fca_BroadCast.json',
      { method: 'GET' }
    );
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }
    const body = await response.text();
    broadcastConfig.data = JSON.parse(body);
    return broadcastConfig.data;
  } catch (error) {
    logger.Error(`Failed to fetch broadcast data: ${error.message}`);
    broadcastConfig.data = [];
    return [];
  }
};

const broadcastRandomMessage = () => {
  const randomMessage = broadcastConfig.data.length > 0 ? broadcastConfig.data[Math.floor(Math.random() * broadcastConfig.data.length)] : 'Ae Zui Zẻ Nhé !';
  logger.Normal(randomMessage);
};

const startBroadcasting = async (enabled) => {
  enabled = global.Fca.Require.FastConfig.BroadCast

  if (enabled) {
    try {
      await fetchBroadcastData();
      broadcastRandomMessage();
      setInterval(broadcastRandomMessage, 3600 * 1000);
    } catch (error) {
      logger.Error(`Failed to start broadcasting: ${error.message}`);
    }
  }
};

module.exports = {
  startBroadcasting,
};