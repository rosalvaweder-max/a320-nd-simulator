/**
 * 地形与气象雷达仿真服务
 * 面向 A320 ND 的专业级地形显示和气象雷达仿真
 */

import { COLORS, NAV } from '../constants.js';

/**
 * 地形服务 - 用于高程数据处理和显示
 */
class TerrainService {
    constructor() {
        this.terrainData = null;
        this.elevationCache = new Map();
        this.gridResolution = 10; // 网格分辨率（海里）
    }
    
    /**
     * 从外部源加载地形数据
     */
    async loadTerrainData(url) {
        try {
            const response = await fetch(url);
            this.terrainData = await response.json();
            this.preprocessTerrainData();
            return true;
        } catch (error) {
            console.error('Failed to load terrain data:', error);
            return false;
        }
    }
    
    /**
     * 预处理地形数据以加快渲染速度
     */
    preprocessTerrainData() {
        if (!this.terrainData || !this.terrainData.elevations) return;
        
        // 创建高程网格以便快速查询
        const { elevations, bounds, resolution } = this.terrainData;
        
        this.gridResolution = resolution || 10;
        this.terrainBounds = bounds;
        
        // 转换为网格以便快速插值
        const gridWidth = Math.ceil((bounds.maxX - bounds.minX) / this.gridResolution);
        const gridHeight = Math.ceil((bounds.maxY - bounds.minY) / this.gridResolution);
        
        this.elevationGrid = new Array(gridWidth);
        for (let i = 0; i < gridWidth; i++) {
            this.elevationGrid[i] = new Array(gridHeight).fill(0);
        }
        
        // 填充网格数据
        elevations.forEach(elevation => {
            const gridX = Math.floor((elevation.x - bounds.minX) / this.gridResolution);
            const gridY = Math.floor((elevation.y - bounds.minY) / this.gridResolution);
            
            if (gridX >= 0 && gridX < gridWidth && gridY >= 0 && gridY < gridHeight) {
                this.elevationGrid[gridX][gridY] = elevation.elevation;
            }
        });
    }
    
    /**
     * 获取指定坐标处的高程（双线性插值）
     */
    getElevationAt(x, y) {
        if (!this.terrainData || !this.elevationGrid) return 0;
        
        const { minX, minY } = this.terrainBounds;
        const gridX = (x - minX) / this.gridResolution;
        const gridY = (y - minY) / this.gridResolution;
        
        const x1 = Math.floor(gridX);
        const y1 = Math.floor(gridY);
        const x2 = Math.min(x1 + 1, this.elevationGrid.length - 1);
        const y2 = Math.min(y1 + 1, this.elevationGrid[0].length - 1);
        
        // 双线性插值
        const q11 = this.elevationGrid[x1]?.[y1] || 0;
        const q12 = this.elevationGrid[x1]?.[y2] || 0;
        const q21 = this.elevationGrid[x2]?.[y1] || 0;
        const q22 = this.elevationGrid[x2]?.[y2] || 0;
        
        const xRatio = gridX - x1;
        const yRatio = gridY - y1;
        
        const elevation = 
            q11 * (1 - xRatio) * (1 - yRatio) +
            q21 * xRatio * (1 - yRatio) +
            q12 * (1 - xRatio) * yRatio +
            q22 * xRatio * yRatio;
        
        return Math.max(0, elevation);
    }
    
    /**
     * 根据高程获取地形颜色
     */
    getTerrainColor(elevation) {
        if (elevation >= 10000) return COLORS.TERRAIN_EXTREME;
        if (elevation >= 5000) return COLORS.TERRAIN_VERY_HIGH;
        if (elevation >= 2000) return COLORS.TERRAIN_HIGH;
        if (elevation >= 1000) return COLORS.TERRAIN_MEDIUM;
        return COLORS.TERRAIN_LOW;
    }
    
