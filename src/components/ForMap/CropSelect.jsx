import React from 'react';

export default function CropSelect({ value, onChange, crops = [], loading = false, error = null }) {
  return (
    <div>
      {loading && <p>Загрузка культур...</p>}
      {error && <p style={{ color: 'red' }}>Ошибка загрузки культур: {error}</p>}

      {!loading && !error && (
        <select value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">Выберите культуру</option>
          {crops.map((crop) => (
            <option key={crop.id ?? crop.value} value={crop.value}>
              {crop.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
