// ==========================================
// 🧠 SUDOKAI BEYİN MERKEZİ (v13.0 - KURŞUN GEÇİRMEZ)
// ==========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { 
    getFirestore, collection, doc, getDoc, getDocs, setDoc, 
    query, orderBy, limit 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// SENİN AYARLARIN
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

// Global Değişkenler
let localPuzzles = [];
let hardPuzzles = [];
let currentGame = {
    solution: "",
    puzzleStr: "",
    timer: 300,
    timerInterval: null,
    isPlaying: false,
    mode: 'tournament',
    isReady: false
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

// İsim Kontrolü
if (!localStorage.getItem('sudokai_user')) {
    let name = prompt("Kullanıcı adın nedir şampiyon?", userProgress.username);
    if(name) userProgress.username = name.toUpperCase().replace(/[^A-Z0-9_]/g, '');
    saveProgress();
}

// Tarih Kontrolü
if (userProgress.lastPlayedDate !== new Date().toDateString()) {
    userProgress.dailyQuota = 20;
    userProgress.hasPlayedDailyChallenge = false;
    userProgress.dailyBestTime = null;
    userProgress.lastPlayedDate = new Date().toDateString();
    saveProgress();
}

let selectedCell = null;

// Verileri Yükle
async function loadBackupData() {
    if(localPuzzles.length > 0) return;
    try {
        const res = await fetch('tum_bulmacalar_SIRALI.json');
        if (res.ok) {
            const data = await res.json();
            if(data.tier_1) localPuzzles = localPuzzles.concat(data.tier_1);
            if(data.tier_2) localPuzzles = localPuzzles.concat(data.tier_2);
            if(data.tier_3) localPuzzles = localPuzzles.concat(data.tier_3);
            if(data.tier_4) localPuzzles = localPuzzles.concat(data.tier_4);
            if(data.tier_5) localPuzzles = localPuzzles.concat(data.tier_5);
            if(data.tier_4) hardPuzzles = hardPuzzles.concat(data.tier_4);
            if(data.tier_5) hardPuzzles = hardPuzzles.concat(data.tier_5);
            console.log("Veriler yüklendi.");
        }
    } catch (e) { console.log("JSON Yedeği yüklenemedi, manuel yedeğe geçilecek."); }
}
// Arka planda başlat
loadBackupData();

window.onload = () => {
    updateUI();
    document.querySelector('.user-name').innerText = userProgress.username;
    document.getElementById('start-overlay').style.display = 'flex';
    currentGame.isPlaying = false;
};

// ==================================================================
// 🎮 OYUN BAŞLATMA MANTIĞI (GARANTİLİ)
// ==================================================================

window.startTournamentGame = async function() {
    // 1. Zaten oyun varsa devam et
    if (currentGame.isReady && currentGame.mode === 'tournament' && !currentGame.isPlaying) {
        resumeGame();
        return;
    }

    // 2. Kota Kontrolü
    if (userProgress.dailyQuota <= 0) {
        alert("Günlük Turnuva kotan doldu! Yarın gel. 🛑");
        return;
    }

    // 3. Veri Kontrolü (Yoksa bekle, gelmezse yedeğe geç)
    if (localPuzzles.length === 0) {
        console.log("Veri bekleniyor...");
        await loadBackupData();
    }

    // 4. Bulmacayı BELİRLE (Garanti)
    let puzzleData = null;
    
    if (localPuzzles.length > 0) {
        // Normal Havuzdan
        let idx = (userProgress.level - 1) % localPuzzles.length;
        puzzleData = localPuzzles[idx];
    } 
    
    // Eğer hala veri yoksa (Fetch başarısızsa) KESİN YEDEK KULLAN
    if (!puzzleData) {
        console.log("⚠️ Veri havuzu boş, Acil Durum Bulmacası devreye giriyor.");
        puzzleData = getBackupPuzzle();
    }

    // 5. Tahtayı Kurmayı Dene
    const setupSuccess = setupBoard(puzzleData);

    // 6. SADECE Tahta Kurulduysa Oyunu Başlat
    if (setupSuccess) {
        closeOverlays();
        userProgress.dailyQuota--; // Kotayı şimdi düş
        saveProgress();
        updateUI();
        currentGame.mode = 'tournament';
        resumeGame(); // Sayacı başlat
    } else {
        alert("Oyun yüklenirken bir hata oluştu. Lütfen sayfayı yenile.");
    }
};

window.startDailyGame = async function() {
    if (userProgress.hasPlayedDailyChallenge) {
        alert("Bugünlük görevi tamamladın! 🏆");
        return;
    }

    if (hardPuzzles.length === 0) await loadBackupData();

    let puzzleData = null;
    if (hardPuzzles.length > 0) {
        const today = new Date();
        const dateString = `${today.getFullYear()}${today.getMonth() + 1}${today.getDate()}`;
        let hash = 0;
        for (let i = 0; i < dateString.length; i++) hash = ((hash << 5) - hash) + dateString.charCodeAt(i) | 0;
        const uniqueIndex = Math.abs(hash) % hardPuzzles.length;
        puzzleData = hardPuzzles[uniqueIndex];
    }
    
    // Günlük için de yedek kontrolü
    if (!puzzleData) puzzleData = getBackupPuzzle();

    const setupSuccess = setupBoard(puzzleData);

    if (setupSuccess) {
        currentGame.mode = 'daily';
        currentGame.isPlaying = false; // Hemen başlatma
        if(currentGame.timerInterval) clearInterval(currentGame.timerInterval);
        
        const startTitle = document.querySelector('#start-overlay div');
        if(startTitle) startTitle.innerText = "GÜNÜN BULMACASI";
        
        document.getElementById('start-overlay').style.display = 'flex';
        closeOverlays();
        document.getElementById('start-overlay').style.display = 'flex';
    }
};

function resumeGame() {
    document.getElementById('start-overlay').style.display = 'none';
    closeOverlays();
    currentGame.isPlaying = true;
    startTimer();
}

// 5'li Yedek Paketi (Kodun İçine Gömülü - İNTERNETSİZ BİLE ÇALIŞIR)
function getBackupPuzzle() {
    const backups = [
        { puzzle: "1572394684837569129628145..6954873212.1.6.8.48...216....9.782.6726.4.189.1869274.", solution: "157239468483756912962814537695487321231965874874321695349178256726543189518692743" },
        { puzzle: "7256..43.9847.32656..54287.5..267984247...15.8964517231.2..469..79126548468975.12", solution: "725689431984713265613542879531267984247398156896451723152834697379126548468975312" },
        { puzzle: "9..3.415.6135..84.4.518.93.861945273392..8514.4723168915....32873981246528..53791", solution: "928374156613529847475186932861945273392768514547231689154697328739812465286453791" },
        { puzzle: "871.2965324.86.9.16931754829.6248.17...691.2.1245378.6...9..2.551238476946.752138", solution: "871429653245863971693175482936248517758691324124537896387916245512384769469752138" },
        { puzzle: "613948527459217.38728563419....7....867329145....8..7.576431..23428.6751981752364", solution: "613948527459217638728563419194675283867329145235184976576431892342896751981752364" }
    ];
    const idx = Math.floor(Math.random() * backups.length);
    return backups[idx];
}

// ------------------------------------------------------------------
// 🧩 TAHTA İŞLEMLERİ
// ------------------------------------------------------------------

function setupBoard(data) {
    if(!data || !data.puzzle) { 
        console.error("Hata: Geçersiz bulmaca verisi!"); 
        return false; // Başarısız oldu sinyali
    }

    currentGame.solution = data.solution;
    currentGame.puzzleStr = data.puzzle;
    currentGame.timer = 300; 
    currentGame.isReady = true;

    const board = document.getElementById('sudoku-board');
    if(board) {
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
    }
    
    document.querySelector('.timer-val').innerText = "05:00";
    checkGroups(); 
    return true; // Başarılı oldu sinyali
}

function selectGameCell(cell) {
    if (!currentGame.isPlaying) return;
    document.querySelectorAll('.cell').forEach(c => c.classList.remove('selected', 'related'));
    cell.classList.add('selected');
    selectedCell = cell;

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
    if (!currentGame.isPlaying || !selectedCell) return;
    if (selectedCell.classList.contains('initial') || selectedCell.classList.contains('correct')) return;

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
};

function checkGroups() {
    const cells = document.querySelectorAll('.cell');
    if(cells.length === 0) return;

    const groups = [];
    for(let r=0; r<9; r++) { let row = []; for(let c=0; c<9; c++) row.push(r*9+c); groups.push(row); }
    for(let c=0; c<9; c++) { let col = []; for(let r=0; r<9; r++) col.push(r*9+c); groups.push(col); }
    const boxRoots = [0,3,6,27,30,33,54,57,60];
    boxRoots.forEach(root => { let box = []; for(let r=0; r<3; r++) { for(let c=0; c<3; c++) box.push(root + r*9 + c); } groups.push(box); });

    cells.forEach(c => c.classList.remove('completed-group'));

    groups.forEach(grp => {
        let isFull = true;
        let isCorrect = true;
        grp.forEach(idx => {
            if (!cells[idx].innerText) isFull = false;
            if (cells[idx].innerText !== currentGame.solution[idx]) isCorrect = false;
        });
        if (isFull && isCorrect) grp.forEach(idx => cells[idx].classList.add('completed-group'));
    });
}

function startTimer() {
    if (currentGame.timerInterval) clearInterval(currentGame.timerInterval);
    const timerEl = document.querySelector('.timer-val');
    
    currentGame.timerInterval = setInterval(() => {
        if(!currentGame.isPlaying) return;

        currentGame.timer--;
        let m = Math.floor(currentGame.timer / 60).toString().padStart(2, '0');
        let s = (currentGame.timer % 60).toString().padStart(2, '0');
        timerEl.innerText = `${m}:${s}`;

        if (currentGame.timer <= 0) {
            clearInterval(currentGame.timerInterval);
            currentGame.isPlaying = false;
            alert("SÜRE DOLDU! 😢");
            document.getElementById('start-overlay').style.display = 'flex';
        }
    }, 1000);
}

// KAZANMA VE KAYIT
async function checkWin() {
    const cells = document.querySelectorAll('.cell');
    let isComplete = true;
    cells.forEach((c, i) => { if (c.innerText !== currentGame.solution[i]) isComplete = false; });

    if (isComplete) {
        clearInterval(currentGame.timerInterval);
        currentGame.isPlaying = false;
        
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

// "Force Start" (HTML'den çağrılan buton)
window.forceStartGame = function() {
    if (currentGame.mode === 'daily') {
        resumeGame();
    } else {
        if(!currentGame.isReady) {
            window.startTournamentGame(); 
        } else {
            resumeGame();
        }
    }
}

window.returnToTournament = function() {
    document.getElementById('win-overlay').style.display = 'none';
    currentGame.mode = 'tournament';
    currentGame.isReady = false; 
    const startTitle = document.querySelector('#start-overlay div');
    if(startTitle) startTitle.innerText = "HAZIR MISIN?";
    document.getElementById('start-overlay').style.display = 'flex';
}

window.openLeaderboard = async function() {
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
            let html = `<div class="rank-item" style="${isMe ? 'border:1px solid var(--primary); background:#eff6ff' : ''}"><div class="rank-left"><div class="rank-pos ${rankClass}">${index + 1}</div><div class="rank-name">${u.name}</div></div><div class="rank-score">${u.score} P</div></div>`;
            list.innerHTML += html;
            index++;
        });
        if (index === 0) list.innerHTML = '<div style="text-align:center;">Henüz veri yok.</div>';
    } catch (e) { list.innerHTML = '<div style="text-align:center;">Bağlantı hatası.</div>'; }
};

