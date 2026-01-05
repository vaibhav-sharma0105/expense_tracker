import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('finTrack_token'));
  const [user, setUser] = useState(null);

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

  const logout = () => {
    localStorage.removeItem('finTrack_token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
