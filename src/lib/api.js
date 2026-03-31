// Central API client for FitAI backend (http://localhost:3001)
// Automatically attaches JWT token from localStorage to every request.

const BASE = 'http://localhost:3001/api';

function getToken() {
    return localStorage.getItem('fitai_token');
}

async function req(path, options = {}) {
    const token = getToken();
    try {
        const res = await fetch(`${BASE}${path}`, {
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            ...options,
            body: options.body ? JSON.stringify(options.body) : undefined,
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: res.statusText }));
            throw new Error(err.error || `API error ${res.status}`);
        }
        return await res.json();
    } catch (e) {
        if (e.message?.includes('Failed to fetch') || e.message?.includes('NetworkError') || e.message?.includes('fetch')) {
            console.warn('[API] Backend not reachable — offline mode');
            return null;
        }
        throw e;
    }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const apiMe = () => req('/auth/me');

// ─── Users ───────────────────────────────────────────────────────────────────
export const apiGetMyUser = () => req('/users/me');
export const apiSaveUser = (data) => req('/users', { method: 'POST', body: data });
export const apiUpdateUser = (id, data) => req(`/users/${id}`, { method: 'PUT', body: data });

// ─── Meals ───────────────────────────────────────────────────────────────────
export const apiGetMeals = (date) => req(`/meals${date ? `?date=${date}` : ''}`);
export const apiLogMeal = (meal) => req('/meals', { method: 'POST', body: meal });
export const apiDeleteMeal = (id) => req(`/meals/${id}`, { method: 'DELETE' });

// ─── Workouts ────────────────────────────────────────────────────────────────
export const apiGetWorkouts = (date) => req(`/workouts${date ? `?date=${date}` : ''}`);
export const apiLogWorkout = (workout) => req('/workouts', { method: 'POST', body: workout });
export const apiDeleteWorkout = (id) => req(`/workouts/${id}`, { method: 'DELETE' });

// ─── Water ───────────────────────────────────────────────────────────────────
export const apiGetWater = (date) => req(`/water${date ? `?date=${date}` : ''}`);
export const apiIncrementWater = (target) => req('/water/increment', { method: 'POST', body: { target } });
export const apiDecrementWater = () => req('/water/decrement', { method: 'POST', body: {} });
export const apiSetWaterTarget = (target) => req('/water/target', { method: 'PUT', body: { target } });

// ─── Steps ───────────────────────────────────────────────────────────────────
export const apiGetSteps = (date) => req(`/steps${date ? `?date=${date}` : ''}`);
export const apiSaveSteps = (steps) => req('/steps', { method: 'POST', body: { steps } });
export const apiGetStepsHistory = () => req('/steps/history');

// ─── Goals ───────────────────────────────────────────────────────────────────
export const apiGetGoals = () => req('/goals');
export const apiUpdateGoals = (goals) => req('/goals', { method: 'PUT', body: goals });

// ─── Streaks ─────────────────────────────────────────────────────────────────
export const apiGetStreak = () => req('/streaks');

// ─── Friends ─────────────────────────────────────────────────────────────────
export const apiGetFriends = () => req('/friends');
export const apiAddFriend = (code) => req('/friends', { method: 'POST', body: { code } });
export const apiGetFriendActivity = (id) => req(`/friends/${id}/activity`);

// ─── Health ──────────────────────────────────────────────────────────────────
export const apiHealth = () => req('/health');
