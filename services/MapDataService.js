/**
 * 地图数据服务
 * 负责加载、解析和管理自定义地图文件
 */

class MapDataService {
    constructor() {
        this.currentMap = null;
        this.listeners = new Set();
    }

    /**
     * 从URL加载地图文件
     * @param {string} url - 地图JSON文件的URL
     * @returns {Promise<Object>} 解析后的地图数据
     */
    async loadMapFromUrl(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const mapData = await response.json();
            return this.validateAndNormalizeMapData(mapData);
        } catch (error) {
            console.error('加载地图文件失败:', error);
            throw error;
        }
    }

    /**
     * 从本地文件加载地图
     * @param {File} file - 用户选择的文件对象
     * @returns {Promise<Object>} 解析后的地图数据
     */
    async loadMapFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const mapData = JSON.parse(event.target.result);
                    const normalized = this.validateAndNormalizeMapData(mapData);
                    resolve(normalized);
                } catch (error) {
                    reject(new Error(`解析地图文件失败: ${error.message}`));
                }
            };
            reader.onerror = () => reject(new Error('读取文件失败'));
            reader.readAsText(file);
        });
    }

    /**
     * 验证并规范化地图数据
     * @param {Object} rawData - 原始地图数据
     * @returns {Object} 规范化后的地图数据
     */
    validateAndNormalizeMapData(rawData) {
        // 基本结构验证
        if (!rawData.metadata || !rawData.metadata.name) {
            throw new Error('地图文件缺少必要的元数据');
        }

        const normalized = {
            metadata: {
                name: rawData.metadata.name || '未命名地图',
                version: rawData.metadata.version || '1.0.0',
                description: rawData.metadata.description || '',
                author: rawData.metadata.author || '未知',
                created: rawData.metadata.created || new Date().toISOString().split('T')[0],
                coordinateSystem: rawData.metadata.coordinateSystem || 'NM',
                bounds: rawData.metadata.bounds || { minX: -500, maxX: 500, minY: -500, maxY: 500 }
            },
            waypoints: this.normalizeWaypoints(rawData.waypoints || []),
            navaids: this.normalizeNavaids(rawData.navaids || []),
            airways: rawData.airways || [],
            terrain: rawData.terrain || [],
            defaultRoutes: rawData.defaultRoutes || []
        };

        // 设置当前地图
        this.currentMap = normalized;
        this.notifyListeners();
        return normalized;
    }

    /**
     * 规范化航路点数据
     */
    normalizeWaypoints(waypoints) {
        return waypoints.map(wp => ({
            id: wp.id || `wp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: wp.name || 'UNKNOWN',
            type: wp.type || 'FIX',
            x: Number(wp.x) || 0,
            y: Number(wp.y) || 0,
            elevation: wp.elevation !== undefined ? Number(wp.elevation) : null,
            frequency: wp.frequency || null,
            runways: wp.runways || [],
            altConstraint: wp.altConstraint || null,
            navaidType: this.mapTypeToNavaidType(wp.type)
        }));
    }

    /**
     * 规范化导航设施数据
     */
    normalizeNavaids(navaids) {
        return navaids.map(nav => ({
            id: nav.id || `nav-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: nav.name || 'UNKNOWN',
            type: nav.type || 'VOR',
            x: Number(nav.x) || 0,
            y: Number(nav.y) || 0,
            frequency: nav.frequency || '',
            range: Number(nav.range) || 100,
            navaidType: this.mapTypeToNavaidType(nav.type)
        }));
    }

    /**
     * 将地图类型映射到ND显示类型
     */
    mapTypeToNavaidType(type) {
        const typeMap = {
            'VOR': 'VOR',
            'NDB': 'NDB',
            'AIRPORT': 'FIX',
            'FIX': 'FIX',
            'WAYPOINT': 'FIX'
        };
        return typeMap[type] || 'FIX';
    }

    /**
     * 获取当前地图
     */
    getCurrentMap() {
        return this.currentMap;
    }

    /**
     * 从地图数据提取航路
     * @param {string} routeId - 默认航路的ID
     * @returns {Object|null} 航路对象
     */
    extractRouteFromMap(routeId) {
        if (!this.currentMap) return null;

        const routeDef = this.currentMap.defaultRoutes.find(r => r.id === routeId);
        if (!routeDef) return null;

        const waypoints = [];
        const allPoints = [...this.currentMap.waypoints, ...this.currentMap.navaids];

        routeDef.waypointIds.forEach(wpId => {
            const point = allPoints.find(p => p.id === wpId);
            if (point) {
                waypoints.push({
                    ...point,
                    status: waypoints.length === 0 ? 'active' : 'direct'
                });
            }
        });

        return {
            id: routeDef.id,
            name: routeDef.name,
            description: routeDef.description,
            waypoints,
            isActive: false,
            isSecondary: false,
            source: 'map'
        };
    }

    /**
     * 提取所有默认航路
     */
    extractAllRoutesFromMap() {
        if (!this.currentMap) return [];
        return this.currentMap.defaultRoutes.map(routeDef => 
            this.extractRouteFromMap(routeDef.id)
        ).filter(Boolean);
    }

    /**
     * 导出当前航路数据
     * @param {Array} routes - 航路数组
     * @returns {Object} 可导出的JSON数据
     */
    exportRoutes(routes) {
        return {
            metadata: {
                exported: new Date().toISOString(),
                source: 'A320 ND Simulator',
                version: '1.0.0'
            },
            routes: routes.map(route => ({
                id: route.id,
                name: route.name,
                waypoints: route.waypoints.map(wp => ({
                    id: wp.id,
                    name: wp.name,
                    x: wp.x,
                    y: wp.y,
                    navaidType: wp.navaidType,
                    altConstraint: wp.altConstraint
                })),
                isActive: route.isActive,
                isSecondary: route.isSecondary
            }))
        };
    }

    /**
     * 添加监听器
     */
    addListener(listener) {
        this.listeners.add(listener);
    }

    /**
     * 移除监听器
     */
    removeListener(listener) {
        this.listeners.delete(listener);
    }

    /**
     * 通知所有监听器
     */
    notifyListeners() {
        this.listeners.forEach(listener => {
            if (typeof listener === 'function') {
                listener(this.currentMap);
            }
        });
    }
}

// 创建单例实例
const mapDataService = new MapDataService();
export default mapDataService;