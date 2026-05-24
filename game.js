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
    petPoints: 0,
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
    startTime: Date.now(),
    lastSaveTime: Date.now()
};

// 神器配置（40个）
const artifactConfig = [
    {id: 'powerBook', icon: '📖', name: '力量之书', desc: '所有伤害 +50%', baseCost: 10, costMult: 1.5, maxLevel: 100},
    {id: 'wealthMedal', icon: '🏅', name: '富豪勋章', desc: '重生后初始金币 +200%', baseCost: 50, costMult: 2, maxLevel: 50},
    {id: 'critEye', icon: '👁️', name: '暴击之眼', desc: '暴击率 +5%, 倍数 +2', baseCost: 100, costMult: 3, maxLevel: 20},
    {id: 'hourglass', icon: '⏳', name: '时间沙漏', desc: '离线收益 50% DPS', baseCost: 200, costMult: 2, maxLevel: 10},
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
    {id: 'goldMagnet', icon: '🧲', name: '金币磁铁', desc: '金币掉落 +50%', baseCost: 25, costMult: 1.8, maxLevel: 50},
    {id: 'treasureMap', icon: '🗺️', name: '宝藏地图', desc: '击杀金币 +50%', baseCost: 35, costMult: 2, maxLevel: 40},
    {id: 'luckyClover', icon: '🍀', name: '幸运四叶草', desc: '稀有掉落 +10%', baseCost: 100, costMult: 3, maxLevel: 20},
    {id: 'merchant', icon: '💼', name: '商人条约', desc: '出售价值 +100%', baseCost: 60, costMult: 2.5, maxLevel: 30},
    {id: 'idleGold', icon: '🏦', name: '银行家保险箱', desc: '离线金币 +100%', baseCost: 150, costMult: 2.5, maxLevel: 20},
    {id: 'alchemy', icon: '⚗️', name: '炼金术士之石', desc: '炼金收益 +50%', baseCost: 90, costMult: 2.2, maxLevel: 25},
    {id: 'thief', icon: '🗡️', name: '盗贼手套', desc: '暴击偷取金币 +10%', baseCost: 180, costMult: 3, maxLevel: 15},
    {id: 'doubleGold', icon: '✨', name: '黄金双倍', desc: '金币获取 ×2', baseCost: 1000, costMult: 10, maxLevel: 3},
    {id: 'guardian', icon: '🛡️', name: '守护者之盾', desc: '最大生命 +50%', baseCost: 50, costMult: 2, maxLevel: 40},
    {id: 'thorns', icon: '🌹', name: '荆棘之甲', desc: '反弹10%伤害', baseCost: 120, costMult: 2.8, maxLevel: 25},
    {id: 'dodge', icon: '👟', name: '闪避之靴', desc: '闪避率 +10%', baseCost: 80, costMult: 2.5, maxLevel: 30},
    {id: 'regen', icon: '💚', name: '再生之戒', desc: '每秒回复1%生命', baseCost: 200, costMult: 3, maxLevel: 20},
    {id: 'stoneSkin', icon: '🪨', name: '石头之肤', desc: '伤害减免 +10%', baseCost: 100, costMult: 2.2, maxLevel: 30},
    {id: 'manaShield', icon: '🔮', name: '魔法屏障', desc: '魔法护盾 +50%', baseCost: 250, costMult: 3.5, maxLevel: 15},
    {id: 'expBoost', icon: '📚', name: '经验之书', desc: '经验获取 +50%', baseCost: 40, costMult: 1.8, maxLevel: 50},
    {id: 'cooldown', icon: '💎', name: '冷却缩减宝石', desc: '技能冷却 -10%', baseCost: 150, costMult: 3, maxLevel: 20},
    {id: 'moveSpeed', icon: '🏃', name: '移动之靴', desc: '移动速度 +20%', baseCost: 30, costMult: 1.5, maxLevel: 50},
    {id: 'manaRegen', icon: '💧', name: '魔力源泉', desc: '魔力回复 +50%', baseCost: 100, costMult: 2, maxLevel: 30},
    {id: 'luck', icon: '🎲', name: '幸运饼干', desc: '随机Buff概率 +10%', baseCost: 200, costMult: 4, maxLevel: 10},
    {id: 'summon', icon: '🐾', name: '召唤卷轴', desc: '召唤随从概率 +5%', baseCost: 300, costMult: 5, maxLevel: 10},
    {id: 'cleanse', icon: '🧼', name: '净化护符', desc: 'Debuff持续时间 -50%', baseCost: 80, costMult: 2, maxLevel: 20},
    {id: 'autoClick', icon: '🤖', name: '自动点击器', desc: '自动点击 +1次/秒', baseCost: 500, costMult: 4, maxLevel: 10},
    {id: 'lifesteal', icon: '🧛', name: '吸血鬼之牙', desc: '生命偷取 +5%', baseCost: 250, costMult: 3.5, maxLevel: 15},
    {id: 'explosion', icon: '💥', name: '爆裂护符', desc: '击杀爆炸 +50%伤害', baseCost: 350, costMult: 4, maxLevel: 10},
    {id: 'chainLightning', icon: '⛓️', name: '连锁闪电之球', desc: '连锁3个目标', baseCost: 400, costMult: 5, maxLevel: 8},
    {id: 'poison', icon: '☠️', name: '剧毒之囊', desc: '中毒伤害 +50%/5秒', baseCost: 180, costMult: 2.8, maxLevel: 20}
];

