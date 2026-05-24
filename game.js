// 全局定时器（防止重生/重置后重复创建）
const _timers = {};
function safeInterval(key, fn, ms) {
    if (_timers[key]) clearInterval(_timers[key]);
    _timers[key] = setInterval(fn, ms);
}

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
    playerMaxHp: 500,  // 基础血量500
    playerCurrentHp: 500,
    rebirthPoints: 0,   // 重生点（重生获得，买宠物用，永久保留）
    totalRebirths: 0,   // 累计重生次数
    artifacts: {},
    equipment: {
        weapon: null,
        helmet: null,
        armor: null,
        ring: null,
        necklace: null,
        boots: null
    },
    inventory: [],
    pets: {},
    activePet: null,
    totalDamage: 0,
    totalBossKills: 0,
    startTime: Date.now(),
    lastSaveTime: Date.now()
};

// ===== 实时DPS追踪器 =====
const dpsTracker = {
    damageLog: [],      // 最近N次伤害记录 [{damage, timestamp}]
    maxEntries: 20,     // 保留最近20次
    lastDps: 0,         // 上次计算的DPS
    addDamage(dmg) {
        this.damageLog.push({ damage: dmg, timestamp: Date.now() });
        if (this.damageLog.length > this.maxEntries) this.damageLog.shift();
    },
    getRealDps() {
        const now = Date.now();
        // 只算最近3秒的伤害
        this.damageLog = this.damageLog.filter(e => now - e.timestamp < 3000);
        if (this.damageLog.length < 2) return this.lastDps;
        const totalDmg = this.damageLog.reduce((s, e) => s + e.damage, 0);
        const timeSpan = (now - this.damageLog[0].timestamp) / 1000;
        if (timeSpan < 0.1) return this.lastDps;
        this.lastDps = Math.floor(totalDmg / timeSpan);
        return this.lastDps;
    }
};

// 神器配置（优化版 - 所有神器都有实际效果）
const artifactConfig = [
    // === 伤害类 ===
    {id: 'powerBook', icon: '📖', name: '力量之书', desc: '所有伤害 +50%', baseCost: 10, costMult: 1.5, maxLevel: 100},
    {id: 'sharpness', icon: '🗡️', name: '锋利之爪', desc: '基础伤害 +25%', baseCost: 40, costMult: 2, maxLevel: 40},
    {id: 'critEye', icon: '👁️', name: '暴击之眼', desc: '暴击率 +5%, 倍率 +2', baseCost: 100, costMult: 3, maxLevel: 20},
    {id: 'fatalBlow', icon: '💀', name: '致命打击', desc: '暴击伤害 +50%', baseCost: 200, costMult: 3, maxLevel: 10},
    {id: 'multiHit', icon: '🎯', name: '多重打击', desc: '额外攻击 +1次', baseCost: 500, costMult: 5, maxLevel: 5},
    {id: 'combo', icon: '👊', name: '连击手套', desc: '连击概率 +10%', baseCost: 120, costMult: 2.5, maxLevel: 20},
    
    // === 元素伤害类 ===
    {id: 'fireSoul', icon: '🔥', name: '火焰之魂', desc: '🔥火焰伤害 ×2', baseCost: 80, costMult: 2.5, maxLevel: 20},
    {id: 'iceHeart', icon: '❄️', name: '冰霜之心', desc: '❄️冰冻伤害 ×2', baseCost: 80, costMult: 2.5, maxLevel: 20},
    {id: 'lightning', icon: '⚡', name: '雷电之怒', desc: '💜闪电伤害 ×2', baseCost: 80, costMult: 2.5, maxLevel: 20},
    {id: 'poison', icon: '☠️', name: '剧毒之囊', desc: '☠️持续毒伤 +50%', baseCost: 180, costMult: 2.8, maxLevel: 20},
    {id: 'explosion', icon: '💥', name: '爆裂护符', desc: '💥击杀爆炸伤害', baseCost: 350, costMult: 4, maxLevel: 10},
    {id: 'chainLightning', icon: '⛓️', name: '连锁闪电', desc: '⚡连锁闪电伤害', baseCost: 400, costMult: 5, maxLevel: 8},
    
    // === 攻击速度类 ===
    {id: 'attackSpeed', icon: '⚡', name: '攻击速度', desc: '攻速 +10%', baseCost: 30, costMult: 1.8, maxLevel: 50},
    {id: 'autoClick', icon: '🤖', name: '自动点击器', desc: '🤖自动攻击', baseCost: 500, costMult: 4, maxLevel: 10},
    
    // === 防御类 ===
    {id: 'guardian', icon: '🛡️', name: '守护者之盾', desc: '最大生命 +50%', baseCost: 50, costMult: 2, maxLevel: 40},
    {id: 'stoneSkin', icon: '🪨', name: '石头之肤', desc: '伤害减免 +10%', baseCost: 100, costMult: 2.2, maxLevel: 30},
    {id: 'thorns', icon: '🌹', name: '荆棘之甲', desc: '🌹反弹伤害', baseCost: 120, costMult: 2.8, maxLevel: 25},
    {id: 'dodge', icon: '👟', name: '闪避之靴', desc: '闪避率 +10%', baseCost: 80, costMult: 2.5, maxLevel: 30},
    {id: 'regen', icon: '💚', name: '再生之戒', desc: '💚生命回复', baseCost: 200, costMult: 3, maxLevel: 20},
    {id: 'berserk', icon: '😡', name: '狂暴之斧', desc: '😡血量低时伤害+', baseCost: 150, costMult: 3, maxLevel: 10},
    
    // === 金币类 ===
    {id: 'goldMagnet', icon: '🧲', name: '金币磁铁', desc: '💰金币 +50%', baseCost: 25, costMult: 1.8, maxLevel: 50},
    {id: 'treasureMap', icon: '🗺️', name: '宝藏地图', desc: '💰击杀金币 +50%', baseCost: 35, costMult: 2, maxLevel: 40},
    {id: 'doubleGold', icon: '✨', name: '黄金双倍', desc: '💰金币 ×2', baseCost: 1000, costMult: 10, maxLevel: 3},
    {id: 'wealthMedal', icon: '🏅', name: '富豪勋章', desc: '🏅初始金币 +200%', baseCost: 50, costMult: 2, maxLevel: 50},
    {id: 'hourglass', icon: '⏳', name: '时间沙漏', desc: '⏳离线收益', baseCost: 200, costMult: 2, maxLevel: 10},
    
    // === 掉落类 ===
    {id: 'luckyClover', icon: '🍀', name: '幸运四叶草', desc: '🍀掉落概率 +10%', baseCost: 100, costMult: 3, maxLevel: 20},
    {id: 'thief', icon: '🗝️', name: '盗贼手套', desc: '🗝️暴击偷金币', baseCost: 180, costMult: 3, maxLevel: 15},
    
    // === 特殊类 ===
    {id: 'lifesteal', icon: '🧛', name: '吸血鬼之牙', desc: '🧛生命偷取 +5%', baseCost: 250, costMult: 3.5, maxLevel: 15},
    {id: 'allDamage', icon: '🌟', name: '全能戒指', desc: '全伤害 +50%', baseCost: 500, costMult: 5, maxLevel: 20}
];

// 简化版神器配置映射（用于快速访问效果）
const artifactEffects = {
    fireSoul: {name: '火焰之魂', effect: 'fire', multiplier: 2},
    iceHeart: {name: '冰霜之心', effect: 'ice', multiplier: 2},
    lightning: {name: '雷电之怒', effect: 'lightning', multiplier: 2},
    poison: {name: '剧毒之囊', effect: 'poison', multiplier: 1.5},
    explosion: {name: '爆裂护符', effect: 'explosion', multiplier: 1.5},
    chainLightning: {name: '连锁闪电', effect: 'chainLightning', multiplier: 0.5}
};

// 装备配置
// ===== 神话装备特殊能力列表 =====
const mythicAbilities = [
    { id: 'myth_atk1', name: '毁灭打击', icon: '💥', desc: '攻击力 +100%', effect: { damageBoost: 1.0 } },
    { id: 'myth_atk2', name: '致命一击', icon: '⚔️', desc: '暴击伤害 +200%', effect: { critDamageBonus: 200 } },
    { id: 'myth_atk3', name: '嗜血狂暴', icon: '🩸', desc: '生命偷取 +30%', effect: { lifestealBonus: 30 } },
    { id: 'myth_atk4', name: '闪电风暴', icon: '⚡', desc: '攻击时 20% 连锁闪电', effect: { chainLightning: 0.2 } },
    { id: 'myth_atk5', name: '火焰灼烧', icon: '🔥', desc: '攻击附加 50% 火焰伤害', effect: { fireBonus: 0.5 } },
    { id: 'myth_atk6', name: '冰霜冻结', icon: '❄️', desc: '攻击时 30% 减速Boss', effect: { slowBoss: 0.3 } },
    { id: 'myth_atk7', name: '连击精通', icon: '🎯', desc: '攻击次数 +100%', effect: { attackCountBonus: 1.0 } },
    { id: 'myth_def1', name: '神圣护盾', icon: '🛡️', desc: '受到伤害 -50%', effect: { damageReduceAll: 0.5 } },
    { id: 'myth_def2', name: '反伤甲胄', icon: '⚡', desc: '反弹受到伤害的 30%', effect: { thornsBonus: 0.3 } },
    { id: 'myth_def3', name: '闪避大师', icon: '💨', desc: '闪避率 +40%', effect: { dodgeBonus: 40 } },
    { id: 'myth_def4', name: '生命链接', icon: '❤️', desc: '最大生命 +200%', effect: { maxHpBonus: 2.0 } },
    { id: 'myth_def5', name: '元素结界', icon: '🔮', desc: '全元素抗性 +80%', effect: { allResistBonus: 80 } },
    { id: 'myth_gold1', name: '财富之神的祝福', icon: '💰', desc: '金币获取 +200%', effect: { goldBonus: 2.0 } },
    { id: 'myth_gold2', name: '爆率提升', icon: '📦', desc: '装备掉率 +100%', effect: { dropRateBonus: 1.0 } },
    { id: 'myth_gold3', name: '幸运光环', icon: '🍀', desc: '全幸运 +50%', effect: { luckBonus: 0.5 } },
    { id: 'myth_special1', name: '瞬间移动', icon: '🌟', desc: '攻击速度 +100%', effect: { attackSpeedBonus: 1.0 } },
    { id: 'myth_special2', name: '灵魂收割', icon: '💀', desc: '击杀Boss时 50% 额外金币', effect: { killGoldBonus: 0.5 } },
    { id: 'myth_special3', name: '不灭意志', icon: '👻', desc: '死亡时 30% 复活', effect: { reviveChance: 0.3 } },
    { id: 'myth_special4', name: '经验汲取', icon: '📚', desc: '经验获取 +150%', effect: { expBonus: 1.5 } },
    { id: 'myth_special5', name: '无敌姿态', icon: '🏆', desc: '无敌 3秒 (每30秒)', effect: { invincibleCd: 30000 } },
    { id: 'myth_special6', name: '暴击回血', icon: '💉', desc: '暴击时 恢复 10% 最大生命', effect: { critHeal: 0.1 } },
    { id: 'myth_special7', name: '穿透之矛', icon: '🎯', desc: '无视 Boss 50% 防御', effect: { armorPenetration: 0.5 } },
    { id: 'myth_special8', name: '连锁反应', icon: '🔗', desc: '攻击命中时 30% 再次攻击', effect: { doubleStrike: 0.3 } },
    { id: 'myth_special9', name: '燃烧意志', icon: '🔥', desc: '生命低于 30% 时 伤害 +200%', effect: { lowHpDamage: 2.0 } },
    { id: 'myth_special10', name: '护盾结界', icon: '🔰', desc: '每 20秒 获得护盾', effect: { shieldCd: 20000 } }
];

