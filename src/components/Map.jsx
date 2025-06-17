import React, { useState, useRef, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, useMapEvents } from 'react-leaflet';

// Custom hook for drawing polygons
function DrawingHandler({ onPolygonComplete, onStopAndSave, isDrawing, setIsDrawing }) {
  const [currentPath, setCurrentPath] = useState([]);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  
  // Expose current path to parent component
  React.useEffect(() => {
    if (onStopAndSave) {
      window.getCurrentPath = () => currentPath;
      window.clearCurrentPath = () => setCurrentPath([]);
    }
  }, [currentPath, onStopAndSave]);
  
  useMapEvents({
    click: (e) => {
      if (!isDrawing) return;
      
      const newPoint = [e.latlng.lat, e.latlng.lng];
      setCurrentPath(prev => [...prev, newPoint]);
    },
    dblclick: (e) => {
      if (!isDrawing || currentPath.length < 3) return;
      
      // Complete the polygon
      onPolygonComplete(currentPath);
      setCurrentPath([]);
      setIsDrawing(false);
    },
    mousemove: (e) => {
      if (isDrawing && currentPath.length > 0) {
        setHoveredPoint([e.latlng.lat, e.latlng.lng]);
      }
    }
  });

  // Render the current drawing path
  if (currentPath.length > 0) {
    const displayPath = hoveredPoint && currentPath.length >= 1 
      ? [...currentPath, hoveredPoint]
      : currentPath;
      
    if (displayPath.length > 2) {
      return (
        <Polygon 
          positions={displayPath} 
          pathOptions={{ 
            color: 'blue', 
            fillOpacity: 0.2,
            dashArray: '5, 5',
            weight: 2
          }} 
        />
      );
    }
  }
  
  return null;
}

