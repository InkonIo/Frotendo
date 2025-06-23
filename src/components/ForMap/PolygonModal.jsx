import { useState, useEffect } from 'react';
import CropSelect from './CropSelect';
import './PolygonModal.css';

export default function PolygonModal({
  onSave,
  onCancel,
  crops,
  loading,
  error
}) {
  const [name, setName] = useState('');
  const [crop, setCrop] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return alert('Введите имя участка');
    if (!crop) return alert('Выберите культуру');
    onSave(name.trim(), crop);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>Сохранить участок</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Имя участка:
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например, Поле №1"
            />
          </label>

          <label>
            Культура:
            <CropSelect
              value={crop}
              onChange={setCrop}
              crops={crops}
              loading={loading}
              error={error}
            />
          </label>

          <div className="modal-actions">
            <button type="submit">Сохранить</button>
            <button type="button" onClick={onCancel} className="cancel">
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
