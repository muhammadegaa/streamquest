// src/gameLogic.js

let questions = [
    { question: "Should the character go left or right?", options: ["Left", "Right"] },
    { question: "Fight the dragon or negotiate?", options: ["Fight", "Negotiate"] },
    { question: "Take the treasure or leave it?", options: ["Take", "Leave"] }
];

let currentQuestionIndex = 0;
let votes = { A: 0, B: 0 };
let eventListeners = [];
const { setupTwitchChat } = require('./twitchChat');

function startGame() {
  currentQuestionIndex = 0;
  votes = { A: 0, B: 0 };
  return {
    question: questions[currentQuestionIndex].question,
    options: questions[currentQuestionIndex].options,
    votes: votes
  };
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

function getVotes() {
  return votes;
}

function generateQuestion() {
    // This is a simple example. You might want to make this more sophisticated.
    const topics = ['gameplay', 'stream', 'chat', 'emotes'];
    const topic = topics[Math.floor(Math.random() * topics.length)];
    const question = `What do you think about the current ${topic}?`;
    const options = ["It's great!", "It could be better"];
    addQuestion(question, options);
}

module.exports = {
  startGame,
  handlePlayerAction,
  getCurrentQuestion,
  getVotes,
  addEventListeners,
  removeEventListeners,
  generateQuestion
};
