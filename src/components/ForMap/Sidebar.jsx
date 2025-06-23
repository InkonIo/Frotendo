import { useEffect } from 'react';
import './Sidebar.css';

export default function Sidebar({
  polygons,
  selectedPolygon,
  setSelectedPolygon,
  deletePolygon,
  formatArea,
  calculateArea,
  updatePolygonCrop,
  fetchCropsFromAPI,
  clearAllCrops,
  crops,
  cropsError,
  loadingCrops,
  isFullscreen
}) {
  useEffect(() => {
    if (polygons.length > 0) fetchCropsFromAPI();
    else clearAllCrops();
  }, [polygons]);

  return (
    <div className={`sidebar ${isFullscreen ? 'fullscreen' : ''}`}>
      <h3>Участки ({polygons.length})</h3>

      {polygons.map((polygon) => (
        <div
          key={polygon.id}
          className={`polygon-item ${selectedPolygon === polygon.id ? 'selected' : ''}`}
          onClick={() => setSelectedPolygon(polygon.id)}
        >
          <div className="polygon-header">
            <strong>{polygon.name}</strong>
            <button className="delete" onClick={(e) => {
              e.stopPropagation();
              deletePolygon(polygon.id);
            }}>🗑</button>
          </div>

          <p>Площадь: {formatArea(calculateArea(polygon.coordinates))}</p>

          <label>
            Культура:
            <select
              value={polygon.crop}
              onChange={(e) => updatePolygonCrop(polygon.id, e.target.value)}
            >
              <option value="">Не выбрано</option>
              {loadingCrops && <option>Загрузка...</option>}
              {cropsError && <option>Ошибка загрузки</option>}
              {!loadingCrops && !cropsError && crops.map((crop) => (
                <option key={crop.id || crop.value} value={crop.value}>
                  {crop.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      ))}
    </div>
  );
}
