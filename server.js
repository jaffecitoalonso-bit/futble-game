const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// BASE DE DATOS MULTIJUGADOR
const wordsBank = [    
    {word:"FLICK",cat:"ENTRENADORES"},{word:"ENRIQUE",cat:"ENTRENADORES"},
    {word:"SCALONI",cat:"ENTRENADORES"},{word:"KOMPANY",cat:"ENTRENADORES"},
    {word:"GUARDIOLA",cat:"ENTRENADORES"},{word:"SIMEONE",cat:"ENTRENADORES"},
    {word:"ARTETA",cat:"ENTRENADORES"},{word:"OTONIEL",cat:"ENTRENADORES"},
    {word:"ARBELOA",cat:"ENTRENADORES"},{word:"KLOPP",cat:"ENTRENADORES"},
    {word:"ANFIELD",cat:"ESTADIOS"},{word:"CAMPNOU",cat:"ESTADIOS"},
    {word:"BERNABEU",cat:"ESTADIOS"},{word:"INDEPENDENCIA",cat:"ESTADIOS"},
    {word:"WEMBLEY",cat:"ESTADIOS"},{word:"RONALDINHO",cat:"LEYENDAS"},
    {word:"MARADONA",cat:"LEYENDAS"},{word:"PELE",cat:"LEYENDAS"},
    {word:"LEVYASHIN",cat:"LEYENDAS"},{word:"XAVI",cat:"LEYENDAS"},
    {word:"INIESTA",cat:"LEYENDAS"},{word:"KROSS",cat:"LEYENDAS"},
    {word:"RONALDO",cat:"LEYENDAS"},{word:"ZIDANE",cat:"LEYENDAS"},
    {word:"PUYOL",cat:"LEYENDAS"},{word:"NICARAGUA",cat:"SELECCIONES"},
    {word:"ESPAÑA",cat:"SELECCIONES"},{word:"BRASIL",cat:"SELECCIONES"},
    {word:"ARGENTINA",cat:"SELECCIONES"},{word:"ALEMANIA",cat:"SELECCIONES"},
    {word:"URUGUAY",cat:"SELECCIONES"},{word:"FRANCIA",cat:"SELECCIONES"},
    {word:"PORTUGAL",cat:"SELECCIONES"},{word:"INGLATERRA",cat:"SELECCIONES"},
    {word:"ITALIA",cat:"SELECCIONES"},{word:"BAYERN",cat:"CLUBES"},
    {word:"DORTMUNT",cat:"CLUBES"},{word:"LEVERKUSEN",cat:"CLUBES"},
    {word:"LEIPZIG",cat:"CLUBES"},{word:"BARCELONA",cat:"CLUBES"},
    {word:"MADRID",cat:"CLUBES"},{word:"ATLETICO",cat:"CLUBES"},
    {word:"VILLAREAL",cat:"CLUBES"},{word:"PARIS",cat:"CLUBES"},
    {word:"MARSELLA",cat:"CLUBES"},{word:"MONACO",cat:"CLUBES"},
    {word:"LYON",cat:"CLUBES"},{word:"ARSENAL",cat:"CLUBES"},
    {word:"CITY",cat:"CLUBES"},{word:"LIVERPOOL",cat:"CLUBES"},
    {word:"CHELSEA",cat:"CLUBES"},{word:"MILAN",cat:"CLUBES"},
    {word:"INTER",cat:"CLUBES"},{word:"NAPOLI",cat:"CLUBES"},
    {word:"JUVENTUS",cat:"CLUBES"},{word:"ESTELI",cat:"CLUBES"},
    {word:"DIRIANGEN",cat:"CLUBES"},{word:"INTERMIAMI",cat:"CLUBES"},
    {word:"ALLNASSER",cat:"CLUBES"},{word:"BOLOGNA",cat:"CLUBES"},
    {word:"MESSI",cat:"JUGADORES"},{word:"NEYMAR",cat:"JUGADORES"},
    {word:"CRISTIANO",cat:"JUGADORES"},{word:"OLISE",cat:"JUGADORES"},
    {word:"NEUER",cat:"JUGADORES"},{word:"KANE",cat:"JUGADORES"},
    {word:"LUISDIAZ",cat:"JUGADORES"},{word:"MUSIALA",cat:"JUGADORES"},
    {word:"KIMMICH",cat:"JUGADORES"},{word:"GRIMALDO",cat:"JUGADORES"},
    {word:"LEWANDOWSKI",cat:"JUGADORES"},{word:"RAPHINHA",cat:"JUGADORES"},
    {word:"YAMAL",cat:"JUGADORES"},{word:"FERRAN",cat:"JUGADORES"},
    {word:"FERMIN",cat:"JUGADORES"},{word:"OLMO",cat:"JUGADORES"},
    {word:"PEDRI",cat:"JUGADORES"},{word:"DEJONG",cat:"JUGADORES"},
    {word:"GAVI",cat:"JUGADORES"},{word:"CUBARSI",cat:"JUGADORES"},
    {word:"CANCELO",cat:"JUGADORES"},{word:"TERSTEGEN",cat:"JUGADORES"},
    {word:"JOANGARCIA",cat:"JUGADORES"},{word:"CUORTIUOS",cat:"JUGADORES"},
    {word:"MBAPPE",cat:"JUGADORES"},{word:"VINI",cat:"JUGADORES"},
    {word:"VALVERDE",cat:"JUGADORES"},{word:"BELLINGHAM",cat:"JUGADORES"},
    {word:"GULER",cat:"JUGADORES"},{word:"ALVAREZ",cat:"JUGADORES"},
    {word:"GRIEZZMAN",cat:"JUGADORES"},{word:"OBLAK",cat:"JUGADORES"},
    {word:"DEMBELE",cat:"JUGADORES"},{word:"KVARATSKHELIA",cat:"JUGADORES"},
    {word:"VITHINHA",cat:"JUGADORES"},{word:"DOUE",cat:"JUGADORES"},
    {word:"HAKIMI",cat:"JUGADORES"},{word:"HAALAND",cat:"JUGADORES"},
    {word:"DOKU",cat:"JUGADORES"},{word:"DONNARUMA",cat:"JUGADORES"},
    {word:"CHERKI",cat:"JUGADORES"},{word:"WIRTZ",cat:"JUGADORES"},
    {word:"SZOBOSZLAI",cat:"JUGADORES"},{word:"SALAH",cat:"JUGADORES"},
    {word:"VIRGIL",cat:"JUGADORES"},{word:"GYOKERES",cat:"JUGADORES"},
    {word:"SAKA",cat:"JUGADORES"},{word:"RICE",cat:"JUGADORES"},
    {word:"RAYA",cat:"JUGADORES"},{word:"BRUNO",cat:"JUGADORES"},
    {word:"LAUTARO",cat:"JUGADORES"},{word:"MODRIC",cat:"JUGADORES"},
    {word:"BASTONI",cat:"JUGADORES"},{word:"BARRERA",cat:"JUGADORES"},
    {word:"BONILLA",cat:"JUGADORES"}
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
        // AHORA PERMITE HASTA 10 JUGADORES
        if (room && room.players.length < 10) {
            room.players.push({ id: socket.id, name, wins: 0 });
            socket.join(roomCode);
            io.to(roomCode).emit('playerJoined', { players: room.players, gameData: room.gameData });
        } else {
            socket.emit('error', 'Sala llena o no existe');
        }
    });

    socket.on('startGame', (roomCode) => {
        if (rooms[roomCode]) io.to(roomCode).emit('gameStarted', rooms[roomCode].gameData);
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
        if (rooms[roomCode]) {
            delete rooms[roomCode];
            io.to(roomCode).emit('hostExited');
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor listo en puerto ${PORT}`));