// 装备配置
const equipmentConfig = {
    weapon: [
        {name: '生锈的剑', icon: '⚔️', quality: 'common', stats: {attack: 5}},
        {name: '铁剑', icon: '⚔️', quality: 'common', stats: {attack: 10}},
        {name: '钢剑', icon: '🗡️', quality: 'rare', stats: {attack: 25, crit: 5}},
        {name: '魔法剑', icon: '🔮', quality: 'rare', stats: {attack: 40, crit: 10}},
        {name: '火焰剑', icon: '🔥', quality: 'epic', stats: {attack: 80, crit: 15, fireDamage: 20}},
        {name: '冰霜剑', icon: '❄️', quality: 'epic', stats: {attack: 80, crit: 15, iceDamage: 20}},
        {name: '雷电剑', icon: '⚡', quality: 'epic', stats: {attack: 80, crit: 15, lightningDamage: 20}},
        {name: '传说圣剑', icon: '✨', quality: 'legendary', stats: {attack: 200, crit: 30, allDamage: 50}},
        {name: '暗黑之刃', icon: '💀', quality: 'legendary', stats: {attack: 250, crit: 40, lifesteal: 10}},
        {name: '神话破坏者', icon: '🌟', quality: 'mythic', stats: {attack: 500, crit: 50, allDamage: 100}}
    ],
    helmet: [
        {name: '皮帽', icon: '🎩', quality: 'common', stats: {defense: 3}},
        {name: '铁盔', icon: '🪖', quality: 'common', stats: {defense: 8}},
        {name: '钢盔', icon: '🪖', quality: 'rare', stats: {defense: 20, maxHp: 50}},
        {name: '魔法头盔', icon: '🔮', quality: 'rare', stats: {defense: 35, maxHp: 100}},
        {name: '火焰头盔', icon: '🔥', quality: 'epic', stats: {defense: 70, maxHp: 200, fireResist: 30}},
        {name: '冰霜头盔', icon: '❄️', quality: 'epic', stats: {defense: 70, maxHp: 200, iceResist: 30}},
        {name: '传说头盔', icon: '👑', quality: 'legendary', stats: {defense: 150, maxHp: 500, allResist: 20}},
        {name: '神话皇冠', icon: '🌟', quality: 'mythic', stats: {defense: 300, maxHp: 1000, allResist: 50}}
    ],
    armor: [
        {name: '布衣', icon: '👕', quality: 'common', stats: {defense: 5}},
        {name: '皮甲', icon: '🥋', quality: 'common', stats: {defense: 12}},
        {name: '锁甲', icon: '🛡️', quality: 'rare', stats: {defense: 30, maxHp: 80}},
        {name: '板甲', icon: '🛡️', quality: 'rare', stats: {defense: 50, maxHp: 150}},
        {name: '魔法护甲', icon: '🔮', quality: 'epic', stats: {defense: 100, maxHp: 300, damageReduce: 10}},
        {name: '火焰护甲', icon: '🔥', quality: 'epic', stats: {defense: 100, maxHp: 300, fireResist: 50}},
        {name: '传说护甲', icon: '✨', quality: 'legendary', stats: {defense: 200, maxHp: 800, damageReduce: 25}},
        {name: '神话护甲', icon: '🌟', quality: 'mythic', stats: {defense: 400, maxHp: 2000, damageReduce: 40}}
    ],
    ring: [
        {name: '铁戒指', icon: '💍', quality: 'common', stats: {crit: 3}},
        {name: '银戒指', icon: '💍', quality: 'common', stats: {crit: 8}},
        {name: '红宝石戒指', icon: '💎', quality: 'rare', stats: {crit: 20, critDamage: 15}},
        {name: '钻石戒指', icon: '💎', quality: 'rare', stats: {crit: 35, critDamage: 30}},
        {name: '魔法戒指', icon: '🔮', quality: 'epic', stats: {crit: 50, critDamage: 50, attack: 30}},
        {name: '传说戒指', icon: '✨', quality: 'legendary', stats: {crit: 80, critDamage: 100, attack: 100}},
        {name: '神话戒指', icon: '🌟', quality: 'mythic', stats: {crit: 150, critDamage: 200, attack: 200}}
    ],
    necklace: [
        {name: '木项链', icon: '📿', quality: 'common', stats: {maxHp: 20}},
        {name: '皮项链', icon: '📿', quality: 'common', stats: {maxHp: 50}},
        {name: '银项链', icon: '📿', quality: 'rare', stats: {maxHp: 150, defense: 10}},
        {name: '金项链', icon: '📿', quality: 'rare', stats: {maxHp: 300, defense: 25}},
        {name: '魔法项链', icon: '🔮', quality: 'epic', stats: {maxHp: 500, defense: 50, regen: 5}},
        {name: '传说项链', icon: '✨', quality: 'legendary', stats: {maxHp: 1000, defense: 100, regen: 15}},
        {name: '神话项链', icon: '🌟', quality: 'mythic', stats: {maxHp: 3000, defense: 200, regen: 30}}
    ],
    boots: [
        {name: '草鞋', icon: '🥿', quality: 'common', stats: {moveSpeed: 5}},
        {name: '布鞋', icon: '👟', quality: 'common', stats: {moveSpeed: 10}},
        {name: '皮靴', icon: '👢', quality: 'rare', stats: {moveSpeed: 25, defense: 10}},
        {name: '钢靴', icon: '👢', quality: 'rare', stats: {moveSpeed: 40, defense: 25}},
        {name: '魔法靴', icon: '🔮', quality: 'epic', stats: {moveSpeed: 60, defense: 50, dodge: 10}},
        {name: '传说靴', icon: '✨', quality: 'legendary', stats: {moveSpeed: 100, defense: 100, dodge: 25}},
        {name: '神话靴', icon: '🌟', quality: 'mythic', stats: {moveSpeed: 200, defense: 200, dodge: 50}}
    ]
};

