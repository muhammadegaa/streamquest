// src/gameLogic.js

function handleGameLogic(socket, io) {
    // Example game logic: A basic voting system for an adventure decision
    socket.on('startGame', (gameState) => {
      console.log('Game started:', gameState);
  
      // Broadcast to all users that the game has started
      io.emit('gameStarted', gameState);
    });
  
    socket.on('playerAction', (action) => {
      console.log('Player Action:', action);
  
      // Process player actions and update game state
      const updatedGameState = {}; // Example: update based on action
  
      // Broadcast updated state to all players
      io.emit('gameStateUpdated', updatedGameState);
    });
  }
  
  module.exports = { handleGameLogic };  