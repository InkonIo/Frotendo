import React from 'react';
import './Controls.css';

export default function Controls({ isDrawing, startDrawing, stopDrawing, clearAll }) {
  return (
    <div className="controls">
      {!isDrawing && <button onClick={startDrawing}>✏️ Нарисовать</button>}
      {isDrawing && <button className="stop" onClick={stopDrawing}>✅ Завершить</button>}
      <button className="clear" onClick={clearAll}>🗑 Очистить</button>
    </div>
  );
}
