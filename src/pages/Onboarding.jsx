import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';

const GOALS = [
    { value: 'lose_weight', label: 'Fat Loss', desc: 'Burn fat, reveal lean muscle', emoji: '🔥', color: '#ff2d78' },
    { value: 'build_muscle', label: 'Build Muscle', desc: 'Get stronger and bigger', emoji: '💪', color: '#7c3aed' },
    { value: 'maintain', label: 'Stay Fit', desc: 'Maintain current fitness', emoji: '⚡', color: '#00f2ea' },
];

const ACTIVITY_LEVELS = [
    { value: 'sedentary', label: 'Sedentary', desc: 'Little to no exercise', emoji: '🪑' },
    { value: 'light', label: 'Lightly Active', desc: '1–3 workouts per week', emoji: '🚶' },
    { value: 'moderate', label: 'Moderate', desc: '3–5 workouts per week', emoji: '🏃' },
    { value: 'active', label: 'Very Active', desc: '6+ workouts per week', emoji: '⚡' },
];

const FITNESS_LEVELS = [
    { value: 'beginner', label: 'Beginner', desc: 'New to fitness', emoji: '🌱' },
    { value: 'intermediate', label: 'Intermediate', desc: 'Consistent for 6+ months', emoji: '🏆' },
    { value: 'advanced', label: 'Advanced', desc: 'Training for years', emoji: '💎' },
];

const DIET_TYPES = [
    { value: 'standard', label: 'Standard', emoji: '🍱' },
    { value: 'vegetarian', label: 'Vegetarian', emoji: '🥦' },
    { value: 'vegan', label: 'Vegan', emoji: '🌱' },
    { value: 'keto', label: 'Keto', emoji: '🥑' },
    { value: 'paleo', label: 'Paleo', emoji: '🍖' },
];

const inputStyle = {
    padding: '14px 18px',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.05)',
    color: '#fff',
    width: '100%',
    fontSize: '1rem',
    outline: 'none',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
};

