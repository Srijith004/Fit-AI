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
    const row = db.data.water_log.find(w => w.user_id === req.userId && w.date === d);
    res.json(row || { user_id: req.userId, date: d, glasses: 0, target: 8 });
});

router.post('/increment', verifyToken, (req, res) => {
    const { target = 8 } = req.body;
    db.read();
    const date = todayStr();
    let row = db.data.water_log.find(w => w.user_id === req.userId && w.date === date);
    if (row) {
        row.glasses = Math.min(row.glasses + 1, (row.target || target) + 4);
        row.updated_at = new Date().toISOString();
    } else {
        row = { id: uuid(), user_id: req.userId, date, glasses: 1, target, updated_at: new Date().toISOString() };
        db.data.water_log.push(row);
    }
    db.write();
    res.json(row);
});

router.post('/decrement', verifyToken, (req, res) => {
    db.read();
    const date = todayStr();
    const row = db.data.water_log.find(w => w.user_id === req.userId && w.date === date);
    if (row) { row.glasses = Math.max(0, row.glasses - 1); row.updated_at = new Date().toISOString(); db.write(); return res.json(row); }
    res.json({ user_id: req.userId, date, glasses: 0, target: 8 });
});

router.put('/target', verifyToken, (req, res) => {
    const { target } = req.body;
    db.read();
    const date = todayStr();
    let row = db.data.water_log.find(w => w.user_id === req.userId && w.date === date);
    if (row) { row.target = target; row.updated_at = new Date().toISOString(); }
    else { row = { id: uuid(), user_id: req.userId, date, glasses: 0, target }; db.data.water_log.push(row); }
    db.write();
    res.json(row);
});

export default router;
