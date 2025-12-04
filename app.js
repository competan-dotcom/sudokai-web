// ==========================================
// 🧠 SUDOKAI BEYİN MERKEZİ (v18.0 - ENGINE REBUILD)
// ==========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { 
    getFirestore, collection, doc, getDocs, setDoc, 
    query, orderBy, limit 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDrzD5FkOCsNUFeiuvzeHEjiNvFYc5B0Bo",
  authDomain: "sudokai-ac7be.firebaseapp.com",
  projectId: "sudokai-ac7be",
  storageBucket: "sudokai-ac7be.firebasestorage.app",
  messagingSenderId: "736579043328",
  appId: "1:736579043328:web:f36aed7368da0b474218e5",
  measurementId: "G-GWJELKTEXT"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

// --- GLOBAL DURUM YÖNETİMİ (STATE) ---
let gameData = {
    allPuzzles: [],   // Tüm havuz
    hardPuzzles: [],  // Günlük mod için zorlar
    currentPuzzle: null,
    solution: "",
    timer: 300,
    timerInterval: null,
    isPlaying: false,
    isPaused: false,
    mode: 'tournament' // 'tournament' veya 'daily'
};

let userProgress = JSON.parse(localStorage.getItem('sudokai_user')) || {
    username: "Oyuncu_" + Math.floor(Math.random() * 9999), 
    level: 1, 
    score: 0, 
    dailyQuota: 20,     
    lastPlayedDate: new Date().toDateString(), 
    hasPlayedDailyChallenge: false, 
    dailyBestTime: null 
};

let selectedCell = null;

// --- BAŞLANGIÇ KONTROLLERİ ---
if (!localStorage.getItem('sudokai_user')) {
    let name = prompt("Kullanıcı adın nedir şampiyon?", userProgress.username);
    if(name) userProgress.username = name.toUpperCase().replace(/[^A-Z0-9_]/g, '');
    saveProgress();
}

if (userProgress.lastPlayedDate !== new Date().toDateString()) {
    userProgress.dailyQuota = 20; 
    userProgress.hasPlayedDailyChallenge = false;
    userProgress.dailyBestTime = null; 
    userProgress.lastPlayedDate = new Date().toDateString();
    saveProgress();
}

// --- VERİ YÜKLEME VE İLK KURULUM ---
async function initSystem() {
    updateUI();
    document.querySelector('.user-name').innerText = userProgress.username;
    
    // Butonu pasife al, yükleniyor mesajı ver
    const btn = document.getElementById('main-start-btn');
    if(btn) {
        btn.disabled = true;
        btn.innerText = "SİSTEM HAZIRLANIYOR...";
    }

    // Veriyi çek
    await loadPuzzles();

    // İlk oyunu arkada hazırla (RENDER ETMEDEN DATA HAZIRLA)
    prepareNextGame('tournament');
    
    // Butonu aktife al
    if(btn) {
        btn.disabled = false;
        btn.innerText = "OYUNA BAŞLA ▶";
        btn.onclick = () => window.forceStartGame();
    }
}

async function loadPuzzles() {
    try {
        const res = await fetch('tum_bulmacalar_SIRALI.json');
        if (res.ok) {
            const data = await res.json();
            // Tüm seviyeleri tek havuzda topla (Level mantığı için)
            if(data.tier_1) gameData.allPuzzles.push(...data.tier_1);
            if(data.tier_2) gameData.allPuzzles.push(...data.tier_2);
            if(data.tier_3) gameData.allPuzzles.push(...data.tier_3);
            if(data.tier_4) gameData.allPuzzles.push(...data.tier_4);
            if(data.tier_5) gameData.allPuzzles.push(...data.tier_5);
            
            // Zorları ayır
            if(data.tier_4) gameData.hardPuzzles.push(...data.tier_4);
            if(data.tier_5) gameData.hardPuzzles.push(...data.tier_5);
            console.log("🧩 Bulmacalar yüklendi. Adet:", gameData.allPuzzles.length);
        } else {
            throw new Error("JSON hatası");
        }
    } catch (e) {
        console.warn("⚠️ Veri yüklenemedi, yedekler devrede.");
        // Yedek data ile devam et (Oyun çökmesin)
        gameData.allPuzzles = [getBackupPuzzle(), getBackupPuzzle()];
        gameData.hardPuzzles = [getBackupPuzzle()];
    }
}

