const gameArea = document.getElementById('gameArea');
const player = document.getElementById('player');
const scoreDisplay = document.getElementById('score');
const livesDisplay = document.getElementById('lives');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreDisplay = document.getElementById('finalScore');
const restartButton = document.getElementById('restartButton');
const startScreen = document.getElementById('startScreen');
const startButton = document.getElementById('startButton');
const recipeDisplay = document.getElementById('recipeDisplay');
const currentRecipeNameDisplay = document.getElementById('currentRecipeName');
const ingredientsListDisplay = document.getElementById('ingredientsList');
const mealCompleteScreen = document.getElementById('mealCompleteScreen');
const nextLevelButton = document.getElementById('nextLevelButton');
const finalMealVisual = document.getElementById('finalMealVisual');

// Deklarasikan variabel dimensi sebagai 'let' agar bisa di-update
let GAME_WIDTH;
let GAME_HEIGHT;
let PLAYER_WIDTH;
let PLAYER_HEIGHT;

let playerScore = 0;
let playerLives = 3;
let playerX;
let fallingObjects = [];
let gameInterval;
let objectCreationInterval;
let fallSpeed = 2;
const MAX_FALL_SPEED = 8;
const MIN_OBJECT_INTERVAL = 500;
const MAX_OBJECT_INTERVAL = 1500;

let gameActive = false;
let currentRecipe = null;
let collectedIngredients = {}; // Untuk melacak bahan yang sudah terkumpul
let recipes = [ // Daftar resep mie
    {
        name: "Mie Kuah Merah",
        ingredients: {
            "Noodle": { count: 1, color: "#ffc107" },
            "Broth": { count: 1, color: "#a0522d" },
            "Chili": { count: 1, color: "#dc3545" }
        }
    },
    {
        name: "Mie Hijau Bakso",
        ingredients: {
            "Noodle": { count: 1, color: "#ffc107" },
            "Meatball": { count: 2, color: "#6c757d" },
            "Greens": { count: 1, color: "#28a745" }
        }
    },
    {
        name: "Mie Telur Spesial",
        ingredients: {
            "Noodle": { count: 1, color: "#ffc107" },
            "Egg": { count: 1, color: "#f8f9fa" },
            "Broth": { count: 1, color: "#a0522d" }
        }
    }
    // Tambahkan resep lain di sini jika ada
];
let currentRecipeIndex = 0; // Melacak resep saat ini

// Definisi jenis objek yang akan jatuh
const OBJECT_TYPES = [
    { name: "Noodle", cssClass: "object-noodle", value: 10 },
    { name: "Broth", cssClass: "object-broth", value: 10 },
    { name: "Chili", cssClass: "object-chili", value: 10 },
    { name: "Egg", cssClass: "object-egg", value: 10 },
    { name: "Meatball", cssClass: "object-meatball", value: 10 },
    { name: "Greens", cssClass: "object-greens", value: 10 }
];


// --- FUNGSI UNTUK MENGUPDATE DIMENSI GAME AREA DAN PLAYER ---
function updateDimensions() {
    GAME_WIDTH = gameArea.offsetWidth;
    GAME_HEIGHT = gameArea.offsetHeight;
    PLAYER_WIDTH = player.offsetWidth;
    PLAYER_HEIGHT = player.offsetHeight;

    if (typeof playerX === 'undefined' || isNaN(playerX)) {
        playerX = (GAME_WIDTH - PLAYER_WIDTH) / 2;
    } else {
        playerX = Math.min(Math.max(0, playerX), GAME_WIDTH - PLAYER_WIDTH);
    }
    player.style.left = playerX + 'px';
}

window.addEventListener('resize', updateDimensions);

