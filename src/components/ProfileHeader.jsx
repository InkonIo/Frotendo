import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import './ProfileHeader.css';

export default function ProfileHeader({ onSettingsClick = () => {} }) {
  const [activeSection, setActiveSection] = useState('home');
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [showNotificationStatus, setShowNotificationStatus] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Переключение уведомлений с показом статуса
  const toggleNotifications = () => {
    setNotificationsOn(prev => {
      const newState = !prev;
      if (!newState) {
        setShowNotificationStatus(true);
        setTimeout(() => setShowNotificationStatus(false), 2000);
      }
      return newState;
    });
  };

  // Определение активной секции на основе текущего пути
  useEffect(() => {
    if (location.pathname === '/') {
      setActiveSection('home');
    } else if (location.pathname === '/dashboard') {
      setActiveSection('map');
    } else if (location.pathname === '/chat') {
      setActiveSection('ai-chat');
    } else if (location.pathname === '/earthdata') {
      setActiveSection('soil-data');
    }
  }, [location.pathname]);

  return (
    <>
      <header className="profile-header">
        <div className="profile-header-left">
          <div className="profile-header-logo">
            AGRO
          </div>
          
          <button
            onClick={onSettingsClick}
            title="Настройки"
            className="profile-header-button settings-button"
            aria-label="Настройки пользователя"
          >
            <span></span>
          </button>

          <nav className="profile-header-nav">
            <a
              href="#"
              onClick={e => {
                e.preventDefault();
                navigate('/');
                setActiveSection('home');
              }}
              className={`profile-header-nav-link ${
                location.pathname === '/' || activeSection === 'home' ? 'active' : ''
              }`}
            >
              Главная
            </a>
            <a
              href="#"
              onClick={e => {
                e.preventDefault();
                navigate('/dashboard');
                setActiveSection('map');
              }}
              className={`profile-header-nav-link ${
                location.pathname === '/dashboard' || activeSection === 'map' ? 'active' : ''
              }`}
            >
              Карта
            </a>
            <a
              href="#"
              onClick={e => {
                e.preventDefault();
                navigate('/chat');
                setActiveSection('ai-chat');
              }}
              className={`profile-header-nav-link ${
                location.pathname === '/chat' || activeSection === 'ai-chat' ? 'active' : ''
              }`}
            >
              ИИ-чат
            </a>
            <Link
              to="/earthdata"
              onClick={() => setActiveSection('soil-data')}
              className={`profile-header-nav-link ${
                location.pathname === '/earthdata' || activeSection === 'soil-data' ? 'active' : ''
              }`}
            >
              Данные почвы
            </Link>
            <a
              href="#"
              onClick={e => {
                e.preventDefault();
                setActiveSection('recommendations');
              }}
              className={`profile-header-nav-link ${
                activeSection === 'recommendations' ? 'active' : ''
              }`}
            >
              Рекомендации
            </a>
          </nav>
        </div>

        <div className="profile-header-right">
          <button
            onClick={toggleNotifications}
            title={notificationsOn ? 'Отключить уведомления' : 'Включить уведомления'}
            className={`profile-header-button notification-button ${!notificationsOn ? 'off' : ''}`}
            aria-label="Уведомления"
          >
          </button>
        </div>
      </header>

      <div className={`notification-status ${showNotificationStatus ? 'show' : ''}`}>
        Уведомления отключены
      </div>
    </>
  );
}
