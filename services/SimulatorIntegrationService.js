/**
 * 飞行模拟器集成服务
 * 连接 X-Plane、MSFS 或提供模拟数据，用于 A320 ND 显示仿真
 */

import { NAV } from '../constants.js';

/**
 * 模拟器类型
 */
export const SIMULATOR_TYPES = {
    XPLANE: 'XPLANE',
    MSFS: 'MSFS',
    MOCK: 'MOCK',
    EXTERNAL_API: 'EXTERNAL_API'
};

/**
 * 数据更新速率（Hz）
 */
export const UPDATE_RATES = {
    HIGH: 30,   // 30Hz 关键飞行数据
    MEDIUM: 10, // 10Hz 导航数据
    LOW: 2      // 2Hz 天气/地形数据
};

/**
 * 飞行数据结构
 */
export class FlightData {
    constructor() {
        // 位置与姿态
        this.latitude = 0;
        this.longitude = 0;
        this.altitude = 0;          // 英尺 MSL（平均海平面）
        this.heading = 0;           // 真航向（度）
        this.pitch = 0;             // 俯仰角（度）
        this.bank = 0;              // 坡度（度）
        this.yaw = 0;               // 偏航角（度）
        
        // 速度
        this.indicatedAirspeed = 0; // 指示空速（节）
        this.trueAirspeed = 0;      // 真空速（节）
        this.groundSpeed = 0;       // 地速（节）
        this.mach = 0;              // 马赫数
        this.verticalSpeed = 0;     // 垂直速度（英尺/分钟）
        
        // 导航
        this.course = 0;            // 航向（真角度）
        this.track = 0;             // 航迹（真角度）
        this.driftAngle = 0;        // 偏流角（度）
        this.windDirection = 0;     // 风向（真角度）
        this.windSpeed = 0;         // 风速（节）
        
        // 系统状态
        this.autopilotEngaged = false;
        this.fdEngaged = false;
        this.autothrottleEngaged = false;
        this.flightPhase = 'CRUISE'; // 起飞、爬升、巡航、下降、进近、着陆
        
        // 时间
        this.timestamp = Date.now();
        this.simTime = 0;
        this.zuluTime = 0; // 世界协调时（UTC）
        
        // ND 显示用派生坐标值
        this.x = 0; // 距参考点的 X 方向距离（海里）
        this.y = 0; // 距参考点的 Y 方向距离（海里）
    }
    
    /**
     * 将经纬度转换为相对于参考点的海里坐标
     */
    calculateNMCoordinates(referenceLat, referenceLon) {
        // 大圆距离计算
        const lat1 = referenceLat * NAV.DEG_TO_RAD;
        const lon1 = referenceLon * NAV.DEG_TO_RAD;
        const lat2 = this.latitude * NAV.DEG_TO_RAD;
        const lon2 = this.longitude * NAV.DEG_TO_RAD;
        
        const dLon = lon2 - lon1;
        const dLat = lat2 - lat1;
        
        // 哈弗辛公式（Haversine）
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                 Math.cos(lat1) * Math.cos(lat2) *
                 Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = NAV.EARTH_RADIUS_NM * c;
        
        // 方位角
        const y = Math.sin(dLon) * Math.cos(lat2);
        const x = Math.cos(lat1) * Math.sin(lat2) -
                 Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
        const bearing = Math.atan2(y, x) * NAV.RAD_TO_DEG;
        
        // 转换为笛卡尔坐标（海里）
        this.x = Math.sin(bearing * NAV.DEG_TO_RAD) * distance;
        this.y = Math.cos(bearing * NAV.DEG_TO_RAD) * distance;
        
        return { x: this.x, y: this.y, distance, bearing };
    }
    
    /**
     * 从模拟器数据更新
     */
    updateFromSimulator(data) {
        Object.assign(this, data);
        this.timestamp = Date.now();
    }
    
