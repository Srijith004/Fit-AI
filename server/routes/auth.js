import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import db from '../db.js';
import { SECRET } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
    const { name, email, password, age, gender, height, weight, goal, activity_level, fitness_level, diet_type } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: 'Name, email and password are required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    db.read();
    const existing = db.data.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const password_hash = await bcrypt.hash(password, 10);
    const friend_code = `FIT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const user = {
        id: uuid(), name, email: email.toLowerCase(), password_hash,
        friend_code,
        age, gender, height, weight, goal, activity_level,
        fitness_level: fitness_level || 'beginner',
        diet_type: diet_type || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };
    db.data.users.push(user);
    db.data.streaks.push({ id: uuid(), user_id: user.id, current: 0, longest: 0, last_log_date: null });
    db.data.goals.push({ id: uuid(), user_id: user.id, weekly_workouts: 5, daily_calories: 0, daily_water: 8, updated_at: new Date().toISOString() });
    db.write();

    const token = jwt.sign({ userId: user.id, email: user.email }, SECRET, { expiresIn: '30d' });
    const { password_hash: _, ...safeUser } = user;
    res.status(201).json({ token, user: safeUser });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    db.read();
    const user = db.data.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign({ userId: user.id, email: user.email }, SECRET, { expiresIn: '30d' });
    const { password_hash: _, ...safeUser } = user;
    res.json({ token, user: safeUser });
});

// GET /api/auth/me  — validate token, return user
router.get('/me', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
    try {
        const decoded = jwt.verify(authHeader.slice(7), SECRET);
        db.read();
        const user = db.data.users.find(u => u.id === decoded.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });
        const { password_hash: _, ...safeUser } = user;
        res.json(safeUser);
    } catch {
        res.status(401).json({ error: 'Invalid token' });
    }
});

export default router;