// ===== 装备配置（强化版） =====
const equipmentConfig = {
    weapon: [
        {name: '生锈的剑', icon: '⚔️', quality: 'common', stats: {attack: 50}},
        {name: '铁剑', icon: '⚔️', quality: 'common', stats: {attack: 100}},
        {name: '钢剑', icon: '🗡️', quality: 'rare', stats: {attack: 300, crit: 8}},
        {name: '魔法剑', icon: '🔮', quality: 'rare', stats: {attack: 500, crit: 15}},
        {name: '火焰剑', icon: '🔥', quality: 'epic', stats: {attack: 1200, crit: 25, fireDamage: 50}},
        {name: '冰霜剑', icon: '❄️', quality: 'epic', stats: {attack: 1200, crit: 25, iceDamage: 50}},
        {name: '雷电剑', icon: '⚡', quality: 'epic', stats: {attack: 1200, crit: 25, lightningDamage: 50}},
        {name: '传说圣剑', icon: '✨', quality: 'legendary', stats: {attack: 3000, crit: 50, allDamage: 200, lifesteal: 15}},
        {name: '暗黑之刃', icon: '💀', quality: 'legendary', stats: {attack: 4000, crit: 70, lifesteal: 25, critDamage: 150}},
        {name: '神话破坏者', icon: '🌟', quality: 'mythic', stats: {attack: 10000, crit: 100, allDamage: 500, lifesteal: 40, critDamage: 300}}
    ],
    helmet: [
        {name: '皮帽', icon: '🎩', quality: 'common', stats: {defense: 30}},
        {name: '铁盔', icon: '🪖', quality: 'common', stats: {defense: 80}},
        {name: '钢盔', icon: '🪖', quality: 'rare', stats: {defense: 200, maxHp: 500}},
        {name: '魔法头盔', icon: '🔮', quality: 'rare', stats: {defense: 350, maxHp: 1000}},
        {name: '火焰头盔', icon: '🔥', quality: 'epic', stats: {defense: 700, maxHp: 2000, fireResist: 50}},
        {name: '冰霜头盔', icon: '❄️', quality: 'epic', stats: {defense: 700, maxHp: 2000, iceResist: 50}},
        {name: '传说头盔', icon: '👑', quality: 'legendary', stats: {defense: 1500, maxHp: 5000, allResist: 30, regen: 20}},
        {name: '神话皇冠', icon: '🌟', quality: 'mythic', stats: {defense: 3000, maxHp: 15000, allResist: 80, regen: 50}}
    ],
    armor: [
        {name: '布衣', icon: '👕', quality: 'common', stats: {defense: 50}},
        {name: '皮甲', icon: '🥋', quality: 'common', stats: {defense: 120}},
        {name: '锁甲', icon: '🛡️', quality: 'rare', stats: {defense: 300, maxHp: 800}},
        {name: '板甲', icon: '🛡️', quality: 'rare', stats: {defense: 500, maxHp: 1500}},
        {name: '魔法护甲', icon: '🔮', quality: 'epic', stats: {defense: 1000, maxHp: 3000, damageReduce: 15}},
        {name: '火焰护甲', icon: '🔥', quality: 'epic', stats: {defense: 1000, maxHp: 3000, fireResist: 80}},
        {name: '传说护甲', icon: '✨', quality: 'legendary', stats: {defense: 2000, maxHp: 8000, damageReduce: 30, regen: 30}},
        {name: '神话护甲', icon: '🌟', quality: 'mythic', stats: {defense: 4000, maxHp: 25000, damageReduce: 50, regen: 80}}
    ],
    ring: [
        {name: '铁戒指', icon: '💍', quality: 'common', stats: {crit: 5}},
        {name: '银戒指', icon: '💍', quality: 'common', stats: {crit: 12}},
        {name: '红宝石戒指', icon: '💎', quality: 'rare', stats: {crit: 30, critDamage: 25}},
        {name: '钻石戒指', icon: '💎', quality: 'rare', stats: {crit: 50, critDamage: 50}},
        {name: '魔法戒指', icon: '🔮', quality: 'epic', stats: {crit: 80, critDamage: 100, attack: 100}},
        {name: '传说戒指', icon: '✨', quality: 'legendary', stats: {crit: 150, critDamage: 200, attack: 300}},
        {name: '神话戒指', icon: '🌟', quality: 'mythic', stats: {crit: 300, critDamage: 500, attack: 800, goldBonus: 0.5}}
    ],
    necklace: [
        {name: '木项链', icon: '📿', quality: 'common', stats: {maxHp: 200}},
        {name: '皮项链', icon: '📿', quality: 'common', stats: {maxHp: 500}},
        {name: '银项链', icon: '📿', quality: 'rare', stats: {maxHp: 1500, defense: 100}},
        {name: '金项链', icon: '📿', quality: 'rare', stats: {maxHp: 3000, defense: 250}},
        {name: '魔法项链', icon: '🔮', quality: 'epic', stats: {maxHp: 5000, defense: 500, regen: 15}},
        {name: '传说项链', icon: '✨', quality: 'legendary', stats: {maxHp: 10000, defense: 1000, regen: 40, crit: 30}},
        {name: '神话项链', icon: '🌟', quality: 'mythic', stats: {maxHp: 30000, defense: 2500, regen: 100, allResist: 50}}
    ],
    boots: [
        {name: '草鞋', icon: '🥿', quality: 'common', stats: {moveSpeed: 10, dodge: 3}},
        {name: '布鞋', icon: '👟', quality: 'common', stats: {moveSpeed: 20, dodge: 5}},
        {name: '皮靴', icon: '👢', quality: 'rare', stats: {moveSpeed: 50, defense: 50, dodge: 10}},
        {name: '钢靴', icon: '👢', quality: 'rare', stats: {moveSpeed: 80, defense: 100, dodge: 15}},
        {name: '魔法靴', icon: '🔮', quality: 'epic', stats: {moveSpeed: 120, defense: 200, dodge: 25}},
        {name: '传说靴', icon: '✨', quality: 'legendary', stats: {moveSpeed: 200, defense: 400, dodge: 40, crit: 20}},
        {name: '神话靴', icon: '🌟', quality: 'mythic', stats: {moveSpeed: 500, defense: 800, dodge: 80, crit: 50, goldBonus: 0.3}}
    ]
};

// ===== 生成神话装备随机能力 =====
function generateMythicAbilities() {
    const count = 3 + Math.floor(Math.random() * 8); // 3-10个能力
    const abilities = [];
    const shuffled = [...mythicAbilities].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < Math.min(count, shuffled.length); i++) {
        abilities.push(shuffled[i]);
    }
    return abilities;
}

// 宠物配置
const petConfig = [
    {id: 'slime', name: '史莱姆', icon: '🟢', rarity: 'common', bonus: {dps: 5}, rebirthCost: 3, desc: 'DPS +5'},
    {id: 'cat', name: '小猫', icon: '🐱', rarity: 'common', bonus: {gold: 10}, rebirthCost: 5, desc: '金币 +10%'},
    {id: 'dog', name: '小狗', icon: '🐕', rarity: 'common', bonus: {dps: 10}, rebirthCost: 8, desc: 'DPS +10'},
    {id: 'bird', name: '小鸟', icon: '🐦', rarity: 'rare', bonus: {crit: 5}, rebirthCost: 15, desc: '暴击率 +5%'},
    {id: 'wolf', name: '小狼', icon: '🐺', rarity: 'rare', bonus: {attack: 20}, rebirthCost: 25, desc: '攻击力 +20'},
    {id: 'dragon', name: '幼龙', icon: '🐉', rarity: 'epic', bonus: {dps: 50, gold: 20}, rebirthCost: 60, desc: 'DPS +50, 金币 +20%'},
    {id: 'phoenix', name: '凤凰', icon: '🦅', rarity: 'epic', bonus: {dps: 100, critDamage: 50}, rebirthCost: 120, desc: 'DPS +100, 暴击伤害 +50%'},
    {id: 'unicorn', name: '独角兽', icon: '🦄', rarity: 'legendary', bonus: {allDamage: 30, maxHp: 500}, rebirthCost: 300, desc: '全伤害 +30%, 生命 +500'},
    {id: 'tiger', name: '白虎', icon: '🐯', rarity: 'legendary', bonus: {attack: 100, crit: 20}, rebirthCost: 500, desc: '攻击 +100, 暴击率 +20%'},
    {id: 'god', name: '神灵', icon: '🌟', rarity: 'mythic', bonus: {dps: 500, gold: 100, crit: 50}, rebirthCost: 1500, desc: 'DPS +500, 金币 +100%'}
];

// Boss表情包（emoji，每个Boss不同）
const bossImages = [
    '💀', '👹', '👺', '👻', '👽', '👾', '🤖', '💩', '😈', '🎃',
    '🐉', '🦇', '🐙', '🦑', '🦕', '🦖', '🦎', '🐍', '🦂', '🕷️',
    '☠️', '💀', '👹', '👺', '👻', '👽', '👾', '🤖', '💩', '😈',
    '🎃', '🐉', '🦇', '🐙', '🦑', '🦕', '🦖', '🦎', '🐍', '🦂'
];

// Boss SVG图标（备用）
const bossSVGImages = [
    'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'45\' fill=\'%23333\'/%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'35\' fill=\'%23666\'/%3E%3Ctext x=\'50\' y=\'60\' text-anchor=\'middle\' font-size=\'30\'%3E💀%3C/text%3E%3C/svg%3E',
    'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'45\' fill=\'%23444\'/%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'35\' fill=\'%23777\'/%3E%3Ctext x=\'50\' y=\'60\' text-anchor=\'middle\' font-size=\'30\'%3E👹%3C/text%3E%3C/svg%3E',
    'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'45\' fill=\'%23555\'/%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'35\' fill=\'%23888\'/%3E%3Ctext x=\'50\' y=\'60\' text-anchor=\'middle\' font-size=\'30\'%3E👺%3C/text%3E%3C/svg%3E',
    'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'45\' fill=\'%231a1a2e\'/%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'35\' fill=\'%233d3d5c\'/%3E%3Ctext x=\'50\' y=\'60\' text-anchor=\'middle\' font-size=\'30\'%3E👻%3C/text%3E%3C/svg%3E',
    'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'45\' fill=\'%2300ff00\'/%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'35\' fill=\'%23008800\'/%3E%3Ctext x=\'50\' y=\'60\' text-anchor=\'middle\' font-size=\'30\'%3E👽%3C/text%3E%3C/svg%3E',
    'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'45\' fill=\'%236600ff\'/%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'35\' fill=\'%233300aa\'/%3E%3Ctext x=\'50\' y=\'60\' text-anchor=\'middle\' font-size=\'30\'%3E👾%3C/text%3E%3C/svg%3E',
    'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'45\' fill=\'%23aaa\'/%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'35\' fill=\'%23ccc\'/%3E%3Ctext x=\'50\' y=\'60\' text-anchor=\'middle\' font-size=\'30\'%3E🤖%3C/text%3E%3C/svg%3E',
    'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'45\' fill=\'%238b4513\'/%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'35\' fill=\'%23cd853f\'/%3E%3Ctext x=\'50\' y=\'60\' text-anchor=\'middle\' font-size=\'30\'%3E💩%3C/text%3E%3C/svg%3E',
    'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'45\' fill=\'%23ff0000\'/%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'35\' fill=\'%23cc0000\'/%3E%3Ctext x=\'50\' y=\'60\' text-anchor=\'middle\' font-size=\'30\'%3E😈%3C/text%3E%3C/svg%3E',
    'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'45\' fill=\'%23ff6600\'/%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'35\' fill=\'%23cc5200\'/%3E%3Ctext x=\'50\' y=\'60\' text-anchor=\'middle\' font-size=\'30\'%3E🎃%3C/text%3E%3C/svg%3E'
];

// 初始化游戏
function initGame() {
    loadGame();
    initArtifacts();
    updateBoss();
    updateDisplay();
    updatePlayerHP();
    renderArtifacts();
    renderInventory();
    renderPets();
    updateUpgradeCosts();
    updateStatsPanel();
    startAutoAttack();
    startBossAttack();
    startPoisonTick();
    startGameTimer();
    checkOfflineGains();
    safeInterval('autoSave', saveGame, 30000);
}

// 初始化神器（不要初始化！未解锁的神器应该是undefined）
function initArtifacts() {
    // 确保artifacts对象存在，但不初始化任何神器
    // 未解锁的神器保持undefined状态
    if (!gameState.artifacts) {
        gameState.artifacts = {};
    }
    // 注释掉这行！否则所有神器都会被初始化为level 0（已解锁状态）
    // artifactConfig.forEach(a => gameState.artifacts[a.id] = 0);
}

// 检查离线收益
function checkOfflineGains() {
    if (gameState.artifacts.hourglass > 0 && gameState.lastSaveTime) {
        const now = Date.now();
        const offlineSeconds = Math.floor((now - gameState.lastSaveTime) / 1000);
        if (offlineSeconds > 60) {
            const offlineGains = Math.floor(calculateDPS() * 0.5 * offlineSeconds);
            if (offlineGains > 0) {
                gameState.gold += offlineGains;
                showNotification(`离线收益: +${formatNumber(offlineGains)} 💰`);
                updateDisplay();
            }
        }
    }
}

// 计算总DPS
function calculateDPS() {
    let dps = gameState.dps;
    
    // 神器加成
    if (gameState.artifacts.powerBook > 0) dps *= Math.pow(1.5, gameState.artifacts.powerBook);
    if (gameState.artifacts.sharpness > 0) dps *= Math.pow(1.25, gameState.artifacts.sharpness);
    if (gameState.artifacts.fireSoul > 0) dps *= Math.pow(2, gameState.artifacts.fireSoul);
    if (gameState.artifacts.lightning > 0) dps *= Math.pow(2, gameState.artifacts.lightning);
    if (gameState.artifacts.iceHeart > 0) dps *= Math.pow(2, gameState.artifacts.iceHeart);
    if (gameState.artifacts.allDamage > 0) dps *= (1 + gameState.artifacts.allDamage * 0.5);
    if (gameState.artifacts.fatalBlow > 0) dps *= Math.pow(1.5, gameState.artifacts.fatalBlow);
    // 注意：Berserk 只在 <30%HP 时触发，不计入面板 DPS（避免虚高）
    // 注意：critEye 暴击率不计入 DPS（由 calculateCrit() 单独处理）
    
    // 宠物加成
    if (gameState.activePet && petConfig.find(p => p.id === gameState.activePet)) {
        const pet = petConfig.find(p => p.id === gameState.activePet);
        if (pet.bonus.dps) dps += pet.bonus.dps * (gameState.pets[gameState.activePet] || 1);
    }
    
    // 装备加成
    Object.values(gameState.equipment).forEach(item => {
        if (item && item.stats.attack) dps += item.stats.attack;
    });
    
    return dps;
}

// 计算攻击力
function calculateAttack() {
    let attack = gameState.clickDamage;
    
    // 神器加成
    if (gameState.artifacts.powerBook > 0) attack *= Math.pow(1.5, gameState.artifacts.powerBook);
    if (gameState.artifacts.sharpness > 0) attack *= Math.pow(1.25, gameState.artifacts.sharpness);
    
    // 宠物加成
    if (gameState.activePet) {
        const pet = petConfig.find(p => p.id === gameState.activePet);
        if (pet && pet.bonus.attack) attack += pet.bonus.attack * (gameState.pets[gameState.activePet] || 1);
    }
    
    // 装备加成
    Object.values(gameState.equipment).forEach(item => {
        if (item && item.stats.attack) attack += item.stats.attack;
    });
    
    return attack;
}