// 宠物配置
const petConfig = [
    {id: 'slime', name: '史莱姆', icon: '🟢', rarity: 'common', bonus: {dps: 5}, price: 100, desc: 'DPS +5'},
    {id: 'cat', name: '小猫', icon: '🐱', rarity: 'common', bonus: {gold: 10}, price: 150, desc: '金币 +10%'},
    {id: 'dog', name: '小狗', icon: '🐕', rarity: 'common', bonus: {dps: 10}, price: 200, desc: 'DPS +10'},
    {id: 'bird', name: '小鸟', icon: '🐦', rarity: 'rare', bonus: {crit: 5}, price: 500, desc: '暴击率 +5%'},
    {id: 'wolf', name: '小狼', icon: '🐺', rarity: 'rare', bonus: {attack: 20}, price: 800, desc: '攻击力 +20'},
    {id: 'dragon', name: '幼龙', icon: '🐉', rarity: 'epic', bonus: {dps: 50, gold: 20}, price: 2000, desc: 'DPS +50, 金币 +20%'},
    {id: 'phoenix', name: '凤凰', icon: '🦅', rarity: 'epic', bonus: {dps: 100, critDamage: 50}, price: 5000, desc: 'DPS +100, 暴击伤害 +50%'},
    {id: 'unicorn', name: '独角兽', icon: '🦄', rarity: 'legendary', bonus: {allDamage: 30, maxHp: 500}, price: 15000, desc: '全伤害 +30%, 生命 +500'},
    {id: 'tiger', name: '白虎', icon: '🐯', rarity: 'legendary', bonus: {attack: 100, crit: 20}, price: 20000, desc: '攻击 +100, 暴击率 +20%'},
    {id: 'god', name: '神灵', icon: '🌟', rarity: 'mythic', bonus: {dps: 500, gold: 100, crit: 50}, price: 50000, desc: 'DPS +500, 金币 +100%'}
];

