import React, { useState } from 'react';
import { useFlightPlan } from '../context/FlightPlanContext.js';

const MapLoader = () => {
    const { 
        mapData, 
        mapLoading, 
        mapError, 
        loadMapFromUrl, 
        loadMapFromFile, 
        clearMapData,
        createRouteFromMap 
    } = useFlightPlan();

    const [urlInput, setUrlInput] = useState('');
    const [selectedWaypoints, setSelectedWaypoints] = useState([]);
    const [routeName, setRouteName] = useState('');

    const handleUrlLoad = async () => {
        if (!urlInput.trim()) return;
        try {
            await loadMapFromUrl(urlInput);
            setUrlInput('');
        } catch (error) {
            console.error('加载地图失败:', error);
        }
    };

    const handleFileLoad = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        try {
            await loadMapFromFile(file);
        } catch (error) {
            console.error('加载地图文件失败:', error);
        }
    };

    const handleWaypointToggle = (waypointId) => {
        setSelectedWaypoints(prev => {
            if (prev.includes(waypointId)) {
                return prev.filter(id => id !== waypointId);
            } else {
                return [...prev, waypointId];
            }
        });
    };

    const handleCreateRoute = () => {
        if (selectedWaypoints.length === 0) {
            alert('请至少选择一个航路点');
            return;
        }
        try {
            const routeId = createRouteFromMap(
                routeName || `地图航路 ${new Date().toLocaleTimeString()}`,
                selectedWaypoints
            );
            alert(`航路创建成功！ID: ${routeId}`);
            setSelectedWaypoints([]);
            setRouteName('');
        } catch (error) {
            alert(`创建航路失败: ${error.message}`);
        }
    };

    const handleLoadExample = () => {
        setUrlInput('./data/europe-map.json');
    };

    return React.createElement('div', {
        className: 'map-loader',
        style: {
            backgroundColor: '#1a1a2e',
            border: '1px solid #2d3748',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '16px',
            color: '#e2e8f0'
        }
    }, [
        React.createElement('h3', {
            key: 'title',
            style: {
                marginTop: '0',
                marginBottom: '16px',
                color: '#63b3ed',
                fontSize: '18px',
                borderBottom: '1px solid #2d3748',
                paddingBottom: '8px'
            }
        }, '自定义地图加载器'),

        // 状态显示
        React.createElement('div', {
            key: 'status',
            style: {
                marginBottom: '16px',
                padding: '8px',
                backgroundColor: mapData ? '#2d3748' : '#4a5568',
                borderRadius: '4px'
            }
        }, [
            React.createElement('div', {
                key: 'status-label',
                style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }
            }, [
                React.createElement('span', {
                    key: 'label',
                    style: {
                        fontWeight: 'bold',
                        color: mapData ? '#68d391' : '#e2e8f0'
                    }
                }, mapData ? `已加载地图: ${mapData.metadata?.name || '未知'}` : '未加载地图'),
                mapData && React.createElement('button', {
                    key: 'clear-btn',
                    onClick: clearMapData,
                    style: {
                        backgroundColor: '#e53e3e',
                        color: 'white',
                        border: 'none',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer'
                    }
                }, '清除地图')
            ]),
            mapData && React.createElement('div', {
                key: 'stats',
                style: {
                    fontSize: '12px',
                    color: '#a0aec0',
                    marginTop: '4px'
                }
            }, `航路点: ${mapData.waypoints?.length || 0}, 导航设施: ${mapData.navaids?.length || 0}, 航路: ${mapData.airways?.length || 0}`)
        ]),

        // 错误显示
        mapError && React.createElement('div', {
            key: 'error',
            style: {
                backgroundColor: '#fed7d7',
                color: '#9b2c2c',
                padding: '8px',
                borderRadius: '4px',
                marginBottom: '16px',
                fontSize: '14px'
            }
        }, `错误: ${mapError}`),

        // 加载选项
        React.createElement('div', {
            key: 'load-options',
            style: {
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                marginBottom: '16px'
            }
        }, [
            // URL 加载
            React.createElement('div', {
                key: 'url-load',
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                }
            }, [
                React.createElement('label', {
                    key: 'url-label',
                    style: {
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: '#63b3ed'
                    }
                }, '从 URL 加载'),
                React.createElement('div', {
                    key: 'url-input-group',
                    style: {
                        display: 'flex',
                        gap: '8px'
                    }
                }, [
                    React.createElement('input', {
                        key: 'url-input',
                        type: 'text',
                        value: urlInput,
                        onChange: (e) => setUrlInput(e.target.value),
                        placeholder: '输入地图 JSON URL',
                        style: {
                            flex: 1,
                            padding: '8px',
                            backgroundColor: '#2d3748',
                            border: '1px solid #4a5568',
                            borderRadius: '4px',
                            color: '#e2e8f0'
                        }
                    }),
                    React.createElement('button', {
                        key: 'url-btn',
                        onClick: handleUrlLoad,
                        disabled: mapLoading || !urlInput.trim(),
                        style: {
                            backgroundColor: '#4299e1',
                            color: 'white',
                            border: 'none',
                            padding: '8px 12px',
                            borderRadius: '4px',
                            cursor: mapLoading || !urlInput.trim() ? 'not-allowed' : 'pointer',
                            opacity: mapLoading || !urlInput.trim() ? 0.6 : 1
                        }
                    }, mapLoading ? '加载中...' : '加载')
                ]),
                React.createElement('button', {
                    key: 'example-btn',
                    onClick: handleLoadExample,
                    style: {
                        backgroundColor: '#38a169',
                        color: 'white',
                        border: 'none',
                        padding: '8px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px'
                    }
                }, '加载示例地图 (欧洲)')
            ]),

            // 文件加载
            React.createElement('div', {
                key: 'file-load',
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                }
            }, [
                React.createElement('label', {
                    key: 'file-label',
                    style: {
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: '#63b3ed'
                    }
                }, '从文件加载'),
                React.createElement('label', {
                    key: 'file-input-label',
                    htmlFor: 'map-file-input',
                    style: {
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '12px',
                        backgroundColor: '#2d3748',
                        border: '2px dashed #4a5568',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        textAlign: 'center',
                        color: '#a0aec0',
                        transition: 'all 0.2s'
                    },
                    onMouseEnter: (e) => e.target.style.backgroundColor = '#4a5568',
                    onMouseLeave: (e) => e.target.style.backgroundColor = '#2d3748'
                }, [
                    React.createElement('span', { key: 'text' }, mapLoading ? '加载中...' : '点击选择地图 JSON 文件'),
                    React.createElement('input', {
                        key: 'file-input',
                        id: 'map-file-input',
                        type: 'file',
                        accept: '.json',
                        onChange: handleFileLoad,
                        style: {
                            display: 'none'
                        }
                    })
                ]),
                React.createElement('div', {
                    key: 'file-hint',
                    style: {
                        fontSize: '12px',
                        color: '#a0aec0',
                        textAlign: 'center'
                    }
                }, '支持标准地图 JSON 格式'),
                // Download template button
                React.createElement('button', {
                    key: 'download-template-btn',
                    onClick: () => {
                        const a = document.createElement('a');
                        a.href = './data/map-template.json';
                        a.download = 'map-template.json';
                        a.click();
                    },
                    style: {
                        backgroundColor: '#805ad5',
                        color: 'white',
                        border: 'none',
                        padding: '8px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        marginTop: '8px',
                        width: '100%'
                    }
                }, '📥 下载地图模板')
            ])
        ]),

        // 航路点选择器（仅当有地图数据时显示）
        mapData && mapData.waypoints && mapData.waypoints.length > 0 && React.createElement('div', {
            key: 'waypoint-selector',
            style: {
                marginTop: '16px',
                borderTop: '1px solid #2d3748',
                paddingTop: '16px'
            }
        }, [
            React.createElement('h4', {
                key: 'selector-title',
                style: {
                    marginTop: '0',
                    marginBottom: '12px',
                    color: '#68d391',
                    fontSize: '16px'
                }
            }, '从地图创建航路'),

            // 航路名称输入
            React.createElement('div', {
                key: 'route-name-input',
                style: {
                    marginBottom: '12px'
                }
            }, [
                React.createElement('input', {
                    key: 'name-input',
                    type: 'text',
                    value: routeName,
                    onChange: (e) => setRouteName(e.target.value),
                    placeholder: '输入航路名称（可选）',
                    style: {
                        width: '100%',
                        padding: '8px',
                        backgroundColor: '#2d3748',
                        border: '1px solid #4a5568',
                        borderRadius: '4px',
                        color: '#e2e8f0'
                    }
                })
            ]),

            // 航路点列表
            React.createElement('div', {
                key: 'waypoint-list',
                style: {
                    maxHeight: '200px',
                    overflowY: 'auto',
                    backgroundColor: '#2d3748',
                    borderRadius: '4px',
                    padding: '8px',
                    marginBottom: '12px'
                }
            }, mapData.waypoints.slice(0, 20).map((wp, index) => React.createElement('div', {
                key: wp.id,
                style: {
                    display: 'flex',
                    alignItems: 'center',
                    padding: '6px 8px',
                    borderBottom: index < mapData.waypoints.slice(0, 20).length - 1 ? '1px solid #4a5568' : 'none',
                    cursor: 'pointer',
                    backgroundColor: selectedWaypoints.includes(wp.id) ? '#4a5568' : 'transparent',
                    transition: 'background-color 0.2s'
                },
                onClick: () => handleWaypointToggle(wp.id)
            }, [
                React.createElement('input', {
                    key: 'checkbox',
                    type: 'checkbox',
                    checked: selectedWaypoints.includes(wp.id),
                    onChange: () => handleWaypointToggle(wp.id),
                    style: {
                        marginRight: '8px'
                    }
                }),
                React.createElement('div', {
                    key: 'info',
                    style: {
                        flex: 1
                    }
                }, [
                    React.createElement('div', {
                        key: 'name',
                        style: {
                            fontWeight: 'bold',
                            color: '#63b3ed'
                        }
                    }, `${wp.name} (${wp.type})`),
                    React.createElement('div', {
                        key: 'coords',
                        style: {
                            fontSize: '12px',
                            color: '#a0aec0'
                        }
                    }, `坐标: (${wp.x}, ${wp.y})`)
                ])
            ]))),

            // 创建航路按钮
            React.createElement('button', {
                key: 'create-route-btn',
                onClick: handleCreateRoute,
                disabled: selectedWaypoints.length === 0,
                style: {
                    width: '100%',
                    backgroundColor: selectedWaypoints.length > 0 ? '#38a169' : '#4a5568',
                    color: 'white',
                    border: 'none',
                    padding: '10px',
                    borderRadius: '4px',
                    cursor: selectedWaypoints.length > 0 ? 'pointer' : 'not-allowed',
                    fontWeight: 'bold',
                    fontSize: '14px'
                }
            }, `创建航路 (${selectedWaypoints.length} 个航路点)`)
        ]),

        // 提示信息
        !mapData && React.createElement('div', {
            key: 'hint',
            style: {
                marginTop: '16px',
                padding: '12px',
                backgroundColor: '#2d3748',
                borderRadius: '4px',
                fontSize: '14px',
                color: '#a0aec0'
            }
        }, [
            React.createElement('p', {
                key: 'hint-text',
                style: {
                    margin: '0 0 8px 0'
                }
            }, '💡 提示: 加载自定义地图文件以扩展导航数据。地图文件应为 JSON 格式，包含航路点、导航设施和航路信息。'),
            React.createElement('p', {
                key: 'example-text',
                style: {
                    margin: '0',
                    fontSize: '12px'
                }
            }, '示例: 点击"加载示例地图"按钮使用预定义的欧洲区域地图。')
        ])
    ]);
};

export default MapLoader;