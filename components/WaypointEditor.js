import React, { useState, useEffect } from 'react';

const WaypointEditor = ({ waypoint, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: '',
        x: 0,
        y: 0,
        navaidType: 'FIX',
        altConstraint: '',
        isConnected: true
    });

    useEffect(() => {
        if (waypoint) {
            setFormData({
                name: waypoint.name,
                x: waypoint.x,
                y: waypoint.y,
                navaidType: waypoint.navaidType || 'FIX',
                altConstraint: waypoint.altConstraint || '',
                isConnected: waypoint.isConnected !== undefined ? waypoint.isConnected : true
            });
        }
    }, [waypoint]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...formData,
            x: parseFloat(formData.x),
            y: parseFloat(formData.y),
            altConstraint: formData.altConstraint ? parseInt(formData.altConstraint) : null
        });
    };

    return React.createElement('div', {
        className: 'fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4'
    }, [
        React.createElement('div', {
            key: 'modal',
            className: 'bg-gray-900 border-2 border-green-500/50 rounded-2xl w-full max-w-md p-8 shadow-2xl'
        }, [
            React.createElement('h3', { className: 'text-xl font-bold text-green-400 mb-6 flex items-center gap-2' }, [
                React.createElement('span', { key: 'icon' }, waypoint ? '✎' : '+'),
                waypoint ? '编辑航路点' : '添加航路点'
            ]),

            React.createElement('form', { key: 'form', onSubmit: handleSubmit, className: 'space-y-4' }, [
                // 名称输入
                React.createElement('div', { key: 'name-field' }, [
                    React.createElement('label', { className: 'block text-gray-500 text-xs font-bold uppercase tracking-wider mb-1' }, '航路点名称'),
                    React.createElement('input', {
                        type: 'text',
                        value: formData.name,
                        onChange: (e) => setFormData({ ...formData, name: e.target.value.toUpperCase() }),
                        placeholder: '例如: AKITO',
                        required: true,
                        className: 'w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-green-500 outline-none'
                    })
                ]),

                // 类型选择
                React.createElement('div', { key: 'type-field' }, [
                    React.createElement('label', { className: 'block text-gray-500 text-xs font-bold uppercase tracking-wider mb-1' }, '类型'),
                    React.createElement('select', {
                        value: formData.navaidType,
                        onChange: (e) => setFormData({ ...formData, navaidType: e.target.value }),
                        className: 'w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-green-500 outline-none'
                    }, [
                        React.createElement('option', { value: 'FIX' }, 'FIX (航路点)'),
                        React.createElement('option', { value: 'VOR' }, 'VOR (无线电导航台)'),
                        React.createElement('option', { value: 'NDB' }, 'NDB (无方向性信标)')
                    ])
                ]),

                // 坐标输入
                React.createElement('div', { key: 'coords-field', className: 'grid grid-cols-2 gap-4' }, [
                    React.createElement('div', { key: 'x' }, [
                        React.createElement('label', { className: 'block text-gray-500 text-xs font-bold uppercase tracking-wider mb-1' }, 'X 坐标 (NM)'),
                        React.createElement('input', {
                            type: 'number',
                            step: '0.1',
                            value: formData.x,
                            onChange: (e) => setFormData({ ...formData, x: e.target.value }),
                            required: true,
                            className: 'w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-green-500 outline-none'
                        })
                    ]),
                    React.createElement('div', { key: 'y' }, [
                        React.createElement('label', { className: 'block text-gray-500 text-xs font-bold uppercase tracking-wider mb-1' }, 'Y 坐标 (NM)'),
                        React.createElement('input', {
                            type: 'number',
                            step: '0.1',
                            value: formData.y,
                            onChange: (e) => setFormData({ ...formData, y: e.target.value }),
                            required: true,
                            className: 'w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-green-500 outline-none'
                        })
                    ])
                ]),

                // 航路连线复选框
                React.createElement('div', { key: 'connected-field' }, [
                    React.createElement('label', { className: 'block text-gray-500 text-xs font-bold uppercase tracking-wider mb-1' }, '航路连线'),
                    React.createElement('div', { className: 'flex items-center gap-3' }, [
                        React.createElement('input', {
                            type: 'checkbox',
                            checked: formData.isConnected,
                            onChange: (e) => setFormData({ ...formData, isConnected: e.target.checked }),
                            className: 'w-5 h-5 accent-green-500 cursor-pointer'
                        }),
                        React.createElement('span', {
                            className: 'text-sm text-gray-400'
                        }, formData.isConnected ? '已连线 (作为航路一部分)' : '未连线 (作为VOR台显示)')
                    ])
                ]),

                // 高度限制输入
                React.createElement('div', { key: 'alt-field' }, [
                    React.createElement('label', { className: 'block text-gray-500 text-xs font-bold uppercase tracking-wider mb-1' }, '高度限制 (FT, 可选)'),
                    React.createElement('input', {
                        type: 'number',
                        value: formData.altConstraint,
                        onChange: (e) => setFormData({ ...formData, altConstraint: e.target.value }),
                        placeholder: '例如: 5000',
                        className: 'w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-green-500 outline-none'
                    })
                ]),

                // 操作按钮（取消/保存）
                React.createElement('div', { key: 'buttons', className: 'flex gap-4 pt-4' }, [
                    React.createElement('button', {
                        type: 'button',
                        onClick: onCancel,
                        className: 'flex-grow bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-lg transition-all'
                    }, '取消'),
                    React.createElement('button', {
                        type: 'submit',
                        className: 'flex-grow bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg transition-all shadow-lg'
                    }, '保存')
                ])
            ])
        ])
    ]);
};

export default WaypointEditor;