// --- OYUN HAZIRLIK (ARKAPLAN) ---
function prepareNextGame(mode) {
    gameData.mode = mode;
    gameData.timer = 300; // Süreyi resetle
    clearInterval(gameData.timerInterval);
    updateTimerDisplay();

    let puzzleToLoad = null;

    if (mode === 'daily') {
        // Günlük Mod Mantığı
        if (gameData.hardPuzzles.length > 0) {
            const today = new Date();
            const dateString = `${today.getFullYear()}${today.getMonth() + 1}${today.getDate()}`;
            let hash = 0;
            for (let i = 0; i < dateString.length; i++) hash = ((hash << 5) - hash) + dateString.charCodeAt(i) | 0;
            const uniqueIndex = Math.abs(hash) % gameData.hardPuzzles.length;
            puzzleToLoad = gameData.hardPuzzles[uniqueIndex];
        } else {
            puzzleToLoad = getBackupPuzzle();
        }
        // Başlık Ayarı
        const startTitle = document.querySelector('#start-overlay div');
        if(startTitle) startTitle.innerText = "GÜNÜN BULMACASI";
        const btn = document.getElementById('main-start-btn');
        if(btn) btn.innerText = "MEYDAN OKU ▶";

    } else {
        // Turnuva Modu Mantığı
        if (gameData.allPuzzles.length > 0) {
            // Level 1 -> Index 0
            let idx = (userProgress.level - 1) % gameData.allPuzzles.length;
            puzzleToLoad = gameData.allPuzzles[idx];
        } else {
            puzzleToLoad = getBackupPuzzle();
        }
        // Başlık Ayarı
        const startTitle = document.querySelector('#start-overlay div');
        if(startTitle) startTitle.innerText = "HAZIR MISIN?";
        const btn = document.getElementById('main-start-btn');
        if(btn) btn.innerText = "OYUNA BAŞLA ▶";
    }

    // Tahtayı Çiz (Görünürde overlay var ama arkada bu çiziliyor)
    renderBoard(puzzleToLoad);
}

function renderBoard(data) {
    if(!data) return;
    gameData.currentPuzzle = data;
    gameData.solution = data.solution;
    
    const board = document.getElementById('sudoku-board');
    if(!board) return;
    board.innerHTML = '';

    for (let i = 0; i < 81; i++) {
        const cell = document.createElement('div'); 
        cell.className = 'cell'; 
        cell.dataset.index = i;
        
        const char = data.puzzle[i];
        if (char !== '.' && char !== '0') { 
            cell.innerText = char; 
            cell.classList.add('initial'); 
        } else { 
            cell.onclick = () => selectGameCell(cell); 
        }
        board.appendChild(cell);
    }
    checkGroups(); // İlk kontrol
}


// --- KULLANICI ETKİLEŞİMLERİ (ACTIONS) ---

// HTML'deki onclick="forceStartGame()" burayı tetikler
window.forceStartGame = function() {
    // Kota Kontrolü (Sadece turnuva için)
    if (gameData.mode === 'tournament' && userProgress.dailyQuota <= 0) {
        alert("Günlük kotan doldu şampiyon! Yarın gel. 🛑");
        return;
    }
    
    // Günlük mod kontrolü
    if (gameData.mode === 'daily' && userProgress.hasPlayedDailyChallenge) {
        alert("Bugünlük görevi zaten tamamladın! 🏆");
        returnToTournament();
        return;
    }

    // Oyunu Başlat
    document.getElementById('start-overlay').style.display = 'none';
    document.querySelectorAll('.overlay-full').forEach(el => el.style.display = 'none');
    
    gameData.isPlaying = true;
    gameData.isPaused = false;
    
    if(gameData.mode === 'tournament') {
        userProgress.dailyQuota--;
        saveProgress();
        updateUI();
    }
    
    startTimer();
};

