// src/gameLogic.js

const questions = [
    { question: "Apakah karakter harus pergi ke gua atau hutan?", options: ["Gua", "Hutan"] },
    { question: "Haruskah karakter berbicara dengan penduduk desa atau melanjutkan perjalanan?", options: ["Berbicara", "Melanjutkan"] },
    { question: "Apakah karakter harus mengambil pedang ajaib atau tongkat sihir?", options: ["Pedang", "Tongkat"] }
];

let currentQuestionIndex = 0;
let votes = { A: 0, B: 0 };

const { setupTwitchChat } = require('./twitchChat');

function handleGameLogic(socket, io) {
    let twitchClient;

    console.log('Game logic initialized for socket:', socket.id);

    socket.on('startGame', (data) => {
        console.log('Start game event received:', data);
        currentQuestionIndex = 0;
        votes = { A: 0, B: 0 };
        io.emit('gameStarted', { question: questions[currentQuestionIndex].question });

        // Setup Twitch chat
        if (data.twitchChannel) {
            twitchClient = setupTwitchChat(data.twitchChannel, (username, message) => {
                if (message.toLowerCase() === 'a' || message.toLowerCase() === 'b') {
                    handleVote(message.toLowerCase(), username);
                }
            });
        }
    });

    function handleVote(choice, username) {
        console.log('Vote received:', choice, 'from', username);
        votes[choice.toUpperCase()]++;
        io.emit('voteUpdated', { votes, username, choice });

        if (votes.A + votes.B >= 5) {
            currentQuestionIndex++;
            if (currentQuestionIndex < questions.length) {
                votes = { A: 0, B: 0 };
                io.emit('gameStateUpdated', { question: questions[currentQuestionIndex].question });
            } else {
                io.emit('gameEnded', { message: "Quest completed!" });
            }
        }
    }

    socket.on('playerAction', (action) => {
        console.log('Player action received:', action);
        if (action.action === 'vote') {
            handleVote(action.choice, action.username);
        }
    });
}

module.exports = { handleGameLogic, questions, currentQuestionIndex, votes };
