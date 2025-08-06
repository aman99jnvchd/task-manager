// src/pages/Login.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

const Login: React.FC = () => {
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        document.title = "Login | Task Manager";
    }, []);

    useEffect(() => {
        const storedMessage = sessionStorage.getItem("registrationMessage");
        if (storedMessage) {
            setMessage(storedMessage);
            sessionStorage.removeItem("registrationMessage");
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        if (!username || !password) {
            setError("Please enter username and password");
            setLoading(false);
            return;
        }

        try {
            await login(username, password);
        } catch (err) {
            setError("Invalid credentials");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center px-8 py-4 shadow-[1px_1px_5px_#0e0e0e] bg-[#202020] min-h-screen">
            <div className="w-full max-w-sm rounded bg-[#292929] overflow-hidden shadow-[0_4px_20px_#00000080] border border-[#00000080] p-8">
                <h2 className="text-2xl mb-6 text-center text-white font-bold tracking-[1px]">Login</h2>
                <form onSubmit={handleSubmit} className="space-y-4">

                    {message && (
                        <div className="mb-3">
                            <label className="text-[#28a745]">{message}</label>
                        </div>
                    )}

                    <div className="mb-3">
                        <input
                            type="text"
                            name="username"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="input-field w-full px-3 py-2 border rounded appearance-none"
                        />
                    </div>

                    <div className="mb-3 relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input-field w-full px-3 py-2 border rounded appearance-none"
                        />
                        <span onClick={() => setShowPassword(!showPassword)} className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 cursor-pointer">
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </span>
                    </div>

                    {error && (
                        <div className="mb-3 text-center">
                            <label className="text-red-500 text-[15px]">{error}</label>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="relative group flex justify-center items-center h-[44px] w-full px-4 py-2 rounded bg-gradient-to-r from-[#4338ca] to-[#717cf7] overflow-hidden tracking-[5px] uppercase font-bold"
                    >
                        {loading ? (
                            <div className="loader" />
                        ) : (
                            <span className="relative z-10 text-white">Login</span>
                        )}
                        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity backdrop-blur duration-300"></div>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
