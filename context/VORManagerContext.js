import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';

const STORAGE_KEY = 'a320-nd-vor-stations';
const TUNING_STORAGE_KEY = 'a320-nd-vor-tuning';
const STORAGE_VERSION_KEY = 'a320-nd-vor-version';
const CURRENT_VERSION = 5; // DEFAULT_VOR_STATIONS 变更时递增此版本号

// 默认 VOR 台站 - 沿飞行航路走廊布置
// 自然地沿航路路径布置（LFPG → EGLL → CDG → LAM → TODIL → KOK）
// 每个台站略微偏离航路中心线，模拟真实导航台布局
const DEFAULT_VOR_STATIONS = [
    { id: 'vor-gow', name: 'GOW', frequency: '114.10', x: -110, y: 85, type: 'VOR', navaidType: 'VOR' },
    { id: 'vor-doo', name: 'DOO', frequency: '113.70', x: -135, y: 65, type: 'VOR', navaidType: 'VOR' },
    { id: 'vor-ood', name: 'OOD', frequency: '112.50', x: -155, y: 45, type: 'VOR', navaidType: 'VOR' },
    { id: 'vor-big', name: 'BIG', frequency: '115.30', x: -95, y: 55, type: 'VOR', navaidType: 'VOR' },
    { id: 'vor-lam', name: 'LAM', frequency: '116.80', x: -85, y: 105, type: 'VOR', navaidType: 'VOR' },
    { id: 'vor-cdg', name: 'CDG', frequency: '117.50', x: -65, y: 125, type: 'VOR', navaidType: 'VOR' },
];

const VORManagerContext = createContext(null);

export const VORManagerProvider = ({ children }) => {
    const [vorStations, setVorStations] = useState(() => {
        // 检查版本 - 如果不匹配则重置为默认值（处理坐标变更）
        const storedVersion = localStorage.getItem(STORAGE_VERSION_KEY);
        if (storedVersion !== String(CURRENT_VERSION)) {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.setItem(STORAGE_VERSION_KEY, String(CURRENT_VERSION));
            return DEFAULT_VOR_STATIONS.map(s => ({ ...s }));
        }
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                console.error('Failed to parse stored VOR stations', e);
            }
        }
        return DEFAULT_VOR_STATIONS.map(s => ({ ...s }));
    });

    // 调谐状态
    const [tuningState, setTuningState] = useState(() => {
        const stored = localStorage.getItem(TUNING_STORAGE_KEY);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                console.error('Failed to parse tuning state', e);
            }
        }
        return {
            mode: 'auto', // 'auto'（自动）或 'manual'（手动）
            manualFrequency: '114.10',
            autoFrequency: '114.10',
            autoStationId: 'vor-gow',
            manualStationId: 'vor-gow',
        };
    });

    // 持久化到 localStorage
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(vorStations));
    }, [vorStations]);

    useEffect(() => {
        localStorage.setItem(TUNING_STORAGE_KEY, JSON.stringify(tuningState));
    }, [tuningState]);

    // 添加新的 VOR 台站
    const addVORStation = useCallback((station) => {
        setVorStations(prev => [...prev, {
            ...station,
            id: station.id || `vor-${Date.now()}`,
            type: 'VOR',
            navaidType: 'VOR',
        }]);
    }, []);

    // 删除 VOR 台站
    const removeVORStation = useCallback((stationId) => {
        setVorStations(prev => prev.filter(s => s.id !== stationId));
    }, []);

    // 更新 VOR 台站
    const updateVORStation = useCallback((stationId, updates) => {
        setVorStations(prev => prev.map(s => 
            s.id === stationId ? { ...s, ...updates } : s
        ));
    }, []);

    // 获取所有 VOR 台站
    const getAllVORStations = useCallback(() => {
        return vorStations;
    }, [vorStations]);

    // 查找离飞机最近的 VOR 台站（自动调谐）
    const findNearestVORStation = useCallback((aircraftX, aircraftY) => {
        if (!vorStations || vorStations.length === 0) return null;
        
        let nearest = null;
        let minDist = Infinity;
        
        vorStations.forEach(station => {
            const dx = station.x - aircraftX;
            const dy = station.y - aircraftY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minDist) {
                minDist = dist;
                nearest = { ...station, distance: dist };
            }
        });
        
        return nearest;
    }, [vorStations]);

    // 按频率查找 VOR 台站
    const findVORByFrequency = useCallback((freq) => {
        return vorStations.find(s => s.frequency === freq) || null;
    }, [vorStations]);

    // 按 ID 查找 VOR 台站
    const findVORById = useCallback((id) => {
        return vorStations.find(s => s.id === id) || null;
    }, [vorStations]);

    // 设置调谐模式
    const setTuningMode = useCallback((mode) => {
        setTuningState(prev => ({ ...prev, mode }));
    }, []);

    // 设置手动频率
    const setManualFrequency = useCallback((freq) => {
        setTuningState(prev => ({ ...prev, manualFrequency: freq }));
    }, []);

    // 更新自动调谐结果
    const updateAutoTuning = useCallback((stationId, frequency) => {
        setTuningState(prev => ({
            ...prev,
            autoStationId: stationId,
            autoFrequency: frequency,
        }));
    }, []);

    // 根据调谐模式获取当前激活的 VOR 台站
    const getActiveVORStation = useCallback(() => {
        if (tuningState.mode === 'manual') {
            return findVORByFrequency(tuningState.manualFrequency);
        } else {
            return findVORById(tuningState.autoStationId);
        }
    }, [tuningState, findVORByFrequency, findVORById]);

    const value = {
        vorStations,
        tuningState,
        addVORStation,
        removeVORStation,
        updateVORStation,
        getAllVORStations,
        findNearestVORStation,
        findVORByFrequency,
        findVORById,
        setTuningMode,
        setManualFrequency,
        updateAutoTuning,
        getActiveVORStation,
    };

    return React.createElement(VORManagerContext.Provider, { value }, children);
};

export const useVORManager = () => {
    const context = useContext(VORManagerContext);
    if (!context) {
        throw new Error('useVORManager must be used within a VORManagerProvider');
    }
    return context;
};

export default VORManagerContext;