// --- Fungsi Inisialisasi dan Reset Game ---
// Parameter `resetProgress` digunakan untuk menentukan apakah progres (skor, nyawa, resep) harus direset total
function initializeGame(resetProgress = false) {
    updateDimensions();

    // Hanya reset skor dan nyawa jika ini awal game baru atau restart penuh
    if (resetProgress) {
        playerScore = 0;
        playerLives = 3;
        currentRecipeIndex = 0; // Reset ke resep pertama
    }
    // Jika tidak resetProgress, skor, nyawa, dan currentRecipeIndex akan dipertahankan

    scoreDisplay.textContent = playerScore;
    livesDisplay.textContent = playerLives;

    // Selalu hapus objek yang jatuh dan reset fallSpeed saat game diinisialisasi untuk resep baru
    fallingObjects.forEach(obj => obj.element.remove());
    fallingObjects = [];
    fallSpeed = 2; // Kecepatan jatuh juga direset untuk setiap resep baru/game baru

    gameActive = true;
    gameOverScreen.style.display = 'none';
    startScreen.style.display = 'none';
    mealCompleteScreen.style.display = 'none'; // Sembunyikan layar selesai masak

    loadRecipe(); // Muat resep berdasarkan currentRecipeIndex
    startGameLoop();
    startObjectCreation();
}

function loadRecipe() {
    if (currentRecipeIndex >= recipes.length) {
        // Semua resep selesai, tampilkan layar kemenangan akhir
        endGame(true); // Kirim parameter untuk menandakan game selesai dengan sukses
        return;
    }
    currentRecipe = recipes[currentRecipeIndex];
    collectedIngredients = {}; // Reset bahan terkumpul untuk resep baru

    currentRecipeNameDisplay.textContent = currentRecipe.name;
    ingredientsListDisplay.innerHTML = ''; // Kosongkan daftar sebelumnya

    for (const ingName in currentRecipe.ingredients) {
        const requiredCount = currentRecipe.ingredients[ingName].count;
        collectedIngredients[ingName] = 0; // Inisialisasi jumlah terkumpul
        const listItem = document.createElement('li');
        listItem.id = `ingredient-${ingName}`;
        listItem.textContent = `${ingName} (0/${requiredCount})`;
        ingredientsListDisplay.appendChild(listItem);
    }
}

function updateIngredientDisplay(ingredientName) {
    const listItem = document.getElementById(`ingredient-${ingredientName}`);
    if (listItem) {
        const requiredCount = currentRecipe.ingredients[ingredientName].count;
        listItem.textContent = `${ingredientName} (${collectedIngredients[ingredientName]}/${requiredCount})`;
        if (collectedIngredients[ingredientName] >= requiredCount) {
            listItem.classList.add('collected');
        } else {
            listItem.classList.remove('collected');
        }
    }
}

function checkRecipeCompletion() {
    for (const ingName in currentRecipe.ingredients) {
        if (collectedIngredients[ingName] < currentRecipe.ingredients[ingName].count) {
            return false; // Ada bahan yang belum cukup
        }
    }
    return true; // Semua bahan sudah terkumpul
}

function displayMealComplete() {
    gameActive = false;
    clearInterval(gameInterval);
    clearInterval(objectCreationInterval);

    mealCompleteScreen.style.display = 'flex';
    finalMealVisual.innerHTML = ''; // Bersihkan visual sebelumnya

    // Buat lapisan warna berdasarkan bahan yang terkumpul di resep ini
    // Menggunakan Object.keys untuk memastikan urutan konsisten atau sesuai definisi
    const ingredientNamesInRecipe = Object.keys(currentRecipe.ingredients);
    let zIndexCounter = 0;
    for (const ingName of ingredientNamesInRecipe) {
        // Pastikan bahan memiliki definisi warna di resep
        if (currentRecipe.ingredients[ingName] && currentRecipe.ingredients[ingName].color) {
            const colorLayer = document.createElement('div');
            colorLayer.classList.add('meal-color-layer');
            colorLayer.style.backgroundColor = currentRecipe.ingredients[ingName].color;
            // Atur z-index agar lapisan warna menumpuk dengan baik
            colorLayer.style.zIndex = zIndexCounter++;
            finalMealVisual.appendChild(colorLayer);
        }
    }
    finalMealVisual.textContent = currentRecipe.name; // Tampilkan nama mie di tengah
}


function startGameLoop() {
    clearInterval(gameInterval);
    gameInterval = setInterval(updateGame, 1000 / 60);
}

function startObjectCreation() {
    clearInterval(objectCreationInterval);
    objectCreationInterval = setInterval(createFallingObject, getRandomObjectCreationInterval());
}

