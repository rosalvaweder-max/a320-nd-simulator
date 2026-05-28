/**
 * 专业航空符号 - A320 ND 模拟器
 * 基于空客 A320 导航显示器标准
 */

import { COLORS, SYMBOL_SIZES, FONTS } from '../constants.js';

/**
 * 绘制专业飞机符号（空客风格）
 */
export const drawAircraftSymbol = (ctx, x, y, heading, scale = 1) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(heading * Math.PI / 180);
    
    const size = SYMBOL_SIZES.AIRCRAFT * scale;
    
    // 空客 A320 ND 飞机符号（黄色"士"字形）
    ctx.strokeStyle = COLORS.YELLOW;
    ctx.fillStyle = COLORS.YELLOW;
    ctx.lineWidth = 2.5 * scale;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // 添加微弱的发光效果
    ctx.shadowColor = 'rgba(255, 255, 0, 0.3)';
    ctx.shadowBlur = 4 * scale;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // 主垂直线（机身）
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.8);
    ctx.lineTo(0, size * 0.6);
    ctx.stroke();
    
    // 机翼
    ctx.beginPath();
    ctx.moveTo(-size * 0.8, -size * 0.1);
    ctx.lineTo(size * 0.8, -size * 0.1);
    ctx.stroke();
    
    // 水平尾翼
    ctx.beginPath();
    ctx.moveTo(-size * 0.3, size * 0.5);
    ctx.lineTo(size * 0.3, size * 0.5);
    ctx.stroke();
    
    // 中心参考框（空心）
    ctx.fillStyle = COLORS.BACKGROUND;
    ctx.strokeStyle = COLORS.YELLOW;
    ctx.lineWidth = 1.5 * scale;
    ctx.beginPath();
    ctx.rect(-size * 0.15, -size * 0.2, size * 0.3, size * 0.3);
    ctx.fill();
    ctx.stroke();
    
    // 中心十字
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.2);
    ctx.lineTo(0, size * 0.1);
    ctx.moveTo(-size * 0.15, -size * 0.05);
    ctx.lineTo(size * 0.15, -size * 0.05);
    ctx.stroke();
    
    ctx.restore();
};

/**
 * 绘制 VOR 导航台符号
 */
export const drawVORSymbol = (ctx, x, y, frequency = null) => {
    ctx.save();
    ctx.translate(x, y);
    
    const size = SYMBOL_SIZES.VOR;
    
    // VOR 符号（六边形带中心圆点）
    ctx.strokeStyle = COLORS.CYAN;
    ctx.fillStyle = COLORS.CYAN;
    ctx.lineWidth = 2;
    
    // 六边形
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (i * 60 - 30) * Math.PI / 180;
        const px = Math.cos(angle) * size;
        const py = Math.sin(angle) * size;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
    
    // 中心圆点
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // 频率标签（如果提供）
    if (frequency) {
        ctx.fillStyle = COLORS.TEXT_WHITE;
        ctx.font = FONTS.SMALL;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(frequency.toString(), 0, size + 2);
    }
    
    ctx.restore();
};

/**
 * 绘制 NDB 导航台符号
 */
export const drawNDBSymbol = (ctx, x, y, frequency = null) => {
    ctx.save();
    ctx.translate(x, y);
    
    const size = SYMBOL_SIZES.NDB;
    
    // NDB 符号（带放射线的圆）
    ctx.strokeStyle = COLORS.CYAN;
    ctx.fillStyle = COLORS.CYAN;
    ctx.lineWidth = 2;
    
    // 外圆
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI * 2);
    ctx.stroke();
    
    // 放射线（4 个方向）
    for (let i = 0; i < 4; i++) {
        const angle = i * 90 * Math.PI / 180;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(angle) * size, Math.sin(angle) * size);
        ctx.stroke();
    }
    
    // 频率标签（如果提供）
    if (frequency) {
        ctx.fillStyle = COLORS.TEXT_WHITE;
        ctx.font = FONTS.SMALL;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(frequency.toString(), 0, size + 2);
    }
    
    ctx.restore();
};

/**
 * 绘制机场符号
 */
