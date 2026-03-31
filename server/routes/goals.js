import { Router } from 'express';
import db from '../db.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

router.get('/', verifyToken, (req, res) => {
    db.read();
    const goals = db.data.goals.find(g => g.user_id === req.userId);
    res.json(goals || { user_id: req.userId, weekly_workouts: 5, daily_calories: 0, daily_water: 8 });
});

router.put('/', verifyToken, (req, res) => {
    db.read();
    const { weekly_workouts, daily_calories, daily_water } = req.body;
    let goals = db.data.goals.find(g => g.user_id === req.userId);
    if (goals) { Object.assign(goals, { weekly_workouts, daily_calories, daily_water, updated_at: new Date().toISOString() }); }
    else { goals = { user_id: req.userId, weekly_workouts, daily_calories, daily_water, updated_at: new Date().toISOString() }; db.data.goals.push(goals); }
    db.write();
    res.json(goals);
});

export default router;
