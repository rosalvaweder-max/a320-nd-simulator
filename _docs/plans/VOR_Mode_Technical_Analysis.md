# A320 ND VOR 模式三种指示运行机制技术分析

## 概述

本文档详细分析 A320 ND（导航显示器）VOR 模式中三种核心指示的运行机制，并区分 VOR 台位于航路内（作为航路点）与航路外（仅作为调谐台）两种情况下的行为差异。

---

## 一、VOR 航道杆（Course Deviation Indicator, CDI）

### 1.1 物理含义

VOR 航道杆（俗称"十字杆"）由一条贯穿罗盘直径的垂直线和一条短水平线组成，整体呈十字形。其指向表示飞行员设定的**选择航道（CRS）**方向，而非飞机航向或航路方向。

### 1.2 基准选择

| 场景 | 基准 | 说明 |
|------|------|------|
| **VOR 在航路内** | `aircraft.course`（飞行员通过 CRS 旋钮设定） | 航道杆指向飞行员设定的 CRS 值，与航路无关 |
| **VOR 在航路外** | `aircraft.course`（飞行员通过 CRS 旋钮设定） | 同上，CRS 始终由飞行员手动设定 |

**关键原则：** 在真实 A320 中，VOR 模式的航道杆始终指向飞行员通过 EFIS 控制面板 CRS 选择器设定的固定方向，**不会**自动跟随航路方向变化。这与 NAV 模式不同——NAV 模式下航道杆会自动指向下一航路点的方位。

### 1.3 显示计算

```javascript
// 航道杆的旋转角度（相对于罗盘）
const relRotation = course - heading;
// 当飞机转向时，heading 变化导致 relRotation 变化，
// 航道杆在罗盘上的位置随之平滑移动
```

航道杆的旋转是相对于罗盘上方的（heading up 模式下，heading 在正上方）。当飞机转向时，罗盘旋转，航道杆相对于罗盘的位置（`relRotation = course - heading`）随之变化，产生平滑的视觉过渡。

### 1.4 航路内 vs 航路外差异

| 方面 | VOR 在航路内 | VOR 在航路外 |
|------|-------------|-------------|
| CRS 来源 | 飞行员手动设定 | 飞行员手动设定 |
| 航道杆指向 | 指向 CRS 方向 | 指向 CRS 方向 |
| 自动跟随航路 | 否 | 否 |
| 图形表现 | 无差异 | 无差异 |

---

## 二、偏离杆（Deviation Bar）

### 2.1 物理含义

偏离杆是位于十字杆垂直线上的一段可左右移动的条形指示器，表示飞机相对于所选 VOR 径向线的**角偏差**。在真实 A320 中，偏离杆的满偏对应 ±20° 的角偏差，每个圆点代表 5°。

### 2.2 偏差计算依据

#### 核心公式

```
aircraftRadial = (bearingToStation + 180°) % 360
angularDev = aircraftRadial - selectedCourse
```

其中：
- `bearingToStation`：飞机到 VOR 台的方位角（0°=北）
- `aircraftRadial`：飞机所在的 VOR 径向线（从 VOR 台指向飞机的方向）
- `selectedCourse`：飞行员设定的 CRS 值

#### 偏差方向约定

| angularDev 符号 | 物理含义 | 偏离杆位置 | 飞行员操作 |
|----------------|---------|-----------|-----------|
| > 0（正） | 飞机在选定航道的右侧 | 杆偏左 | 应向左飞 |
| < 0（负） | 飞机在选定航道的左侧 | 杆偏右 | 应向右飞 |

#### 显示转换

```javascript
// 原始角偏差
let angularDev = aircraftRadial - vorCourse;
if (angularDev > 180) angularDev -= 360;
if (angularDev < -180) angularDev += 360;

// 取反：显示约定中正偏移 = 杆在右侧 = "向右飞"
// 但 angularDev > 0 表示飞机在右侧（应向左飞）
// 所以取反使杆的偏移方向与飞行方向一致
vorDeviation = -Math.max(-20, Math.min(20, angularDev));

// 像素转换：每 5° = 30 像素
const devOffset = clampedDeviation * (30 / 5); // 6 pixels/degree
```

### 2.3 航路内 vs 航路外差异

| 方面 | VOR 在航路内 | VOR 在航路外 |
|------|-------------|-------------|
| **VOR 台位置** | 从 `activeRoute.waypoints` 中提取的航路点坐标 | 从 `VORManagerContext` 获取的调谐台坐标 |
| **偏差计算基准** | 飞机相对于航路 VOR 台的径向线 | 飞机相对于调谐 VOR 台的径向线 |
| **偏差公式** | 完全相同：`aircraftRadial - CRS` | 完全相同 |
| **VOR 台来源** | `activeRoute.waypoints.find(wp => type === 'VOR')` | `getActiveVORStation()` 或 `findNearestVORStation()` |
| **自动调谐影响** | 不受影响（航路 VOR 优先级最高） | 自动模式下自动切换到最近 VOR |
| **手动调谐影响** | 不受影响（航路 VOR 优先级最高） | 手动模式下锁定到指定频率的 VOR |

