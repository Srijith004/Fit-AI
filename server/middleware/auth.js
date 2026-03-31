// JWT verification middleware — attach to any route to protect it
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'fitai_super_secret_2024_change_in_prod';

export function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.slice(7);
    try {
        const decoded = jwt.verify(token, SECRET);
        req.userId = decoded.userId;
        req.userEmail = decoded.email;
        next();
    } catch (e) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

export { SECRET };
