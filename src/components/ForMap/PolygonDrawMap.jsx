import React, { useState } from 'react';
import { MapContainer, TileLayer, Polygon, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import Controls from './Controls'; // твой компонент

function DrawingHandler({ isDrawing, onComplete }) {
  const [path, setPath] = useState([]);
  const [hovered, setHovered] = useState(null);

  useMapEvents({
    click(e) {
      if (!isDrawing) return;
      const point = [e.latlng.lat, e.latlng.lng];
      setPath(prev => [...prev, point]);
    },
    mousemove(e) {
      if (!isDrawing || path.length === 0) return;
      setHovered([e.latlng.lat, e.latlng.lng]);
    },
    dblclick(e) {
      if (!isDrawing || path.length < 3) return;
      onComplete(path);
      setPath([]);
    }
  });

  if (!isDrawing || path.length === 0) return null;
  const displayPath = hovered ? [...path, hovered] : path;

  return (
    <Polygon
      positions={displayPath}
      pathOptions={{
        color: 'blue',
        weight: 2,
        dashArray: '5, 5',
        fillOpacity: 0.2
      }}
    />
  );
}

export default function PolygonDrawMap() {
  const [polygons, setPolygons] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);

  const handleStartDrawing = () => setIsDrawing(true);
  const handleStopDrawing = () => setIsDrawing(false);
  const handleClearAll = () => setPolygons([]);

  const handlePolygonComplete = (points) => {
    setPolygons(prev => [
      ...prev,
      {
        id: Date.now(),
        coordinates: points,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`
      }
    ]);
    setIsDrawing(false);
  };

  return (
    <div style={{ height: '100vh' }}>
      <Controls
        isDrawing={isDrawing}
        startDrawing={handleStartDrawing}
        stopDrawing={handleStopDrawing}
        clearAll={handleClearAll}
      />

      <MapContainer
        center={[51.505, -0.09]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        doubleClickZoom={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {isDrawing && (
          <DrawingHandler
            isDrawing={isDrawing}
            onComplete={handlePolygonComplete}
          />
        )}

        {polygons.map(polygon => (
          <Polygon
            key={polygon.id}
            positions={polygon.coordinates}
            pathOptions={{ color: polygon.color }}
          />
        ))}
      </MapContainer>
    </div>
  );
}
