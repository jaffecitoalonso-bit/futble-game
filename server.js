const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const wordsBank = [
    { word: "MESSI", cat: "LEYENDAS" },
    { word: "MBAPPE", cat: "JUGADOR" },
    { word: "RONALDO", cat: "LEYENDAS" },
    { word: "KLOPP", cat: "TECNICOS" },
    { word: "ANACELOTTI", cat: "TECNICOS" },
    { word: "BERNABEU", cat: "ESTADIO" },
    { word: "CAMPNOU", cat: "ESTADIO" },
    { word: "ARSENAL", cat: "CLUB" },
    { word: "MADRID", cat: "CLUB" },
    { word: "ESPAÑA", cat: "SELECCIONES" },
    { word: "BRASIL", cat: "SELECCIONES" }
];

let rooms = {};

io.on('connection', (socket) => {
    socket.on('createRoom', (name) => {
        const roomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
        const gameData = wordsBank[Math.floor(Math.random() * wordsBank.length)];
        rooms[roomCode] = { 
            players: [{ id: socket.id, name }], 
            gameData: gameData 
        };
        socket.join(roomCode);
        socket.emit('roomCreated', { roomCode, gameData });
    });

    socket.on('joinRoom', ({ name, roomCode }) => {
        const room = rooms[roomCode];
        if (room && room.players.length < 2) {
            room.players.push({ id: socket.id, name });
            socket.join(roomCode);
            io.to(roomCode).emit('playerJoined', {
                players: room.players,
                gameData: room.gameData
            });
        } else {
            socket.emit('error', 'Sala llena o inexistente');
        }
    });

    socket.on('startGame', (roomCode) => {
        const room = rooms[roomCode];
        if (room) {
            room.gameData = wordsBank[Math.floor(Math.random() * wordsBank.length)];
            io.to(roomCode).emit('gameStarted', room.gameData);
        }
    });

    socket.on('finished', ({ roomCode, name }) => {
        io.to(roomCode).emit('gameOver', name);
    });
});

server.listen(3000, () => console.log('Servidor en http://localhost:3000'));