// 计算暴击率
function calculateCrit() {
    let crit = 0;
    
    // 神器加成
    if (gameState.artifacts.critEye > 0) crit += 5 * gameState.artifacts.critEye;
    
    // 宠物加成
    if (gameState.activePet) {
        const pet = petConfig.find(p => p.id === gameState.activePet);
        if (pet && pet.bonus.crit) crit += pet.bonus.crit;
    }
    
    // 装备加成
    Object.values(gameState.equipment).forEach(item => {
        if (item && item.stats.crit) crit += item.stats.crit;
    });
    
    return crit;
}

// 攻击Boss
function attackBoss(event) {
    let damage = calculateAttack();
    let effectType = 'normal';
    
    // 攻击速度（多重点击）
    let hits = 1;
    if (gameState.artifacts.attackSpeed > 0) hits += Math.floor(gameState.artifacts.attackSpeed * 0.1);
    if (gameState.artifacts.multiHit > 0) hits += gameState.artifacts.multiHit;
    
    // 连击
    if (gameState.artifacts.combo > 0) {
        for (let i = 0; i < hits; i++) {
            if (Math.random() < gameState.artifacts.combo * 0.1) hits++;
        }
    }
    
    // 暴击
    let isCrit = false;
    let critMultiplier = 1;
    const critChance = calculateCrit();
    if (Math.random() * 100 < critChance) {
        critMultiplier = 5 + (gameState.artifacts.critEye > 0 ? (gameState.artifacts.critEye - 1) * 2 : 0);
        if (gameState.artifacts.fatalBlow > 0) critMultiplier *= Math.pow(1.5, gameState.artifacts.fatalBlow);
        // 宠物暴击伤害加成
        if (gameState.activePet) {
            const _pet = petConfig.find(p => p.id === gameState.activePet);
            if (_pet && _pet.bonus.critDamage) critMultiplier += _pet.bonus.critDamage / 100;
        }
        isCrit = true;
        effectType = 'crit';
    }
    
    // 火焰伤害
    let hasFire = false;
    if (gameState.artifacts.fireSoul > 0) {
        damage *= Math.pow(2, gameState.artifacts.fireSoul);
        hasFire = true;
    }
    
    // 冰冻伤害
    let hasIce = false;
    if (gameState.artifacts.iceHeart > 0) {
        damage *= Math.pow(2, gameState.artifacts.iceHeart);
        hasIce = true;
    }
    
    // 闪电伤害
    let hasLightning = false;
    if (gameState.artifacts.lightning > 0) {
        damage *= Math.pow(2, gameState.artifacts.lightning);
        hasLightning = true;
    }
    
    // 狂暴之斧
    let isBerserk = false;
    if (gameState.artifacts.berserk > 0 && gameState.playerCurrentHp < gameState.playerMaxHp * 0.3) {
        damage *= Math.pow(1.5, gameState.artifacts.berserk);
        isBerserk = true;
        if (!isCrit) effectType = 'berserk';
    }
    
    // 致命之刃
    if (gameState.artifacts.fatalBlow > 0 && isCrit) {
        damage *= Math.pow(1.5, gameState.artifacts.fatalBlow);
    }
    
    // 全伤害加成
    if (gameState.artifacts.allDamage > 0) {
        damage *= (1 + gameState.artifacts.allDamage * 0.5);
    }
    
    // 决定主要特效（暴击优先）
    if (!isCrit) {
        if (hasLightning) effectType = 'lightning';
        else if (hasIce) effectType = 'ice';
        else if (hasFire) effectType = 'fire';
    }
    
    damage *= critMultiplier;
    
    // 计算总伤害
    let totalDamageDealt = damage * hits;
    
    // 金币加成（受金币磁体影响）
    let goldMultiplier = 1;
    if (gameState.artifacts.goldMagnet > 0) goldMultiplier *= Math.pow(1.5, gameState.artifacts.goldMagnet);
    
    // 每点伤害给1金币
    gameState.gold += Math.floor(totalDamageDealt * goldMultiplier);
    
    // 应用伤害
    for (let i = 0; i < hits; i++) {
        gameState.currentHP -= damage;
        gameState.totalDamage += damage;
        if (i === 0) {
            const bossImage = document.getElementById('bossImage');
            const bossRect = bossImage.getBoundingClientRect();
            showDamageNumber(totalDamageDealt, bossRect.left + bossRect.width/2, bossRect.top + bossRect.height/2, effectType);
        }
    }
    
    // 记录实时DPS
    dpsTracker.addDamage(totalDamageDealt);
    
    // === 连锁闪电（点击也触发）===
    if (gameState.artifacts.chainLightning > 0) {
        const chainDamage = totalDamageDealt * 0.5 * gameState.artifacts.chainLightning;
        gameState.currentHP -= chainDamage;
        gameState.totalDamage += chainDamage;
        gameState.gold += Math.floor(chainDamage * goldMultiplier); // 连锁闪电也有金币
        createChainLightningEffect();
    }
    
    // === 吸血效果 ===
    if (gameState.artifacts.lifesteal > 0) {
        const lifestealAmount = Math.floor(totalDamageDealt * 0.05 * gameState.artifacts.lifesteal);
        if (lifestealAmount > 0) {
            gameState.playerCurrentHp = Math.min(gameState.playerMaxHp, gameState.playerCurrentHp + lifestealAmount);
            updatePlayerHP();
            // 显示吸血效果
            showLifestealNumber(lifestealAmount, event.clientX, event.clientY - 50);
        }
    }
    
    // Boss受击动画
    const bossImg = document.getElementById('bossImage');
    bossImg.classList.add('hit');
    setTimeout(() => bossImg.classList.remove('hit'), 200);
    
    // === 毒液效果（每1秒最多刷新一次）===
    if (gameState.artifacts.poison > 0 && gameState.currentHP > 0) {
        if (!window._lastPoisonApply || Date.now() - window._lastPoisonApply > 1000) {
            applyPoison();
            window._lastPoisonApply = Date.now();
        }
    }
    
    if (gameState.currentHP <= 0) killBoss();
    
    updateHPBar();
    updateDisplay();
    updateStatsPanel();
    saveGame();
}

// 显示吸血数字
function showLifestealNumber(amount, x, y) {
    const float = document.createElement('div');
    float.className = 'damage-float';
    float.textContent = '+' + formatNumber(amount) + ' ❤️';
    
    // 显示在玩家区域
    const playerHpWrap = document.querySelector('.player-hp-wrap');
    if (playerHpWrap) {
        const rect = playerHpWrap.getBoundingClientRect();
        const offsetX = (Math.random() - 0.5) * 60;
        const offsetY = (Math.random() - 0.5) * 40 - 30;
        float.style.left = (rect.left + rect.width/2 + offsetX) + 'px';
        float.style.top = (rect.top + offsetY) + 'px';
    } else {
        float.style.left = (x || window.innerWidth / 2) + 'px';
        float.style.top = (y || window.innerHeight / 3 - 30) + 'px';
    }
    
    float.style.color = '#00ff88';
    
    // 伤害越大字体越大
    const logAmt = Math.log10(Math.max(1, amount));
    const scaleFont = Math.min(3.5, Math.max(1.2, 1.2 + logAmt * 0.3));
    float.style.fontSize = scaleFont + 'em';
    
    float.style.textShadow = '0 0 10px #00ff88';
    document.body.appendChild(float);
    setTimeout(() => float.remove(), 1000);
}

// 显示伤害数字（支持多种元素特效）
function showDamageNumber(damage, x, y, effectType) {
    const dmgFloat = document.createElement('div');
    dmgFloat.className = 'damage-float';
    dmgFloat.textContent = formatNumber(Math.floor(damage));
    // 随机偏移防止数字重叠
    const offsetX = (Math.random() - 0.5) * 60;
    const offsetY = (Math.random() - 0.5) * 40;
    
    // 修复：使用 null 检查而不是 falsy 检查（x=0 或 y=0 是有效坐标）
    const finalX = (x !== null && x !== undefined) ? x : window.innerWidth / 2;
    const finalY = (y !== null && y !== undefined) ? y : window.innerHeight / 3;
    
    dmgFloat.style.left = (finalX + offsetX) + 'px';
    dmgFloat.style.top = (finalY + offsetY) + 'px';
    
    // 调试：在控制台显示坐标（正式发布时删除）
    console.log(`[DEBUG] showDamageNumber: damage=${damage}, x=${x}, y=${y}, finalX=${finalX}, finalY=${finalY}, effectType=${effectType}`);
    console.log(`[DEBUG] window size: ${window.innerWidth}x${window.innerHeight}`);
    
    // 伤害越大字体越大（1.2em ~ 4em）
    const logDmg = Math.log10(Math.max(1, damage));
    const scaleFont = Math.min(4, Math.max(1.2, 1.2 + logDmg * 0.35));
    
    // 根据特效类型设置不同的样式
    switch(effectType) {
        case 'crit':
            dmgFloat.style.color = '#ff0000';
            dmgFloat.style.fontSize = Math.min(5, scaleFont + 0.8) + 'em';
            dmgFloat.style.textShadow = '0 0 10px #ff0000, 0 0 20px #ff0000, 0 0 30px #ff0000';
            dmgFloat.textContent = '⚡暴击! ' + dmgFloat.textContent + '⚡';
            createLightningEffect(x, y);
            break;
        case 'fire':
            dmgFloat.style.color = '#ff6600';
            dmgFloat.style.fontSize = scaleFont + 'em';
            dmgFloat.style.textShadow = '0 0 10px #ff6600, 0 0 20px #ff3300';
            dmgFloat.textContent = '🔥' + dmgFloat.textContent;
            createFireParticles(x, y);
            break;
        case 'ice':
            dmgFloat.style.color = '#00ffff';
            dmgFloat.style.fontSize = scaleFont + 'em';
            dmgFloat.style.textShadow = '0 0 10px #00ffff, 0 0 20px #0088ff';
            dmgFloat.textContent = '❄️' + dmgFloat.textContent;
            createIceEffect(x, y);
            break;
        case 'lightning':
            dmgFloat.style.color = '#aa00ff';
            dmgFloat.style.fontSize = Math.min(4.5, scaleFont + 0.4) + 'em';
            dmgFloat.style.textShadow = '0 0 15px #aa00ff, 0 0 30px #8800ff';
            dmgFloat.textContent = '💜' + dmgFloat.textContent;
            createChainLightning(x, y);
            break;
        case 'poison':
            dmgFloat.style.color = '#00ff00';
            dmgFloat.style.fontSize = scaleFont + 'em';
            dmgFloat.style.textShadow = '0 0 10px #00ff00';
            dmgFloat.textContent = '☠️' + dmgFloat.textContent;
            break;
        case 'player':
            dmgFloat.style.color = '#ff4444';
            dmgFloat.style.fontSize = scaleFont + 'em';
            dmgFloat.style.textShadow = '0 0 8px #ff0000';
            dmgFloat.textContent = '-' + dmgFloat.textContent + ' ❤️';
            break;
        case 'berserk':
            dmgFloat.style.color = '#ff00ff';
            dmgFloat.style.fontSize = Math.min(5, scaleFont + 0.6) + 'em';
            dmgFloat.style.textShadow = '0 0 12px #ff00ff, 0 0 24px #ff0000';
            dmgFloat.textContent = '😡狂暴! ' + dmgFloat.textContent;
            break;
        default:
            dmgFloat.style.color = '#ffffff';
            dmgFloat.style.fontSize = scaleFont + 'em';
            dmgFloat.style.textShadow = '0 0 5px rgba(255,255,255,0.5)';
    }
    
    document.body.appendChild(dmgFloat);
    setTimeout(() => dmgFloat.remove(), 1000);
}

// ⚡闪电特效
function createLightningEffect(x, y) {
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;left:' + (x - 50) + 'px;top:' + (y - 100) + 'px;width:100px;height:100px;pointer-events:none;z-index:9999;';
    
    for(let i = 0; i < 3; i++) {
        const bolt = document.createElement('div');
        const angle = (Math.random() - 0.5) * 60;
        const length = 30 + Math.random() * 40;
        bolt.style.cssText = 'position:absolute;left:50%;top:50%;width:4px;height:' + length + 'px;background:linear-gradient(to bottom,#fff,#ffff00,#ff6600);transform-origin:top center;transform:rotate(' + angle + 'deg);animation:lightningFlash 0.3s ease-out;';
        container.appendChild(bolt);
    }
    
    document.body.appendChild(container);
    setTimeout(() => container.remove(), 500);
}

// 🔥火焰粒子特效
function createFireParticles(x, y) {
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;left:' + (x - 30) + 'px;top:' + (y - 50) + 'px;width:60px;height:80px;pointer-events:none;z-index:9999;';
    
    for(let i = 0; i < 8; i++) {
        const particle = document.createElement('div');
        const size = 5 + Math.random() * 10;
        const offsetX = (Math.random() - 0.5) * 40;
        particle.style.cssText = 'position:absolute;left:' + (30 + offsetX) + 'px;bottom:0;width:' + size + 'px;height:' + size + 'px;border-radius:50%;background:radial-gradient(circle,#fff,#ff6600,#ff0000);animation:fireRise ' + (0.5 + Math.random() * 0.5) + 's ease-out forwards;opacity:0;';
        particle.style.animationDelay = (Math.random() * 0.2) + 's';
        container.appendChild(particle);
    }
    
    document.body.appendChild(container);
    setTimeout(() => container.remove(), 1500);
}

