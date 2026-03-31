import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../db.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();
const todayStr = () => new Date().toISOString().slice(0, 10);

// GET /api/workouts?date=
router.get('/', verifyToken, (req, res) => {
    const { date } = req.query;
    db.read();
    const d = date || todayStr();
    const workouts = db.data.workouts.filter(w => w.user_id === req.userId && w.date === d);
    res.json(workouts);
});

// POST /api/workouts
router.post('/', verifyToken, (req, res) => {
    const { name, type, duration = 0, calories = 0,
        sets = 0, reps, muscle_group, emoji, is_manual = false } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });

    db.read();
    const workout = {
        id: uuid(), user_id: req.userId, name, type, duration, calories,
        sets, reps, muscle_group, emoji, is_manual,
        date: todayStr(), logged_at: new Date().toISOString(),
    };
    db.data.workouts.push(workout);

    // Update streak
    const streak = db.data.streaks.find(s => s.user_id === req.userId);
    if (streak) {
        const today = todayStr();
        if (streak.last_log_date !== today) {
            const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
            streak.current = streak.last_log_date === yesterday.toISOString().slice(0, 10) ? streak.current + 1 : 1;
            streak.longest = Math.max(streak.longest, streak.current);
            streak.last_log_date = today;
        }
    }
    db.write();
    res.status(201).json(workout);
});

// DELETE /api/workouts/:id
router.delete('/:id', verifyToken, (req, res) => {
    db.read();
    db.data.workouts = db.data.workouts.filter(w => !(w.id === req.params.id && w.user_id === req.userId));
    db.write();
    res.json({ success: true });
});

export default router;
