/**
 * TCAS（交通防撞系统）服务
 * 面向 A320 ND 显示的专业级 TCAS II 仿真
 * 实现决断咨询（RA）、交通咨询（TA）和邻近交通显示
 */

import { COLORS, NAV } from '../constants.js';

/**
 * TCAS 威胁等级
 */
export const TCAS_THREAT_LEVELS = {
    RA: 'RA',           // 决断咨询（最高威胁等级）
    TA: 'TA',           // 交通咨询
    PROXIMATE: 'PROXIMATE', // 邻近交通
    OTHER: 'OTHER'      // 其他交通
};

/**
 * TCAS 决断咨询类型
 */
export const RA_TYPES = {
    CLIMB: 'CLIMB',
    DESCEND: 'DESCEND',
    INCREASE_CLIMB: 'INCREASE_CLIMB',
    INCREASE_DESCEND: 'INCREASE_DESCEND',
    REDUCE_CLIMB: 'REDUCE_CLIMB',
    REDUCE_DESCEND: 'REDUCE_DESCEND',
    CROSSING_CLIMB: 'CROSSING_CLIMB',
    CROSSING_DESCEND: 'CROSSING_DESCEND',
    MAINTAIN_VERTICAL_SPEED: 'MAINTAIN_VERTICAL_SPEED',
    AVOID: 'AVOID'
};

/**
 * TCAS 显示的飞机类型
 */
export const AIRCRAFT_TYPES = {
    HEAVY: 'HEAVY',     // 重型机（B747、A380 等）
    LARGE: 'LARGE',     // 大型机（B737、A320 等）
    SMALL: 'SMALL',     // 小型机（CRJ、E-Jet 等）
    HELICOPTER: 'HELICOPTER' // 直升机
};

/**
 * TCAS 交通目标对象
 */
class TCASTraffic {
    constructor(id, callsign, type = AIRCRAFT_TYPES.LARGE) {
        this.id = id;
        this.callsign = callsign;
        this.type = type;
        
        // 位置与运动
        this.lat = 0;
        this.lon = 0;
        this.altitude = 0;
        this.heading = 0;
        this.speed = 0;
        this.verticalSpeed = 0;
        
        // 相对于本机的数据
        this.bearing = 0;
        this.distance = 0;
        this.relativeAlt = 0;
        
        // TCAS 状态
        this.threatLevel = TCAS_THREAT_LEVELS.OTHER;
        this.raType = null;
        this.raSense = null; // UP（上升）或 DOWN（下降）
        this.timeToClosestApproach = Infinity;
        this.separation = Infinity;
        
        // 显示属性
        this.lastUpdate = Date.now();
        this.isValid = true;
    }
    
    /**
     * 更新交通目标位置并计算威胁等级
     */
    update(ownship, trafficData) {
        this.lat = trafficData.lat || this.lat;
        this.lon = trafficData.lon || this.lon;
        this.altitude = trafficData.altitude || this.altitude;
        this.heading = trafficData.heading || this.heading;
        this.speed = trafficData.speed || this.speed;
        this.verticalSpeed = trafficData.verticalSpeed || this.verticalSpeed;
        
        // 计算相对位置
        this.calculateRelativePosition(ownship);
        
        // 计算威胁等级
        this.calculateThreatLevel(ownship);
        
        this.lastUpdate = Date.now();
    }
    
    /**
     * 计算相对于本机的位置
     */
    calculateRelativePosition(ownship) {
        // 简化计算（用于演示）
        // 在实际实现中，应使用大圆距离和方位角
        
        const dx = this.lon - ownship.lon;
        const dy = this.lat - ownship.lat;
        
        // 转换为海里（近似值）
        const nmPerDegree = 60; // 近似值
        this.distance = Math.sqrt(dx * dx + dy * dy) * nmPerDegree;
        
        // 计算方位角（0 = 北，90 = 东）
        this.bearing = (Math.atan2(dx, dy) * NAV.RAD_TO_DEG + 360) % 360;
        
        // 相对高度
        this.relativeAlt = this.altitude - ownship.altitude;
    }
    