function getRandomObjectCreationInterval() {
    // Sesuaikan interval berdasarkan kesulitan atau resep yang sedang berjalan
    return Math.random() * (MAX_OBJECT_INTERVAL - MIN_OBJECT_INTERVAL) + MIN_OBJECT_INTERVAL;
}

// --- Pergerakan Pemain (MENDUKUNG MOUSE & SENTUH) ---
function updatePlayerPosition(clientX) {
    if (!gameActive) return;

    const areaRect = gameArea.getBoundingClientRect();
    const touchX = clientX - areaRect.left;

    let newPlayerX = touchX - (PLAYER_WIDTH / 2);

    newPlayerX = Math.max(0, newPlayerX);
    newPlayerX = Math.min(GAME_WIDTH - PLAYER_WIDTH, newPlayerX);

    player.style.left = newPlayerX + 'px';
    playerX = newPlayerX;
}

gameArea.addEventListener('mousemove', (e) => {
    updatePlayerPosition(e.clientX);
});

gameArea.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (e.touches.length > 0) {
        updatePlayerPosition(e.touches[0].clientX);
    }
}, { passive: false });

// --- Objek Jatuh ---
function createFallingObject() {
    const object = document.createElement('div');
    let randomType;

    // --- PRIORITAS BAHAN RESEP YANG DIBUTUHKAN ---
    const requiredButNotCollected = [];
    for (const ingName in currentRecipe.ingredients) {
        if (collectedIngredients[ingName] < currentRecipe.ingredients[ingName].count) {
            // Temukan definisi objek dari OBJECT_TYPES berdasarkan nama bahan resep
            const objDef = OBJECT_TYPES.find(obj => obj.name === ingName);
            if (objDef) {
                requiredButNotCollected.push(objDef);
            }
        }
    }

    // Jika ada bahan resep yang belum terkumpul, berikan prioritas untuk muncul
    if (requiredButNotCollected.length > 0) {
        // Misalnya: 70% kemungkinan bahan resep, 30% kemungkinan bahan lain
        if (Math.random() < 0.7) { // Sesuaikan probabilitas ini (0.7 = 70%)
            randomType = requiredButNotCollected[Math.floor(Math.random() * requiredButNotCollected.length)];
        } else {
            // Jika tidak, pilih dari semua jenis objek
            randomType = OBJECT_TYPES[Math.floor(Math.random() * OBJECT_TYPES.length)];
        }
    } else {
        // Jika semua bahan resep sudah terkumpul (misal, menunggu transisi ke MealComplete),
        // atau jika tidak ada bahan yang dibutuhkan sama sekali (kasus jarang),
        // pilih acak dari semua jenis
        randomType = OBJECT_TYPES[Math.floor(Math.random() * OBJECT_TYPES.length)];
    }
    // --- AKHIR PRIORITAS BAHAN RESEP ---

    object.classList.add('falling-object', randomType.cssClass);
    object.textContent = randomType.name; // Tampilkan nama bahan di objek

    const FALLING_OBJECT_WIDTH_EST = 25; // Dari CSS max-width: 25px
    const objectWidth = FALLING_OBJECT_WIDTH_EST;

    object.style.left = Math.random() * (GAME_WIDTH - objectWidth) + 'px';
    object.style.top = '0px';

    gameArea.appendChild(object);
    fallingObjects.push({
        element: object,
        y: 0,
        x: parseInt(object.style.left),
        speed: fallSpeed + (Math.random() * 1),
        type: randomType.name // Simpan jenis objek
    });

    if (fallSpeed < MAX_FALL_SPEED) {
        fallSpeed += 0.05;
    }
}

