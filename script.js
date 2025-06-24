const gameArea = document.getElementById('gameArea');
const player = document.getElementById('player');
const scoreDisplay = document.getElementById('score');
const livesDisplay = document.getElementById('lives');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreDisplay = document.getElementById('finalScore');
const restartButton = document.getElementById('restartButton');
const startScreen = document.getElementById('startScreen');
const startButton = document.getElementById('startButton');

// Pengaturan Game
const GAME_WIDTH = gameArea.offsetWidth;
const GAME_HEIGHT = gameArea.offsetHeight;
const PLAYER_WIDTH = player.offsetWidth;
const PLAYER_HEIGHT = player.offsetHeight;

let playerScore = 0;
let playerLives = 3;
let playerX = (GAME_WIDTH - PLAYER_WIDTH) / 2; // Posisi X awal pemain (tengah)
let fallingObjects = []; // Array untuk menyimpan objek yang jatuh
let gameInterval; // Interval untuk update game
let objectCreationInterval; // Interval untuk membuat objek baru
let fallSpeed = 2; // Kecepatan jatuh awal
const MAX_FALL_SPEED = 8;
const MIN_OBJECT_INTERVAL = 500; // Interval minimum pembuatan objek (ms)
const MAX_OBJECT_INTERVAL = 1500; // Interval maksimum pembuatan objek (ms)

let gameActive = false; // Status game

// --- Fungsi Inisialisasi dan Reset Game ---
function initializeGame() {
    playerScore = 0;
    playerLives = 3;
    playerX = (GAME_WIDTH - PLAYER_WIDTH) / 2; // Reset posisi pemain
    player.style.left = playerX + 'px'; // Aplikasikan posisi
    scoreDisplay.textContent = playerScore;
    livesDisplay.textContent = playerLives;
    fallingObjects.forEach(obj => obj.element.remove()); // Hapus semua objek lama
    fallingObjects = [];
    fallSpeed = 2; // Reset kecepatan jatuh
    gameActive = true;
    gameOverScreen.style.display = 'none';
    startScreen.style.display = 'none';

    startGameLoop(); // Mulai game loop
    startObjectCreation(); // Mulai membuat objek
}

function startGameLoop() {
    gameInterval = setInterval(updateGame, 1000 / 60); // Sekitar 60 FPS
}

function startObjectCreation() {
    objectCreationInterval = setInterval(createFallingObject, getRandomObjectCreationInterval());
}

function getRandomObjectCreationInterval() {
    return Math.random() * (MAX_OBJECT_INTERVAL - MIN_OBJECT_INTERVAL) + MIN_OBJECT_INTERVAL;
}

// --- Pergerakan Pemain (MENDUKUNG MOUSE & SENTUH) ---

// Fungsi untuk mengupdate posisi pemain berdasarkan koordinat X
function updatePlayerPosition(clientX) {
    if (!gameActive) return;

    // Dapatkan posisi X kursor/sentuhan relatif terhadap gameArea
    const areaRect = gameArea.getBoundingClientRect();
    const touchX = clientX - areaRect.left;

    // Atur posisi X pemain agar keranjang bergerak mengikuti kursor/jari
    let newPlayerX = touchX - (PLAYER_WIDTH / 2);

    // Batasi pergerakan pemain agar tidak keluar dari batas kiri atau kanan
    newPlayerX = Math.max(0, newPlayerX);
    newPlayerX = Math.min(GAME_WIDTH - PLAYER_WIDTH, newPlayerX);

    player.style.left = newPlayerX + 'px';
    playerX = newPlayerX; // Update playerX untuk deteksi tabrakan
}

// Event untuk Mouse (di desktop/laptop)
gameArea.addEventListener('mousemove', (e) => {
    updatePlayerPosition(e.clientX);
});

// Event untuk Sentuhan (di HP/tablet)
gameArea.addEventListener('touchmove', (e) => {
    e.preventDefault(); // Mencegah scrolling default pada browser HP saat menyentuh
    if (e.touches.length > 0) {
        updatePlayerPosition(e.touches[0].clientX);
    }
}, { passive: false }); // Gunakan { passive: false } untuk memastikan preventDefault() bekerja


// --- Objek Jatuh ---
function createFallingObject() {
    const object = document.createElement('div');
    object.classList.add('falling-object');
    object.style.left = Math.random() * (GAME_WIDTH - 25) + 'px';
    object.style.top = '0px';

    gameArea.appendChild(object);
    fallingObjects.push({
        element: object,
        y: 0,
        x: parseInt(object.style.left),
        speed: fallSpeed + (Math.random() * 1)
    });

    if (fallSpeed < MAX_FALL_SPEED) {
        fallSpeed += 0.05;
    }
    clearInterval(objectCreationInterval);
    objectCreationInterval = setInterval(createFallingObject, getRandomObjectCreationInterval());
}

// --- Update Game (Game Loop) ---
function updateGame() {
    if (!gameActive) return;

    for (let i = fallingObjects.length - 1; i >= 0; i--) {
        const obj = fallingObjects[i];
        obj.y += obj.speed;
        obj.element.style.top = obj.y + 'px';

        // Deteksi tabrakan
        const playerTop = player.offsetTop;
        const playerBottom = playerTop + PLAYER_HEIGHT;
        const playerLeft = playerX; // Gunakan playerX yang diupdate dari mouse/touch
        const playerRight = playerLeft + PLAYER_WIDTH;

        const objectTop = obj.y;
        const objectBottom = obj.y + obj.element.offsetHeight;
        const objectLeft = obj.x;
        const objectRight = obj.x + obj.element.offsetWidth;

        if (objectBottom >= playerTop &&
            objectTop <= playerBottom &&
            objectRight >= playerLeft &&
            objectLeft <= playerRight) {
            // Objek tertangkap
            playerScore += 10;
            scoreDisplay.textContent = playerScore;
            obj.element.remove();
            fallingObjects.splice(i, 1);
        }
        // Jika objek jatuh melewati batas bawah
        else if (obj.y > GAME_HEIGHT) {
            playerLives--;
            livesDisplay.textContent = playerLives;
            obj.element.remove();
            fallingObjects.splice(i, 1);

            if (playerLives <= 0) {
                endGame();
            }
        }
    }
}

// --- Akhiri Game ---
function endGame() {
    gameActive = false;
    clearInterval(gameInterval);
    clearInterval(objectCreationInterval);
    finalScoreDisplay.textContent = playerScore;
    gameOverScreen.style.display = 'flex';
}

// --- Event Listener Tombol ---
startButton.addEventListener('click', initializeGame);
restartButton.addEventListener('click', initializeGame);

// Tampilkan layar awal saat pertama kali dimuat
window.onload = () => {
    startScreen.style.display = 'flex';
};
