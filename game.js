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
        // 原有4个神器
        powerBook: 0,
        wealthMedal: 0,
        critEye: 0,
        hourglass: 0,
        
        // 新增36个神器
        attackSpeed: 0,
        fireSoul: 0,
        iceHeart: 0,
        lightning: 0,
        penetration: 0,
        berserk: 0,
        combo: 0,
        fatalBlow: 0,
        multiHit: 0,
        sharpness: 0,
        goldMagnet: 0,
        treasureMap: 0,
        luckyClover: 0,
        merchant: 0,
        idleGold: 0,
        alchemy: 0,
        thief: 0,
        doubleGold: 0,
        guardian: 0,
        thorns: 0,
        dodge: 0,
        regen: 0,
        stoneSkin: 0,
        manaShield: 0,
        expBoost: 0,
        cooldown: 0,
        moveSpeed: 0,
        manaRegen: 0,
        luck: 0,
        summon: 0,
        cleanse: 0,
        autoClick: 0,
        lifesteal: 0,
        explosion: 0,
        chainLightning: 0,
        poison: 0
    },
    totalDamage: 0,
    startTime: Date.now(),
    lastSaveTime: Date.now()
};

// 神器配置（40个）
const artifactConfig = [
    // 原有4个
    {id: 'powerBook', icon: '📖', name: '力量之书', desc: '所有伤害 +50%', baseCost: 10, costMult: 1.5, maxLevel: 100},
    {id: 'wealthMedal', icon: '🏅', name: '富豪勋章', desc: '重生后初始金币 +200%', baseCost: 50, costMult: 2, maxLevel: 50},
    {id: 'critEye', icon: '👁️', name: '暴击之眼', desc: '暴击率 +5%, 倍数 +2', baseCost: 100, costMult: 3, maxLevel: 20},
    {id: 'hourglass', icon: '⏳', name: '时间沙漏', desc: '离线收益 50% DPS', baseCost: 200, costMult: 2, maxLevel: 10},
    
    // 伤害类10个
    {id: 'attackSpeed', icon: '⚡', name: '攻击速度之书', desc: '攻击速度 +10%', baseCost: 30, costMult: 1.8, maxLevel: 50},
    {id: 'fireSoul', icon: '🔥', name: '火焰之魂', desc: '火焰伤害 +100%', baseCost: 80, costMult: 2.5, maxLevel: 20},
    {id: 'iceHeart', icon: '❄️', name: '冰霜之心', desc: '冰霜伤害 +100%', baseCost: 80, costMult: 2.5, maxLevel: 20},
    {id: 'lightning', icon: '⚡', name: '雷电之怒', desc: '雷电伤害 +100%', baseCost: 80, costMult: 2.5, maxLevel: 20},
    {id: 'penetration', icon: '🗡️', name: '穿透之矛', desc: '护甲穿透 +10%', baseCost: 60, costMult: 2, maxLevel: 30},
    {id: 'berserk', icon: '😡', name: '狂暴之斧', desc: 'HP<30%时伤害 +50%', baseCost: 150, costMult: 3, maxLevel: 10},
    {id: 'combo', icon: '👊', name: '连击手套', desc: '双击概率 +10%', baseCost: 120, costMult: 2.5, maxLevel: 20},
    {id: 'fatalBlow', icon: '💀', name: '致命打击', desc: '暴击伤害 +50%', baseCost: 200, costMult: 3, maxLevel: 10},
    {id: 'multiHit', icon: '🎯', name: '多重打击', desc: '额外攻击次数 +1', baseCost: 500, costMult: 5, maxLevel: 5},
    {id: 'sharpness', icon: '🐾', name: '锋利之爪', desc: '基础伤害 +25%', baseCost: 40, costMult: 2, maxLevel: 40},
    
    // 金币类8个
    {id: 'goldMagnet', icon: '🧲', name: '金币磁铁', desc: '金币掉落 +50%', baseCost: 25, costMult: 1.8, maxLevel: 50},
    {id: 'treasureMap', icon: '🗺️', name: '宝藏地图', desc: '击杀金币 +50%', baseCost: 35, costMult: 2, maxLevel: 40},
    {id: 'luckyClover', icon: '🍀', name: '幸运四叶草', desc: '稀有掉落 +10%', baseCost: 100, costMult: 3, maxLevel: 20},
    {id: 'merchant', icon: '💼', name: '商人条约', desc: '出售价值 +100%', baseCost: 60, costMult: 2.5, maxLevel: 30},
    {id: 'idleGold', icon: '🏦', name: '银行家保险箱', desc: '离线金币 +100%', baseCost: 150, costMult: 2.5, maxLevel: 20},
    {id: 'alchemy', icon: '⚗️', name: '炼金术士之石', desc: '炼金收益 +50%', baseCost: 90, costMult: 2.2, maxLevel: 25},
    {id: 'thief', icon: '🗡️', name: '盗贼手套', desc: '暴击偷取金币 +10%', baseCost: 180, costMult: 3, maxLevel: 15},
    {id: 'doubleGold', icon: '✨', name: '黄金双倍', desc: '金币获取 ×2', baseCost: 1000, costMult: 10, maxLevel: 3},
    
    // 防御类6个
    {id: 'guardian', icon: '🛡️', name: '守护者之盾', desc: '最大生命 +50%', baseCost: 50, costMult: 2, maxLevel: 40},
    {id: 'thorns', icon: '🌹', name: '荆棘之甲', desc: '反弹10%伤害', baseCost: 120, costMult: 2.8, maxLevel: 25},
    {id: 'dodge', icon: '👟', name: '闪避之靴', desc: '闪避率 +10%', baseCost: 80, costMult: 2.5, maxLevel: 30},
    {id: 'regen', icon: '💚', name: '再生之戒', desc: '每秒回复1%生命', baseCost: 200, costMult: 3, maxLevel: 20},
    {id: 'stoneSkin', icon: '🪨', name: '石头之肤', desc: '伤害减免 +10%', baseCost: 100, costMult: 2.2, maxLevel: 30},
    {id: 'manaShield', icon: '🔮', name: '魔法屏障', desc: '魔法护盾 +50%', baseCost: 250, costMult: 3.5, maxLevel: 15},
    
    // Utility类8个
    {id: 'expBoost', icon: '📚', name: '经验之书', desc: '经验获取 +50%', baseCost: 40, costMult: 1.8, maxLevel: 50},
    {id: 'cooldown', icon: '💎', name: '冷却缩减宝石', desc: '技能冷却 -10%', baseCost: 150, costMult: 3, maxLevel: 20},
    {id: 'moveSpeed', icon: '🏃', name: '移动之靴', desc: '移动速度 +20%', baseCost: 30, costMult: 1.5, maxLevel: 50},
    {id: 'manaRegen', icon: '💧', name: '魔力源泉', desc: '魔力回复 +50%', baseCost: 100, costMult: 2, maxLevel: 30},
    {id: 'luck', icon: '🎲', name: '幸运饼干', desc: '随机Buff概率 +10%', baseCost: 200, costMult: 4, maxLevel: 10},
    {id: 'summon', icon: '🐾', name: '召唤卷轴', desc: '召唤随从概率 +5%', baseCost: 300, costMult: 5, maxLevel: 10},
    {id: 'cleanse', icon: '🧼', name: '净化护符', desc: 'Debuff持续时间 -50%', baseCost: 80, costMult: 2, maxLevel: 20},
    {id: 'autoClick', icon: '🤖', name: '自动点击器', desc: '自动点击 +1次/秒', baseCost: 500, costMult: 4, maxLevel: 10},
    
    // 特殊能力类4个
    {id: 'lifesteal', icon: '🧛', name: '吸血鬼之牙', desc: '生命偷取 +5%', baseCost: 250, costMult: 3.5, maxLevel: 15},
    {id: 'explosion', icon: '💥', name: '爆裂护符', desc: '击杀爆炸 +50%伤害', baseCost: 350, costMult: 4, maxLevel: 10},
    {id: 'chainLightning', icon: '⛓️', name: '连锁闪电之球', desc: '连锁3个目标', baseCost: 400, costMult: 5, maxLevel: 8},
    {id: 'poison', icon: '☠️', name: '剧毒之囊', desc: '中毒伤害 +50%/5秒', baseCost: 180, costMult: 2.8, maxLevel: 20}
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
    setInterval(saveGame, 30000);
}