// --- Update Game (Game Loop) ---
function updateGame() {
    if (!gameActive) return;

    for (let i = fallingObjects.length - 1; i >= 0; i--) {
        const obj = fallingObjects[i];
        obj.y += obj.speed;
        obj.element.style.top = obj.y + 'px';

        const playerTop = player.offsetTop;
        const playerBottom = playerTop + PLAYER_HEIGHT;
        const playerLeft = playerX;
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
            const objectType = obj.type;

            // Cek apakah objek ini adalah bahan yang dibutuhkan resep DAN belum terkumpul penuh
            if (currentRecipe.ingredients[objectType] && collectedIngredients[objectType] < currentRecipe.ingredients[objectType].count) {
                // Tangkap bahan yang benar untuk resep
                collectedIngredients[objectType]++;
                playerScore += 10;
                updateIngredientDisplay(objectType);
                if (checkRecipeCompletion()) {
                    playerScore += 50; // Bonus menyelesaikan resep
                    displayMealComplete(); // Tampilkan layar mie jadi
                }
            } else {
                // Tangkap bahan yang salah atau sudah kebanyakan
                // Hukuman untuk menangkap objek salah
                playerLives--;
                // Anda bisa menambahkan feedback visual/suara di sini untuk salah tangkap
            }
            scoreDisplay.textContent = playerScore;
            livesDisplay.textContent = playerLives;
            obj.element.remove();
            fallingObjects.splice(i, 1);

            if (playerLives <= 0) {
                endGame();
            }
        } else if (obj.y > GAME_HEIGHT) {
            // Objek jatuh melewati batas bawah
            // Hanya kurangi nyawa jika objek yang jatuh adalah bahan yang dibutuhkan resep DAN belum terkumpul penuh
            if (currentRecipe.ingredients[obj.type] && collectedIngredients[obj.type] < currentRecipe.ingredients[obj.type].count) {
                playerLives--; // Kurangi nyawa jika bahan PENTING terlewat
                livesDisplay.textContent = playerLives; // Update display nyawa
                if (playerLives <= 0) {
                    endGame();
                }
            }
            // Objek yang tidak dibutuhkan resep (atau sudah cukup kuantitasnya) hanya dihapus tanpa mengurangi nyawa
            obj.element.remove();
            fallingObjects.splice(i, 1);
        }
    }
}

// --- Akhiri Game ---
function endGame(isSuccess = false) {
    gameActive = false;
    clearInterval(gameInterval);
    clearInterval(objectCreationInterval);
    fallingObjects.forEach(obj => obj.element.remove());

    if (isSuccess && currentRecipeIndex >= recipes.length) {
        // Ini adalah akhir game secara keseluruhan karena semua resep selesai
        gameOverScreen.style.display = 'flex';
        gameOverScreen.querySelector('h2').textContent = 'SELAMAT! KAMU KOKI TERBAIK!';
        gameOverScreen.querySelector('p').textContent = `Semua pesanan mie selesai! Skor Akhir: ${playerScore}`;
        finalScoreDisplay.textContent = playerScore;
        restartButton.textContent = 'Main Lagi';
    } else {
        gameOverScreen.style.display = 'flex';
        gameOverScreen.querySelector('h2').textContent = 'GAME OVER!';
        gameOverScreen.querySelector('p').textContent = `Skor Akhir: ${playerScore}`;
        finalScoreDisplay.textContent = playerScore;
        restartButton.textContent = 'Coba Lagi';
    }
}

// --- Event Listener Tombol ---
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded!'); // Log untuk memastikan DOM sudah dimuat

    if (startButton) {
        startButton.addEventListener('click', () => {
            console.log('Start button clicked!');
            initializeGame(true); // Mulai game dengan RESET TOTAL (skor, nyawa, resep)
        });
    } else {
        console.error('Error: startButton not found!');
    }

    if (restartButton) {
        restartButton.addEventListener('click', () => {
            console.log('Restart button clicked!');
            initializeGame(true); // Restart game dengan RESET TOTAL (skor, nyawa, resep)
        });
    } else {
        console.error('Error: restartButton not found!');
    }

    if (nextLevelButton) {
        nextLevelButton.addEventListener('click', () => {
            console.log('Next Level button clicked!');
            currentRecipeIndex++; // Lanjut ke resep berikutnya
            mealCompleteScreen.style.display = 'none'; // Sembunyikan layar selesai masak
            // Mulai game tanpa mereset skor dan nyawa, tapi reset objek dan kecepatan
            // currentRecipeIndex sudah dinaikkan di baris sebelumnya
            initializeGame(false); // Parameter 'false' agar skor dan nyawa tidak direset
        });
    } else {
        console.error('Error: nextLevelButton not found!');
    }

    // Tampilkan layar awal dan inisialisasi dimensi saat pertama kali dimuat
    startScreen.style.display = 'flex';
    updateDimensions();
});