#### 优先级决策树

```
VOR 模式开始
  │
  ├─ 航路中有 VOR 航路点？─── 是 ──→ 使用航路 VOR（优先级 1）
  │
  └─ 否
      │
      ├─ 调谐模式 = auto？─── 是 ──→ 使用自动调谐台（优先级 2）
      │
      ├─ 调谐模式 = manual？── 是 ──→ 使用手动调谐台（优先级 2）
      │
      └─ 无有效调谐台 ──────────→ 使用最近 VOR（优先级 3，回退）
```

### 2.4 偏差显示图形规则

```
罗盘视图（heading up）：

         N (heading)
           ↑
           |
    ────┬──╋──┬────  ← 水平十字线（固定）
        │  ║  │
        │  ║  │       ← 偏离杆在此范围内左右移动
        │  ║  │
    ────┴──╋──┴────
           |
           ↓

偏离杆偏移示例（飞机在航道右侧，angularDev > 0）：
         N
           ↑
           |
    ────┬──╋──┬────
        │  ║  │
     ◄──┼──╋──┼──    ← 杆偏左（指示飞行员向左飞）
        │  ║  │
    ────┴──╋──┴────
```

### 2.5 TO/FROM 指示

TO/FROM 状态决定十字杆的箭头方向：

```javascript
// 计算飞机到 VOR 的方位角
const bearingToVorDeg = (90 - Math.atan2(toVorDy, toVorDx) * 180 / Math.PI + 360) % 360;

// 判断 TO/FROM
const headingDiff = ((aircraft.heading - bearingToVorDeg) % 360 + 360) % 360;
isToMode = headingDiff < 90 || headingDiff > 270;
```

| 状态 | 条件 | 箭头方向 | 含义 |
|------|------|---------|------|
| **TO** | 飞机航向与 VOR 方位角差 < 90° 或 > 270° | 箭头朝上（指向 VOR） | 飞机正在飞向 VOR 台 |
| **FROM** | 飞机航向与 VOR 方位角差 90°~270° | 箭头朝下（背离 VOR） | 飞机正在飞离 VOR 台 |

---

## 三、VOR 方位指针（VOR Bearing Pointer）

### 3.1 物理含义

VOR 方位指针是一条贯穿罗盘直径的绿色（或白色）直线，两端各有一个空心三角形，指向 VOR 台相对于飞机的**实际方位**。它指示的是 VOR 台的地理方向，而非航道方向。

### 3.2 指向行为

```javascript
// 计算 VOR 台相对于飞机的方位角
const dx = vorStation.x - aircraft.x;
const dy = vorStation.y - aircraft.y;
bearingToVOR = (Math.atan2(dy, dx) * 180 / Math.PI);
bearingToVOR = (90 - bearingToVOR + 360) % 360;

// 方位指针的旋转角度（相对于罗盘）
const relAngle = bearingToVOR - heading;
```

### 3.3 航路内 vs 航路外差异

| 方面 | VOR 在航路内 | VOR 在航路外 |
|------|-------------|-------------|
| **指向目标** | 航路中 VOR 航路点的坐标 | 调谐 VOR 台的坐标 |
| **方位计算** | 飞机坐标 → 航路 VOR 坐标 | 飞机坐标 → 调谐台坐标 |
| **指针行为** | 指向航路中的 VOR 台 | 指向调谐的 VOR 台 |
| **与航道关系** | 独立于 CRS，仅指示 VOR 台方向 | 独立于 CRS，仅指示 VOR 台方向 |

### 3.4 图形表现

```
罗盘视图（heading up）：

         N (heading)
           ↑
           │
    ───────╋───────
    ▲      ║      │
    │      ║      │       ← 方位指针（绿色/白色直线）
    │      ║      │
    ───────╋───────▲
           │
           ↓
         VOR 台方向

注意：方位指针与航道杆（十字杆）独立工作。
- 航道杆指向 CRS（飞行员设定）
- 方位指针指向 VOR 台（实际地理方向）
- 当飞机对准航道时，两者方向一致
```

---

## 四、三种指示的交互关系

### 4.1 正常飞行场景

```
场景：飞机沿航道飞向 VOR 台（TO 模式）

罗盘视图：
         N (heading)
           ↑
           │
    ────┬──╋──┬────  ← 航道杆指向 CRS
        │  ║  │
        │  ║  │       ← 偏离杆居中（飞机在航道上）
        │  ║  │
    ────┴──╋──┴────
      ▲    │    ▲
      │    │    │     ← 方位指针指向 VOR 台方向
      └────┴────┘

此时：
- 航道杆指向 CRS = 方位指针指向 = 飞机航向（三者一致）
- 偏离杆居中（偏差 = 0°）
- TO 指示（箭头朝上）
```

### 4.2 偏航场景

