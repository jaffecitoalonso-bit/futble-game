const socket = io();
let myName = "", currentRoom = null, targetWord = "", category = "";
let currentRow = 0, currentCol = 0, guesses = ["", "", "", "", "", ""];
let isHost = false, isSolo = false;

// PALABRAS MODO SOLO
const soloWords = [
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

const keys = [
    ['Q','W','E','R','T','Y','U','I','O','P'],
    ['A','S','D','F','G','H','J','K','L','Ñ'],
    ['ENVIAR','Z','X','C','V','B','N','M','BORRAR']
];

window.addEventListener('keydown', (e) => {
    if (document.getElementById('screen-game').style.display !== 'block') return;
    const key = e.key.toUpperCase();
    if (key === 'BACKSPACE') handleKey('BORRAR');
    else if (key === 'ENTER') handleKey('ENVIAR');
    else if (/^[A-ZÑ]$/.test(key)) handleKey(key);
});

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    document.getElementById(id).style.display = 'block';
}

// --- LOGICA INICIO ---
function startSolo() {
    myName = document.getElementById('username').value.trim() || "Jugador";
    isSolo = true; isHost = false;
    const picked = soloWords[Math.floor(Math.random() * soloWords.length)];
    targetWord = picked.word; category = picked.cat;
    resetGame();
}

function createRoom() {
    myName = document.getElementById('username').value.trim();
    if (!myName) return alert("Pon tu nombre");
    isHost = true; isSolo = false;
    socket.emit('createRoom', myName);
}

function joinRoom() {
    myName = document.getElementById('username').value.trim();
    const code = document.getElementById('roomInput').value.trim().toUpperCase();
    if (!myName || !code) return alert("Faltan datos");
    isHost = false; isSolo = false;
    socket.emit('joinRoom', { name: myName, roomCode: code });
}

function resetGame() {
    currentRow = 0; currentCol = 0;
    guesses = ["", "", "", "", "", ""];
    showScreen('screen-game');
    initBoard();
}

function initBoard() {
    document.getElementById('category-badge').innerText = category;
    document.getElementById('word-hint').innerText = `Longitud: ${targetWord.length} letras`;
    const board = document.getElementById('board');
    board.style.gridTemplateColumns = `repeat(${targetWord.length}, 1fr)`;
    board.innerHTML = '';
    for (let i = 0; i < 6 * targetWord.length; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell'); cell.id = `cell-${i}`;
        board.appendChild(cell);
    }
    renderKeyboard();
}

function renderKeyboard() {
    [1,2,3].forEach(n => document.getElementById(`row-${n}`).innerHTML = '');
    keys.forEach((row, i) => {
        const rowDiv = document.getElementById(`row-${i+1}`);
        row.forEach(key => {
            const btn = document.createElement('button');
            btn.id = `key-${key}`; btn.innerText = key;
            btn.className = 'key' + (key.length > 1 ? ' wide' : '');
            btn.onclick = () => handleKey(key);
            rowDiv.appendChild(btn);
        });
    });
}

function handleKey(key) {
    const startIdx = currentRow * targetWord.length;
    if (key === 'BORRAR') {
        if (currentCol > 0) {
            currentCol--;
            document.getElementById(`cell-${startIdx + currentCol}`).innerText = "";
            guesses[currentRow] = guesses[currentRow].slice(0, -1);
        }
    } else if (key === 'ENVIAR') {
        if (guesses[currentRow].length === targetWord.length) submitGuess();
    } else if (guesses[currentRow].length < targetWord.length && key.length === 1) {
        document.getElementById(`cell-${startIdx + currentCol}`).innerText = key;
        guesses[currentRow] += key; currentCol++;
    }
}