// ❄️冰晶特效
function createIceEffect(x, y) {
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;left:' + (x - 50) + 'px;top:' + (y - 50) + 'px;width:100px;height:100px;pointer-events:none;z-index:9999;';
    
    // 六边形冰晶
    for(let i = 0; i < 6; i++) {
        const crystal = document.createElement('div');
        const angle = i * 60;
        const size = 15 + Math.random() * 15;
        crystal.style.cssText = 'position:absolute;left:50%;top:50%;width:0;height:0;border-left:' + (size/2) + 'px solid transparent;border-right:' + (size/2) + 'px solid transparent;border-bottom:' + size + 'px solid rgba(0,255,255,0.7);transform-origin:center center;transform:rotate(' + angle + 'deg) translateY(-' + (30 + Math.random() * 20) + 'px);animation:iceGrow 0.5s ease-out forwards;';
        container.appendChild(crystal);
    }
    
    document.body.appendChild(container);
    setTimeout(() => container.remove(), 1000);
}

// 💜连锁闪电特效
function createChainLightning(x, y) {
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;left:' + (x - 50) + 'px;top:' + (y - 100) + 'px;width:100px;height:120px;pointer-events:none;z-index:9999;';
    
    // 创建之字形闪电
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 120;
    const ctx = canvas.getContext('2d');
    
    ctx.strokeStyle = '#aa00ff';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#aa00ff';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.moveTo(50, 0);
    
    for(let i = 1; i <= 5; i++) {
        const nextY = i * 24;
        const offsetX = (Math.random() - 0.5) * 60;
        ctx.lineTo(50 + offsetX, nextY);
    }
    ctx.stroke();
    
    container.appendChild(canvas);
    document.body.appendChild(container);
    setTimeout(() => container.remove(), 500);
}

// 击杀Boss（额外奖励，因为之前每点伤害已经给金币了）
function killBoss() {
    if (gameState._bossDying) return; // 防止重复调用
    gameState._bossDying = true;
    const goldReward = gameState.level * 5; // 击杀额外奖励
    let finalGold = goldReward;
    
    // 爆裂护符 - 额外爆炸伤害（边界检查）
    if (gameState.artifacts.explosion > 0) {
        const explosionDamage = Math.min(gameState.currentHP + gameState.maxHP, gameState.maxHP * 0.5 * gameState.artifacts.explosion);
        gameState.gold += Math.floor(explosionDamage * 0.1);
    }
    
    // 金币加成（只对击杀奖励生效）
    if (gameState.artifacts.goldMagnet > 0) finalGold *= Math.pow(1.5, gameState.artifacts.goldMagnet);
    if (gameState.artifacts.treasureMap > 0) finalGold *= Math.pow(1.5, gameState.artifacts.treasureMap);
    if (gameState.artifacts.doubleGold > 0) finalGold *= Math.pow(2, gameState.artifacts.doubleGold);
    
    // 宠物金币加成
    if (gameState.activePet) {
        const pet = petConfig.find(p => p.id === gameState.activePet);
        if (pet && pet.bonus.gold) finalGold *= (1 + pet.bonus.gold / 100);
    }
    
    // 击杀爆炸特效
    if (gameState.artifacts.explosion > 0) {
        createExplosionEffect();
    }
    
    // 重置毒液层数
    poisonStacks = 0;
    
    gameState.gold += Math.floor(finalGold);
    gameState.level++;
    if (gameState.level > gameState.maxLevel) gameState.maxLevel = gameState.level;
    gameState.totalBossKills = (gameState.totalBossKills || 0) + 1;
    
    // 装备掉落
    dropEquipment();
    
    updateBoss();
    showNotification(`击杀Boss! +${formatNumber(Math.floor(finalGold))} 💰`);
    updateDisplay();
}

// 装备掉落系统
function dropEquipment() {
    const dropChance = 0.15 + (gameState.artifacts.luckyClover > 0 ? gameState.artifacts.luckyClover * 0.1 : 0);
    
    if (Math.random() < dropChance) {
        const slotTypes = Object.keys(equipmentConfig);
        const slot = slotTypes[Math.floor(Math.random() * slotTypes.length)];
        
        // 根据关卡等级决定掉落品质（每个档位独立随机数，正确概率）
        let qualityIndex = 0; // 0=common, 1=rare, 2=epic, 3=legendary, 4=mythic
        if (gameState.level >= 50 && Math.random() < 0.05) qualityIndex = 4; // mythic 5%
        else if (gameState.level >= 30 && Math.random() < 0.15) qualityIndex = 3; // legendary 15%
        else if (gameState.level >= 15 && Math.random() < 0.30) qualityIndex = 2; // epic 30%
        else if (gameState.level >= 5 && Math.random() < 0.50) qualityIndex = 1; // rare 50%
        else qualityIndex = 0; // common (fallback)
        
        const qualityMap = ['common', 'rare', 'epic', 'legendary', 'mythic'];
        const targetQuality = qualityMap[qualityIndex];
        
        const items = equipmentConfig[slot].filter(item => item.quality === targetQuality);
        
        if (items.length > 0) {
            const item = {...items[Math.floor(Math.random() * items.length)], slot};
            
            // 神话装备额外添加 3-10 个随机能力
            if (item.quality === 'mythic') {
                item.abilities = generateMythicAbilities();
            }
            
            gameState.inventory.push(item);
            showDropNotification(item);
        }
    }
}

// 显示掉落通知
function showDropNotification(item) {
    const notif = document.getElementById('dropNotification');
    const qualityColors = {
        common: '#ffffff',
        rare: '#0070ff',
        epic: '#a335ee',
        legendary: '#ff8000',
        mythic: '#ff0000'
    };
    
    let abilitiesHtml = '';
    if (item.quality === 'mythic' && item.abilities && item.abilities.length > 0) {
        abilitiesHtml = `<div style="color: #ffcc00; font-size: 0.8em; margin-top: 8px; text-align: center;">`;
        abilitiesHtml += item.abilities.map(a => `${a.icon} ${a.name}`).join('<br>');
        abilitiesHtml += `</div>`;
    }
    
    notif.innerHTML = `
        <div style="color: ${qualityColors[item.quality]}; font-size: 2em; margin-bottom: 10px;">
            ${item.icon}
        </div>
        <div style="color: ${qualityColors[item.quality]}; font-size: 1.3em; font-weight: bold;">
            获得装备: ${item.name}
        </div>
        <div style="color: #888; font-size: 0.9em; margin-top: 5px;">
            ${item.quality.toUpperCase()} 品质
        </div>
        ${abilitiesHtml}
    `;
    notif.classList.add('show');
    setTimeout(() => notif.classList.remove('show'), item.quality === 'mythic' ? 4000 : 2000);
}

// Boss反击系统
function startBossAttack() {
    safeInterval('bossAttack', () => {
        if (gameState.playerCurrentHp > 0 && gameState.level > 0) {
            // Boss攻击玩家（Boss总是存在的，不依赖currentHP > 0）
            const bossDamage = Math.floor(5 + gameState.level * 2);
            
            // 闪避判定
            let dodgeChance = 0;
            Object.values(gameState.equipment).forEach(item => {
                if (item && item.stats.dodge) dodgeChance += item.stats.dodge;
            });
            
            if (Math.random() * 100 > dodgeChance) {
                // 计算伤害减免
                let damageReduce = 0;
                Object.values(gameState.equipment).forEach(item => {
                    if (item && item.stats.defense) damageReduce += item.stats.defense;
                });
                if (gameState.artifacts.stoneSkin > 0) damageReduce *= (1 + gameState.artifacts.stoneSkin * 0.1);
                
                let finalDamage = Math.max(1, bossDamage - damageReduce * 0.5);
                
                // 荆棘反弹伤害
                if (gameState.artifacts.thorns > 0) {
                    const thornsDamage = finalDamage * 0.1 * gameState.artifacts.thorns;
                    gameState.currentHP -= thornsDamage;
                    gameState.totalDamage += thornsDamage;
                    gameState.gold += Math.floor(thornsDamage);
                    
                    // 显示荆棘伤害
                    const bossArea = document.getElementById('bossClickArea');
                    if (bossArea) {
                        const rect = bossArea.getBoundingClientRect();
                        showThornsDamage(thornsDamage, rect.left + rect.width/2, rect.top + rect.height/2);
                    }
                }
                
                gameState.playerCurrentHp -= finalDamage;
                
                // 显示玩家受到的伤害
                const playerHpWrap = document.querySelector('.player-hp-wrap');
                if (playerHpWrap) {
                    const rect = playerHpWrap.getBoundingClientRect();
                    showDamageNumber(finalDamage, rect.left + rect.width / 2, rect.top + 20, 'player');
                }
                
                updatePlayerHP();
                
                // 荆棘反弹不会击杀Boss（伤害太小），跳过
                if (gameState.playerCurrentHp <= 0) {
                    gameOver();
                }
            }
        }
    }, 3000); // Boss每3秒攻击一次
}

// 显示荆棘反弹伤害
function showThornsDamage(damage, x, y) {
    const float = document.createElement('div');
    float.className = 'damage-float';
    float.textContent = '🌹' + formatNumber(Math.floor(damage));
    float.style.left = x + 'px';
    float.style.top = y + 'px';
    float.style.color = '#ff69b4';
    float.style.fontSize = '1.2em';
    float.style.textShadow = '0 0 10px #ff69b4';
    document.body.appendChild(float);
    setTimeout(() => float.remove(), 1000);
}

// 更新玩家HP显示
function updatePlayerHP() {
    // 计算最大生命值（基础500，每级成长10）
    let maxHp = 500 + (gameState.clickLevel - 1) * 10;
    Object.values(gameState.equipment).forEach(item => {
        if (item && item.stats.maxHp) maxHp += item.stats.maxHp;
    });
    if (gameState.artifacts.guardian > 0) maxHp *= Math.pow(1.5, gameState.artifacts.guardian);
    
    gameState.playerMaxHp = maxHp;
    // 复活后恢复满血
    if (gameState.playerCurrentHp > maxHp) gameState.playerCurrentHp = maxHp;
    if (gameState.playerCurrentHp < 0) gameState.playerCurrentHp = 0;
    
    const hpPercent = (gameState.playerCurrentHp / gameState.playerMaxHp) * 100;
    document.getElementById('playerHpFill').style.width = hpPercent + '%';
    document.getElementById('playerCurrentHp').textContent = Math.floor(gameState.playerCurrentHp);
    document.getElementById('playerMaxHp').textContent = gameState.playerMaxHp;
}

// 游戏结束
function gameOver() {
    document.getElementById('gameOverLevel').textContent = gameState.level;
    document.getElementById('gameOverGold').textContent = '100';
    document.getElementById('gameOverModal').classList.add('active');
}

// 复活
function revive() {
    if (gameState.gold >= 100) {
        gameState.gold -= 100;
        gameState.playerCurrentHp = gameState.playerMaxHp; // 满血复活
        gameState.level = Math.max(1, Math.floor(gameState.level * 0.5));
        updateBoss();
        updatePlayerHP();
        updateDisplay();
        document.getElementById('gameOverModal').classList.remove('active');
        showNotification('复活成功! 等级降低50%，血量恢复满!');
    } else {
        showNotification('金币不足! 需要100金币复活');
    }
}

// 重新开始
// ===== 重置游戏 =====
function confirmResetGame() {
    if (confirm('⚠️ 确定要清除所有进度吗？这将删除所有存档数据，无法恢复！')) {
        resetAllGameData();
    }
}

function resetAllGameData() {
    // 清除所有存档
    localStorage.removeItem('bossRPGSave');
    
    // 保留重生相关数据
    const rebirthCount = gameState.rebirthCount || 0;
    const rebirthGoldBonus = gameState.rebirthGoldBonus || 0;
    const rebirthDamageBonus = gameState.rebirthDamageBonus || 0;
    
    // 重置所有游戏状态
    gameState = {
        gold: 0,
        level: 1,
        currentHP: 100,
        maxHP: 100,
        playerMaxHp: 500,
        playerCurrentHp: 500,
        clickDamage: 1,
        clickLevel: 1,
        dps: 0,
        dpsLevel: 0,
        artifactPoints: 0,
        artifacts: {},
        equipment: {},
        inventory: [],
        pets: {},
        activePet: null,
        rebirthPoints: 0,
        totalRebirths: 0,
        currentRebirth: 0,
        totalGoldEarned: 0,
        totalBossKills: 0,
        lastSaveTime: Date.now(),
        rebirthCount: rebirthCount,
        rebirthGoldBonus: rebirthGoldBonus,
        rebirthDamageBonus: rebirthDamageBonus
    };
    
    // 重新初始化
    initGame();
    saveGame();
    showNotification('🎮 游戏已重置，所有数据已清除！');
}

function restartGame() {
    localStorage.removeItem('bossRPGSave');
    location.reload();
}

// 更新Boss（每个Boss都有不同的emoji）
function updateBoss() {
    gameState._bossDying = false; // 清除击杀锁
    gameState.maxHP = Math.floor(100 * Math.pow(1.8, gameState.level - 1));
    gameState.currentHP = gameState.maxHP;
    
    const bossNames = [
        "燃气表-I型 基本型", "燃气表-II型 标准型", "燃气表-III型 智能型",
        "燃气表-IV型 工业型", "燃气表-V型 商用型", "燃气表-VI型 高精度型",
        "燃气表-VII型 远程型", "燃气表-VIII型 防爆型", "燃气表-IX型 大流量型",
        "燃气表-X型 智能远传型"
    ];
    
    document.getElementById('bossName').textContent = bossNames[(gameState.level - 1) % bossNames.length];
    document.getElementById('bossLevel').textContent = gameState.level;
    
    // 每个关卡使用不同的emoji（循环使用40个emoji）
    const imageIndex = (gameState.level - 1) % bossImages.length;
    const bossEmoji = bossImages[imageIndex];
    
    // 更新Boss图片 - 直接设置emoji
    const bossArea = document.getElementById('bossImage');
    if (bossArea) {
        bossArea.textContent = bossEmoji;
        bossArea.style.fontSize = '120px';
        bossArea.style.display = 'flex';
        bossArea.style.alignItems = 'center';
        bossArea.style.justifyContent = 'center';
    }
    
    updateHPBar();
}

