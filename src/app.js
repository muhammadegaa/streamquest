// src/app.js
const express = require('express');
const http = require('http');
require('dotenv').config();
const { handleGameLogic, questions, currentQuestionIndex, votes } = require('./gameLogic');
const { handleTwitchAuth, getTwitchToken, getTwitchUserInfo } = require('./twitch');
const path = require('path');
const cors = require('cors');
const twitchEventSub = require('./twitchEventSub');

const app = express();
const httpServer = http.createServer(app);

console.log('Server starting...');

app.use(express.static('public'));
app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  console.log('Serving index.html');
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/auth/twitch', async (req, res) => {
  try {
    const twitchAuthUrl = await handleTwitchAuth();
    console.log('Redirecting to Twitch auth URL:', twitchAuthUrl);
    res.redirect(twitchAuthUrl);
  } catch (error) {
    console.error('Error in /auth/twitch route:', error);
    res.status(500).send('Error initiating Twitch authentication');
  }
});

app.get('/auth/twitch/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) {
    console.error('No code provided in callback');
    return res.status(400).send('No code provided');
  }
  try {
    const token = await getTwitchToken(code);
    const userInfo = await getTwitchUserInfo(token);
    console.log('User authenticated:', userInfo);
    res.redirect('/?login=success');
  } catch (error) {
    console.error('Error during Twitch authentication:', error);
    console.error('Error details:', error.response ? error.response.data : 'No response data');
    res.status(500).send('Authentication failed');
  }
});

app.get('/api/game-state', (req, res) => {
  res.json({
    currentQuestion: questions[currentQuestionIndex].question,
    votes: votes
  });
});

app.post('/api/start-game', (req, res) => {
  handleGameLogic.startGame();
  res.json({ message: 'Game started' });
});

app.post('/api/player-action', (req, res) => {
  const { action, choice, username } = req.body;
  handleGameLogic.handlePlayerAction(action, choice, username);
  res.json({ message: 'Action received' });
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

  handleGameLogic.addEventListeners(sendEvent);

  req.on('close', () => {
    handleGameLogic.removeEventListeners(sendEvent);
  });
});

app.get('/api/user', async (req, res) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const userInfo = await getTwitchUserInfo(token);
    res.json(userInfo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user info' });
  }
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running' });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

twitchEventSub.setup(app);

httpServer.on('error', (error) => {
  console.error('Server error:', error);
});
