# 2026-05-26 - 勇者不掉血修复

## 根因
Boss每3秒攻击一次，伤害经防御减免后只剩 `Math.max(1, ...)` = 1点。  
在500 HP的HP条上，1点伤害 = 0.2%，肉眼完全不可见。

## 修复
在 `startBossAttack()` 中添加最低伤害保障：
```javascript
const minDmg = Math.max(1, Math.floor(gameState.playerMaxHp * 0.02));
finalDamage = Math.max(finalDamage, minDmg);
```
保证每击至少造成最大血量2%的伤害。

| 最大HP | 最低伤害/击 | 30秒总伤害 |
|--------|------------|-----------|
| 500    | 10         | 100 (20%) |
| 1000   | 20         | 200 (20%) |
| 5000   | 100        | 1000 (20%) |

## 附带
- 添加 `console.log` 调试日志，可在浏览器控制台查看Boss攻击详情
- 攻击时红色闪烁效果更明显

## 修改文件
- game.js → startBossAttack()