    /**
     * 生成用于测试的模拟数据
     */
    generateMockData(referenceLat = 49.0097, referenceLon = 2.5479) {
        const time = Date.now() / 1000;
        
        // 模拟从巴黎戴高乐机场（CDG）起飞的飞行
        this.latitude = referenceLat + Math.sin(time * 0.01) * 0.5;
        this.longitude = referenceLon + Math.cos(time * 0.01) * 0.5;
        this.altitude = 35000 + Math.sin(time * 0.1) * 1000;
        this.heading = (time * 2) % 360;
        this.pitch = Math.sin(time * 0.5) * 5;
        this.bank = Math.cos(time * 0.3) * 10;
        
        this.indicatedAirspeed = 280;
        this.trueAirspeed = 480;
        this.groundSpeed = 475;
        this.mach = 0.78;
        this.verticalSpeed = Math.sin(time * 0.2) * 500;
        
        this.course = this.heading;
        this.track = this.heading + Math.sin(time * 0.1) * 5;
        this.driftAngle = this.track - this.heading;
        this.windDirection = 270;
        this.windSpeed = 50;
        
        this.autopilotEngaged = true;
        this.fdEngaged = true;
        this.autothrottleEngaged = true;
        this.flightPhase = 'CRUISE';
        
        this.timestamp = Date.now();
        this.simTime = time;
        this.zuluTime = Math.floor(time) % 86400;
        
        // 计算海里坐标
        this.calculateNMCoordinates(referenceLat, referenceLon);
        
        return this;
    }
}

/**
 * X-Plane DataRef 集成
 */
class XPlaneIntegration {
    constructor() {
        this.connected = false;
        this.socket = null;
        this.dataRefs = new Map();
        this.updateRate = UPDATE_RATES.HIGH;
    }
    
    /**
     * 通过 UDP 连接 X-Plane
     */
    async connect(host = '127.0.0.1', port = 49000) {
        try {
            // 在实际实现中，这将使用 WebSocket 或 UDP
            console.log(`Connecting to X-Plane at ${host}:${port}`);
            
            // 模拟连接
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.connected = true;
            
            // 订阅数据引用
            this.subscribeToDataRefs();
            
            return true;
        } catch (error) {
            console.error('Failed to connect to X-Plane:', error);
            return false;
        }
    }
    
    /**
     * 订阅所需的数据引用
     */
    subscribeToDataRefs() {
        // ND 显示所需的 X-Plane 数据引用
        const essentialRefs = [
            'sim/flightmodel/position/latitude',
            'sim/flightmodel/position/longitude',
            'sim/flightmodel/position/elevation',
            'sim/flightmodel/position/true_psi',
            'sim/flightmodel/position/true_theta',
            'sim/flightmodel/position/true_phi',
            'sim/flightmodel/position/indicated_airspeed',
            'sim/flightmodel/position/true_airspeed',
            'sim/flightmodel/position/groundspeed',
            'sim/flightmodel/position/vh_ind',
            'sim/weather/wind_direction_degt',
            'sim/weather/wind_speed_kt'
        ];
        
        essentialRefs.forEach(ref => {
            this.dataRefs.set(ref, 0);
        });
    }
    
    /**
     * 从 X-Plane 获取飞行数据
     */
    async getFlightData() {
        if (!this.connected) {
            throw new Error('Not connected to X-Plane');
        }
        
        // 在实际实现中，这将从 socket 读取
        const flightData = new FlightData();
        
        // 模拟来自 X-Plane 的数据
        flightData.latitude = 49.0097 + (Math.random() - 0.5) * 0.01;
        flightData.longitude = 2.5479 + (Math.random() - 0.5) * 0.01;
        flightData.altitude = 35000 + (Math.random() - 0.5) * 100;
        flightData.heading = (Date.now() / 100) % 360;
        flightData.indicatedAirspeed = 280 + (Math.random() - 0.5) * 10;
        flightData.groundSpeed = 475 + (Math.random() - 0.5) * 20;
        flightData.verticalSpeed = (Math.random() - 0.5) * 500;
        flightData.windDirection = 270;
        flightData.windSpeed = 50;
        
        flightData.calculateNMCoordinates(49.0097, 2.5479);
        
        return flightData;
    }
    
    /**
     * 断开与 X-Plane 的连接
     */
    disconnect() {
        this.connected = false;
        if (this.socket) {
            // 在实际实现中关闭 socket
            this.socket = null;
        }
    }
}

/**
 * Microsoft Flight Simulator 集成
 */
