// ==========================================
<<<<<<< HEAD
// 🧠 SUDOKAI BEYİN MERKEZİ (v17.0 - STABLE FIX)
=======
// 🧠 SUDOKAI BEYİN MERKEZİ (v16.0 - ULTIMATE FIX)
>>>>>>> 96015ae987e29ca1d57fbb66d6d5110a69e7c82c
// ==========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { 
    getFirestore, collection, doc, getDoc, getDocs, setDoc, 
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

// GLOBAL DEĞİŞKENLER
let localPuzzles = [];
let hardPuzzles = [];
let currentGame = {
<<<<<<< HEAD
    solution: "", 
    puzzleStr: "", 
    timer: 300, 
    timerInterval: null,
    isPlaying: false, 
    mode: 'tournament', 
    isReady: false
=======
    solution: "", puzzleStr: "", timer: 300, timerInterval: null,
    isPlaying: false, mode: 'tournament', isReady: false
>>>>>>> 96015ae987e29ca1d57fbb66d6d5110a69e7c82c
};

let userProgress = JSON.parse(localStorage.getItem('sudokai_user')) || {
    username: "Oyuncu_" + Math.floor(Math.random() * 9999), level: 1, score: 0, dailyQuota: 20,     
    lastPlayedDate: new Date().toDateString(), hasPlayedDailyChallenge: false, dailyBestTime: null 
};

<<<<<<< HEAD
let selectedCell = null;

=======
>>>>>>> 96015ae987e29ca1d57fbb66d6d5110a69e7c82c
// İsim Kontrolü
if (!localStorage.getItem('sudokai_user')) {
    let name = prompt("Kullanıcı adın nedir şampiyon?", userProgress.username);
    if(name) userProgress.username = name.toUpperCase().replace(/[^A-Z0-9_]/g, '');
    saveProgress();
}

// Tarih ve Kota Sıfırlama
if (userProgress.lastPlayedDate !== new Date().toDateString()) {
    userProgress.dailyQuota = 20; userProgress.hasPlayedDailyChallenge = false;
    userProgress.dailyBestTime = null; userProgress.lastPlayedDate = new Date().toDateString();
    saveProgress();
}

<<<<<<< HEAD
=======
let selectedCell = null;

>>>>>>> 96015ae987e29ca1d57fbb66d6d5110a69e7c82c
// Verileri Yükle
async function loadBackupData() {
    if(localPuzzles.length > 0) return true;
    try {
        const res = await fetch('tum_bulmacalar_SIRALI.json');
        if (res.ok) {
            const data = await res.json();
            if(data.tier_1) localPuzzles = localPuzzles.concat(data.tier_1);
            if(data.tier_2) localPuzzles = localPuzzles.concat(data.tier_2);
            if(data.tier_3) localPuzzles = localPuzzles.concat(data.tier_3);
            if(data.tier_4) localPuzzles = localPuzzles.concat(data.tier_4);
            if(data.tier_5) localPuzzles = localPuzzles.concat(data.tier_5);
<<<<<<< HEAD
            if(data.tier_4) hardPuzzles = hardPuzzles.concat(data.tier_4); // Zorları ayrıca tut
            if(data.tier_5) hardPuzzles = hardPuzzles.concat(data.tier_5);
            console.log("Veriler yüklendi.");
            enableStartButton(); // Veri gelince butonu aç
            return true;
        }
    } catch (e) { 
        console.warn("JSON Yedeği yüklenemedi."); 
        enableStartButton(); // Hata olsa bile butonu aç (backup çalışsın)
        return false; 
    }
}

// Butonu Aktif Etme Fonksiyonu
function enableStartButton() {
    const btn = document.getElementById('main-start-btn');
    if (btn) {
        btn.disabled = false;
        btn.innerText = "OYUNA BAŞLA ▶";
        btn.style.opacity = "1";
        btn.style.cursor = "pointer";
    }
}

// Başlangıç
loadBackupData();
=======
            if(data.tier_4) hardPuzzles = hardPuzzles.concat(data.tier_4);
            if(data.tier_5) hardPuzzles = hardPuzzles.concat(data.tier_5);
            console.log("Veriler yüklendi.");
            return true;
        }
    } catch (e) { console.warn("JSON Yedeği yüklenemedi."); return false; }
}
// Arka planda başlat
loadBackupData();

