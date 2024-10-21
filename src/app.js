// src/app.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const { handleGameLogic, questions, currentQuestionIndex, votes } = require('./gameLogic');
const { handleTwitchAuth, getTwitchToken, getTwitchUserInfo } = require('./twitch');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from 'public'
app.use(express.static('public'));

// Basic route
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Twitch OAuth route (for logging in)
app.get('/auth/twitch', async (req, res) => {
  console.log('Twitch auth route hit');
  const twitchAuthUrl = await handleTwitchAuth();
  console.log('Redirecting to:', twitchAuthUrl);
  res.redirect(twitchAuthUrl);
});

// Twitch OAuth callback route
app.get('/auth/twitch/callback', async (req, res) => {
  const { code } = req.query;
  try {
    const token = await getTwitchToken(code);
    const userInfo = await getTwitchUserInfo(token);
    // Simpan token dan userInfo di session atau kirim ke client
    res.redirect('/'); // Redirect ke halaman utama
  } catch (error) {
    console.error('Error during Twitch authentication:', error);
    res.status(500).send('Authentication failed');
  }
});

// WebSocket connection for real-time game events
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  handleGameLogic(socket, io); // Handle game interactions

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// API route to get current game state
app.get('/api/game-state', (req, res) => {
    res.json({
        currentQuestion: questions[currentQuestionIndex].question,
        votes: votes
    });
});

// API route to get Twitch user info
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

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