// Boss图片URL（使用SVG生成的燃气表）
const bossImages = [
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzFhMWExYSIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iNjAiIGZpbGw9IiMzMzMiIHN0cm9rZT0iI2Q0YWYzNyIgc3Ryb2tlLXdpZHRoPSIyIi8+PGNpcmNsZSBjeD0iMTAwIiBjeT0iMTAwIiByPSIyMCIgZmlsbD0iIiR0YWcnIi8+PHBhdGggZD0iTTgwLDkwIEgxMjAiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIyIi8+PHBhdGggZD0iTTkwLDgwIFYxMjAiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+',
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzJhMmEyYSIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iNjAiIGZpbGw9IiM0MzQiIHN0cm9rZT0iI2Q0YWYzNyIgc3Ryb2tlLXdpZHRoPSIyIi8+PGNpcmNsZSBjeD0iMTAwIiBjeT0iMTAwIiByPSIyNSIgZmlsbD0iJmx0OycgdGFnJyBxdW90ZT0iIzAwNzBmZiIvPjxwYXRoIGQ9Ik04MCw5MCBIMTIwIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMiIvPjxwYXRoIGQ9Ik05MCw4MCBWMTEwIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMiIvPjwvc3ZnPg==',
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzNhM2EzYSIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iNjAiIGZpbGw9IiM1MzUiIHN0cm9rZT0iI2Q0YWYzNyIgc3Ryb2tlLXdpZHRoPSIyIi8+PGNpcmNsZSBjeD0iMTAwIiBjeT0iMTAwIiByPSIyNSIgZmlsbD0iIiR0YWcnIi8+PHBhdGggZD0iTTgwLDkwIEg5NSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNMTIwLDkwIEg5NSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNOTAsODAgVjExMCIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=',
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzRhNGE0YSIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iNjAiIGZpbGw9IiM2MzYiIHN0cm9rZT0iI2Q0YWYzNyIgc3Ryb2tlLXdpZHRoPSIyIi8+PGNpcmNsZSBjeD0iMTAwIiBjeT0iMTAwIiByPSIyNSIgZmlsbD0iIiR0YWcnIi8+PHBhdGggZD0iTTgwLDkwIEg5NSIgc3Ryb2tlPSIjZmY4MDAwIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNMTIwLDkwIEg5NSIgc3Ryb2tlPSIjZmY4MDAwIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNOTAsODAgVjExMCIgc3Ryb2tlPSIjZmY4MDAwIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=',
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzVhNWE1YSIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iNjAiIGZpbGw9IiM3NDciIHN0cm9rZT0iI2Q0YWYzNyIgc3Ryb2tlLXdpZHRoPSIyIi8+PGNpcmNsZSBjeD0iMTAwIiBjeT0iMTAwIiByPSIyNSIgZmlsbD0iIiR0YWcnIi8+PHBhdGggZD0iTTgwLDkwIEg5NSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNMTIwLDkwIEg5NSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNOTAsODAgVjExMCIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNOTUsNzUgTDExNSw3NSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=',
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzZhNmE2YSIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iNjAiIGZpbGw9IiM4NTgiIHN0cm9rZT0iI2Q0YWYzNyIgc3Ryb2tlLXdpZHRoPSIyIi8+PGNpcmNsZSBjeD0iMTAwIiBjeT0iMTAwIiByPSIyNSIgZmlsbD0iIiR0YWcnIi8+PHBhdGggZD0iTTgwLDkwIEg5NSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNMTIwLDkwIEg5NSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNOTAsODAgVjExMCIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNODAsMTEwIEg5NSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=',
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzdhN2E3YSIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iNjAiIGZpbGw9IiM5NjkiIHN0cm9rZT0iI2Q0YWYzNyIgc3Ryb2tlLXdpZHRoPSIyIi8+PGNpcmNsZSBjeD0iMTAwIiBjeT0iMTAwIiByPSIyNSIgZmlsbD0iIiR0YWcnIi8+PHBhdGggZD0iTTgwLDkwIEg5NSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNMTIwLDkwIEg5NSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNOTAsODAgVjExMCIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNODUsNzUgTDExNSwxMjUiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+',
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzhhOGE4YSIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iNjAiIGZpbGw9IiM3NzgiIHN0cm9rZT0iI2Q0YWYzNyIgc3Ryb2tlLXdpZHRoPSIyIi8+PGNpcmNsZSBjeD0iMTAwIiBjeT0iMTAwIiByPSIyNSIgZmlsbD0iIiR0YWcnIi8+PHBhdGggZD0iTTgwLDkwIEg5NSIgc3Ryb2tlPSIjZmY4MDAwIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNMTIwLDkwIEg5NSIgc3Ryb2tlPSIjZmY4MDAwIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNOTAsODAgVjExMCIgc3Ryb2tlPSIjZmY4MDAwIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=',
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzliOWI5YiIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iNjAiIGZpbGw9IiM4ODkiIHN0cm9rZT0iI2Q0YWYzNyIgc3Ryb2tlLXdpZHRoPSIyIi8+PGNpcmNsZSBjeD0iMTAwIiBjeT0iMTAwIiByPSIyNSIgZmlsbD0iIiR0YWcnIi8+PHBhdGggZD0iTTgwLDkwIEg5NSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNMTIwLDkwIEg5NSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNOTAsODAgVjExMCIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNODAsMTEwIEg5NSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=',
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzFjMWMxYyIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iNjAiIGZpbGw9IiM5OTkiIHN0cm9rZT0iI2Q0YWYzNyIgc3Ryb2tlLXdpZHRoPSIyIi8+PGNpcmNsZSBjeD0iMTAwIiBjeT0iMTAwIiByPSIyNSIgZmlsbD0iIiR0YWcnIi8+PHBhdGggZD0iTTgwLDkwIEg5NSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNMTIwLDkwIEg5NSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNOTAsODAgVjExMCIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNODUsNzUgTDExNSwxMjUiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+'
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
    startAutoAttack();
    startBossAttack();
    startGameTimer();
    checkOfflineGains();
    setInterval(saveGame, 30000);
}

