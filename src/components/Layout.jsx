/* eslint-disable react/prop-types */
import React, { useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Activity, Utensils, Users, Calendar, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NavItem = ({ to, icon: Icon, label, isActive }) => {
    const [pressed, setPressed] = useState(false);

    return (
        <Link
            to={to}
            onMouseDown={() => setPressed(true)}
            onMouseUp={() => setPressed(false)}
            onMouseLeave={() => setPressed(false)}
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                textDecoration: 'none',
                transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                transform: pressed ? 'scale(0.88)' : isActive ? 'scale(1.08)' : 'scale(1)',
                padding: '6px 16px',
                borderRadius: '14px',
                background: isActive ? 'rgba(0, 242, 234, 0.1)' : 'transparent',
                minWidth: '60px',
            }}
        >
            <div style={{ position: 'relative' }}>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                {isActive && (
                    <div style={{
                        position: 'absolute',
                        bottom: '-6px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '4px',
                        height: '4px',
                        background: 'var(--primary)',
                        borderRadius: '50%',
                        boxShadow: '0 0 6px var(--primary)',
                    }} />
                )}
            </div>
            <span style={{ fontSize: '10px', fontWeight: isActive ? '700' : '500', letterSpacing: '0.03em' }}>
                {label}
            </span>
        </Link>
    );
};

const Layout = ({ children }) => {
    const location = useLocation();
    const { logout } = useAuth();

    return (
        <div style={{ paddingBottom: '100px', minHeight: '100vh', position: 'relative' }}>
            <main style={{ padding: '24px 20px', maxWidth: '600px', margin: '0 auto' }}>
                {children}
            </main>

            <nav style={{
                position: 'fixed',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 'calc(100% - 30px)',
                maxWidth: '460px',
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'center',
                padding: '10px 8px',
                zIndex: 1000,
                background: 'rgba(13, 17, 23, 0.85)',
                backdropFilter: 'blur(24px) saturate(200%)',
                WebkitBackdropFilter: 'blur(24px) saturate(200%)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '28px',
                boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05) inset',
            }}>
                <NavItem to="/" icon={Home} label="Home" isActive={location.pathname === '/'} />
                <NavItem to="/diet" icon={Utensils} label="Diet" isActive={location.pathname === '/diet'} />
                <NavItem to="/fitness" icon={Activity} label="Fitness" isActive={location.pathname === '/fitness'} />
                <NavItem to="/history" icon={Calendar} label="History" isActive={location.pathname === '/history'} />
                <NavItem to="/social" icon={Users} label="Social" isActive={location.pathname === '/social'} />

                <button
                    onClick={logout}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px',
                        color: 'rgba(255,100,100,0.6)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '6px 16px',
                        transition: 'color 0.2s',
                    }}
                    onMouseEnter={(e) => e.target.style.color = 'rgba(255,100,100,1)'}
                    onMouseLeave={(e) => e.target.style.color = 'rgba(255,100,100,0.6)'}
                >
                    <LogOut size={22} />
                    <span style={{ fontSize: '10px', fontWeight: '500' }}>Logout</span>
                </button>
            </nav>
        </div>
    );
};

export default Layout;