    /**
     * 基于间隔计算 TCAS 威胁等级
     */
    calculateThreatLevel(ownship) {
        // TCAS II 阈值（简化版）
        const TA_THRESHOLD = 6; // 交通咨询距离阈值（海里）
        const RA_THRESHOLD = 3; // 决断咨询距离阈值（海里）
        const ALT_THRESHOLD_TA = 1200; // 交通咨询高度差阈值（英尺）
        const ALT_THRESHOLD_RA = 700; // 决断咨询高度差阈值（英尺）
        
        const horizontalSeparation = this.distance;
        const verticalSeparation = Math.abs(this.relativeAlt);
        
        // 计算最接近点时间（简化版）
        const relativeSpeed = Math.abs(this.speed - ownship.speed);
        this.timeToClosestApproach = relativeSpeed > 0 ? horizontalSeparation / relativeSpeed : Infinity;
        
        // 确定威胁等级
        if (horizontalSeparation <= RA_THRESHOLD && verticalSeparation <= ALT_THRESHOLD_RA) {
            this.threatLevel = TCAS_THREAT_LEVELS.RA;
            this.determineRA(ownship);
        } else if (horizontalSeparation <= TA_THRESHOLD && verticalSeparation <= ALT_THRESHOLD_TA) {
            this.threatLevel = TCAS_THREAT_LEVELS.TA;
            this.raType = null;
        } else if (horizontalSeparation <= 12 && verticalSeparation <= 2400) {
            this.threatLevel = TCAS_THREAT_LEVELS.PROXIMATE;
            this.raType = null;
        } else {
            this.threatLevel = TCAS_THREAT_LEVELS.OTHER;
            this.raType = null;
        }
        
        this.separation = Math.sqrt(
            Math.pow(horizontalSeparation, 2) + 
            Math.pow(verticalSeparation / 6076.12, 2) // 将英尺转换为海里
        );
    }
    
    /**
     * 确定决断咨询类型
     */
    determineRA(ownship) {
        // 简化版 RA 逻辑
        const verticalClosure = this.relativeAlt / this.timeToClosestApproach; // 英尺/分钟
        
        if (this.relativeAlt > 0) {
            // 目标在本机上方
            if (verticalClosure > 1000) {
                // 从上方快速接近
                this.raType = RA_TYPES.DESCEND;
                this.raSense = 'DOWN';
            } else if (verticalClosure > 500) {
                this.raType = RA_TYPES.INCREASE_DESCEND;
                this.raSense = 'DOWN';
            } else {
                this.raType = RA_TYPES.MAINTAIN_VERTICAL_SPEED;
            }
        } else {
            // 目标在本机下方
            if (verticalClosure < -1000) {
                // 从下方快速接近
                this.raType = RA_TYPES.CLIMB;
                this.raSense = 'UP';
            } else if (verticalClosure < -500) {
                this.raType = RA_TYPES.INCREASE_CLIMB;
                this.raSense = 'UP';
            } else {
                this.raType = RA_TYPES.MAINTAIN_VERTICAL_SPEED;
            }
        }
    }
    
    /**
     * 根据威胁等级获取显示颜色
     */
    getDisplayColor() {
        switch (this.threatLevel) {
            case TCAS_THREAT_LEVELS.RA:
                return COLORS.TCAS_RA;
            case TCAS_THREAT_LEVELS.TA:
                return COLORS.TCAS_TA;
            case TCAS_THREAT_LEVELS.PROXIMATE:
                return COLORS.TCAS_PROXIMATE;
            default:
                return COLORS.TEXT_GREY;
        }
    }
    
    /**
     * 根据飞机类型获取符号大小
     */
    getSymbolSize() {
        switch (this.type) {
            case AIRCRAFT_TYPES.HEAVY:
                return 8;
            case AIRCRAFT_TYPES.LARGE:
                return 6;
            case AIRCRAFT_TYPES.SMALL:
                return 4;
            case AIRCRAFT_TYPES.HELICOPTER:
                return 3;
            default:
                return 5;
        }
    }
    
    /**
     * 检查交通数据是否过期
     */
    isStale(timeout = 5000) {
        return Date.now() - this.lastUpdate > timeout;
    }
}

/**
 * 主 TCAS 服务
 */
class TCASService {
    constructor() {
        this.traffic = new Map();
        this.ownship = null;
        this.mode = 'TA/RA'; // TA/RA（完全模式）、TA ONLY（仅TA）或 OFF（关闭）
        this.altitudeReporting = true;
        this.displayRange = 40; // 显示范围（海里）
        this.lastRA = null;
        this.raActive = false;
        this.raAcknowledged = false;
        
        // 性能监控
        this.updateInterval = 1000; // 更新间隔（毫秒）
        this.updateTimer = null;
    }
    
