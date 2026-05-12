const socket = io();
let myName = "", currentRoom = null, targetWord = "", category = "";
let currentRow = 0, currentCol = 0, guesses = ["", "", "", "", "", ""];
let isHost = false, isSolo = false;

// BASE DE DATOS MODO SOLO
const soloWords = [
    {word: "MESSI", cat: "LEYENDAS"},
    {word: "ARSENAL", cat: "CLUB"},
    {word: "ESPAÑA", cat: "SELECCIONES"},
    {word: "ZIDANE", cat: "LEYENDAS"},
    {word: "ANFIELD", cat: "ESTADIO"}
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

// --- INICIO DE JUEGO ---

function startSolo() {
    myName = document.getElementById('username').value.trim() || "Jugador";
    isSolo = true; isHost = false; currentRoom = null;
    const picked = soloWords[Math.floor(Math.random() * soloWords.length)];
    targetWord = picked.word; category = picked.cat;
    resetGameData();
}

function createRoom() {
    myName = document.getElementById('username').value.trim();
    if (!myName) return alert("Escribe tu nombre");
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

function resetGameData() {
    currentRow = 0; currentCol = 0;
    guesses = ["", "", "", "", "", ""];
    showScreen('screen-game');
    initBoard();
}

function initBoard() {
    document.getElementById('category-badge').innerText = category;
    document.getElementById('word-hint').innerText = `Palabra de ${targetWord.length} letras`;
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

// --- JUGABILIDAD ---

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
        const letter = guess[i];
        const cell = document.getElementById(`cell-${startIdx + i}`);
        let status = 'absent';
        if (letter === targetWord[i]) status = 'correct';
        else if (targetWord.includes(letter)) status = 'present';
        
        cell.classList.add(status);
        updateKeyboardColor(letter, status);
    }

    if (guess === targetWord) {
        endGame(true);
    } else {
        currentRow++; currentCol = 0;
        if (currentRow === 6) endGame(false);
    }
}

function updateKeyboardColor(letter, status) {
    const btn = document.getElementById(`key-${letter}`);
    if (!btn || btn.classList.contains('correct')) return;
    if (btn.classList.contains('present') && status === 'present') return;
    btn.classList.remove('present', 'absent');
    btn.classList.add(status);
}

// --- FINALIZACIÓN ---

function endGame(won) {
    if (isSolo) {
        const stats = saveStats(won);
        displayResult(won ? "¡ACERTASTE!" : "PERDISTE. ERA: " + targetWord, stats);
    } else {
        socket.emit('finished', { roomCode: currentRoom, name: won ? myName : "Nadie" });
    }
}

function saveStats(won) {
    let s = JSON.parse(localStorage.getItem('futble_stats')) || { played: 0, wins: 0, streak: 0 };
    s.played++;
    if (won) { s.wins++; s.streak++; } else { s.streak = 0; }
    localStorage.setItem('futble_stats', JSON.stringify(s));
    return s;
}

function displayResult(txt, stats) {
    document.getElementById('winner-text').innerText = txt;
    if (isSolo) {
        document.getElementById('stats-solo').style.display = 'block';
        document.getElementById('scoreboard').style.display = 'none';
        document.getElementById('stat-played').innerText = stats.played;
        document.getElementById('stat-win-pct').innerText = Math.round((stats.wins/stats.played)*100) + "%";
        document.getElementById('stat-streak').innerText = stats.streak;
        document.getElementById('attempts-used').innerText = (currentRow < 6 && !txt.includes("PERDISTE")) ? (currentRow + 1) : "X";
        document.getElementById('result-category').innerText = category;
    }
    
    // Botones según rol
    document.getElementById('btn-replay').style.display = (isSolo || isHost) ? 'block' : 'none';
    document.getElementById('btn-exit').style.display = 'block';
    document.getElementById('wait-message').style.display = (!isSolo && !isHost) ? 'block' : 'none';
    
    showScreen('screen-result');
}

// --- SOCKETS EVENTS ---

socket.on('roomCreated', (data) => {
    currentRoom = data.roomCode; targetWord = data.gameData.word; category = data.gameData.cat;
    document.getElementById('display-code').innerText = data.roomCode;
    document.getElementById('start-btn').style.display = 'block';
    showScreen('screen-lobby');
});

socket.on('playerJoined', (data) => {
    document.getElementById('player-list').innerHTML = data.players.map(p => `<li>${p.name}</li>`).join('');
});

socket.on('gameStarted', (data) => {
    targetWord = data.word; category = data.cat;
    resetGameData();
});

socket.on('gameOver', (data) => {
    document.getElementById('stats-solo').style.display = 'none';
    document.getElementById('scoreboard').style.display = 'block';
    document.getElementById('scoreboard-content').innerText = data.scores.map(p => `${p.name}: ${p.wins}`).join(" | ");
    displayResult(data.winner === "Nadie" ? "NADIE ACERTÓ" : "GANÓ " + data.winner);
});

socket.on('hostPlayAgain', (data) => {
    targetWord = data.word; category = data.cat;
    resetGameData();
});

socket.on('hostExited', () => { location.reload(); });

function startGame() { socket.emit('startGame', currentRoom); }
function playAgain() { 
    if (isSolo) startSolo(); 
    else socket.emit('hostPlayAgain', currentRoom); 
}
function exitGame() { 
    if (isHost && currentRoom) socket.emit('hostExit', currentRoom); 
    location.reload(); 
}