export const drawAirportSymbol = (ctx, x, y, icao = null) => {
    ctx.save();
    ctx.translate(x, y);
    
    const size = SYMBOL_SIZES.AIRPORT;
    
    // 机场符号（带十字的圆）
    ctx.strokeStyle = COLORS.CYAN;
    ctx.fillStyle = COLORS.CYAN;
    ctx.lineWidth = 2;
    
    // 圆
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI * 2);
    ctx.stroke();
    
    // 十字
    ctx.beginPath();
    ctx.moveTo(-size * 0.7, 0);
    ctx.lineTo(size * 0.7, 0);
    ctx.moveTo(0, -size * 0.7);
    ctx.lineTo(0, size * 0.7);
    ctx.stroke();
    
    // ICAO 代码标签（如果提供）
    if (icao) {
        ctx.fillStyle = COLORS.TEXT_WHITE;
        ctx.font = FONTS.SMALL;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(icao, 0, size + 2);
    }
    
    ctx.restore();
};

/**
 * 绘制航路点/定位点符号
 */
export const drawWaypointSymbol = (ctx, x, y, name = null, isActive = false) => {
    ctx.save();
    ctx.translate(x, y);
    
    const size = SYMBOL_SIZES.WAYPOINT;
    
    // 航路点符号（激活态为菱形，非激活态为方形）
    ctx.strokeStyle = isActive ? COLORS.MAGENTA : COLORS.CYAN;
    ctx.fillStyle = isActive ? COLORS.MAGENTA : COLORS.CYAN;
    ctx.lineWidth = isActive ? 2.5 : 1.5;
    
    if (isActive) {
        // 激活的航路点（菱形）
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(size, 0);
        ctx.lineTo(0, size);
        ctx.lineTo(-size, 0);
        ctx.closePath();
        ctx.stroke();
        
        // 激活航路点的填充
        ctx.fillStyle = 'rgba(255, 0, 255, 0.2)';
        ctx.fill();
    } else {
        // 非激活航路点（方形）
        ctx.beginPath();
        ctx.rect(-size/2, -size/2, size, size);
        ctx.stroke();
    }
    
    // 航路点名称标签（如果提供）
    if (name) {
        ctx.fillStyle = isActive ? COLORS.MAGENTA : COLORS.TEXT_WHITE;
        ctx.font = FONTS.SMALL;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(name, 0, size + 2);
    }
    
    ctx.restore();
};

/**
 * 绘制 TCAS 交通目标符号
 */
export const drawTCASTraffic = (ctx, x, y, threatLevel, relativeAlt, verticalSpeed = 0) => {
    ctx.save();
    ctx.translate(x, y);
    
    const size = SYMBOL_SIZES.TCAS;
    
    // 根据威胁等级确定颜色
    let color;
    let fill = false;
    
    switch (threatLevel) {
        case 'RA': // 决断咨询
            color = COLORS.TCAS_RA;
            fill = true;
            break;
        case 'TA': // 交通咨询
            color = COLORS.TCAS_TA;
            fill = true;
            break;
        case 'PROXIMATE':
            color = COLORS.TCAS_PROXIMATE;
            break;
        default:
            color = COLORS.TEXT_GREY;
    }
    
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1.5;
    
    // 绘制交通目标符号（实心或空心菱形）
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size, 0);
    ctx.lineTo(0, size);
    ctx.lineTo(-size, 0);
    ctx.closePath();
    
    if (fill) {
        ctx.fill();
    } else {
        ctx.stroke();
    }
    
    // 高度差指示器
    if (relativeAlt !== 0) {
        ctx.fillStyle = color;
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const altText = Math.abs(relativeAlt) >= 1000 ? 
            `${(relativeAlt/1000).toFixed(1)}K` : 
            `${Math.abs(relativeAlt)}`;
        
        const prefix = relativeAlt > 0 ? '+' : '-';
        ctx.fillText(`${prefix}${altText}`, 0, size + 8);
    }
    
    // 垂直速度指示器（箭头）
    if (verticalSpeed !== 0) {
        const arrowSize = 4;
        ctx.beginPath();
        if (verticalSpeed > 0) {
            // 上升箭头（向上）
            ctx.moveTo(0, -size - arrowSize);
            ctx.lineTo(-arrowSize, -size);
            ctx.lineTo(arrowSize, -size);
        } else {
            // 下降箭头（向下）
            ctx.moveTo(0, size + arrowSize);
            ctx.lineTo(-arrowSize, size);
            ctx.lineTo(arrowSize, size);
        }
        ctx.closePath();
        ctx.fill();
    }
    
    ctx.restore();
};

