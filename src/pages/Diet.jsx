import React, { useState, useCallback } from 'react';
import { useData } from '../context/DataContext';
import { useUser } from '../context/UserContext';
import GlassCard from '../components/GlassCard';
import CameraCapture from '../components/CameraCapture';
import { TrendingUp, MapPin, Loader, Sparkles, ChevronDown, ChevronUp, Trash2, Plus } from 'lucide-react';
import { getIndianFoodSuggestions } from '../lib/gemini';

const INDIAN_REGIONS = [
    { value: 'North', label: 'North India', emoji: '🏔️', desc: 'Punjabi, Mughlai, UP cuisine' },
    { value: 'South', label: 'South India', emoji: '🌴', desc: 'Tamil, Kerala, Karnataka cuisine' },
    { value: 'West', label: 'West India', emoji: '🌊', desc: 'Gujarati, Maharashtrian, Goan cuisine' },
    { value: 'East', label: 'East India', emoji: '🌿', desc: 'Bengali, Odia, Assamese cuisine' },
    { value: 'Central', label: 'Central India', emoji: '🌾', desc: 'Madhya Pradesh, Rajasthani cuisine' },
    { value: 'Northeast', label: 'Northeast India', emoji: '🏞️', desc: 'Manipuri, Nagaland, Assam cuisine' },
];

const MEAL_SLOTS = [
    { key: 'breakfast', label: 'Breakfast', time: '7–9 AM', emoji: '🌅' },
    { key: 'mid_morning', label: 'Mid Morning', time: '10–11 AM', emoji: '🍌' },
    { key: 'lunch', label: 'Lunch', time: '12–2 PM', emoji: '☀️' },
    { key: 'evening_snack', label: 'Evening Snack', time: '4–6 PM', emoji: '☕' },
    { key: 'dinner', label: 'Dinner', time: '7–9 PM', emoji: '🌙' },
];

const MealSuggestionCard = ({ slot, meal, onLog }) => {
    const [expanded, setExpanded] = useState(false);
    return (
        <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '14px', overflow: 'hidden', transition: 'all 0.2s ease'
        }}>
            <div
                style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}
                onClick={() => setExpanded(v => !v)}
            >
                <span style={{ fontSize: '1.6rem', flexShrink: 0 }}>{meal.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{slot.emoji} {slot.label}</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '1px 6px', borderRadius: '10px' }}>{slot.time}</span>
                    </div>
                    <div style={{ fontWeight: '700', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{meal.name}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontWeight: '700', color: 'var(--secondary)', fontSize: '0.95rem' }}>{meal.calories}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>kcal</div>
                </div>
                {expanded ? <ChevronUp size={15} color="var(--text-muted)" /> : <ChevronDown size={15} color="var(--text-muted)" />}
            </div>

            {expanded && (
                <div style={{ padding: '0 16px 14px', animation: 'fadeInUp 0.25s ease' }}>
                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', marginBottom: '12px' }} />
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginBottom: '10px', lineHeight: 1.5 }}>{meal.description}</p>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                        {[
                            { l: 'P', v: meal.protein, u: 'g', c: '#3b82f6' },
                            { l: 'C', v: meal.carbs, u: 'g', c: '#f59e0b' },
                            { l: 'F', v: meal.fat, u: 'g', c: '#ec4899' },
                        ].map(m => (
                            <span key={m.l} style={{ padding: '4px 10px', background: `${m.c}12`, border: `1px solid ${m.c}30`, borderRadius: '8px', fontSize: '0.75rem', color: m.c, fontWeight: '600' }}>
                                {m.l}: {m.v}{m.u}
                            </span>
                        ))}
                    </div>
                    {meal.recipe_hint && (
                        <div style={{ padding: '8px 10px', background: 'rgba(0,242,234,0.05)', borderRadius: '8px', fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '10px' }}>
                            👨‍🍳 {meal.recipe_hint}
                        </div>
                    )}
                    <button
                        className="btn btn-sm btn-primary"
                        onClick={(e) => { e.stopPropagation(); onLog(meal); }}
                        style={{ width: '100%', justifyContent: 'center' }}
                    >
                        <Plus size={14} /> Log This Meal
                    </button>
                </div>
            )}
        </div>
    );
};

