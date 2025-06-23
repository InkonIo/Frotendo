import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Polygon, useMapEvents } from 'react-leaflet';
import './Map.css';


// Custom hook for drawing polygons (remains the same)
function DrawingHandler({ onPolygonComplete, onStopAndSave, isDrawing, setIsDrawing }) {
  const [currentPath, setCurrentPath] = useState([]);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [showMenu, setShowMenu] = useState(false); // This state is local to DrawingHandler, likely not intended to control global menu
  const [activeSection, setActiveSection] = useState(''); // This state is local to DrawingHandler, likely not intended to control global active section
  const navigate = useNavigate();
  const location = useLocation();

  // Consider if activeSection and showMenu should be managed higher up if they control the main app navigation/menu.
  React.useEffect(() => {
    // Обновляем активный раздел при смене пути
    if (location.pathname === '/') setActiveSection('home');
    else if (location.pathname === '/dashboard') setActiveSection('map');
    else if (location.pathname === '/chat') setActiveSection('ai-chat');
    else if (location.pathname === '/earthdata') setActiveSection('soil-data');
  }, [location.pathname]);

  useEffect(() => {
  const handleClickOutside = (event) => {
    if (!event.target.closest('.burger-menu')) {
      setShowMenu(false);
    }
  };

  document.addEventListener('click', handleClickOutside);
  return () => {
    document.removeEventListener('click', handleClickOutside);
  };
}, []);
  
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
      setCurrentPath((prev) => [...prev, newPoint]);
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
    },
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

// Ensure this style is consistent or removed if not needed for burger menu buttons
// const menuBtnStyle = (active) => ({
//   display: 'block',
//   width: '100%',
//   padding: '10px 16px',
//   textAlign: 'left',
//   backgroundColor: active ? '#e0f2fe' : 'white',
//   border: 'none',
//   borderBottom: '1px solid #ddd',
//   cursor: 'pointer',
//   fontWeight: active ? 'bold' : 'normal',
//   transition: 'background-color 0.2s ease',
// });