class MSFSIntegration {
    constructor() {
        this.connected = false;
        this.simConnect = null;
        this.updateRate = UPDATE_RATES.HIGH;
    }
    
    /**
     * 通过 SimConnect 连接 MSFS
     */
    async connect() {
        try {
            // 在实际实现中，这将使用 SimConnect JS
            console.log('Connecting to MSFS via SimConnect');
            
            // 模拟连接
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.connected = true;
            
            return true;
        } catch (error) {
            console.error('Failed to connect to MSFS:', error);
            return false;
        }
    }
    
    /**
     * 从 MSFS 获取飞行数据
     */
    async getFlightData() {
        if (!this.connected) {
            throw new Error('Not connected to MSFS');
        }
        
        const flightData = new FlightData();
        
        // 模拟来自 MSFS 的数据
        const time = Date.now() / 1000;
        flightData.latitude = 49.0097 + Math.sin(time * 0.005) * 0.5;
        flightData.longitude = 2.5479 + Math.cos(time * 0.005) * 0.5;
        flightData.altitude = 35000 + Math.sin(time * 0.05) * 500;
        flightData.heading = (time * 1.5) % 360;
        flightData.indicatedAirspeed = 280;
        flightData.groundSpeed = 475;
        flightData.verticalSpeed = Math.sin(time * 0.2) * 800;
        flightData.windDirection = 270;
        flightData.windSpeed = 45 + Math.sin(time * 0.1) * 10;
        
        flightData.calculateNMCoordinates(49.0097, 2.5479);
        
        return flightData;
    }
    
    disconnect() {
        this.connected = false;
    }
}

/**
 * 外部 API 集成（用于基于网页的模拟器）
 */
class ExternalAPIIntegration {
    constructor(apiUrl) {
        this.apiUrl = apiUrl;
        this.connected = false;
        this.updateRate = UPDATE_RATES.MEDIUM;
    }
    
    async connect() {
        try {
            // 测试连接
            const response = await fetch(`${this.apiUrl}/status`);
            if (response.ok) {
                this.connected = true;
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to connect to external API:', error);
            return false;
        }
    }
    
    async getFlightData() {
        if (!this.connected) {
            throw new Error('Not connected to external API');
        }
        
        try {
            const response = await fetch(`${this.apiUrl}/flightdata`);
            const data = await response.json();
            
            const flightData = new FlightData();
            flightData.updateFromSimulator(data);
            
            // 如果提供了经纬度，计算海里坐标
            if (data.latitude && data.longitude) {
                flightData.calculateNMCoordinates(data.latitude, data.longitude);
            }
            
            return flightData;
        } catch (error) {
            console.error('Failed to get flight data:', error);
            throw error;
        }
    }
    
    disconnect() {
        this.connected = false;
    }
}

/**
 * 主模拟器集成服务
 */
class SimulatorIntegrationService {
    constructor() {
        this.simulatorType = SIMULATOR_TYPES.MOCK;
        this.integration = null;
        this.flightData = new FlightData();
        this.updateInterval = null;
        this.updateRate = UPDATE_RATES.MEDIUM;
        this.listeners = new Set();
        this.referenceLat = 49.0097; // 巴黎戴高乐机场（CDG）纬度
        this.referenceLon = 2.5479;  // 巴黎戴高乐机场（CDG）经度
    }
    
    /**
     * 初始化模拟器连接
     */
    async initialize(simulatorType = SIMULATOR_TYPES.MOCK, options = {}) {
        this.simulatorType = simulatorType;
        
        switch (simulatorType) {
            case SIMULATOR_TYPES.XPLANE:
                this.integration = new XPlaneIntegration();
                this.updateRate = UPDATE_RATES.HIGH;
                break;
                
            case SIMULATOR_TYPES.MSFS:
                this.integration = new MSFSIntegration();
                this.updateRate = UPDATE_RATES.HIGH;
                break;
                
            case SIMULATOR_TYPES.EXTERNAL_API:
                this.integration = new ExternalAPIIntegration(options.apiUrl);
                this.updateRate = UPDATE_RATES.MEDIUM;
                break;
                
            case SIMULATOR_TYPES.MOCK:
            default:
                this.integration = null;
                this.updateRate = UPDATE_RATES.MEDIUM;
                break;
        }
        
        if (this.integration) {
            const connected = await this.integration.connect();
            if (!connected) {
                console.warn('连接模拟器失败，回退到模拟数据模式');
                this.simulatorType = SIMULATOR_TYPES.MOCK;
            }
        }
        
        // 开始数据更新
        this.startUpdates();
        
        return this.simulatorType;
    }
    