const Onboarding = () => {
    const { updateUser } = useUser();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '', age: '', gender: 'male', height: '', weight: '', targetWeight: '',
        goal: 'maintain', activityLevel: 'moderate', fitnessLevel: 'beginner',
        dietType: 'standard', allergies: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const nextStep = () => {
        if (step === 1 && (!formData.name || !formData.age)) return;
        if (step === 2 && (!formData.height || !formData.weight || !formData.targetWeight)) return;
        setStep(s => s + 1);
    };

    const finish = () => {
        updateUser(formData);
        navigate('/');
    };

    const progress = (step / 5) * 100;

    return (
        <div style={{ minHeight: '100vh', background: '#050510', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ position: 'fixed', top: '10%', right: '-5%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'fixed', bottom: '10%', left: '-5%', width: '350px', height: '350px', background: 'radial-gradient(circle, rgba(0,242,234,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

            <div style={{ width: '100%', maxWidth: '440px', position: 'relative', zIndex: 1 }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--primary)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Step {step} of 5</div>
                    <h1 style={{ fontSize: '2.2rem', fontWeight: '800', margin: 0, textShadow: '0 10px 20px rgba(0,0,0,0.5)' }}>
                        {step === 1 && "Start Your Journey"}
                        {step === 2 && "Body Statistics"}
                        {step === 3 && "Your Lifestyle"}
                        {step === 4 && "Nutrition Details"}
                        {step === 5 && "The Big Goal"}
                    </h1>
                </div>

                {/* Progress Bar */}
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', marginBottom: '32px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, var(--primary), #7c3aed)', transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 0 15px var(--primary)' }} />
                </div>

                <div className="glass-panel" style={{ padding: '32px', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {/* Step 1: Basics */}
                    {step === 1 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.9rem', color: 'var(--text-dim)' }}>What should we call you?</label>
                                <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} style={inputStyle} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.9rem', color: 'var(--text-dim)' }}>Gender</label>
                                    <select name="gender" value={formData.gender} onChange={handleChange} style={inputStyle}>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.9rem', color: 'var(--text-dim)' }}>Age</label>
                                    <input type="number" name="age" placeholder="Years" value={formData.age} onChange={handleChange} style={inputStyle} />
                                </div>
                            </div>
                            <button className="btn btn-primary btn-lg w-full" onClick={nextStep} disabled={!formData.name || !formData.age}>Continue →</button>
                        </div>
                    )}

                    {/* Step 2: Physique */}
                    {step === 2 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.9rem', color: 'var(--text-dim)' }}>Height (cm)</label>
                                <input type="number" name="height" placeholder="175" value={formData.height} onChange={handleChange} style={inputStyle} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.9rem', color: 'var(--text-dim)' }}>Weight (kg)</label>
                                    <input type="number" name="weight" placeholder="Current" value={formData.weight} onChange={handleChange} style={inputStyle} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.9rem', color: 'var(--text-dim)' }}>Target (kg)</label>
                                    <input type="number" name="targetWeight" placeholder="Goal" value={formData.targetWeight} onChange={handleChange} style={inputStyle} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button className="btn" onClick={() => setStep(1)} style={{ flex: 1 }}>Back</button>
                                <button className="btn btn-primary" onClick={nextStep} disabled={!formData.height || !formData.weight} style={{ flex: 2 }}>Next Step</button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Lifestyle */}
                    {step === 3 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '12px', fontSize: '0.9rem', color: 'var(--text-dim)' }}>Activity Level</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    {ACTIVITY_LEVELS.map(a => (
                                        <div key={a.value} onClick={() => setFormData({ ...formData, activityLevel: a.value })} style={{ padding: '15px', borderRadius: '16px', background: formData.activityLevel === a.value ? 'rgba(0,242,234,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${formData.activityLevel === a.value ? 'var(--primary)' : 'transparent'}`, cursor: 'pointer', textAlign: 'center', transition: '0.2s' }}>
                                            <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{a.emoji}</div>
                                            <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>{a.label}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '12px', fontSize: '0.9rem', color: 'var(--text-dim)' }}>Fitness Experience</label>
                                {FITNESS_LEVELS.map(f => (
                                    <div key={f.value} onClick={() => setFormData({ ...formData, fitnessLevel: f.value })} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', borderRadius: '16px', background: formData.fitnessLevel === f.value ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${formData.fitnessLevel === f.value ? '#7c3aed' : 'transparent'}`, cursor: 'pointer', marginBottom: '8px', transition: '0.2s' }}>
                                        <div style={{ fontSize: '1.5rem' }}>{f.emoji}</div>
                                        <div>
                                            <div style={{ fontWeight: '600' }}>{f.label}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{f.desc}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button className="btn" onClick={() => setStep(2)} style={{ flex: 1 }}>Back</button>
                                <button className="btn btn-primary" onClick={nextStep} style={{ flex: 2 }}>Next Step</button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Nutrition */}
                    {step === 4 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '12px', fontSize: '0.9rem', color: 'var(--text-dim)' }}>Dietary Preference</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    {DIET_TYPES.map(d => (
                                        <div key={d.value} onClick={() => setFormData({ ...formData, dietType: d.value })} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 15px', borderRadius: '14px', background: formData.dietType === d.value ? 'rgba(0,242,234,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${formData.dietType === d.value ? 'var(--primary)' : 'transparent'}`, cursor: 'pointer', transition: '0.2s' }}>
                                            <span>{d.emoji}</span>
                                            <span style={{ fontWeight: '500', fontSize: '0.9rem' }}>{d.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.9rem', color: 'var(--text-dim)' }}>Any Allergies? (Optional)</label>
                                <input type="text" name="allergies" placeholder="e.g. Peanuts, Shellfish" value={formData.allergies} onChange={handleChange} style={inputStyle} />
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button className="btn" onClick={() => setStep(3)} style={{ flex: 1 }}>Back</button>
                                <button className="btn btn-primary" onClick={nextStep} style={{ flex: 2 }}>Next Step</button>
                            </div>
                        </div>
                    )}

                    {/* Step 5: Final Goal */}
                    {step === 5 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {GOALS.map(g => (
                                <div key={g.value} onClick={() => setFormData({ ...formData, goal: g.value })} style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '20px', borderRadius: '20px', border: `1px solid ${formData.goal === g.value ? g.color + '80' : 'rgba(255,255,255,0.05)'}`, background: formData.goal === g.value ? `${g.color}15` : 'rgba(255,255,255,0.02)', cursor: 'pointer', transition: 'all 0.3s ease' }}>
                                    <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: g.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>{g.emoji}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '700', fontSize: '1.1rem', color: formData.goal === g.value ? g.color : '#fff' }}>{g.label}</div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{g.desc}</div>
                                    </div>
                                    {formData.goal === g.value && <div style={{ color: g.color, fontSize: '1.2rem' }}>●</div>}
                                </div>
                            ))}
                            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                                <button className="btn" onClick={() => setStep(4)} style={{ flex: 1 }}>Back</button>
                                <button className="btn btn-primary btn-lg" onClick={finish} style={{ flex: 2 }}>Build My Profile 🚀</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
