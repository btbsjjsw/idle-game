// 游戏状态
let gameState = {
    gold: 0,
    level: 1,
    maxLevel: 1,
    clickDamage: 1,
    clickLevel: 1,
    dps: 0,
    dpsLevel: 0,
    currentHP: 100,
    maxHP: 100,
    artifactPoints: 0,
    artifacts: {
        powerBook: 0,      // 力量之书：所有伤害 +50%
        wealthMedal: 0,     // 富豪勋章：初始金币 +200%
        critEye: 0,         // 暴击之眼：暴击率 +5%，倍数 +2
        hourglass: 0         // 时间沙漏：离线收益
    },
    totalDamage: 0,
    startTime: Date.now(),
    lastSaveTime: Date.now()
};

// Boss名字列表（燃气表型号）
const bossNames = [
    "燃气表-I型 基本型",
    "燃气表-II型 标准型",
    "燃气表-III型 智能型",
    "燃气表-IV型 工业型",
    "燃气表-V型 商用型",
    "燃气表-VI型 高精度型",
    "燃气表-VII型 远程型",
    "燃气表-VIII型 防爆型",
    "燃气表-IX型 大流量型",
    "燃气表-X型 智能远传型"
];

// 初始化游戏
function initGame() {
    loadGame();
    updateBoss();
    updateDisplay();
    renderArtifacts();
    startAutoAttack();
    startGameTimer();
    checkOfflineGains();
    setInterval(saveGame, 30000); // 每30秒自动保存
}

// 检查离线收益
function checkOfflineGains() {
    if (gameState.hourglass > 0 && gameState.lastSaveTime) {
        const now = Date.now();
        const offlineSeconds = Math.floor((now - gameState.lastSaveTime) / 1000);
        
        if (offlineSeconds > 60) { // 离线超过1分钟才计算
            const offlineGains = Math.floor(gameState.dps * 0.5 * offlineSeconds);
            if (offlineGains > 0) {
                gameState.gold += offlineGains;
                showNotification(`离线收益: +${formatNumber(offlineGains)} 💰`);
                updateDisplay();
            }
        }
    }
}

// 攻击Boss
function attackBoss(event) {
    let damage = gameState.clickDamage;
    
    // 计算神器加成
    if (gameState.artifacts.powerBook > 0) {
        damage *= Math.pow(1.5, gameState.artifacts.powerBook);
    }
    
    // 暴击判定
    let isCrit = false;
    if (gameState.artifacts.critEye > 0) {
        const critChance = 0.05 * gameState.artifacts.critEye;
        if (Math.random() < critChance) {
            const critMultiplier = 5 + (gameState.artifacts.critEye - 1) * 2;
            damage *= critMultiplier;
            isCrit = true;
        }
    }
    
    // 应用伤害
    gameState.currentHP -= damage;
    gameState.totalDamage += damage;
    
    // 显示伤害数字
    showDamageNumber(damage, event.clientX, event.clientY, isCrit);
    
    // Boss受击动画
    const bossIcon = document.getElementById('bossIcon');
    bossIcon.classList.add('hit');
    setTimeout(() => bossIcon.classList.remove('hit'), 200);
    
    // 检查Boss是否死亡
    if (gameState.currentHP <= 0) {
        killBoss();
    }
    
    updateHPBar();
    saveGame();
}

// 显示伤害数字
function showDamageNumber(damage, x, y, isCrit) {
    const dmgFloat = document.createElement('div');
    dmgFloat.className = 'damage-float';
    dmgFloat.textContent = formatNumber(Math.floor(damage));
    dmgFloat.style.left = x + 'px';
    dmgFloat.style.top = y + 'px';
    
    if (isCrit) {
        dmgFloat.style.color = '#ff0000';
        dmgFloat.style.fontSize = '3em';
        dmgFloat.textContent = '暴击! ' + dmgFloat.textContent;
    }
    
    document.body.appendChild(dmgFloat);
    setTimeout(() => dmgFloat.remove(), 1000);
}

// 击杀Boss
function killBoss() {
    // 计算奖励金币
    const goldReward = gameState.level * 10 + Math.floor(gameState.maxHP * 0.01);
    gameState.gold += goldReward;
    
    // 进入下一关
    gameState.level++;
    if (gameState.level > gameState.maxLevel) {
        gameState.maxLevel = gameState.level;
    }
    
    // 更新Boss
    updateBoss();
    
    // 显示奖励
    showNotification(`击杀Boss! +${formatNumber(goldReward)} 💰`);
    
    updateDisplay();
}