    /**
     * 使用本机数据初始化 TCAS
     */
    initialize(ownshipData) {
        this.ownship = {
            lat: ownshipData.lat || 0,
            lon: ownshipData.lon || 0,
            altitude: ownshipData.altitude || 0,
            heading: ownshipData.heading || 0,
            speed: ownshipData.speed || 0,
            verticalSpeed: ownshipData.verticalSpeed || 0
        };
        
        this.startUpdates();
    }
    
    /**
     * 启动周期性 TCAS 更新
     */
    startUpdates() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
        }
        
        this.updateTimer = setInterval(() => {
            this.updateAllTraffic();
            this.cleanupStaleTraffic();
        }, this.updateInterval);
    }
    
    /**
     * 停止 TCAS 更新
     */
    stopUpdates() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
            this.updateTimer = null;
        }
    }
    
    /**
     * 添加或更新交通目标
     */
    updateTraffic(trafficData) {
        const id = trafficData.id || `traffic-${Date.now()}-${Math.random()}`;
        
        if (!this.traffic.has(id)) {
            const traffic = new TCASTraffic(
                id,
                trafficData.callsign || `N${Math.floor(Math.random() * 1000)}`,
                trafficData.type || AIRCRAFT_TYPES.LARGE
            );
            this.traffic.set(id, traffic);
        }
        
        const traffic = this.traffic.get(id);
        traffic.update(this.ownship, trafficData);
        
        // 检查是否触发决断咨询
        if (traffic.threatLevel === TCAS_THREAT_LEVELS.RA) {
            this.activateRA(traffic);
        }
        
        return traffic;
    }
    
    /**
     * 更新所有交通目标位置
     */
    updateAllTraffic() {
        if (!this.ownship) return;
        
        // 在实际实现中，这将从 ADS-B 或模拟器获取数据
        // 演示模式下，模拟一些运动
        this.traffic.forEach(traffic => {
            // 模拟运动
            const movement = {
                lat: traffic.lat + (Math.random() - 0.5) * 0.01,
                lon: traffic.lon + (Math.random() - 0.5) * 0.01,
                altitude: traffic.altitude + (traffic.verticalSpeed / 60), // 英尺/秒
                heading: traffic.heading,
                speed: traffic.speed,
                verticalSpeed: traffic.verticalSpeed
            };
            
            traffic.update(this.ownship, movement);
        });
    }
    
    /**
     * 移除过期的交通目标
     */
    cleanupStaleTraffic() {
        const staleIds = [];
        
        this.traffic.forEach((traffic, id) => {
            if (traffic.isStale()) {
                staleIds.push(id);
            }
        });
        
        staleIds.forEach(id => {
            this.traffic.delete(id);
        });
    }
    
    /**
     * 激活决断咨询
     */
    activateRA(traffic) {
        this.raActive = true;
        this.lastRA = {
            trafficId: traffic.id,
            callsign: traffic.callsign,
            raType: traffic.raType,
            raSense: traffic.raSense,
            relativeAlt: traffic.relativeAlt,
            distance: traffic.distance,
            time: Date.now()
        };
        
        this.raAcknowledged = false;
        
        // 在实际 TCAS 中，这将触发语音告警
        console.log(`TCAS RA: ${traffic.raType} - Traffic: ${traffic.callsign}`);
    }
    
    /**
     * 确认当前决断咨询
     */
    acknowledgeRA() {
        this.raAcknowledged = true;
        
        // RA 保持激活状态直到冲突解除
        setTimeout(() => {
            if (this.raActive) {
                this.checkRAResolution();
            }
        }, 5000);
    }
    
    /**
     * 检查 RA 冲突是否已解除
     */
    checkRAResolution() {
        if (!this.lastRA || !this.raActive) return;
        
        const traffic = this.traffic.get(this.lastRA.trafficId);
        if (!traffic || traffic.threatLevel !== TCAS_THREAT_LEVELS.RA) {
            this.raActive = false;
            this.lastRA = null;
            console.log('TCAS RA: Conflict resolved');
        }
    }
    
    /**
     * 获取范围内用于显示的交通目标
     */
    getDisplayTraffic() {
        const displayTraffic = [];
        
        this.traffic.forEach(traffic => {
            if (traffic.distance <= this.displayRange && traffic.isValid) {
                displayTraffic.push({
                    id: traffic.id,
                    callsign: traffic.callsign,
                    bearing: traffic.bearing,
                    distance: traffic.distance,
                    relativeAlt: traffic.relativeAlt,
                    verticalSpeed: traffic.verticalSpeed,
                    threatLevel: traffic.threatLevel,
                    type: traffic.type,
                    raType: traffic.raType,
                    color: traffic.getDisplayColor(),
                    size: traffic.getSymbolSize()
                });
            }
        });
        
        // 按威胁等级排序（RA 优先，然后是 TA，最后是其他）
        displayTraffic.sort((a, b) => {
            const threatOrder = {
                [TCAS_THREAT_LEVELS.RA]: 0,
                [TCAS_THREAT_LEVELS.TA]: 1,
                [TCAS_THREAT_LEVELS.PROXIMATE]: 2,
                [TCAS_THREAT_LEVELS.OTHER]: 3
            };
            
            return threatOrder[a.threatLevel] - threatOrder[b.threatLevel];
        });
        
        return displayTraffic;
    }
    
    /**
     * 获取当前决断咨询信息
     */
    getCurrentRA() {
        if (!this.raActive) return null;
        
        return {
            ...this.lastRA,
            acknowledged: this.raAcknowledged,
            active: this.raActive
        };
    }
    
    /**
     * 生成用于演示的测试交通目标
     */
    generateTestTraffic(count = 8) {
        const testCallsigns = [
            'BAW123', 'AFR456', 'UAL789', 'DLH234',
            'KLM567', 'SWA890', 'AAL123', 'JAL456'
        ];
        
        const testTypes = [
            AIRCRAFT_TYPES.HEAVY,
            AIRCRAFT_TYPES.LARGE,
            AIRCRAFT_TYPES.LARGE,
            AIRCRAFT_TYPES.SMALL,
            AIRCRAFT_TYPES.LARGE,
            AIRCRAFT_TYPES.SMALL,
            AIRCRAFT_TYPES.LARGE,
            AIRCRAFT_TYPES.HEAVY
        ];
        
        for (let i = 0; i < Math.min(count, testCallsigns.length); i++) {
            const bearing = (i * 45) % 360;
            const distance = 5 + (i * 3);
            const relativeAlt = (i % 3 - 1) * 1000; // -1000, 0, or 1000
            
            this.updateTraffic({
                id: `test-${i}`,
                callsign: testCallsigns[i],
                type: testTypes[i],
                lat: this.ownship.lat + Math.sin(bearing * NAV.DEG_TO_RAD) * distance / 60,
                lon: this.ownship.lon + Math.cos(bearing * NAV.DEG_TO_RAD) * distance / 60,
                altitude: this.ownship.altitude + relativeAlt,
                heading: (bearing + 180) % 360,
                speed: 450 + Math.random() * 100,
                verticalSpeed: (Math.random() - 0.5) * 2000
            });
        }
    }
    
    /**
     * 设置 TCAS 模式
     */
    setMode(mode) {
        const validModes = ['TA/RA', 'TA ONLY', 'OFF'];
        if (validModes.includes(mode)) {
            this.mode = mode;
            
            if (mode === 'OFF') {
                this.stopUpdates();
            } else {
                this.startUpdates();
            }
        }
    }
    
    /**
     * 设置显示范围
     */
    setDisplayRange(range) {
        this.displayRange = range;
    }
    
    /**
     * 获取 TCAS 状态
     */
    getStatus() {
        return {
            mode: this.mode,
            altitudeReporting: this.altitudeReporting,
            displayRange: this.displayRange,
            trafficCount: this.traffic.size,
            raActive: this.raActive,
            raAcknowledged: this.raAcknowledged
        };
    }
}

// 导出单例实例
export const tcasService = new TCASService();

// 导出类和常量（用于测试）
export { TCASService, TCASTraffic }; // tcasService is already exported above as named export, TCAS_THREAT_LEVELS is already exported at line 12, RA_TYPES is already exported at line 22, AIRCRAFT_TYPES is already exported at line 38

// 默认导出（方便使用）
export default {
    TCASService,
    TCASTraffic
    // tcasService is already exported as named export above
    // TCAS_THREAT_LEVELS is already exported as named export at line 12
    // RA_TYPES is already exported as named export at line 22
    // AIRCRAFT_TYPES is already exported as named export at line 38
};

//