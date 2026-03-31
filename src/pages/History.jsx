import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/GlassCard';
import { Calendar, Utensils, Dumbbell, Droplets, Footprints, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiGetMeals, apiGetWorkouts, apiGetWater, apiGetSteps } from '../lib/api';

const dateStr = (d) => d.toISOString().slice(0, 10);
const fmtDate = (s) => new Date(s + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

function Pill({ label, value, color = '#00f2ea' }) {
    return (
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 14px', flex: 1, minWidth: 90, textAlign: 'center', border: `1px solid ${color}22` }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color }}>{value}</div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{label}</div>
        </div>
    );
}

export default function History() {
    const { isAuthenticated } = useAuth();
    const [date, setDate] = useState(new Date());
    const [data, setData] = useState({ meals: [], workouts: [], water: null, steps: null });
    const [loading, setLoading] = useState(false);

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const isToday = date.toDateString() === today.toDateString();
    const isFuture = date > today;

    const shift = (days) => {
        const d = new Date(date);
        d.setDate(d.getDate() + days);
        if (d <= today) setDate(d);
    };

    useEffect(() => {
        if (!isAuthenticated || isFuture) return;
        setLoading(true);
        const d = dateStr(date);
        Promise.all([apiGetMeals(d), apiGetWorkouts(d), apiGetWater(d), apiGetSteps(d)])
            .then(([meals, workouts, water, steps]) => setData({ meals: meals || [], workouts: workouts || [], water, steps }))
            .finally(() => setLoading(false));
    }, [date, isAuthenticated]);

    const totalCals = data.meals.reduce((a, m) => a + (m.calories || 0), 0);
    const totalBurned = data.workouts.reduce((a, w) => a + (w.calories || 0), 0);
    const regularWorkouts = data.workouts.filter(w => !w.is_manual);
    const manualExercises = data.workouts.filter(w => w.is_manual);

    return (
        <div style={{ padding: '0 0 100px', fontFamily: 'Inter, sans-serif', color: '#fff' }}>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0 0 4px', background: 'linear-gradient(135deg, #a78bfa, #00f2ea)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    📅 My History
                </h1>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem' }}>Browse your past activity day by day</p>
            </div>

            {/* Date navigation */}
            <GlassCard style={{ marginBottom: 20, padding: '14px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <button onClick={() => shift(-1)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, padding: '8px 12px', color: '#fff', cursor: 'pointer' }}>
                        <ChevronLeft size={18} />
                    </button>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: isToday ? '#00f2ea' : '#fff' }}>
                            {isToday ? '📍 Today' : fmtDate(dateStr(date))}
                        </div>
                        {!isToday && <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{dateStr(date)}</div>}
                    </div>
                    <button onClick={() => shift(1)} disabled={isToday} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, padding: '8px 12px', color: isToday ? 'rgba(255,255,255,0.2)' : '#fff', cursor: isToday ? 'not-allowed' : 'pointer' }}>
                        <ChevronRight size={18} />
                    </button>
                </div>
            </GlassCard>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.4)' }}>⏳ Loading…</div>
            ) : (
                <>
                    {/* Summary pills */}
                    <GlassCard style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginBottom: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Day Summary</div>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            <Pill label="Calories In" value={totalCals || '–'} color="#f59e0b" />
                            <Pill label="Burned" value={totalBurned || '–'} color="#ef4444" />
                            <Pill label="Water" value={data.water?.glasses ? `${data.water.glasses}🥤` : '–'} color="#3b86ef" />
                            <Pill label="Steps" value={data.steps?.steps ? data.steps.steps.toLocaleString() : '–'} color="#10b981" />
                        </div>
                    </GlassCard>

                    {/* Meals */}
                    <GlassCard style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                            <Utensils size={16} color="#f59e0b" />
                            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Meals ({data.meals.length})</span>
                        </div>
                        {data.meals.length === 0 ? (
                            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', margin: 0 }}>No meals logged</p>
                        ) : data.meals.map((m, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < data.meals.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontSize: '1.2rem' }}>{m.emoji || '🍽️'}</span>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{m.name}</div>
                                        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>P:{m.protein}g · C:{m.carbs}g · F:{m.fat}g</div>
                                    </div>
                                </div>
                                <span style={{ fontWeight: 700, color: '#f59e0b', fontSize: '0.9rem' }}>{m.calories} kcal</span>
                            </div>
                        ))}
                    </GlassCard>

                    {/* Workouts */}
                    <GlassCard style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                            <Dumbbell size={16} color="#a78bfa" />
                            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Workouts ({regularWorkouts.length})</span>
                        </div>
                        {regularWorkouts.length === 0 ? (
                            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', margin: 0 }}>No workouts logged</p>
                        ) : regularWorkouts.map((w, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < regularWorkouts.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontSize: '1.2rem' }}>{w.emoji || '💪'}</span>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{w.name}</div>
                                        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>{w.sets} sets · {w.duration} min</div>
                                    </div>
                                </div>
                                <span style={{ fontWeight: 700, color: '#a78bfa', fontSize: '0.9rem' }}>–{w.calories} kcal</span>
                            </div>
                        ))}
                    </GlassCard>

                    {/* Manual exercises */}
                    {manualExercises.length > 0 && (
                        <GlassCard style={{ marginBottom: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                <Dumbbell size={16} color="#ef4444" />
                                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Manual Exercises ({manualExercises.length})</span>
                            </div>
                            {manualExercises.map((e, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < manualExercises.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{e.name}</div>
                                        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>{e.duration} min</div>
                                    </div>
                                    <span style={{ fontWeight: 700, color: '#ef4444', fontSize: '0.9rem' }}>–{e.calories} kcal</span>
                                </div>
                            ))}
                        </GlassCard>
                    )}

                    {/* Steps detail */}
                    {data.steps?.steps > 0 && (
                        <GlassCard>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                <Footprints size={16} color="#10b981" />
                                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Steps</span>
                            </div>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <Pill label="Steps" value={data.steps.steps.toLocaleString()} color="#10b981" />
                                <Pill label="Calories" value={`${data.steps.calories} kcal`} color="#f59e0b" />
                                <Pill label="Distance" value={`${data.steps.distance_km} km`} color="#3b86ef" />
                            </div>
                        </GlassCard>
                    )}
                </>
            )}
        </div>
    );
}
