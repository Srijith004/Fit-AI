/* eslint-disable react/prop-types */
import React, { useState, useRef } from 'react';
import { Camera, Sparkles, RotateCcw, AlertCircle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { analyzeFood } from '../lib/gemini';
import { useUser } from '../context/UserContext';

const MacroRing = ({ value, max, color, label, unit }) => {
    const size = 60;
    const r = 22;
    const circ = 2 * Math.PI * r;
    const pct = Math.min(1, value / max);
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
                <circle cx={size / 2} cy={size / 2} r={r} fill="none"
                    stroke={color} strokeWidth={6} strokeLinecap="round"
                    strokeDasharray={circ} strokeDashoffset={circ - pct * circ}
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                    style={{ filter: `drop-shadow(0 0 4px ${color})`, transition: 'stroke-dashoffset 1s ease' }}
                />
                <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
                    style={{ fontSize: '11px', fontWeight: '700', fill: color, fontFamily: 'Inter,sans-serif' }}>
                    {value}{unit}
                </text>
            </svg>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{label}</span>
        </div>
    );
};

const ScoreBadge = ({ score }) => {
    const color = score >= 8 ? '#10b981' : score >= 5 ? '#f59e0b' : '#ff2d78';
    const label = score >= 8 ? 'Excellent' : score >= 6 ? 'Good' : score >= 4 ? 'Moderate' : 'Poor';
    return (
        <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '5px 12px', borderRadius: '20px',
            background: `${color}18`, border: `1px solid ${color}40`, color
        }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700' }}>{score}/10</span>
            <span style={{ fontSize: '0.75rem' }}>{label}</span>
        </div>
    );
};

