import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';

export default function DrawingHandler({ isDrawing, setIsDrawing, onPolygonComplete, featureGroupRef }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !isDrawing || !featureGroupRef.current) return;

    const drawControl = new L.Control.Draw({
      edit: {
        featureGroup: featureGroupRef.current
      },
      draw: {
        polyline: false,
        rectangle: false,
        circle: false,
        marker: true,
        circlemarker: false,
        polygon: {
          allowIntersection: false,
          showArea: true,
          shapeOptions: {
            color: '#28a745',
            weight: 2,
            opacity: 0.8
          }
        }
      }
    });

    map.addControl(drawControl);

    const handleDrawCreated = (e) => {
      const layer = e.layer;
      const latlngs = layer.getLatLngs()[0].map((latlng) => [latlng.lat, latlng.lng]);
      onPolygonComplete(latlngs);
      featureGroupRef.current.removeLayer(layer);
      map.removeControl(drawControl);
    };

    map.on(L.Draw.Event.CREATED, handleDrawCreated);

    return () => {
      map.off(L.Draw.Event.CREATED, handleDrawCreated);
      map.removeControl(drawControl);
    };
  }, [isDrawing, map, onPolygonComplete, featureGroupRef]);

  return null;
}

