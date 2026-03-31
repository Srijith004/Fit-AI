import { Router } from 'express';
import db from '../db.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

router.get('/', verifyToken, (req, res) => {
    db.read();
    const streak = db.data.streaks.find(s => s.user_id === req.userId);
    res.json(streak || { user_id: req.userId, current: 0, longest: 0, last_log_date: null });
});

export default router;
