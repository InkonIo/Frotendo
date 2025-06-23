import { MapContainer, TileLayer, Polygon, FeatureGroup } from 'react-leaflet';
import { useRef, useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Controls from './Controls';
import Instructions from './Instructions';
import DrawingHandler from './DrawingHandler';
import PolygonModal from './PolygonModal';
import L from 'leaflet';
import './Map.css';

export default function Map({
  isFullscreen,
  isDrawing,
  setIsDrawing,
  polygons = [],
  setPolygons,
  selectedPolygon,
  setSelectedPolygon,
  startDrawing,
  stopDrawing,
  clearAll,
  deletePolygon,
  formatArea,
  calculateArea,
  updatePolygonCrop,
  fetchCropsFromAPI,
  clearAllCrops,
  crops,
  cropsError,
  loadingCrops
}) {
  const featureGroupRef = useRef(null);
  const mapRef = useRef();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingCoords, setPendingCoords] = useState(null);
  const [mapCenter, setMapCenter] = useState([43.2567, 76.9286]); // Алматы

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMapCenter([latitude, longitude]);
        },
        (error) => {
          console.error("Ошибка получения геолокации:", error);
        }
      );
    } else {
      console.warn("Геолокация не поддерживается в этом браузере.");
    }
  }, []);

  const handlePolygonComplete = (coordinates) => {
    setPendingCoords(coordinates);
    setIsModalOpen(true);
    setIsDrawing(false);
  };

  const handleSavePolygon = (name, crop) => {
    const newPolygon = {
      id: Date.now(),
      name,
      crop,
      coordinates: pendingCoords,
      color: '#28a745',
    };
    setPolygons((prev) => [...prev, newPolygon]);
    setIsModalOpen(false);
    setPendingCoords(null);
  };

  return (
    <div className={`map-wrapper ${isFullscreen ? 'fullscreen' : ''}`}>
      <div className="map-sidebar-container">
        <div className="map-container" ref={mapRef}>
          <MapContainer center={mapCenter} zoom={13} style={{ height: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <FeatureGroup ref={featureGroupRef}>
              <DrawingHandler
                onPolygonComplete={handlePolygonComplete}
                isDrawing={isDrawing}
                setIsDrawing={setIsDrawing}
                featureGroupRef={featureGroupRef}
              />
            </FeatureGroup>

            {Array.isArray(polygons) &&
              polygons.map((polygon) => (
                <Polygon
                  key={polygon.id}
                  positions={polygon.coordinates}
                  pathOptions={{
                    color: polygon.color,
                    fillOpacity: selectedPolygon === polygon.id ? 0.6 : 0.3,
                    weight: selectedPolygon === polygon.id ? 3 : 2
                  }}
                  eventHandlers={{ click: () => setSelectedPolygon(polygon.id) }}
                />
              ))}
          </MapContainer>

          <Controls
            isDrawing={isDrawing}
            startDrawing={startDrawing}
            stopDrawing={stopDrawing}
            clearAll={clearAll}
          />

          {isDrawing && <Instructions />}
        </div>

        {Array.isArray(polygons) && polygons.length > 0 && (
          <Sidebar
            polygons={polygons}
            selectedPolygon={selectedPolygon}
            setSelectedPolygon={setSelectedPolygon}
            deletePolygon={deletePolygon}
            formatArea={formatArea}
            calculateArea={calculateArea}
            updatePolygonCrop={updatePolygonCrop}
            fetchCropsFromAPI={fetchCropsFromAPI}
            clearAllCrops={clearAllCrops}
            crops={crops}
            cropsError={cropsError}
            loadingCrops={loadingCrops}
            isFullscreen={isFullscreen}
          />
        )}

        {isModalOpen && (
          <PolygonModal
            onSave={handleSavePolygon}
            onCancel={() => {
              setIsModalOpen(false);
              setPendingCoords(null);
            }}
            crops={crops}
            loading={loadingCrops}
            error={cropsError}
          />
        )}
      </div>
    </div>
  );
}