// 初始化神器
function initArtifacts() {
    if (!gameState.artifacts || Object.keys(gameState.artifacts).length === 0) {
        gameState.artifacts = {};
        artifactConfig.forEach(a => gameState.artifacts[a.id] = 0);
    }
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
        isCrit = true;
    }
    
    // 元素伤害
    if (gameState.artifacts.fireSoul > 0) damage *= Math.pow(2, gameState.artifacts.fireSoul);
    if (gameState.artifacts.lightning > 0) damage *= Math.pow(2, gameState.artifacts.lightning);
    if (gameState.artifacts.iceHeart > 0) damage *= Math.pow(2, gameState.artifacts.iceHeart);
    
    // 狂暴之斧
    if (gameState.artifacts.berserk > 0 && gameState.playerCurrentHp < gameState.playerMaxHp * 0.3) {
        damage *= Math.pow(1.5, gameState.artifacts.berserk);
    }
    
    damage *= critMultiplier;
    
    // 每点伤害给1金币（乘以攻击次数）
    let totalDamageDealt = damage * hits;
    gameState.gold += Math.floor(totalDamageDealt);
    
    // 应用伤害
    for (let i = 0; i < hits; i++) {
        gameState.currentHP -= damage;
        gameState.totalDamage += damage;
        if (i === 0) showDamageNumber(totalDamageDealt, event.clientX, event.clientY, isCrit);
    }
    
    // Boss受击动画
    const bossImg = document.getElementById('bossImage');
    bossImg.classList.add('hit');
    setTimeout(() => bossImg.classList.remove('hit'), 200);
    
    if (gameState.currentHP <= 0) killBoss();
    
    updateHPBar();
    updateDisplay();
    saveGame();
}

// 显示伤害数字
function showDamageNumber(damage, x, y, isCrit) {
    const dmgFloat = document.createElement('div');
    dmgFloat.className = 'damage-float';
    dmgFloat.textContent = formatNumber(Math.floor(damage));
    dmgFloat.style.left = (x || window.innerWidth / 2) + 'px';
    dmgFloat.style.top = (y || window.innerHeight / 3) + 'px';
    
    if (isCrit) {
        dmgFloat.style.color = '#ff0000';
        dmgFloat.style.fontSize = '2.5em';
        dmgFloat.textContent = '暴击! ' + dmgFloat.textContent;
    }
    
    document.body.appendChild(dmgFloat);
    setTimeout(() => dmgFloat.remove(), 1000);
}

