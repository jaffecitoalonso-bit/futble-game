const socket = io();
let myName = "", currentRoom = null, targetWord = "", category = "";
let currentRow = 0, currentCol = 0, guesses = ["", "", "", "", "", ""];
let isHost = false, isSolo = false;

const keys = [
    ['Q','W','E','R','T','Y','U','I','O','P'],
    ['A','S','D','F','G','H','J','K','L','Ñ'],
    ['ENVIAR','Z','X','C','V','B','N','M','BORRAR']
];

// Soporte teclado físico
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

function startSolo() {
    myName = document.getElementById('username').value.trim() || "Jugador";
    isSolo = true; isHost = false;
    prepareSoloGame();
}

function prepareSoloGame() {
    const soloWords = [{word: "MESSI", cat: "LEYENDAS"}, {word: "MADRID", cat: "CLUB"}, {word: "ESPAÑA", cat: "SELECCIONES"}];
    const picked = soloWords[Math.floor(Math.random() * soloWords.length)];
    targetWord = picked.word; category = picked.cat;
    resetGameState();
    showScreen('screen-game'); initGame();
}

function resetGameState() {
    currentRow = 0; currentCol = 0;
    guesses = ["", "", "", "", "", ""];
}

function playAgain() {
    if (isSolo) {
        prepareSoloGame();
    } else if (isHost) {
        socket.emit('hostPlayAgain', currentRoom);
    }
}

function exitGame() {
    if (currentRoom && isHost) socket.emit('hostExit', currentRoom);
    location.reload();
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
    if (!myName || !code) return alert("Nombre y código necesarios");
    isHost = false; isSolo = false;
    socket.emit('joinRoom', { name: myName, roomCode: code });
}

function startGame() { socket.emit('startGame', currentRoom); }

// SOCKETS
socket.on('roomCreated', (data) => {
    currentRoom = data.roomCode; targetWord = data.gameData.word; category = data.gameData.cat;
    document.getElementById('display-code').innerText = data.roomCode;
    document.getElementById('start-btn').style.display = 'block';
    showScreen('screen-lobby');
});

socket.on('playerJoined', (data) => {
    targetWord = data.gameData.word; category = data.gameData.cat;
    document.getElementById('player-list').innerHTML = data.players.map(p => `<li>${p.name}</li>`).join('');
    showScreen('screen-lobby');
});

socket.on('gameStarted', (data) => {
    targetWord = data.word; category = data.cat;
    resetGameState(); showScreen('screen-game'); initGame();
});

socket.on('gameOver', (data) => {
    document.getElementById('winner-text').innerText = data.winner === myName ? "¡GANASTE!" : "GANÓ " + data.winner.toUpperCase();
    
    if (isSolo) {
        document.getElementById('stats-solo').style.display = 'block';
        document.getElementById('scoreboard').style.display = 'none';
        document.getElementById('attempts-used').innerText = currentRow + 1;
        document.getElementById('result-category').innerText = category;
    } else {
        document.getElementById('stats-solo').style.display = 'none';
        document.getElementById('scoreboard').style.display = 'block';
        document.getElementById('scoreboard-content').innerText = 
            data.scores.map(p => `${p.name}: ${p.wins}`).join("  |  ");
    }

    // Lógica de botones de host
    if (isSolo || isHost) {
        document.getElementById('btn-replay').style.display = 'block';
        document.getElementById('btn-exit').style.display = 'block';
        document.getElementById('wait-message').style.display = 'none';
    } else {
        document.getElementById('btn-replay').style.display = 'none';
        document.getElementById('btn-exit').style.display = 'block';
        document.getElementById('wait-message').style.display = 'block';
    }
    showScreen('screen-result');
});

socket.on('hostPlayAgain', (gameData) => {
    targetWord = gameData.word; category = gameData.cat;
    resetGameState(); showScreen('screen-game'); initGame();
});

socket.on('hostExited', () => {
    alert("El anfitrión cerró la sala");
    location.reload();
});

// MOTOR DEL JUEGO
function initGame() {
    document.getElementById('category-badge').innerText = category;
    document.getElementById('word-hint').innerText = `La palabra tiene ${targetWord.length} letras`;
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
            btn.id = `key-${key}`;
            btn.innerText = key;
            btn.className = 'key' + (key.length > 1 ? ' wide' : '');
            btn.onclick = () => handleKey(key);
            rowDiv.appendChild(btn);
        });
    });
}

function handleKey(key) {
    if (key === 'BORRAR') {
        if (currentCol > 0) {
            currentCol--;
            document.getElementById(`cell-${(currentRow * targetWord.length) + currentCol}`).innerText = "";
            guesses[currentRow] = guesses[currentRow].slice(0, -1);
        }
    } else if (key === 'ENVIAR') {
        if (guesses[currentRow].length === targetWord.length) submitGuess();
    } else if (guesses[currentRow].length < targetWord.length && key.length === 1) {
        document.getElementById(`cell-${(currentRow * targetWord.length) + currentCol}`).innerText = key;
        guesses[currentRow] += key; currentCol++;
    }
}