window.openDailyWinners = async function() {
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
            let html = `<div class="rank-item"><div class="rank-left"><div class="rank-pos ${rankClass}">${index + 1}</div><div class="rank-name">${u.name}</div></div><div class="rank-score">${formatTime(u.time)}</div></div>`;
            list.innerHTML += html;
            index++;
        });
        if (index === 0) list.innerHTML = '<div style="text-align:center;">Bugünün ilk şampiyonu sen ol!</div>';
    } catch (e) { list.innerHTML = '<div style="text-align:center;">Henüz veri yok.</div>'; }
};

window.closeOverlays = function() {
    document.querySelectorAll('.overlay-full').forEach(el => el.style.display = 'none');
    if(!currentGame.isPlaying) {
        document.getElementById('start-overlay').style.display = 'flex';
    }
};

window.resetBoard = function() {
    if(!confirm("Emin misin?")) return;
    document.querySelectorAll('.cell:not(.initial)').forEach(c => { 
        c.innerText = ''; c.className = 'cell'; c.classList.remove('error', 'correct', 'selected', 'related');
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
    const userRef = doc(db, "leaderboard", name); 
    await setDoc(userRef, { name: name, score: score, lastUpdate: new Date() }, { merge: true });
}
async function saveDailyScoreToFirebase(name, timeSeconds) {
    const today = new Date().toISOString().slice(0,10);
    const collectionName = "daily_winners_" + today;
    const userRef = doc(db, collectionName, name);
    await setDoc(userRef, { name: name, time: timeSeconds });
}