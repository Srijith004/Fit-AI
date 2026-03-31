const API_KEY = 'AIzaSyDWZu7s5uogJL_SjgIDizfoE7GieLA-6GE';
// gemini-2.5-flash: confirmed working with this API key
const MODEL = 'gemini-2.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

// Retry with exponential backoff on 429 (rate limit) errors
async function callGemini(parts, retries = 3, delayMs = 5000) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts }] }),
    });

    if (res.ok) {
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    }

    const errBody = await res.text();

    if (res.status === 429 && attempt < retries) {
      let waitMs = delayMs * Math.pow(2, attempt);
      try {
        const errJson = JSON.parse(errBody);
        const retryInfo = errJson?.error?.details?.find(d => d['@type']?.includes('RetryInfo'));
        if (retryInfo?.retryDelay) {
          const secs = parseInt(retryInfo.retryDelay.replace('s', ''), 10);
          if (!isNaN(secs)) waitMs = (secs + 2) * 1000;
        }
      } catch { /* ignore */ }

      console.warn(`[Gemini] Rate limited. Retrying in ${Math.round(waitMs / 1000)}s (attempt ${attempt + 1}/${retries})`);
      await new Promise(r => setTimeout(r, waitMs));
      continue;
    }

    let message = `Gemini error (${res.status})`;
    try {
      const errJson = JSON.parse(errBody);
      message = errJson?.error?.message?.split('\n')[0] || message;
    } catch { /* ignore */ }

    throw new Error(message);
  }
  throw new Error('Rate limit reached. Please wait a moment and try again.');
}

function parseJSON(raw) {
  try {
    const match = raw.match(/```json\s*([\s\S]*?)```/) || raw.match(/\{[\s\S]*\}/);
    const jsonStr = match ? (match[1] || match[0]) : raw;
    return JSON.parse(jsonStr.trim());
  } catch {
    return null;
  }
}

// ─── Food Analysis via Vision ─────────────────────────────────────────────────
export async function analyzeFood(imageBase64, mimeType = 'image/jpeg', userGoals = {}) {
  const { tdee = 2000, protein = 150, carbs = 250, fat = 70 } = userGoals;

  const prompt = `You are a world-class nutritionist and dietitian AI. Analyze this food image and respond ONLY with a JSON object (no markdown, no explanation) matching this exact structure:

{
  "name": "Dish name",
  "description": "Brief description of the dish and its origin",
  "cuisine": "Indian/Italian/Chinese/etc",
  "calories": 450,
  "protein": 28,
  "carbs": 52,
  "fat": 14,
  "fiber": 6,
  "sugar": 8,
  "sodium": 320,
  "potassium": 480,
  "vitamins": ["Vitamin C", "Vitamin B12", "Iron"],
  "glycemic_index": "Medium",
  "serving_size": "1 plate (~300g)",
  "health_score": 7,
  "health_label": "Balanced Meal",
  "meal_impact": {
    "calorie_percent_of_daily": 22,
    "protein_percent_of_daily": 19,
    "carb_percent_of_daily": 21,
    "fat_percent_of_daily": 20,
    "assessment": "Short 2-sentence assessment of how this meal fits into a balanced day (based on ${tdee} kcal daily target, ${protein}g protein, ${carbs}g carbs, ${fat}g fat targets)",
    "tip": "One actionable eating tip for this specific food"
  },
  "alternatives": ["Healthier alternative 1", "Healthier alternative 2"]
}`;

  const text = await callGemini([
    { text: prompt },
    { inline_data: { mime_type: mimeType, data: imageBase64 } },
  ]);

  const parsed = parseJSON(text);
  if (!parsed) throw new Error('Could not parse food analysis response');
  return parsed;
}

