/* eslint-disable react/prop-types */
import React, { createContext, useState, useEffect, useContext } from 'react';
import {
    apiLogMeal, apiDeleteMeal, apiGetMeals,
    apiLogWorkout, apiDeleteWorkout, apiGetWorkouts,
    apiIncrementWater, apiDecrementWater, apiSetWaterTarget, apiGetWater,
    apiSaveSteps, apiGetSteps,
    apiUpdateGoals, apiGetGoals,
    apiGetStreak,
} from '../lib/api';
import { useUser } from './UserContext';

const DataContext = createContext();
export const useData = () => useContext(DataContext);

const initialData = {
    workouts: [],
    manualExercises: [],
    meals: [],
    water: 0,
    waterTarget: 8,
    steps: 0,
    streak: { current: 0, lastLogDate: null },
    friends: [],
    goals: { weeklyWorkouts: 5, dailyCalories: 0, dailyWater: 8, weeklyWorkoutsDone: 0 },
};

const todayStr = () => new Date().toISOString().slice(0, 10);

export const DataProvider = ({ children }) => {
    const { user } = useUser();
    const userId = user?.id || null;

    const [activity, setActivity] = useState(() => {
        const saved = localStorage.getItem('activity_log_v3');
        if (saved) {
            const parsed = JSON.parse(saved);
            const savedDate = new Date(parsed.lastAccessDate || 0).toDateString();
            const today = new Date().toDateString();
            if (savedDate !== today) {
                return { ...parsed, water: 0, workouts: [], manualExercises: [], meals: [], lastAccessDate: Date.now() };
            }
            return parsed;
        }
        return { ...initialData, lastAccessDate: Date.now() };
    });

    // Persist to localStorage
    useEffect(() => {
        localStorage.setItem('activity_log_v3', JSON.stringify({ ...activity, lastAccessDate: Date.now() }));
    }, [activity]);

    // ── On userId available: load today's data from backend ──────────────────
    useEffect(() => {
        if (!userId) return;
        const date = todayStr();

        Promise.all([
            apiGetMeals(userId, date),
            apiGetWorkouts(userId, date),
            apiGetWater(userId, date),
            apiGetSteps(userId, date),
            apiGetGoals(userId),
            apiGetStreak(userId),
        ]).then(([meals, workouts, water, steps, goals, streak]) => {
            if (!meals && !workouts && !water) return; // offline
            setActivity(prev => ({
                ...prev,
                meals: meals || prev.meals,
                workouts: workouts?.filter(w => !w.is_manual) || prev.workouts,
                manualExercises: workouts?.filter(w => w.is_manual) || prev.manualExercises,
                water: water?.glasses ?? prev.water,
                waterTarget: water?.target ?? prev.waterTarget,
                steps: steps?.steps ?? prev.steps,
                goals: goals ? {
                    weeklyWorkouts: goals.weekly_workouts,
                    dailyCalories: goals.daily_calories,
                    dailyWater: goals.daily_water,
                    weeklyWorkoutsDone: prev.goals.weeklyWorkoutsDone,
                } : prev.goals,
                streak: streak ? { current: streak.current, lastLogDate: streak.last_log_date } : prev.streak,
            }));
        }).catch(() => { /* offline — keep localStorage data */ });
    }, [userId]);

    // ── Water ──────────────────────────────────────────────────────────────────
    const logWater = () => {
        setActivity(prev => ({ ...prev, water: Math.min(prev.water + 1, prev.waterTarget + 4) }));
        if (userId) apiIncrementWater(userId, activity.waterTarget).catch(() => { });
    };

    const removeWater = () => {
        setActivity(prev => ({ ...prev, water: Math.max(0, prev.water - 1) }));
        if (userId) apiDecrementWater(userId).catch(() => { });
    };

    const setWaterTarget = (target) => {
        setActivity(prev => ({ ...prev, waterTarget: target }));
        if (userId) apiSetWaterTarget(userId, target).catch(() => { });
    };

    // ── Meals ──────────────────────────────────────────────────────────────────
    const logMeal = (meal) => {
        const newMeal = { ...meal, date: new Date().toISOString() };
        setActivity(prev => ({ ...prev, meals: [...prev.meals, newMeal] }));
        if (userId) {
            apiLogMeal({ user_id: userId, ...meal }).then(saved => {
                if (saved?.id) {
                    // Attach backend ID so we can delete later
                    setActivity(prev => ({
                        ...prev,
                        meals: prev.meals.map(m => (m === newMeal ? { ...m, backendId: saved.id } : m)),
                    }));
                }
            }).catch(() => { });
        }
    };

    const removeMeal = (index) => {
        const meal = activity.meals[index];
        if (userId && meal?.backendId) apiDeleteMeal(meal.backendId).catch(() => { });
        setActivity(prev => ({ ...prev, meals: prev.meals.filter((_, i) => i !== index) }));
    };

    // ── Workouts ───────────────────────────────────────────────────────────────
    const logWorkout = (workout) => {
        const newWorkout = { ...workout, date: new Date().toISOString() };
        setActivity(prev => {
            const updated = { ...prev, workouts: [...prev.workouts, newWorkout] };
            return updated;
        });
        checkStreak();
        if (userId) {
            apiLogWorkout({ user_id: userId, ...workout, is_manual: false }).then(saved => {
                if (saved?.id) {
                    setActivity(prev => ({
                        ...prev,
                        workouts: prev.workouts.map(w => (w === newWorkout ? { ...w, backendId: saved.id } : w)),
                    }));
                }
            }).catch(() => { });
        }
    };

    const logManualExercise = (exercise) => {
        const newEx = {
            ...exercise,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            date: new Date().toISOString(),
        };
        setActivity(prev => ({ ...prev, manualExercises: [...prev.manualExercises, newEx] }));
        checkStreak();
        if (userId) {
            apiLogWorkout({ user_id: userId, ...exercise, is_manual: true }).then(saved => {
                if (saved?.id) {
                    setActivity(prev => ({
                        ...prev,
                        manualExercises: prev.manualExercises.map(e => (e === newEx ? { ...e, backendId: saved.id } : e)),
                    }));
                }
            }).catch(() => { });
        }
    };

    const removeManualExercise = (index) => {
        const ex = activity.manualExercises[index];
        if (userId && ex?.backendId) apiDeleteWorkout(ex.backendId).catch(() => { });
        setActivity(prev => ({ ...prev, manualExercises: prev.manualExercises.filter((_, i) => i !== index) }));
    };

    // ── Steps ──────────────────────────────────────────────────────────────────
    const saveSteps = (steps) => {
        setActivity(prev => ({ ...prev, steps }));
        if (userId) apiSaveSteps(userId, steps).catch(() => { });
    };

    // ── Goals ──────────────────────────────────────────────────────────────────
    const updateGoals = (newGoals) => {
        setActivity(prev => ({ ...prev, goals: { ...prev.goals, ...newGoals } }));
        if (userId) {
            apiUpdateGoals(userId, {
                weekly_workouts: newGoals.weeklyWorkouts ?? activity.goals.weeklyWorkouts,
                daily_calories: newGoals.dailyCalories ?? activity.goals.dailyCalories,
                daily_water: newGoals.dailyWater ?? activity.goals.dailyWater,
            }).catch(() => { });
        }
    };

    // ── Streak ─────────────────────────────────────────────────────────────────
    const checkStreak = () => {
        const today = new Date().toDateString();
        setActivity(prev => {
            if (prev.streak.lastLogDate === today) return prev;
            return { ...prev, streak: { current: prev.streak.current + 1, lastLogDate: today } };
        });
    };

    // ── Computed ───────────────────────────────────────────────────────────────
    const todayCalories = activity.meals.reduce((a, m) => a + (m.calories || 0), 0);
    const todayCaloriesBurned = [
        ...activity.workouts.map(w => w.calories || 0),
        ...activity.manualExercises.map(e => e.calories || 0),
    ].reduce((a, b) => a + b, 0);
    const totalExerciseMinutes = activity.manualExercises.reduce((a, e) => a + (e.duration || 0), 0);
    const wellnessScore = Math.min(100, Math.round(
        (activity.water / activity.waterTarget) * 35 +
        (Math.min(activity.meals.length, 4) / 4) * 30 +
        (Math.min(totalExerciseMinutes + (activity.workouts.length > 0 ? 30 : 0), 60) / 60) * 35
    ));

    return (
        <DataContext.Provider value={{
            activity,
            logWater, removeWater, setWaterTarget,
            logMeal, removeMeal,
            logWorkout,
            logManualExercise, removeManualExercise,
            saveSteps,
            updateGoals,
            todayCalories,
            todayCaloriesBurned,
            totalExerciseMinutes,
            wellnessScore,
        }}>
            {children}
        </DataContext.Provider>
    );
};
