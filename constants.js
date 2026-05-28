// A320 导航显示器真实颜色（基于空客标准）
export const COLORS = {
    // 背景与显示
    BACKGROUND: '#000000',
    DISPLAY_BACKGROUND: '#000000',
    DISPLAY_GRID: '#1a1a1a',
    
    // 主色（空客标准）
    MAGENTA: '#FF00FF',      // 激活飞行计划、选定数据
    CYAN: '#00FFFF',         // 飞行计划、航路点、导航台
    GREEN: '#00FF00',        // 激活航段、航迹线
    YELLOW: '#FFFF00',       // 飞机符号、注意指示
    AMBER: '#FF9900',        // 警告、咨询
    RED: '#FF0000',          // 警戒、故障
    
    // 文本与标签
    TEXT_WHITE: '#FFFFFF',   // 普通文本
    TEXT_GREY: '#AAAAAA',    // 暗淡文本
    TEXT_BRIGHT: '#F0F0F0',  // 高亮文本
    
    // 罗盘与刻度
    COMPASS_WHITE: '#FFFFFF',
    COMPASS_GREY: '#888888',
    COMPASS_MARKER: '#00FFFF',
    
    // 地形与天气
    TERRAIN_LOW: '#004400',      // 0-1000英尺
    TERRAIN_MEDIUM: '#008800',   // 1000-2000英尺
    TERRAIN_HIGH: '#00CC00',     // 2000-5000英尺
    TERRAIN_VERY_HIGH: '#FFFF00', // 5000-10000英尺
    TERRAIN_EXTREME: '#FF0000',  // 10000+英尺
    
    WEATHER_LIGHT: '#00AAFF',    // 弱降水
    WEATHER_MODERATE: '#0088FF', // 中等降水
    WEATHER_HEAVY: '#0000FF',    // 强降水
    WEATHER_EXTREME: '#FF00FF',  // 极端降水
    
    // TCAS 交通
    TCAS_PROXIMATE: '#00FF00',   // 邻近飞机
    TCAS_TA: '#FFFF00',          // 交通咨询
    TCAS_RA: '#FF0000',          // 决断咨询
    
    // 特殊效果
    GLOW_EFFECT: 'rgba(255, 255, 255, 0.1)',
    PIXEL_GRID: 'rgba(100, 100, 100, 0.05)',
    CRT_PHOSPHOR: 'rgba(0, 255, 0, 0.05)',
    
    // 向后兼容别名（供 drawingUtils.js 使用）
    AIRCRAFT_YELLOW: '#FFFF00',      // YELLOW 的别名
    LABEL_CYAN: '#00FFFF',           // CYAN 的别名
    VALUE_GREEN: '#00FF00',          // GREEN 的别名
    TEXT_MAGENTA: '#FF00FF',         // MAGENTA 的别名
    TEXT_AMBER: '#FF9900',           // AMBER 的别名
    TEXT_RED: '#FF0000',             // RED 的别名
    HEADING_BLUE: '#0000FF',         // 航向蓝色（非空客标准，旧代码使用）
    TRACK_GREEN: '#00FF00',          // GREEN 的别名
    ACTIVE_PATH: '#FF00FF',          // MAGENTA 的别名
    EGPWS_LOW: '#004400',            // TERRAIN_LOW 的别名
    EGPWS_MED: '#008800',            // TERRAIN_MEDIUM 的别名
    EGPWS_HIGH: '#00CC00',           // TERRAIN_HIGH 的别名
    EGPWS_WATER: '#0000AA',          // 地形显示的水面颜色
};

// A320 ND 显示模式
export const ND_MODES = {
    ROSE_NAV: 'ROSE_NAV',
    ROSE_ILS: 'ROSE_ILS',
    ROSE_VOR: 'ROSE_VOR',
    ARC: 'ARC',
    PLAN: 'PLAN',
};

// A320 ND 量程设置（海里）
export const ND_RANGES = [10, 20, 40, 80, 160, 320, 640];

// 空客字体规格
export const FONTS = {
    PRIMARY: '16px "AirbusDisp", "Segoe UI", sans-serif',
    SECONDARY: '14px "AirbusDisp", "Segoe UI", sans-serif',
    SMALL: '12px "AirbusDisp", "Segoe UI", sans-serif',
    LARGE: '18px "AirbusDisp", "Segoe UI", sans-serif',
    BOLD: 'bold 16px "AirbusDisp", "Segoe UI", sans-serif',
};

// 空客符号尺寸
export const SYMBOL_SIZES = {
    AIRCRAFT: 24,   // 飞机符号
    WAYPOINT: 8,    // 航路点
    VOR: 10,        // VOR 导航台
    NDB: 8,         // NDB 导航台
    AIRPORT: 12,    // 机场
    TCAS: 6,        // TCAS 目标
};

// 显示常量
export const DISPLAY = {
    WIDTH: 600,         // 显示宽度（像素）
    HEIGHT: 600,        // 显示高度（像素）
    PADDING: 20,        // 内边距
    COMPASS_RADIUS: 250, // 罗盘半径
    ARC_ANGLE: 100,     // ARC 模式角度（度）
};

