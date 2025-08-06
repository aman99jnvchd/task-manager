// src/auth/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getToken, loggedInUser } from '../api/axios';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
    token: string | null;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
    currentUserId: number | null;
    username: string | null;
    isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [username, setUsername] = useState<string | null>(null);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const navigate = useNavigate();

    const login = async (username: string, password: string) => {
        try {
            const token = await getToken({ username, password });
            localStorage.setItem('token', token);
            setToken(token);
            navigate('/dashboard');
        } catch (err) {
            console.error('Login failed:', err);
            throw err;
        }
    };

    useEffect(() => {
        if (!token) return;

        const getUser = async () => {
            try {
                const data = await loggedInUser();
                setCurrentUserId(data.id);
                setUsername(data.username);
                setIsAdmin(data.is_admin);
            } catch (err) {
                console.error('Failed to fetch user data:', err);
                setIsAdmin(false);
            }
        };

        getUser();
    }, [token]);

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        navigate('/login');
    };

    const isAuthenticated = !!token;

    return (
        <AuthContext.Provider value={{ token, login, logout, isAuthenticated, currentUserId, username, isAdmin }}>
            {children}
        </AuthContext.Provider>
    );
};

/* Custom hook */
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used inside AuthProvider');
    return context;
};
