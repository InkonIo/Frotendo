import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Polygon, useMapEvents } from 'react-leaflet';
import { FeatureGroup } from 'react-leaflet'; // Import FeatureGroup
import { EditControl } from 'react-leaflet-draw'; // Import EditControl
import 'leaflet-draw/dist/leaflet.draw.css'; // Import leaflet-draw CSS
import * as L from 'leaflet'; // Import Leaflet library
import { latLngsToGeoJSON } from "./geoUtils"; // Assuming this utility is correct
import './Map.css';

// Custom hook for drawing polygons (remains the same)
function DrawingHandler({ onPolygonComplete, onStopAndSave, isDrawing, setIsDrawing }) {
  const [currentPath, setCurrentPath] = useState([]);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const location = useLocation();

  // Expose current path to parent component (still useful for manual stop and save)
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

export default function PolygonDrawMap() {
  const [activeSection, setActiveSection] = useState('home');
  const navigate = useNavigate();
  const [polygons, setPolygons] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedPolygon, setSelectedPolygon] = useState(null);
  const [crops, setCrops] = useState([]);
  const [loadingCrops, setLoadingCrops] = useState(false);
  const [cropsError, setCropsError] = useState(null);
  const [showMenu, setShowMenu] = useState(false); 
  const mapRef = useRef(null);

  // State for editing
  const [isEditing, setIsEditing] = useState(false);
  const [editingPolygon, setEditingPolygon] = useState(null); // This will hold the polygon object being edited
  const editableFGRef = useRef(); // Reference to FeatureGroup for EditControl

  // Effect for handling burger menu click outside (moved from DrawingHandler)
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

  // Effect for updating active section based on path (moved from DrawingHandler)
  useEffect(() => {
    if (location.pathname === '/') setActiveSection('home');
    else if (location.pathname === '/dashboard') setActiveSection('map'); // Assuming '/dashboard' is for the map
    else if (location.pathname === '/chat') setActiveSection('ai-chat');
    else if (location.pathname === '/earthdata') setActiveSection('soil-data');
  }, [location.pathname]);

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
        setCrops(fallbackCrops);
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

  // Load crops on first render
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

  // --- Polygon Editing Logic (Moved and Centralized) ---
  const handleEditPolygon = useCallback((polygonId) => {
    const polygonToEdit = polygons.find((p) => p.id === polygonId);
    if (!polygonToEdit) return;

    // Remove any existing layers from the editable feature group
    editableFGRef.current.clearLayers();

    // Add the polygon to be edited to the FeatureGroup
    const leafletPolygon = L.polygon(polygonToEdit.coordinates);
    editableFGRef.current.addLayer(leafletPolygon);

    // Set the state for editing
    setEditingPolygon(polygonToEdit);
    setIsEditing(true);

    // Programmatically enable editing for the added layer
    if (leafletPolygon.editing) {
      leafletPolygon.editing.enable();
    }
  }, [polygons]); // Re-create if polygons change

  const onPolygonEdited = useCallback(async (e) => {
    const editedLayers = e.layers;
    editedLayers.eachLayer(async (layer) => {
      const geoJson = layer.toGeoJSON();
      // leaflet-draw returns coordinates as [lng, lat] for GeoJSON,
      // so we convert back to [lat, lng] for our internal state
      const updatedCoords = geoJson.geometry.coordinates[0].map(coord => [coord[1], coord[0]]); 

      const updatedPolygon = {
        ...editingPolygon, // Use the stored editingPolygon
        coordinates: updatedCoords,
        geoJson: geoJson, // Store the GeoJSON if needed
        updatedAt: new Date().toISOString(),
      };

      // Update state
      setPolygons((prev) =>
        prev.map(p => p.id === updatedPolygon.id ? updatedPolygon : p)
      );

      // Save to DB (assuming you have a token and endpoint)
      // Make sure 'token' is accessible here (e.g., passed as prop, from context, or global state)
      const token = 'YOUR_AUTH_TOKEN'; // Replace with actual token retrieval
      try {
        await fetch(`/api/v1/polygons/${updatedPolygon.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            name: updatedPolygon.name, // Assuming name and crop are part of your polygon structure
            crop: updatedPolygon.crop,
            geometry: updatedPolygon.geoJson // Send the GeoJSON for the database
          }),
        });
        console.log(`Polygon ${updatedPolygon.id} updated in DB.`);
      } catch (error) {
        console.error('Error saving edited polygon to DB:', error);
      }
    });

    // Reset editing state
    setIsEditing(false);
    setEditingPolygon(null);
    editableFGRef.current.clearLayers(); // Clear the editable layer after save
  }, [editingPolygon, setPolygons]); // Re-create if editingPolygon or setPolygons changes

  // Styles (remain the same)
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
    display: 'flex',
    flexDirection: 'row',
  };

  const mapContainerStyle = {
    flex: 1,
    height: '100%',
    position: 'relative',
    width: '100%',
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

          {/* FeatureGroup for editing control */}
          <FeatureGroup ref={editableFGRef}>
            <EditControl
  position="topright"
  onEdited={onPolygonEdited}
  draw={{ rectangle: false, polyline: false, circle: false, marker: false, circlemarker: false }}
  edit={{
    // Опции для редактирования
    featureGroup: editableFGRef.current, // Указываем FeatureGroup, которым управляет EditControl
    // Ниже можно добавить опции стилизации или поведения, например:
    // selectedPathOptions: {
    //   dashArray: '10, 10',
    //   weight: 4,
    //   color: '#0000ff'
    // },
    // poly: { allowIntersection: false }, // Пример дополнительной опции
  }}
/>
            {/* Render existing polygons here, outside EditControl, unless they are the ones being edited by leaflet-draw */}
            {polygons.map((p) => (
              <Polygon
                key={p.id}
                positions={p.coordinates}
                pathOptions={{
                  color: p.color,
                  fillOpacity: selectedPolygon === p.id ? 0.6 : 0.3,
                  weight: selectedPolygon === p.id ? 3 : 2,
                }}
                eventHandlers={{
                  click: () => setSelectedPolygon(p.id),
                }}
              />
            ))}
          </FeatureGroup>
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


        {polygons.length > 0 && (
          <div style={sidebarStyle}>
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

                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent polygon selection
                          handleEditPolygon(polygon.id);
                        }}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#ffc107',
                          color: '#000',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '11px',
                        }}
                      >
                        ✏️ Редактировать
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
    </div>
  );
}