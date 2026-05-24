// 游戏状态
let gameState = {
    gold: 0,
    miners: 0,
    clickPower: 1,
    minerPower: 1,
    gps: 0, // gold per second
    totalClicks: 0,
    totalMined: 0,
    playTime: 0
};

// 升级费用
let costs = {
    miner: 10,
    pickaxe: 50,
    minerPower: 100
};

// 加载游戏进度
function loadGame() {
    const saved = localStorage.getItem('idleGameSave');
    if (saved) {
        gameState = JSON.parse(saved);
        updateDisplay();
        showNotification('游戏进度已加载！');
    }
}

// 保存游戏进度
function saveGame() {
    localStorage.setItem('idleGameSave', JSON.stringify(gameState));
}

// 更新显示
function updateDisplay() {
    document.getElementById('gold').textContent = formatNumber(gameState.gold);
    document.getElementById('miners').textContent = gameState.miners;
    document.getElementById('gps').textContent = gameState.gps;
    document.getElementById('clickPower').textContent = gameState.clickPower;
    document.getElementById('totalClicks').textContent = formatNumber(gameState.totalClicks);
    document.getElementById('totalMined').textContent = formatNumber(gameState.totalMined);
    document.getElementById('playTime').textContent = gameState.playTime;

    // 更新费用显示
    document.getElementById('minerCost').textContent = formatNumber(costs.miner);
    document.getElementById('pickaxeCost').textContent = formatNumber(costs.pickaxe);
    document.getElementById('minerPowerCost').textContent = formatNumber(costs.minerPower);

    // 更新按钮状态
    updateButtonStates();
}

// 格式化数字（添加逗号分隔符）
function formatNumber(num) {
    return Math.floor(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// 更新按钮状态
function updateButtonStates() {
    const buttons = document.querySelectorAll('.buy-btn');
    buttons[0].disabled = gameState.gold < costs.miner;
    buttons[1].disabled = gameState.gold < costs.pickaxe;
    buttons[2].disabled = gameState.gold < costs.minerPower;
}

// 点击挖矿
function mine() {
    gameState.gold += gameState.clickPower;
    gameState.totalClicks++;
    gameState.totalMined += gameState.clickPower;

    // 点击动画
    const btn = document.getElementById('mineBtn');
    btn.classList.add('clicking');
    setTimeout(() => btn.classList.remove('clicking'), 100);

    // 创建浮动文字效果
    createFloatingText('+' + gameState.clickPower + ' 💰');

    updateDisplay();
    saveGame();
}

// 创建浮动文字效果
function createFloatingText(text) {
    const floating = document.createElement('div');
    floating.textContent = text;
    floating.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 2em;
        color: #667eea;
        font-weight: bold;
        pointer-events: none;
        animation: floatUp 1s ease-out forwards;
        z-index: 1000;
    `;
    document.body.appendChild(floating);
    setTimeout(() => floating.remove(), 1000);
}

// 雇佣矿工
function buyMiner() {
    if (gameState.gold >= costs.miner) {
        gameState.gold -= costs.miner;
        gameState.miners++;
        gameState.gps = gameState.miners * gameState.minerPower;
        costs.miner = Math.floor(costs.miner * 1.5);

        showNotification('雇佣了新矿工！⛏️');
        updateDisplay();
        saveGame();
    }
}

// 升级镐子
function upgradePickaxe() {
    if (gameState.gold >= costs.pickaxe) {
        gameState.gold -= costs.pickaxe;
        gameState.clickPower++;
        costs.pickaxe = Math.floor(costs.pickaxe * 2);

        showNotification('镐子升级！点击威力提升！⚒️');
        updateDisplay();
        saveGame();
    }
}

// 强化矿工
function upgradeMinerPower() {
    if (gameState.gold >= costs.minerPower) {
        gameState.gold -= costs.minerPower;
        gameState.minerPower *= 2;
        gameState.gps = gameState.miners * gameState.minerPower;
        costs.minerPower = Math.floor(costs.minerPower * 3);

        showNotification('矿工强化！效率翻倍！💪');
        updateDisplay();
        saveGame();
    }
}

// 显示通知
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// 自动产出（每秒）
setInterval(() => {
    if (gameState.miners > 0) {
        const earned = gameState.miners * gameState.minerPower;
        gameState.gold += earned;
        gameState.totalMined += earned;
        updateDisplay();
        saveGame();
    }
}, 1000);

// 游戏计时器
setInterval(() => {
    gameState.playTime++;
    document.getElementById('playTime').textContent = gameState.playTime;
}, 1000);

// 自动保存（每30秒）
setInterval(() => {
    saveGame();
}, 30000);

// 添加 CSS 动画
const style = document.createElement('style');
style.textContent = `
    @keyframes floatUp {
        0% {
            opacity: 1;
            transform: translate(-50%, -50%) translateY(0);
        }
        100% {
            opacity: 0;
            transform: translate(-50%, -50%) translateY(-100px);
        }
    }
`;
document.head.appendChild(style);

// 初始化游戏
window.onload = function() {
    loadGame();
    updateDisplay();
    showNotification('欢迎来到放置挖矿游戏！⛏️');
};

// 添加键盘快捷键
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        mine();
    }
});
