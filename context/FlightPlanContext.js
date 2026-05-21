   import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { MOCK_WAYPOINTS } from '../constants.js';
import mapDataService from '../services/MapDataService.js';

const FlightPlanContext = createContext();

export const useFlightPlan = () => {
    const context = useContext(FlightPlanContext);
    if (!context) {
        throw new Error('useFlightPlan must be used within a FlightPlanProvider');
    }
    return context;
};

const STORAGE_KEY = 'a320_simulator_routes';
const MAP_STORAGE_KEY = 'a320_simulator_map_data';
const ROUTE_VERSION_KEY = 'a320_simulator_route_version';
const CURRENT_ROUTE_VERSION = 1; // Increment when default route data changes

// Helper to ensure waypoints have navaidType
const ensureNavaidType = (wp) => {
    if (wp.navaidType) return wp;
    const typeMap = {
        'AIRPORT': 'FIX',
        'VOR': 'VOR',
        'NDB': 'NDB',
        'FIX': 'FIX',
    };
    return { ...wp, navaidType: typeMap[wp.type] || 'FIX' };
};

export const FlightPlanProvider = ({ children }) => {
    const [routes, setRoutes] = useState(() => {
        const storedVersion = localStorage.getItem(ROUTE_VERSION_KEY);
        if (storedVersion !== String(CURRENT_ROUTE_VERSION)) {
            // Version mismatch - reset to defaults
            localStorage.removeItem(STORAGE_KEY);
            localStorage.setItem(ROUTE_VERSION_KEY, String(CURRENT_ROUTE_VERSION));
        } else {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    // Ensure all waypoints have navaidType (for backward compatibility)
                    return parsed.map(route => ({
                        ...route,
                        waypoints: route.waypoints.map(ensureNavaidType)
                    }));
                } catch (e) {
                    console.error('Failed to parse stored routes', e);
                }
            }
        }
        return [
            {
                id: 'default-route',
                name: '默认航路',
                waypoints: MOCK_WAYPOINTS.map((wp, index) => {
                    return { ...ensureNavaidType(wp), id: wp.id || `wp-${index}` };
                }),
                isActive: true,
                isSecondary: false
            }
        ];
    });

    const [mapData, setMapData] = useState(() => {
        const stored = localStorage.getItem(MAP_STORAGE_KEY);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                console.error('Failed to parse stored map data', e);
            }
        }
        return null;
    });

    const [mapLoading, setMapLoading] = useState(false);
    const [mapError, setMapError] = useState(null);

    const [activeRouteId, setActiveRouteId] = useState(() => {
        const active = routes.find(r => r.isActive);
        return active ? active.id : (routes.length > 0 ? routes[0].id : null);
    });

    const [secondaryRouteId, setSecondaryRouteId] = useState(() => {
        const secondary = routes.find(r => r.isSecondary);
        return secondary ? secondary.id : null;
    });

    const activeRoute = useMemo(() => routes.find(r => r.id === activeRouteId), [routes, activeRouteId]);
    const secondaryRoute = useMemo(() => routes.find(r => r.id === secondaryRouteId), [routes, secondaryRouteId]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(routes));
    }, [routes]);

    useEffect(() => {
        if (mapData) {
            localStorage.setItem(MAP_STORAGE_KEY, JSON.stringify(mapData));
        } else {
            localStorage.removeItem(MAP_STORAGE_KEY);
        }
    }, [mapData]);

    const loadMapFromUrl = async (url) => {
        setMapLoading(true);
        setMapError(null);
        try {
            const data = await mapDataService.loadMapFromUrl(url);
            const normalized = mapDataService.validateAndNormalizeMapData(data);
            setMapData(normalized);
            return normalized;
        } catch (error) {
            setMapError(error.message);
            throw error;
        } finally {
            setMapLoading(false);
        }
    };

    const loadMapFromFile = async (file) => {
        setMapLoading(true);
        setMapError(null);
        try {
            const data = await mapDataService.loadMapFromFile(file);
            const normalized = mapDataService.validateAndNormalizeMapData(data);
            setMapData(normalized);
            return normalized;
        } catch (error) {
            setMapError(error.message);
            throw error;
        } finally {
            setMapLoading(false);
        }
    };

    const clearMapData = () => {
        setMapData(null);
        setMapError(null);
    };

    const createRouteFromMap = (routeName, waypointIds) => {
        if (!mapData) {
            throw new Error('没有加载地图数据');
        }

        const waypoints = waypointIds.map(id => {
            const wp = mapData.waypoints.find(w => w.id === id);
            if (!wp) {
                throw new Error(`找不到航路点: ${id}`);
            }
            return {
                ...wp,
                status: 'direct'
            };
        });

        const newRoute = {
            id: `route-${Date.now()}`,
            name: routeName || `从地图创建的航路`,
            waypoints,
            isActive: false,
            isSecondary: false
        };

        setRoutes([...routes, newRoute]);
        return newRoute.id;
    };

    const addRoute = (name) => {
        const newRoute = {
            id: `route-${Date.now()}`,
            name: name || `新航路 ${routes.length + 1}`,
            waypoints: [],
            isActive: routes.length === 0,
            isSecondary: false
        };
        setRoutes([...routes, newRoute]);
        if (routes.length === 0) setActiveRouteId(newRoute.id);
        return newRoute.id;
    };

    const updateRoute = (routeId, updates) => {
        setRoutes(prev => prev.map(r => r.id === routeId ? { ...r, ...updates } : r));
    };

    const deleteRoute = (routeId) => {
        setRoutes(prev => prev.filter(r => r.id !== routeId));
        if (activeRouteId === routeId) setActiveRouteId(null);
        if (secondaryRouteId === routeId) setSecondaryRouteId(null);
    };

    const activateRoute = (routeId) => {
        setRoutes(prev => prev.map(r => ({
            ...r,
            isActive: r.id === routeId,
            isSecondary: r.id === routeId ? false : r.isSecondary
        })));
        setActiveRouteId(routeId);
    };

    const setAsSecondary = (routeId) => {
        setRoutes(prev => prev.map(r => ({
            ...r,
            isSecondary: r.id === routeId,
            isActive: r.id === routeId ? false : r.isActive
        })));
        setSecondaryRouteId(routeId);
    };

    const addWaypoint = (routeId, waypoint) => {
        setRoutes(prev => prev.map(r => {
            if (r.id === routeId) {
                // Auto-set navaidType based on waypoint type if not already set
                let navaidType = waypoint.navaidType;
                if (!navaidType) {
                    const typeMap = {
                        'AIRPORT': 'FIX',
                        'VOR': 'VOR',
                        'NDB': 'NDB',
                        'FIX': 'FIX',
                    };
                    navaidType = typeMap[waypoint.type] || 'FIX';
                }
                const newWp = {
                    ...waypoint,
                    id: waypoint.id || `wp-${Date.now()}`,
                    navaidType,
                    status: r.waypoints.length === 0 ? 'active' : 'direct',
                    isConnected: waypoint.isConnected !== undefined ? waypoint.isConnected : true
                };
                return { ...r, waypoints: [...r.waypoints, newWp] };
            }
            return r;
        }));
    };

    const updateWaypoint = (routeId, waypointId, updates) => {
        setRoutes(prev => prev.map(r => {
            if (r.id === routeId) {
                return {
                    ...r,
                    waypoints: r.waypoints.map(wp => wp.id === waypointId ? { ...wp, ...updates } : wp)
                };
            }
            return r;
        }));
    };

    const deleteWaypoint = (routeId, waypointId) => {
        setRoutes(prev => prev.map(r => {
            if (r.id === routeId) {
                return {
                    ...r,
                    waypoints: r.waypoints.filter(wp => wp.id !== waypointId)
                };
            }
            return r;
        }));
    };

    const toggleWaypointConnection = (routeId, waypointId) => {
        setRoutes(prev => prev.map(r => {
            if (r.id === routeId) {
                return {
                    ...r,
                    waypoints: r.waypoints.map(wp =>
                        wp.id === waypointId ? { ...wp, isConnected: !wp.isConnected } : wp
                    )
                };
            }
            return r;
        }));
    };

    const reorderWaypoints = (routeId, startIndex, endIndex) => {
        setRoutes(prev => prev.map(r => {
            if (r.id === routeId) {
                const result = Array.from(r.waypoints);
                const [removed] = result.splice(startIndex, 1);
                result.splice(endIndex, 0, removed);
                return { ...r, waypoints: result };
            }
            return r;
        }));
    };

    const value = {
        routes,
        activeRoute,
        secondaryRoute,
        mapData,
        mapLoading,
        mapError,
        addRoute,
        updateRoute,
        deleteRoute,
        activateRoute,
        setAsSecondary,
        addWaypoint,
        updateWaypoint,
        deleteWaypoint,
        reorderWaypoints,
        toggleWaypointConnection,
        loadMapFromUrl,
        loadMapFromFile,
        clearMapData,
        createRouteFromMap
    };

    return React.createElement(FlightPlanContext.Provider, { value }, children);
};