// 更新Boss
function updateBoss() {
    // Boss血量指数增长
    gameState.maxHP = Math.floor(100 * Math.pow(1.8, gameState.level - 1));
    gameState.currentHP = gameState.maxHP;
    
    // Boss名字（循环使用列表）
    const bossIndex = (gameState.level - 1) % bossNames.length;
    document.getElementById('bossName').textContent = bossNames[bossIndex];
    document.getElementById('bossLevel').textContent = gameState.level;
    
    updateHPBar();
}

// 更新血条
function updateHPBar() {
    const hpPercent = (gameState.currentHP / gameState.maxHP) * 100;
    document.getElementById('hpFill').style.width = hpPercent + '%';
    document.getElementById('currentHP').textContent = formatNumber(Math.floor(gameState.currentHP));
    document.getElementById('maxHP').textContent = formatNumber(gameState.maxHP);
}

// 升级点击伤害
function upgradeClick() {
    const cost = Math.floor(10 * Math.pow(gameState.clickLevel, 1.5));
    
    if (gameState.gold >= cost) {
        gameState.gold -= cost;
        gameState.clickLevel++;
        gameState.clickDamage = gameState.clickLevel; // 简单公式：点击伤害 = 等级
        
        showNotification('点击伤害提升!');
        updateDisplay();
        saveGame();
    }
}

// 升级秒伤
function upgradeDPS() {
    const cost = Math.floor(10 * Math.pow(gameState.dpsLevel, 1.5));
    
    if (gameState.gold >= cost) {
        gameState.gold -= cost;
        gameState.dpsLevel++;
        gameState.dps = gameState.dpsLevel; // 简单公式：DPS = 等级
        
        showNotification('每秒伤害提升!');
        updateDisplay();
        saveGame();
    }
}

// 自动攻击
function startAutoAttack() {
    setInterval(() => {
        if (gameState.dps > 0) {
            let damage = gameState.dps;
            
            // 计算神器加成
            if (gameState.artifacts.powerBook > 0) {
                damage *= Math.pow(1.5, gameState.artifacts.powerBook);
            }
            
            gameState.currentHP -= damage;
            gameState.totalDamage += damage;
            
            if (gameState.currentHP <= 0) {
                killBoss();
            }
            
            updateHPBar();
            updateDisplay();
        }
    }, 1000);
}

// 打开重生确认框
function openRebirthModal() {
    if (gameState.maxLevel < 10) {
        showNotification('需要达到第10关才能重生!');
        return;
    }
    
    const reward = Math.floor(Math.pow(gameState.maxLevel, 0.7)) * 5;
    document.getElementById('rebirthReward').textContent = reward;
    document.getElementById('rebirthModal').classList.add('active');
}

// 关闭重生确认框
function closeRebirthModal() {
    document.getElementById('rebirthModal').classList.remove('active');
}

// 执行重生
function rebirth() {
    const reward = Math.floor(Math.pow(gameState.maxLevel, 0.7)) * 5;
    
    // 获得神器点
    gameState.artifactPoints += reward;
    
    // 重置游戏状态（保留神器）
    const savedArtifacts = { ...gameState.artifacts };
    const savedArtifactPoints = gameState.artifactPoints;
    
    gameState = {
        gold: 0,
        level: 1,
        maxLevel: 1,
        clickDamage: 1,
        clickLevel: 1,
        dps: 0,
        dpsLevel: 0,
        currentHP: 100,
        maxHP: 100,
        artifactPoints: savedArtifactPoints,
        artifacts: savedArtifacts,
        totalDamage: 0,
        startTime: Date.now(),
        lastSaveTime: Date.now()
    };
    
    // 计算初始金币加成
    if (gameState.artifacts.wealthMedal > 0) {
        gameState.gold = Math.floor(200 * gameState.artifacts.wealthMedal);
    }
    
    closeRebirthModal();
    updateBoss();
    updateDisplay();
    renderArtifacts();
    showNotification(`重生成功! 获得 ${reward} 神器点!`);
    saveGame();
}