// 导航常量
export const NAV = {
    EARTH_RADIUS_NM: 3440.065, // 地球半径（海里）
    DEG_TO_RAD: Math.PI / 180,  // 角度转弧度系数
    RAD_TO_DEG: 180 / Math.PI,  // 弧度转角度系数
    MAX_BANK_ANGLE: 30,         // 最大坡度角（度，显示限制用）
};

// 专业航空航路点与导航台
export const NAV_AIDS = {
    // 航路点类型
    WAYPOINT_TYPES: {
        FIX: 'FIX',         // 定位点
        VOR: 'VOR',         // 甚高频全向信标台
        NDB: 'NDB',         // 无方向信标台
        DME: 'DME',         // 测距仪
        TACAN: 'TACAN',     // 战术空中导航
        AIRPORT: 'AIRPORT', // 机场
        RUNWAY: 'RUNWAY',   // 跑道
        ILS: 'ILS',         // 仪表着陆系统
    },
    
    // 航路点状态
    WAYPOINT_STATUS: {
        ACTIVE: 'active',           // 激活
        DIRECT: 'direct',           // 直飞
        INACTIVE: 'inactive',       // 未激活
        DISCONTINUITY: 'discontinuity', // 断点
        HOLD: 'hold',               // 等待
    },
};

// 真实航路点（欧洲空域示例）
export const MOCK_WAYPOINTS = [
    {
        id: 'wp-lfpg',
        name: 'LFPG',
        type: 'AIRPORT',
        lat: 49.0097,
        lon: 2.5479,
        elevation: 392,
        frequency: '118.10',
        x: -120,
        y: 80,
    },
    {
        id: 'wp-egll',
        name: 'EGLL',
        type: 'AIRPORT',
        lat: 51.4775,
        lon: -0.4614,
        elevation: 80,
        frequency: '118.30',
        x: -150,
        y: 50,
    },
    {
        id: 'wp-big',
        name: 'CDG',
        type: 'FIX',
        lat: 48.7264,
        lon: 2.3833,
        x: -100,
        y: 60,
    },
    {
        id: 'wp-lam',
        name: 'LAM',
        type: 'NDB',
        lat: 48.4333,
        lon: 2.7667,
        frequency: '385',
        x: -80,
        y: 40,
    },
    {
        id: 'wp-todil',
        name: 'TODIL',
        type: 'FIX',
        lat: 49.5000,
        lon: 2.0000,
        x: -90,
        y: 100,
    },
    {
        id: 'wp-kok',
        name: 'KOK',
        type: 'NDB',
        lat: 50.0000,
        lon: 2.5000,
        frequency: '385',
        x: -70,
        y: 120,
    },
];

// 真实 TCAS 交通数据
export const MOCK_TCAS = [
    {
        id: 'tcas-b737',
        callsign: 'BAW123',
        bearing: 45,
        distance: 12.5,
        relativeAlt: 1200,
        verticalSpeed: 1500,
        threatLevel: 'RA',      // 决断咨询
        type: 'B737',
    },
    {
        id: 'tcas-a320',
        callsign: 'AFR456',
        bearing: 135,
        distance: 8.2,
        relativeAlt: -800,
        verticalSpeed: -1200,
        threatLevel: 'TA',      // 交通咨询
        type: 'A320',
    },
    {
        id: 'tcas-b777',
        callsign: 'UAL789',
        bearing: 225,
        distance: 25.0,
        relativeAlt: 500,
        verticalSpeed: 0,
        threatLevel: 'PROXIMATE', // 邻近飞机
        type: 'B777',
    },
    {
        id: 'tcas-crj',
        callsign: 'DLH234',
        bearing: 315,
        distance: 18.7,
        relativeAlt: -1500,
        verticalSpeed: -800,
        threatLevel: 'OTHER',    // 其他飞机
        type: 'CRJ',
    },
];

// 天气雷达数据
export const MOCK_WEATHER = [
    {
        bearing: 30,
        distance: 40,
        intensity: 'HEAVY',     // 强降水
        turbulence: true,       // 有颠簸
    },
    {
        bearing: 120,
        distance: 25,
        intensity: 'MODERATE',  // 中等降水
        turbulence: false,
    },
    {
        bearing: 210,
        distance: 60,
        intensity: 'LIGHT',     // 弱降水
        turbulence: false,
    },
];

// 地形数据
export const MOCK_TERRAIN = [
    {
        minX: -200,
        maxX: -100,
        minY: 50,
        maxY: 150,
        minElevation: 0,
        maxElevation: 500,
        color: 'TERRAIN_LOW',   // 低海拔
    },
    {
        minX: -50,
        maxX: 50,
        minY: -50,
        maxY: 50,
        minElevation: 1000,
        maxElevation: 2500,
        color: 'TERRAIN_MEDIUM', // 中海拔
    },
    {
        minX: 100,
        maxX: 200,
        minY: -100,
        maxY: 0,
        minElevation: 3000,
        maxElevation: 6000,
        color: 'TERRAIN_HIGH',   // 高海拔
    },
];