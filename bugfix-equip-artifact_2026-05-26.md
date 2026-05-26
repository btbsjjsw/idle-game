# Bug修复：装备/神器无效属性（2026-05-26）

## 问题
游戏中有大量装备/神器属性定义了就放在那，完全没有被任何代码读取，等于废物。

## 已修复

### 神器类
1. **autoClick（自动点击器）** — 从未生效
   - 接入攻击间隔：`autoClickMult = 1 + level*0.5`，每级+50%攻速
   - 接入命中次数：手动/自动攻击都 `hits += autoClick`
   - 位置：L397(手动), L1573-1577(自动间隔+hits)

### 装备属性类
2. **moveSpeed（移动速度）** → 改为 dodge
   - 6双靴子：把 moveSpeed 属性改为等量 dodge
   - 移除 statNames 中的 moveSpeed 标签

3. **fireDamage / iceDamage / lightningDamage** — 从未接入伤害
   - 接入手动攻击 `attackBoss()`（L449-451）
   - 接入自动攻击 `startAutoAttack()`（L1626-1628）

4. **damageReduce** — 从未接入Boss攻击
   - 接入 `startBossAttack()` 伤害减免（L1015）

5. **fireResist / iceResist / allResist** — 从未接入
   - 接入 `startBossAttack()` 抗性（L1018-1024），按50%转伤害减免

6. **allDamage** — 从未接入攻击力
   - 接入 `calculateAttack()`（L358-362）

7. **goldBonus** — 从未接入金币
   - 接入 `killBoss()`（L834-838）
   - 接入 `attackBoss()` 金币（L489）
   - 接入 `startAutoAttack()` 金币（L1675）
   - **Bug修复**：原来多乘了100倍 → 修正

8. **lifesteal** — 神器吸血正常，但装备吸血无效
   - 接入 `attackBoss()` 吸血（L554-558）
   - 接入 `startAutoAttack()` 吸血（L1704-1708）

9. **regen（装备回血）** — 从未接入回血系统
   - 接入 `startRegen()`，与升级回血叠加（L1855-1860）

## 语法检查
✅ Node.js `--check` 通过（Exit: 0）

## 文件
- `C:\Users\严\.qclaw\workspace\game.js`
- 上传：btbsjjsw/idle-game
- 页面：https://btbsjjsw.github.io/idle-game/idle_game.html
