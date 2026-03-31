// db.js — simple JSON file database using Node.js built-in fs
// Stores all data in server/db.json (no external dependencies)
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_FILE = join(__dirname, 'db.json');

const defaultData = {
    users: [], meals: [], workouts: [],
    water_log: [], steps_log: [], goals: [], streaks: [],
    friends: [],
};

function read() {
    if (!existsSync(DB_FILE)) return { ...defaultData };
    try { return JSON.parse(readFileSync(DB_FILE, 'utf-8')); }
    catch { return { ...defaultData }; }
}

function write(data) {
    writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// Simple in-memory + file sync db object
const db = {
    data: read(),
    read() { this.data = read(); },
    write() { write(this.data); },
};

console.log('✅ JSON file database ready at:', DB_FILE);
export default db;