    /**
     * 生成用于显示的地形等高线
     */
    generateTerrainContours(centerX, centerY, range, resolution = 20) {
        if (!this.terrainData) return [];
        
        const contours = [];
        const gridSize = Math.ceil(range * 2 / resolution);
        
        for (let i = -gridSize; i <= gridSize; i++) {
            for (let j = -gridSize; j <= gridSize; j++) {
                const x = centerX + i * resolution;
                const y = centerY + j * resolution;
                
                const elevation = this.getElevationAt(x, y);
                if (elevation > 0) {
                    contours.push({
                        x, y, elevation,
                        color: this.getTerrainColor(elevation)
                    });
                }
            }
        }
        
        return contours;
    }
    
    /**
     * 计算地形净空和告警
     */
    calculateTerrainClearance(aircraftX, aircraftY, aircraftAltitude, lookaheadDistance = 20) {
        if (!this.terrainData) return { clearance: Infinity, warning: 'NONE' };
        
        // 检查飞行路径上的地形
        let maxElevation = 0;
        const steps = 10;
        
        for (let i = 0; i <= steps; i++) {
            const distance = (i / steps) * lookaheadDistance;
            // 简化版：检查正前方（应使用实际飞行路径）
            const checkX = aircraftX;
            const checkY = aircraftY + distance;
            
            const elevation = this.getElevationAt(checkX, checkY);
            maxElevation = Math.max(maxElevation, elevation);
        }
        
        const clearance = aircraftAltitude - maxElevation;
        
        // 确定告警等级
        let warning = 'NONE';
        if (clearance < 500) warning = 'PULL UP';
        else if (clearance < 1000) warning = 'TERRAIN';
        else if (clearance < 2000) warning = 'CAUTION';
        
        return { clearance, warning, maxElevation };
    }
}

/**
 * 气象雷达服务 - 用于降水和湍流仿真
 */
class WeatherRadarService {
    constructor() {
        this.weatherCells = [];
        this.turbulenceAreas = [];
        this.radarRange = 80; // 雷达探测范围（海里）
        this.radarTilt = 0; // 雷达倾斜角（度）
        this.lastUpdate = Date.now();
    }
    
    /**
     * 生成逼真的天气模式
     */
    generateWeatherPattern(centerX, centerY, intensity = 'MODERATE') {
        const patterns = {
            'ISOLATED': this.generateIsolatedCells.bind(this),
            'SCATTERED': this.generateScatteredCells.bind(this),
            'BROKEN': this.generateBrokenLayer.bind(this),
            'OVERCAST': this.generateOvercastLayer.bind(this)
        };
        
        const generator = patterns[intensity] || patterns['SCATTERED'];
        this.weatherCells = generator(centerX, centerY);
        this.generateTurbulenceAreas();
        
        this.lastUpdate = Date.now();
    }
    
    /**
     * 生成孤立的天气单元
     */
    generateIsolatedCells(centerX, centerY) {
        const cells = [];
        const cellCount = 3 + Math.floor(Math.random() * 4);
        
        for (let i = 0; i < cellCount; i++) {
            const distance = 10 + Math.random() * 40;
            const bearing = Math.random() * 360;
            const radius = 2 + Math.random() * 8;
            
            const cell = {
                x: centerX + Math.sin(bearing * NAV.DEG_TO_RAD) * distance,
                y: centerY + Math.cos(bearing * NAV.DEG_TO_RAD) * distance,
                radius,
                intensity: this.randomIntensity(),
                top: 25000 + Math.random() * 15000,
                base: 5000 + Math.random() * 10000,
                turbulence: Math.random() > 0.7
            };
            
            cells.push(cell);
        }
        
        return cells;
    }
    