function submitGuess() {
    const guess = guesses[currentRow];
    const startIdx = currentRow * targetWord.length;
    for (let i = 0; i < targetWord.length; i++) {
        const cell = document.getElementById(`cell-${startIdx + i}`);
        const status = guess[i] === targetWord[i] ? 'correct' : (targetWord.includes(guess[i]) ? 'present' : 'absent');
        cell.classList.add(status);
        const keyBtn = document.getElementById(`key-${guess[i]}`);
        if (keyBtn) keyBtn.classList.add(status);
    }

    if (guess === targetWord) {
        if(currentRoom) socket.emit('finished', { roomCode: currentRoom, name: myName });
        else displayResultSolo("¡GANASTE!");
    } else {
        currentRow++; currentCol = 0;
        if (currentRow === 6) {
            if (currentRoom) socket.emit('finished', { roomCode: currentRoom, name: "Nadie" });
            else displayResultSolo("PERDISTE. ERA: " + targetWord);
        }
    }
}

function displayResultSolo(txt) {
    document.getElementById('winner-text').innerText = txt;
    document.getElementById('stats-solo').style.display = 'block';
    document.getElementById('scoreboard').style.display = 'none';
    document.getElementById('attempts-used').innerText = currentRow === 6 ? "X" : currentRow + 1;
    document.getElementById('result-category').innerText = category;
    document.getElementById('btn-replay').style.display = 'block';
    document.getElementById('btn-exit').style.display = 'block';
    showScreen('screen-result');
}
// ... (Mantén las variables del inicio igual) ...

// Función para actualizar colores del teclado con jerarquía
function updateKeyboardColor(letter, status) {
    const btn = document.getElementById(`key-${letter}`);
    if (!btn) return;

    // Prioridad: 1. Correct (Verde), 2. Present (Amarillo), 3. Absent (Gris)
    if (btn.classList.contains('correct')) return; // Si ya está en verde, no cambia
    if (btn.classList.contains('present') && status === 'present') return; // Si ya está amarillo, no cambia a amarillo

    btn.classList.remove('present', 'absent'); 
    btn.classList.add(status);
}

// Lógica de Estadísticas (LocalStorage)
function saveStats(won) {
    let stats = JSON.parse(localStorage.getItem('futble_stats')) || { played: 0, wins: 0, streak: 0 };
    
    stats.played += 1;
    if (won) {
        stats.wins += 1;
        stats.streak += 1;
    } else {
        stats.streak = 0;
    }
    
    localStorage.setItem('futble_stats', JSON.stringify(stats));
    return stats;
}

// Reemplaza tu función submitGuess por esta mejorada
function submitGuess() {
    const guess = guesses[currentRow];
    const startIdx = currentRow * targetWord.length;
    
    for (let i = 0; i < targetWord.length; i++) {
        const cell = document.getElementById(`cell-${startIdx + i}`);
        const letter = guess[i];
        let status = 'absent';

        if (letter === targetWord[i]) {
            status = 'correct';
        } else if (targetWord.includes(letter)) {
            status = 'present';
        }

        cell.classList.add(status);
        updateKeyboardColor(letter, status); // <-- Llamada para pintar el teclado
    }

    if (guess === targetWord) {
        if(currentRoom) {
            socket.emit('finished', { roomCode: currentRoom, name: myName });
        } else {
            const finalStats = saveStats(true);
            displayResultSolo("¡GANASTE!", finalStats);
        }
    } else {
        currentRow++;
        currentCol = 0;
        if (currentRow === 6) {
            if (currentRoom) {
                socket.emit('finished', { roomCode: currentRoom, name: "Nadie" });
            } else {
                const finalStats = saveStats(false);
                displayResultSolo("PERDISTE. ERA: " + targetWord, finalStats);
            }
        }
    }
}

// Reemplaza tu displayResultSolo por esta
function displayResultSolo(txt, stats) {
    document.getElementById('winner-text').innerText = txt;
    document.getElementById('stats-solo').style.display = 'block';
    document.getElementById('scoreboard').style.display = 'none';
    
    // Calcular % de victorias
    const winPct = stats.played > 0 ? Math.round((stats.wins / stats.played) * 100) : 0;
    
    document.getElementById('stat-played').innerText = stats.played;
    document.getElementById('stat-win-pct').innerText = winPct + "%";
    document.getElementById('stat-streak').innerText = stats.streak;
    
    document.getElementById('attempts-used').innerText = currentRow === 6 && txt.includes("PERDISTE") ? "X" : (currentRow + (txt.includes("GANASTE") ? 1 : 0));
    document.getElementById('result-category').innerText = category;
    
    document.getElementById('btn-replay').style.display = 'block';
    document.getElementById('btn-exit').style.display = 'block';
    showScreen('screen-result');
}

// ... (El resto de funciones como renderKeyboard e initGame se quedan igual) ...