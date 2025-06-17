import React, { useState, useEffect } from 'react';
import './MainPage.css';


const AgroFarm = () => {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Влажность почвы критическая!",
      message: "Зайдите во вкладку данные почвы, влажность обновлена! Следует полить ваши растения, так как влажность составляет 10%.",
      time: "2 мин назад",
      type: "critical"
    },
    {
      id: 2,
      title: "Изменение погодных условий",
      message: "Прогнозируются осадки в течение 3 дней. Проверьте систему дренажа и укройте чувствительные культуры.",
      time: "1 час назад",
      type: "warning"
    },
    {
      id: 3,
      title: "Температура в норме",
      message: "Температура воздуха стабилизировалась на уровне 22°C. Идеальные условия для роста томатов и огурцов.",
      time: "2 часа назад",
      type: "success"
    }
  ]);

  const [bubbles, setBubbles] = useState([]);

  useEffect(() => {
    const createBubbles = () => {
      const newBubbles = [];
      for (let i = 0; i < 6; i++) {
        newBubbles.push({
          id: i,
          size: Math.random() * 60 + 20,
          left: Math.random() * 100,
          delay: Math.random() * 5,
          duration: Math.random() * 3 + 4
        });
      }
      setBubbles(newBubbles);
    };

    createBubbles();
  }, []);

  const removeNotification = (id) => {
    setNotifications(notifications.filter(notification => notification.id !== id));
  };

  return (
    <div className="main-container">
      {/* Background */}
      <div className="background">
        <div className="background-overlay"></div>
      </div>

      {/* Animated Bubbles */}
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className="bubble"
          style={{
            width: `${bubble.size}px`,
            height: `${bubble.size}px`,
            left: `${bubble.left}%`,
            animationDelay: `${bubble.delay}s`,
            animationDuration: `${bubble.duration}s`
          }}
        />
      ))}

      {/* Left Content */}
      <div className="content-left">
        <div className="content-wrapper">
          <h1 className="main-title">
            AgroFarm
          </h1>
          <p className="main-subtitle">
            для вас, кто выращивает будущее: мы объединяем природу и технологии, 
            чтобы каждый ваш урожай был щедрее, земля — плодороднее, а труд — мудрее.
          </p>
        </div>
      </div>

      {/* Right Sidebar - Notifications */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="notification-icon">!</div>
          <h2 className="sidebar-title">Уведомления</h2>
        </div>

        <div className="notifications-container">
          {notifications.map((notification, index) => (
            <div
              key={notification.id}
              className="notification"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="notification-header">
                <div className="notification-title-wrapper">
                  <div className={`notification-indicator ${notification.type}`}></div>
                  <h3 className="notification-title">
                    {notification.title}
                  </h3>
                </div>
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="close-button"
                  aria-label="Закрыть уведомление"
                >
                  ✕
                </button>
              </div>
              <p className="notification-message">
                {notification.message}
              </p>
              <span className="notification-time">
                {notification.time}
              </span>
            </div>
          ))}
        </div>

        {notifications.length === 0 && (
          <div className="empty-notifications">
            <div className="empty-icon">✓</div>
            <p className="empty-text">Нет новых уведомлений</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgroFarm;