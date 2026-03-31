import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import mealsRouter from './routes/meals.js';
import workoutsRouter from './routes/workouts.js';
import waterRouter from './routes/water.js';
import stepsRouter from './routes/steps.js';
import goalsRouter from './routes/goals.js';
import streaksRouter from './routes/streaks.js';
import friendsRouter from './routes/friends.js';

const app = express();
const PORT = 3001;

app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://localhost:5175'] }));
app.use(express.json({ limit: '5mb' }));

const apiRouter = express.Router();

// Root API info
apiRouter.get('/', (req, res) => {
    res.json({ message: 'FitAI API is running', health: '/api/health' });
});

apiRouter.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), message: 'Server is healthy' });
});

// Routes
apiRouter.use('/auth', authRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/meals', mealsRouter);
apiRouter.use('/workouts', workoutsRouter);
apiRouter.use('/water', waterRouter);
apiRouter.use('/steps', stepsRouter);
apiRouter.use('/goals', goalsRouter);
apiRouter.use('/streaks', streaksRouter);
apiRouter.use('/friends', friendsRouter);

app.use('/api', apiRouter);

app.use((req, res) => {
    res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

app.use((err, _req, res, _next) => {
    console.error('❌', err.message);
    res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
    console.log(`\n🚀 FitAI Backend → http://localhost:${PORT}`);
    console.log(`   Health  → http://localhost:${PORT}/api/health\n`);
});
