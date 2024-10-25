// src/gameLogic.js

const questions = [
    { question: "Apakah karakter harus pergi ke gua atau hutan?", options: ["Gua", "Hutan"] },
    { question: "Haruskah karakter berbicara dengan penduduk desa atau melanjutkan perjalanan?", options: ["Berbicara", "Melanjutkan"] },
    { question: "Apakah karakter harus mengambil pedang ajaib atau tongkat sihir?", options: ["Pedang", "Tongkat"] }
];

let currentQuestionIndex = 0;
let votes = { A: 0, B: 0 };
let eventListeners = [];

function startGame() {
  currentQuestionIndex = 0;
  votes = { A: 0, B: 0 };
  notifyListeners('gameStarted', { question: questions[currentQuestionIndex].question });
}

function handlePlayerAction(action, choice, username) {
  if (action === 'vote') {
    votes[choice.toUpperCase()]++;
    notifyListeners('voteUpdated', { votes, username, choice });

    if (votes.A + votes.B >= 5) {
      currentQuestionIndex++;
      if (currentQuestionIndex < questions.length) {
        votes = { A: 0, B: 0 };
        notifyListeners('gameStateUpdated', { question: questions[currentQuestionIndex].question });
      } else {
        notifyListeners('gameEnded', { message: "Quest completed!" });
      }
    }
  }
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

module.exports = {
  questions,
  currentQuestionIndex,
  votes,
  startGame,
  handlePlayerAction,
  addEventListeners,
  removeEventListeners
};
