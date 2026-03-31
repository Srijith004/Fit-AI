import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { useData } from '../context/DataContext';
import GlassCard from '../components/GlassCard';
import { Copy, UserPlus, Trophy, Flame, User, Check, Sparkles, ChevronRight, Utensils, Dumbbell, X } from 'lucide-react';
import { apiGetFriends, apiAddFriend, apiGetFriendActivity } from '../lib/api';

const getChallenges = (activity, todayCalories) => [
    {
        name: 'Consistency King',
        desc: 'Maintain your activity streak',
        icon: '🔥',
        reward: '500 XP',
        progress: activity.streak.current,
        max: Math.max(activity.streak.current + 1, 7)
    },
    {
        name: 'Hydration Hero',
        desc: 'Reach your daily water goal',
        icon: '💧',
        reward: '300 XP',
        progress: activity.water,
        max: activity.waterTarget
    },
    {
        name: 'Calorie Commander',
        desc: 'Stay within your calorie target',
        icon: '⚡',
        reward: '400 XP',
        progress: Math.min(todayCalories, activity.goals.dailyCalories || 2000),
        max: activity.goals.dailyCalories || 2000
    },
];

const AvatarCircle = ({ emoji, size = 44, color = 'rgba(0,242,234,0.15)' }) => (
    <div style={{
        width: size, height: size, borderRadius: '50%',
        background: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.5, flexShrink: 0, border: '1px solid rgba(255,255,255,0.1)'
    }}>
        {emoji}
    </div>
);

