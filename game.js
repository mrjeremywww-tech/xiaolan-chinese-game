/* ===== 小嵐山中文測驗 - Game Module ===== */

// Game State
let currentLevel = null;
let currentQuestion = 0;
let totalQuestions = 5;
let score = 0;
let stars = 0;
let totalStars = 0;
let totalFish = 0;
let hanziWriter = null;
let tracingChars = ['山', '水', '火', '木', '人', '口'];
let currentTracingIndex = 0;

// Level Data - Based on Macau Sheng Kung Hui Workbook
const levelData = {
    1: {
        title: '古文字猜猜看',
        description: '象形文字大挑戰',
        generator: generateAncientCharGame
    },
    2: {
        title: '組合漢字',
        description: '部首組合遊戲',
        generator: generateCharComboGame
    },
    3: {
        title: '量詞選擇',
        description: '選擇正確的量詞',
        generator: generateMeasureWordGame
    },
    4: {
        title: '反義詞填空',
        description: '找出相反意思的詞',
        generator: generateAntonymGame
    },
    5: {
        title: '句子排序',
        description: '排列正確的句子順序',
        generator: generateSentenceOrderGame
    },
    6: {
        title: '描紅練習',
        description: '跟小嵐山寫字',
        generator: generateTracingGame
    }
};

// Question Banks
const ancientChars = [
    { char: '山', image: '⛰️', meaning: '山', options: ['山', '水', '火', '木'] },
    { char: '水', image: '💧', meaning: '水', options: ['土', '水', '金', '石'] },
    { char: '火', image: '🔥', meaning: '火', options: ['光', '火', '熱', '燈'] },
    { char: '木', image: '🌲', meaning: '樹木', options: ['林', '森', '木', '枝'] },
    { char: '人', image: '🚶', meaning: '人', options: ['大', '人', '天', '夫'] },
    { char: '口', image: '👄', meaning: '嘴巴', options: ['口', '回', '品', '日'] },
    { char: '日', image: '☀️', meaning: '太陽', options: ['目', '日', '月', '星'] },
    { char: '月', image: '🌙', meaning: '月亮', options: ['月', '夕', '夜', '光'] }
];

const charCombos = [
    { parts: ['門', '口'], result: '問', meaning: '問題' },
    { parts: ['日', '月'], result: '明', meaning: '明亮' },
    { parts: ['木', '木'], result: '林', meaning: '樹林' },
    { parts: ['人', '人'], result: '从', meaning: '跟從' },
    { parts: ['口', '十'], result: '古', meaning: '古代' },
    { parts: ['女', '子'], result: '好', meaning: '好人' }
];

const measureWords = [
    { noun: '花', measure: '朵', image: '🌸', options: ['朵', '枝', '片', '個'] },
    { noun: '書', measure: '本', image: '📚', options: ['張', '本', '頁', '個'] },
    { noun: '魚', measure: '條', image: '🐟', options: ['隻', '條', '尾', '個'] },
    { noun: '車', measure: '輛', image: '🚗', options: '部', '輛', '台', '個'] },
    { noun: '筆', measure: '支', image: '✏️', options: ['把', '支', '枝', '個'] },
    { noun: '鳥', measure: '隻', image: '🐦', options: ['隻', '隻', '尾', '個'] }
];

const antonyms = [
    { word: '危險', antonym: '安全', options: ['安全', '害怕', '小心', '恐懼'] },
    { word: '快樂', antonym: '傷心', options: ['生氣', '傷心', '害怕', '緊張'] },
    { word: '大', antonym: '小', options: ['多', '小', '少', '高'] },
    { word: '高', antonym: '低', options: ['矮', '低', '短', '淺'] },
    { word: '快', antonym: '慢', options: ['急', '慢', '緩', '遲'] },
    { word: '新', antonym: '舊', options: ['破', '舊', '老', '壞'] }
];

