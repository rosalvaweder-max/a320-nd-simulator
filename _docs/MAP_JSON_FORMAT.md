# 可加载地图 JSON 格式说明

本模拟器支持通过 JSON 文件加载自定义地图数据。地图文件可通过 [`MapLoader`](components/MapLoader.js) 组件从 URL 或本地文件加载。

## 文件结构

```json
{
  "metadata":     { ... },   // 必需：地图元数据
  "waypoints":    [ ... ],   // 可选：航路点列表
  "navaids":      [ ... ],   // 可选：导航设施列表（VOR/NDB）
  "airways":      [ ... ],   // 可选：航路/航线列表
  "terrain":      [ ... ],   // 可选：地形数据
  "defaultRoutes":[ ... ]    // 可选：默认航路
}
```

## 字段详解

### 1. metadata（必需）

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `name` | string | 是 | 地图名称 |
| `version` | string | 否 | 版本号，默认 `"1.0.0"` |
| `description` | string | 否 | 地图描述 |
| `author` | string | 否 | 作者 |
| `created` | string | 否 | 创建日期，格式 `YYYY-MM-DD` |
| `coordinateSystem` | string | 否 | 坐标系，默认 `"NM"`（海里） |
| `bounds` | object | 否 | 地图边界，默认 `{minX:-500, maxX:500, minY:-500, maxY:500}` |

**示例：**
```json
{
  "name": "华北区域导航图",
  "version": "1.0.0",
  "description": "北京周边主要航路点和导航设施",
  "author": "A320 Simulator Team",
  "created": "2026-01-15",
  "coordinateSystem": "NM",
  "bounds": { "minX": -300, "maxX": 300, "minY": -300, "maxY": 300 }
}
```

### 2. waypoints（可选）

航路点数组，每个航路点：

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 唯一标识符，用于航路引用 |
| `name` | string | 是 | 显示名称 |
| `type` | string | 否 | 类型：`FIX`（默认）、`AIRPORT`、`VOR`、`NDB` |
| `x` | number | 是 | X 坐标（海里） |
| `y` | number | 是 | Y 坐标（海里） |
| `elevation` | number | 否 | 海拔高度（英尺） |
| `frequency` | string | 否 | 频率（如 `"118.10"`） |
| `runways` | string[] | 否 | 跑道列表（仅机场类型） |

**示例：**
```json
{
  "id": "wp-pek",
  "name": "PEK",
  "type": "AIRPORT",
  "x": -50,
  "y": 100,
  "elevation": 116,
  "frequency": "118.10",
  "runways": ["18L/36R", "18R/36L"]
}
```

### 3. navaids（可选）

导航设施数组，每个导航设施：

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 唯一标识符 |
| `name` | string | 是 | 显示名称 |
| `type` | string | 是 | 类型：`VOR` 或 `NDB` |
| `x` | number | 是 | X 坐标（海里） |
| `y` | number | 是 | Y 坐标（海里） |
| `frequency` | string | 是 | 频率（VOR: `"108.00"`-`"117.95"`，NDB: `"200"`-`"1750"`） |
| `range` | number | 否 | 作用范围（海里），默认 `100` |

**示例：**
```json
{
  "id": "vor-sha",
  "name": "SHA",
  "type": "VOR",
  "x": 80,
  "y": 60,
  "frequency": "115.30",
  "range": 200
}
```

### 4. airways（可选）

航路/航线数组，每条航路：

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 唯一标识符 |
| `name` | string | 是 | 航路名称（如 `"A593"`） |
| `color` | string | 否 | 显示颜色（CSS 颜色值），默认 `"#06b6d4"` |
| `waypointIds` | string[] | 是 | 经过的航路点/导航设施 ID 列表 |

**示例：**
```json
{
  "id": "awy-a593",
  "name": "A593",
  "color": "#06b6d4",
  "waypointIds": ["vor-sha", "wp-pek", "vor-dlc"]
}
```

### 5. terrain（可选）

地形数据数组，每个地形块：

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `type` | string | 是 | 类型：`mountain`、`water`、`city` 等 |
| `name` | string | 否 | 名称 |
| `vertices` | object[] | 是 | 多边形顶点数组 `[{x, y}, ...]` |
| `elevation` | number | 否 | 海拔高度（英尺） |
| `color` | string | 否 | 填充颜色（CSS 颜色值） |

**示例：**
```json
{
  "type": "mountain",
  "name": "太行山脉",
  "vertices": [
    {"x": 30, "y": -40},
    {"x": 70, "y": -20},
    {"x": 50, "y": 10}
  ],
  "elevation": 2500,
  "color": "#4b5563"
}
```

### 6. defaultRoutes（可选）

默认航路数组，每条默认航路：

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 唯一标识符 |
| `name` | string | 是 | 航路名称 |
| `description` | string | 否 | 航路描述 |
| `waypointIds` | string[] | 是 | 经过的航路点/导航设施 ID 列表 |

**示例：**
```json
{
  "id": "route-beijing-shanghai",
  "name": "京沪航线",
  "description": "北京→上海",
  "waypointIds": ["wp-pek", "vor-sha"]
}
```

## 完整示例

参考 [`data/europe-map.json`](data/europe-map.json) 和 [`data/map-template.json`](data/map-template.json)。

## 加载方式

1. **从 URL 加载**：在 MapLoader 中输入 JSON 文件的 URL 地址
2. **从文件加载**：点击"选择文件"按钮选择本地 JSON 文件
3. **加载示例**：点击"加载示例地图"按钮加载内置的 `europe-map.json`

## 坐标系说明

- 使用笛卡尔坐标系（NM，海里）
- X 轴：东为正，西为负
- Y 轴：北为正，南为负
- 坐标原点为地图中心点
- 1 NM ≈ 1.852 km