>>>>>>> 96015ae987e29ca1d57fbb66d6d5110a69e7c82c
window.onload = () => {
    updateUI();
    document.querySelector('.user-name').innerText = userProgress.username;
    document.getElementById('start-overlay').style.display = 'flex';
    currentGame.isPlaying = false;
};

// ==================================================================
<<<<<<< HEAD
// 🎮 OYUN BAŞLATMA MANTIĞI (DÜZELTİLDİ)
// ==================================================================

// 1. TURNUVA MODU
window.startTournamentGame = async function() {
    // Önceki sayaçları kesin temizle
    stopTimer();

    // Devam etme durumu (Pause'dan dönüş)
    if (currentGame.isReady && currentGame.mode === 'tournament' && !currentGame.isPlaying && currentGame.timer > 0) {
=======
// 🎮 OYUN BAŞLATMA (DÜZELTİLMİŞ AKIŞ)
// ==================================================================

window.startTournamentGame = async function() {
    // 1. Oyun zaten duraklatılmışsa devam et (Kota düşme!)
    if (currentGame.isReady && currentGame.mode === 'tournament' && !currentGame.isPlaying) {
>>>>>>> 96015ae987e29ca1d57fbb66d6d5110a69e7c82c
        resumeGame();
        return;
    }

<<<<<<< HEAD
    // Yeni oyun başlatma durumu
=======
    // 2. Kota Kontrolü
>>>>>>> 96015ae987e29ca1d57fbb66d6d5110a69e7c82c
    if (userProgress.dailyQuota <= 0) {
        alert("Günlük Turnuva kotan doldu! Yarın gel. 🛑");
        return;
    }

<<<<<<< HEAD
    // Veri yoksa bekleme
    if (localPuzzles.length === 0) {
        const loaded = await loadBackupData();
        if(!loaded && localPuzzles.length === 0) {
             // Hiç veri yoksa backup kullan
        }
    }

    // Bulmaca Seçimi
=======
    // 3. Veri Kontrolü (Yoksa bekle)
    if (localPuzzles.length === 0) {
        console.log("Veri bekleniyor...");
        await loadBackupData();
    }

    // 4. Bulmacayı Seç
>>>>>>> 96015ae987e29ca1d57fbb66d6d5110a69e7c82c
    let puzzleData = null;
    if (localPuzzles.length > 0) {
        let idx = (userProgress.level - 1) % localPuzzles.length;
        puzzleData = localPuzzles[idx];
    } else {
<<<<<<< HEAD
        puzzleData = getBackupPuzzle();
    }

    // Tahtayı Kur
    const isBoardSetup = setupBoard(puzzleData);

    if (isBoardSetup) {
        closeOverlays();
=======
        // Veri kesinlikle yoksa YEDEK kullan
        puzzleData = getBackupPuzzle();
    }

    // 5. Tahtayı Kurmayı Dene
    const isBoardSetup = setupBoard(puzzleData);

    // 6. KRİTİK: Sadece Tahta Kurulduysa Başlat
    if (isBoardSetup) {
        closeOverlays();
        
        // Kotayı SADECE burada düşürüyoruz
>>>>>>> 96015ae987e29ca1d57fbb66d6d5110a69e7c82c
        userProgress.dailyQuota--; 
        saveProgress();
        updateUI();
        
        currentGame.mode = 'tournament';
<<<<<<< HEAD
        resumeGame();
    } else {
        alert("Oyun yüklenirken bir hata oluştu. Sayfayı yenile.");
    }
};

// 2. GÜNLÜK MOD
window.startDailyGame = async function() {
    stopTimer(); // Sayaçları durdur

    if (userProgress.hasPlayedDailyChallenge) { 
        alert("Bugünlük görevi tamamladın! 🏆"); 
        return; 
    }

=======
        resumeGame(); // Sayacı başlat
    } else {
        alert("Oyun yüklenirken bir hata oluştu. Lütfen sayfayı yenile.");
    }
};

window.startDailyGame = async function() {
    if (userProgress.hasPlayedDailyChallenge) { alert("Bugünlük görevi tamamladın! 🏆"); return; }
>>>>>>> 96015ae987e29ca1d57fbb66d6d5110a69e7c82c
    if (hardPuzzles.length === 0) await loadBackupData();

    let puzzleData = null;
    if (hardPuzzles.length > 0) {
        const today = new Date();
        const dateString = `${today.getFullYear()}${today.getMonth() + 1}${today.getDate()}`;
        let hash = 0;
        for (let i = 0; i < dateString.length; i++) hash = ((hash << 5) - hash) + dateString.charCodeAt(i) | 0;
        const uniqueIndex = Math.abs(hash) % hardPuzzles.length;
        puzzleData = hardPuzzles[uniqueIndex];
    } else {
        puzzleData = getBackupPuzzle();
    }
    
    if (setupBoard(puzzleData)) {
        currentGame.mode = 'daily';
<<<<<<< HEAD
        currentGame.isPlaying = false; // Hemen başlatma, kullanıcı "Başla" demeli
        
        // Arayüzü Günlük Mod için hazırla
        const startTitle = document.querySelector('#start-overlay div');
        if(startTitle) startTitle.innerText = "GÜNÜN BULMACASI";
        
        const startBtn = document.getElementById('main-start-btn');
        if(startBtn) {
            startBtn.innerText = "MEYDAN OKU ▶";
            startBtn.onclick = function() { // Butonun işlevini geçici değiştir
                resumeGame();
                // Butonu eski haline getirmek için resetlemek gerekebilir ama 
                // sayfa yenilenmeden mod değişimi kontrollü olmalı.
                this.onclick = window.forceStartGame; 
            };
        }

        document.getElementById('start-overlay').style.display = 'flex';
        closeOverlays(); // Diğer overlayleri kapat ama start-overlay açık kalsın
=======
        currentGame.isPlaying = false; // Hemen başlatma
        if(currentGame.timerInterval) clearInterval(currentGame.timerInterval);
        
        const startTitle = document.querySelector('#start-overlay div');
        if(startTitle) startTitle.innerText = "GÜNÜN BULMACASI";
        
        document.getElementById('start-overlay').style.display = 'flex';
        closeOverlays();
>>>>>>> 96015ae987e29ca1d57fbb66d6d5110a69e7c82c
        document.getElementById('start-overlay').style.display = 'flex';
    }
};

<<<<<<< HEAD
// Oyunu ve Sayacı Başlatma
=======
>>>>>>> 96015ae987e29ca1d57fbb66d6d5110a69e7c82c
function resumeGame() {
    document.getElementById('start-overlay').style.display = 'none';
    closeOverlays();
    currentGame.isPlaying = true;
    startTimer();
}

<<<<<<< HEAD
function stopTimer() {
    if (currentGame.timerInterval) {
        clearInterval(currentGame.timerInterval);
        currentGame.timerInterval = null;
    }
    currentGame.isPlaying = false;
}

// Yedek Bulmaca
function getBackupPuzzle() {
    const backups = [
        { puzzle: ".4..............3.......97....7...4.....8........2....52.816.9.739245186816......", solution: "348697512297158634165432978952761843471583269683924751524816397739245186816379425" },
        { puzzle: "6...4..1....9..27.....7..3691.7..3..54.3.....783...............2..4...6.1..8.7..3", solution: "657243819431968275829175436912786354546312798783594621374659182298431567165827943" }
    ];
    return backups[Math.floor(Math.random() * backups.length)];
=======
// 🛡️ TIER 5 (INSANE) YEDEK PAKETİ
function getBackupPuzzle() {
    const backups = [
        { puzzle: ".4..............3.......97....7...4.....8........2....52.816.9.739245186816......", solution: "348697512297158634165432978952761843471583269683924751524816397739245186816379425" },
        { puzzle: ".....52..........45......7..5......7..75......4.6....54.81....3315..8746...453...", solution: "136745289729816354584329671251934867967581432843672195498167523315298746672453918" },
        { puzzle: "...2.96.53.7......2.6...1...3.784...76.95..4.94....5....36.57.8..................", solution: "814239675357816429296547183135784296762953841948162537423695718571328964689471352" },
        { puzzle: "6....5..9....21........4....5...........47.....4......816453297....8.1.6492..6...", solution: "621735489549821673378964512257318964963547821184692735816453297735289146492176358" },
        { puzzle: "6...4..1....9..27.....7..3691.7..3..54.3.....783...............2..4...6.1..8.7..3", solution: "657243819431968275829175436912786354546312798783594621374659182298431567165827943" }
    ];
    const idx = Math.floor(Math.random() * backups.length); return backups[idx];
>>>>>>> 96015ae987e29ca1d57fbb66d6d5110a69e7c82c
}

// ------------------------------------------------------------------
// 🧩 TAHTA İŞLEMLERİ
// ------------------------------------------------------------------

function setupBoard(data) {
    if(!data || !data.puzzle) return false;

<<<<<<< HEAD
    currentGame.solution = data.solution; 
    currentGame.puzzleStr = data.puzzle;
    currentGame.timer = 300; // Süreyi resetle
    currentGame.isReady = true;
=======
    currentGame.solution = data.solution; currentGame.puzzleStr = data.puzzle;
    currentGame.timer = 300; currentGame.isReady = true;
>>>>>>> 96015ae987e29ca1d57fbb66d6d5110a69e7c82c

    const board = document.getElementById('sudoku-board');
    if(!board) return false;

    board.innerHTML = ''; 
    for (let i = 0; i < 81; i++) {
        const cell = document.createElement('div'); cell.className = 'cell'; cell.dataset.index = i;
        const char = data.puzzle[i];
<<<<<<< HEAD
        if (char !== '.' && char !== '0') { 
            cell.innerText = char; 
            cell.classList.add('initial'); 
        } else { 
            cell.onclick = () => selectGameCell(cell); 
        }
        board.appendChild(cell);
    }
    
    document.querySelector('.timer-val').innerText = "05:00"; 
    checkGroups(); // Başlangıç kontrolü
=======
        if (char !== '.' && char !== '0') { cell.innerText = char; cell.classList.add('initial'); } 
        else { cell.onclick = () => selectGameCell(cell); }
        board.appendChild(cell);
    }
    
    document.querySelector('.timer-val').innerText = "05:00"; checkGroups(); 
>>>>>>> 96015ae987e29ca1d57fbb66d6d5110a69e7c82c
    return true;
}

function selectGameCell(cell) {
    if (!currentGame.isPlaying) return;
<<<<<<< HEAD
    document.querySelectorAll('.cell').forEach(c => c.classList.remove('selected', 'related')); 
    cell.classList.add('selected'); 
    selectedCell = cell;
    
    // İlişkili hücreleri vurgula
=======
    document.querySelectorAll('.cell').forEach(c => c.classList.remove('selected', 'related')); cell.classList.add('selected'); selectedCell = cell;
>>>>>>> 96015ae987e29ca1d57fbb66d6d5110a69e7c82c
    const idx = parseInt(cell.dataset.index); const row = Math.floor(idx / 9); const col = idx % 9;
    document.querySelectorAll('.cell').forEach(c => {
        const cIdx = parseInt(c.dataset.index); const cRow = Math.floor(cIdx / 9); const cCol = cIdx % 9;
        if (cRow === row || cCol === col) c.classList.add('related');
    });
}

window.handleInput = function(val) {
    if (!currentGame.isPlaying || !selectedCell) return;
    if (selectedCell.classList.contains('initial') || selectedCell.classList.contains('correct')) return;

<<<<<<< HEAD
    if (val === 'del') { 
        selectedCell.innerText = ''; 
        selectedCell.classList.remove('error'); 
        checkGroups(); 
        return; 
    }
    
    selectedCell.innerText = val;
    const idx = parseInt(selectedCell.dataset.index);
    if (String(val) === currentGame.solution[idx]) { 
        selectedCell.classList.remove('error'); 
        selectedCell.classList.add('correct'); 
        checkGroups(); 
        checkWin(); 
    } else { 
        selectedCell.classList.add('error'); 
    }
=======
    if (val === 'del') { selectedCell.innerText = ''; selectedCell.classList.remove('error'); checkGroups(); return; }
    selectedCell.innerText = val;
    const idx = parseInt(selectedCell.dataset.index);
    if (String(val) === currentGame.solution[idx]) { selectedCell.classList.remove('error'); selectedCell.classList.add('correct'); checkGroups(); checkWin(); } 
    else { selectedCell.classList.add('error'); }
>>>>>>> 96015ae987e29ca1d57fbb66d6d5110a69e7c82c
};

function checkGroups() {
    const cells = document.querySelectorAll('.cell'); if(cells.length === 0) return;
    const groups = [];
<<<<<<< HEAD
    // Satırlar, Sütunlar, Kutular...
    for(let r=0; r<9; r++) { let row = []; for(let c=0; c<9; c++) row.push(r*9+c); groups.push(row); }
    for(let c=0; c<9; c++) { let col = []; for(let r=0; r<9; r++) col.push(r*9+c); groups.push(col); }
    const boxRoots = [0,3,6,27,30,33,54,57,60]; 
    boxRoots.forEach(root => { let box = []; for(let r=0; r<3; r++) { for(let c=0; c<3; c++) box.push(root + r*9 + c); } groups.push(box); });
    
    cells.forEach(c => c.classList.remove('completed-group'));
    
=======
    for(let r=0; r<9; r++) { let row = []; for(let c=0; c<9; c++) row.push(r*9+c); groups.push(row); }
    for(let c=0; c<9; c++) { let col = []; for(let r=0; r<9; r++) col.push(r*9+c); groups.push(col); }
    const boxRoots = [0,3,6,27,30,33,54,57,60]; boxRoots.forEach(root => { let box = []; for(let r=0; r<3; r++) { for(let c=0; c<3; c++) box.push(root + r*9 + c); } groups.push(box); });
    cells.forEach(c => c.classList.remove('completed-group'));
>>>>>>> 96015ae987e29ca1d57fbb66d6d5110a69e7c82c
    groups.forEach(grp => {
        let isFull = true; let isCorrect = true;
        grp.forEach(idx => {
            if (!cells[idx].innerText) isFull = false;
            if (cells[idx].innerText !== currentGame.solution[idx]) isCorrect = false;
        });
        if (isFull && isCorrect) grp.forEach(idx => cells[idx].classList.add('completed-group'));
    });
}

function startTimer() {
<<<<<<< HEAD
    // Mevcut interval varsa temizle
    if (currentGame.timerInterval) clearInterval(currentGame.timerInterval);
    
    const timerEl = document.querySelector('.timer-val');
    
    currentGame.timerInterval = setInterval(() => {
        if(!currentGame.isPlaying) return;
        
        currentGame.timer--;
        
        // Negatif değer koruması
        if (currentGame.timer < 0) currentGame.timer = 0;

        let m = Math.floor(currentGame.timer / 60).toString().padStart(2, '0'); 
        let s = (currentGame.timer % 60).toString().padStart(2, '0');
        timerEl.innerText = `${m}:${s}`;
        
        if (currentGame.timer <= 0) {
            stopTimer();
            alert("SÜRE DOLDU! 😢"); 
            
            // Oyunu sıfırla ve ana ekrana dön
            currentGame.isReady = false;
            document.getElementById('start-overlay').style.display = 'flex';
            
            // Buton metnini düzelt
            const startBtn = document.getElementById('main-start-btn');
            if(startBtn) {
                startBtn.innerText = "OYUNA BAŞLA ▶";
                startBtn.onclick = window.forceStartGame;
            }
            const startTitle = document.querySelector('#start-overlay div');
            if(startTitle) startTitle.innerText = "HAZIR MISIN?";
=======
    if (currentGame.timerInterval) clearInterval(currentGame.timerInterval);
    const timerEl = document.querySelector('.timer-val');
    currentGame.timerInterval = setInterval(() => {
        if(!currentGame.isPlaying) return;
        currentGame.timer--;
        let m = Math.floor(currentGame.timer / 60).toString().padStart(2, '0'); let s = (currentGame.timer % 60).toString().padStart(2, '0');
        timerEl.innerText = `${m}:${s}`;
        if (currentGame.timer <= 0) {
            clearInterval(currentGame.timerInterval); currentGame.isPlaying = false;
            alert("SÜRE DOLDU! 😢"); document.getElementById('start-overlay').style.display = 'flex';
>>>>>>> 96015ae987e29ca1d57fbb66d6d5110a69e7c82c
        }
    }, 1000);
}

async function checkWin() {
    const cells = document.querySelectorAll('.cell'); let isComplete = true;
    cells.forEach((c, i) => { if (c.innerText !== currentGame.solution[i]) isComplete = false; });
<<<<<<< HEAD
    
    if (isComplete) {
        stopTimer();
        const winBtn = document.getElementById('win-action-btn');
        
        if (currentGame.mode === 'tournament') {
            let levelPoints = userProgress.level * 10; 
            let timePoints = currentGame.timer;
            userProgress.score += (levelPoints + timePoints); 
            if (userProgress.level < 500) userProgress.level++;
            
            try { await saveScoreToFirebase(userProgress.username, userProgress.score); } catch(e){}
            
            document.querySelector('.win-title').innerText = "HARİKA! 🎉"; 
            document.querySelector('.win-text').innerText = `Puanın: ${userProgress.score}`;
            
            winBtn.innerText = "SONRAKİ BÖLÜM ▶";
            winBtn.onclick = () => { 
                document.getElementById('win-overlay').style.display = 'none'; 
                currentGame.isReady = false; 
                startTournamentGame(); 
            };
        } else if (currentGame.mode === 'daily') {
            userProgress.hasPlayedDailyChallenge = true; 
            userProgress.dailyBestTime = 300 - currentGame.timer;
            
            try { await saveDailyScoreToFirebase(userProgress.username, userProgress.dailyBestTime); } catch(e){}
            
            document.querySelector('.win-title').innerText = "GÜNÜN ŞAMPİYONU! 🏆"; 
            document.querySelector('.win-text').innerText = `Süre: ${formatTime(300 - currentGame.timer)}`;
            
            winBtn.innerText = "TURNUVAYA DÖN ↩"; 
            winBtn.onclick = () => { returnToTournament(); };
        }
        
        saveProgress(); 
        updateUI(); 
        document.getElementById('win-overlay').style.display = 'flex';
    }
}

// Ana menüye dönüş fonksiyonu
window.returnToTournament = function() {
    document.getElementById('win-overlay').style.display = 'none'; 
    currentGame.mode = 'tournament'; 
    currentGame.isReady = false; 
    
    const startTitle = document.querySelector('#start-overlay div'); 
    if(startTitle) startTitle.innerText = "HAZIR MISIN?";
    
    const startBtn = document.getElementById('main-start-btn');
    if(startBtn) {
        startBtn.innerText = "OYUNA BAŞLA ▶";
        startBtn.onclick = window.forceStartGame;
    }

    document.getElementById('start-overlay').style.display = 'flex';
}

// LİDERLİK TABLOSU
window.openLeaderboard = async function() {
    const list = document.getElementById('global-rank-list'); 
    const countEl = document.getElementById('total-player-count'); 
    if(countEl) countEl.innerText = ""; 
    list.innerHTML = '<div style="text-align:center; padding:10px;">Yükleniyor...</div>'; 
    document.getElementById('leaderboard-overlay').style.display = 'flex';
    
    try {
        const q = query(collection(db, "leaderboard"), orderBy("score", "desc"), limit(20)); 
        const querySnapshot = await getDocs(q); 
        list.innerHTML = ''; let index = 0;
        querySnapshot.forEach((doc) => {
            let u = doc.data(); 
            let rankClass = index < 3 ? ['gold','silver','bronze'][index] : ''; 
            let isMe = u.name === userProgress.username;
=======
    if (isComplete) {
        clearInterval(currentGame.timerInterval); currentGame.isPlaying = false;
        const winBtn = document.getElementById('win-action-btn');
        if (currentGame.mode === 'tournament') {
            let levelPoints = userProgress.level * 10; let timePoints = currentGame.timer;
            userProgress.score += (levelPoints + timePoints); if (userProgress.level < 500) userProgress.level++;
            try { await saveScoreToFirebase(userProgress.username, userProgress.score); } catch(e){}
            document.querySelector('.win-title').innerText = "HARİKA! 🎉"; document.querySelector('.win-text').innerText = `Puanın: ${userProgress.score}`;
            winBtn.innerText = "SONRAKİ BÖLÜM ▶";
            winBtn.onclick = () => { document.getElementById('win-overlay').style.display = 'none'; currentGame.isReady = false; startTournamentGame(); };
        } else if (currentGame.mode === 'daily') {
            userProgress.hasPlayedDailyChallenge = true; userProgress.dailyBestTime = 300 - currentGame.timer;
            try { await saveDailyScoreToFirebase(userProgress.username, userProgress.dailyBestTime); } catch(e){}
            document.querySelector('.win-title').innerText = "GÜNÜN ŞAMPİYONU! 🏆"; document.querySelector('.win-text').innerText = `Süre: ${formatTime(300 - currentGame.timer)}`;
            winBtn.innerText = "TURNUVAYA DÖN ↩"; winBtn.onclick = () => { returnToTournament(); };
        }
        saveProgress(); updateUI(); document.getElementById('win-overlay').style.display = 'flex';
    }
}

// Force Start
window.forceStartGame = function() {
    if (currentGame.mode === 'daily') { resumeGame(); } 
    else {
        if(!currentGame.isReady) { window.startTournamentGame(); } 
        else { resumeGame(); }
    }
}

window.returnToTournament = function() {
    document.getElementById('win-overlay').style.display = 'none'; currentGame.mode = 'tournament'; currentGame.isReady = false; 
    const startTitle = document.querySelector('#start-overlay div'); if(startTitle) startTitle.innerText = "HAZIR MISIN?";
    document.getElementById('start-overlay').style.display = 'flex';
}

// LİDERLİK TABLOSU VE DİĞER YARDIMCILAR
window.openLeaderboard = async function() {
    const list = document.getElementById('global-rank-list'); const countEl = document.getElementById('total-player-count'); if(countEl) countEl.innerText = ""; list.innerHTML = '<div style="text-align:center; padding:10px;">Yükleniyor...</div>'; document.getElementById('leaderboard-overlay').style.display = 'flex';
    try {
        const q = query(collection(db, "leaderboard"), orderBy("score", "desc"), limit(20)); const querySnapshot = await getDocs(q); list.innerHTML = ''; let index = 0;
        querySnapshot.forEach((doc) => {
            let u = doc.data(); let rankClass = index < 3 ? ['gold','silver','bronze'][index] : ''; let isMe = u.name === userProgress.username;
>>>>>>> 96015ae987e29ca1d57fbb66d6d5110a69e7c82c
            let html = `<div class="rank-item" style="${isMe ? 'border:1px solid var(--primary); background:#eff6ff' : ''}"><div class="rank-left"><div class="rank-pos ${rankClass}">${index + 1}</div><div class="rank-name">${u.name}</div></div><div class="rank-score">${u.score} P</div></div>`;
            list.innerHTML += html; index++;
        });
        if (index === 0) list.innerHTML = '<div style="text-align:center;">Henüz veri yok.</div>';
    } catch (e) { list.innerHTML = '<div style="text-align:center;">Bağlantı hatası.</div>'; }
};
<<<<<<< HEAD

window.openDailyWinners = async function() {
    const list = document.getElementById('daily-rank-list'); 
    list.innerHTML = '<div style="text-align:center; padding:10px;">Yükleniyor...</div>'; 
    document.getElementById('daily-winners-overlay').style.display = 'flex';
    const today = new Date().toISOString().slice(0,10); 
    const collectionName = "daily_winners_" + today;
    
    try {
        const q = query(collection(db, collectionName), orderBy("time", "asc"), limit(20)); 
        const querySnapshot = await getDocs(q);
        list.innerHTML = ''; let index = 0;
        querySnapshot.forEach((doc) => {
            let u = doc.data(); 
            let rankClass = index < 3 ? ['gold','silver','bronze'][index] : '';
=======
window.openDailyWinners = async function() {
    const list = document.getElementById('daily-rank-list'); list.innerHTML = '<div style="text-align:center; padding:10px;">Yükleniyor...</div>'; document.getElementById('daily-winners-overlay').style.display = 'flex';
    const today = new Date().toISOString().slice(0,10); const collectionName = "daily_winners_" + today;
    try {
        const q = query(collection(db, collectionName), orderBy("time", "asc"), limit(20)); const querySnapshot = await getDocs(q);
        list.innerHTML = ''; let index = 0;
        querySnapshot.forEach((doc) => {
            let u = doc.data(); let rankClass = index < 3 ? ['gold','silver','bronze'][index] : '';
>>>>>>> 96015ae987e29ca1d57fbb66d6d5110a69e7c82c
            let html = `<div class="rank-item"><div class="rank-left"><div class="rank-pos ${rankClass}">${index + 1}</div><div class="rank-name">${u.name}</div></div><div class="rank-score">${formatTime(u.time)}</div></div>`;
            list.innerHTML += html; index++;
        });
        if (index === 0) list.innerHTML = '<div style="text-align:center;">Bugünün ilk şampiyonu sen ol!</div>';
    } catch (e) { list.innerHTML = '<div style="text-align:center;">Henüz veri yok.</div>'; }
};
<<<<<<< HEAD

window.closeOverlays = function() {
    document.querySelectorAll('.overlay-full').forEach(el => el.style.display = 'none'); 
    if(!currentGame.isPlaying) { 
        document.getElementById('start-overlay').style.display = 'flex'; 
    }
};

window.resetBoard = function() {
    if(!confirm("Tüm hamleleri silmek istediğine emin misin?")) return;
    document.querySelectorAll('.cell:not(.initial)').forEach(c => { 
        c.innerText = ''; 
        c.className = 'cell'; 
        c.classList.remove('error', 'correct', 'selected', 'related'); 
    });
    checkGroups();
};

window.nextLevel = function() {
    if(currentGame.mode === 'daily') returnToTournament(); 
    else startTournamentGame();
};

function updateUI() {
    document.querySelector('.level-val').innerHTML = `${userProgress.level}<span class="level-total">/500</span>`; 
    document.querySelector('.quota-val').innerText = `${userProgress.dailyQuota}/20`;
    document.querySelector('.score-val').innerText = userProgress.score;
}

function saveProgress() { localStorage.setItem('sudokai_user', JSON.stringify(userProgress)); }

function formatTime(seconds) {
    if(!seconds && seconds !== 0) return "00:00"; 
    let m = Math.floor(seconds / 60).toString().padStart(2, '0'); 
    let s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

async function saveScoreToFirebase(name, score) {
    try {
        const userRef = doc(db, "leaderboard", name); 
        await setDoc(userRef, { name: name, score: score, lastUpdate: new Date() }, { merge: true });
    } catch (e) { console.error("Skor kaydedilemedi", e); }
}

async function saveDailyScoreToFirebase(name, timeSeconds) {
    try {
        const today = new Date().toISOString().slice(0,10); 
        const collectionName = "daily_winners_" + today;
        const userRef = doc(db, collectionName, name); 
        await setDoc(userRef, { name: name, time: timeSeconds });
    } catch (e) { console.error("Günlük skor kaydedilemedi", e); }
=======
window.closeOverlays = function() {
    document.querySelectorAll('.overlay-full').forEach(el => el.style.display = 'none'); if(!currentGame.isPlaying) { document.getElementById('start-overlay').style.display = 'flex'; }
};
window.resetBoard = function() {
    if(!confirm("Emin misin?")) return;
    document.querySelectorAll('.cell:not(.initial)').forEach(c => { c.innerText = ''; c.className = 'cell'; c.classList.remove('error', 'correct', 'selected', 'related'); });
    checkGroups();
};
window.nextLevel = function() {
    if(currentGame.mode === 'daily') returnToTournament(); else startTournamentGame();
};
function updateUI() {
    document.querySelector('.level-val').innerHTML = `${userProgress.level}<span class="level-total">/500</span>`; document.querySelector('.quota-val').innerText = `${userProgress.dailyQuota}/20`;
    document.querySelector('.score-val').innerText = userProgress.score;
}
function saveProgress() { localStorage.setItem('sudokai_user', JSON.stringify(userProgress)); }
function formatTime(seconds) {
    if(!seconds && seconds !== 0) return "00:00"; let m = Math.floor(seconds / 60).toString().padStart(2, '0'); let s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}
async function saveScoreToFirebase(name, score) {
    const userRef = doc(db, "leaderboard", name); await setDoc(userRef, { name: name, score: score, lastUpdate: new Date() }, { merge: true });
}
async function saveDailyScoreToFirebase(name, timeSeconds) {
    const today = new Date().toISOString().slice(0,10); const collectionName = "daily_winners_" + today;
    const userRef = doc(db, collectionName, name); await setDoc(userRef, { name: name, time: timeSeconds });
>>>>>>> 96015ae987e29ca1d57fbb66d6d5110a69e7c82c
}