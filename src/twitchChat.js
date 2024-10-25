let tmi;
try {
  tmi = require('tmi.js');
} catch (error) {
  console.warn('tmi.js not found. Twitch chat functionality will be disabled.');
}

function setupTwitchChat(channel, onMessageHandler) {
  if (!tmi) {
    console.warn('tmi.js not available. Skipping Twitch chat setup.');
    return null;
  }

  const client = new tmi.Client({
    channels: [channel]
  });

  client.connect();

  client.on('message', (channel, tags, message, self) => {
    if (self) return;
    onMessageHandler(tags.username, message);
  });

  return client;
}

module.exports = { setupTwitchChat };