/**
 * 绘制气象雷达回波
 */
export const drawWeatherReturn = (ctx, x, y, intensity, distance) => {
    ctx.save();
    ctx.translate(x, y);
    
    // 根据强度确定颜色和大小
    let color, radius;
    switch (intensity) {
        case 'EXTREME':
            color = COLORS.WEATHER_EXTREME;
            radius = 8;
            break;
        case 'HEAVY':
            color = COLORS.WEATHER_HEAVY;
            radius = 6;
            break;
        case 'MODERATE':
            color = COLORS.WEATHER_MODERATE;
            radius = 4;
            break;
        case 'LIGHT':
        default:
            color = COLORS.WEATHER_LIGHT;
            radius = 2;
    }
    
    // 使用渐变绘制气象回波
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
    gradient.addColorStop(0, color + 'CC'); // 中心更不透明
    gradient.addColorStop(1, color + '33'); // 边缘更透明
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // 为显著天气添加距离标签
    if (intensity === 'HEAVY' || intensity === 'EXTREME') {
        ctx.fillStyle = COLORS.TEXT_WHITE;
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(`${distance.toFixed(1)}nm`, 0, radius + 2);
    }
    
    ctx.restore();
};

/**
 * 绘制地形等高线
 */
export const drawTerrainContour = (ctx, points, elevationLevel) => {
    if (points.length < 3) return;
    
    ctx.save();
    
    // 根据高程确定颜色
    let color;
    switch (elevationLevel) {
        case 'EXTREME':
            color = COLORS.TERRAIN_EXTREME;
            break;
        case 'VERY_HIGH':
            color = COLORS.TERRAIN_VERY_HIGH;
            break;
        case 'HIGH':
            color = COLORS.TERRAIN_HIGH;
            break;
        case 'MEDIUM':
            color = COLORS.TERRAIN_MEDIUM;
            break;
        case 'LOW':
        default:
            color = COLORS.TERRAIN_LOW;
    }
    
    // 绘制填充多边形
    ctx.fillStyle = color + '40'; // 25% opacity
    ctx.strokeStyle = color + '80'; // 50% opacity
    ctx.lineWidth = 1;
    
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    ctx.restore();
};

/**
 * 绘制飞行计划航路线
 */
export const drawFlightPlanRoute = (ctx, waypoints, isActive = false, hasDiscontinuity = false) => {
    if (waypoints.length < 2) return;
    
    ctx.save();
    
    // 航路线样式
    ctx.strokeStyle = isActive ? COLORS.GREEN : COLORS.CYAN;
    ctx.lineWidth = isActive ? 3 : 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // 断点使用虚线
    if (hasDiscontinuity) {
        ctx.setLineDash([5, 3]);
    } else {
        ctx.setLineDash([]);
    }
    
    // 绘制航路
    ctx.beginPath();
    ctx.moveTo(waypoints[0].x, waypoints[0].y);
    for (let i = 1; i < waypoints.length; i++) {
        ctx.lineTo(waypoints[i].x, waypoints[i].y);
    }
    ctx.stroke();
    
    // 重置虚线样式
    ctx.setLineDash([]);
    
    ctx.restore();
};

/**
 * 绘制等待航线
 */
export const drawHoldingPattern = (ctx, centerX, centerY, inboundCourse, turnDirection = 'right', isActive = false) => {
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((inboundCourse - 180) * Math.PI / 180);
    
    const radius = 20; // NM scale
    const lineLength = 40; // NM scale
    
    ctx.strokeStyle = isActive ? COLORS.MAGENTA : COLORS.CYAN;
    ctx.lineWidth = isActive ? 2.5 : 1.5;
    ctx.setLineDash([2, 2]); // 等待航线使用虚线
    
    // 向台航段
    ctx.beginPath();
    ctx.moveTo(0, -lineLength/2);
    ctx.lineTo(0, 0);
    ctx.stroke();
    
    // 背台航段
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, lineLength/2);
    ctx.stroke();
    
    // 转弯弧
    ctx.beginPath();
    if (turnDirection === 'right') {
        // 右转（标准）
        ctx.arc(radius, 0, radius, Math.PI, 0, false);
    } else {
        // 左转
        ctx.arc(-radius, 0, radius, 0, Math.PI, false);
    }
    ctx.stroke();
    
    // 等待定位点符号
    ctx.fillStyle = isActive ? COLORS.MAGENTA : COLORS.CYAN;
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
};

