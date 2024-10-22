const axios = require('axios');
const crypto = require('crypto');
const express = require('express');

const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
const TWITCH_EVENTSUB_SECRET = process.env.TWITCH_EVENTSUB_SECRET;

function verifyTwitchSignature(req, res, buf, encoding) {
  const messageId = req.header("Twitch-Eventsub-Message-Id");
  const timestamp = req.header("Twitch-Eventsub-Message-Timestamp");
  const messageSignature = req.header("Twitch-Eventsub-Message-Signature");
  
  const hmac = crypto.createHmac('sha256', TWITCH_EVENTSUB_SECRET);
  hmac.update(messageId + timestamp + buf);
  const signature = 'sha256=' + hmac.digest('hex');

  if (messageSignature !== signature) {
    throw new Error('Invalid signature');
  }
}

async function setupEventSub(app) {
  app.use('/twitch/webhook', express.raw({ type: 'application/json', verify: verifyTwitchSignature }));

  app.post('/twitch/webhook', (req, res) => {
    const messageType = req.header("Twitch-Eventsub-Message-Type");

    if (messageType === "webhook_callback_verification") {
      console.log('Verifying Webhook');
      return res.status(200).send(req.body.challenge);
    }

    const { type } = req.body.subscription;
    const { event } = req.body;

    console.log(`Received event: ${type}`);
    console.log(event);

    // Handle different event types here

    res.status(200).end();
  });

  // Subscribe to events
  // You'll need to implement this function to subscribe to the events you want
  // await subscribeToEvents();
}

module.exports = {
  setup: setupEventSub
};