// 更新血条
function updateHPBar() {
    const hpPercent = Math.max(0, (gameState.currentHP / gameState.maxHP) * 100);
    document.getElementById('hpFill').style.width = hpPercent + '%';
    document.getElementById('currentHP').textContent = formatNumber(Math.max(0, Math.floor(gameState.currentHP)));
    document.getElementById('maxHP').textContent = formatNumber(gameState.maxHP);
}

// 升级点击伤害
// ===== 批量升级点击伤害 =====
function upgradeClick() {
    const select = document.getElementById('upgradeMultiplier');
    const multiplier = select ? select.value : '1';
    const maxUpgrades = multiplier === 'max' ? getMaxAffordable('click') : parseInt(multiplier);
    
    if (maxUpgrades <= 0) {
        showNotification('金币不足!');
        return;
    }
    
    let totalCost = 0;
    let actualUpgrades = 0;
    
    for (let i = 0; i < maxUpgrades; i++) {
        const cost = Math.floor(10 * Math.pow(gameState.clickLevel + i, 1.5));
        if (gameState.gold >= totalCost + cost) {
            totalCost += cost;
            actualUpgrades++;
        } else {
            break;
        }
    }
    
    if (actualUpgrades > 0) {
        gameState.gold -= totalCost;
        gameState.clickLevel += actualUpgrades;
        gameState.clickDamage = gameState.clickLevel;
        showNotification(`⚔️ 点击伤害 +${actualUpgrades} (共 ${gameState.clickLevel} 级)`);
        updateDisplay();
        updateStatsPanel();
        saveGame();
    } else {
        showNotification('金币不足!');
    }
}

// ===== 批量升级秒伤 =====
function upgradeDPS() {
    const select = document.getElementById('upgradeMultiplier');
    const multiplier = select ? select.value : '1';
    const maxUpgrades = multiplier === 'max' ? getMaxAffordable('dps') : parseInt(multiplier);
    
    if (maxUpgrades <= 0) {
        showNotification('金币不足!');
        return;
    }
    
    let totalCost = 0;
    let actualUpgrades = 0;
    
    for (let i = 0; i < maxUpgrades; i++) {
        const cost = Math.floor(10 * Math.pow(gameState.dpsLevel + i, 1.5));
        if (gameState.gold >= totalCost + cost) {
            totalCost += cost;
            actualUpgrades++;
        } else {
            break;
        }
    }
    
    if (actualUpgrades > 0) {
        gameState.gold -= totalCost;
        gameState.dpsLevel += actualUpgrades;
        gameState.dps = gameState.dpsLevel;
        showNotification(`⚔️ 秒伤 +${actualUpgrades} (共 ${gameState.dpsLevel} 级)`);
        updateDisplay();
        updateStatsPanel();
        saveGame();
    } else {
        showNotification('金币不足!');
    }
}

// ===== 获取可购买的 最大数量 =====
function getMaxAffordable(type) {
    let level = type === 'click' ? gameState.clickLevel : gameState.dpsLevel;
    let count = 0;
    
    while (count < 10000) {
        const cost = Math.floor(10 * Math.pow(level + count, 1.5));
        if (gameState.gold >= cost) {
            level++;
            count++;
        } else {
            break;
        }
    }
    return count;
}

// ===== 更新升级费用显示 =====
function updateUpgradeCosts() {
    const multiplier = document.getElementById('upgradeMultiplier').value;
    let clickCost, dpsCost;
    
    if (multiplier === 'max') {
        const maxClick = getMaxAffordable('click');
        const maxDps = getMaxAffordable('dps');
        
        let clickTotal = 0, lvl = gameState.clickLevel;
        for (let i = 0; i < maxClick; i++) clickTotal += Math.floor(10 * Math.pow(lvl + i, 1.5));
        
        let dpsTotal = 0, lvl2 = gameState.dpsLevel;
        for (let i = 0; i < maxDps; i++) dpsTotal += Math.floor(10 * Math.pow(lvl2 + i, 1.5));
        
        clickCost = formatNumber(clickTotal);
        dpsCost = formatNumber(dpsTotal);
    } else {
        const count = parseInt(multiplier);
        let clickTotal = 0, lvl = gameState.clickLevel;
        for (let i = 0; i < count; i++) clickTotal += Math.floor(10 * Math.pow(lvl + i, 1.5));
        
        let dpsTotal = 0, lvl2 = gameState.dpsLevel;
        for (let i = 0; i < count; i++) dpsTotal += Math.floor(10 * Math.pow(lvl2 + i, 1.5));
        
        clickCost = formatNumber(clickTotal);
        dpsCost = formatNumber(dpsTotal);
    }
    
    document.getElementById('clickCost').textContent = clickCost;
    document.getElementById('dpsCost').textContent = dpsCost;
}

// 自动攻击（DPS）
function startAutoAttack() {
    safeInterval('autoAttack', () => {
        if (gameState.playerCurrentHp <= 0) return;
        
        // === 计算基础伤害 ===
        let baseDamage = calculateDPS();
        
        // === 计算命中次数（多重打击 + 连击期望值）===
        let hits = 1;
        if (gameState.artifacts.multiHit > 0) hits += gameState.artifacts.multiHit;
        if (gameState.artifacts.combo > 0) hits += gameState.artifacts.combo * 0.1;
        if (gameState.artifacts.attackSpeed > 0) hits += Math.floor(gameState.artifacts.attackSpeed * 0.1);
        
        // === 计算暴击 ===
        let critMultiplier = 1;
        let isCrit = false;
        const critChance = calculateCrit();
        if (Math.random() * 100 < critChance) {
            critMultiplier = 5 + (gameState.artifacts.critEye > 0 ? (gameState.artifacts.critEye - 1) * 2 : 0);
            if (gameState.artifacts.fatalBlow > 0) critMultiplier *= Math.pow(1.5, gameState.artifacts.fatalBlow);
            // 宠物暴击伤害加成
            if (gameState.activePet) {
                const pet = petConfig.find(p => p.id === gameState.activePet);
                if (pet && pet.bonus.critDamage) critMultiplier += pet.bonus.critDamage / 100;
            }
            isCrit = true;
        }
        
        // === 元素与增伤 ===
        let effectType = 'normal';
        if (gameState.artifacts.fireSoul > 0) {
            baseDamage *= Math.pow(2, gameState.artifacts.fireSoul);
            effectType = 'fire';
        }
        if (gameState.artifacts.lightning > 0) {
            baseDamage *= Math.pow(2, gameState.artifacts.lightning);
            if (effectType !== 'fire') effectType = 'lightning';
        }
        if (gameState.artifacts.iceHeart > 0) {
            baseDamage *= Math.pow(2, gameState.artifacts.iceHeart);
            if (effectType === 'normal') effectType = 'ice';
        }
        if (gameState.artifacts.allDamage > 0) {
            baseDamage *= (1 + gameState.artifacts.allDamage * 0.5);
        }
        // Berserk 低血量增伤
        let isBerserk = false;
        if (gameState.artifacts.berserk > 0 && gameState.playerCurrentHp < gameState.playerMaxHp * 0.3) {
            baseDamage *= Math.pow(1.5, gameState.artifacts.berserk);
            isBerserk = true;
            if (!isCrit) effectType = 'berserk';
        }
        
        baseDamage *= critMultiplier;
        
        // === 连锁闪电（独立额外伤害）===
        let chainDamage = 0;
        if (gameState.artifacts.chainLightning > 0) {
            chainDamage = baseDamage * hits * 0.5 * gameState.artifacts.chainLightning;
        }
        
        // === 总伤害 ===
        let totalDamage = baseDamage * hits + chainDamage;
        
        // === 边界检查 ===
        if (gameState.currentHP > 0) {
            gameState.currentHP -= totalDamage;
            gameState.totalDamage += totalDamage;
        }
        
        // === 金币 ===
        let goldMultiplier = 1;
        if (gameState.artifacts.goldMagnet > 0) goldMultiplier *= Math.pow(1.5, gameState.artifacts.goldMagnet);
        gameState.gold += Math.floor(totalDamage * goldMultiplier);
        
        // === 记录实时DPS + 显示伤害数字 ===
        dpsTracker.addDamage(totalDamage);
        // 使用boss图片中心位置，而不是点击区域
        const bossImage = document.getElementById('bossImage');
        if (bossImage) {
            const rect = bossImage.getBoundingClientRect();
            const bx = rect.left + rect.width / 2;
            const by = rect.top + rect.height / 2;
            if (isCrit) {
                showDamageNumber(totalDamage, bx, by, 'crit');
            } else if (isBerserk) {
                showDamageNumber(totalDamage, bx, by, 'berserk');
            } else if (effectType !== 'normal') {
                showDamageNumber(totalDamage, bx, by, effectType);
            }
        }
        
        // === 特效 ===
        if (chainDamage > 0) createChainLightningEffect();
        
        // === 吸血 ===
        if (gameState.artifacts.lifesteal > 0) {
            const lifestealAmount = Math.floor(totalDamage * 0.05 * gameState.artifacts.lifesteal);
            if (lifestealAmount > 0) {
                gameState.playerCurrentHp = Math.min(gameState.playerMaxHp, gameState.playerCurrentHp + lifestealAmount);
                updatePlayerHP();
            }
        }
        
        if (gameState.currentHP <= 0) killBoss();
        
        updateHPBar();
        updateDisplay();
        updateStatsPanel();
    }, 1000);
}

// 连锁闪电特效
function createChainLightningEffect() {
    const bossArea = document.getElementById('bossClickArea');
    if (!bossArea) return;
    
    const rect = bossArea.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    // 创建多个连锁闪电目标点
    for (let i = 0; i < 3; i++) {
        setTimeout(() => {
            const targetX = x + (Math.random() - 0.5) * 100;
            const targetY = y + (Math.random() - 0.5) * 100;
            createLightningBolt(x, y, targetX, targetY);
        }, i * 100);
    }
}

function createLightningBolt(x1, y1, x2, y2) {
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:9999;';
    
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#aa00ff';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#aa00ff';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    
    // 画之字形闪电
    const segments = 8;
    const dx = (x2 - x1) / segments;
    const dy = (y2 - y1) / segments;
    
    for (let i = 1; i < segments; i++) {
        const offsetX = (Math.random() - 0.5) * 40;
        const offsetY = (Math.random() - 0.5) * 40;
        ctx.lineTo(x1 + dx * i + offsetX, y1 + dy * i + offsetY);
    }
    ctx.lineTo(x2, y2);
    ctx.stroke();
    
    container.appendChild(canvas);
    document.body.appendChild(container);
    setTimeout(() => container.remove(), 300);
}

// 毒液持续伤害系统
let poisonStacks = 0;
let poisonDamagePerTick = 0;

function applyPoison() {
    if (gameState.artifacts.poison > 0 && gameState.currentHP > 0) {
        // 计算毒伤
        const basePoisonDamage = calculateAttack() * 0.5;
        const poisonMultiplier = Math.pow(1.5, gameState.artifacts.poison);
        poisonDamagePerTick = basePoisonDamage * poisonMultiplier;
        poisonStacks = 5; // 5秒持续伤害
    }
}

function startPoisonTick() {
    safeInterval('poisonTick', () => {
        if (poisonStacks > 0 && gameState.currentHP > 0) {
            // 毒液金币加成（受金币磁体影响）
            let goldMultiplier = 1;
            if (gameState.artifacts.goldMagnet > 0) goldMultiplier *= Math.pow(1.5, gameState.artifacts.goldMagnet);
            
            gameState.currentHP -= poisonDamagePerTick;
            gameState.totalDamage += poisonDamagePerTick;
            gameState.gold += Math.floor(poisonDamagePerTick * goldMultiplier);
            poisonStacks--;
            
            // 显示毒伤数字
            showPoisonDamage(poisonDamagePerTick);
            
            if (gameState.currentHP <= 0) killBoss();
            updateHPBar();
            updateDisplay();
        }
    }, 1000);
}

function showPoisonDamage(damage) {
    const bossArea = document.getElementById('bossClickArea');
    if (!bossArea) return;
    
    const rect = bossArea.getBoundingClientRect();
    const float = document.createElement('div');
    float.className = 'damage-float';
    float.textContent = '☠️' + formatNumber(Math.floor(damage));
    float.style.left = (rect.left + rect.width/2 + (Math.random()-0.5)*50) + 'px';
    float.style.top = (rect.top + (Math.random()-0.5)*50) + 'px';
    float.style.color = '#00ff00';
    float.style.fontSize = '1.2em';
    float.style.textShadow = '0 0 10px #00ff00';
    document.body.appendChild(float);
    setTimeout(() => float.remove(), 1000);
}

// 击杀爆炸效果
function createExplosionEffect() {
    const bossArea = document.getElementById('bossClickArea');
    if (!bossArea) return;
    
    const rect = bossArea.getBoundingClientRect();
    const x = rect.left + rect.width/2;
    const y = rect.top + rect.height/2;
    
    // 创建爆炸圆圈
    const explosion = document.createElement('div');
    explosion.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y}px;
        width: 0;
        height: 0;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(255,100,0,0.8) 0%, rgba(255,50,0,0.4) 50%, transparent 70%);
        transform: translate(-50%, -50%);
        pointer-events: none;
        z-index: 9998;
        animation: explosionBurst 0.5s ease-out forwards;
    `;
    document.body.appendChild(explosion);
    setTimeout(() => explosion.remove(), 500);
    
    // 添加爆炸粒子
    for (let i = 0; i < 12; i++) {
        const particle = document.createElement('div');
        const angle = (i / 12) * Math.PI * 2;
        const distance = 80 + Math.random() * 40;
        particle.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            width: 8px;
            height: 8px;
            background: radial-gradient(circle, #fff, #ff6600);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            pointer-events: none;
            z-index: 9999;
            animation: particleExplode 0.6s ease-out forwards;
            --tx: ${Math.cos(angle) * distance}px;
            --ty: ${Math.sin(angle) * distance}px;
        `;
        document.body.appendChild(particle);
        setTimeout(() => particle.remove(), 600);
    }
}

