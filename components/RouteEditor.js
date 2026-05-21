import React, { useState } from 'react';
import { useFlightPlan } from '../context/FlightPlanContext.js';
import WaypointEditor from './WaypointEditor.js';

const RouteEditor = ({ routeId, onBack }) => {
    const { routes, updateRoute, addWaypoint, deleteWaypoint, reorderWaypoints, updateWaypoint } = useFlightPlan();
    const route = routes.find(r => r.id === routeId);
    const [isAddingWaypoint, setIsAddingWaypoint] = useState(false);
    const [editingWaypointId, setEditingWaypointId] = useState(null);

    if (!route) return React.createElement('p', { className: 'text-center py-10 text-red-500' }, '找不到该航路。');

    const handleNameChange = (e) => {
        updateRoute(routeId, { name: e.target.value });
    };

    const handleAddWaypoint = (waypoint) => {
        addWaypoint(routeId, waypoint);
        setIsAddingWaypoint(false);
    };

    const handleEditWaypoint = (waypointId, updates) => {
        updateWaypoint(routeId, waypointId, updates);
        setEditingWaypointId(null);
    };

    const moveWaypoint = (index, direction) => {
        const newIndex = index + direction;
        if (newIndex >= 0 && newIndex < route.waypoints.length) {
            reorderWaypoints(routeId, index, newIndex);
        }
    };

    return React.createElement('div', { className: 'flex flex-col h-full space-y-6' }, [
        // Navigation and Title
        React.createElement('div', { key: 'nav', className: 'flex items-center gap-4 mb-2' }, [
            React.createElement('button', {
                onClick: onBack,
                className: 'p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all border border-gray-700'
            }, '← 返回列表'),
            React.createElement('input', {
                type: 'text',
                value: route.name,
                onChange: handleNameChange,
                className: 'flex-grow bg-gray-800 border-b-2 border-transparent focus:border-cyan-500 text-xl font-bold p-2 text-white outline-none rounded-lg'
            })
        ]),

        // Waypoints List Header
        React.createElement('div', { key: 'header', className: 'flex justify-between items-center py-4 border-b border-gray-800' }, [
            React.createElement('h3', { className: 'text-gray-400 font-bold uppercase tracking-widest text-xs' }, '航路点列表 (WAYPOINTS)'),
            React.createElement('button', {
                onClick: () => setIsAddingWaypoint(true),
                className: 'bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg text-sm transition-all shadow-md flex items-center gap-2'
            }, [
                React.createElement('span', { key: 'plus', className: 'text-lg' }, '+'),
                '添加航路点'
            ])
        ]),

        // Add/Edit Waypoint Modal
        (isAddingWaypoint || editingWaypointId) && React.createElement(WaypointEditor, {
            key: 'modal',
            waypoint: editingWaypointId ? route.waypoints.find(wp => wp.id === editingWaypointId) : null,
            onSave: editingWaypointId ? (updates) => handleEditWaypoint(editingWaypointId, updates) : handleAddWaypoint,
            onCancel: () => {
                setIsAddingWaypoint(false);
                setEditingWaypointId(null);
            }
        }),

        // Waypoints List
        React.createElement('div', { key: 'list', className: 'flex-grow space-y-3 pb-8' }, 
            route.waypoints.length === 0 
                ? React.createElement('div', { className: 'text-center py-20 bg-gray-800/20 rounded-2xl border-2 border-dashed border-gray-800' }, [
                    React.createElement('p', { key: 'msg', className: 'text-gray-600 italic' }, '尚无航路点'),
                    React.createElement('button', {
                        key: 'btn',
                        onClick: () => setIsAddingWaypoint(true),
                        className: 'mt-4 text-cyan-500 hover:text-cyan-400 text-sm font-bold'
                    }, '立即添加一个')
                ])
                : route.waypoints.map((wp, i) => React.createElement('div', {
                    key: wp.id,
                    className: 'p-4 rounded-xl bg-gray-800 border border-gray-700 flex justify-between items-center group hover:border-cyan-500/50 transition-all'
                }, [
                    // Index and Name
                    React.createElement('div', { key: 'info', className: 'flex items-center gap-4' }, [
                        React.createElement('span', { className: 'text-gray-600 font-mono font-bold text-sm w-6' }, (i + 1).toString().padStart(2, '0')),
                        React.createElement('div', { className: 'flex flex-col' }, [
                            React.createElement('div', { className: 'flex items-center gap-2' }, [
                                React.createElement('h4', { className: 'text-lg font-bold text-white' }, wp.name),
                                wp.navaidType && React.createElement('span', { className: 'text-[9px] px-1.5 py-0.5 rounded-sm bg-gray-700 text-gray-400 font-bold uppercase' }, wp.navaidType)
                            ]),
                            React.createElement('p', { className: 'text-gray-500 font-mono text-xs' }, 
                                `X: ${wp.x.toFixed(1)} NM • Y: ${wp.y.toFixed(1)} NM ${wp.altConstraint ? `• ALT: ${wp.altConstraint} FT` : ''}`
                            )
                        ])
                    ]),

                    // Actions
                    React.createElement('div', { key: 'actions', className: 'flex gap-2' }, [
                        // Move Buttons
                        React.createElement('div', { className: 'flex flex-col mr-2' }, [
                            React.createElement('button', {
                                onClick: () => moveWaypoint(i, -1),
                                disabled: i === 0,
                                className: 'text-gray-500 hover:text-white disabled:opacity-0 transition-all text-xs'
                            }, '▲'),
                            React.createElement('button', {
                                onClick: () => moveWaypoint(i, 1),
                                disabled: i === route.waypoints.length - 1,
                                className: 'text-gray-500 hover:text-white disabled:opacity-0 transition-all text-xs'
                            }, '▼')
                        ]),

                        React.createElement('button', {
                            onClick: () => setEditingWaypointId(wp.id),
                            className: 'p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-all text-sm'
                        }, '编辑'),

                        React.createElement('button', {
                            onClick: () => deleteWaypoint(routeId, wp.id),
                            className: 'p-2 rounded-lg bg-red-900/40 hover:bg-red-600 text-red-400 hover:text-white transition-all border border-red-500/30'
                        }, '✕')
                    ])
                ]))
        )
    ]);
};

export default RouteEditor;