const ImpactBar = ({ label, value, color }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', width: '70px', flexShrink: 0 }}>{label}</span>
        <div style={{ flex: 1, height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{
                height: '100%', width: `${Math.min(100, value)}%`,
                background: color, borderRadius: '3px',
                boxShadow: `0 0 6px ${color}60`,
                transition: 'width 1s ease'
            }} />
        </div>
        <span style={{ fontSize: '0.78rem', color, fontWeight: '600', width: '30px', textAlign: 'right' }}>{value}%</span>
    </div>
);

const CameraCapture = ({ onAnalyze }) => {
    const { user, calculateTDEE } = useUser();
    const [image, setImage] = useState(null);
    const [imageBase64, setImageBase64] = useState(null);
    const [mimeType, setMimeType] = useState('image/jpeg');
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const inputRef = useRef();

    const tdee = calculateTDEE();
    const proteinTarget = Math.round((tdee * 0.30) / 4);
    const carbTarget = Math.round((tdee * 0.45) / 4);
    const fatTarget = Math.round((tdee * 0.25) / 9);

    const handleCapture = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setError(null);
        setResult(null);
        const mime = file.type || 'image/jpeg';
        setMimeType(mime);
        const reader = new FileReader();
        reader.onloadend = () => {
            const full = reader.result;
            setImage(full);
            // Strip data:image/...;base64, prefix
            const base64 = full.split(',')[1];
            setImageBase64(base64);
        };
        reader.readAsDataURL(file);
    };

    const analyze = async () => {
        setAnalyzing(true);
        setError(null);
        try {
            const userGoals = { tdee, protein: proteinTarget, carbs: carbTarget, fat: fatTarget };
            const data = await analyzeFood(imageBase64, mimeType, userGoals);
            setResult(data);
        } catch (err) {
            setError(err.message || 'Analysis failed. Try again.');
        } finally {
            setAnalyzing(false);
        }
    };

    const confirmLog = () => {
        if (!result) return;
        onAnalyze({
            name: result.name,
            calories: result.calories,
            protein: result.protein,
            carbs: result.carbs,
            fat: result.fat,
            fiber: result.fiber || 0,
            cuisine: result.cuisine,
            emoji: '🍽️',
            health_score: result.health_score,
        });
        setImage(null);
        setImageBase64(null);
        setResult(null);
    };

    const reset = () => {
        setImage(null);
        setImageBase64(null);
        setResult(null);
        setError(null);
        setAnalyzing(false);
        if (inputRef.current) inputRef.current.value = '';
    };

    if (!image) {
        return (
            <label style={{ display: 'block', cursor: 'pointer' }}>
                <div
                    className="glass-panel"
                    style={{
                        padding: '40px 20px', textAlign: 'center',
                        border: '2px dashed rgba(0,242,234,0.25)',
                        borderRadius: '22px', background: 'rgba(0,242,234,0.02)',
                        cursor: 'pointer', transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,242,234,0.55)'; e.currentTarget.style.background = 'rgba(0,242,234,0.04)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,242,234,0.25)'; e.currentTarget.style.background = 'rgba(0,242,234,0.02)'; }}
                >
                    <div style={{
                        width: '80px', height: '80px',
                        background: 'linear-gradient(135deg, var(--primary), #00b4ad)',
                        borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 18px', boxShadow: '0 0 35px rgba(0,242,234,0.4)',
                        animation: 'float 3s ease-in-out infinite',
                    }}>
                        <Camera size={36} color="#000" />
                    </div>
                    <div style={{ fontWeight: '700', fontSize: '1.15rem', marginBottom: '6px' }}>Snap Your Meal</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.5 }}>
                        AI identifies any food — Indian, Chinese,<br />Italian, fast food, homemade & more
                    </div>
                    <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        {['🍛 Indian', '🍕 Italian', '🍜 Asian', '🥗 Healthy', '🌮 Mexican'].map(t => (
                            <span key={t} style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', fontSize: '0.75rem', color: 'var(--text-dim)', border: '1px solid var(--border)' }}>{t}</span>
                        ))}
                    </div>
                </div>
                <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={handleCapture} style={{ display: 'none' }} />
            </label>
        );
    }

    return (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div className="glass-panel" style={{ padding: '16px', borderRadius: '22px', overflow: 'hidden' }}>
                <img src={image} alt="Food" style={{ width: '100%', borderRadius: '14px', maxHeight: '280px', objectFit: 'cover', display: 'block' }} />

                {/* Action Buttons (before analysis) */}
                {!result && !analyzing && !error && (
                    <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                        <button className="btn" onClick={reset} style={{ flex: 1, background: 'rgba(255,255,255,0.05)' }}>
                            <RotateCcw size={15} /> Retake
                        </button>
                        <button className="btn btn-primary" onClick={analyze} style={{ flex: 2 }}>
                            <Sparkles size={15} /> Analyze with AI
                        </button>
                    </div>
                )}

                {/* Analyzing State */}
                {analyzing && (
                    <div style={{ textAlign: 'center', padding: '28px 20px' }}>
                        <div style={{
                            width: '52px', height: '52px', margin: '0 auto 14px',
                            border: '3px solid rgba(0,242,234,0.15)',
                            borderTopColor: 'var(--primary)',
                            borderRadius: '50%', animation: 'spin 1s linear infinite'
                        }} />
                        <div style={{ fontWeight: '700', fontSize: '1.05rem', marginBottom: '6px' }}>Gemini AI Analyzing...</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Identifying nutrients, macros & health impact</div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '14px' }}>
                            {['Calories', 'Macros', 'Vitamins', 'Impact'].map((s, i) => (
                                <span key={s} style={{ padding: '3px 8px', background: 'rgba(0,242,234,0.08)', borderRadius: '10px', fontSize: '0.7rem', color: 'var(--primary)', animation: `pulse 1.5s ease ${i * 0.2}s infinite` }}>{s}</span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div style={{ marginTop: '14px', padding: '14px', background: 'rgba(255,45,120,0.08)', borderRadius: '12px', border: '1px solid rgba(255,45,120,0.25)' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '10px' }}>
                            <AlertCircle size={18} color="var(--secondary)" style={{ flexShrink: 0, marginTop: '1px' }} />
                            <div style={{ fontSize: '0.85rem', color: 'var(--secondary)' }}>{error}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn btn-sm" onClick={reset} style={{ flex: 1 }}>Try Again</button>
                            <button className="btn btn-sm btn-primary" onClick={analyze} style={{ flex: 1 }}>Retry Analysis</button>
                        </div>
                    </div>
                )}

                {/* Result Card */}
                {result && (
                    <div style={{ marginTop: '14px', animation: 'fadeInUp 0.4s ease' }}>
                        {/* Food Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                            <div>
                                <div style={{ fontWeight: '800', fontSize: '1.15rem', marginBottom: '3px' }}>{result.name}</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                    🌍 {result.cuisine} • {result.serving_size}
                                </div>
                            </div>
                            <ScoreBadge score={result.health_score || 5} />
                        </div>

                        {/* Calorie big number */}
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(255,45,120,0.08), rgba(245,158,11,0.08))',
                            border: '1px solid rgba(255,45,120,0.2)', borderRadius: '14px',
                            padding: '14px 18px', marginBottom: '14px',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>TOTAL CALORIES</div>
                                <div style={{ fontSize: '2rem', fontWeight: '900', lineHeight: 1 }}>
                                    <span className="text-gradient-fire">{result.calories}</span>
                                    <span style={{ fontSize: '1rem', fontWeight: '400', color: 'var(--text-muted)' }}> kcal</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <MacroRing value={result.protein} max={proteinTarget} color="#3b82f6" label="Protein" unit="g" />
                                <MacroRing value={result.carbs} max={carbTarget} color="#f59e0b" label="Carbs" unit="g" />
                                <MacroRing value={result.fat} max={fatTarget} color="#ec4899" label="Fat" unit="g" />
                            </div>
                        </div>

                        {/* Meal Impact */}
                        <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '14px', padding: '14px', marginBottom: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
                                📊 Daily Impact
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginBottom: '10px' }}>
                                <ImpactBar label="Calories" value={result.meal_impact?.calorie_percent_of_daily || Math.round((result.calories / tdee) * 100)} color="#ff2d78" />
                                <ImpactBar label="Protein" value={result.meal_impact?.protein_percent_of_daily || Math.round((result.protein / proteinTarget) * 100)} color="#3b82f6" />
                                <ImpactBar label="Carbs" value={result.meal_impact?.carb_percent_of_daily || Math.round((result.carbs / carbTarget) * 100)} color="#f59e0b" />
                                <ImpactBar label="Fat" value={result.meal_impact?.fat_percent_of_daily || Math.round((result.fat / fatTarget) * 100)} color="#ec4899" />
                            </div>
                            {result.meal_impact?.assessment && (
                                <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)', lineHeight: 1.5, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
                                    {result.meal_impact.assessment}
                                </div>
                            )}
                            {result.meal_impact?.tip && (
                                <div style={{ marginTop: '8px', padding: '8px 10px', background: 'rgba(0,242,234,0.06)', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--primary)' }}>
                                    💡 {result.meal_impact.tip}
                                </div>
                            )}
                        </div>

                        {/* Expandable Detailed Nutrition */}
                        <button
                            onClick={() => setShowDetails(v => !v)}
                            style={{
                                width: '100%', padding: '10px', background: 'rgba(255,255,255,0.04)',
                                border: '1px solid var(--border)', borderRadius: '10px',
                                color: 'var(--text-dim)', cursor: 'pointer', display: 'flex',
                                alignItems: 'center', justifyContent: 'center', gap: '6px',
                                fontSize: '0.85rem', fontFamily: 'Inter, sans-serif', marginBottom: '10px',
                            }}
                        >
                            {showDetails ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                            {showDetails ? 'Hide' : 'Show'} Full Nutrition Details
                        </button>

                        {showDetails && (
                            <div style={{ animation: 'fadeInUp 0.3s ease', marginBottom: '12px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                                    {[
                                        { label: 'Fiber', value: `${result.fiber || 0}g`, color: '#10b981' },
                                        { label: 'Sugar', value: `${result.sugar || 0}g`, color: '#f59e0b' },
                                        { label: 'Sodium', value: `${result.sodium || 0}mg`, color: '#94a3b8' },
                                        { label: 'Potassium', value: `${result.potassium || 0}mg`, color: '#a78bfa' },
                                        { label: 'Glycemic Index', value: result.glycemic_index || 'Medium', color: '#60a5fa' },
                                        { label: 'Health Score', value: `${result.health_score || '?'}/10`, color: '#10b981' },
                                    ].map(item => (
                                        <div key={item.label} style={{
                                            background: 'rgba(255,255,255,0.03)', borderRadius: '10px',
                                            padding: '10px 12px', border: '1px solid var(--border)'
                                        }}>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '2px' }}>{item.label}</div>
                                            <div style={{ fontWeight: '700', color: item.color, fontSize: '0.95rem' }}>{item.value}</div>
                                        </div>
                                    ))}
                                </div>

                                {result.vitamins?.length > 0 && (
                                    <div style={{ marginBottom: '10px' }}>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '6px' }}>VITAMINS & MINERALS</div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                            {result.vitamins.map(v => (
                                                <span key={v} style={{ padding: '3px 9px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '20px', fontSize: '0.72rem', color: '#10b981' }}>{v}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {result.description && (
                                    <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', fontSize: '0.82rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>
                                        📖 {result.description}
                                    </div>
                                )}

                                {result.alternatives?.length > 0 && (
                                    <div style={{ marginTop: '10px' }}>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '6px' }}>HEALTHIER ALTERNATIVES</div>
                                        {result.alternatives.map((alt, i) => (
                                            <div key={i} style={{ padding: '7px 12px', background: 'rgba(0,242,234,0.04)', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '5px', border: '1px solid rgba(0,242,234,0.1)' }}>
                                                ✅ {alt}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Confirm Buttons */}
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button className="btn" onClick={reset} style={{ flex: 1, background: 'rgba(255,255,255,0.05)' }}>
                                Discard
                            </button>
                            <button className="btn btn-primary" onClick={confirmLog} style={{ flex: 2 }}>
                                <CheckCircle size={16} /> Log This Meal
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CameraCapture;
