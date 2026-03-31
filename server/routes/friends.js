import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../db.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

// GET /api/friends — list all friends with their current stats
router.get('/', verifyToken, (req, res) => {
    db.read();
    const friendLinks = db.data.friends.filter(f => f.user_id === req.userId);
    const friendData = friendLinks.map(link => {
        const friend = db.data.users.find(u => u.id === link.friend_id);
        if (!friend) return null;

        const streak = db.data.streaks.find(s => s.user_id === friend.id);
        return {
            id: friend.id,
            name: friend.name,
            goal: friend.goal,
            streak: streak ? streak.isMe ? streak.current : (streak.current || 0) : 0,
            friend_code: friend.friend_code,
            avatar: friend.gender === 'female' ? '👩' : '👨',
        };
    }).filter(Boolean);

    res.json(friendData);
});

// POST /api/friends — add a friend by code
router.post('/', verifyToken, (req, res) => {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Code required' });

    db.read();
    const friend = db.data.users.find(u => u.friend_code === code.trim().toUpperCase());
    if (!friend) return res.status(404).json({ error: 'Friend code not found' });
    if (friend.id === req.userId) return res.status(400).json({ error: 'Cannot add yourself' });

    const existing = db.data.friends.find(f => f.user_id === req.userId && f.friend_id === friend.id);
    if (existing) return res.status(409).json({ error: 'Already friends' });

    db.data.friends.push({
        id: uuid(),
        user_id: req.userId,
        friend_id: friend.id,
        created_at: new Date().toISOString()
    });
    db.write();

    const streak = db.data.streaks.find(s => s.user_id === friend.id);
    res.status(201).json({
        success: true,
        friend: {
            id: friend.id,
            name: friend.name,
            goal: friend.goal,
            streak: streak ? streak.current : 0,
            friend_code: friend.friend_code,
            avatar: friend.gender === 'female' ? '👩' : '👨',
        }
    });
});

// GET /api/friends/:id/activity — see a friend's recent activity
router.get('/:id/activity', verifyToken, (req, res) => {
    const friendId = req.params.id;

    db.read();
    // Verify friendship exists (the requester is a friend of the target)
    const isFriend = db.data.friends.find(f => f.user_id === req.userId && f.friend_id === friendId);
    if (!isFriend) return res.status(403).json({ error: "Not authorized to view this user's activity" });

    const friendMeals = db.data.meals.filter(m => m.user_id === friendId).slice(-5);
    const friendWorkouts = db.data.workouts.filter(w => w.user_id === friendId).slice(-3);

    res.json({
        meals: friendMeals.map(m => ({ type: m.type, calories: m.calories, name: m.name, date: m.date })),
        workouts: friendWorkouts.map(w => ({ name: w.name, calories: w.calories, date: w.date }))
    });
});

export default router;
