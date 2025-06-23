/**
 * Удаляет полигон по ID
 */
export function removePolygon(polygons, id) {
  return polygons.filter((polygon) => polygon.id !== id);
}

/**
 * Обновляет культуру у полигона
 */
export function updatePolygonCrop(polygons, id, crop) {
  return polygons.map((polygon) =>
    polygon.id === id ? { ...polygon, crop } : polygon
  );
}
