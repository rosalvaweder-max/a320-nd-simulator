// A320 Navigation Display Authentic Colors (Based on Airbus Standards)
export const COLORS = {
    // Background and Display
    BACKGROUND: '#000000',
    DISPLAY_BACKGROUND: '#000000',
    DISPLAY_GRID: '#1a1a1a',
    
    // Primary Colors (Airbus Standard)
    MAGENTA: '#FF00FF',      // Active flight plan, selected data
    CYAN: '#00FFFF',         // Flight plan, waypoints, navaids
    GREEN: '#00FF00',        // Active leg, track line
    YELLOW: '#FFFF00',       // Aircraft symbol, caution indications
    AMBER: '#FF9900',        // Warning, advisory
    RED: '#FF0000',          // Alert, failure
    
    // Text and Labels
    TEXT_WHITE: '#FFFFFF',   // Normal text
    TEXT_GREY: '#AAAAAA',    // Dimmed text
    TEXT_BRIGHT: '#F0F0F0',  // Bright text
    
    // Compass and Scale
    COMPASS_WHITE: '#FFFFFF',
    COMPASS_GREY: '#888888',
    COMPASS_MARKER: '#00FFFF',
    
    // Terrain and Weather
    TERRAIN_LOW: '#004400',      // 0-1000ft
    TERRAIN_MEDIUM: '#008800',   // 1000-2000ft
    TERRAIN_HIGH: '#00CC00',     // 2000-5000ft
    TERRAIN_VERY_HIGH: '#FFFF00', // 5000-10000ft
    TERRAIN_EXTREME: '#FF0000',  // 10000+ ft
    
    WEATHER_LIGHT: '#00AAFF',    // Light precipitation
    WEATHER_MODERATE: '#0088FF', // Moderate precipitation
    WEATHER_HEAVY: '#0000FF',    // Heavy precipitation
    WEATHER_EXTREME: '#FF00FF',  // Extreme precipitation
    
    // TCAS Traffic
    TCAS_PROXIMATE: '#00FF00',   // Proximate traffic
    TCAS_TA: '#FFFF00',          // Traffic Advisory
    TCAS_RA: '#FF0000',          // Resolution Advisory
    
    // Special Effects
    GLOW_EFFECT: 'rgba(255, 255, 255, 0.1)',
    PIXEL_GRID: 'rgba(100, 100, 100, 0.05)',
    CRT_PHOSPHOR: 'rgba(0, 255, 0, 0.05)',
    
    // Backward compatibility aliases for drawingUtils.js
    AIRCRAFT_YELLOW: '#FFFF00',      // Alias for YELLOW
    LABEL_CYAN: '#00FFFF',           // Alias for CYAN
    VALUE_GREEN: '#00FF00',          // Alias for GREEN
    TEXT_MAGENTA: '#FF00FF',         // Alias for MAGENTA
    TEXT_AMBER: '#FF9900',           // Alias for AMBER
    TEXT_RED: '#FF0000',             // Alias for RED
    HEADING_BLUE: '#0000FF',         // Blue for heading (not in Airbus standard but used in old code)
    TRACK_GREEN: '#00FF00',          // Alias for GREEN
    ACTIVE_PATH: '#FF00FF',          // Alias for MAGENTA
    EGPWS_LOW: '#004400',            // Alias for TERRAIN_LOW
    EGPWS_MED: '#008800',            // Alias for TERRAIN_MEDIUM
    EGPWS_HIGH: '#00CC00',           // Alias for TERRAIN_HIGH
    EGPWS_WATER: '#0000AA',          // Water color for terrain display
};

// A320 ND Display Modes
export const ND_MODES = {
    ROSE_NAV: 'ROSE_NAV',
    ROSE_ILS: 'ROSE_ILS',
    ROSE_VOR: 'ROSE_VOR',
    ARC: 'ARC',
    PLAN: 'PLAN',
};

// A320 ND Range Settings (in nautical miles)
export const ND_RANGES = [10, 20, 40, 80, 160, 320, 640];