window.startDailyGame = function() {
    // Günlük moda geçiş yap ve hazırla
    prepareNextGame('daily');
    // Overlay açık kalmalı ki kullanıcı "Meydan Oku"ya basabilsin
    document.getElementById('start-overlay').style.display = 'flex';
    document.getElementById('daily-winners-overlay').style.display = 'none'; // Listeyi kapat
};

window.returnToTournament = function() {
    document.getElementById('win-overlay').style.display = 'none';
    prepareNextGame('tournament');
    document.getElementById('start-overlay').style.display = 'flex';
};

window.nextLevel = function() {
    // Bir sonraki bölüme geç
    document.getElementById('win-overlay').style.display = 'none';
    prepareNextGame('tournament');
    // Otomatik başlatmak yerine kullanıcıyı hazır hissettirip başlatabiliriz
    // Veya direkt başlatabiliriz. Burada butona basmasını bekliyoruz.
    document.getElementById('start-overlay').style.display = 'flex';
};

// --- OYUN MANTIĞI ---

function selectGameCell(cell) {
    if (!gameData.isPlaying || gameData.isPaused) return;
    
    document.querySelectorAll('.cell').forEach(c => c.classList.remove('selected', 'related'));
    cell.classList.add('selected');
    selectedCell = cell;

    // Cross-highlight (Satır ve sütun vurgusu)
    const idx = parseInt(cell.dataset.index); 
    const row = Math.floor(idx / 9); 
    const col = idx % 9;
    document.querySelectorAll('.cell').forEach(c => {
        const cIdx = parseInt(c.dataset.index); 
        const cRow = Math.floor(cIdx / 9); 
        const cCol = cIdx % 9;
        if (cRow === row || cCol === col) c.classList.add('related');
    });
}

window.handleInput = function(val) {
    if (!gameData.isPlaying || gameData.isPaused || !selectedCell) return;
    if (selectedCell.classList.contains('initial') || selectedCell.classList.contains('correct')) return;

    if (val === 'del') {
        selectedCell.innerText = '';
        selectedCell.classList.remove('error');
        checkGroups();
        return;
    }

    selectedCell.innerText = val;
    const idx = parseInt(selectedCell.dataset.index);
    
    // Doğru mu?
    if (String(val) === gameData.solution[idx]) {
        selectedCell.classList.remove('error');
        selectedCell.classList.add('correct');
        checkGroups();
        checkWin();
    } else {
        selectedCell.classList.add('error');
    }
};

function checkGroups() {
    const cells = document.querySelectorAll('.cell'); 
    if(cells.length === 0) return;
    
    // Grupları tanımla (Satır, Sütun, Kutu)
    const groups = [];
    for(let r=0; r<9; r++) { let row = []; for(let c=0; c<9; c++) row.push(r*9+c); groups.push(row); }
    for(let c=0; c<9; c++) { let col = []; for(let r=0; r<9; r++) col.push(r*9+c); groups.push(col); }
    const boxRoots = [0,3,6,27,30,33,54,57,60];
    boxRoots.forEach(root => { let box = []; for(let r=0; r<3; r++) { for(let c=0; c<3; c++) box.push(root + r*9 + c); } groups.push(box); });

    // Temizle
    cells.forEach(c => c.classList.remove('completed-group'));

    // Kontrol et
    groups.forEach(grp => {
        let isFull = true; 
        let isCorrect = true;
        grp.forEach(idx => {
            if (!cells[idx].innerText) isFull = false;
            if (cells[idx].innerText !== gameData.solution[idx]) isCorrect = false;
        });
        
        if (isFull && isCorrect) {
            grp.forEach(idx => cells[idx].classList.add('completed-group'));
        }
    });
}

