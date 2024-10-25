// src/app.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const { handleGameLogic, questions, currentQuestionIndex, votes } = require('./gameLogic');
const { handleTwitchAuth, getTwitchToken, getTwitchUserInfo } = require('./twitch');
const path = require('path');
const cors = require('cors');
const twitchEventSub = require('./twitchEventSub');

const app = express();
const httpServer = http.createServer(app);
const socketServer = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  allowEIO3: true,
  path: '/socket.io'
});

socketServer.attach(httpServer);

console.log('Server starting...');

// Serve static files from 'public'
app.use(express.static('public'));

// Basic route
app.get('/', (req, res) => {
  console.log('Serving index.html');
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Catch-all route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Twitch OAuth route (for logging in)
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

// Twitch OAuth callback route
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
    // Here you might want to store the token and user info in a session or send it to the client
    res.redirect('/?login=success');
  } catch (error) {
    console.error('Error during Twitch authentication:', error);
    console.error('Error details:', error.response ? error.response.data : 'No response data');
    res.status(500).send('Authentication failed');
  }
});

// WebSocket connection for real-time game events
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  allowEIO3: true,
  path: '/socket.io'
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  socket.on('disconnect', (reason) => {
    console.log('User disconnected:', socket.id, 'Reason:', reason);
  });

  // Tambahkan event listener baru
  socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
    // Tambahkan logika penanganan kesalahan di sini
  });

  socket.on('connect_timeout', (timeout) => {
    console.error('Connection timeout:', timeout);
    // Tambahkan logika penanganan timeout di sini
  });
});

io.engine.on('connection_error', (err) => {
  console.log('Connection error details:');
  console.log('Request:', err.req);
  console.log('Code:', err.code);
  console.log('Message:', err.message);
  console.log('Context:', err.context);
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

// API route to test server
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Start the server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.use('/socket.io', express.static(path.join(__dirname, '../node_modules/socket.io/client-dist')));

// Set up Twitch EventSub
twitchEventSub.setup(app);

// Tambahkan logging untuk server
httpServer.on('error', (error) => {
  console.error('Server error:', error);
});
