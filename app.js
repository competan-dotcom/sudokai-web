// ==========================================
// 🧠 SUDOKAI BEYİN MERKEZİ (v8.0 - Counter Update)
// ==========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { 
    getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, 
    query, orderBy, limit, getCountFromServer
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

let localPuzzles = [];
let hardPuzzles = [];
let currentGame = {
    solution: "",
    puzzleStr: "",
    timer: 300,
    timerInterval: null,
    isPlaying: false,
    mode: 'tournament',
    initialTime: 300
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

if (!localStorage.getItem('sudokai_user')) {
    let name = prompt("Kullanıcı adın nedir şampiyon?", userProgress.username);
    if(name) userProgress.username = name.toUpperCase();
    saveProgress();
}

if (userProgress.lastPlayedDate !== new Date().toDateString()) {
    userProgress.dailyQuota = 20;
    userProgress.hasPlayedDailyChallenge = false;
    userProgress.dailyBestTime = null;
    userProgress.lastPlayedDate = new Date().toDateString();
    saveProgress();
}

let selectedCell = null;

async function loadBackupData() {
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
        }
    } catch (e) { console.log("JSON Yedeği yüklenemedi"); }
}
loadBackupData();

window.onload = () => {
    updateUI();
    document.querySelector('.user-name').innerText = userProgress.username;
};

window.startTournamentGame = async function() {
    if (userProgress.dailyQuota <= 0) {
        alert("Günlük Turnuva kotan doldu! Yarın gel. 🛑");
        return;
    }
    
    closeOverlays();
    userProgress.dailyQuota--;
    saveProgress();
    updateUI();

    currentGame.mode = 'tournament';
    
    let tier = Math.ceil(userProgress.level / 100);
    if(tier > 5) tier = 5;
    let num = (userProgress.level - 1) % 100 + 1;
    let numStr = num.toString().padStart(3, '0');
    let docId = `tier${tier}_${numStr}`;

    try {
        const docRef = doc(db, "puzzles_career", docId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            setupBoard(docSnap.data());
        } else {
            startFromLocal();
        }
    } catch (error) {
        console.error("Firebase Hatası:", error);
        startFromLocal();
    }
};

function startFromLocal() {
    let idx = (userProgress.level - 1) % localPuzzles.length;
    let puzzleData = localPuzzles.length > 0 ? localPuzzles[idx] : getBackupPuzzle();
    setupBoard(puzzleData);
}

window.startDailyGame = function() {
    if (userProgress.hasPlayedDailyChallenge) {
        alert("Bugünlük görevi tamamladın! 🏆");
        return;
    }
    closeOverlays();
    currentGame.mode = 'daily';

    const today = new Date();
    const dateString = `${today.getFullYear()}${today.getMonth() + 1}${today.getDate()}`;
    let hash = 0;
    for (let i = 0; i < dateString.length; i++) {
        hash = ((hash << 5) - hash) + dateString.charCodeAt(i);
        hash |= 0;
    }
    
    const uniqueIndex = Math.abs(hash) % (hardPuzzles.length || 1);
    let puzzleData = hardPuzzles.length > 0 ? hardPuzzles[uniqueIndex] : getBackupPuzzle();
    
    document.getElementById('sudoku-board').innerHTML = '';
    setupBoard(puzzleData);
};

function getBackupPuzzle() {
    return { 
        puzzle: "1572394684837569129628145..6954873212.1.6.8.48...216....9.782.6726.4.189.1869274.", 
        solution: "157239468483756912962814537695487321231965874874321695349178256726543189518692743" 
    };
}

