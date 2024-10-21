// src/app.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const { handleTwitchAuth } = require('./twitch');
const { handleGameLogic } = require('./gameLogic');

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
  const twitchAuthUrl = await handleTwitchAuth();
  res.redirect(twitchAuthUrl);
});

// WebSocket connection for real-time game events
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  handleGameLogic(socket, io); // Handle game interactions

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});