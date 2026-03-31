/* eslint-disable react/prop-types */
import React, { createContext, useState, useContext, useCallback } from 'react';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

const BASE = 'http://localhost:3001/api';

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(() => localStorage.getItem('fitai_token'));
    const [authUser, setAuthUser] = useState(() => {
        const u = localStorage.getItem('fitai_auth_user');
        return u ? JSON.parse(u) : null;
    });

    const isAuthenticated = !!token;

    const register = useCallback(async (name, email, password, profileData = {}) => {
        const res = await fetch(`${BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, ...profileData }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Registration failed');
        localStorage.setItem('fitai_token', data.token);
        localStorage.setItem('fitai_auth_user', JSON.stringify(data.user));
        setToken(data.token);
        setAuthUser(data.user);
        return data.user;
    }, []);

    const login = useCallback(async (email, password) => {
        const res = await fetch(`${BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed');
        localStorage.setItem('fitai_token', data.token);
        localStorage.setItem('fitai_auth_user', JSON.stringify(data.user));
        setToken(data.token);
        setAuthUser(data.user);
        return data.user;
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('fitai_token');
        localStorage.removeItem('fitai_auth_user');
        localStorage.removeItem('user_profile');
        localStorage.removeItem('activity_log_v3');
        setToken(null);
        setAuthUser(null);
        window.location.href = '/login';
    }, []);

    return (
        <AuthContext.Provider value={{ token, authUser, isAuthenticated, register, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