const sentenceOrders = [
    {
        image: '🌅',
        sentences: ['太陽升起來了', '天亮了', '公雞喔喔叫'],
        correctOrder: [1, 0, 2]
    },
    {
        image: '🍎',
        sentences: ['蘋果掉下來了', '牛頓坐在樹下', '他發現了地心引力'],
        correctOrder: [1, 0, 2]
    },
    {
        image: '🌧️',
        sentences: ['天空烏雲密佈', '下起了大雨', '人們撐起雨傘'],
        correctOrder: [0, 1, 2]
    }
];

// Utility Functions
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Game Starters
function startGame(levelNum) {
    currentLevel = levelNum;
    currentQuestion = 0;
    score = 0;
    stars = 0;
    
    document.getElementById('mainMenu').classList.add('hidden');
    document.getElementById('gameContainer').classList.remove('hidden');
    document.getElementById('hanziContainer').classList.add('hidden');
    document.getElementById('gameArea').classList.remove('hidden');
    
    const level = levelData[levelNum];
    document.getElementById('gameTitle').textContent = level.title;
    
    updateProgressBar();
    nextQuestion();
    xiaolanSay('加油！你可以的！🐱');
}

function backToMenu() {
    document.getElementById('mainMenu').classList.remove('hidden');
    document.getElementById('gameContainer').classList.add('hidden');
    document.getElementById('resultsModal').classList.add('hidden');
    document.getElementById('levelCompleteModal').classList.add('hidden');
    
    if (hanziWriter) {
        hanziWriter = null;
    }
    
    currentLevel = null;
}

function nextQuestion() {
    if (currentQuestion >= totalQuestions) {
        showLevelComplete();
        return;
    }
    
    currentQuestion++;
    updateProgressBar();
    
    const level = levelData[currentLevel];
    const gameArea = document.getElementById('gameArea');
    gameArea.innerHTML = '';
    
    level.generator(gameArea);
}

function updateProgressBar() {
    const progress = (currentQuestion / totalQuestions) * 100;
    document.getElementById('progressBar').style.width = progress + '%';
    
    const catProgress = document.querySelector('.cat-progress');
    if (catProgress) {
        catProgress.style.left = `calc(${progress}% - 15px)`;
    }
}

// Xiaolan Helper
function xiaolanSay(message) {
    const bubble = document.getElementById('speechBubble');
    bubble.textContent = message;
    
    // Add animation
    bubble.style.animation = 'none';
    setTimeout(() => {
        bubble.style.animation = 'popIn 0.3s ease';
    }, 10);
}

// Answer Checking
function checkAnswer(selected, correct, buttonElement) {
    const buttons = document.querySelectorAll('.option-btn, .sentence-item');
    buttons.forEach(btn => btn.disabled = true);
    
    if (selected === correct) {
        buttonElement.classList.add('correct');
        score++;
        stars++;
        document.getElementById('gameStars').textContent = stars;
        xiaolanSay('答對了！太棒了！🎉');
        
        setTimeout(() => showResults(true), 800);
    } else {
        buttonElement.classList.add('wrong');
        xiaolanSay('不對哦，再試一次！💪');
        
        setTimeout(() => {
            buttons.forEach(btn => {
                btn.disabled = false;
                btn.classList.remove('wrong');
            });
        }, 1000);
    }
}

function showResults(correct) {
    if (correct) {
        const modal = document.getElementById('resultsModal');
        const starsDisplay = '🌟'.repeat(Math.min(stars, 3));
        document.getElementById('resultStars').textContent = starsDisplay;
        document.getElementById('fishEarned').textContent = '+' + score;
        modal.classList.remove('hidden');
    }
}

function continueGame() {
    document.getElementById('resultsModal').classList.add('hidden');
    nextQuestion();
}

function showLevelComplete() {
    totalStars += stars;
    totalFish += score;
    
    document.getElementById('totalStars').textContent = totalStars;
    document.getElementById('totalFish').textContent = totalFish;
    document.getElementById('finalStars').textContent = stars;
    document.getElementById('finalFish').textContent = score;
    
    document.getElementById('levelCompleteModal').classList.remove('hidden');
    xiaolanSay('小嵐山說：「你好棒！」🏆');
}