// --- SAYAÇ (TIMER) ---
function startTimer() {
    if (gameData.timerInterval) clearInterval(gameData.timerInterval);
    
    gameData.timerInterval = setInterval(() => {
        if (!gameData.isPlaying || gameData.isPaused) return;

        gameData.timer--;
        updateTimerDisplay();

        if (gameData.timer <= 0) {
            handleGameOver();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const timerEl = document.querySelector('.timer-val');
    if(!timerEl) return;
    
    let t = gameData.timer < 0 ? 0 : gameData.timer;
    let m = Math.floor(t / 60).toString().padStart(2, '0');
    let s = (t % 60).toString().padStart(2, '0');
    timerEl.innerText = `${m}:${s}`;
}

function handleGameOver() {
    clearInterval(gameData.timerInterval);
    gameData.isPlaying = false;
    alert("SÜRE DOLDU! 😢");
    
    // Başa dön
    prepareNextGame('tournament');
    document.getElementById('start-overlay').style.display = 'flex';
}

// --- KAZANMA DURUMU ---
async function checkWin() {
    const cells = document.querySelectorAll('.cell');
    let isComplete = true;
    cells.forEach((c, i) => { 
        if (c.innerText !== gameData.solution[i]) isComplete = false; 
    });

    if (isComplete) {
        clearInterval(gameData.timerInterval);
        gameData.isPlaying = false;

        const winBtn = document.getElementById('win-action-btn');
        const winTitle = document.querySelector('.win-title');
        const winText = document.querySelector('.win-text');

        if (gameData.mode === 'tournament') {
            // Puanlama: Zorluk (Tier) * 10 + Kalan Süre
            // Mevcut datada 'difficulty' var mı kontrol et, yoksa level bazlı yap
            let basePoints = 100;
            let timeBonus = gameData.timer;
            let totalWin = basePoints + timeBonus;

            userProgress.score += totalWin;
            if (userProgress.level < 500) userProgress.level++;
            
            // Firebase Kayıt
            saveScoreToFirebase(userProgress.username, userProgress.score);

            winTitle.innerText = "HARİKA! 🎉";
            winText.innerText = `Puanın: ${userProgress.score}\n(+${totalWin} Puan)`;
            winBtn.innerText = "SONRAKİ BÖLÜM ▶";
            winBtn.onclick = window.nextLevel;

        } else {
            // Günlük Mod
            userProgress.hasPlayedDailyChallenge = true;
            let timeTaken = 300 - gameData.timer;
            userProgress.dailyBestTime = timeTaken;

            // Firebase Kayıt
            saveDailyScoreToFirebase(userProgress.username, timeTaken);

            winTitle.innerText = "GÜNÜN ŞAMPİYONU! 🏆";
            winText.innerText = `Tamamlama Süresi: ${formatTime(timeTaken)}`;
            winBtn.innerText = "TURNUVAYA DÖN ↩";
            winBtn.onclick = window.returnToTournament;
        }

        saveProgress();
        updateUI();
        document.getElementById('win-overlay').style.display = 'flex';
    }
}

// --- ARAÇLAR & OVERLAY ---

window.resetBoard = function() {
    if(!confirm("Tüm hamleleri silmek istediğine emin misin?")) return;
    document.querySelectorAll('.cell:not(.initial)').forEach(c => {
        c.innerText = '';
        c.className = 'cell'; 
        c.classList.remove('error', 'correct', 'selected', 'related');
    });
    checkGroups();
};

window.closeOverlays = function() {
    document.querySelectorAll('.overlay-full').forEach(el => el.style.display = 'none');
    
    // Eğer oyun başlamamışsa Start ekranı açık kalmalı
    if (!gameData.isPlaying) {
        document.getElementById('start-overlay').style.display = 'flex';
    } else {
        // Oyun devam ediyorsa pause'u kaldır
        gameData.isPaused = false;
    }
};

window.openLeaderboard = async function() {
    gameData.isPaused = true; // Oyunu dondur
    const list = document.getElementById('global-rank-list');
    const countEl = document.getElementById('total-player-count');
    if(countEl) countEl.innerText = "";
    list.innerHTML = '<div style="text-align:center; padding:10px;">Yükleniyor...</div>';
    document.getElementById('leaderboard-overlay').style.display = 'flex';

    try {
        const q = query(collection(db, "leaderboard"), orderBy("score", "desc"), limit(20));
        const querySnapshot = await getDocs(q);
        list.innerHTML = ''; 
        let index = 0;
        querySnapshot.forEach((doc) => {
            let u = doc.data();
            let rankClass = index < 3 ? ['gold','silver','bronze'][index] : '';
            let isMe = u.name === userProgress.username;
            let html = `
                <div class="rank-item" style="${isMe ? 'border:1px solid var(--primary); background:#eff6ff' : ''}">
                    <div class="rank-left">
                        <div class="rank-pos ${rankClass}">${index + 1}</div>
                        <div class="rank-name">${u.name}</div>
                    </div>
                    <div class="rank-score">${u.score} P</div>
                </div>`;
            list.innerHTML += html;
            index++;
        });
    } catch (e) {
        list.innerHTML = '<div style="text-align:center;">Bağlantı hatası.</div>';
    }
};

window.openDailyWinners = async function() {
    gameData.isPaused = true; // Oyunu dondur
    const list = document.getElementById('daily-rank-list');
    list.innerHTML = '<div style="text-align:center; padding:10px;">Yükleniyor...</div>';
    document.getElementById('daily-winners-overlay').style.display = 'flex';
    
    const today = new Date().toISOString().slice(0,10);
    const collectionName = "daily_winners_" + today;

    try {
        const q = query(collection(db, collectionName), orderBy("time", "asc"), limit(20));
        const querySnapshot = await getDocs(q);
        list.innerHTML = ''; 
        let index = 0;
        querySnapshot.forEach((doc) => {
            let u = doc.data();
            let rankClass = index < 3 ? ['gold','silver','bronze'][index] : '';
            let html = `
                <div class="rank-item">
                    <div class="rank-left">
                        <div class="rank-pos ${rankClass}">${index + 1}</div>
                        <div class="rank-name">${u.name}</div>
                    </div>
                    <div class="rank-score">${formatTime(u.time)}</div>
                </div>`;
            list.innerHTML += html;
            index++;
        });
        if(index === 0) list.innerHTML = '<div style="text-align:center; padding:20px;">Bugünün ilk şampiyonu sen ol!</div>';
    } catch (e) {
        list.innerHTML = '<div style="text-align:center;">Henüz veri yok.</div>';
    }
};

// --- YARDIMCI FONKSİYONLAR ---
function updateUI() {
    document.querySelector('.level-val').innerHTML = `${userProgress.level}<span class="level-total">/500</span>`;
    document.querySelector('.quota-val').innerText = `${userProgress.dailyQuota}/20`;
    document.querySelector('.score-val').innerText = userProgress.score;
}

function saveProgress() { localStorage.setItem('sudokai_user', JSON.stringify(userProgress)); }

function getBackupPuzzle() {
    // Veritabanı çekilemezse acil durum camını kır
    return { 
        puzzle: ".4..............3.......97....7...4.....8........2....52.816.9.739245186816......", 
        solution: "348697512297158634165432978952761843471583269683924751524816397739245186816379425" 
    };
}

function formatTime(seconds) {
    let m = Math.floor(seconds / 60).toString().padStart(2, '0');
    let s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

// --- FIREBASE KAYITLARI ---
async function saveScoreToFirebase(name, score) {
    try {
        const userRef = doc(db, "leaderboard", name);
        await setDoc(userRef, { name: name, score: score, lastUpdate: new Date() }, { merge: true });
    } catch (e) { console.error("Skor hatası", e); }
}

async function saveDailyScoreToFirebase(name, timeSeconds) {
    try {
        const today = new Date().toISOString().slice(0,10);
        const collectionName = "daily_winners_" + today;
        const userRef = doc(db, collectionName, name);
        await setDoc(userRef, { name: name, time: timeSeconds });
    } catch (e) { console.error("Günlük skor hatası", e); }
}

// --- SİSTEMİ BAŞLAT ---
window.onload = initSystem;