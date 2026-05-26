# Bug修复：Boss攻击+回血系统（2026-05-26 15:30）

## 问题1：普通怪物攻击勇者不明显
- Boss每3秒攻击一次，伤害经防御减免后只有1点
- 500HP条上看不到变化

## 问题2：勇者升级回血不生效
- 回血显示只算了 `regenLevel*5`，装备 regen 被忽略
- 没有视觉反馈，回血了也不知道

## 修复内容

### Boss攻击系统增强
- 攻击间隔：3秒 → 1.5秒（频率翻倍）
- 最低伤害保障：`maxHp * 2%`（500HP = 至少10点/击）
- 画面震动：`screenShake(duration=150)` 受伤时画面抖动
- 红色闪屏：全屏红色渐变 `redFlash()` 0.4秒淡出
- style.css：新增 `@keyframes shake-hard` + `.red-flash` + `@keyframes flash-fade`

### 回血系统修复
- `startRegen()` → 加入 `console.log` 调试 + 绿色 `💚+N` 数字
- `showDamageNumber()` → 新增 `case 'regen'` 绿字特效
- `updatePlayerHP()` → 回血显示加入装备 regen 累加

## 语法检查
✅ Node.js --check Exit: 0

## 文件
- game.js（修改）
- style.css（新增动画）
- 上传至 btbsjjsw/idle-game