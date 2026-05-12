const socket = io();
let myName = "", currentRoom = null, targetWord = "", category = "";
let currentRow = 0, currentCol = 0, guesses = ["", "", "", "", "", ""];

const keys = [
    ['Q','W','E','R','T','Y','U','I','O','P'],
    ['A','S','D','F','G','H','J','K','L','Ñ'],
    ['ENVIAR','Z','X','C','V','B','N','M','BORRAR']
];

window.addEventListener('keydown', (event) => {
    if (document.getElementById('screen-game').style.display !== 'block') return;
    const key = event.key.toUpperCase();
    if (key === 'BACKSPACE') {
        event.preventDefault();
        handleKey('BORRAR');
    } else if (key === 'ENTER') {
        event.preventDefault();
        handleKey('ENVIAR');
    } else if (/^[A-ZÑ]$/.test(key)) {
        event.preventDefault();
        handleKey(key);
    }
});

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    document.getElementById(id).style.display = 'block';
}

function startSolo() {
    myName = document.getElementById('username').value.trim();
    if (!myName) return alert("Escribe tu nombre");
    prepareSoloGame();
}

function prepareSoloGame() {
    const soloWords = [{word: "MESSI", cat: "LEYENDAS"}, {word: "ARSENAL", cat: "CLUB"}];
    const picked = soloWords[Math.floor(Math.random() * soloWords.length)];
    targetWord = picked.word; category = picked.cat;
    resetGameState();
    showScreen('screen-game'); initGame();
}

function resetGameState() {
    currentRow = 0;
    currentCol = 0;
    guesses = ["", "", "", "", "", ""];
}

function playAgain() {
    if (currentRoom) {
        resetGameState();
        showScreen('screen-lobby');
    } else {
        prepareSoloGame();
    }
}

function createRoom() {
    myName = document.getElementById('username').value.trim();
    if (!myName) return alert("Escribe tu nombre");
    socket.emit('createRoom', myName);
}

function joinRoom() {
    myName = document.getElementById('username').value.trim();
    const code = document.getElementById('roomInput').value.trim().toUpperCase();
    if (!myName || !code) return alert("Datos incompletos");
    socket.emit('joinRoom', { name: myName, roomCode: code });
}

function startGame() { socket.emit('startGame', currentRoom); }

socket.on('roomCreated', (data) => {
    currentRoom = data.roomCode; targetWord = data.gameData.word; category = data.gameData.cat;
    document.getElementById('display-code').innerText = data.roomCode;
    document.getElementById('start-btn').style.display = 'block';
    showScreen('screen-lobby');
});

socket.on('playerJoined', (data) => {
    targetWord = data.gameData.word; category = data.gameData.cat;
    showScreen('screen-lobby');
    document.getElementById('player-list').innerHTML = data.players.map(p => `<li>${p.name}</li>`).join('');
});

socket.on('gameStarted', (data) => {
    if (data) {
        targetWord = data.word;
        category = data.cat;
    }
    resetGameState();
    showScreen('screen-game'); initGame();
});

socket.on('gameOver', (winner) => {
    document.getElementById('winner-text').innerText = "¡GANÓ " + winner.toUpperCase() + "!";
    showScreen('screen-result');
});

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

function updateKeyboardKey(key, status) {
    const keyButton = document.getElementById(`key-${key}`);
    if (!keyButton) return;
    const priority = { correct: 3, present: 2, absent: 1 };
    const currentStatus = keyButton.dataset.status;
    if (currentStatus && priority[currentStatus] >= priority[status]) return;
    keyButton.dataset.status = status;
    keyButton.classList.remove('correct', 'present', 'absent');
    keyButton.classList.add(status);
}

function handleKey(key) {
    if (key === 'BORRAR') {
        if (currentCol > 0) {
            currentCol--;
            const idx = (currentRow * targetWord.length) + currentCol;
            document.getElementById(`cell-${idx}`).innerText = "";
            guesses[currentRow] = guesses[currentRow].slice(0, -1);
        }
    } else if (key === 'ENVIAR') {
        if (guesses[currentRow].length === targetWord.length) submitGuess();
    } else if (guesses[currentRow].length < targetWord.length && key.length === 1) {
        const idx = (currentRow * targetWord.length) + currentCol;
        document.getElementById(`cell-${idx}`).innerText = key;
        guesses[currentRow] += key; currentCol++;
    }
}

function submitGuess() {
    const guess = guesses[currentRow];
    const startIdx = currentRow * targetWord.length;
    for (let i = 0; i < targetWord.length; i++) {
        const cell = document.getElementById(`cell-${startIdx + i}`);
        const status = guess[i] === targetWord[i]
            ? 'correct'
            : (targetWord.includes(guess[i]) ? 'present' : 'absent');
        cell.classList.add(status);
        updateKeyboardKey(guess[i], status);
    }
    if (guess === targetWord) {
        if(currentRoom) socket.emit('finished', { roomCode: currentRoom, name: myName });
        else { document.getElementById('winner-text').innerText = "¡GANASTE!"; showScreen('screen-result'); }
    } else {
        currentRow++; currentCol = 0;
        if (currentRow === 6) {
            document.getElementById('winner-text').innerText = "PERDISTE. ERA: " + targetWord;
            showScreen('screen-result');
        }
    }
}