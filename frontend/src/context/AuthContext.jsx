import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutes in milliseconds

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('finTrack_token'));
  const [user, setUser] = useState(null);
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Set default axios header
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  const login = async (username, password) => {
    try {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        
        const res = await axios.post('http://127.0.0.1:8000/auth/token', formData);
        const { access_token } = res.data;
        
        localStorage.setItem('finTrack_token', access_token);
        setToken(access_token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
        setLastActivity(Date.now()); // Reset activity on login
        return true;
    } catch (error) {
        console.error("Login failed", error);
        return false;
    }
  };

  const register = async (email, password, fullName) => {
    try {
        await axios.post('http://127.0.0.1:8000/auth/register', {
            email,
            password,
            full_name: fullName
        });
        // Auto login after register
        return await login(email, password);
    } catch (error) {
        console.error("Registration failed", error);
        return false;
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('finTrack_token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  }, []);

  // Inactivity Logic
  useEffect(() => {
    if (!token) return;

    const handleActivity = () => {
        setLastActivity(Date.now());
    };

    // Events to track
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);

    const interval = setInterval(() => {
        if (Date.now() - lastActivity > INACTIVITY_LIMIT) {
            console.log("Session timed out due to inactivity");
            logout();
        }
    }, 1000 * 60); // Check every minute

    return () => {
        window.removeEventListener('mousemove', handleActivity);
        window.removeEventListener('keydown', handleActivity);
        window.removeEventListener('click', handleActivity);
        window.removeEventListener('scroll', handleActivity);
        clearInterval(interval);
    };
  }, [token, lastActivity, logout]);

  return (
    <AuthContext.Provider value={{ token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