/**
 * 绘制风向箭头和数据
 */
export const drawWindData = (ctx, x, y, windDirection, windSpeed, heading) => {
    ctx.save();
    ctx.translate(x, y);
    
    const arrowLength = 30;
    const arrowSize = 6;
    
    // 计算相对风向
    const relativeDirection = windDirection - heading;
    
    // 绘制风向箭头
    ctx.strokeStyle = COLORS.TEXT_WHITE;
    ctx.fillStyle = COLORS.TEXT_WHITE;
    ctx.lineWidth = 2;
    
    ctx.rotate(relativeDirection * Math.PI / 180);
    
    // 箭杆
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -arrowLength);
    ctx.stroke();
    
    // 箭头
    ctx.beginPath();
    ctx.moveTo(0, -arrowLength);
    ctx.lineTo(-arrowSize, -arrowLength + arrowSize);
    ctx.lineTo(arrowSize, -arrowLength + arrowSize);
    ctx.closePath();
    ctx.fill();
    
    // 风速文字
    ctx.rotate(-relativeDirection * Math.PI / 180);
    ctx.fillStyle = COLORS.TEXT_WHITE;
    ctx.font = FONTS.SMALL;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`${windSpeed}kt`, 0, -arrowLength - 5);
    
    ctx.restore();
};

/**
 * 绘制量程环和距离刻度
 */
export const drawRangeRing = (ctx, cx, cy, radius, range) => {
    ctx.save();
    
    // 量程环圆圈
    ctx.strokeStyle = COLORS.COMPASS_GREY;
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // 重置虚线样式
    ctx.setLineDash([]);
    
    // 量程标签
    ctx.fillStyle = COLORS.TEXT_WHITE;
    ctx.font = FONTS.SMALL;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // 在基本方向点放置标签
    const positions = [
        { x: cx, y: cy - radius - 10, text: `${range}NM` },
        { x: cx + radius + 10, y: cy, text: `${range}NM` },
        { x: cx, y: cy + radius + 10, text: `${range}NM` },
        { x: cx - radius - 10, y: cy, text: `${range}NM` },
    ];
    
    positions.forEach(pos => {
        ctx.fillText(pos.text, pos.x, pos.y);
    });
    
    ctx.restore();
};

/**
 * 绘制显示网格（用于 PLAN 模式）
 */
export const drawDisplayGrid = (ctx, width, height, spacing = 50) => {
    ctx.save();
    
    ctx.strokeStyle = COLORS.DISPLAY_GRID;
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.3;
    
    // 垂直线
    for (let x = spacing; x < width; x += spacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
    
    // 水平线
    for (let y = spacing; y < height; y += spacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
    
    ctx.restore();
};

/**
 * 应用 CRT/LCD 显示效果
 */
export const applyDisplayEffects = (ctx, width, height, effectType = 'LCD') => {
    ctx.save();
    
    if (effectType === 'CRT') {
        // CRT 荧光粉发光效果
        ctx.globalCompositeOperation = 'overlay';
        ctx.fillStyle = COLORS.CRT_PHOSPHOR;
        ctx.fillRect(0, 0, width, height);
        
        // 扫描线
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        for (let y = 0; y < height; y += 2) {
            ctx.fillRect(0, y, width, 1);
        }
    } else if (effectType === 'LCD') {
        // LCD 像素网格效果
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = COLORS.PIXEL_GRID;
        
        // 绘制细微的像素网格
        const pixelSize = 2;
        for (let x = 0; x < width; x += pixelSize) {
            for (let y = 0; y < height; y += pixelSize) {
                if ((x + y) % (pixelSize * 2) === 0) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
    }
    
    ctx.restore();
};