    /**
     * 启动周期性数据更新
     */
    startUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        const interval = 1000 / this.updateRate;
        this.updateInterval = setInterval(() => {
            this.updateFlightData();
        }, interval);
    }
    
    /**
     * 从模拟器更新飞行数据
     */
    async updateFlightData() {
        try {
            let newData;
            
            if (this.simulatorType === SIMULATOR_TYPES.MOCK || !this.integration) {
                // 生成模拟数据
                newData = this.flightData.generateMockData(this.referenceLat, this.referenceLon);
            } else {
                // 从模拟器获取数据
                newData = await this.integration.getFlightData();
            }
            
            // 更新飞行数据
            this.flightData = newData;
            
            // 通知监听器
            this.notifyListeners(newData);
            
        } catch (error) {
            console.error('Failed to update flight data:', error);
            
            // 回退到模拟数据
            this.flightData.generateMockData(this.referenceLat, this.referenceLon);
            this.notifyListeners(this.flightData);
        }
    }
    
    /**
     * 获取当前飞行数据
     */
    getFlightData() {
        return this.flightData;
    }
    
    /**
     * 获取格式化后的 ND 显示数据
     */
    getNDDisplayData() {
        const data = this.flightData;
        
        return {
            // 位置
            x: data.x,
            y: data.y,
            
            // 姿态
            heading: data.heading,
            pitch: data.pitch,
            bank: data.bank,
            
            // 速度和高度
            altitude: data.altitude,
            speed: data.groundSpeed,
            verticalSpeed: data.verticalSpeed,
            
            // 导航
            track: data.track,
            windDirection: data.windDirection,
            windSpeed: data.windSpeed,
            
            // 系统
            autopilotEngaged: data.autopilotEngaged,
            flightPhase: data.flightPhase,
            
            // 时间戳
            timestamp: data.timestamp
        };
    }
    
    /**
     * 添加数据更新监听器
     */
    addListener(listener) {
        this.listeners.add(listener);
    }
    
    /**
     * 移除数据更新监听器
     */
    removeListener(listener) {
        this.listeners.delete(listener);
    }
    
    /**
     * 通知所有监听器数据已更新
     */
    notifyListeners(data) {
        this.listeners.forEach(listener => {
            try {
                listener(data);
            } catch (error) {
                console.error('Error in data listener:', error);
            }
        });
    }
    
    /**
     * 设置海里坐标的参考点
     */
    setReferencePoint(lat, lon) {
        this.referenceLat = lat;
        this.referenceLon = lon;
    }
    
    /**
     * 获取服务状态
     */
    getStatus() {
        return {
            simulatorType: this.simulatorType,
            connected: this.simulatorType !== SIMULATOR_TYPES.MOCK && 
                      this.integration?.connected !== false,
            updateRate: this.updateRate,
            lastUpdate: this.flightData.timestamp,
            dataAge: Date.now() - this.flightData.timestamp
        };
    }
    
    /**
     * 停止更新并清理资源
     */
    stop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        
        if (this.integration) {
            this.integration.disconnect();
            this.integration = null;
        }
        
        this.listeners.clear();
    }
}

// 导出单例实例
export const simulatorService = new SimulatorIntegrationService();

// 导出类和常量（用于测试）
export {
    SimulatorIntegrationService,
    XPlaneIntegration,
    MSFSIntegration,
    ExternalAPIIntegration
    // simulatorService is already exported above as named export
    // FlightData is already exported as class at line 30
    // SIMULATOR_TYPES is already exported at line 11-14
    // UPDATE_RATES is already exported at line 21-25
};

// 默认导出（方便使用）
export default {
    SimulatorIntegrationService
    // simulatorService is already exported as named export above
    // FlightData is already exported as named export at line 30
    // SIMULATOR_TYPES is already exported as named export
    // UPDATE_RATES is already exported as named export
};