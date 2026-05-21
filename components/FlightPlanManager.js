import React, { useState } from 'react';
import { useFlightPlan } from '../context/FlightPlanContext.js';
import RouteList from './RouteList.js';
import RouteEditor from './RouteEditor.js';

const FlightPlanManager = () => {
    const { routes, addRoute, deleteRoute, activateRoute, setAsSecondary } = useFlightPlan();
    const [editingRouteId, setEditingRouteId] = useState(null);
    const [isOpen, setIsOpen] = useState(false);

    const handleCreateRoute = () => {
        const id = addRoute();
        setEditingRouteId(id);
    };

    const handleEditRoute = (id) => {
        setEditingRouteId(id);
    };

    const handleBackToList = () => {
        setEditingRouteId(null);
    };

    if (!isOpen) {
        return React.createElement('button', {
            onClick: () => setIsOpen(true),
            className: 'fixed bottom-8 right-8 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-6 rounded-full shadow-2xl z-[60] flex items-center gap-2 transition-all transform hover:scale-105'
        }, [
            React.createElement('span', { key: 'icon', className: 'text-xl' }, '✈️'),
            '航路管理'
        ]);
    }

    return React.createElement('div', {
        className: 'fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in'
    }, [
        React.createElement('div', {
            key: 'manager-container',
            className: 'bg-gray-900 border-2 border-cyan-500/50 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl shadow-cyan-500/20'
        }, [
            // Header
            React.createElement('div', {
                key: 'header',
                className: 'p-6 border-b border-gray-800 flex justify-between items-center bg-gray-800/50'
            }, [
                React.createElement('div', { key: 'title-container' }, [
                    React.createElement('h2', { className: 'text-2xl font-bold text-cyan-400' }, 
                        editingRouteId ? '编辑航路' : '航路管理器'
                    ),
                    React.createElement('p', { className: 'text-gray-500 text-xs mt-1 uppercase tracking-widest' }, 
                        editingRouteId ? 'Route Editor' : 'Flight Plan Manager'
                    )
                ]),
                React.createElement('button', {
                    onClick: () => setIsOpen(false),
                    className: 'text-gray-400 hover:text-white transition-colors p-2'
                }, '✕')
            ]),

            // Content
            React.createElement('div', {
                key: 'content',
                className: 'flex-grow overflow-y-auto p-6'
            }, 
                editingRouteId 
                    ? React.createElement(RouteEditor, { 
                        routeId: editingRouteId, 
                        onBack: handleBackToList 
                      })
                    : React.createElement(RouteList, { 
                        onEdit: handleEditRoute,
                        onCreate: handleCreateRoute
                      })
            )
        ])
    ]);
};

export default FlightPlanManager;