function setupBoard(data) {
    currentGame.solution = data.solution;
    currentGame.puzzleStr = data.puzzle;
    currentGame.timer = 300; 
    currentGame.isPlaying = true;

    const board = document.getElementById('sudoku-board');
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
    
    startTimer();
    checkGroups(); 
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
    const groups = [];
    
    for(let r=0; r<9; r++) {
        let row = []; for(let c=0; c<9; c++) row.push(r*9+c);
        groups.push(row);
    }
    for(let c=0; c<9; c++) {
        let col = []; for(let r=0; r<9; r++) col.push(r*9+c);
        groups.push(col);
    }
    const boxRoots = [0,3,6,27,30,33,54,57,60];
    boxRoots.forEach(root => {
        let box = [];
        for(let r=0; r<3; r++) { for(let c=0; c<3; c++) box.push(root + r*9 + c); }
        groups.push(box);
    });

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

async function checkWin() {
    const cells = document.querySelectorAll('.cell');
    let isComplete = true;
    cells.forEach((c, i) => {
        if (c.innerText !== currentGame.solution[i]) isComplete = false;
    });

    if (isComplete) {
        clearInterval(currentGame.timerInterval);
        currentGame.isPlaying = false;
        
        const winBtn = document.getElementById('win-action-btn');

        if (currentGame.mode === 'tournament') {
            let levelPoints = userProgress.level * 10;
            let timePoints = currentGame.timer;
            userProgress.score += (levelPoints + timePoints);
            
            if (userProgress.level < 500) userProgress.level++;
            
            await saveScoreToFirebase(userProgress.username, userProgress.score);

            document.querySelector('.win-title').innerText = "HARİKA! 🎉";
            document.querySelector('.win-text').innerText = `Puanın: ${userProgress.score}\nLiderlik tablosu güncellendi!`;
            
            winBtn.innerText = "SONRAKİ BÖLÜM ▶";
            winBtn.onclick = () => { startTournamentGame(); };
            
        } else if (currentGame.mode === 'daily') {
            userProgress.hasPlayedDailyChallenge = true;
            userProgress.dailyBestTime = 300 - currentGame.timer;
            
            await saveDailyScoreToFirebase(userProgress.username, userProgress.dailyBestTime);

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

window.returnToTournament = function() {
    document.getElementById('win-overlay').style.display = 'none';
    document.getElementById('start-overlay').style.display = 'flex';
    currentGame.mode = 'tournament';
}

async function saveScoreToFirebase(name, score) {
    try {
        const userRef = doc(db, "leaderboard", name); 
        await setDoc(userRef, { name: name, score: score, lastUpdate: new Date() }, { merge: true });
    } catch (e) { console.error(e); }
}

async function saveDailyScoreToFirebase(name, timeSeconds) {
    try {
        const today = new Date().toISOString().slice(0,10);
        const collectionName = "daily_winners_" + today;
        const userRef = doc(db, collectionName, name);
        await setDoc(userRef, { name: name, time: timeSeconds });
    } catch (e) { console.error(e); }
}

// ----------------------------------------------------
// 📊 YENİLENEN LİDERLİK FONKSİYONU (COUNT İLE)
// ----------------------------------------------------
window.openLeaderboard = async function() {
    const list = document.getElementById('global-rank-list');
    const countText = document.getElementById('total-player-count'); // Sayaç elementi
    
    list.innerHTML = '<div style="text-align:center; padding:10px;">Yükleniyor...</div>';
    countText.innerText = 'Hesaplanıyor...';
    
    document.getElementById('leaderboard-overlay').style.display = 'flex';

    try {
        // 1. TOPLAM OYUNCU SAYISINI ÇEK
        const coll = collection(db, "leaderboard");
        const snapshot = await getCountFromServer(coll);
        countText.innerText = `Toplam Oyuncu: ${snapshot.data().count}`;

        // 2. LİSTEYİ ÇEK
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
        if (index === 0) list.innerHTML = '<div style="text-align:center;">Henüz veri yok. İlk sen ol!</div>';
        
    } catch (e) { 
        console.error(e);
        list.innerHTML = '<div style="text-align:center;">Bağlantı hatası :(</div>'; 
        countText.innerText = 'Toplam Oyuncu: -';
    }
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
        if (index === 0) list.innerHTML = '<div style="text-align:center;">Bugünün ilk şampiyonu sen ol!</div>';
    } catch (e) { list.innerHTML = '<div style="text-align:center;">Henüz veri yok.</div>'; }
};

window.closeOverlays = function() {
    document.querySelectorAll('.overlay-full').forEach(el => el.style.display = 'none');
    if(!currentGame.isPlaying) document.getElementById('start-overlay').style.display = 'flex';
};

window.resetBoard = function() {
    if(!confirm("Emin misin?")) return;
    document.querySelectorAll('.cell:not(.initial)').forEach(c => { 
        c.innerText = ''; c.className = 'cell'; c.classList.remove('error', 'correct', 'selected', 'related');
    });
    checkGroups();
};

window.nextLevel = function() {
    if(currentGame.mode === 'daily') {
        returnToTournament();
    } else {
        startTournamentGame();
    }
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