```
场景：飞机偏右，需要向左修正

         N (heading)
           ↑
           │
    ────┬──╋──┬────
        │  ║  │
     ◄──┼──╋──┼──    ← 偏离杆偏左（指示向左飞）
        │  ║  │
    ────┴──╋──┴────
      ▲    │    ▲
      │    │    │     ← 方位指针仍指向 VOR 台
      └────┴────┘

此时：
- 偏离杆偏左（angularDev > 0，飞机在航道右侧）
- 方位指针仍指向 VOR 台方向（不受偏差影响）
- 航道杆仍指向 CRS（不受偏差影响）
```

### 4.3 VOR 台在航路内 vs 航路外的完整对比

| 特性 | VOR 在航路内 | VOR 在航路外 |
|------|-------------|-------------|
| **VOR 台来源** | `activeRoute.waypoints` 中 `type === 'VOR'` 的航路点 | `VORManagerContext` 的调谐台（自动/手动） |
| **优先级** | 最高（优先级 1） | 中等（优先级 2）或最低（优先级 3 回退） |
| **自动调谐影响** | 无影响（航路 VOR 覆盖自动调谐） | 自动模式下随飞机位置切换最近 VOR |
| **手动调谐影响** | 无影响（航路 VOR 覆盖手动调谐） | 手动模式下锁定到指定频率 |
| **航道杆（CDI）** | 指向飞行员设定的 CRS | 指向飞行员设定的 CRS |
| **偏离杆基准** | 飞机相对于航路 VOR 的径向线 | 飞机相对于调谐 VOR 的径向线 |
| **方位指针目标** | 航路 VOR 航路点 | 调谐 VOR 台 |
| **TO/FROM 判断** | 基于飞机与航路 VOR 的相对位置 | 基于飞机与调谐 VOR 的相对位置 |
| **ND 信息显示** | 显示航路 VOR 的频率和名称 | 显示调谐 VOR 的频率和名称 |
| **航路切换影响** | 切换航路时自动跟随新航路的 VOR | 不受航路切换影响 |

---

## 五、代码实现映射

### 5.1 VOR 台选择（NDDisplay.js 第 804-849 行）

```javascript
// 优先级 1：航路 VOR
if (activeRoute && activeRoute.waypoints.length > 0) {
    const routeVOR = activeRoute.waypoints.find(wp => 
        (wp.type && wp.type.toUpperCase() === 'VOR') ||
        (wp.navaidType && wp.navaidType.toUpperCase() === 'VOR')
    );
    if (routeVOR) {
        vorStation = { id, name, frequency, x, y, type, navaidType, distance };
    }
}

// 优先级 2：调谐台
if (!vorStation) {
    vorStation = getActiveVORStation();
}

// 优先级 3：最近 VOR
if (!vorStation) {
    vorStation = findNearestVORStation(aircraft.x, aircraft.y);
}
```

### 5.2 偏差计算（NDDisplay.js 第 894-911 行）

```javascript
if (vorStation) {
    const bearingToVorDeg = (90 - Math.atan2(toVorDy, toVorDx) * 180 / Math.PI + 360) % 360;
    const aircraftRadial = (bearingToVorDeg + 180) % 360;
    let angularDev = aircraftRadial - vorCourse;
    if (angularDev > 180) angularDev -= 360;
    if (angularDev < -180) angularDev += 360;
    vorDeviation = -Math.max(-20, Math.min(20, angularDev));
}
```

### 5.3 方位指针（NDDisplay.js 第 851-858 行）

```javascript
if (vorStation) {
    const dx = vorStation.x - aircraft.x;
    const dy = vorStation.y - aircraft.y;
    bearingToVOR = (Math.atan2(dy, dx) * 180 / Math.PI);
    bearingToVOR = (90 - bearingToVOR + 360) % 360;
}
```

### 5.4 TO/FROM 判断（NDDisplay.js 第 914-924 行）

```javascript
if (vorStation) {
    const bearingToVorDeg = (90 - Math.atan2(toVorDy, toVorDx) * 180 / Math.PI + 360) % 360;
    const headingDiff = ((aircraft.heading - bearingToVorDeg) % 360 + 360) % 360;
    isToMode = headingDiff < 90 || headingDiff > 270;
}
```

---

## 六、总结

VOR 模式中三种指示的核心区别：

| 指示 | 显示内容 | 控制源 | 与 VOR 台位置关系 |
|------|---------|-------|------------------|
| **航道杆（CDI）** | 飞行员设定的 CRS 方向 | EFIS CRS 旋钮 | 独立于 VOR 台位置 |
| **偏离杆** | 飞机径向线与 CRS 的偏差 | VOR 台位置 + CRS | 依赖 VOR 台位置计算径向线 |
| **方位指针** | VOR 台的实际地理方向 | VOR 台位置 | 直接指向 VOR 台 |

当 VOR 台在航路内时，系统自动以航路 VOR 作为参考源，覆盖自动/手动调谐设置，确保 ND 显示的 VOR 信息与飞行计划一致。当 VOR 台在航路外时，系统回退到 VORManagerContext 的调谐机制（自动模式下自动跟踪最近 VOR，手动模式下锁定到指定频率）。
