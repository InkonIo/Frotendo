import React from 'react';
import './Instructions.css'; // если есть стили

export default function Instructions() {
  return (
    <div className="instructions">
      <h4>Инструкция</h4>
      <ul>
        <li>Кликните на карту, чтобы начать рисование полигона</li>
        <li>Добавьте несколько точек, чтобы очертить границы участка</li>
        <li>Дважды кликните для завершения полигона</li>
        <li>После завершения — заполните форму с названием и культурой</li>
      </ul>
    </div>
  );
}