// ─── Indian Regional Food Suggestions ─────────────────────────────────────────
export async function getIndianFoodSuggestions(region, goal, tdee = 2000, dietType = 'standard', allergies = '') {
  const prompt = `You are an expert Indian nutritionist. Create a full-day Indian meal plan for someone from ${region} India.
- Goal: "${goal}"
- Diet Preference: "${dietType}"
- Allergies/Avoid: "${allergies || 'None'}"
- Daily Calorie Target: ${tdee} kcal

Respond ONLY with a JSON object (no markdown, no text outside JSON):
{
  "region": "${region}",
  "region_description": "1 sentence about this region's food culture",
  "total_calories": 1900,
  "meals": {
    "breakfast": {
      "name": "Dish name",
      "description": "Short description",
      "calories": 400,
      "protein": 12,
      "carbs": 55,
      "fat": 14,
      "emoji": "🥣",
      "recipe_hint": "Key ingredients or quick prep note"
    },
    "mid_morning": {
      "name": "Banana", "description": "Fresh fruit", "calories": 150, "protein": 5, "carbs": 20, "fat": 5, "emoji": "🍌", "recipe_hint": "Eat fresh"
    },
    "lunch": {
      "name": "Dish name", "description": "Short description", "calories": 650, "protein": 30, "carbs": 80, "fat": 20, "emoji": "🍛", "recipe_hint": "Key ingredients"
    },
    "evening_snack": {
      "name": "Dish name", "description": "Short description", "calories": 200, "protein": 6, "carbs": 28, "fat": 7, "emoji": "☕", "recipe_hint": "Quick prep"
    },
    "dinner": {
      "name": "Dish name", "description": "Short description", "calories": 500, "protein": 25, "carbs": 60, "fat": 15, "emoji": "🍽️", "recipe_hint": "Key ingredients"
    }
  },
  "nutrition_tips": ["Tip 1 specific to ${region} cuisine", "Tip 2"]
}`;

  const text = await callGemini([{ text: prompt }]);
  const parsed = parseJSON(text);
  if (!parsed) throw new Error('Could not parse meal suggestion response');
  return parsed;
}

// ─── AI Workout Plan ────────────────────────────────────────────────────────
export async function getAIWorkoutPlan(goal, activityLevel, fitnessLevel = 'beginner', weight = 70) {
  const prompt = `You are an elite personal trainer AI. Create a complete daily workout plan for someone with goal: "${goal}", activity level: "${activityLevel}", fitness level: "${fitnessLevel}", weighing ${weight}kg.

Respond ONLY with a JSON object (no markdown, no extra text):
{
  "plan_name": "Workout Plan Name",
  "duration": "45 min",
  "intensity": "Moderate-High",
  "warmup": [
    { "name": "Jumping Jacks", "duration": "2 min", "emoji": "⚡" },
    { "name": "Arm Circles", "duration": "1 min", "emoji": "🔄" }
  ],
  "main_workout": [
    {
      "name": "Push Ups",
      "sets": 4,
      "reps": "12-15",
      "rest": "60 sec",
      "muscle_group": "Chest, Triceps",
      "calories_burned": 45,
      "emoji": "💪",
      "tip": "Keep core tight throughout"
    }
  ],
  "cooldown": [
    { "name": "Child Pose", "duration": "2 min", "emoji": "🧘" }
  ],
  "total_calories": 350,
  "motivational_quote": "An inspiring quote relevant to their goal"
}

Include 5-7 main workout exercises appropriate for the goal and activity level.`;

  const text = await callGemini([{ text: prompt }]);
  const parsed = parseJSON(text);
  if (!parsed) throw new Error('Could not parse workout plan response');
  return parsed;
}