function submitGuess() {
    const guess = guesses[currentRow];
    const startIdx = currentRow * targetWord.length;
    for (let i = 0; i < targetWord.length; i++) {
        const cell = document.getElementById(`cell-${startIdx + i}`);
        let status = 'absent';
        if (guess[i] === targetWord[i]) status = 'correct';
        else if (targetWord.includes(guess[i])) status = 'present';
        cell.classList.add(status);
        updateKeyColor(guess[i], status);
    }
    if (guess === targetWord) finish(true);
    else {
        currentRow++; currentCol = 0;
        if (currentRow === 6) finish(false);
    }
}

function updateKeyColor(l, s) {
    const btn = document.getElementById(`key-${l}`);
    if (!btn || btn.classList.contains('correct')) return;
    if (btn.classList.contains('present') && s === 'present') return;
    btn.classList.remove('present', 'absent'); btn.classList.add(s);
}

function finish(won) {
    if (isSolo) {
        let s = JSON.parse(localStorage.getItem('futble_stats')) || { played:0, wins:0, streak:0 };
        s.played++;
        if (won) { s.wins++; s.streak++; } else { s.streak = 0; }
        localStorage.setItem('futble_stats', JSON.stringify(s));
        showResult(won ? "¡ACERTASTE!" : "FALLASTE. ERA: " + targetWord, s);
    } else {
        socket.emit('finished', { roomCode: currentRoom, name: won ? myName : "Nadie" });
    }
}

function showResult(txt, stats) {
    document.getElementById('winner-text').innerText = txt;
    if (isSolo) {
        document.getElementById('stats-solo').style.display = 'block';
        document.getElementById('scoreboard').style.display = 'none';
        document.getElementById('stat-played').innerText = stats.played;
        document.getElementById('stat-win-pct').innerText = Math.round((stats.wins/stats.played)*100) + "%";
        document.getElementById('stat-streak').innerText = stats.streak;
        document.getElementById('attempts-used').innerText = currentRow < 6 && !txt.includes("FALLASTE") ? currentRow + 1 : "X";
        document.getElementById('result-category').innerText = category;
    }
    document.getElementById('btn-replay').style.display = (isSolo || isHost) ? 'block' : 'none';
    document.getElementById('wait-message').style.display = (!isSolo && !isHost) ? 'block' : 'none';
    showScreen('screen-result');
}

// --- SOCKETS ---
socket.on('roomCreated', (data) => {
    currentRoom = data.roomCode; targetWord = data.gameData.word; category = data.gameData.cat;
    document.getElementById('display-code').innerText = data.roomCode;
    document.getElementById('start-btn').style.display = 'block';
    showScreen('screen-lobby');
});

socket.on('playerJoined', (data) => {
    // EL TRUCO: Cuando alguien se une, todos los de la sala (incluido el nuevo) ven el lobby
    document.getElementById('player-list').innerHTML = data.players.map(p => `<li>${p.name}</li>`).join('');
    if (!isSolo) {
        document.getElementById('display-code').innerText = currentRoom || document.getElementById('roomInput').value.toUpperCase();
        showScreen('screen-lobby'); 
    }
});

socket.on('gameStarted', (data) => {
    targetWord = data.word; category = data.cat; resetGame();
});

socket.on('gameOver', (data) => {
    document.getElementById('stats-solo').style.display = 'none';
    document.getElementById('scoreboard').style.display = 'block';
    document.getElementById('scoreboard-content').innerText = data.scores.map(p => `${p.name}: ${p.wins}`).join(" | ");
    showResult(data.winner === "Nadie" ? "NADIE GANÓ" : "GANÓ " + data.winner);
});

socket.on('hostPlayAgain', (data) => {
    targetWord = data.word; category = data.cat; resetGame();
});

socket.on('hostExited', () => location.reload());

function startGame() { socket.emit('startGame', currentRoom); }
function playAgain() { if (isSolo) startSolo(); else socket.emit('hostPlayAgain', currentRoom); }
function exitGame() { 
    if (isHost && currentRoom) {
        socket.emit('hostExit', currentRoom);
    } else {
        location.reload();
    }
}