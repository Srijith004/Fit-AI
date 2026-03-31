import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../db.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();
const todayStr = () => new Date().toISOString().slice(0, 10);

router.get('/', verifyToken, (req, res) => {
    const { date } = req.query;
    db.read();
    const d = date || todayStr();
    const row = db.data.steps_log.find(s => s.user_id === req.userId && s.date === d);
    res.json(row || { user_id: req.userId, date: d, steps: 0, calories: 0, distance_km: 0 });
});

router.post('/', verifyToken, (req, res) => {
    const { steps } = req.body;
    db.read();
    const date = todayStr();
    const calories = Math.round(steps * 0.04);
    const distance_km = parseFloat((steps * 0.00078).toFixed(2));
    let row = db.data.steps_log.find(s => s.user_id === req.userId && s.date === date);
    if (row) { Object.assign(row, { steps, calories, distance_km, updated_at: new Date().toISOString() }); }
    else { row = { id: uuid(), user_id: req.userId, date, steps, calories, distance_km, updated_at: new Date().toISOString() }; db.data.steps_log.push(row); }
    db.write();
    res.json(row);
});

router.get('/history', verifyToken, (req, res) => {
    db.read();
    const rows = db.data.steps_log.filter(s => s.user_id === req.userId).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7);
    res.json(rows);
});

export default router;