// 检查离线收益
function checkOfflineGains() {
    if (gameState.hourglass > 0 && gameState.lastSaveTime) {
        const now = Date.now();
        const offlineSeconds = Math.floor((now - gameState.lastSaveTime) / 1000);
        
        if (offlineSeconds > 60) {
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
    
    // 力量之书
    if (gameState.artifacts.powerBook > 0) {
        damage *= Math.pow(1.5, gameState.artifacts.powerBook);
    }
    
    // 锋利之爪
    if (gameState.artifacts.sharpness > 0) {
        damage *= Math.pow(1.25, gameState.artifacts.sharpness);
    }
    
    // 攻击速度（多重点击）
    let hits = 1;
    if (gameState.artifacts.attackSpeed > 0) {
        hits += Math.floor(gameState.artifacts.attackSpeed * 0.1);
    }
    
    // 多重打击
    if (gameState.artifacts.multiHit > 0) {
        hits += gameState.artifacts.multiHit;
    }
    
    // 连击（双击）
    if (gameState.artifacts.combo > 0) {
        for (let i = 0; i < hits; i++) {
            if (Math.random() < gameState.artifacts.combo * 0.1) {
                hits++;
            }
        }
    }
    
    // 暴击判定
    let isCrit = false;
    let critMultiplier = 1;
    if (gameState.artifacts.critEye > 0) {
        const critChance = 0.05 * gameState.artifacts.critEye;
        if (Math.random() < critChance) {
            critMultiplier = 5 + (gameState.artifacts.critEye - 1) * 2;
            // 致命打击
            if (gameState.artifacts.fatalBlow > 0) {
                critMultiplier *= Math.pow(1.5, gameState.artifacts.fatalBlow);
            }
            isCrit = true;
        }
    }
    
    damage *= critMultiplier;
    
    // 元素伤害
    if (gameState.artifacts.fireSoul > 0) {
        damage *= Math.pow(2, gameState.artifacts.fireSoul);
    }
    
    // 狂暴之斧
    if (gameState.artifacts.berserk > 0 && gameState.currentHP < gameState.maxHP * 0.3) {
        damage *= Math.pow(1.5, gameState.artifacts.berserk);
    }
    
    // 应用伤害（多次命中）
    for (let i = 0; i < hits; i++) {
        gameState.currentHP -= damage;
        gameState.totalDamage += damage;
        
        if (i === 0) {
            showDamageNumber(damage * hits, event.clientX, event.clientY, isCrit);
        }
    }
    
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
    const goldReward = gameState.level * 10 + Math.floor(gameState.maxHP * 0.01);
    let finalGold = goldReward;
    
    // 金币加成
    if (gameState.artifacts.goldMagnet > 0) {
        finalGold *= Math.pow(1.5, gameState.artifacts.goldMagnet);
    }
    if (gameState.artifacts.treasureMap > 0) {
        finalGold *= Math.pow(1.5, gameState.artifacts.treasureMap);
    }
    if (gameState.artifacts.doubleGold > 0) {
        finalGold *= Math.pow(2, gameState.artifacts.doubleGold);
    }
    
    gameState.gold += Math.floor(finalGold);
    
    gameState.level++;
    if (gameState.level > gameState.maxLevel) {
        gameState.maxLevel = gameState.level;
    }
    
    updateBoss();
    showNotification(`击杀Boss! +${formatNumber(Math.floor(finalGold))} 💰`);
    updateDisplay();
}

// 更新Boss
function updateBoss() {
    gameState.maxHP = Math.floor(100 * Math.pow(1.8, gameState.level - 1));
    
    gameState.currentHP = gameState.maxHP;
    
    const bossNames = [
        "燃气表-I型 基本型", "燃气表-II型 标准型", "燃气表-III型 智能型",
        "燃气表-IV型 工业型", "燃气表-V型 商用型", "燃气表-VI型 高精度型",
        "燃气表-VII型 远程型", "燃气表-VIII型 防爆型", "燃气表-IX型 大流量型",
        "燃气表-X型 智能远传型"
    ];
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
        gameState.clickDamage = gameState.clickLevel;
        
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
        gameState.dps = gameState.dpsLevel;
        
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
            
            if (gameState.artifacts.powerBook > 0) {
                damage *= Math.pow(1.5, gameState.artifacts.powerBook);
            }
            
            if (gameState.artifacts.sharpness > 0) {
                damage *= Math.pow(1.25, gameState.artifacts.sharpness);
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

// 打开神器模态窗口
function openArtifactModal() {
    renderArtifacts();
    document.getElementById('artifactModal').classList.add('active');
}

// 关闭神器模态窗口
function closeArtifactModal() {
    document.getElementById('artifactModal').classList.remove('active');
    updateDisplay(); // 关闭时刷新主界面
}

// 渲染神器（在模态窗口中）
function renderArtifacts() {
    const grid = document.getElementById('artifactGrid');
    grid.innerHTML = '';
    
    artifactConfig.forEach(artifact => {
        const level = gameState.artifacts[artifact.id] || 0;
        const cost = Math.floor(artifact.baseCost * Math.pow(artifact.costMult, level));
        const isMaxLevel = level >= artifact.maxLevel;
        
        const card = document.createElement('div');
        card.className = 'artifact-card';
        card.innerHTML = `
            <div class="artifact-icon">${artifact.icon}</div>
            <div class="artifact-info">
                <div class="artifact-name">${artifact.name}</div>
                <div class="artifact-level">等级: ${level}/${artifact.maxLevel}</div>
                <div class="artifact-desc">${artifact.desc}</div>
            </div>
            <button class="artifact-buy-btn" onclick="buyArtifact('${artifact.id}')" 
                    ${gameState.artifactPoints >= cost && !isMaxLevel ? '' : 'disabled'}>
                ${isMaxLevel ? 'MAX' : `升级 (${formatNumber(cost)} 点)`}
            </button>
        `;
        grid.appendChild(card);
    });
    
    document.getElementById('artifactPointsDisplay').textContent = formatNumber(gameState.artifactPoints);
}

// 购买/升级神器
function buyArtifact(artifactId) {
    const artifact = artifactConfig.find(a => a.id === artifactId);
    const level = gameState.artifacts[artifactId] || 0;
    
    if (level >= artifact.maxLevel) {
        showNotification('已达到最高等级!');
        return;
    }
    
    const cost = Math.floor(artifact.baseCost * Math.pow(artifact.costMult, level));
    
    if (gameState.artifactPoints >= cost) {
        gameState.artifactPoints -= cost;
        gameState.artifacts[artifactId]++;
        
        showNotification(`神器升级: ${artifact.name}!`);
        renderArtifacts();
        updateDisplay();
        saveGame();
    } else {
        showNotification('神器点不足!');
    }
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
    
    gameState.artifactPoints += reward;
    
    const savedArtifacts = {...gameState.artifacts};
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
    
    // 富豪勋章
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
    document.getElementById('artifactPoints').textContent = formatNumber(gameState.artifactPoints);
    
    document.getElementById('rebirthBtn').disabled = gameState.maxLevel < 10;
    
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
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(212, 175, 55, 0.9);
        color: #1a1a1a;
        padding: 15px 30px;
        border-radius: 10px;
        font-weight: bold;
        z-index: 10000;
        animation: fadeInOut 3s ease;
    `;
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
        gameState = {...gameState, ...loaded};
        
        // 确保新字段存在
        if (!gameState.artifacts) {
            gameState.artifacts = {
                powerBook: 0, wealthMedal: 0, critEye: 0, hourglass: 0,
                attackSpeed: 0, fireSoul: 0, iceHeart: 0, lightning: 0,
                penetration: 0, berserk: 0, combo: 0, fatalBlow: 0,
                multiHit: 0, sharpness: 0, goldMagnet: 0, treasureMap: 0,
                luckyClover: 0, merchant: 0, idleGold: 0, alchemy: 0,
                thief: 0, doubleGold: 0, guardian: 0, thorns: 0,
                dodge: 0, regen: 0, stoneSkin: 0, manaShield: 0,
                expBoost: 0, cooldown: 0, moveSpeed: 0, manaRegen: 0,
                luck: 0, summon: 0, cleanse: 0, autoClick: 0,
                lifesteal: 0, explosion: 0, chainLightning: 0, poison: 0
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