    /**
     * 生成分散的天气单元
     */
    generateScatteredCells(centerX, centerY) {
        const cells = [];
        const cellCount = 6 + Math.floor(Math.random() * 6);
        
        for (let i = 0; i < cellCount; i++) {
            const distance = 5 + Math.random() * 30;
            const bearing = Math.random() * 360;
            const radius = 3 + Math.random() * 12;
            
            const cell = {
                x: centerX + Math.sin(bearing * NAV.DEG_TO_RAD) * distance,
                y: centerY + Math.cos(bearing * NAV.DEG_TO_RAD) * distance,
                radius,
                intensity: this.randomIntensity(),
                top: 30000 + Math.random() * 20000,
                base: 3000 + Math.random() * 8000,
                turbulence: Math.random() > 0.5
            };
            
            cells.push(cell);
        }
        
        return cells;
    }
    
    /**
     * 生成碎云层
     */
    generateBrokenLayer(centerX, centerY) {
        const cells = [];
        const layerRadius = 40;
        
        // 创建较大的连接区域
        for (let i = 0; i < 4; i++) {
            const offsetX = (Math.random() - 0.5) * 30;
            const offsetY = (Math.random() - 0.5) * 30;
            
            const cell = {
                x: centerX + offsetX,
                y: centerY + offsetY,
                radius: layerRadius,
                intensity: 'MODERATE',
                top: 25000,
                base: 8000,
                turbulence: true
            };
            
            cells.push(cell);
        }
        
        return cells;
    }
    
    /**
     * 生成阴天覆盖层
     */
    generateOvercastLayer(centerX, centerY) {
        return [{
            x: centerX,
            y: centerY,
            radius: 60,
            intensity: 'HEAVY',
            top: 35000,
            base: 5000,
            turbulence: true
        }];
    }
    
    /**
     * 生成与天气相关的湍流区域
     */
    generateTurbulenceAreas() {
        this.turbulenceAreas = this.weatherCells
            .filter(cell => cell.turbulence)
            .map(cell => ({
                x: cell.x,
                y: cell.y,
                radius: cell.radius * 1.5,
                intensity: this.randomTurbulenceIntensity()
            }));
    }
    
    /**
     * 随机天气强度
     */
    randomIntensity() {
        const rand = Math.random();
        if (rand < 0.1) return 'EXTREME';
        if (rand < 0.3) return 'HEAVY';
        if (rand < 0.6) return 'MODERATE';
        return 'LIGHT';
    }
    
    /**
     * 随机湍流强度
     */
    randomTurbulenceIntensity() {
        const rand = Math.random();
        if (rand < 0.1) return 'SEVERE';
        if (rand < 0.3) return 'MODERATE';
        return 'LIGHT';
    }
    
    /**
     * 根据强度获取天气颜色
     */
    getWeatherColor(intensity) {
        switch (intensity) {
            case 'EXTREME': return COLORS.WEATHER_EXTREME;
            case 'HEAVY': return COLORS.WEATHER_HEAVY;
            case 'MODERATE': return COLORS.WEATHER_MODERATE;
            case 'LIGHT': return COLORS.WEATHER_LIGHT;
            default: return COLORS.WEATHER_LIGHT;
        }
    }
    
    /**
     * 根据强度获取湍流颜色
     */
    getTurbulenceColor(intensity) {
        switch (intensity) {
            case 'SEVERE': return COLORS.RED;
            case 'MODERATE': return COLORS.AMBER;
            case 'LIGHT': return COLORS.YELLOW;
            default: return COLORS.YELLOW;
        }
    }
    
