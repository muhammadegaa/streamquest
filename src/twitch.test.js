require('dotenv').config();
const { handleTwitchAuth } = require('./twitch');

test('handleTwitchAuth returns a valid Twitch auth URL', async () => {
  const url = await handleTwitchAuth();
  expect(url).toContain('https://id.twitch.tv/oauth2/authorize');
  expect(url).toContain(process.env.TWITCH_CLIENT_ID);
});

// Tambahkan tes tambahan untuk memastikan variabel lingkungan ada
test('Environment variables are set', () => {
  expect(process.env.TWITCH_CLIENT_ID).toBeDefined();
  expect(process.env.TWITCH_REDIRECT_URI).toBeDefined();
});
