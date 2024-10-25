// src/app.js
const express = require('express');

try {
  const http = require('http');
  require('dotenv').config();
  const gameLogic = require('./gameLogic');
  const { handleTwitchAuth, getTwitchToken, getTwitchUserInfo } = require('./twitch');
  const path = require('path');
  const cors = require('cors');

  const app = express();
  const server = http.createServer(app);

  app.use(express.static('public'));
  app.use(express.json());
  app.use(cors());

  app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'");
    next();
  });

  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  });

  app.get('/auth/twitch', async (req, res) => {
    try {
      const twitchAuthUrl = await handleTwitchAuth();
      res.redirect(twitchAuthUrl);
    } catch (error) {
      console.error('Error in /auth/twitch route:', error);
      res.status(500).send('Error initiating Twitch authentication');
    }
  });

  app.get('/auth/twitch/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) {
      return res.status(400).send('No code provided');
    }
    try {
      const token = await getTwitchToken(code);
      const userInfo = await getTwitchUserInfo(token);
      res.redirect(`/?login=success&username=${userInfo.login}&role=${userInfo.role}`);
    } catch (error) {
      console.error('Error during Twitch authentication:', error);
      res.status(500).send('Authentication failed');
    }
  });

  app.get('/api/events', (req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    const sendEvent = (event, data) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    gameLogic.addEventListeners(sendEvent);

    sendEvent('ping', { message: 'Connected to server' });
    
    const keepAlive = setInterval(() => {
      sendEvent('ping', { message: 'Keeping connection alive' });
    }, 15000);

    req.on('close', () => {
      clearInterval(keepAlive);
      gameLogic.removeEventListeners(sendEvent);
    });
  });

  app.post('/api/import-csv', express.text(), (req, res) => {
    const csvData = req.body;
    const questions = csvData.split('\n').map(row => {
      const [question, rightAnswer] = row.split(',');
      return { question, options: ['Yes', 'No'], rightAnswer };
    });
    questions.forEach(q => gameLogic.addQuestion(q.question, q.options, q.rightAnswer));
    res.json({ message: 'CSV imported successfully' });
  });

  setInterval(() => {
    gameLogic.generateQuestion();
  }, 300000); // Generate a new question every 5 minutes

  module.exports = app;
} catch (error) {
  console.error('Unexpected error in app.js:', error);
  const app = express();
  app.use((req, res) => {
    res.status(500).send('Internal Server Error. Please try again later.');
  });
  module.exports = app;
}
