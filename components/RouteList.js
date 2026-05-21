import React from 'react';
import { useFlightPlan } from '../context/FlightPlanContext.js';

const RouteList = ({ onEdit, onCreate }) => {
    const { routes, deleteRoute, activateRoute, setAsSecondary } = useFlightPlan();

    return React.createElement('div', { className: 'space-y-6' }, [
        // Action Bar
        React.createElement('div', { key: 'action-bar', className: 'flex justify-between items-center pb-4 border-b border-gray-800' }, [
            React.createElement('span', { className: 'text-gray-400 text-sm' }, 
                `共 ${routes.length} 条航路`
            ),
            React.createElement('button', {
                onClick: onCreate,
                className: 'bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-6 rounded-lg transition-all shadow-md flex items-center gap-2'
            }, [
                React.createElement('span', { key: 'plus', className: 'text-lg' }, '+'),
                '创建新航路'
            ])
        ]),

        // Route Cards
        React.createElement('div', { key: 'list', className: 'grid gap-4' }, 
            routes.length === 0 
                ? React.createElement('p', { className: 'text-gray-600 text-center py-10 italic' }, '尚无航路，请创建一个。')
                : routes.map((route) => React.createElement('div', {
                    key: route.id,
                    className: `p-5 rounded-xl border-2 transition-all flex justify-between items-center group ${
                        route.isActive 
                            ? 'bg-green-900/10 border-green-500/50 shadow-lg shadow-green-500/10' 
                            : route.isSecondary 
                                ? 'bg-cyan-900/10 border-cyan-500/50' 
                                : 'bg-gray-800/40 border-gray-700 hover:border-gray-500'
                    }`
                }, [
                    // Route Info
                    React.createElement('div', { key: 'info', className: 'flex-grow cursor-pointer', onClick: () => onEdit(route.id) }, [
                        React.createElement('div', { className: 'flex items-center gap-3 mb-1' }, [
                            React.createElement('h3', { className: `text-lg font-bold ${route.isActive ? 'text-green-400' : 'text-gray-200'}` }, 
                                route.name
                            ),
                            route.isActive && React.createElement('span', { className: 'bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest animate-pulse' }, 'Active'),
                            route.isSecondary && React.createElement('span', { className: 'bg-cyan-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest' }, 'Secondary')
                        ]),
                        React.createElement('p', { className: 'text-gray-500 text-xs font-mono uppercase' }, 
                            `${route.waypoints.length} 个航路点 • ${
                                route.waypoints.map(wp => wp.name).join(' → ') || '空航路'
                            }`
                        )
                    ]),

                    // Actions
                    React.createElement('div', { key: 'actions', className: 'flex gap-2 ml-4' }, [
                        !route.isActive && React.createElement('button', {
                            onClick: () => activateRoute(route.id),
                            className: 'p-2 rounded-lg bg-green-900/40 hover:bg-green-600 text-green-400 hover:text-white transition-all text-xs font-bold border border-green-500/30'
                        }, '激活'),
                        
                        !route.isActive && !route.isSecondary && React.createElement('button', {
                            onClick: () => setAsSecondary(route.id),
                            className: 'p-2 rounded-lg bg-cyan-900/40 hover:bg-cyan-600 text-cyan-400 hover:text-white transition-all text-xs font-bold border border-cyan-500/30'
                        }, '备用'),

                        React.createElement('button', {
                            onClick: () => onEdit(route.id),
                            className: 'p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-all'
                        }, '✎'),

                        React.createElement('button', {
                            onClick: () => deleteRoute(route.id),
                            className: 'p-2 rounded-lg bg-red-900/40 hover:bg-red-600 text-red-400 hover:text-white transition-all border border-red-500/30'
                        }, '✕')
                    ])
                ]))
        )
    ]);
};

export default RouteList;