    /**
     * 模拟雷达波束传播和回波
     */
    simulateRadarReturns(aircraftX, aircraftY, aircraftAltitude, radarTilt = 0) {
        const returns = [];
        const now = Date.now();
        const timeFactor = (now - this.lastUpdate) / 1000;
        
        this.weatherCells.forEach(cell => {
            // 计算到天气单元的距离
            const dx = cell.x - aircraftX;
            const dy = cell.y - aircraftY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // 检查是否在雷达探测范围内
            if (distance > this.radarRange) return;
            
            // 计算波束在天气单元距离处的高度
            const beamElevation = this.calculateBeamElevation(distance, radarTilt, aircraftAltitude);
            
            // 检查波束是否与天气单元相交
            if (beamElevation >= cell.base && beamElevation <= cell.top) {
                // 计算回波强度（随距离衰减）
                const attenuation = Math.max(0.1, 1 - (distance / this.radarRange));
                const returnIntensity = this.calculateReturnIntensity(cell.intensity, attenuation);
                
                returns.push({
                    bearing: Math.atan2(dx, dy) * NAV.RAD_TO_DEG,
                    distance,
                    intensity: returnIntensity,
                    cell
                });
            }
        });
        
        // 添加湍流回波
        this.turbulenceAreas.forEach(area => {
            const dx = area.x - aircraftX;
            const dy = area.y - aircraftY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= area.radius) {
                returns.push({
                    bearing: Math.atan2(dx, dy) * NAV.RAD_TO_DEG,
                    distance,
                    intensity: 'TURBULENCE',
                    turbulenceIntensity: area.intensity
                });
            }
        });
        
        // 动画化天气运动
        this.animateWeather(timeFactor);
        
        return returns;
    }
    
    /**
     * 计算给定距离处的雷达波束高度
     */
    calculateBeamElevation(distance, tilt, aircraftAltitude) {
        // 简化波束几何计算
        const beamSlope = Math.tan(tilt * NAV.DEG_TO_RAD);
        return aircraftAltitude + beamSlope * distance * 6076.12; // 将海里转换为英尺
    }
    
    /**
     * 计算雷达回波强度
     */
    calculateReturnIntensity(baseIntensity, attenuation) {
        // 应用距离衰减和随机变化
        const variation = 0.8 + Math.random() * 0.4;
        const rawIntensity = this.intensityToValue(baseIntensity) * attenuation * variation;
        
        // 转换回强度类别
        if (rawIntensity > 0.7) return 'EXTREME';
        if (rawIntensity > 0.5) return 'HEAVY';
        if (rawIntensity > 0.3) return 'MODERATE';
        return 'LIGHT';
    }
    
    /**
     * 将强度字符串转换为数值
     */
    intensityToValue(intensity) {
        switch (intensity) {
            case 'EXTREME': return 1.0;
            case 'HEAVY': return 0.7;
            case 'MODERATE': return 0.5;
            case 'LIGHT': return 0.3;
            default: return 0.3;
        }
    }
    
    /**
     * 动画化天气运动和演变
     */
    animateWeather(timeFactor) {
        // 随风移动天气单元
        const windSpeed = 20; // 风速（节）
        const windDirection = 270; // 风向（度，西风）
        
        const windDX = Math.sin(windDirection * NAV.DEG_TO_RAD) * windSpeed * timeFactor / 3600;
        const windDY = Math.cos(windDirection * NAV.DEG_TO_RAD) * windSpeed * timeFactor / 3600;
        
        this.weatherCells.forEach(cell => {
            cell.x += windDX;
            cell.y += windDY;
            
            // 随时间演变强度
            if (Math.random() < 0.01 * timeFactor) {
                const intensities = ['LIGHT', 'MODERATE', 'HEAVY', 'EXTREME'];
                const currentIndex = intensities.indexOf(cell.intensity);
                const change = Math.random() > 0.5 ? 1 : -1;
                const newIndex = Math.max(0, Math.min(intensities.length - 1, currentIndex + change));
                cell.intensity = intensities[newIndex];
            }
        });
        
        this.lastUpdate = Date.now();
    }
    
    /**
     * 设置雷达参数
     */
    setRadarParameters(range, tilt, gain = 'NORMAL') {
        this.radarRange = range;
        this.radarTilt = tilt;
        // 增益会影响回波灵敏度
    }
}

// 导出单例实例
export const terrainService = new TerrainService();
export const weatherRadarService = new WeatherRadarService();

// 导出类和实例（用于测试）
export { TerrainService, WeatherRadarService }; // terrainService and weatherRadarService are already exported above as named exports

// 默认导出（方便使用）
export default {
    TerrainService,
    WeatherRadarService
    // terrainService and weatherRadarService are already exported as named exports above
};