// 添加爆炸样式到页面
const explosionStyle = document.createElement('style');
explosionStyle.textContent = `
    @keyframes explosionBurst {
        0% { width: 0; height: 0; opacity: 1; }
        100% { width: 200px; height: 200px; opacity: 0; }
    }
    @keyframes particleExplode {
        0% { transform: translate(-50%, -50%) translate(0, 0); opacity: 1; }
        100% { transform: translate(-50%, -50%) translate(var(--tx), var(--ty)); opacity: 0; }
    }
`;
document.head.appendChild(explosionStyle);

// ===== 神器系统（解锁机制+金币升级） =====
function openArtifactModal() {
    renderArtifacts();
    document.getElementById('artifactModal').classList.add('active');
}

function closeArtifactModal() {
    document.getElementById('artifactModal').classList.remove('active');
    updateDisplay();
}

// 计算下一个神器解锁价格
function getNextUnlockPrice() {
    const unlockedCount = artifactConfig.filter(a => gameState.artifacts[a.id] !== undefined).length;
    // 价格 = 100 * 1.5^已解锁数量
    return Math.floor(100 * Math.pow(1.5, unlockedCount));
}

function renderArtifacts() {
    const grid = document.getElementById('artifactGrid');
    if (!grid) return;
    grid.innerHTML = '';
    
    const unlockedCount = artifactConfig.filter(a => gameState.artifacts[a.id] !== undefined).length;
    const totalCount = artifactConfig.length;
    const allUnlocked = unlockedCount >= totalCount;
    const nextUnlockPrice = getNextUnlockPrice();
    
    // 更新商店信息（使用HTML模板里已有的DOM元素）
    const shopInfo = document.getElementById('artifactShopInfo');
    const shopBtn = document.getElementById('artifactShopBtn');
    if (shopInfo) {
        if (allUnlocked) {
            shopInfo.textContent = `已解锁: ${unlockedCount}/${totalCount} ✅`;
        } else {
            shopInfo.textContent = `已解锁: ${unlockedCount}/${totalCount} | 下一把: ${formatNumber(nextUnlockPrice)} 💰`;
        }
    }
    if (shopBtn) {
        shopBtn.disabled = allUnlocked || gameState.gold < nextUnlockPrice;
        if (allUnlocked) {
            shopBtn.textContent = '✅ 全部解锁';
        } else {
            shopBtn.textContent = `💰 ${formatNumber(nextUnlockPrice)} 随机解锁`;
        }
    }
    
    // 添加神器列表标题
    const headerDiv = document.createElement('div');
    headerDiv.style.cssText = 'grid-column: 1 / -1; text-align: center; color: var(--text-dim); font-size: 0.78em; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;';
    headerDiv.innerHTML = `已拥有: ${unlockedCount} / ${totalCount} 个神器`;
    grid.appendChild(headerDiv);
    
    artifactConfig.forEach(artifact => {
        if (gameState.artifacts[artifact.id] === undefined) return;
        
        const level = gameState.artifacts[artifact.id] || 0;
        const multiplier = document.getElementById('artifactMultiplier')?.value || '1';
        const maxUpgrades = multiplier === 'max' ? getMaxAffordableArtifact(artifact, level) : parseInt(multiplier);
        
        let totalCost = 0;
        for (let i = 0; i < maxUpgrades; i++) {
            totalCost += getArtifactUpgradeCost(artifact, level + i);
        }
        const canAfford = gameState.gold >= totalCost && maxUpgrades > 0;
        
        const card = document.createElement('div');
        card.className = 'art-card';
        card.innerHTML = `
            <div class="art-icon">${artifact.icon}</div>
            <div class="art-name">${artifact.name}</div>
            <div class="art-lv">等级: ${level}</div>
            <div class="art-desc">${artifact.desc}</div>
            <button class="art-btn" onclick="upgradeArtifact('${artifact.id}')" 
                    ${canAfford ? '' : 'disabled'}>
                ⬆️ ×${maxUpgrades} — ${formatNumber(totalCost)} 💰
            </button>
        `;
        grid.appendChild(card);
    });
}

// 获取神器升级费用（无限升级）
function getArtifactUpgradeCost(artifact, currentLevel) {
    // 基础费用10，每级1.8倍增长，无限升级！
    return Math.floor(10 * Math.pow(1.8, currentLevel));
}

// 解锁随机神器
function buyRandomArtifact() {
    const price = getNextUnlockPrice();
    
    if (gameState.gold < price) {
        showNotification('金币不足!');
        return;
    }
    
    // 检查是否全部解锁
    const lockedArtifacts = artifactConfig.filter(a => gameState.artifacts[a.id] === undefined);
    if (lockedArtifacts.length === 0) {
        showNotification('所有神器已解锁！');
        return;
    }
    
    gameState.gold -= price;
    
    // 随机选择一个未解锁的神器
    const randomArtifact = lockedArtifacts[Math.floor(Math.random() * lockedArtifacts.length)];
    
    // 解锁并给1级
    gameState.artifacts[randomArtifact.id] = 1;
    showNotification(`🎉 解锁 ${randomArtifact.name}！`);
    
    renderArtifacts();
    updateDisplay();
    updatePlayerHP();
    saveGame();
}

// ===== 升级神器（用金币）- 批量升级！=====
function upgradeArtifact(artifactId) {
    const select = document.getElementById('artifactMultiplier');
    const multiplier = select ? select.value : '1';
    
    if (gameState.artifacts[artifactId] === undefined) {
        showNotification('该神器未解锁!');
        return;
    }
    
    const artifact = artifactConfig.find(a => a.id === artifactId);
    let level = gameState.artifacts[artifactId] || 0;
    
    // 计算最大可升级次数
    const maxUpgrades = multiplier === 'max' ? getMaxAffordableArtifact(artifact, level) : parseInt(multiplier);
    
    if (maxUpgrades <= 0) {
        showNotification('金币不足!');
        return;
    }
    
    let totalCost = 0;
    for (let i = 0; i < maxUpgrades; i++) {
        totalCost += getArtifactUpgradeCost(artifact, level + i);
    }
    
    if (gameState.gold >= totalCost) {
        gameState.gold -= totalCost;
        level += maxUpgrades;
        gameState.artifacts[artifactId] = level;
        showNotification(`${artifact.name} → Lv.${level} (+${maxUpgrades})！`);
        renderArtifacts();
        updateDisplay();
        updatePlayerHP();
        saveGame();
    } else {
        showNotification('金币不足!');
    }
}

function getMaxAffordableArtifact(artifact, startLevel) {
    let count = 0;
    let totalCost = 0;
    while (count < 10000) {
        const cost = getArtifactUpgradeCost(artifact, startLevel + count);
        if (gameState.gold >= totalCost + cost) {
            totalCost += cost;
            count++;
        } else {
            break;
        }
    }
    return count;
}

// ===== 装备系统 =====
function openInventoryModal() {
    renderInventory();
    document.getElementById('inventoryModal').classList.add('active');
}

function closeInventoryModal() {
    document.getElementById('inventoryModal').classList.remove('active');
}

function renderInventory() {
    const grid = document.getElementById('inventoryGrid');
    if (!grid) return;
    grid.innerHTML = '';
    
    const qualityColors = {
        common: '#ffffff',
        rare: '#0070ff',
        epic: '#a335ee',
        legendary: '#ff8000',
        mythic: '#ff0000'
    };
    
    gameState.inventory.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'inv-item';
        div.style.borderColor = qualityColors[item.quality];
        div.style.borderWidth = '1px';
        div.style.borderStyle = 'solid';
        div.onclick = () => showItemDetail(item, index);
        
        let statsText = '';
        if (item.stats.attack) statsText += `⚔️+${item.stats.attack} `;
        if (item.stats.defense) statsText += `🛡️+${item.stats.defense} `;
        if (item.stats.maxHp) statsText += `❤️+${item.stats.maxHp} `;
        if (item.stats.crit) statsText += `💥+${(item.stats.crit*100).toFixed(0)}% `;
        if (item.stats.critDamage) statsText += `🔥+${(item.stats.critDamage*100).toFixed(0)}% `;
        
        let mythicBadge = '';
        if (item.quality === 'mythic' && item.abilities && item.abilities.length > 0) {
            mythicBadge = `<div style="color: #ffcc00; font-size: 0.72em; margin-top: 3px;">🌟×${item.abilities.length}</div>`;
        }
        
        div.innerHTML = `
            <div class="inv-item-icon">${item.icon || '📦'}</div>
            <div class="inv-item-name" style="color: ${qualityColors[item.quality]}; font-size: 0.78em;">${item.name}</div>
            <div style="font-size: 0.68em; color: #555; margin-top: 2px;">${statsText}</div>
            ${mythicBadge}
        `;
        grid.appendChild(div);
    });
    
    // 更新背包数量
    const countEl = document.getElementById('inventoryCount');
    if (countEl) countEl.textContent = gameState.inventory.length;
    
    // 更新装备槽位显示
    renderEquipSlotsGrid();
}

// 渲染装备槽位网格
function renderEquipSlotsGrid() {
    const slots = ['weapon', 'helmet', 'armor', 'ring', 'necklace', 'boots'];
    const slotNames = { weapon: '⚔️武器', helmet: '🪖头盔', armor: '🛡️护甲', ring: '💍戒指', necklace: '📿项链', boots: '👢鞋子' };
    const qualityColors = { common: '#aaa', rare: '#0070ff', epic: '#a335ee', legendary: '#ff8000', mythic: '#ff0000' };
    
    const container = document.getElementById('equipSlotsGrid');
    if (!container) return;
    container.innerHTML = '';
    
    slots.forEach(slot => {
        const item = gameState.equipment[slot];
        const div = document.createElement('div');
        div.className = 'equip-slot' + (item ? ' filled' : '');
        div.style.borderColor = item ? qualityColors[item.quality] : '';
        div.onclick = () => item && showEquippedItemDetail(item, slot);
        div.innerHTML = `
            <div class="slot-icon">${item ? (item.icon || '📦') : slotNames[slot].charAt(0)}</div>
            <div class="slot-label" style="font-size:0.65em;color:${item ? qualityColors[item.quality] : 'var(--text-dim)'};">${item ? item.name : slotNames[slot]}</div>
        `;
        container.appendChild(div);
    });
}

// ===== 查看已装备物品详情 =====
function showEquippedItemDetail(item, slot) {
    // 查找物品在背包中的索引（如果存在）
    const index = gameState.inventory.findIndex(i => 
        i.name === item.name && i.slot === item.slot && i.quality === item.quality
    );
    showItemDetail(item, index >= 0 ? index : -1);
}

let selectedItem = null;
let selectedItemIndex = null;

function showItemDetail(item, index) {
    selectedItem = item;
    selectedItemIndex = index;
    
    const qualityColors = {
        common: '#ffffff',
        rare: '#0070ff',
        epic: '#a335ee',
        legendary: '#ff8000',
        mythic: '#ff0000'
    };
    
    const qualityNames = {
        common: '普通',
        rare: '稀有',
        epic: '史诗',
        legendary: '传说',
        mythic: '神话'
    };
    
    document.getElementById('itemDetailName').textContent = item.name;
    document.getElementById('itemDetailName').style.color = qualityColors[item.quality];
    document.getElementById('itemDetailQuality').textContent = qualityNames[item.quality];
    document.getElementById('itemDetailQuality').style.color = qualityColors[item.quality];
    document.getElementById('itemDetailLevel').textContent = item.level || 1;
    
    let statsHTML = '';
    Object.keys(item.stats).forEach(stat => {
        const statNames = {
            attack: '攻击力',
            defense: '防御力',
            maxHp: '最大生命',
            crit: '暴击率',
            critDamage: '暴击伤害',
            allDamage: '全伤害',
            fireDamage: '火焰伤害',
            iceDamage: '冰霜伤害',
            lightningDamage: '雷电伤害',
            lifesteal: '生命偷取',
            fireResist: '火焰抗性',
            iceResist: '冰霜抗性',
            allResist: '全抗性',
            damageReduce: '伤害减免',
            regen: '生命回复',
            moveSpeed: '移动速度',
            dodge: '闪避率',
            goldBonus: '金币加成'
        };
        const name = statNames[stat] || stat;
        const value = stat.includes('Bonus') || stat.includes('Damage') || stat.includes('Reduce') || stat.includes('Resist') || stat === 'crit' ? `${item.stats[stat] * 100}%` : item.stats[stat];
        statsHTML += `<div>${name}: +${value}</div>`;
    });
    
    // 神话装备特殊能力
    if (item.quality === 'mythic' && item.abilities && item.abilities.length > 0) {
        statsHTML += `<div style="margin-top: 15px; border-top: 1px solid #444; padding-top: 10px;">`;
        statsHTML += `<div style="color: #ffcc00; font-weight: bold; margin-bottom: 8px;">🌟 神话能力 (${item.abilities.length})</div>`;
        item.abilities.forEach(ability => {
            statsHTML += `<div style="color: #ff66ff; font-size: 0.9em; margin: 3px 0;">${ability.icon} ${ability.name}: ${ability.desc}</div>`;
        });
        statsHTML += `</div>`;
    }
    
    document.getElementById('itemDetailStats').innerHTML = statsHTML;
    
    const currentEquipped = gameState.equipment[item.slot];
    // 如果物品已在身上，显示"卸下装备"；否则显示"装备"或"更换装备"
    const isEquipped = selectedItemIndex === -1 || (currentEquipped && currentEquipped.name === item.name);
    document.getElementById('itemActionBtn').textContent = isEquipped ? '卸下装备' : (currentEquipped ? '更换装备' : '装备');
    
    document.getElementById('itemDetailModal').classList.add('active');
}

