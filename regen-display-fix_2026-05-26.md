# Bug修复：回血显示不更新（2026-05-26 17:47）

## 问题
用户反馈：
1. 勇者升级回血没有效果
2. 升级完血量后，血条后面没有回血显示

## 根因分析
- `upgradeRegen()` 只调用了 `updateDisplay()` 和 `updateStatsPanel()`，**没有调用 `updatePlayerHP()`**
- 导致升级回血后，HP条上的 `+N/s` 回血显示不会立即更新
- 用户以为回血没有生效

## 修复内容

### 1. upgradeRegen() 添加 updatePlayerHP()
```javascript
if (actualUpgrades > 0) {
    gameState.gold -= totalCost;
    gameState.regenLevel += actualUpgrades;
    console.log('✅ 升级回血: regenLevel=' + gameState.regenLevel + ', 每秒回血=' + (gameState.regenLevel * 5));
    updateDisplay();
    updateStatsPanel();
    updatePlayerHP(); // ← 新增：更新HP条上的回血显示
    saveGame();
}
```

### 2. updatePlayerHP() 添加回血激活视觉反馈
- 当 `regenAmount > 0` 时，给 `.player-hp-wrap` 添加 `regen-active` 类
- style.css 新增 `@keyframes regen-pulse`：HP条绿色脉冲光效

### 3. 调试日志
- `upgradeRegen()` 添加 `console.log` 确认升级成功
- `startRegen()` 已有 `console.log` 显示每次回血数值

## 语法检查
✅ Node.js --check Exit: 0

## 文件
- game.js（修改）
- style.css（新增动画）
