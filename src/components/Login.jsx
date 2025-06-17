import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [password, setPassword] = useState('');
  const [login, setLogin] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
  e.preventDefault();

  if (!login || !password) {
    setError("Введите логин и пароль");
    return;
  }

  try {
    const response = await fetch('http://localhost:8080/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      credentials: 'include',
      body: new URLSearchParams({
        username: login,
        password: password,
        'remember-me': 'true'
      })
    });

    if (!response.ok) {
      const text = await response.text(); // получаем обычный текст
      if (response.status === 401) {
        setError("Неверный логин или пароль");
      } else {
        setError(`Ошибка: ${text}`);
      }
      return;
    }

    setError('');
    const data = await response.json();
    console.log(data.message);
    navigate('/dashboard');

  } catch (err) {
    setError("Ошибка сети или сервера");
  }
};


  return (
    <div>
      <h2>Вход в систему</h2>

      <form onSubmit={handleLogin}>
        <input
          type="text"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          placeholder="Логин"
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Пароль"
        />

        <button type="submit">Войти</button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default Login;
