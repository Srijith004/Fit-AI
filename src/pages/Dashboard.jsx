import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useData } from '../context/DataContext';
import GlassCard from '../components/GlassCard';
import { TrendingUp, Droplets, Flame, Zap, Loader, Plus, Minus, Footprints, Play, Square, RotateCcw, Smartphone } from 'lucide-react';
import { getDailyTip } from '../lib/gemini';
import { useStepCounter } from '../hooks/useStepCounter';

// Animated SVG ring
const RingProgress = ({ value, max, size = 110, color = '#00f2ea', strokeWidth = 10, children }) => {
    const r = (size - strokeWidth * 2) / 2;
    const circ = 2 * Math.PI * r;
    const pct = Math.min(1, Math.max(0, value / max));
    const offset = circ - pct * circ;
    return (
        <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
                <circle cx={size / 2} cy={size / 2} r={r} fill="none"
                    stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
                    strokeDasharray={circ} strokeDashoffset={offset}
                    style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1)', filter: `drop-shadow(0 0 6px ${color})` }}
                />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                {children}
            </div>
        </div>
    );
};

const MacroMini = ({ label, value, max, color }) => (
    <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
            <span>{label}</span><span style={{ color, fontWeight: '600' }}>{value}g</span>
        </div>
        <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(100, (value / max) * 100)}%`, background: color, borderRadius: '2px', transition: 'width 1s ease', boxShadow: `0 0 6px ${color}60` }} />
        </div>
    </div>
);

const WellnessRing = ({ score }) => {
    const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ff2d78';
    const label = score >= 70 ? 'Great' : score >= 40 ? 'Good' : 'Low';
    return (
        <RingProgress value={score} max={100} size={80} color={color} strokeWidth={7}>
            <div style={{ fontSize: '0.9rem', fontWeight: '800', color }}>{score}</div>
            <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>{label}</div>
        </RingProgress>
    );
};

// ─── Step Counter Card ────────────────────────────────────────────────────────
const StepCounterCard = () => {
    const DAILY_GOAL = 10000;
    const { steps, isActive, isSupported, permissionState, calories, distanceKm, start, stop, reset, addSteps } = useStepCounter(0);
    const [manualInput, setManualInput] = useState('');
    const [showManual, setShowManual] = useState(false);

    const pct = Math.min(100, Math.round((steps / DAILY_GOAL) * 100));
    const ringColor = pct >= 100 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#00f2ea';

    const milestone = pct >= 100 ? '🎉 Goal reached!' : pct >= 75 ? '💪 Almost there!' : pct >= 50 ? '🔥 Halfway!' : pct >= 25 ? '⚡ Keep going!' : '👟 Let\'s move!';

    const handleManualAdd = () => {
        const n = parseInt(manualInput);
        if (!isNaN(n) && n > 0) { addSteps(n); setManualInput(''); setShowManual(false); }
    };

    return (
        <GlassCard style={{
            marginBottom: '12px', padding: '20px',
            background: 'linear-gradient(135deg, rgba(0,242,234,0.05), rgba(124,58,237,0.04))',
            border: '1px solid rgba(0,242,234,0.15)',
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #00f2ea22, #7c3aed22)', border: '1px solid rgba(0,242,234,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Footprints size={16} color="#00f2ea" />
                    </div>
                    <div>
                        <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>Step Counter</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Goal: {DAILY_GOAL.toLocaleString()} steps</div>
                    </div>
                </div>
                <div style={{ fontSize: '0.78rem', color: ringColor, fontWeight: '700', background: `${ringColor}15`, padding: '4px 10px', borderRadius: '20px', border: `1px solid ${ringColor}30` }}>
                    {milestone}
                </div>
            </div>

            {/* Main content: ring + stats */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '16px' }}>
                <RingProgress value={steps} max={DAILY_GOAL} size={90} color={ringColor} strokeWidth={8}>
                    <div style={{ fontSize: '0.72rem', fontWeight: '900', color: ringColor }}>{pct}%</div>
                </RingProgress>

                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '2.4rem', fontWeight: '900', lineHeight: 1, letterSpacing: '-0.02em' }}>
                        <span className="text-gradient">{steps.toLocaleString()}</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '10px' }}>steps today</div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div style={{ background: 'rgba(255,45,120,0.07)', borderRadius: '10px', padding: '8px 10px', border: '1px solid rgba(255,45,120,0.12)' }}>
                            <div style={{ fontSize: '1rem', fontWeight: '800', color: '#ff2d78' }}>{calories}</div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>kcal burned</div>
                        </div>
                        <div style={{ background: 'rgba(16,185,129,0.07)', borderRadius: '10px', padding: '8px 10px', border: '1px solid rgba(16,185,129,0.12)' }}>
                            <div style={{ fontSize: '1rem', fontWeight: '800', color: '#10b981' }}>{distanceKm}</div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>km walked</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress bar */}
            <div style={{ marginBottom: '14px' }}>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                        height: '100%', width: `${pct}%`,
                        background: `linear-gradient(90deg, ${ringColor}, ${ringColor}aa)`,
                        borderRadius: '3px', transition: 'width 0.6s ease',
                        boxShadow: `0 0 8px ${ringColor}60`,
                    }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.67rem', color: 'var(--text-muted)' }}>
                    <span>0</span><span>{(DAILY_GOAL / 2).toLocaleString()}</span><span>{DAILY_GOAL.toLocaleString()}</span>
                </div>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {/* Accelerometer controls (mobile) */}
                {isSupported && permissionState !== 'unsupported' && (
                    <>
                        {!isActive ? (
                            <button onClick={start} className="btn" style={{
                                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                background: 'linear-gradient(135deg, #00f2ea22, #7c3aed22)',
                                border: '1px solid rgba(0,242,234,0.35)', color: '#00f2ea', fontSize: '0.82rem', fontWeight: '700', padding: '10px',
                            }}>
                                <Smartphone size={14} /> Start Tracking
                            </button>
                        ) : (
                            <button onClick={stop} className="btn" style={{
                                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                background: 'rgba(255,45,120,0.12)',
                                border: '1px solid rgba(255,45,120,0.3)', color: '#ff2d78', fontSize: '0.82rem', fontWeight: '700', padding: '10px',
                            }}>
                                <Square size={14} fill="#ff2d78" /> Stop
                            </button>
                        )}
                        {isActive && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 8px', background: 'rgba(16,185,129,0.1)', borderRadius: '10px', border: '1px solid rgba(16,185,129,0.25)' }}>
                                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', animation: 'pulse 1.5s ease infinite' }} />
                                <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: '600' }}>Live</span>
                            </div>
                        )}
                    </>
                )}

                {/* Manual add steps */}
                <button onClick={() => addSteps(100)} className="btn" style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                    background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)',
                    color: '#f59e0b', fontSize: '0.78rem', fontWeight: '600', padding: '10px 12px',
                }}>
                    <Plus size={12} /> 100
                </button>
                <button onClick={() => addSteps(500)} className="btn" style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                    background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)',
                    color: '#f59e0b', fontSize: '0.78rem', fontWeight: '600', padding: '10px 12px',
                }}>
                    <Plus size={12} /> 500
                </button>
                <button onClick={() => setShowManual(v => !v)} className="btn" style={{
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--text-dim)', fontSize: '0.78rem', padding: '10px 12px',
                }}>
                    Custom
                </button>
                <button onClick={reset} className="btn" style={{
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    color: 'var(--text-muted)', padding: '10px 10px',
                }}>
                    <RotateCcw size={13} />
                </button>
            </div>

            {/* Custom step input */}
            {showManual && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px', animation: 'fadeInUp 0.2s ease' }}>
                    <input
                        type="number" min="1" max="50000"
                        placeholder="Enter steps..."
                        value={manualInput}
                        onChange={e => setManualInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleManualAdd()}
                        style={{
                            flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
                            borderRadius: '10px', padding: '10px 14px', color: 'var(--text)', fontSize: '0.9rem',
                            outline: 'none', fontFamily: 'var(--font)',
                        }}
                    />
                    <button onClick={handleManualAdd} className="btn" style={{
                        background: 'linear-gradient(135deg, #00f2ea, #10b981)', color: '#000',
                        fontWeight: '700', border: 'none', padding: '10px 16px', borderRadius: '10px',
                    }}>Add</button>
                </div>
            )}

            {/* Permission denied notice */}
            {permissionState === 'denied' && (
                <div style={{ marginTop: '10px', padding: '8px 12px', background: 'rgba(255,45,120,0.08)', borderRadius: '8px', border: '1px solid rgba(255,45,120,0.2)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    📵 Motion sensor access denied. Use the manual buttons above to log your steps.
                </div>
            )}
        </GlassCard>
    );
};

const Dashboard = () => {
    const { user, calculateTDEE, calculateBMI } = useUser();
    const { activity, logWater, removeWater, todayCalories, todayCaloriesBurned, wellnessScore } = useData();

    const [tip, setTip] = useState(null);
    const [tipLoading, setTipLoading] = useState(false);

    const tdee = calculateTDEE();
    const bmiData = calculateBMI();
    const caloriesLeft = Math.max(0, tdee - todayCalories + todayCaloriesBurned);

    const totalProtein = activity.meals.reduce((a, m) => a + (m.protein || 0), 0);
    const totalCarbs = activity.meals.reduce((a, m) => a + (m.carbs || 0), 0);
    const totalFat = activity.meals.reduce((a, m) => a + (m.fat || 0), 0);
    const proteinTarget = Math.round((tdee * 0.30) / 4);
    const carbTarget = Math.round((tdee * 0.45) / 4);
    const fatTarget = Math.round((tdee * 0.25) / 9);

    useEffect(() => {
        if (!user?.name) return;
        setTipLoading(true);
        getDailyTip(
            user.name, user.goal || 'maintain',
            activity.water, activity.meals.length,
            activity.workouts.length + activity.manualExercises.length,
            user.fitnessLevel, user.dietType
        ).then(t => { setTip(t); setTipLoading(false); })
            .catch(() => setTipLoading(false));
    }, [user?.fitnessLevel, user?.dietType]);

    if (!user) return null;

    const bmiColor = bmiData?.category === 'Normal' ? '#10b981' : bmiData?.category === 'Overweight' ? '#f59e0b' : '#ff2d78';
    const hour = new Date().getHours();
    const greeting = hour < 12 ? '🌅 Good Morning' : hour < 17 ? '☀️ Good Afternoon' : '🌙 Good Evening';

    return (
        <div style={{ paddingBottom: '10px', animation: 'fadeInUp 0.5s ease' }}>
            {/* Header */}
            <div style={{ marginBottom: '22px' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{greeting}</div>
                <h1 style={{ fontSize: '2.2rem', fontWeight: '900', letterSpacing: '-0.02em' }}>
                    <span className="text-gradient">{user.name}</span> 👋
                </h1>
                {activity.streak.current > 0 && (
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '8px',
                        padding: '5px 14px', background: 'linear-gradient(90deg, rgba(245,158,11,0.15), rgba(255,45,120,0.08))',
                        border: '1px solid rgba(245,158,11,0.35)', borderRadius: '20px',
                        fontSize: '0.85rem', fontWeight: '700',
                    }}>
                        🔥 {activity.streak.current} Day Streak
                    </div>
                )}
            </div>

            {/* AI Daily Tip */}
            {(tipLoading || tip) && (
                <div style={{
                    marginBottom: '16px', padding: '14px 16px',
                    background: 'linear-gradient(90deg, rgba(0,242,234,0.06), rgba(124,58,237,0.04))',
                    border: '1px solid rgba(0,242,234,0.18)', borderRadius: '14px',
                    display: 'flex', alignItems: 'flex-start', gap: '10px',
                }}>
                    {tipLoading ? (
                        <><Loader size={16} color="var(--primary)" style={{ animation: 'spin 1s linear infinite', flexShrink: 0, marginTop: '2px' }} />
                            <span style={{ fontSize: '0.84rem', color: 'var(--text-dim)' }}>Getting your personalized tip…</span></>
                    ) : (
                        <><span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{tip?.emoji || '💡'}</span>
                            <div>
                                <div style={{ fontSize: '0.68rem', color: 'var(--primary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>{tip?.category || 'Daily Tip'}</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>{tip?.tip}</div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Calorie + Wellness Row */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                <GlassCard style={{
                    flex: 1, padding: '18px',
                    background: 'linear-gradient(135deg, rgba(0,242,234,0.06), rgba(0,0,0,0))',
                    border: '1px solid rgba(0,242,234,0.15)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <RingProgress value={todayCalories} max={tdee} size={80} color="#00f2ea" strokeWidth={7}>
                            <div style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--primary)' }}>{Math.round((todayCalories / tdee) * 100)}%</div>
                        </RingProgress>
                        <div style={{ flex: 1, paddingLeft: '12px' }}>
                            <div style={{ fontSize: '1.6rem', fontWeight: '900', lineHeight: 1 }}>{todayCalories}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>of {tdee} kcal eaten</div>
                            {todayCaloriesBurned > 0 && <div style={{ fontSize: '0.75rem', color: '#ff2d78', fontWeight: '600' }}>-{todayCaloriesBurned} burned</div>}
                            <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: '600' }}>{caloriesLeft} left</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <MacroMini label="Protein" value={totalProtein} max={proteinTarget} color="#3b82f6" />
                        <MacroMini label="Carbs" value={totalCarbs} max={carbTarget} color="#f59e0b" />
                        <MacroMini label="Fat" value={totalFat} max={fatTarget} color="#ec4899" />
                    </div>
                </GlassCard>

                <GlassCard style={{ padding: '18px', minWidth: '110px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, rgba(16,185,129,0.05), rgba(0,0,0,0))', border: '1px solid rgba(16,185,129,0.15)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Wellness</div>
                    <WellnessRing score={wellnessScore} />
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.3 }}>water + food + exercise</div>
                </GlassCard>
            </div>

            {/* ─── Step Counter ─────────────────────────── */}
            <StepCounterCard />

            {/* Water Tracker */}
            <GlassCard style={{ marginBottom: '12px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                            <Droplets size={16} color="#60a5fa" />
                            <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>Water Intake</span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            <span style={{ fontWeight: '700', color: '#60a5fa', fontSize: '1.2rem' }}>{activity.water}</span>/{activity.waterTarget} glasses today
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={removeWater} className="btn btn-sm" style={{ width: '36px', height: '36px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)' }}>
                            <Minus size={14} />
                        </button>
                        <button onClick={logWater} className="btn btn-sm" style={{ width: '36px', height: '36px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.3)', color: '#60a5fa' }}>
                            <Plus size={14} />
                        </button>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    {Array.from({ length: activity.waterTarget }, (_, i) => (
                        <div key={i} style={{
                            flex: '1 0 calc(12.5% - 5px)', minWidth: '28px', height: '32px', borderRadius: '8px',
                            background: i < activity.water ? 'linear-gradient(135deg, #3b82f6, #60a5fa)' : 'rgba(255,255,255,0.05)',
                            border: `1px solid ${i < activity.water ? '#3b82f6' : 'rgba(255,255,255,0.08)'}`,
                            transition: 'all 0.3s ease',
                            boxShadow: i < activity.water ? '0 0 10px rgba(59,130,246,0.4)' : 'none',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem',
                        }}>
                            {i < activity.water ? '💧' : ''}
                        </div>
                    ))}
                </div>
            </GlassCard>

            {/* Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <GlassCard style={{ padding: '18px', background: `linear-gradient(135deg, ${bmiColor}10, rgba(0,0,0,0))`, border: `1px solid ${bmiColor}22` }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>BMI</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: '900', color: bmiColor }}>{bmiData?.bmi || '--'}</div>
                    <div style={{ fontSize: '0.78rem', color: bmiColor, fontWeight: '600' }}>{bmiData?.category || '--'}</div>
                    {bmiData && (
                        <div style={{ marginTop: '8px', height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${Math.min(100, (bmiData.bmi / 35) * 100)}%`, background: bmiColor, borderRadius: '2px', boxShadow: `0 0 6px ${bmiColor}80` }} />
                        </div>
                    )}
                </GlassCard>

                <GlassCard style={{ padding: '18px', background: 'linear-gradient(135deg, rgba(255,45,120,0.07), rgba(0,0,0,0))', border: '1px solid rgba(255,45,120,0.15)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Burned Today</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#ff2d78' }}>{todayCaloriesBurned}</div>
                    <div style={{ fontSize: '0.78rem', color: '#ff2d78', fontWeight: '600' }}>kcal</div>
                    <div style={{ marginTop: '8px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <Flame size={12} color="#ff2d78" />
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {activity.workouts.length + (activity.manualExercises?.length || 0)} session{(activity.workouts.length + (activity.manualExercises?.length || 0)) !== 1 ? 's' : ''}
                        </span>
                    </div>
                </GlassCard>
            </div>

            {/* Fitness Profile Overview */}
            <GlassCard style={{ marginBottom: '12px', padding: '16px', background: 'linear-gradient(135deg, rgba(124,58,237,0.06), rgba(0,242,234,0.04))', border: '1px solid rgba(124,58,237,0.15)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Target Weight</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: '800' }}>{user.targetWeight || '--'}<span style={{ fontSize: '0.7rem', fontWeight: '400', color: 'var(--text-dim)' }}>kg</span></div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--primary)', marginTop: '2px' }}>
                            {user.weight && user.targetWeight ? (user.weight - user.targetWeight > 0 ? `Lose ${Math.abs(user.weight - user.targetWeight)}kg` : `Gain ${Math.abs(user.weight - user.targetWeight)}kg`) : ''}
                        </div>
                    </div>
                    <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.06)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Fitness Level</div>
                        <div style={{ fontSize: '0.95rem', fontWeight: '700', textTransform: 'capitalize' }}>{user.fitnessLevel || 'Beginner'}</div>
                        <div style={{ fontSize: '1rem', marginTop: '2px' }}>{user.fitnessLevel === 'advanced' ? '💎' : user.fitnessLevel === 'intermediate' ? '🏆' : '🌱'}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Diet Type</div>
                        <div style={{ fontSize: '0.95rem', fontWeight: '700', textTransform: 'capitalize' }}>{user.dietType || 'Standard'}</div>
                        <div style={{ fontSize: '1rem', marginTop: '2px' }}>{user.dietType === 'vegetarian' ? '🥦' : user.dietType === 'keto' ? '🥑' : '🍱'}</div>
                    </div>
                </div>
            </GlassCard>

            {/* Recent Meals */}
            {activity.meals.length > 0 && (
                <GlassCard style={{ marginBottom: '12px', padding: '16px' }}>
                    <div style={{ fontWeight: '700', fontSize: '0.9rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <TrendingUp size={15} color="var(--primary)" /> Today's Meals
                    </div>
                    {activity.meals.slice(-3).reverse().map((m, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: i < Math.min(2, activity.meals.length - 1) ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <span style={{ fontSize: '1.2rem' }}>{m.emoji || '🍽️'}</span>
                                <div>
                                    <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>{m.name}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{m.time}</div>
                                </div>
                            </div>
                            <div style={{ color: 'var(--secondary)', fontWeight: '700', fontSize: '0.88rem' }}>+{m.calories} kcal</div>
                        </div>
                    ))}
                    {activity.meals.length > 3 && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '8px' }}>+{activity.meals.length - 3} more meals</div>
                    )}
                </GlassCard>
            )}

            {(activity.workouts.length > 0 || activity.manualExercises?.length > 0) && (
                <GlassCard style={{ padding: '16px' }}>
                    <div style={{ fontWeight: '700', fontSize: '0.9rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Zap size={15} color="#f59e0b" /> Today's Exercise
                    </div>
                    {[...activity.workouts, ...(activity.manualExercises || [])].slice(-3).reverse().map((ex, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <span style={{ fontSize: '1.2rem' }}>{ex.emoji || '💪'}</span>
                                <div>
                                    <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>{ex.name}</div>
                                    {ex.duration && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{ex.duration} min</div>}
                                </div>
                            </div>
                            <div style={{ color: '#ff2d78', fontWeight: '700', fontSize: '0.88rem' }}>-{ex.calories} kcal</div>
                        </div>
                    ))}
                </GlassCard>
            )}
        </div>
    );
};

export default Dashboard;