const Social = () => {
    const { user } = useUser();
    const { activity, todayCalories } = useData();
    const [friendCode, setFriendCode] = useState('');
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(false);
    const [addError, setAddError] = useState('');
    const [copied, setCopied] = useState(false);
    const [tab, setTab] = useState('leaderboard');

    const [selectedFriend, setSelectedFriend] = useState(null);
    const [friendActivity, setFriendActivity] = useState(null);
    const [loadingActivity, setLoadingActivity] = useState(false);

    // Fetch friends on load
    React.useEffect(() => {
        setLoading(true);
        apiGetFriends()
            .then(data => setFriends(data || []))
            .catch(err => console.error('Failed to load friends:', err))
            .finally(() => setLoading(false));
    }, []);

    const fetchFriendActivity = async (friend) => {
        if (friend.isMe) return;
        setSelectedFriend(friend);
        setLoadingActivity(true);
        try {
            const data = await apiGetFriendActivity(friend.id);
            setFriendActivity(data);
        } catch (err) {
            console.error('Failed to fetch activity:', err);
        } finally {
            setLoadingActivity(false);
        }
    };

    const myCode = user?.friend_code || (user ? btoa(user.name + user.id).substring(0, 10).toUpperCase() : 'LOADING...');

    const handleCopy = () => {
        navigator.clipboard.writeText(myCode).catch(() => { });
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const addFriend = async () => {
        if (!friendCode.trim()) return;
        setAddError('');
        try {
            const res = await apiAddFriend(friendCode.trim());
            if (res.success) {
                setFriends(prev => [...prev, res.friend]);
                setFriendCode('');
            }
        } catch (err) {
            setAddError(err.message || 'Failed to add friend');
        }
    };

    // Build leaderboard: user + friends sorted by streak
    const leaderboard = [
        { name: `${user?.name || 'You'} (You)`, streak: activity.streak.current, goal: user?.goal || 'maintain', avatar: '⭐', isMe: true },
        ...friends,
    ].sort((a, b) => (b.streak || 0) - (a.streak || 0));

    return (
        <div style={{ paddingBottom: '10px', animation: 'fadeInUp 0.5s ease' }}>
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '4px' }}>
                    <span className="text-gradient">Social Hub</span>
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Train together, grow together</p>
            </div>

            {/* My Code Card */}
            <GlassCard style={{
                marginBottom: '16px',
                background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(0,242,234,0.05))',
                border: '1px solid rgba(124,58,237,0.2)',
                textAlign: 'center',
                position: 'relative', overflow: 'hidden'
            }}>
                <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', background: 'radial-gradient(circle, rgba(124,58,237,0.2), transparent)', borderRadius: '50%' }} />
                <div style={{ position: 'absolute', bottom: '-20px', left: '-20px', width: '80px', height: '80px', background: 'radial-gradient(circle, rgba(0,242,234,0.15), transparent)', borderRadius: '50%' }} />

                <div style={{ position: 'relative' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Your Unique ID</div>
                    <div style={{
                        background: 'rgba(0,0,0,0.5)', padding: '14px 20px', borderRadius: '14px',
                        fontFamily: 'Monaco, Consolas, monospace', letterSpacing: '0.25em', fontSize: '1.4rem', fontWeight: '800',
                        color: 'var(--primary)', border: '1px solid rgba(0,242,234,0.2)',
                        textShadow: '0 0 20px rgba(0,242,234,0.6)', marginBottom: '16px', display: 'inline-block'
                    }}>
                        {myCode}
                    </div>
                    <div>
                        <button
                            onClick={handleCopy}
                            className="btn"
                            style={{
                                background: copied ? 'rgba(16,185,129,0.2)' : 'rgba(124,58,237,0.2)',
                                color: copied ? '#10b981' : '#a78bfa',
                                border: `1px solid ${copied ? 'rgba(16,185,129,0.4)' : 'rgba(124,58,237,0.4)'}`,
                                transition: 'all 0.3s ease',
                            }}
                        >
                            {copied ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy Code</>}
                        </button>
                    </div>
                </div>
            </GlassCard>

            {/* Add Friend */}
            <GlassCard style={{ marginBottom: '16px', padding: '20px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '12px' }}>
                    <UserPlus size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                    Add a Friend
                </h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                        type="text"
                        placeholder="Paste friend's code here..."
                        value={friendCode}
                        onChange={e => setFriendCode(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addFriend()}
                        style={{
                            flex: 1, padding: '12px 14px', borderRadius: '12px',
                            border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.4)',
                            color: 'white', outline: 'none', fontSize: '0.9rem', fontFamily: 'Inter, sans-serif',
                        }}
                    />
                    <button
                        className="btn btn-primary"
                        onClick={addFriend}
                        disabled={!friendCode.trim()}
                        style={{ padding: '0 18px', borderRadius: '12px' }}
                    >
                        <UserPlus size={18} />
                    </button>
                </div>
                {addError && <div style={{ color: '#ff6b6b', fontSize: '0.75rem', marginTop: '8px' }}>{addError}</div>}
            </GlassCard>

            {/* Tabs */}
            <div style={{
                display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: '14px',
                padding: '4px', marginBottom: '16px', border: '1px solid var(--border)'
            }}>
                {[
                    { key: 'leaderboard', label: '🏆 Leaderboard' },
                    { key: 'challenges', label: '⚡ Challenges' },
                ].map(t => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        style={{
                            flex: 1, padding: '10px', borderRadius: '10px',
                            border: 'none', cursor: 'pointer', fontSize: '0.88rem',
                            fontFamily: 'Inter, sans-serif',
                            background: tab === t.key ? 'rgba(255,255,255,0.08)' : 'transparent',
                            color: tab === t.key ? 'var(--text)' : 'var(--text-muted)',
                            fontWeight: tab === t.key ? '600' : '400',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Friend Detail View */}
            {selectedFriend && (
                <GlassCard style={{
                    marginBottom: '16px',
                    border: '1px solid var(--primary)',
                    animation: 'fadeIn 0.3s ease',
                    position: 'relative'
                }}>
                    <button
                        onClick={() => { setSelectedFriend(null); setFriendActivity(null); }}
                        style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                        <X size={20} />
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <AvatarCircle emoji={selectedFriend.avatar} size={48} />
                        <div>
                            <div style={{ fontWeight: '800', fontSize: '1.2rem' }}>{selectedFriend.name}'s Activity</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedFriend.goal}</div>
                        </div>
                    </div>

                    {loadingActivity ? (
                        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Loading logs...</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <div style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Utensils size={14} /> Recent Meals
                                </div>
                                {friendActivity?.meals?.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        {friendActivity.meals.map((m, i) => (
                                            <div key={i} style={{ fontSize: '0.85rem', background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
                                                <span>{m.name || m.type}</span>
                                                <span style={{ color: 'var(--text-muted)' }}>{m.calories} kcal</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', paddingLeft: '20px' }}>No meals logged recently</div>}
                            </div>

                            <div>
                                <div style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: '#7c3aed', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Dumbbell size={14} /> Recent Workouts
                                </div>
                                {friendActivity?.workouts?.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        {friendActivity.workouts.map((w, i) => (
                                            <div key={i} style={{ fontSize: '0.85rem', background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
                                                <span>{w.name}</span>
                                                <span style={{ color: 'var(--text-muted)' }}>{w.calories} kcal</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', paddingLeft: '20px' }}>No workouts logged recently</div>}
                            </div>
                        </div>
                    )}
                </GlassCard>
            )}

            {/* Leaderboard Tab */}
            {tab === 'leaderboard' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading friends...</div>
                    ) : leaderboard.length === 1 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                            <User size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                            <div>No friends yet</div>
                            <div style={{ fontSize: '0.8rem' }}>Share your code to start a leaderboard!</div>
                        </div>
                    ) : leaderboard.map((friend, i) => (
                        <GlassCard
                            key={i}
                            onClick={() => !friend.isMe && fetchFriendActivity(friend)}
                            style={{
                                padding: '16px 20px',
                                cursor: friend.isMe ? 'default' : 'pointer',
                                background: friend.isMe
                                    ? 'linear-gradient(90deg, rgba(0,242,234,0.07), rgba(0,0,0,0))'
                                    : (selectedFriend?.id === friend.id ? 'rgba(0,242,234,0.05)' : 'rgba(255,255,255,0.03)'),
                                border: friend.isMe ? '1px solid rgba(0,242,234,0.25)' : (selectedFriend?.id === friend.id ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.07)'),
                                transition: 'all 0.3s ease',
                                transform: selectedFriend?.id === friend.id ? 'scale(1.02)' : 'none'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                {/* Rank */}
                                <div style={{ fontWeight: '800', fontSize: '1.1rem', width: '24px', color: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#cd7c2f' : 'var(--text-muted)', flexShrink: 0, textAlign: 'center' }}>
                                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                                </div>

                                <AvatarCircle emoji={friend.avatar || (friend.isMe ? '⭐' : '🧑')} color={friend.isMe ? 'rgba(0,242,234,0.15)' : 'rgba(255,255,255,0.06)'} />

                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '700', fontSize: '0.95rem', marginBottom: '2px' }}>{friend.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        {friend.goal?.replace('_', ' ')}
                                        {!friend.isMe && <ChevronRight size={12} />}
                                    </div>
                                </div>

                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                    <div style={{ fontWeight: '700', color: (friend.streak || 0) > 0 ? '#f59e0b' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                                        <Flame size={14} />
                                        {friend.streak || 0}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>day streak</div>
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            )}

            {/* Challenges Tab */}
            {tab === 'challenges' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {getChallenges(activity, todayCalories).map((c, i) => (
                        <GlassCard key={i} style={{ padding: '18px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                                <div style={{
                                    width: '48px', height: '48px', flexShrink: 0,
                                    background: 'rgba(255,255,255,0.06)', borderRadius: '14px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '1.5rem',
                                }}>{c.icon}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '700', marginBottom: '2px' }}>{c.name}</div>
                                    <div style={{ fontSize: '0.80rem', color: 'var(--text-muted)', marginBottom: '10px' }}>{c.desc}</div>
                                    <div style={{ height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', marginBottom: '6px', overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%', borderRadius: '3px',
                                            width: `${Math.min(100, (c.progress / c.max) * 100)}%`,
                                            background: 'linear-gradient(90deg, var(--primary), #7c3aed)',
                                            boxShadow: '0 0 8px rgba(0,242,234,0.4)',
                                            transition: 'width 1s ease'
                                        }} />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>{c.progress}/{c.max} {c.max === 1 ? 'unit' : 'units'}</span>
                                        <span style={{ color: '#f59e0b', fontWeight: '600' }}>
                                            <Trophy size={12} style={{ display: 'inline', marginRight: '3px', verticalAlign: 'middle' }} />
                                            {c.reward}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    ))}

                    <GlassCard style={{ padding: '24px', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)', background: 'transparent' }}>
                        <Sparkles size={28} color="var(--primary)" style={{ marginBottom: '8px' }} />
                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>More challenges coming!</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Complete existing ones to unlock new challenges</div>
                    </GlassCard>
                </div>
            )}
        </div>
    );
};

export default Social;