// Airbus Font Specifications
export const FONTS = {
    PRIMARY: '16px "AirbusDisp", "Segoe UI", sans-serif',
    SECONDARY: '14px "AirbusDisp", "Segoe UI", sans-serif',
    SMALL: '12px "AirbusDisp", "Segoe UI", sans-serif',
    LARGE: '18px "AirbusDisp", "Segoe UI", sans-serif',
    BOLD: 'bold 16px "AirbusDisp", "Segoe UI", sans-serif',
};

// Airbus Symbol Sizes
export const SYMBOL_SIZES = {
    AIRCRAFT: 24,
    WAYPOINT: 8,
    VOR: 10,
    NDB: 8,
    AIRPORT: 12,
    TCAS: 6,
};

// Display Constants
export const DISPLAY = {
    WIDTH: 600,
    HEIGHT: 600,
    PADDING: 20,
    COMPASS_RADIUS: 250,
    ARC_ANGLE: 100, // degrees for ARC mode
};

// Navigation Constants
export const NAV = {
    EARTH_RADIUS_NM: 3440.065, // Earth radius in nautical miles
    DEG_TO_RAD: Math.PI / 180,
    RAD_TO_DEG: 180 / Math.PI,
    MAX_BANK_ANGLE: 30, // degrees for display limitation
};

// Professional Aviation Waypoints and Navaids
export const NAV_AIDS = {
    // Waypoint Types
    WAYPOINT_TYPES: {
        FIX: 'FIX',
        VOR: 'VOR',
        NDB: 'NDB',
        DME: 'DME',
        TACAN: 'TACAN',
        AIRPORT: 'AIRPORT',
        RUNWAY: 'RUNWAY',
        ILS: 'ILS',
    },
    
    // Waypoint Status
    WAYPOINT_STATUS: {
        ACTIVE: 'active',
        DIRECT: 'direct',
        INACTIVE: 'inactive',
        DISCONTINUITY: 'discontinuity',
        HOLD: 'hold',
    },
};

// Realistic Waypoints (European Airspace Example)
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

// Realistic TCAS Traffic
export const MOCK_TCAS = [
    {
        id: 'tcas-b737',
        callsign: 'BAW123',
        bearing: 45,
        distance: 12.5,
        relativeAlt: 1200,
        verticalSpeed: 1500,
        threatLevel: 'RA',
        type: 'B737',
    },
    {
        id: 'tcas-a320',
        callsign: 'AFR456',
        bearing: 135,
        distance: 8.2,
        relativeAlt: -800,
        verticalSpeed: -1200,
        threatLevel: 'TA',
        type: 'A320',
    },
    {
        id: 'tcas-b777',
        callsign: 'UAL789',
        bearing: 225,
        distance: 25.0,
        relativeAlt: 500,
        verticalSpeed: 0,
        threatLevel: 'PROXIMATE',
        type: 'B777',
    },
    {
        id: 'tcas-crj',
        callsign: 'DLH234',
        bearing: 315,
        distance: 18.7,
        relativeAlt: -1500,
        verticalSpeed: -800,
        threatLevel: 'OTHER',
        type: 'CRJ',
    },
];

// Weather Radar Data
export const MOCK_WEATHER = [
    {
        bearing: 30,
        distance: 40,
        intensity: 'HEAVY',
        turbulence: true,
    },
    {
        bearing: 120,
        distance: 25,
        intensity: 'MODERATE',
        turbulence: false,
    },
    {
        bearing: 210,
        distance: 60,
        intensity: 'LIGHT',
        turbulence: false,
    },
];

// Terrain Data
export const MOCK_TERRAIN = [
    {
        minX: -200,
        maxX: -100,
        minY: 50,
        maxY: 150,
        minElevation: 0,
        maxElevation: 500,
        color: 'TERRAIN_LOW',
    },
    {
        minX: -50,
        maxX: 50,
        minY: -50,
        maxY: 50,
        minElevation: 1000,
        maxElevation: 2500,
        color: 'TERRAIN_MEDIUM',
    },
    {
        minX: 100,
        maxX: 200,
        minY: -100,
        maxY: 0,
        minElevation: 3000,
        maxElevation: 6000,
        color: 'TERRAIN_HIGH',
    },
];