// src/components/Sidebar.tsx
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import '@fortawesome/fontawesome-free/css/all.min.css';

const Sidebar: React.FC = () => {
    const { logout, username } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <>
            {/* Hamburger Icon - Mobile only */}
            <button onClick={() => setIsOpen(true)} className="md:hidden absolute top-4 left-4 z-40 text-white">
                <Menu size={28} />
            </button>

            {/* Sidebar */}
            <div className={`fixed top-0 left-0 h-full w-[14rem] bg-[#1e1e1e] text-white shadow-md z-40 transform transition-transform duration-300 flex flex-col justify-between ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
                <div>
                    <div className="flex items-center justify-between md:justify-center p-5 border-b border-[#333]">
                        <h2 className="text-2xl font-bold tracking-wider">Task Manager</h2>
                        {/* Close Icon - Mobile only */}
                        <button className="md:hidden" onClick={() => setIsOpen(false)}>
                            <X size={22} />
                        </button>
                    </div>

                    <nav className="flex flex-col text-center text-[15px]">
                        <NavLink
                            to="/dashboard"
                            onClick={() => setIsOpen(false)}
                            className={({ isActive }) =>
                                `block tracking-[1px] px-4 py-3 mb-[1px] text-gray-300 transition hover:bg-[#333] hover:text-gray-300 ${isActive ? 'bg-[#333]' : 'bg-[#1E1E1E]'}`
                            }
                        >
                            Dashboard
                        </NavLink>
                    </nav>
                </div>
                <div className="my-4 mx-8 text-center font-bold text-[14px] space-y-2">
                    <button className="button-smooth button-gradient w-full racking-[1px] rounded py-3">
                        <i className="far fa-user mr-1"></i> { username }
                    </button>
                    <button onClick={() => { handleLogout(); setIsOpen(false); }} className="w-full bg-red-600 hover:bg-red-500 uppercase tracking-[5px] rounded py-3">
                        Logout
                    </button>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