function handleItemAction() {
    if (!selectedItem) return;
    
    const slot = selectedItem.slot;
    
    // 如果查看的是已装备物品且不在背包中（index = -1），则卸下装备
    if (selectedItemIndex === -1) {
        gameState.inventory.push(selectedItem);
        gameState.equipment[slot] = null;
        showNotification(`卸下装备: ${selectedItem.name}`);
        closeItemDetailModal();
        renderInventory();
        updatePlayerHP();
        updateDisplay();
        saveGame();
        return;
    }
    
    // 如果有已装备的物品，换下来
    if (gameState.equipment[slot]) {
        gameState.inventory.push(gameState.equipment[slot]);
    }
    
    // 装备新物品
    gameState.equipment[slot] = selectedItem;
    gameState.inventory.splice(selectedItemIndex, 1);
    
    showNotification(`装备成功: ${selectedItem.name}`);
    closeItemDetailModal();
    renderInventory();
    updatePlayerHP();
    updateDisplay();
    saveGame();
}

function closeItemDetailModal() {
    document.getElementById('itemDetailModal').classList.remove('active');
    selectedItem = null;
    selectedItemIndex = null;
}

// ===== 一键穿戴（按品质筛选）=====
function equipByQuality() {
    const filter = document.getElementById('equipQualityFilter').value;
    const slots = ['weapon', 'helmet', 'armor', 'ring', 'necklace', 'boots'];
    
    // 品质优先级
    const qualityPriority = { mythic: 5, legendary: 4, epic: 3, rare: 2, common: 1 };
    
    // 筛选品质阈值
    const qualityThreshold = qualityPriority[filter] || 0;
    
    let equippedCount = 0;
    let skipCount = 0;
    
    slots.forEach(slot => {
        // 找出背包中该槽位、满足品质要求的装备
        let slotItems = gameState.inventory.filter(item => item.slot === slot);
        
        // 按品质筛选
        if (filter === 'mythic') {
            slotItems = slotItems.filter(item => item.quality === 'mythic');
        } else {
            slotItems = slotItems.filter(item => (qualityPriority[item.quality] || 0) >= qualityThreshold);
        }
        
        if (slotItems.length === 0) return;
        
        // 按品质和属性排序
        slotItems.sort((a, b) => {
            const qualityDiff = (qualityPriority[b.quality] || 0) - (qualityPriority[a.quality] || 0);
            if (qualityDiff !== 0) return qualityDiff;
            const aStats = Object.values(a.stats || {}).reduce((sum, v) => sum + v, 0);
            const bStats = Object.values(b.stats || {}).reduce((sum, v) => sum + v, 0);
            return bStats - aStats;
        });
        
        const bestItem = slotItems[0];
        const itemIndex = gameState.inventory.findIndex(item => item === bestItem);
        
        if (itemIndex !== -1) {
            gameState.equipment[slot] = bestItem;
            gameState.inventory.splice(itemIndex, 1);
            equippedCount++;
        }
    });
    
    if (equippedCount > 0) {
        showNotification(`🎯 穿戴成功！装备了 ${equippedCount} 件 ${getQualityText(filter)}+ 装备`);
    } else {
        showNotification(`🎯 背包中没有符合条件的装备`);
    }
    
    renderInventory();
    updatePlayerHP();
    updateDisplay();
    saveGame();
}

// ===== 一键出售（按品质筛选）=====
function sellByQuality() {
    const filter = document.getElementById('sellQualityFilter').value;
    
    if (gameState.inventory.length === 0) {
        showNotification(`💰 背包是空的`);
        return;
    }
    
    // 品质价格
    const qualityPrices = { common: 10, rare: 50, epic: 200, legendary: 1000, mythic: 5000 };
    const qualityPriority = { common: 1, rare: 2, epic: 3, legendary: 4, mythic: 5 };
    
    let itemsToSell = [];
    let itemsToKeep = [];
    
    // 根据筛选条件分类物品
    gameState.inventory.forEach(item => {
        const itemPriority = qualityPriority[item.quality] || 0;
        let shouldSell = false;
        
        if (filter === 'all') {
            shouldSell = true;
        } else if (filter === 'common') {
            shouldSell = item.quality === 'common';
        } else {
            const threshold = qualityPriority[filter] || 0;
            shouldSell = itemPriority >= threshold;
        }
        
        if (shouldSell) {
            itemsToSell.push(item);
        } else {
            itemsToKeep.push(item);
        }
    });
    
    if (itemsToSell.length === 0) {
        showNotification(`💰 没有符合条件的物品可出售`);
        return;
    }
    
    // 计算总价
    let totalGold = 0;
    itemsToSell.forEach(item => {
        totalGold += qualityPrices[item.quality] || 10;
    });
    
    gameState.gold += totalGold;
    gameState.inventory = itemsToKeep;
    
    const filterText = filter === 'all' ? '全部' : getQualityText(filter) + '+';
    showNotification(`💰 出售成功！${itemsToSell.length} 件 ${filterText}装备，获得 ${formatNumber(totalGold)} 金币`);
    
    renderInventory();
    updateDisplay();
    saveGame();
}

// 获取品质中文名
function getQualityText(quality) {
    const names = { common: '普通', rare: '稀有', epic: '史诗', legendary: '传说', mythic: '神话' };
    return names[quality] || quality;
}

// ===== 宠物系统 =====
function openPetModal() {
    renderPets();
    document.getElementById('petModal').classList.add('active');
}

function closePetModal() {
    document.getElementById('petModal').classList.remove('active');
}

function renderPets() {
    // 显示当前宠物
    const activeDisplay = document.getElementById('activePetDisplay');
    if (gameState.activePet && petConfig.find(p => p.id === gameState.activePet)) {
        const pet = petConfig.find(p => p.id === gameState.activePet);
        const level = gameState.pets[gameState.activePet] || 1;
        activeDisplay.innerHTML = `
            <div class="pet-avatar">${pet.icon}</div>
            <div class="pet-name">${pet.name} Lv.${level}</div>
            <div class="pet-bonus">${pet.desc}</div>
            <button class="cancel-btn" onclick="unequipPet()">卸下宠物</button>
        `;
    } else {
        activeDisplay.innerHTML = '<div class="no-pet">未装备宠物</div>';
    }
    
    // 宠物列表
    const petGrid = document.getElementById('petGrid');
    petGrid.innerHTML = '';
    
    const rarityColors = {
        common: '#ffffff',
        rare: '#0070ff',
        epic: '#a335ee',
        legendary: '#ff8000',
        mythic: '#ff0000'
    };
    
    const rarityNames = {
        common: '普通',
        rare: '稀有',
        epic: '史诗',
        legendary: '传说',
        mythic: '神话'
    };
    
    petConfig.forEach(pet => {
        const owned = gameState.pets[pet.id] > 0;
        const equipped = gameState.activePet === pet.id;
        
        const card = document.createElement('div');
        card.className = `pet-card ${owned ? 'owned' : ''} ${equipped ? 'equipped' : ''}`;
        card.style.borderColor = rarityColors[pet.rarity];
        
        const level = gameState.pets[pet.id] || 1;
        const bonus = pet.bonus.dps ? `DPS +${pet.bonus.dps * level}` :
                      pet.bonus.gold ? `金币 +${pet.bonus.gold}%` :
                      pet.bonus.crit ? `暴击 +${pet.bonus.crit}%` :
                      pet.bonus.attack ? `攻击 +${pet.bonus.attack * level}` :
                      pet.bonus.allDamage ? `全伤害 +${pet.bonus.allDamage}%` :
                      pet.bonus.maxHp ? `生命 +${pet.bonus.maxHp}` : '';
        
        card.innerHTML = `
            <div class="pet-icon">${pet.icon}</div>
            <div class="pet-name" style="color: ${rarityColors[pet.rarity]}">${pet.name}</div>
            <div class="pet-rarity" style="color: ${rarityColors[pet.rarity]}">${rarityNames[pet.rarity]}</div>
            <div class="pet-bonus">${pet.desc}</div>
            ${owned ? `<div style="margin-top: 8px; color: #ffd700;">等级: ${level}</div>` : ''}
            ${equipped ? '<div style="margin-top: 8px; color: #00ff00;">已出战</div>' : 
              owned ? `<button class="confirm-btn" style="margin-top: 8px; padding: 5px 15px; font-size: 0.9em;" onclick="equipPet('${pet.id}')">出战</button>` : ''}
        `;
        
        petGrid.appendChild(card);
    });
    
    // 宠物商店
    const shopGrid = document.getElementById('petShopGrid');
    shopGrid.innerHTML = '';
    
    petConfig.forEach(pet => {
        const owned = gameState.pets[pet.id] > 0;
        
        const card = document.createElement('div');
        card.className = 'pet-card';
        card.style.borderColor = rarityColors[pet.rarity];
        
        card.innerHTML = `
            <div class="pet-icon">${pet.icon}</div>
            <div class="pet-name" style="color: ${rarityColors[pet.rarity]}">${pet.name}</div>
            <div class="pet-rarity" style="color: ${rarityColors[pet.rarity]}">${rarityNames[pet.rarity]}</div>
            <div class="pet-bonus">${pet.desc}</div>
            <div class="pet-price">🔄 ${pet.rebirthCost} 重生点</div>
            <button class="artifact-buy-btn" onclick="buyPet('${pet.id}')" 
                    ${!owned && gameState.rebirthPoints >= pet.rebirthCost ? '' : 'disabled'}>
                ${owned ? '已拥有' : '购买'}
            </button>
        `;
        
        shopGrid.appendChild(card);
    });
    
    document.getElementById('petPointsDisplay').textContent = formatNumber(gameState.rebirthPoints || 0);
}

function buyPet(petId) {
    const pet = petConfig.find(p => p.id === petId);
    
    if (gameState.rebirthPoints >= pet.rebirthCost) {
        gameState.rebirthPoints -= pet.rebirthCost;
        gameState.pets[pet.id] = 1;
        showNotification(`购买宠物: ${pet.name}! -${pet.rebirthCost} 重生点`);
        renderPets();
        updateDisplay();
        saveGame();
    } else {
        showNotification(`重生点不足! 需要 ${pet.rebirthCost} 重生点`);
    }
}

function equipPet(petId) {
    if (gameState.pets[petId] > 0) {
        gameState.activePet = petId;
        showNotification('宠物出战成功!');
        renderPets();
        updateDisplay();
        saveGame();
    }
}

function unequipPet() {
    gameState.activePet = null;
    showNotification('宠物已卸下');
    renderPets();
    updateDisplay();
    saveGame();
}

// ===== 重生系统（重生点买宠物，宠物永久保留）=====
function calculateRebirthReward() {
    // 等级越高点数越多，指数增长
    const lv = gameState.maxLevel;
    let points = Math.floor(lv * 0.5);
    if (lv >= 30) points += Math.floor((lv - 30) * 1);
    if (lv >= 50) points += Math.floor((lv - 50) * 3);
    if (lv >= 100) points += Math.floor((lv - 100) * 5);
    return Math.max(1, points);
}

function openRebirthModal() {
    if (gameState.maxLevel < 10) {
        showNotification('需要达到第10关才能重生!');
        return;
    }
    const rebirthReward = calculateRebirthReward();
    document.getElementById('rebirthReward').textContent = `${rebirthReward} 重生点 (宠物和神器永久保留!)`;
    document.getElementById('rebirthModal').classList.add('active');
}

function closeRebirthModal() {
    document.getElementById('rebirthModal').classList.remove('active');
}

function rebirth() {
    const rebirthReward = calculateRebirthReward();
    
    // 保留永久数据
    const savedArtifacts = {...gameState.artifacts};
    const savedPets = {...gameState.pets};
    const savedRebirthPoints = gameState.rebirthPoints + rebirthReward;
    const savedTotalRebirths = (gameState.totalRebirths || 0) + 1;
    const savedTotalBossKills = gameState.totalBossKills || 0;
    
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
        playerMaxHp: 500,
        playerCurrentHp: 500,
        rebirthPoints: savedRebirthPoints,  // 重生点永久保留
        totalRebirths: savedTotalRebirths,  // 累计重生次数
        artifacts: savedArtifacts,  // 神器永久保存
        equipment: {
            weapon: null,
            helmet: null,
            armor: null,
            ring: null,
            necklace: null,
            boots: null
        },
        inventory: [],
        pets: savedPets,           // 宠物永久保留
        activePet: null,
        totalDamage: 0,
        totalBossKills: savedTotalBossKills,
        startTime: Date.now(),
        lastSaveTime: Date.now()
    };
    
    // 富豪勋章加成
    if (gameState.artifacts.wealthMedal > 0) {
        gameState.gold = Math.floor(200 * gameState.artifacts.wealthMedal);
    }
    
    closeRebirthModal();
    updateBoss();
    updateDisplay();
    updatePlayerHP();
    renderArtifacts();
    renderInventory();
    renderPets();
    showNotification(`重生成功! 神器+宠物永久保留! 获得 ${rebirthReward} 重生点! (累计: ${savedRebirthPoints})`);
    saveGame();
}