const Diet = () => {
    const { activity, logMeal, removeMeal, todayCalories } = useData();
    const { user, calculateTDEE } = useUser();
    const tdee = calculateTDEE();

    const [tab, setTab] = useState('scan');
    const [region, setRegion] = useState('North');
    const [mealPlan, setMealPlan] = useState(null);
    const [loadingPlan, setLoadingPlan] = useState(false);
    const [planError, setPlanError] = useState(null);

    const totalProtein = activity.meals.reduce((a, m) => a + (m.protein || 0), 0);
    const totalCarbs = activity.meals.reduce((a, m) => a + (m.carbs || 0), 0);
    const totalFat = activity.meals.reduce((a, m) => a + (m.fat || 0), 0);

    const handleAnalysis = (result) => {
        logMeal({
            name: result.name,
            calories: result.calories,
            protein: result.protein || 0,
            carbs: result.carbs || 0,
            fat: result.fat || 0,
            fiber: result.fiber || 0,
            cuisine: result.cuisine || '',
            emoji: '🍽️',
            health_score: result.health_score,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
        setTab('history');
    };

    const fetchMealPlan = async () => {
        setLoadingPlan(true);
        setPlanError(null);
        setMealPlan(null);
        try {
            const plan = await getIndianFoodSuggestions(region, user?.goal || 'maintain', tdee, user?.dietType || 'standard', user?.allergies || '');
            setMealPlan(plan);
        } catch (err) {
            setPlanError(err.message || 'Could not fetch meal plan. Try again.');
        } finally {
            setLoadingPlan(false);
        }
    };

    const logSuggestedMeal = (meal) => {
        logMeal({
            name: meal.name,
            calories: meal.calories,
            protein: meal.protein || 0,
            carbs: meal.carbs || 0,
            fat: meal.fat || 0,
            emoji: meal.emoji || '🍛',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
        setTab('history');
    };

    const tabs = [
        { key: 'scan', label: '📸 AI Scan' },
        { key: 'suggest', label: '🇮🇳 Indian Meals' },
        { key: 'history', label: `📋 Today (${activity.meals.length})` },
    ];

    return (
        <div style={{ paddingBottom: '10px', animation: 'fadeInUp 0.5s ease' }}>
            {/* Header */}
            <div style={{ marginBottom: '20px' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '4px' }}>
                    <span className="text-gradient">Smart Diet</span>
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>AI-powered calorie & nutrition tracker</p>
            </div>

            {/* Daily Summary Strip */}
            {activity.meals.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
                    {[
                        { label: 'Calories', value: todayCalories, unit: 'kcal', color: '#ff2d78', max: tdee },
                        { label: 'Protein', value: totalProtein, unit: 'g', color: '#3b82f6', max: Math.round((tdee * 0.30) / 4) },
                        { label: 'Carbs', value: totalCarbs, unit: 'g', color: '#f59e0b', max: Math.round((tdee * 0.45) / 4) },
                        { label: 'Fat', value: totalFat, unit: 'g', color: '#ec4899', max: Math.round((tdee * 0.25) / 9) },
                    ].map(s => (
                        <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '12px 10px', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>{s.label}</div>
                            <div style={{ fontWeight: '800', fontSize: '1rem', color: s.color }}>{s.value}</div>
                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{s.unit}</div>
                            <div style={{ marginTop: '6px', height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${Math.min(100, (s.value / s.max) * 100)}%`, background: s.color, borderRadius: '2px', transition: 'width 1s ease' }} />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Tabs */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: '14px', padding: '4px', marginBottom: '20px', border: '1px solid var(--border)' }}>
                {tabs.map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)} style={{
                        flex: 1, padding: '10px 6px', borderRadius: '10px', border: 'none',
                        background: tab === t.key ? 'rgba(255,255,255,0.09)' : 'transparent',
                        color: tab === t.key ? 'var(--text)' : 'var(--text-muted)',
                        fontWeight: tab === t.key ? '600' : '400',
                        cursor: 'pointer', fontSize: '0.78rem', transition: 'all 0.2s ease',
                        fontFamily: 'Inter, sans-serif',
                    }}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* AI Scan Tab */}
            {tab === 'scan' && <CameraCapture onAnalyze={handleAnalysis} />}

            {/* Indian Food Suggestions Tab */}
            {tab === 'suggest' && (
                <div style={{ animation: 'fadeInUp 0.35s ease' }}>
                    <GlassCard style={{ marginBottom: '16px', background: 'linear-gradient(135deg, rgba(245,158,11,0.06), rgba(255,45,120,0.04))' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                            <MapPin size={18} color="#f59e0b" />
                            <span style={{ fontWeight: '700', fontSize: '1rem' }}>Choose Your Region</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                            {INDIAN_REGIONS.map(r => (
                                <div
                                    key={r.value}
                                    onClick={() => setRegion(r.value)}
                                    style={{
                                        padding: '12px', borderRadius: '12px', cursor: 'pointer',
                                        border: `1px solid ${region === r.value ? 'rgba(245,158,11,0.5)' : 'rgba(255,255,255,0.07)'}`,
                                        background: region === r.value ? 'rgba(245,158,11,0.1)' : 'rgba(0,0,0,0.2)',
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    <div style={{ fontWeight: region === r.value ? '700' : '500', fontSize: '0.88rem', color: region === r.value ? '#f59e0b' : 'var(--text)' }}>
                                        {r.emoji} {r.label}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>{r.desc}</div>
                                </div>
                            ))}
                        </div>
                        <button
                            className="btn btn-primary w-full"
                            onClick={fetchMealPlan}
                            disabled={loadingPlan}
                            style={{ justifyContent: 'center', opacity: loadingPlan ? 0.8 : 1 }}
                        >
                            {loadingPlan ? <><Loader size={16} className="animate-spin" /> Generating Plan...</> : <><Sparkles size={16} /> Get {region} India Meal Plan</>}
                        </button>
                    </GlassCard>

                    {planError && (
                        <div style={{ padding: '14px', background: 'rgba(255,45,120,0.08)', border: '1px solid rgba(255,45,120,0.25)', borderRadius: '12px', color: 'var(--secondary)', fontSize: '0.85rem', marginBottom: '12px' }}>
                            ⚠️ {planError}
                        </div>
                    )}

                    {loadingPlan && (
                        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                            <div style={{ width: '52px', height: '52px', margin: '0 auto 14px', border: '3px solid rgba(245,158,11,0.15)', borderTopColor: '#f59e0b', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                            <div style={{ fontWeight: '600', marginBottom: '6px' }}>Crafting your meal plan…</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Gemini AI is selecting authentic {region} Indian dishes</div>
                        </div>
                    )}

                    {mealPlan && (
                        <div style={{ animation: 'fadeInUp 0.4s ease' }}>
                            <div style={{ marginBottom: '14px', padding: '12px 16px', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '12px' }}>
                                <div style={{ fontWeight: '700', marginBottom: '3px' }}>🇮🇳 {mealPlan.region} India Day Plan</div>
                                <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>{mealPlan.region_description}</div>
                                <div style={{ marginTop: '6px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: '600' }}>~{mealPlan.total_calories} kcal total</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                                {MEAL_SLOTS.map(slot => mealPlan.meals[slot.key] && (
                                    <MealSuggestionCard key={slot.key} slot={slot} meal={mealPlan.meals[slot.key]} onLog={logSuggestedMeal} />
                                ))}
                            </div>
                            {mealPlan.nutrition_tips?.length > 0 && (
                                <GlassCard style={{ padding: '16px' }}>
                                    <div style={{ fontWeight: '700', fontSize: '0.85rem', marginBottom: '10px', color: 'var(--primary)' }}>💡 Nutrition Tips</div>
                                    {mealPlan.nutrition_tips.map((tip, i) => (
                                        <div key={i} style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginBottom: '6px', paddingLeft: '10px', borderLeft: '2px solid rgba(0,242,234,0.3)' }}>{tip}</div>
                                    ))}
                                </GlassCard>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* History Tab */}
            {tab === 'history' && (
                <div style={{ animation: 'fadeInUp 0.35s ease' }}>
                    {activity.meals.length === 0 ? (
                        <GlassCard style={{ textAlign: 'center', padding: '40px', border: '1px dashed rgba(255,255,255,0.1)', background: 'transparent' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🍽️</div>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>No meals logged today</p>
                            <button onClick={() => setTab('scan')} className="btn btn-primary btn-sm" style={{ marginTop: '14px' }}>📸 Scan First Meal</button>
                        </GlassCard>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {[...activity.meals].reverse().map((meal, i) => (
                                <GlassCard key={i} style={{ padding: '14px 16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1, minWidth: 0 }}>
                                            <span style={{ fontSize: '1.8rem', flexShrink: 0 }}>{meal.emoji || '🍽️'}</span>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: '600', marginBottom: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meal.name}</div>
                                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{meal.time}{meal.cuisine ? ` • ${meal.cuisine}` : ''}</div>
                                                {meal.health_score && (
                                                    <div style={{ marginTop: '4px' }}>
                                                        <span style={{ fontSize: '0.68rem', padding: '2px 7px', borderRadius: '10px', background: meal.health_score >= 7 ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)', color: meal.health_score >= 7 ? '#10b981' : '#f59e0b', border: `1px solid ${meal.health_score >= 7 ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}` }}>
                                                            ⭐ {meal.health_score}/10
                                                        </span>
                                                    </div>
                                                )}
                                                <div style={{ display: 'flex', gap: '5px', marginTop: '6px', flexWrap: 'wrap' }}>
                                                    {meal.protein > 0 && <span style={{ fontSize: '0.67rem', color: '#3b82f6', background: 'rgba(59,130,246,0.1)', padding: '2px 5px', borderRadius: '4px' }}>P {meal.protein}g</span>}
                                                    {meal.carbs > 0 && <span style={{ fontSize: '0.67rem', color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '2px 5px', borderRadius: '4px' }}>C {meal.carbs}g</span>}
                                                    {meal.fat > 0 && <span style={{ fontSize: '0.67rem', color: '#ec4899', background: 'rgba(236,72,153,0.1)', padding: '2px 5px', borderRadius: '4px' }}>F {meal.fat}g</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                                            <div>
                                                <div style={{ color: 'var(--secondary)', fontWeight: '700', fontSize: '1rem', textAlign: 'right' }}>+{meal.calories}</div>
                                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'right' }}>kcal</div>
                                            </div>
                                            <button
                                                onClick={() => removeMeal(activity.meals.length - 1 - i)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </GlassCard>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Diet;
