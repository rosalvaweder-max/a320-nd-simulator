import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';

const STORAGE_KEY = 'a320-nd-vor-stations';
const TUNING_STORAGE_KEY = 'a320-nd-vor-tuning';
const STORAGE_VERSION_KEY = 'a320-nd-vor-version';
const CURRENT_VERSION = 5; // Increment when DEFAULT_VOR_STATIONS change

// Default VOR stations - positioned along the flight route corridor
// Placed naturally along the route path (LFPG → EGLL → CDG → LAM → TODIL → KOK)
// Each station is offset slightly from the route centerline, like real-world navaids
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
        // Check version - if mismatch, reset to defaults (handles coordinate changes)
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

    // Tuning state
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
            mode: 'auto', // 'auto' or 'manual'
            manualFrequency: '114.10',
            autoFrequency: '114.10',
            autoStationId: 'vor-gow',
            manualStationId: 'vor-gow',
        };
    });

    // Persist to localStorage
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(vorStations));
    }, [vorStations]);

    useEffect(() => {
        localStorage.setItem(TUNING_STORAGE_KEY, JSON.stringify(tuningState));
    }, [tuningState]);

    // Add a new VOR station
    const addVORStation = useCallback((station) => {
        setVorStations(prev => [...prev, {
            ...station,
            id: station.id || `vor-${Date.now()}`,
            type: 'VOR',
            navaidType: 'VOR',
        }]);
    }, []);

    // Remove a VOR station
    const removeVORStation = useCallback((stationId) => {
        setVorStations(prev => prev.filter(s => s.id !== stationId));
    }, []);

    // Update a VOR station
    const updateVORStation = useCallback((stationId, updates) => {
        setVorStations(prev => prev.map(s => 
            s.id === stationId ? { ...s, ...updates } : s
        ));
    }, []);

    // Get all VOR stations
    const getAllVORStations = useCallback(() => {
        return vorStations;
    }, [vorStations]);

    // Find nearest VOR station to aircraft position (auto-tuning)
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

    // Find VOR station by frequency
    const findVORByFrequency = useCallback((freq) => {
        return vorStations.find(s => s.frequency === freq) || null;
    }, [vorStations]);

    // Find VOR station by ID
    const findVORById = useCallback((id) => {
        return vorStations.find(s => s.id === id) || null;
    }, [vorStations]);

    // Set tuning mode
    const setTuningMode = useCallback((mode) => {
        setTuningState(prev => ({ ...prev, mode }));
    }, []);

    // Set manual frequency
    const setManualFrequency = useCallback((freq) => {
        setTuningState(prev => ({ ...prev, manualFrequency: freq }));
    }, []);

    // Update auto-tuning result
    const updateAutoTuning = useCallback((stationId, frequency) => {
        setTuningState(prev => ({
            ...prev,
            autoStationId: stationId,
            autoFrequency: frequency,
        }));
    }, []);

    // Get the currently active VOR station based on tuning mode
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