// ─── Exercise Calorie Calculator ────────────────────────────────────────────
export async function getExerciseCalories(exerciseName, durationMins, weightKg = 70) {
  const prompt = `Calculate calories burned for: "${exerciseName}" for ${durationMins} minutes by a person weighing ${weightKg}kg.

Respond ONLY with JSON (no extra text):
{
  "exercise": "${exerciseName}",
  "duration_mins": ${durationMins},
  "calories_burned": 245,
  "met_value": 6.0,
  "category": "Cardio",
  "emoji": "🏃",
  "intensity": "Moderate",
  "muscles_worked": ["Quads", "Calves", "Core"],
  "tip": "One short tip for doing this exercise better"
}`;

  const text = await callGemini([{ text: prompt }]);
  const parsed = parseJSON(text);
  if (!parsed) {
    // MET-based local fallback (no API needed)
    const MET_MAP = {
      running: 9.8, cycling: 7.5, swimming: 8.0, yoga: 3.0, walking: 3.5,
      hiit: 10.0, 'weight training': 5.0, dancing: 5.5, 'jump rope': 11.0,
      pilates: 3.5, badminton: 5.5, cricket: 4.8, football: 7.0, basketball: 6.5,
      'brisk walk': 4.3, plank: 3.0,
    };
    const met = MET_MAP[exerciseName.toLowerCase()] || 6.0;
    const kcal = Math.round((met * 3.5 * weightKg * durationMins) / 200);
    return {
      exercise: exerciseName, duration_mins: durationMins, calories_burned: kcal,
      met_value: met, category: 'General', emoji: '💪', intensity: 'Moderate',
      muscles_worked: [], tip: `Keep a consistent pace throughout your ${exerciseName} session.`,
    };
  }
  return parsed;
}

// ─── Daily Wellness Tip ─────────────────────────────────────────────────────
export async function getDailyTip(userName, goal, waterGlasses, mealsLogged, workoutsDone, fitnessLevel = 'beginner', dietType = 'standard') {
  const prompt = `You are a friendly wellness coach. Give ${userName} a short personalized daily wellness tip based on:
- Goal: ${goal}
- Fitness Level: ${fitnessLevel}
- Diet Preference: ${dietType}
- Water today: ${waterGlasses}/8 glasses
- Meals logged: ${mealsLogged}
- Workouts done: ${workoutsDone}

Respond ONLY with JSON:
{
  "tip": "Personalized tip in 1-2 sentences. Be specific, warm, and actionable.",
  "emoji": "💡",
  "category": "Hydration"
}`;

  try {
    const text = await callGemini([{ text: prompt }]);
    const parsed = parseJSON(text);
    return parsed || { tip: `Keep going, ${userName}! Every small step counts toward your goal.`, emoji: '⚡', category: 'Mindset' };
  } catch {
    // Fallback tips if API fails
    const tips = [
      { tip: `Great start, ${userName}! Try drinking a glass of water before each meal today.`, emoji: '💧', category: 'Hydration' },
      { tip: `${userName}, consistency beats perfection. Even a 15-minute walk counts toward your goal!`, emoji: '🚶', category: 'Fitness' },
      { tip: `Remember to eat protein with every meal, ${userName}. It keeps you full longer.`, emoji: '💪', category: 'Nutrition' },
    ];
    return tips[Math.floor(Math.random() * tips.length)];
  }
}

// ─── Workout Summary Analysis ────────────────────────────────────────────────
export async function analyzeWorkoutDay(exercises, goal) {
  if (!exercises.length) return null;
  const exerciseList = exercises.map(e => `${e.name} (${e.duration} min, ${e.calories} kcal)`).join(', ');

  const prompt = `As a fitness coach, analyze today's workout: "${exerciseList}" for someone with goal: "${goal}".

Respond ONLY with JSON:
{
  "summary": "2-sentence summary of today's performance",
  "strength": "What they did well",
  "suggestion": "One specific improvement for tomorrow",
  "recovery_tip": "Short recovery tip",
  "emoji": "🏆"
}`;

  try {
    const text = await callGemini([{ text: prompt }]);
    return parseJSON(text);
  } catch {
    return {
      summary: 'Great workout session today! You are making steady progress toward your goal.',
      strength: 'Consistency and dedication',
      suggestion: 'Try adding 5 more minutes to your next session',
      recovery_tip: 'Stretch and hydrate well after exercise',
      emoji: '🏆',
    };
  }
}