// ===== LEVEL 1: 古文字猜猜看 =====
function generateAncientCharGame(container) {
    const item = ancientChars[getRandomInt(0, ancientChars.length - 1)];
    const shuffledOptions = shuffleArray([...item.options]);
    
    let html = `<div class="question-container">
        <p class="question-text">這個古文字代表什麼意思？</p>
        <div class="ancient-char">${item.image}</div>
        <div class="options-grid">
    `;
    
    shuffledOptions.forEach(option => {
        html += `<button class="option-btn" onclick="checkAnswer('${option}', '${item.char}', this)">${option}</button>`;
    });
    
    html += '</div></div>';
    container.innerHTML = html;
}

// ===== LEVEL 2: 組合漢字 =====
function generateCharComboGame(container) {
    const combo = charCombos[getRandomInt(0, charCombos.length - 1)];
    const wrongOptions = ['明', '好', '林', '問', '從', '古'].filter(c => c !== combo.result);
    const options = shuffleArray([combo.result, ...wrongOptions.slice(0, 3)]);
    
    let html = `<div class="question-container">
        <p class="question-text">這兩個字合起來是什麼字？</p>
        <div class="char-combo">
            <div class="char-part">${combo.parts[0]}</div>
            <span class="combo-operator">+</span>
            <div class="char-part">${combo.parts[1]}</div>
            <span class="combo-operator">=</span>
            <div class="combo-result">?</div>
        </div>
        <p style="color: #666; margin: 15px 0;">提示：${combo.meaning}</p>
        <div class="options-grid">
    `;
    
    options.forEach(option => {
        html += `<button class="option-btn" style="font-size: 2rem;" onclick="checkAnswer('${option}', '${combo.result}', this)">${option}</button>`;
    });
    
    html += '</div></div>';
    container.innerHTML = html;
}

// ===== LEVEL 3: 量詞選擇 =====
function generateMeasureWordGame(container) {
    const item = measureWords[getRandomInt(0, measureWords.length - 1)];
    const shuffledOptions = shuffleArray([...item.options]);
    
    let html = `<div class="question-container">
        <p class="question-text">選擇正確的量詞：</p>
        <div style="font-size: 80px; margin: 20px;">${item.image}</div>
        <p style="font-size: 1.5rem; font-weight: 700; margin: 20px;">一 ___ ${item.noun}</p>
        <div class="options-grid">
    `;
    
    shuffledOptions.forEach(option => {
        html += `<button class="option-btn" onclick="checkAnswer('${option}', '${item.measure}', this)">${option}</button>`;
    });
    
    html += '</div></div>';
    container.innerHTML = html;
}

// ===== LEVEL 4: 反義詞填空 =====
function generateAntonymGame(container) {
    const item = antonyms[getRandomInt(0, antonyms.length - 1)];
    const shuffledOptions = shuffleArray([...item.options]);
    
    let html = `<div class="question-container">
        <p class="question-text">「${item.word}」的反義詞是什麼？</p>
        <div style="font-size: 60px; margin: 30px; color: var(--primary); font-weight: 900;">${item.word} = ?</div>
        <div class="options-grid">
    `;
    
    shuffledOptions.forEach(option => {
        html += `<button class="option-btn" onclick="checkAnswer('${option}', '${item.antonym}', this)">${option}</button>`;
    });
    
    html += '</div></div>';
    container.innerHTML = html;
}

// ===== LEVEL 5: 句子排序 =====
let selectedSentences = [];

function generateSentenceOrderGame(container) {
    const item = sentenceOrders[getRandomInt(0, sentenceOrders.length - 1)];
    selectedSentences = [];
    
    let html = `<div class="question-container">
        <p class="question-text">按照順序排列句子：</p>
        <div style="font-size: 60px; margin: 20px;">${item.image}</div>
        <div class="sentence-container" id="sentenceContainer">
    `;
    
    item.sentences.forEach((sentence, index) => {
        html += `<div class="sentence-item" data-index="${index}" onclick="toggleSentence(${index}, this)">
            <span class="sentence-number" id="num-${index}"></span>
            <span>${sentence}</span>
        </div>`;
    });
    
    html += `</div>
        <button class="cartoon-btn primary" style="margin-top: 20px;" onclick="checkSentenceOrder([${item.correctOrder.join(',')}])">確認答案</button>
    </div>`;
    
    container.innerHTML = html;
}