export default function PolygonDrawMap() {
  const [activeSection, setActiveSection] = useState('home'); // This should control the main app active section
  const navigate = useNavigate();
  const [polygons, setPolygons] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedPolygon, setSelectedPolygon] = useState(null);
  const [crops, setCrops] = useState([]);
  const [loadingCrops, setLoadingCrops] = useState(false);
  const [cropsError, setCropsError] = useState(null);
  const [showMenu, setShowMenu] = useState(false); // ✅ Correctly placed for the main component's burger menu
  const mapRef = useRef(null);

  const handleNavigate = (path, section) => {
    setShowMenu(false);
    setActiveSection(section);
    navigate(path);
  };

  const handleLogout = () => {
    // Placeholder for actual logout logic
    alert('Logged out!');
    navigate('/login'); // Example: redirect to login
  };

  // Function to fetch crop list from Wikipedia API (remains the same)
  const fetchCropsFromAPI = async () => {
    setLoadingCrops(true);
    setCropsError(null);

    try {
      const response = await fetch(
        'https://ru.wikipedia.org/w/api.php?' +
          new URLSearchParams({
            action: 'query',
            format: 'json',
            list: 'categorymembers',
            cmtitle: 'Категория:Овощи',
            cmlimit: '100',
            cmtype: 'page',
            origin: '*',
          })
      );

      if (!response.ok) {
        throw new Error('Ошибка загрузки данных');
      }

      const data = await response.json();

      if (data.query && data.query.categorymembers) {
        const vegetableNames = data.query.categorymembers
          .map((item) => item.title)
          .filter(
            (title) =>
              !title.includes(':') &&
              !title.includes('Категория') &&
              !title.includes('Список') &&
              !title.includes('Template') &&
              title.length < 50
          )
          .sort();

        setCrops(vegetableNames);
      } else {
        const fallbackCrops = [
          'Томаты', 'Огурцы', 'Морковь', 'Свёкла', 'Лук', 'Чеснок', 'Картофель', 'Капуста',
          'Перец', 'Баклажаны', 'Кабачки', 'Тыква', 'Редис', 'Петрушка', 'Укроп', 'Салат',
          'Шпинат', 'Брокколи', 'Цветная капуста', 'Брюссельская капуста', 'и не только',
        ];
        setCrops(fallbackCres);
      }
    } catch (error) {
      console.error('Ошибка при загрузке культур:', error);
      setCropsError('Не удалось загрузить список культур');

      const fallbackCrops = [
        'Томаты', 'Огурцы', 'Морковь', 'Свёкла', 'Лук', 'Чеснок', 'Картофель', 'Капуста',
        'Перец', 'Баклажаны', 'Кабачки', 'Тыква', 'Редис', 'Петрушка', 'Укроп', 'Салат',
        'Шпинат', 'Брокколи', 'Цветная капуста', 'Брюссельская капуста',
      ];
      setCrops(fallbackCrops);
    }
    setLoadingCrops(false);
  };

  // Load crops on first render (remains the same)
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
      const newPolygon = {
        id: Date.now(),
        coordinates: currentPath,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`,
        crop: null,
      };
      setPolygons((prev) => [...prev, newPolygon]);
    }
    setIsDrawing(false);
  };

  const onPolygonComplete = useCallback((coordinates) => {
    const newPolygon = {
      id: Date.now(),
      coordinates: coordinates,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
      crop: null,
    };
    setPolygons((prev) => [...prev, newPolygon]);
  }, []);

  const deletePolygon = (id) => {
    setPolygons((prev) => prev.filter((p) => p.id !== id));
    setSelectedPolygon(null);
  };

  const clearAll = () => {
    setPolygons([]);
    setSelectedPolygon(null);
    setIsDrawing(false);
  };

  const clearAllCrops = () => {
    setPolygons((prev) => prev.map((p) => ({ ...p, crop: null })));
  };

  const updatePolygonCrop = (polygonId, crop) => {
    setPolygons((prev) =>
      prev.map((p) => (p.id === polygonId ? { ...p, crop } : p))
    );
  };

  const calculateArea = (coordinates) => {
    if (coordinates.length < 3) return 0;

    const toRadians = (deg) => (deg * Math.PI) / 180;
    const R = 6371000;

    let area = 0;
    const n = coordinates.length;

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const lat1 = toRadians(coordinates[i][0]);
      const lat2 = toRadians(coordinates[j][0]);
      const deltaLon = toRadians(coordinates[j][1] - coordinates[i][1]);

      const E =
        2 *
        Math.asin(
          Math.sqrt(
            Math.pow(Math.sin((lat2 - lat1) / 2), 2) +
              Math.cos(lat1) *
                Math.cos(lat2) *
                Math.pow(Math.sin(deltaLon / 2), 2)
          )
        );

      area += E * R * R;
    }

    return Math.abs(area) / 2;
  };

  const formatArea = (area) => {
    if (area < 1000) return `${area.toFixed(1)} м²`;
    if (area < 1000000) return `${(area / 1000).toFixed(1)} км²`;
    return `${(area / 1000000).toFixed(1)} км²`;
  };

  const containerStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    backgroundColor: '#fff',
    padding: 0,
    margin: 0,
    maxWidth: 'none',
    display: 'flex', // Added to manage map and sidebar side-by-side
    flexDirection: 'row', // Added for map and sidebar layout
  };

  const mapContainerStyle = {
    flex: 1, // Allows map to take available space
    height: '100%',
    position: 'relative',
    width: '100%', // Will be overridden by flex: 1
  };

  const sidebarStyle = {
    width: '30%',
    height: '100vh',
    overflowY: 'auto',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderLeft: '1px solid #dee2e6',
    fontFamily: 'Arial, sans-serif',
  };

  return (
    <div style={containerStyle}> 
    {/* This is the single root element */}
      {/* Map and sidebar container (this now contains everything else) */}
      {/* The original 'height: 100vh, display: flex, flexDirection: row' is moved to containerStyle */}
      
        {/* Map Container */}
        <div style={mapContainerStyle}>
          <MapContainer
            center={[43.2567, 76.9286]}
            zoom={13}
            style={{ height: '100%' }}
            ref={mapRef}
          >
            <TileLayer
              attribution="&copy; Google"
              url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
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
                  weight: selectedPolygon === polygon.id ? 3 : 2,
                }}
                eventHandlers={{
                  click: () => setSelectedPolygon(polygon.id),
                }}
              />
            ))}
          </MapContainer>

                    <div className="map-sidebar">
            <button
              onClick={() => handleNavigate('/', 'home')}
              className={`map-sidebar-button ${activeSection === 'home' ? 'active' : ''}`}
            >
              🏠 Главная
            </button>
            <button
              onClick={() => handleNavigate('/chat', 'ai-chat')}
              className={`map-sidebar-button ${activeSection === 'ai-chat' ? 'active' : ''}`}
            >
              🤖 ИИ-чат
            </button>
            <button
              onClick={() => handleNavigate('/earthdata', 'soil-data')}
              className={`map-sidebar-button ${activeSection === 'soil-data' ? 'active' : ''}`}
            >
              🌱 Данные почвы
            </button>
            <button
              onClick={handleLogout}
              className="map-sidebar-button"
            >
              🚪 Выйти
            </button>

            <hr style={{ border: 'none', height: '1px', background: '#555', margin: '12px 0' }} />

            <button
              onClick={startDrawing}
              disabled={isDrawing}
              className="map-sidebar-button draw"
            >
              {isDrawing ? '✏️ Рисую...' : '✏️ Начать рисование'}
            </button>

            <button
              onClick={() => {
                if (window.getCurrentPath) {
                  const currentPath = window.getCurrentPath();
                  stopAndSaveDrawing(currentPath);
                  if (window.clearCurrentPath) window.clearCurrentPath();
                } else {
                  stopDrawing();
                }
              }}
              disabled={!isDrawing}
              className="map-sidebar-button stop"
            >
              💾 Остановить и сохранить
            </button>

            <button
              onClick={clearAll}
              className="map-sidebar-button clear"
            >
              🗑️ Очистить все
            </button>
          </div>


        {/* Sidebar with polygons and crops (now correctly inside the main container) */}
        {polygons.length > 0 && (
          <div style={sidebarStyle}>
            {/* Polygons section */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '18px' }}>
                📐 Полигоны ({polygons.length})
              </h3>

              <div style={{ maxHeight: '40vh' }}>
                {polygons.map((polygon, idx) => (
                  <div
                    key={polygon.id}
                    style={{
                      marginBottom: '12px',
                      padding: '10px',
                      backgroundColor:
                        selectedPolygon === polygon.id ? '#e3f2fd' : '#fff',
                      border:
                        selectedPolygon === polygon.id
                          ? '2px solid #2196f3'
                          : '1px solid #e0e0e0',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    }}
                    onClick={() => setSelectedPolygon(polygon.id)}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px',
                      }}
                    >
                      <strong style={{ color: '#333', fontSize: '14px' }}>
                        Полигон #{idx + 1}
                      </strong>
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
                          fontSize: '11px',
                        }}
                      >
                        Удалить
                      </button>
                    </div>

                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                      <div
                        style={{
                          display: 'flex',
                          gap: '15px',
                          flexWrap: 'wrap',
                          alignItems: 'center',
                        }}
                      >
                        <span>Точек: {polygon.coordinates.length}</span>
                        <span>Площадь: {formatArea(calculateArea(polygon.coordinates))}</span>
                        <div
                          style={{
                            width: '18px',
                            height: '18px',
                            backgroundColor: polygon.color,
                            borderRadius: '4px',
                            border: '1px solid #ddd',
                          }}
                        ></div>
                      </div>
                    </div>

                    {polygon.crop && (
                      <div
                        style={{
                          fontSize: '12px',
                          color: '#2e7d32',
                          fontWeight: 'bold',
                          backgroundColor: '#e8f5e8',
                          padding: '5px 8px',
                          borderRadius: '4px',
                          marginBottom: '5px',
                        }}
                      >
                        🌾 {polygon.crop}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Crops assignment section */}
            <div
              style={{
                backgroundColor: '#fff',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
            >
              <div
                style={{
                  backgroundColor: '#f8f9fa',
                  padding: '12px',
                  borderBottom: '1px solid #dee2e6',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
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
                      fontSize: '11px',
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
                      fontSize: '11px',
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {cropsError && (
                <div
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#f8d7da',
                    color: '#721c24',
                    fontSize: '11px',
                  }}
                >
                  ⚠️ {cropsError}
                </div>
              )}

              <div
                style={{
                  padding: '12px',
                  maxHeight: '40vh',
                  overflowY: 'auto',
                }}
              >
                {polygons.map((polygon, idx) => (
                  <div
                    key={polygon.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '10px',
                      padding: '8px',
                      backgroundColor:
                        selectedPolygon === polygon.id ? '#e3f2fd' : '#f8f9fa',
                      borderRadius: '4px',
                      border: '1px solid #e0e0e0',
                    }}
                  >
                    <div
                      style={{
                        width: '14px',
                        height: '14px',
                        backgroundColor: polygon.color,
                        borderRadius: '3px',
                        flexShrink: 0,
                      }}
                    ></div>

                    <div
                      style={{
                        fontSize: '12px',
                        fontWeight: 'bold',
                        minWidth: '50px',
                      }}
                    >
                      #{idx + 1}
                    </div>

                    <div
                      style={{
                        fontSize: '10px',
                        color: '#666',
                        minWidth: '50px',
                      }}
                    >
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
                        minWidth: '120px',
                      }}
                    >
                      <option value="">Выберите культуру</option>
                      {crops.map((crop) => (
                        <option key={crop} value={crop}>
                          {crop}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}

                {/* Summary */}
                <div
                  style={{
                    marginTop: '15px',
                    padding: '10px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '6px',
                    border: '1px solid #e9ecef',
                    fontSize: '11px',
                  }}
                >
                  <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>Сводка:</div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '5px',
                    }}
                  >
                    <div>Полигонов: {polygons.length}</div>
                    <div>С культурами: {polygons.filter((p) => p.crop).length}</div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      Общая площадь:{' '}
                      {formatArea(
                        polygons.reduce((total, p) => total + calculateArea(p.coordinates), 0)
                      )}
                    </div>
                  </div>

                  {/* Breakdown by crops */}
                  {polygons.some((p) => p.crop) && (
                    <div style={{ marginTop: '10px' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>По культурам:</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {Object.entries(
                          polygons
                            .filter((p) => p.crop)
                            .reduce((acc, p) => {
                              const area = calculateArea(p.coordinates);
                              acc[p.crop] = (acc[p.crop] || 0) + area;
                              return acc;
                            }, {})
                        ).map(([crop, area]) => (
                          <div
                            key={crop}
                            style={{
                              padding: '2px 6px',
                              backgroundColor: '#e8f5e8',
                              borderRadius: '3px',
                              fontSize: '10px',
                              color: '#2e7d32',
                            }}
                          >
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

      {/* Drawing instructions (now correctly inside the main container and positioned absolutely) */}
      {isDrawing && (
        <div
          style={{
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
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
          }}
        >
          <div
            style={{ fontWeight: 'bold', marginBottom: '8px', color: '#4CAF50' }}
          >
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
    /</div>
  );
}