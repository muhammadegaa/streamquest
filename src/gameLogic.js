// src/gameLogic.js

let questions = [
  { question: "What's your favorite game genre?", options: ["Action", "RPG"] },
  { question: "Do you prefer single-player or multiplayer games?", options: ["Single-player", "Multiplayer"] }
];

function addQuestion(question, options) {
    questions.push({ question, options });
}

let currentQuestionIndex = 0;
let votes = { A: 0, B: 0 };
let eventListeners = [];
const { setupTwitchChat } = require('./twitchChat');

function startGame() {
  if (questions.length === 0) {
    throw new Error("No questions available");
  }
  currentQuestionIndex = 0;
  votes = { A: 0, B: 0 };
  notifyListeners('gameStarted', { 
    question: questions[currentQuestionIndex].question,
    options: questions[currentQuestionIndex].options
  });
}

function handlePlayerAction(action, choice, username) {
  if (action === 'vote') {
    votes[choice.toUpperCase()]++;
    notifyListeners('voteUpdated', { votes, username, choice });
    if (votes.A + votes.B >= 3) {  // Changed from 5 to 3 for quicker progression
      currentQuestionIndex++;
      if (currentQuestionIndex < questions.length) {
        votes = { A: 0, B: 0 };
        notifyListeners('gameStateUpdated', { question: questions[currentQuestionIndex].question, options: questions[currentQuestionIndex].options });
      } else {
        notifyListeners('gameEnded', { message: "Quest completed!" });
      }
    }
  }
}

function handleVote(choice, username) {
  votes[choice.toUpperCase()]++;
  notifyListeners('voteUpdated', { votes, username, choice });
  io.emit('voteUpdated', { votes, username, choice });
}

function notifyListeners(event, data) {
  eventListeners.forEach(listener => listener(event, data));
}

function addEventListeners(listener) {
  eventListeners.push(listener);
}

function removeEventListeners(listener) {
  eventListeners = eventListeners.filter(l => l !== listener);
}

function getCurrentQuestion() {
  return questions[currentQuestionIndex];
}

functio