export default function PolygonDrawMap() {
  const [polygons, setPolygons] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedPolygon, setSelectedPolygon] = useState(null);
  const [crops, setCrops] = useState([]);
  const [loadingCrops, setLoadingCrops] = useState(false);
  const [cropsError, setCropsError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mapRef = useRef(null);

  // Функция для получения списка овощных культур из Wikipedia API
  const fetchCropsFromAPI = async () => {
    setLoadingCrops(true);
    setCropsError(null);
    
    try {
      // Используем Wikipedia API для получения категории "Овощи"
      const response = await fetch(
        'https://ru.wikipedia.org/w/api.php?' +
        new URLSearchParams({
          action: 'query',
          format: 'json',
          list: 'categorymembers',
          cmtitle: 'Категория:Овощи',
          cmlimit: '100',
          cmtype: 'page',
          origin: '*'
        })
      );
      
      if (!response.ok) {
        throw new Error('Ошибка загрузки данных');
      }
      
      const data = await response.json();
      
      if (data.query && data.query.categorymembers) {
        // Фильтруем и очищаем названия овощей
        const vegetableNames = data.query.categorymembers
          .map(item => item.title)
          .filter(title => 
            !title.includes(':') && // Исключаем служебные страницы
            !title.includes('Категория') &&
            !title.includes('Список') &&
            !title.includes('Template') &&
            title.length < 50 // Исключаем слишком длинные названия
          )
          .sort();
        
        setCrops(vegetableNames);
      } else {
        // Fallback список, если API не работает
        const fallbackCrops = [
          'Томаты', 'Огурцы', 'Морковь', 'Свёкла', 'Лук', 'Чеснок',
          'Картофель', 'Капуста', 'Перец', 'Баклажаны', 'Кабачки',
          'Тыква', 'Редис', 'Петрушка', 'Укроп', 'Салат', 'Шпинат',
          'Брокколи', 'Цветная капуста', 'Брюссельская капуста'
        ];
        setCrops(fallbackCrops);
      }
    } catch (error) {
      console.error('Ошибка при загрузке культур:', error);
      setCropsError('Не удалось загрузить список культур');
      
      // Используем резервный список
      const fallbackCrops = [
        'Томаты', 'Огурцы', 'Морковь', 'Свёкла', 'Лук', 'Чеснок',
        'Картофель', 'Капуста', 'Перец', 'Баклажаны', 'Кабачки',
        'Тыква', 'Редис', 'Петрушка', 'Укроп', 'Салат', 'Шпинат',
        'Брокколи', 'Цветная капуста', 'Брюссельская капуста'
      ];
      setCrops(fallbackCrops);
    }
    
    setLoadingCrops(false);
  };

  // Загружаем культуры при первом рендере
  useEffect(() => {
    fetchCropsFromAPI();
  }, []);

  const startDrawing = () => {
    setIsDrawing(true);
    setSelectedPolygon(null);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const stopAndSaveDrawing = (currentPath) => {
    if (currentPath && currentPath.length >= 3) {
      // Сохраняем текущий рисунок как полигон
      const newPolygon = {
        id: Date.now(),
        coordinates: currentPath,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`,
        crop: null // Изначально культура не выбрана
      };
      setPolygons(prev => [...prev, newPolygon]);
    }
    setIsDrawing(false);
  };

  const onPolygonComplete = useCallback((coordinates) => {
    const newPolygon = {
      id: Date.now(),
      coordinates: coordinates,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
      crop: null // Изначально культура не выбрана
    };
    setPolygons(prev => [...prev, newPolygon]);
  }, []);

  const deletePolygon = (id) => {
    setPolygons(prev => prev.filter(p => p.id !== id));
    setSelectedPolygon(null);
  };

  const clearAll = () => {
    setPolygons([]);
    setSelectedPolygon(null);
    setIsDrawing(false);
  };

  // Функция очистки всех выбранных культур
  const clearAllCrops = () => {
    setPolygons(prev => prev.map(p => ({ ...p, crop: null })));
  };

  const updatePolygonCrop = (polygonId, crop) => {
    setPolygons(prev => prev.map(p => 
      p.id === polygonId ? { ...p, crop } : p
    ));
  };

  const calculateArea = (coordinates) => {
    // Calculate area in square meters using geographic coordinates
    if (coordinates.length < 3) return 0;
    
    // Convert to approximate area in square meters
    const toRadians = (deg) => deg * Math.PI / 180;
    const R = 6371000; // Earth's radius in meters
    
    let area = 0;
    const n = coordinates.length;
    
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const lat1 = toRadians(coordinates[i][0]);
      const lat2 = toRadians(coordinates[j][0]);
      const deltaLon = toRadians(coordinates[j][1] - coordinates[i][1]);
      
      const E = 2 * Math.asin(Math.sqrt(
        Math.pow(Math.sin((lat2 - lat1) / 2), 2) +
        Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin(deltaLon / 2), 2)
      ));
      
      area += E * R * R;
    }
    
    return Math.abs(area) / 2;виепкнек
  };

  const formatArea = (area) => {
    if (area < 1000) return `${area.toFixed(1)} м²`;
    if (area < 1000000) return `${(area / 1000).toFixed(1)} км²`;
    return `${(area / 1000000).toFixed(1)} км²`;
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const containerStyle = isFullscreen ? {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    backgroundColor: '#fff',
    padding: 0,
    margin: 0,
    maxWidth: 'none'
  } : {
    maxWidth: '1400px',
    margin: '80px auto 20px auto',
    padding: '0 10px'
  };

  const mapContainerStyle = isFullscreen ? {
    width: polygons.length > 0 ? '70%' : '100%',
    height: '100vh',
    position: 'relative'
  } : {
    width: polygons.length > 0 ? '60%' : '100%',
    height: '500px',
    position: 'relative'
  };

  const sidebarStyle = isFullscreen ? {
    width: '30%',
    height: '100vh',
    overflowY: 'auto',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderLeft: '1px solid #dee2e6',
    fontFamily: 'Arial, sans-serif'
  } : {
    width: '40%',
    height: '500px',
    overflowY: 'auto',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderLeft: '1px solid #dee2e6',
    fontFamily: 'Arial, sans-serif'
  };

  return (
    <div style={containerStyle}>
      {/* Fullscreen toggle button */}
      <button
        onClick={toggleFullscreen}
        style={{
          position: isFullscreen ? 'fixed' : 'absolute',
          top: isFullscreen ? '15px' : '10px',
          right: isFullscreen ? '15px' : '10px',
          zIndex: 10000,
          padding: '10px 15px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
        }}
      >
        {isFullscreen ? '📉 Свернуть' : '📈 Расширить карту'}
      </button>

      {/* Map and sidebar container */}
      <div style={{ 
        height: isFullscreen ? '100vh' : '500px', 
        display: 'flex', 
        flexDirection: 'row',
        marginBottom: isFullscreen ? 0 : '20px'
      }}>
        {/* Map Container */}
        <div style={mapContainerStyle}>
          <MapContainer 
            center={[43.2567, 76.9286]} 
            zoom={13} 
            style={{ height: '100%' }}
            ref={mapRef}
          >
            <TileLayer
              attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Drawing handler */}
            <DrawingHandler 
              onPolygonComplete={onPolygonComplete}
              onStopAndSave={stopAndSaveDrawing}
              isDrawing={isDrawing}
              setIsDrawing={setIsDrawing}
            />
            
            {/* Render existing polygons */}
            {polygons.map((polygon) => (
              <Polygon
                key={polygon.id}
                positions={polygon.coordinates}
                pathOptions={{ 
                  color: polygon.color, 
                  fillOpacity: selectedPolygon === polygon.id ? 0.6 : 0.3,
                  weight: selectedPolygon === polygon.id ? 3 : 2
                }}
                eventHandlers={{
                  click: () => setSelectedPolygon(polygon.id)
                }}
              />
            ))}
          </MapContainer>
          
          {/* Control buttons */}
          <div style={{
            position: 'absolute',
            top: '60px',
            left: '10px',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            gap: '5px'
          }}>
            <button
              onClick={startDrawing}
              disabled={isDrawing}
              style={{
                padding: '10px 15px',
                backgroundColor: isDrawing ? '#ccc' : '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: isDrawing ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: 'bold'
              }}
            >
              {isDrawing ? '✏️ Рисую...' : '✏️ Начать рисование'}
            </button>
            
            <button
              onClick={() => {
                // Получаем текущий путь и сохраняем его
                if (window.getCurrentPath) {
                  const currentPath = window.getCurrentPath();
                  stopAndSaveDrawing(currentPath);
                  if (window.clearCurrentPath) {
                    window.clearCurrentPath();
                  }
                } else {
                  stopDrawing();
                }
              }}
              disabled={!isDrawing}
              style={{
                padding: '10px 15px',
                backgroundColor: !isDrawing ? '#ccc' : '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: !isDrawing ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: 'bold'
              }}
            >
              💾 Остановить и сохранить
            </button>
            
            <button
              onClick={clearAll}
              style={{
                padding: '10px 15px',
                backgroundColor: '#ff9800',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 'bold'
              }}
            >
              🗑️ Очистить все
            </button>
          </div>
          
          {/* Drawing instructions */}
          {isDrawing && (
            <div style={{
              position: 'absolute',
              bottom: '15px',
              left: '15px',
              backgroundColor: 'rgba(0,0,0,0.85)',
              color: 'white',
              padding: '15px',
              borderRadius: '8px',
              fontSize: '14px',
              zIndex: 1000,
              maxWidth: '320px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#4CAF50' }}>
                📍 Режим рисования активен
              </div>
              <div style={{ lineHeight: '1.4' }}>
                <div>• Кликайте для добавления точек</div>
                <div>• Двойной клик для автозавершения</div>
                <div>• "Остановить и сохранить" для ручного завершения</div>
                <div>• Минимум 3 точки для полигона</div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar with polygons and crops */}
        {polygons.length > 0 && (
          <div style={sidebarStyle}>
            {/* Polygons section */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '18px' }}>
                📐 Полигоны ({polygons.length})
              </h3>
              
              <div style={{ maxHeight: isFullscreen ? '40vh' : '200px', overflowY: 'auto' }}>
                {polygons.map((polygon, idx) => (
                  <div 
                    key={polygon.id} 
                    style={{
                      marginBottom: '12px',
                      padding: '10px',
                      backgroundColor: selectedPolygon === polygon.id ? '#e3f2fd' : '#fff',
                      border: selectedPolygon === polygon.id ? '2px solid #2196f3' : '1px solid #e0e0e0',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}
                    onClick={() => setSelectedPolygon(polygon.id)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <strong style={{ color: '#333', fontSize: '14px' }}>Полигон #{idx + 1}</strong>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePolygon(polygon.id);
                        }}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#f44336',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '11px'
                        }}
                      >
                        Удалить
                      </button>
                    </div>
                    
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span>Точек: {polygon.coordinates.length}</span>
                        <span>Площадь: {formatArea(calculateArea(polygon.coordinates))}</span>
                        <div style={{ 
                          width: '18px', 
                          height: '18px', 
                          backgroundColor: polygon.color, 
                          borderRadius: '4px',
                          border: '1px solid #ddd'
                        }}></div>
                      </div>
                    </div>
                    
                    {polygon.crop && (
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#2e7d32', 
                        fontWeight: 'bold',
                        backgroundColor: '#e8f5e8',
                        padding: '5px 8px',
                        borderRadius: '4px',
                        marginBottom: '5px'
                      }}>
                        🌾 {polygon.crop}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Crops assignment section */}
            <div style={{
              backgroundColor: '#fff',
              border: '1px solid #dee2e6',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '12px',
                borderBottom: '1px solid #dee2e6',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h4 style={{ margin: 0, color: '#333', fontSize: '16px' }}>
                  🌾 Назначение культур
                </h4>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={fetchCropsFromAPI}
                    disabled={loadingCrops}
                    style={{
                      padding: '6px 10px',
                      backgroundColor: loadingCrops ? '#ccc' : '#17a2b8',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: loadingCrops ? 'not-allowed' : 'pointer',
                      fontSize: '11px'
                    }}
                  >
                    {loadingCrops ? 'Загружаю...' : '🔄'}
                  </button>
                  <button
                    onClick={clearAllCrops}
                    style={{
                      padding: '6px 10px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '11px'
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
              
              {cropsError && (
                <div style={{
                  padding: '8px 12px',
                  backgroundColor: '#f8d7da',
                  color: '#721c24',
                  fontSize: '11px'
                }}>
                  ⚠️ {cropsError}
                </div>
              )}
              
              <div style={{ 
                padding: '12px', 
                maxHeight: isFullscreen ? '40vh' : '300px', 
                overflowY: 'auto' 
              }}>
                {polygons.map((polygon, idx) => (
                  <div key={polygon.id} style={{
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    marginBottom: '10px',
                    padding: '8px',
                    backgroundColor: selectedPolygon === polygon.id ? '#e3f2fd' : '#f8f9fa',
                    borderRadius: '4px',
                    border: '1px solid #e0e0e0'
                  }}>
                    <div style={{
                      width: '14px',
                      height: '14px',
                      backgroundColor: polygon.color,
                      borderRadius: '3px',
                      flexShrink: 0
                    }}></div>
                    
                    <div style={{ 
                      fontSize: '12px', 
                      fontWeight: 'bold',
                      minWidth: '50px'
                    }}>
                      #{idx + 1}
                    </div>
                    
                    <div style={{ 
                      fontSize: '10px', 
                      color: '#666',
                      minWidth: '50px'
                    }}>
                      {formatArea(calculateArea(polygon.coordinates))}
                    </div>
                    
                    <select
                      value={polygon.crop || ''}
                      onChange={(e) => updatePolygonCrop(polygon.id, e.target.value || null)}
                      style={{
                        padding: '4px 8px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        backgroundColor: '#fff',
                        fontSize: '11px',
                        cursor: 'pointer',
                        flex: 1,
                        minWidth: '120px'
                      }}
                    >
                      <option value="">Выберите культуру</option>
                      {crops.map(crop => (
                        <option key={crop} value={crop}>{crop}</option>
                      ))}
                    </select>
                  </div>
                ))}
                
                {/* Summary */}
                <div style={{
                  marginTop: '15px',
                  padding: '10px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                  border: '1px solid #e9ecef',
                  fontSize: '11px'
                }}>
                  <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>Сводка:</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                    <div>Полигонов: {polygons.length}</div>
                    <div>С культурами: {polygons.filter(p => p.crop).length}</div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      Общая площадь: {formatArea(polygons.reduce((total, p) => total + calculateArea(p.coordinates), 0))}
                    </div>
                  </div>
                  
                  {/* Breakdown by crops */}
                  {polygons.some(p => p.crop) && (
                    <div style={{ marginTop: '10px' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>По культурам:</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {Object.entries(
                          polygons
                            .filter(p => p.crop)
                            .reduce((acc, p) => {
                              const area = calculateArea(p.coordinates);
                              acc[p.crop] = (acc[p.crop] || 0) + area;
                              return acc;
                            }, {})
                        ).map(([crop, area]) => (
                          <div key={crop} style={{
                            padding: '2px 6px',
                            backgroundColor: '#e8f5e8',
                            borderRadius: '3px',
                            fontSize: '10px',
                            color: '#2e7d32'
                          }}>
                            {crop}: {formatArea(area)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}