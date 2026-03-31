import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../db.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();
const todayStr = () => new Date().toISOString().slice(0, 10);

// GET /api/meals?date=
router.get('/', verifyToken, (req, res) => {
    const { date } = req.query;
    db.read();
    const d = date || todayStr();
    const meals = db.data.meals.filter(m => m.user_id === req.userId && m.date === d);
    res.json(meals);
});

// POST /api/meals
router.post('/', verifyToken, (req, res) => {
    const { name, calories = 0, protein = 0, carbs = 0, fat = 0,
        fiber = 0, sugar = 0, sodium = 0, health_score = 0, cuisine, emoji } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });

    db.read();
    const meal = {
        id: uuid(), user_id: req.userId, name, calories, protein, carbs, fat,
        fiber, sugar, sodium, health_score, cuisine, emoji,
        date: todayStr(), logged_at: new Date().toISOString(),
    };
    db.data.meals.push(meal);
    db.write();
    res.status(201).json(meal);
});

// DELETE /api/meals/:id
router.delete('/:id', verifyToken, (req, res) => {
    db.read();
    db.data.meals = db.data.meals.filter(m => !(m.id === req.params.id && m.user_id === req.userId));
    db.write();
    res.json({ success: true });
});

export default router;
