const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const wordsBank = [
    { word: "MESSI", cat: "LEYENDAS" }, { word: "MBAPPE", cat: "JUGADOR" },
    { word: "RONALDO", cat: "LEYENDAS" }, { word: "KLOPP", cat: "TECNICOS" },
    { word: "BERNABEU", cat: "ESTADIO" }, { word: "MADRID", cat: "CLUB" }
];

let rooms = {};

io.on('connection', (socket) => {
    socket.on('createRoom', (name) => {
        const roomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
        rooms[roomCode] = { 
            players: [{ id: socket.id, name, wins: 0 }], 
            gameData: wordsBank[Math.floor(Math.random() * wordsBank.length)],
            hostId: socket.id 
        };
        socket.join(roomCode);
        socket.emit('roomCreated', { roomCode, gameData: rooms[roomCode].gameData });
    });

    socket.on('joinRoom', ({ name, roomCode }) => {
        const room = rooms[roomCode];
        if (room && room.players.length < 2) {
            room.players.push({ id: socket.id, name, wins: 0 });
            socket.join(roomCode);
            io.to(roomCode).emit('playerJoined', { players: room.players, gameData: room.gameData });
        } else {
            socket.emit('error', 'Sala no disponible');
        }
    });

    socket.on('startGame', (roomCode) => {
        io.to(roomCode).emit('gameStarted', rooms[roomCode].gameData);
    });

    socket.on('finished', ({ roomCode, name }) => {
        const room = rooms[roomCode];
        if (room) {
            const player = room.players.find(p => p.name === name);
            if (player) player.wins++;
            io.to(roomCode).emit('gameOver', { winner: name, scores: room.players });
        }
    });

    socket.on('hostPlayAgain', (roomCode) => {
        if (rooms[roomCode]) {
            rooms[roomCode].gameData = wordsBank[Math.floor(Math.random() * wordsBank.length)];
            io.to(roomCode).emit('hostPlayAgain', rooms[roomCode].gameData);
        }
    });

    socket.on('hostExit', (roomCode) => {
        delete rooms[roomCode];
        io.to(roomCode).emit('hostExited');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Puerto ${PORT}`));