import L from 'leaflet';

/**
 * Вычисляет площадь полигона (в м²)
 * @param {Array<Array<number>>} coordinates — массив [lat, lng]
 * @returns {number} — площадь в квадратных метрах
 */
export function calculateArea(coordinates) {
  const latlngs = coordinates.map(([lat, lng]) => L.latLng(lat, lng));
  const polygon = L.polygon(latlngs);
  return L.GeometryUtil.geodesicArea(polygon.getLatLngs()[0]);
}

/**
 * Форматирует площадь (м² или га)
 * @param {number} area — площадь в м²
 * @returns {string}
 */
export function formatArea(area) {
  if (area < 10000) {
    return `${area.toFixed(0)} м²`;
  } else {
    return `${(area / 10000).toFixed(2)} га`;
  }
}
