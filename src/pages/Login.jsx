/* eslint-disable react/prop-types */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import { Mail, Lock, User, Eye, EyeOff, Zap, Flame, Dumbbell } from 'lucide-react';

const inputStyle = {
    width: '100%',
    padding: '13px 16px 13px 46px',
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 12,
    color: '#fff',
    fontSize: '0.95rem',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border 0.2s',
    fontFamily: 'Inter, sans-serif',
};

function FloatingInput({ icon: Icon, type, placeholder, value, onChange, toggle, show }) {
    return (
        <div style={{ position: 'relative', marginBottom: 14 }}>
            <Icon size={17} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', pointerEvents: 'none' }} />
            <input
                type={toggle ? (show ? 'text' : 'password') : type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                style={inputStyle}
                onFocus={e => (e.target.style.border = '1px solid rgba(0,242,234,0.5)')}
                onBlur={e => (e.target.style.border = '1px solid rgba(255,255,255,0.12)')}
            />
            {toggle && (
                <button onClick={toggle} type="button" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 0 }}>
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
            )}
        </div>
    );
}

export default function Login() {
    const [mode, setMode] = useState('login'); // 'login' | 'register'
    const [showPw, setShowPw] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { register, login } = useAuth();
    const { updateUser } = useUser();
    const navigate = useNavigate();

    const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (mode === 'register') {
            if (!form.name.trim()) return setError('Name is required');
            if (form.password !== form.confirmPassword) return setError('Passwords do not match');
        }
        setLoading(true);
        try {
            let user;
            if (mode === 'login') {
                user = await login(form.email, form.password);
            } else {
                user = await register(form.name, form.email, form.password);
            }
            // Populate UserContext so the app knows who is logged in
            updateUser({
                id: user.id, name: user.name, email: user.email,
                age: user.age, gender: user.gender, height: user.height,
                weight: user.weight, goal: user.goal,
                activityLevel: user.activity_level, fitnessLevel: user.fitness_level,
            });
            // New users need to fill their profile, returning users go home
            if (mode === 'register' || !user.age) navigate('/onboarding');
            else navigate('/');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1117 50%, #0a1628 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'Inter, sans-serif' }}>

            {/* Floating orbs */}
            <div style={{ position: 'fixed', top: '15%', left: '8%', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,242,234,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'fixed', bottom: '20%', right: '10%', width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,45,169,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

            <div style={{ width: '100%', maxWidth: 440 }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 36 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <div style={{ width: 46, height: 46, borderRadius: 14, background: 'linear-gradient(135deg, #00f2ea, #ff2da9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Zap size={24} color="#fff" fill="#fff" />
                        </div>
                        <span style={{ fontSize: '1.7rem', fontWeight: 800, background: 'linear-gradient(135deg, #00f2ea, #ff2da9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>FitAI</span>
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', margin: 0 }}>
                        {mode === 'login' ? 'Welcome back 👋' : 'Start your journey today 🚀'}
                    </p>
                </div>

                {/* Card */}
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '32px 28px', backdropFilter: 'blur(20px)' }}>
                    {/* Tabs */}
                    <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 4, marginBottom: 26, gap: 4 }}>
                        {['login', 'register'].map(m => (
                            <button key={m} onClick={() => { setMode(m); setError(''); }} style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s', background: mode === m ? 'linear-gradient(135deg, #00f2ea22, #ff2da922)' : 'transparent', color: mode === m ? '#00f2ea' : 'rgba(255,255,255,0.4)', borderBottom: mode === m ? '2px solid #00f2ea' : '2px solid transparent' }}>
                                {m === 'login' ? 'Sign In' : 'Register'}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit}>
                        {mode === 'register' && (
                            <FloatingInput icon={User} type="text" placeholder="Full Name" value={form.name} onChange={set('name')} />
                        )}
                        <FloatingInput icon={Mail} type="email" placeholder="Email address" value={form.email} onChange={set('email')} />
                        <FloatingInput icon={Lock} type="password" placeholder="Password" value={form.password} onChange={set('password')} toggle={() => setShowPw(p => !p)} show={showPw} />
                        {mode === 'register' && (
                            <FloatingInput icon={Lock} type="password" placeholder="Confirm Password" value={form.confirmPassword} onChange={set('confirmPassword')} />
                        )}

                        {error && (
                            <div style={{ background: 'rgba(255,50,50,0.12)', border: '1px solid rgba(255,50,50,0.25)', borderRadius: 10, padding: '10px 14px', color: '#ff6b6b', fontSize: '0.85rem', marginBottom: 14 }}>
                                {error}
                            </div>
                        )}

                        <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', background: loading ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #00f2ea, #ff2da9)', color: '#fff', fontWeight: 700, fontSize: '1rem', fontFamily: 'Inter, sans-serif', marginTop: 4, opacity: loading ? 0.7 : 1, transition: 'all 0.2s' }}>
                            {loading ? '⏳ Please wait…' : mode === 'login' ? '→ Sign In' : '→ Create Account'}
                        </button>
                    </form>

                    {mode === 'login' && (
                        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', marginTop: 18, marginBottom: 0 }}>
                            Don't have an account?{' '}
                            <span onClick={() => setMode('register')} style={{ color: '#00f2ea', cursor: 'pointer', fontWeight: 600 }}>Register here</span>
                        </p>
                    )}
                </div>

                {/* Feature pills */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 24, flexWrap: 'wrap' }}>
                    {[['🤖', 'Gemini AI'], ['🏋️', 'Workouts'], ['🥗', 'Diet Plan'], ['👟', 'Steps']].map(([icon, label]) => (
                        <span key={label} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '5px 12px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                            {icon} {label}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
