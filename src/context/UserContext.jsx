/* eslint-disable react/prop-types */
import React, { createContext, useState, useEffect, useContext } from 'react';
import { apiSaveUser, apiUpdateUser } from '../lib/api';

const UserContext = createContext();
export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('user_profile');
        return saved ? JSON.parse(saved) : null;
    });

    const [onboardingComplete, setOnboardingComplete] = useState(() => {
        const saved = localStorage.getItem('user_profile');
        if (!saved) return false;
        const u = JSON.parse(saved);
        return !!(u.age && u.weight && u.height);
    });

    // Persist to localStorage + sync to backend whenever user changes
    useEffect(() => {
        if (user) {
            localStorage.setItem('user_profile', JSON.stringify(user));
            setOnboardingComplete(!!(user.age && user.weight && user.height));

            // Sync to backend (fire-and-forget — don't block UI)
            const profileData = {
                name: user.name,
                age: user.age,
                gender: user.gender,
                height: user.height,
                weight: user.weight,
                target_weight: user.targetWeight,
                goal: user.goal,
                activity_level: user.activityLevel,
                fitness_level: user.fitnessLevel || 'beginner',
                diet_type: user.dietType || '',
                allergies: user.allergies || '',
            };
            apiSaveUser(profileData).then(saved => {
                if (saved?.id && user.id !== saved.id) {
                    // Store the backend-assigned ID alongside profile
                    setUser(prev => prev ? { ...prev, id: saved.id } : prev);
                    localStorage.setItem('user_profile', JSON.stringify({ ...user, id: saved.id }));
                }
            }).catch(() => { /* offline — ignore */ });
        }
    }, [user?.name, user?.age, user?.weight, user?.height, user?.targetWeight, user?.goal, user?.activityLevel, user?.fitnessLevel, user?.dietType]);

    const updateUser = (data) => {
        setUser(prev => {
            const next = { ...prev, ...data };
            // Also sync update to backend if we have a backend ID
            if (next.id) {
                apiUpdateUser(next.id, {
                    age: next.age, gender: next.gender,
                    height: next.height, weight: next.weight,
                    target_weight: next.targetWeight,
                    goal: next.goal, activity_level: next.activityLevel,
                    fitness_level: next.fitnessLevel, diet_type: next.dietType,
                    allergies: next.allergies,
                }).catch(() => { });
            }
            return next;
        });
    };

    const calculateBMI = () => {
        if (!user || user.weight <= 0 || user.height <= 0) return null;
        const heightM = user.height / 100;
        const bmi = parseFloat((user.weight / (heightM * heightM)).toFixed(1));
        const category = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese';
        return { bmi, category };
    };

    const calculateTDEE = () => {
        if (!user) return 2000;
        let bmr = 10 * user.weight + 6.25 * user.height - 5 * user.age;
        bmr += user.gender === 'male' ? 5 : -161;
        const multipliers = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 };
        return Math.round(bmr * (multipliers[user.activityLevel] || 1.2));
    };

    return (
        <UserContext.Provider value={{ user, updateUser, onboardingComplete, calculateBMI, calculateTDEE }}>
            {children}
        </UserContext.Provider>
    );
};