// 渲染神器商店
function renderArtifacts() {
    const grid = document.getElementById('artifactGrid');
    grid.innerHTML = '';
    
    const artifacts = [
        {
            id: 'powerBook',
            icon: '📖',
            name: '力量之书',
            desc: '所有伤害 +50% (乘法叠加)',
            level: gameState.artifacts.powerBook,
            cost: Math.floor(10 * Math.pow(1.5, gameState.artifacts.powerBook))
        },
        {
            id: 'wealthMedal',
            icon: '🏅',
            name: '富豪勋章',
            desc: '重生后初始金币 +200%',
            level: gameState.artifacts.wealthMedal,
            cost: Math.floor(50 * Math.pow(2, gameState.artifacts.wealthMedal))
        },
        {
            id: 'critEye',
            icon: '👁️',
            name: '暴击之眼',
            desc: '点击暴击率 +5%, 倍数 +2',
            level: gameState.artifacts.critEye,
            cost: Math.floor(100 * Math.pow(3, gameState.artifacts.critEye))
        },
        {
            id: 'hourglass',
            icon: '⏳',
            name: '时间沙漏',
            desc: '离线收益 50% DPS',
            level: gameState.artifacts.hourglass,
            cost: Math.floor(200 * Math.pow(2, gameState.artifacts.hourglass))
        }
    ];
    
    artifacts.forEach(artifact => {
        const card = document.createElement('div');
        card.className = 'artifact-card';
        card.innerHTML = `
            <div class="artifact-icon">${artifact.icon}</div>
            <div class="artifact-name">${artifact.name}</div>
            <div class="artifact-level">等级: ${artifact.level}</div>
            <div class="artifact-desc">${artifact.desc}</div>
            <button class="artifact-buy-btn" onclick="buyArtifact('${artifact.id}')" 
                    ${gameState.artifactPoints >= artifact.cost ? '' : 'disabled'}>
                购买 (${artifact.cost} 点)
            </button>
        `;
        grid.appendChild(card);
    });
}

// 购买神器
function buyArtifact(artifactId) {
    const artifact = gameState.artifacts[artifactId];
    let cost;
    
    switch(artifactId) {
        case 'powerBook':
            cost = Math.floor(10 * Math.pow(1.5, artifact));
            break;
        case 'wealthMedal':
            cost = Math.floor(50 * Math.pow(2, artifact));
            break;
        case 'critEye':
            cost = Math.floor(100 * Math.pow(3, artifact));
            break;
        case 'hourglass':
            cost = Math.floor(200 * Math.pow(2, artifact));
            break;
    }
    
    if (gameState.artifactPoints >= cost) {
        gameState.artifactPoints -= cost;
        gameState.artifacts[artifactId]++;
        
        showNotification(`神器升级: ${artifactId}!`);
        renderArtifacts();
        updateDisplay();
        saveGame();
    }
}

// 更新显示
function updateDisplay() {
    document.getElementById('gold').textContent = formatNumber(gameState.gold);
    document.getElementById('currentLevel').textContent = gameState.level;
    document.getElementById('clickDamage').textContent = formatNumber(gameState.clickDamage);
    document.getElementById('dps').textContent = formatNumber(gameState.dps);
    document.getElementById('clickCost').textContent = formatNumber(Math.floor(10 * Math.pow(gameState.clickLevel, 1.5)));
    document.getElementById('dpsCost').textContent = formatNumber(Math.floor(10 * Math.pow(gameState.dpsLevel, 1.5)));
    document.getElementById('clickLevel').textContent = gameState.clickLevel;
    document.getElementById('dpsLevel').textContent = gameState.dpsLevel;
    document.getElementById('artifactPoints').textContent = gameState.artifactPoints;
    
    // 重生按钮状态
    document.getElementById('rebirthBtn').disabled = gameState.maxLevel < 10;
    
    // 更新按钮状态
    document.querySelectorAll('.upgrade-btn')[0].disabled = gameState.gold < Math.floor(10 * Math.pow(gameState.clickLevel, 1.5));
    document.querySelectorAll('.upgrade-btn')[1].disabled = gameState.gold < Math.floor(10 * Math.pow(gameState.dpsLevel, 1.5));
}

// 格式化数字
function formatNumber(num) {
    if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return Math.floor(num).toString();
}

// 显示通知
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// 保存游戏
function saveGame() {
    gameState.lastSaveTime = Date.now();
    localStorage.setItem('bossRPGSave', JSON.stringify(gameState));
}

// 加载游戏
function loadGame() {
    const saved = localStorage.getItem('bossRPGSave');
    if (saved) {
        const loaded = JSON.parse(saved);
        gameState = { ...gameState, ...loaded };
        
        // 确保新字段存在（向后兼容）
        if (!gameState.artifacts) {
            gameState.artifacts = {
                powerBook: 0,
                wealthMedal: 0,
                critEye: 0,
                hourglass: 0
            };
        }
        if (!gameState.lastSaveTime) {
            gameState.lastSaveTime = Date.now();
        }
    }
}

// 游戏计时器
function startGameTimer() {
    setInterval(() => {
        // 可以在这里添加游戏时间相关的逻辑
    }, 1000);
}

// 键盘快捷键
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        document.getElementById('bossClickArea').click();
    }
});

// 初始化
window.onload = initGame;