// 击杀Boss（额外奖励，因为之前每点伤害已经给金币了）
function killBoss() {
    const goldReward = gameState.level * 5; // 击杀额外奖励
    let finalGold = goldReward;
    
    // 金币加成（只对击杀奖励生效）
    if (gameState.artifacts.goldMagnet > 0) finalGold *= Math.pow(1.5, gameState.artifacts.goldMagnet);
    if (gameState.artifacts.treasureMap > 0) finalGold *= Math.pow(1.5, gameState.artifacts.treasureMap);
    if (gameState.artifacts.doubleGold > 0) finalGold *= Math.pow(2, gameState.artifacts.doubleGold);
    
    // 宠物金币加成
    if (gameState.activePet) {
        const pet = petConfig.find(p => p.id === gameState.activePet);
        if (pet && pet.bonus.gold) finalGold *= (1 + pet.bonus.gold / 100);
    }
    
    gameState.gold += Math.floor(finalGold);
    gameState.level++;
    if (gameState.level > gameState.maxLevel) gameState.maxLevel = gameState.level;
    
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
        
        // 根据关卡等级决定掉落品质
        let qualityIndex = 0;
        const rand = Math.random();
        if (gameState.level >= 50 && rand < 0.05) qualityIndex = 4; // mythic
        else if (gameState.level >= 30 && rand < 0.15) qualityIndex = 3; // legendary
        else if (gameState.level >= 15 && rand < 0.3) qualityIndex = 2; // epic
        else if (gameState.level >= 5 && rand < 0.5) qualityIndex = 1; // rare
        else qualityIndex = 0; // common
        
        const items = equipmentConfig[slot].filter(item => {
            if (qualityIndex === 0) return item.quality === 'common';
            if (qualityIndex === 1) return item.quality === 'common' || item.quality === 'rare';
            if (qualityIndex === 2) return item.quality === 'rare' || item.quality === 'epic';
            if (qualityIndex === 3) return item.quality === 'epic' || item.quality === 'legendary';
            if (qualityIndex === 4) return item.quality === 'legendary' || item.quality === 'mythic';
            return false;
        });
        
        if (items.length > 0) {
            const item = items[Math.floor(Math.random() * items.length)];
            gameState.inventory.push({...item, slot});
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
    `;
    notif.classList.add('show');
    setTimeout(() => notif.classList.remove('show'), 2000);
}

// Boss反击系统
function startBossAttack() {
    setInterval(() => {
        if (gameState.currentHP > 0 && gameState.playerCurrentHp > 0) {
            // Boss攻击玩家
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
                
                const finalDamage = Math.max(1, bossDamage - damageReduce * 0.5);
                gameState.playerCurrentHp -= finalDamage;
                
                // 显示玩家受到的伤害
                const playerHpBar = document.querySelector('.player-hp-bar');
                if (playerHpBar) {
                    const rect = playerHpBar.getBoundingClientRect();
                    showDamageNumber(finalDamage, rect.left + rect.width / 2, rect.top, false);
                    document.querySelectorAll('.damage-float').forEach(el => el.classList.add('player-damage'));
                }
                
                updatePlayerHP();
                
                if (gameState.playerCurrentHp <= 0) {
                    gameOver();
                }
            }
        }
    }, 3000); // Boss每3秒攻击一次
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
    document.getElementById('gameOverGold').textContent = formatNumber(Math.floor(gameState.gold * 0.1));
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
function restartGame() {
    localStorage.removeItem('bossRPGSave');
    location.reload();
}

// 更新Boss（随机图片，尽量不重复）
let lastBossImageIndex = -1;
let lastSecondLastImageIndex = -1;

function updateBoss() {
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
    
    // 随机选择图片，尽量避免重复
    let availableIndices = [];
    for (let i = 0; i < bossImages.length; i++) {
        if (i !== lastBossImageIndex && i !== lastSecondLastImageIndex) {
            availableIndices.push(i);
        }
    }
    
    // 如果所有图片都被排除了（只有2张图的情况），允许重复
    if (availableIndices.length === 0) {
        availableIndices = Array.from({length: bossImages.length}, (_, i) => i);
    }
    
    // 随机选择
    const newIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    
    // 更新历史记录
    lastSecondLastImageIndex = lastBossImageIndex;
    lastBossImageIndex = newIndex;
    
    // 更新Boss图片
    const img = document.getElementById('bossImg');
    if (img) {
        img.src = bossImages[newIndex];
        img.alt = bossNames[(gameState.level - 1) % bossNames.length];
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
        showNotification('每秒伤害提升!');
        updateDisplay();
        saveGame();
    }
}

// 自动攻击
function startAutoAttack() {
    setInterval(() => {
        if (gameState.dps > 0 && gameState.currentHP > 0 && gameState.playerCurrentHp > 0) {
            let damage = calculateDPS();
            
            if (gameState.artifacts.fireSoul > 0) damage *= Math.pow(2, gameState.artifacts.fireSoul);
            if (gameState.artifacts.lightning > 0) damage *= Math.pow(2, gameState.artifacts.lightning);
            if (gameState.artifacts.iceHeart > 0) damage *= Math.pow(2, gameState.artifacts.iceHeart);
            
            gameState.currentHP -= damage;
            gameState.totalDamage += damage;
            
            if (gameState.currentHP <= 0) killBoss();
            
            updateHPBar();
            updateDisplay();
        }
    }, 1000);
}

// ===== 神器系统（阶梯式购买+金币升级） =====
function openArtifactModal() {
    renderArtifacts();
    document.getElementById('artifactModal').classList.add('active');
}

function closeArtifactModal() {
    document.getElementById('artifactModal').classList.remove('active');
    updateDisplay();
}

function renderArtifacts() {
    const grid = document.getElementById('artifactGrid');
    grid.innerHTML = '';
    
    // 添加购买区域
    const shopSection = document.createElement('div');
    shopSection.style.cssText = 'grid-column: 1 / -1; background: #0a0a0a; border: 2px solid #d4af37; border-radius: 10px; padding: 15px; margin-bottom: 15px;';
    shopSection.innerHTML = `
        <h3 style="text-align: center; color: #d4af37; margin-bottom: 15px;">🎰 神器商店</h3>
        <div style="display: flex; justify-content: center; gap: 15px; flex-wrap: wrap;">
            <button class="artifact-buy-btn" style="padding: 12px 25px; font-size: 1.1em;" onclick="buyRandomArtifact(100)" 
                    ${gameState.gold >= 100 ? '' : 'disabled'}>
                💰 100 金币<br><span style="font-size: 0.8em;">随机普通神器</span>
            </button>
            <button class="artifact-buy-btn" style="padding: 12px 25px; font-size: 1.1em;" onclick="buyRandomArtifact(1000)" 
                    ${gameState.gold >= 1000 ? '' : 'disabled'}>
                💰 1000 金币<br><span style="font-size: 0.8em;">随机高级神器</span>
            </button>
        </div>
    `;
    grid.appendChild(shopSection);
    
    artifactConfig.forEach(artifact => {
        const level = gameState.artifacts[artifact.id] || 0;
        const isMaxLevel = level >= artifact.maxLevel;
        const upgradeCost = getArtifactUpgradeCost(artifact, level);
        
        const card = document.createElement('div');
        card.className = 'artifact-card';
        card.innerHTML = `
            <div class="artifact-icon">${artifact.icon}</div>
            <div class="artifact-name">${artifact.name}</div>
            <div class="artifact-level">等级: ${level}/${artifact.maxLevel}</div>
            <div class="artifact-desc">${artifact.desc}</div>
            <button class="artifact-buy-btn" onclick="buyArtifact('${artifact.id}')" 
                    ${gameState.gold >= upgradeCost && !isMaxLevel ? '' : 'disabled'}>
                ${isMaxLevel ? '✅ MAX' : `⬆️ 升级 (${formatNumber(upgradeCost)} 💰)`}
            </button>
        `;
        grid.appendChild(card);
    });
    
    document.getElementById('artifactPointsDisplay').textContent = formatNumber(gameState.gold);
}

// 获取神器升级费用
function getArtifactUpgradeCost(artifact, currentLevel) {
    if (currentLevel >= artifact.maxLevel) return Infinity;
    // 基础费用10，每级1.8倍增长
    return Math.floor(10 * Math.pow(1.8, currentLevel));
}

// 购买随机神器
function buyRandomArtifact(price) {
    if (gameState.gold < price) {
        showNotification('金币不足!');
        return;
    }
    
    gameState.gold -= price;
    
    // 根据价格决定随机范围
    let availableArtifacts;
    if (price >= 1000) {
        // 高级神器：从后20个神器中选
        availableArtifacts = artifactConfig.slice(-20);
    } else {
        // 普通神器：从全部神器中选
        availableArtifacts = artifactConfig;
    }
    
    // 随机选择一个神器
    const randomArtifact = availableArtifacts[Math.floor(Math.random() * availableArtifacts.length)];
    
    // 检查是否已满级
    if (gameState.artifacts[randomArtifact.id] >= randomArtifact.maxLevel) {
        // 满级了，给金币补偿
        const refund = Math.floor(price * 0.5);
        gameState.gold += refund;
        showNotification(`该神器已满级！返还 ${formatNumber(refund)} 金币`);
    } else {
        // 给1-3级
        const levelsToAdd = Math.min(3, randomArtifact.maxLevel - gameState.artifacts[randomArtifact.id]);
        gameState.artifacts[randomArtifact.id] += levelsToAdd;
        showNotification(`🎉 获得 ${randomArtifact.name} Lv+${levelsToAdd}!`);
    }
    
    renderArtifacts();
    updateDisplay();
    updatePlayerHP();
    saveGame();
}

// 升级神器（用金币）
function buyArtifact(artifactId) {
    const artifact = artifactConfig.find(a => a.id === artifactId);
    const level = gameState.artifacts[artifactId] || 0;
    
    if (level >= artifact.maxLevel) {
        showNotification('已达到最高等级!');
        return;
    }
    
    const cost = getArtifactUpgradeCost(artifact, level);
    
    if (gameState.gold >= cost) {
        gameState.gold -= cost;
        gameState.artifacts[artifactId]++;
        showNotification(`神器升级: ${artifact.name} Lv.${gameState.artifacts[artifactId]}!`);
        renderArtifacts();
        updateDisplay();
        updatePlayerHP();
        saveGame();
    } else {
        showNotification('金币不足!');
    }
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
        div.className = 'inventory-item';
        div.style.borderColor = qualityColors[item.quality];
        div.onclick = () => showItemDetail(item, index);
        
        let statsText = '';
        if (item.stats.attack) statsText += `攻击 +${item.stats.attack} `;
        if (item.stats.defense) statsText += `防御 +${item.stats.defense} `;
        if (item.stats.maxHp) statsText += `生命 +${item.stats.maxHp} `;
        if (item.stats.crit) statsText += `暴击 +${item.stats.crit}% `;
        
        div.innerHTML = `
            <div class="item-icon">${item.icon}</div>
            <div class="item-name" style="color: ${qualityColors[item.quality]}">${item.name}</div>
            <div class="item-stats">${statsText}</div>
        `;
        grid.appendChild(div);
    });
    
    // 更新装备栏显示
    Object.keys(gameState.equipment).forEach(slot => {
        const equipDiv = document.getElementById(`equip-${slot}`);
        const item = gameState.equipment[slot];
        if (equipDiv) {
            if (item) {
                equipDiv.className = `equipped-item show quality-${item.quality}`;
                equipDiv.style.backgroundColor = qualityColors[item.quality];
            } else {
                equipDiv.className = 'equipped-item';
            }
        }
    });
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
            dodge: '闪避率'
        };
        const name = statNames[stat] || stat;
        const value = stat.includes('Damage') || stat.includes('Reduce') || stat.includes('Resist') || stat === 'crit' ? `${item.stats[stat]}%` : item.stats[stat];
        statsHTML += `<div>${name}: +${value}</div>`;
    });
    document.getElementById('itemDetailStats').innerHTML = statsHTML;
    
    const currentEquipped = gameState.equipment[item.slot];
    document.getElementById('itemActionBtn').textContent = currentEquipped ? '更换装备' : '装备';
    
    document.getElementById('itemDetailModal').classList.add('active');
}

function handleItemAction() {
    if (selectedItem) {
        const slot = selectedItem.slot;
        
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
}

function closeItemDetailModal() {
    document.getElementById('itemDetailModal').classList.remove('active');
    selectedItem = null;
    selectedItemIndex = null;
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
            <div class="pet-price">💰 ${formatNumber(pet.price)}</div>
            <button class="artifact-buy-btn" onclick="buyPet('${pet.id}')" 
                    ${!owned && gameState.gold >= pet.price ? '' : 'disabled'}>
                ${owned ? '已拥有' : '购买'}
            </button>
        `;
        
        shopGrid.appendChild(card);
    });
    
    document.getElementById('petPointsDisplay').textContent = formatNumber(gameState.petPoints);
}

