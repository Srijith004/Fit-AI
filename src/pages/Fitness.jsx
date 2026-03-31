import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '../context/UserContext';
import { useData } from '../context/DataContext';
import GlassCard from '../components/GlassCard';
import {
    CheckCircle, Dumbbell, Sparkles, Loader, Timer,
    Plus, Trash2, Trophy, Zap, Target, TrendingUp,
    ChevronDown, ChevronUp, Play, Flame
} from 'lucide-react';
import { getAIWorkoutPlan, getExerciseCalories, analyzeWorkoutDay } from '../lib/gemini';

// ─── Sub-components ────────────────────────────────────────────────────────────

const StatChip = ({ icon: Icon, value, label, color }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '12px 10px', flex: 1, border: '1px solid rgba(255,255,255,0.06)' }}>
        <Icon size={18} color={color} style={{ marginBottom: '4px' }} />
        <div style={{ fontWeight: '800', fontSize: '1.1rem', color }}>{value}</div>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{label}</div>
    </div>
);

const ExerciseCard = ({ exercise, index, checked, onCheck }) => {
    const [expanded, setExpanded] = useState(false);
    return (
        <div style={{
            background: checked ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${checked ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.07)'}`,
            borderRadius: '14px', overflow: 'hidden', transition: 'all 0.3s ease',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', cursor: 'pointer' }}
                onClick={() => setExpanded(v => !v)}>
                <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{exercise.emoji || '💪'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                        fontWeight: '700', fontSize: '0.95rem',
                        textDecoration: checked ? 'line-through' : 'none',
                        color: checked ? 'var(--text-muted)' : 'var(--text)',
                        transition: 'all 0.2s ease',
                    }}>{exercise.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {exercise.sets && `${exercise.sets} sets × ${exercise.reps}`}
                        {exercise.duration && exercise.duration}
                        {exercise.rest && ` • Rest ${exercise.rest}`}
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    {exercise.calories_burned && (
                        <span style={{ fontSize: '0.72rem', color: '#ff2d78', background: 'rgba(255,45,120,0.1)', padding: '3px 7px', borderRadius: '8px', border: '1px solid rgba(255,45,120,0.2)' }}>
                            🔥{exercise.calories_burned}
                        </span>
                    )}
                    <div
                        onClick={(e) => { e.stopPropagation(); onCheck(index); }}
                        style={{
                            width: '28px', height: '28px', borderRadius: '8px',
                            border: checked ? 'none' : '2px solid rgba(255,255,255,0.2)',
                            background: checked ? '#10b981' : 'rgba(255,255,255,0.04)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                            boxShadow: checked ? '0 0 12px rgba(16,185,129,0.5)' : 'none',
                            fontSize: '0.7rem', color: 'white', fontWeight: '700', flexShrink: 0
                        }}
                    >{checked ? '✓' : ''}</div>
                    {expanded ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
                </div>
            </div>
            {expanded && (
                <div style={{ padding: '0 16px 14px', animation: 'fadeInUp 0.2s ease' }}>
                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', marginBottom: '10px' }} />
                    {exercise.muscle_group && (
                        <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                            {exercise.muscle_group.split(',').map(m => (
                                <span key={m} style={{ padding: '3px 8px', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: '8px', fontSize: '0.72rem', color: '#a78bfa' }}>{m.trim()}</span>
                            ))}
                        </div>
                    )}
                    {exercise.tip && (
                        <div style={{ padding: '8px 10px', background: 'rgba(0,242,234,0.05)', borderRadius: '8px', fontSize: '0.78rem', color: 'var(--text-dim)', border: '1px solid rgba(0,242,234,0.1)' }}>
                            💡 {exercise.tip}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ─── Manual Exercise Logger ────────────────────────────────────────────────────
const ManualLogger = ({ userWeightKg }) => {
    const { logManualExercise, activity, removeManualExercise, totalExerciseMinutes, todayCaloriesBurned } = useData();
    const [name, setName] = useState('');
    const [duration, setDuration] = useState(30);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const quickExercises = ['Running', 'Cycling', 'Swimming', 'Jump Rope', 'Yoga', 'Weight Training', 'HIIT', 'Brisk Walk', 'Dancing', 'Plank'];

    const handleLog = async () => {
        if (!name.trim()) return;
        setLoading(true);
        setError(null);
        try {
            const data = await getExerciseCalories(name.trim(), duration, userWeightKg || 70);
            logManualExercise({
                name: data.exercise,
                duration,
                calories: data.calories_burned,
                category: data.category,
                emoji: data.emoji || '💪',
                intensity: data.intensity,
                muscles: data.muscles_worked,
                tip: data.tip,
            });
            setName('');
            setDuration(30);
        } catch (err) {
            setError('Could not calculate calories. Try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            {/* Today's Stats */}
            {(activity.manualExercises.length > 0 || activity.workouts.length > 0) && (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <StatChip icon={Flame} value={todayCaloriesBurned} label="kcal burned" color="#ff2d78" />
                    <StatChip icon={Timer} value={`${totalExerciseMinutes}m`} label="active time" color="#f59e0b" />
                    <StatChip icon={Dumbbell} value={activity.manualExercises.length + activity.workouts.length} label="exercises" color="#10b981" />
                </div>
            )}

            {/* Input */}
            <GlassCard style={{ marginBottom: '16px' }}>
                <div style={{ fontWeight: '700', fontSize: '0.95rem', marginBottom: '14px' }}>
                    <Plus size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                    Log an Exercise
                </div>

                {/* Quick Select */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    {quickExercises.map(e => (
                        <button
                            key={e}
                            onClick={() => setName(e)}
                            style={{
                                padding: '5px 10px', borderRadius: '20px', cursor: 'pointer',
                                fontSize: '0.75rem', fontFamily: 'Inter, sans-serif',
                                border: `1px solid ${name === e ? 'rgba(0,242,234,0.5)' : 'rgba(255,255,255,0.1)'}`,
                                background: name === e ? 'rgba(0,242,234,0.1)' : 'rgba(255,255,255,0.03)',
                                color: name === e ? 'var(--primary)' : 'var(--text-dim)',
                                transition: 'all 0.15s ease',
                            }}
                        >{e}</button>
                    ))}
                </div>

                {/* Text input */}
                <input
                    type="text"
                    placeholder="Or type any exercise (e.g., Badminton, Pilates...)"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !loading && handleLog()}
                    style={{
                        width: '100%', padding: '12px 14px', borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.4)',
                        color: 'white', fontSize: '0.9rem', fontFamily: 'Inter, sans-serif',
                        outline: 'none', marginBottom: '12px', boxSizing: 'border-box',
                        transition: 'border-color 0.2s ease',
                    }}
                    onFocus={e => e.target.style.borderColor = 'rgba(0,242,234,0.4)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />

                {/* Duration Slider */}
                <div style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--text-dim)' }}>Duration</span>
                        <span style={{ fontWeight: '700', color: 'var(--primary)' }}>{duration} minutes</span>
                    </div>
                    <input
                        type="range" min="5" max="120" step="5"
                        value={duration}
                        onChange={e => setDuration(Number(e.target.value))}
                        style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        <span>5 min</span><span>30 min</span><span>60 min</span><span>120 min</span>
                    </div>
                </div>

                {error && <div style={{ padding: '8px 12px', background: 'rgba(255,45,120,0.08)', borderRadius: '8px', color: 'var(--secondary)', fontSize: '0.82rem', marginBottom: '10px' }}>⚠️ {error}</div>}

                <button
                    className="btn btn-primary w-full"
                    onClick={handleLog}
                    disabled={!name.trim() || loading}
                    style={{ justifyContent: 'center', opacity: (!name.trim() || loading) ? 0.6 : 1 }}
                >
                    {loading ? <><Loader size={16} className="animate-spin" /> Calculating Calories…</> : <><Zap size={16} /> Log & Calculate Calories</>}
                </button>
            </GlassCard>

            {/* Today's Log */}
            {activity.manualExercises.length > 0 && (
                <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '10px' }}>Today's Exercise Log</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {[...activity.manualExercises].reverse().map((ex, i) => (
                            <GlassCard key={i} style={{ padding: '14px 16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{ex.emoji || '💪'}</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '600', fontSize: '0.95rem', marginBottom: '2px' }}>{ex.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            {ex.duration} min • {ex.intensity || 'Moderate'} • {ex.time}
                                        </div>
                                        {ex.muscles?.length > 0 && (
                                            <div style={{ marginTop: '5px', display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                                {ex.muscles.slice(0, 3).map(m => (
                                                    <span key={m} style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: '6px', color: '#a78bfa' }}>{m}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                                        <div style={{ fontWeight: '800', color: '#ff2d78', fontSize: '1rem' }}>-{ex.calories}</div>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>kcal</div>
                                        <button onClick={() => removeManualExercise(activity.manualExercises.length - 1 - i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0' }}>
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </div>
                                {ex.tip && (
                                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                                        💡 {ex.tip}
                                    </div>
                                )}
                            </GlassCard>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Goal Tracker ─────────────────────────────────────────────────────────────
const GoalTracker = () => {
    const { activity, updateGoals } = useData();
    const goals = activity.goals || {};
    const totalExercises = activity.manualExercises.length + activity.workouts.length;
    const totalCalBurned = [
        ...activity.workouts.map(w => w.calories || 0),
        ...activity.manualExercises.map(e => e.calories || 0),
    ].reduce((a, b) => a + b, 0);

    const weeklyTarget = goals.weeklyWorkouts || 5;

    return (
        <div>
            <GlassCard style={{ marginBottom: '14px', background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(0,242,234,0.04))' }}>
                <div style={{ fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Target size={18} color="#a78bfa" /> Weekly Goal
                </div>

                <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '8px' }}>
                        <span style={{ color: 'var(--text-dim)' }}>Workouts per week</span>
                        <span style={{ fontWeight: '700', color: '#a78bfa' }}>{weeklyTarget} sessions</span>
                    </div>
                    <input type="range" min="1" max="7" value={weeklyTarget} onChange={e => updateGoals({ weeklyWorkouts: Number(e.target.value) })}
                        style={{ width: '100%', accentColor: '#7c3aed', cursor: 'pointer' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                        {['1', '2', '3', '4', '5', '6', '7'].map(n => <span key={n}>{n}</span>)}
                    </div>
                </div>

                <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '12px 0' }} />

                <div style={{ display: 'flex', gap: '8px' }}>
                    <StatChip icon={Target} value={totalExercises} label="done today" color="#a78bfa" />
                    <StatChip icon={Flame} value={totalCalBurned} label="kcal burned" color="#ff2d78" />
                    <StatChip icon={Trophy} value={activity.streak.current} label="day streak" color="#f59e0b" />
                </div>
            </GlassCard>

            {/* Weekly dots */}
            <GlassCard style={{ padding: '16px' }}>
                <div style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '12px', color: 'var(--text-dim)' }}>This Week</div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                        const today = new Date().getDay();
                        const adjustedToday = today === 0 ? 6 : today - 1;
                        const isToday = i === adjustedToday;
                        const isDone = isToday && (activity.workouts.length > 0 || activity.manualExercises.length > 0);
                        const isPast = i < adjustedToday;
                        return (
                            <div key={day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                <div style={{
                                    width: '32px', height: '32px', borderRadius: '10px',
                                    background: isDone ? '#10b981' : isToday ? 'rgba(0,242,234,0.1)' : isPast ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.03)',
                                    border: isToday ? '1px solid rgba(0,242,234,0.4)' : '1px solid rgba(255,255,255,0.06)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: isDone ? '0 0 10px rgba(16,185,129,0.3)' : 'none',
                                    fontSize: '0.85rem',
                                }}>
                                    {isDone ? '✓' : isToday ? '●' : ''}
                                </div>
                                <span style={{ fontSize: '0.6rem', color: isToday ? 'var(--primary)' : 'var(--text-muted)' }}>{day}</span>
                            </div>
                        );
                    })}
                </div>
            </GlassCard>
        </div>
    );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const Fitness = () => {
    const { user } = useUser();
    const { logWorkout, activity } = useData();
    const [tab, setTab] = useState('plan');
    const [aiPlan, setAiPlan] = useState(null);
    const [loadingPlan, setLoadingPlan] = useState(false);
    const [planError, setPlanError] = useState(null);
    const [checked, setChecked] = useState({});
    const [completed, setCompleted] = useState(false);
    const [analysis, setAnalysis] = useState(null);

    const checkedCount = Object.values(checked).filter(Boolean).length;
    const mainExercises = aiPlan?.main_workout || [];
    const allChecked = mainExercises.length > 0 && checkedCount === mainExercises.length;

    const fetchPlan = async () => {
        setLoadingPlan(true);
        setPlanError(null);
        setChecked({});
        setCompleted(false);
        try {
            const plan = await getAIWorkoutPlan(user?.goal || 'maintain', user?.activityLevel || 'moderate', user?.fitnessLevel || 'beginner', user?.weight || 70);
            setAiPlan(plan);
        } catch (err) {
            setPlanError(err.message || 'Could not generate plan. Try again.');
        } finally {
            setLoadingPlan(false);
        }
    };

    const handleFinish = async () => {
        logWorkout({
            name: aiPlan?.plan_name || 'AI Training',
            duration: aiPlan?.duration || '45 min',
            calories: aiPlan?.total_calories || 300,
        });
        setCompleted(true);
        // Get AI analysis
        try {
            const result = await analyzeWorkoutDay([{ name: aiPlan?.plan_name, duration: parseInt(aiPlan?.duration), calories: aiPlan?.total_calories }], user?.goal);
            setAnalysis(result);
        } catch { /* optional */ }
    };

    const tabs = [
        { key: 'plan', label: '⚡ AI Plan' },
        { key: 'log', label: '✏️ Log Exercise' },
        { key: 'goals', label: '🎯 Goals' },
    ];

    return (
        <div style={{ paddingBottom: '10px', animation: 'fadeInUp 0.5s ease' }}>
            {/* Header */}
            <div style={{ marginBottom: '20px' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '4px' }}>
                    <span className="text-gradient">Fitness</span>
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>AI-powered training & exercise tracking</p>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: '14px', padding: '4px', marginBottom: '20px', border: '1px solid var(--border)' }}>
                {tabs.map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)} style={{
                        flex: 1, padding: '10px 4px', borderRadius: '10px', border: 'none',
                        background: tab === t.key ? 'rgba(255,255,255,0.09)' : 'transparent',
                        color: tab === t.key ? 'var(--text)' : 'var(--text-muted)',
                        fontWeight: tab === t.key ? '600' : '400',
                        cursor: 'pointer', fontSize: '0.78rem', transition: 'all 0.2s ease',
                        fontFamily: 'Inter, sans-serif',
                    }}>{t.label}</button>
                ))}
            </div>

            {/* AI Plan Tab */}
            {tab === 'plan' && (
                <div style={{ animation: 'fadeInUp 0.35s ease' }}>
                    {!aiPlan && !loadingPlan && (
                        <GlassCard style={{ textAlign: 'center', padding: '40px 24px', marginBottom: '16px', background: 'linear-gradient(135deg, rgba(124,58,237,0.07), rgba(0,242,234,0.04))' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '14px', animation: 'float 3s ease-in-out infinite' }}>🤖</div>
                            <h3 style={{ fontWeight: '800', fontSize: '1.2rem', marginBottom: '8px' }}>
                                <span className="text-gradient">AI Workout Plan</span>
                            </h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '20px', lineHeight: 1.5 }}>
                                Gemini AI creates a personalized daily workout tailored to your <strong>{user?.goal?.replace('_', ' ') || 'fitness'}</strong> goal and <strong>{user?.activityLevel || 'moderate'}</strong> activity level.
                            </p>
                            <button className="btn btn-gradient btn-lg w-full" onClick={fetchPlan} style={{ justifyContent: 'center' }}>
                                <Sparkles size={18} /> Generate My Workout
                            </button>
                        </GlassCard>
                    )}

                    {planError && (
                        <div style={{ padding: '14px', background: 'rgba(255,45,120,0.08)', border: '1px solid rgba(255,45,120,0.25)', borderRadius: '12px', color: 'var(--secondary)', fontSize: '0.85rem', marginBottom: '14px' }}>
                            ⚠️ {planError}
                            <button onClick={fetchPlan} className="btn btn-sm" style={{ marginLeft: '10px', background: 'rgba(255,255,255,0.06)' }}>Retry</button>
                        </div>
                    )}

                    {loadingPlan && (
                        <div style={{ textAlign: 'center', padding: '50px 20px' }}>
                            <div style={{ width: '56px', height: '56px', margin: '0 auto 16px', border: '3px solid rgba(124,58,237,0.15)', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                            <div style={{ fontWeight: '700', fontSize: '1.05rem', marginBottom: '6px' }}>Building Your Plan…</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Gemini AI is crafting a personalized workout</div>
                        </div>
                    )}

                    {aiPlan && !completed && (
                        <div>
                            {/* Plan header */}
                            <GlassCard style={{ marginBottom: '14px', background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(0,242,234,0.05))' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                    <div>
                                        <div style={{ fontWeight: '800', fontSize: '1.1rem', marginBottom: '3px' }}>{aiPlan.plan_name}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                            <span>⏱ {aiPlan.duration}</span>
                                            <span>🔥 ~{aiPlan.total_calories} kcal</span>
                                            <span>⚡ {aiPlan.intensity}</span>
                                        </div>
                                    </div>
                                    <button onClick={fetchPlan} className="btn btn-sm" style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.3)' }}>
                                        <Sparkles size={13} /> Refresh
                                    </button>
                                </div>
                                {aiPlan.motivational_quote && (
                                    <div style={{ padding: '10px 14px', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', fontSize: '0.82rem', color: 'var(--text-dim)', fontStyle: 'italic', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        "{aiPlan.motivational_quote}"
                                    </div>
                                )}
                                {checkedCount > 0 && (
                                    <div style={{ marginTop: '12px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '5px', color: 'var(--text-muted)' }}>
                                            <span>Progress</span>
                                            <span style={{ color: '#10b981', fontWeight: '600' }}>{checkedCount}/{mainExercises.length}</span>
                                        </div>
                                        <div style={{ height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${(checkedCount / mainExercises.length) * 100}%`, background: 'linear-gradient(90deg, #00f2ea, #10b981)', borderRadius: '3px', transition: 'width 0.4s ease' }} />
                                        </div>
                                    </div>
                                )}
                            </GlassCard>

                            {/* Warmup */}
                            {aiPlan.warmup?.length > 0 && (
                                <div style={{ marginBottom: '14px' }}>
                                    <div style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>🌡️ Warmup</div>
                                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                                        {aiPlan.warmup.map((w, i) => (
                                            <div key={i} style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '10px', padding: '8px 12px', flexShrink: 0, fontSize: '0.82rem' }}>
                                                <span style={{ marginRight: '5px' }}>{w.emoji}</span>
                                                <strong>{w.name}</strong>
                                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>{w.duration}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Main exercises */}
                            <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>💪 Main Workout</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                                {mainExercises.map((exp, i) => (
                                    <ExerciseCard key={i} exercise={exp} index={i} checked={!!checked[i]} onCheck={i => setChecked(p => ({ ...p, [i]: !p[i] }))} />
                                ))}
                            </div>

                            {/* Cooldown */}
                            {aiPlan.cooldown?.length > 0 && (
                                <div style={{ marginBottom: '16px' }}>
                                    <div style={{ fontSize: '0.75rem', color: '#60a5fa', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>🧊 Cooldown</div>
                                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                                        {aiPlan.cooldown.map((c, i) => (
                                            <div key={i} style={{ background: 'rgba(96,165,250,0.07)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: '10px', padding: '8px 12px', flexShrink: 0, fontSize: '0.82rem' }}>
                                                <span style={{ marginRight: '5px' }}>{c.emoji}</span>
                                                <strong>{c.name}</strong>
                                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>{c.duration}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Finish Button */}
                            <button
                                className={`btn w-full btn-lg ${allChecked ? 'btn-primary' : ''}`}
                                onClick={allChecked ? handleFinish : undefined}
                                style={{
                                    justifyContent: 'center',
                                    opacity: checkedCount === 0 ? 0.5 : 1,
                                    background: allChecked ? undefined : checkedCount > 0 ? 'rgba(0,242,234,0.12)' : 'rgba(255,255,255,0.05)',
                                    color: allChecked ? '#000' : checkedCount > 0 ? 'var(--primary)' : 'var(--text-muted)',
                                    border: allChecked ? 'none' : `1px solid ${checkedCount > 0 ? 'rgba(0,242,234,0.3)' : 'rgba(255,255,255,0.1)'}`,
                                    cursor: checkedCount === 0 ? 'default' : 'pointer',
                                }}
                            >
                                {allChecked ? <><Trophy size={18} /> Complete Workout!</> : checkedCount > 0 ? <><Zap size={16} /> {checkedCount}/{mainExercises.length} Done — Keep Going!</> : <>Tick exercises to complete</>}
                            </button>
                        </div>
                    )}

                    {/* Completed State */}
                    {completed && (
                        <div style={{ textAlign: 'center', animation: 'fadeInUp 0.5s ease' }}>
                            <div style={{
                                width: '110px', height: '110px', margin: '0 auto 22px',
                                background: 'linear-gradient(135deg, rgba(0,242,234,0.2), rgba(16,185,129,0.2))',
                                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: '2px solid rgba(0,242,234,0.4)', boxShadow: '0 0 60px rgba(0,242,234,0.2)',
                                animation: 'float 3s ease-in-out infinite'
                            }}>
                                <CheckCircle size={55} color="var(--primary)" strokeWidth={1.5} />
                            </div>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '6px' }}>
                                <span className="text-gradient">Workout Complete!</span>
                            </h2>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>You crushed it! Streak is growing 🔥</p>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                                {[
                                    { label: 'Calories', value: aiPlan?.total_calories || 300, unit: 'kcal', color: '#ff2d78' },
                                    { label: 'Duration', value: aiPlan?.duration || '45 min', unit: '', color: '#f59e0b' },
                                    { label: 'Exercises', value: mainExercises.length, unit: 'done', color: '#00f2ea' },
                                ].map(s => (
                                    <GlassCard key={s.label} style={{ padding: '14px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '1.3rem', fontWeight: '800', color: s.color }}>{s.value}</div>
                                        {s.unit && <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{s.unit}</div>}
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '2px' }}>{s.label}</div>
                                    </GlassCard>
                                ))}
                            </div>

                            {analysis && (
                                <GlassCard style={{ textAlign: 'left', marginBottom: '16px', padding: '16px' }}>
                                    <div style={{ fontWeight: '700', marginBottom: '8px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                                        <span>{analysis.emoji || '🏆'}</span> AI Workout Review
                                    </div>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '8px', lineHeight: 1.5 }}>{analysis.summary}</p>
                                    {analysis.suggestion && <div style={{ padding: '8px 10px', background: 'rgba(0,242,234,0.05)', borderRadius: '8px', fontSize: '0.78rem', color: 'var(--primary)' }}>💡 {analysis.suggestion}</div>}
                                    {analysis.recovery_tip && <div style={{ marginTop: '6px', padding: '8px 10px', background: 'rgba(124,58,237,0.05)', borderRadius: '8px', fontSize: '0.78rem', color: '#a78bfa' }}>🛌 {analysis.recovery_tip}</div>}
                                </GlassCard>
                            )}

                            <button className="btn btn-gradient w-full" onClick={() => { setCompleted(false); setAiPlan(null); setChecked({}); setAnalysis(null); }} style={{ justifyContent: 'center' }}>
                                <Sparkles size={16} /> Generate New Plan
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Manual Log Tab */}
            {tab === 'log' && (
                <div style={{ animation: 'fadeInUp 0.35s ease' }}>
                    <ManualLogger userWeightKg={user?.weight} />
                </div>
            )}

            {/* Goals Tab */}
            {tab === 'goals' && (
                <div style={{ animation: 'fadeInUp 0.35s ease' }}>
                    <GoalTracker />
                </div>
            )}
        </div>
    );
};

export default Fitness;