// 更新显示
function updateDisplay() {
    document.getElementById('gold').textContent = formatNumber(gameState.gold);
    document.getElementById('currentLevel').textContent = gameState.level;
    document.getElementById('clickDamage').textContent = formatNumber(calculateAttack());
    // 实时DPS：优先显示实际DPS，无数据时显示理论DPS
    const realDps = dpsTracker.getRealDps();
    document.getElementById('dps').textContent = formatNumber(realDps > 0 ? realDps : calculateDPS());
    // 快捷数据条的金币显示
    const gd = document.getElementById('goldDisplay');
    if (gd) gd.textContent = formatNumber(gameState.gold);
    document.getElementById('playerLevel').textContent = gameState.clickLevel;
    document.getElementById('clickCost').textContent = formatNumber(Math.floor(10 * Math.pow(gameState.clickLevel, 1.5)));
    document.getElementById('dpsCost').textContent = formatNumber(Math.floor(10 * Math.pow(gameState.dpsLevel, 1.5)));
    document.getElementById('clickLevel').textContent = gameState.clickLevel;
    document.getElementById('dpsLevel').textContent = gameState.dpsLevel;
    document.getElementById('rebirthBtn').disabled = gameState.maxLevel < 10;
    
    // 重生点显示
    const rps = document.getElementById('rebirthPointsDisplay');
    if (rps) rps.textContent = gameState.rebirthPoints || 0;
    const rps2 = document.getElementById('rebirthPointsDisplay2');
    if (rps2) rps2.textContent = gameState.rebirthPoints || 0;
    const trc = document.getElementById('totalRebirthsDisplay');
    if (trc) trc.textContent = gameState.totalRebirths || 0;
    
    document.querySelectorAll('.upgrade-btn')[0].disabled = gameState.gold < Math.floor(10 * Math.pow(gameState.clickLevel, 1.5));
    document.querySelectorAll('.upgrade-btn')[1].disabled = gameState.gold < Math.floor(10 * Math.pow(gameState.dpsLevel, 1.5));
    
    // 更新详细数据面板（实时刷新）
    updateStatsPanel();
}

// 更新详细数据面板（带来源分解和百分比）
function updateStatsPanel() {
    if (!document.getElementById('statDpsTotal')) return;
    
    const powerBookLv = gameState.artifacts.powerBook || 0;
    const sharpnessLv = gameState.artifacts.sharpness || 0;
    const critEyeLv = gameState.artifacts.critEye || 0;
    const fatalBlowLv = gameState.artifacts.fatalBlow || 0;
    const goldMagnetLv = gameState.artifacts.goldMagnet || 0;
    const treasureMapLv = gameState.artifacts.treasureMap || 0;
    const doubleGoldLv = gameState.artifacts.doubleGold || 0;
    const dodgeLv = gameState.artifacts.dodge || 0;
    const regenLv = gameState.artifacts.regen || 0;
    
    // ========== DPS 分解 ==========
    const baseDps = gameState.dps;
    const powerBookMult = powerBookLv > 0 ? Math.pow(1.5, powerBookLv) : 1;
    const sharpnessMult = sharpnessLv > 0 ? Math.pow(1.25, sharpnessLv) : 1;
    const totalArtifactMult = powerBookMult * sharpnessMult;
    
    // 基础 * 神器倍率后的值（不含宠装加成）
    const dpsAfterArtifact = baseDps * totalArtifactMult;
    
    // 宠物DPS加成
    let petDpsBonus = 0;
    let petGoldMult = 1;
    let petName = '';
    if (gameState.activePet) {
        const pet = petConfig.find(p => p.id === gameState.activePet);
        if (pet) {
            if (pet.bonus.dps) petDpsBonus = pet.bonus.dps * (gameState.pets[gameState.activePet] || 1);
            if (pet.bonus.gold) petGoldMult = 1 + pet.bonus.gold / 100;
            petName = pet.icon + ' ' + pet.name;
        }
    }
    
    // 装备DPS加成
    let equipDpsBonus = 0;
    let equipDetails = [];
    Object.values(gameState.equipment).forEach((item, idx) => {
        if (item && item.stats && item.stats.attack) {
            equipDpsBonus += item.stats.attack;
            equipDetails.push({ name: (item.icon || '⚔️') + ' ' + item.name, value: item.stats.attack });
        }
    });
    
    // 全能戒指
    const allDamageLv = gameState.artifacts.allDamage || 0;
    const allDamageBonus = allDamageLv > 0 ? allDamageLv * 0.5 : 0;
    
    const totalDps = calculateDPS();
    
    // 合成DPS分解列表
    const dpsItems = [];
    dpsItems.push({ name: '📊 基础DPS', value: baseDps, mult: 1 });
    if (powerBookLv > 0) dpsItems.push({ name: '📖 力量之书', value: dpsAfterArtifact - baseDps, mult: 1, note: '×' + powerBookMult.toFixed(2) });
    if (sharpnessLv > 1) dpsItems.push({ name: '🗡️ 锋利之爪', value: (baseDps * powerBookMult * sharpnessMult) - (baseDps * powerBookMult), mult: 1, note: '×' + sharpnessMult.toFixed(2) });
    if (allDamageLv > 0) dpsItems.push({ name: '🌟 全能戒指', value: totalDps * allDamageBonus, mult: 1, note: '+' + (allDamageLv * 50) + '%' });
    if (petDpsBonus > 0) dpsItems.push({ name: petName || '🐾 宠物', value: petDpsBonus, mult: 0 });
    if (equipDpsBonus > 0) {
        if (equipDetails.length > 0) {
            equipDetails.forEach(e => dpsItems.push({ name: e.name, value: e.value, mult: 0 }));
        } else {
            dpsItems.push({ name: '⚔️ 装备', value: equipDpsBonus, mult: 0 });
        }
    }
    
    document.getElementById('statDpsTotal').textContent = formatNumber(totalDps);
    // 实时DPS显示
    const realDpsEl = document.getElementById('statRealDps');
    if (realDpsEl) realDpsEl.textContent = formatNumber(dpsTracker.getRealDps());
    renderBreakdownList('dpsBreakdown', dpsItems, totalDps);
    
    // ========== 金币分解 ==========
    const baseGoldPerSec = totalDps;
    let goldMagnetBonus = goldMagnetLv > 0 ? goldMagnetLv * 0.5 : 0;
    let treasureMapBonus = treasureMapLv > 0 ? treasureMapLv * 0.5 : 0;
    let doubleGoldBonus = doubleGoldLv > 0 ? doubleGoldLv * 1 : 0;
    
    const goldMultiplier = (1 + goldMagnetBonus) * (1 + treasureMapBonus) * (1 + doubleGoldBonus) * petGoldMult;
    const totalGoldPerSec = baseGoldPerSec * goldMultiplier;
    
    const goldItems = [];
    goldItems.push({ name: '💥 DPS转化', value: baseGoldPerSec, mult: 1 });
    if (goldMagnetLv > 0) goldItems.push({ name: '🧲 金币磁铁', value: baseGoldPerSec * goldMagnetBonus, mult: 1, note: '×' + (1 + goldMagnetBonus).toFixed(2) });
    if (treasureMapLv > 0) goldItems.push({ name: '🗺️ 宝藏地图', value: baseGoldPerSec * treasureMapBonus, mult: 1, note: '×' + (1 + treasureMapBonus).toFixed(2) });
    if (doubleGoldLv > 0) goldItems.push({ name: '✨ 黄金双倍', value: baseGoldPerSec * doubleGoldBonus, mult: 1, note: '×' + (1 + doubleGoldBonus).toFixed(2) });
    if (petGoldMult > 1) goldItems.push({ name: petName || '🐾 宠物金币', value: baseGoldPerSec * (petGoldMult - 1), mult: 1, note: '×' + petGoldMult.toFixed(2) });
    
    document.getElementById('statGoldPerSec').textContent = formatNumber(totalGoldPerSec);
    renderBreakdownList('goldBreakdown', goldItems, totalGoldPerSec);
    
    // ========== 点击伤害分解 ==========
    const baseClick = gameState.clickDamage;
    const totalClick = calculateAttack();
    
    // 计算各来源贡献
    let petClickBonus = 0;
    if (gameState.activePet) {
        const pet = petConfig.find(p => p.id === gameState.activePet);
        if (pet && pet.bonus.attack) petClickBonus = pet.bonus.attack * (gameState.pets[gameState.activePet] || 1);
    }
    
    let equipClickBonus = 0;
    let equipClickDetails = [];
    Object.values(gameState.equipment).forEach(item => {
        if (item && item.stats && item.stats.attack) {
            equipClickBonus += item.stats.attack;
            equipClickDetails.push({ name: (item.icon || '⚔️') + ' ' + item.name, value: item.stats.attack });
        }
    });
    
    // 神器贡献 = 基础 * (multiplier - 1) + allDamage贡献
    const artifactClickContrib = totalClick - baseClick - petClickBonus - equipClickBonus;
    
    const clickItems = [];
    clickItems.push({ name: '📊 基础点击', value: baseClick, mult: 1 });
    if (artifactClickContrib > 0.01 || artifactClickContrib < -0.01) {
        clickItems.push({ name: '📖🗡️🌟 神器加成', value: artifactClickContrib, mult: 1, note: '×' + totalArtifactMult.toFixed(2) });
    }
    if (petClickBonus > 0) clickItems.push({ name: petName || '🐾 宠物', value: petClickBonus, mult: 0 });
    if (equipClickBonus > 0) {
        if (equipClickDetails.length > 0) {
            equipClickDetails.forEach(e => clickItems.push({ name: e.name, value: e.value, mult: 0 }));
        } else {
            clickItems.push({ name: '⚔️ 装备', value: equipClickBonus, mult: 0 });
        }
    }
    
    document.getElementById('statClickTotal').textContent = formatNumber(totalClick);
    renderBreakdownList('clickBreakdown', clickItems, totalClick);
    
    // ========== 暴击 & 其他 ==========
    document.getElementById('statCritRate').textContent = calculateCrit().toFixed(1) + '%';
    let critDmgMult = 5 + (critEyeLv > 0 ? (critEyeLv - 1) * 2 : 0);
    if (fatalBlowLv > 0) critDmgMult *= Math.pow(1.5, fatalBlowLv);
    document.getElementById('statCritDmg').textContent = '×' + critDmgMult.toFixed(2);
    document.getElementById('statDodge').textContent = (dodgeLv * 10) + '%';
    document.getElementById('statRegen').textContent = (regenLv * 5) + '/s';
    
    // 累计统计
    const std = document.getElementById('statTotalDmg');
    if (std) std.textContent = formatNumber(gameState.totalDamage || 0);
    const stk = document.getElementById('statTotalKills');
    if (stk) stk.textContent = formatNumber(gameState.totalBossKills || 0);
    
    // 神器商店信息（可能不存在于右侧面板时调用）
    const shopInfo = document.getElementById('artifactShopInfo');
    if (shopInfo) {
        const unlocked = artifactConfig.filter(a => gameState.artifacts[a.id] !== undefined).length;
        shopInfo.textContent = `已解锁: ${unlocked}/${artifactConfig.length} | 价格: ${formatNumber(getNextUnlockPrice())} 💰`;
    }
    const shopBtn = document.getElementById('artifactShopBtn');
    if (shopBtn) shopBtn.disabled = gameState.gold < getNextUnlockPrice() || unlocked >= artifactConfig.length;
}

// 渲染分解列表（带百分比）
function renderBreakdownList(containerId, items, total) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    
    items.forEach(item => {
        const pct = total > 0 ? Math.min(100, (item.value / total * 100)) : 0;
        const row = document.createElement('div');
        const isZero = Math.abs(item.value) < 0.01;
        row.className = 'sbrow' + (isZero ? '' : '');
        row.style.opacity = isZero ? '0.25' : '1';
        
        let valueStr = '';
        if (item.mult === 1) {
            valueStr = item.value >= 0 ? '+' + formatNumber(item.value) : formatNumber(item.value);
        } else {
            valueStr = '×' + item.value.toFixed(2);
        }
        if (item.note) valueStr += ' ' + item.note;
        
        row.innerHTML = `
            <span class="sbrow-name">${item.name}</span>
            <span class="sbrow-value">${valueStr}</span>
            <span class="sbrow-pct">${pct.toFixed(0)}%</span>
        `;
        container.appendChild(row);
    });
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
        gameState = {...gameState, ...loaded};
        
        // 不要初始化神器！已解锁的会在loaded里，没解锁的保持undefined
        if (!gameState.artifacts) {
            gameState.artifacts = {};
            // 注释掉这行！否则所有神器都会变成level 0（解锁状态）
            // artifactConfig.forEach(a => {
            //     gameState.artifacts[a.id] = 0;
            // });
        }
        
        if (!gameState.pets) gameState.pets = {};
        if (!gameState.inventory) gameState.inventory = [];
        if (!gameState.equipment) gameState.equipment = {
            weapon: null, helmet: null, armor: null,
            ring: null, necklace: null, boots: null
        };
        
        // 修复旧存档的血量
        if (!gameState.playerMaxHp) gameState.playerMaxHp = 500;
        if (!gameState.playerCurrentHp) gameState.playerCurrentHp = gameState.playerMaxHp;
        if (!gameState.lastSaveTime) gameState.lastSaveTime = Date.now();
        // 兼容旧存档：新字段默认值
        if (gameState.rebirthPoints === undefined) gameState.rebirthPoints = 0;
        if (gameState.totalRebirths === undefined) gameState.totalRebirths = 0;
        if (gameState.totalBossKills === undefined) gameState.totalBossKills = 0;
        // 旧存档 petPoints 迁移到 rebirthPoints
        if (gameState.petPoints && !gameState.rebirthPoints) {
            gameState.rebirthPoints = gameState.petPoints;
            delete gameState.petPoints;
        }
    }
}

// 游戏计时器
function startGameTimer() {
    safeInterval('gameTimer', () => {
        // 生命回复
        if (gameState.artifacts.regen > 0 && gameState.playerCurrentHp < gameState.playerMaxHp) {
            const regenAmount = gameState.playerMaxHp * 0.01 * gameState.artifacts.regen;
            gameState.playerCurrentHp = Math.min(gameState.playerMaxHp, gameState.playerCurrentHp + regenAmount);
            updatePlayerHP();
        }
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