function buyPet(petId) {
    const pet = petConfig.find(p => p.id === petId);
    
    if (gameState.gold >= pet.price) {
        gameState.gold -= pet.price;
        gameState.pets[pet.id] = 1;
        showNotification(`购买宠物: ${pet.name}!`);
        renderPets();
        updateDisplay();
        saveGame();
    } else {
        showNotification('金币不足!');
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

// ===== 重生系统（只给宠物点） =====
function openRebirthModal() {
    if (gameState.maxLevel < 10) {
        showNotification('需要达到第10关才能重生!');
        return;
    }
    
    const petReward = Math.floor(gameState.maxLevel * 0.5);
    document.getElementById('rebirthReward').textContent = `${petReward} 宠物点 (神器用金币购买!)`;
    document.getElementById('rebirthModal').classList.add('active');
}

function closeRebirthModal() {
    document.getElementById('rebirthModal').classList.remove('active');
}

function rebirth() {
    const petReward = Math.floor(gameState.maxLevel * 0.5);
    
    gameState.petPoints += petReward;
    
    // 保存所有永久数据（神器、宠物、装备、背包）
    const savedArtifacts = {...gameState.artifacts};
    const savedPets = {...gameState.pets};
    const savedPetPoints = gameState.petPoints;
    const savedEquipment = {...gameState.equipment};
    const savedInventory = [...gameState.inventory];
    const savedActivePet = gameState.activePet;
    
    // 计算新的基础HP（500 + 点击等级加成）
    const newBaseHp = 500;
    
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
        playerMaxHp: newBaseHp,
        playerCurrentHp: newBaseHp, // 重生后满血
        artifacts: savedArtifacts,  // 神器永久保存！
        equipment: savedEquipment,  // 装备永久保存！
        inventory: savedInventory,  // 背包永久保存！
        pets: savedPets,           // 宠物永久保存！
        petPoints: savedPetPoints,
        activePet: savedActivePet, // 出战宠物保留
        totalDamage: 0,
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
    showNotification(`重生成功! 神器/装备永久保留! 获得 ${petReward} 宠物点!`);
    saveGame();
}

// 更新显示
function updateDisplay() {
    document.getElementById('gold').textContent = formatNumber(gameState.gold);
    document.getElementById('currentLevel').textContent = gameState.level;
    document.getElementById('clickDamage').textContent = formatNumber(calculateAttack());
    document.getElementById('dps').textContent = formatNumber(calculateDPS());
    document.getElementById('playerLevel').textContent = gameState.clickLevel;
    document.getElementById('clickCost').textContent = formatNumber(Math.floor(10 * Math.pow(gameState.clickLevel, 1.5)));
    document.getElementById('dpsCost').textContent = formatNumber(Math.floor(10 * Math.pow(gameState.dpsLevel, 1.5)));
    document.getElementById('clickLevel').textContent = gameState.clickLevel;
    document.getElementById('dpsLevel').textContent = gameState.dpsLevel;
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
        
        if (!gameState.artifacts) {
            gameState.artifacts = {};
            artifactConfig.forEach(a => {
                gameState.artifacts[a.id] = 0;
            });
        }
        
        if (!gameState.pets) gameState.pets = {};
        if (!gameState.inventory) gameState.inventory = [];
        if (!gameState.equipment) gameState.equipment = {
            weapon: null, helmet: null, armor: null,
            ring: null, necklace: null, boots: null
        };
        
        if (!gameState.playerMaxHp) gameState.playerMaxHp = 100;
        if (!gameState.playerCurrentHp) gameState.playerCurrentHp = gameState.playerMaxHp;
        if (!gameState.lastSaveTime) gameState.lastSaveTime = Date.now();
    }
}

// 游戏计时器
function startGameTimer() {
    setInterval(() => {
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
