const tmi = require('tmi.js');

function setupTwitchChat(channel, onMessageHandler) {
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

