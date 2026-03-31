import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../db.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

// GET /api/users/me  — get current user by token
router.get('/me', verifyToken, (req, res) => {
    db.read();
    const user = db.data.users.find(u => u.id === req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { password_hash: _, ...safeUser } = user;
    res.json(safeUser);
});

// GET /api/users/:id
router.get('/:id', verifyToken, (req, res) => {
    db.read();
    const user = db.data.users.find(u => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { password_hash: _, ...safeUser } = user;
    res.json(safeUser);
});

// POST /api/users — upsert profile (name lookup)
router.post('/', verifyToken, (req, res) => {
    const { name, age, gender, height, weight, target_weight, goal, activity_level, fitness_level, diet_type, allergies } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    db.read();

    let user = db.data.users.find(u => u.id === req.userId);
    if (user) {
        Object.assign(user, { name, age, gender, height, weight, target_weight, goal, activity_level, fitness_level, diet_type, allergies, updated_at: new Date().toISOString() });
    } else {
        user = {
            id: req.userId, name, age, gender, height, weight, target_weight,
            goal, activity_level, fitness_level: fitness_level || 'beginner',
            diet_type: diet_type || '', allergies: allergies || '',
            created_at: new Date().toISOString(), updated_at: new Date().toISOString()
        };
        db.data.users.push(user);
        if (!db.data.streaks.find(s => s.user_id === req.userId)) {
            db.data.streaks.push({ id: uuid(), user_id: req.userId, current: 0, longest: 0, last_log_date: null });
        }
        if (!db.data.goals.find(g => g.user_id === req.userId)) {
            db.data.goals.push({ id: uuid(), user_id: req.userId, weekly_workouts: 5, daily_calories: 0, daily_water: 8, updated_at: new Date().toISOString() });
        }
    }
    db.write();
    const { password_hash: _, ...safeUser } = user;
    res.status(201).json(safeUser);
});

// PUT /api/users/:id
router.put('/:id', verifyToken, (req, res) => {
    db.read();
    const user = db.data.users.find(u => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.id !== req.userId) return res.status(403).json({ error: 'Forbidden' });
    Object.assign(user, { ...req.body, updated_at: new Date().toISOString() });
    db.write();
    const { password_hash: _, ...safeUser } = user;
    res.json(safeUser);
});

export default router;