function toggleSentence(index, element) {
    const numBadge = document.getElementById(`num-${index}`);
    
    if (selectedSentences.includes(index)) {
        // Deselect
        selectedSentences = selectedSentences.filter(i => i !== index);
        element.classList.remove('selected');
        numBadge.textContent = '';
    } else {
        // Select
        selectedSentences.push(index);
        element.classList.add('selected');
        numBadge.textContent = selectedSentences.length;
    }
}

function checkSentenceOrder(correctOrder) {
    if (selectedSentences.length !== correctOrder.length) {
        xiaolanSay('請選擇所有句子！📋');
        return;
    }
    
    const isCorrect = JSON.stringify(selectedSentences) === JSON.stringify(correctOrder);
    
    if (isCorrect) {
        score++;
        stars++;
        document.getElementById('gameStars').textContent = stars;
        xiaolanSay('排對了！好厲害！🎉');
        setTimeout(() => showResults(true), 800);
    } else {
        xiaolanSay('順序不對哦，再試一次！🤔');
        selectedSentences = [];
        document.querySelectorAll('.sentence-item').forEach(item => {
            item.classList.remove('selected');
        });
        document.querySelectorAll('.sentence-number').forEach(num => {
            num.textContent = '';
        });
    }
}

// ===== LEVEL 6: 描紅練習 =====
function generateTracingGame(container) {
    document.getElementById('gameArea').classList.add('hidden');
    document.getElementById('hanziContainer').classList.remove('hidden');
    
    currentTracingIndex = 0;
    initHanziWriter(tracingChars[0]);
    
    xiaolanSay('跟著小嵐山一起寫「' + tracingChars[0] + '」字！✍️');
}

function initHanziWriter(char) {
    const container = document.getElementById('hanziWriter');
    container.innerHTML = '';
    
    // Create target display
    const targetDiv = document.createElement('div');
    targetDiv.className = 'tracing-target';
    targetDiv.textContent = '目標：' + char;
    container.appendChild(targetDiv);
    
    // Create writer div
    const writerDiv = document.createElement('div');
    writerDiv.id = 'writer-target';
    container.appendChild(writerDiv);
    
    // Initialize Hanzi Writer
    hanziWriter = HanziWriter.create('writer-target', char, {
        width: 250,
        height: 250,
        padding: 5,
        strokeAnimationSpeed: 1,
        delayBetweenStrokes: 500,
        strokeColor: '#333',
        radicalColor: '#166E16',
        highlightColor: '#FF8C42',
        outlineColor: '#DDD',
        drawingColor: '#333',
        showCharacter: false,
        showOutline: true,
        highlightOnComplete: true
    });
}

function nextTracing() {
    currentTracingIndex++;
    
    if (currentTracingIndex >= tracingChars.length) {
        // All characters done
        document.getElementById('hanziContainer').classList.add('hidden');
        document.getElementById('gameArea').classList.remove('hidden');
        showLevelComplete();
        return;
    }
    
    const char = tracingChars[currentTracingIndex];
    initHanziWriter(char);
    xiaolanSay('跟著小嵐山一起寫「' + char + '」字！✍️');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Load saved progress
    const saved = localStorage.getItem('xiaolanProgress');
    if (saved) {
        const progress = JSON.parse(saved);
        totalStars = progress.stars || 0;
        totalFish = progress.fish || 0;
        document.getElementById('totalStars').textContent = totalStars;
        document.getElementById('totalFish').textContent = totalFish;
    }
    
    // Save progress on unload
    window.addEventListener('beforeunload', () => {
        localStorage.setItem('xiaolanProgress', JSON.stringify({
            stars: totalStars,
            fish: totalFish
        }));
    });
    
    // Initial greeting
    setTimeout(() => {
        xiaolanSay('你好！我是小嵐山！🐱 一起來學中文吧！');
    }, 1000);
});
