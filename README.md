# FitAI: Your AI-Powered Fitness & Diet Planner 💪🧠

<div align="center">

[![GitHub Stars](https://img.shields.io/github/stars/Srijith004/Fit-AI?style=for-the-badge&color=a78bfa)](https://github.com/Srijith004/Fit-AI/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/Srijith004/Fit-AI?style=for-the-badge&color=34d399)](https://github.com/Srijith004/Fit-AI/forks)
[![GitHub Issues](https://img.shields.io/github/issues/Srijith004/Fit-AI?style=for-the-badge&color=f87171)](https://github.com/Srijith004/Fit-AI/issues)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://github.com/Srijith004/Fit-AI/blob/main/LICENSE)

**[🌐 View on GitHub](https://github.com/Srijith004/Fit-AI)** · **[🐛 Report Bug](https://github.com/Srijith004/Fit-AI/issues/new)** · **[✨ Request Feature](https://github.com/Srijith004/Fit-AI/issues/new)**

</div>

---

> **FitAI** is a modern, full-stack web application designed to help users track their fitness journey, manage their diet, and compete with friends — all powered by an intuitive Glassmorphism UI and Google Gemini AI.

---

## 🌟 Key Features

| Feature | Description |
|---|---|
| 🍽️ **AI Meal Scanner** | Snap a photo of food → Gemini Vision API estimates calories & macros instantly |
| 🏋️ **Smart Workout Plans** | Personalized routines auto-generated for your goals (Gain, Lose, Maintain) |
| 🔥 **Streak System** | Daily activity streaks with gamified rewards to drive habit formation |
| 👥 **Social Competition** | Connect with friends via unique codes, view leaderboards & challenge others |
| 💧 **Full Health Tracking** | Log water intake, steps, weight, and all key vitals in one place |
| 📊 **History & Analytics** | Visualize trends with historical charts, calendar logs & progress reports |
| 🔐 **JWT Auth** | Secure token-based authentication with protected route middleware |

---

## 🏗️ System Architecture

High-level overview of how the client, API server, AI services, and storage interact:

```mermaid
graph TD
    %% User Interaction
    User((👤 User)) --> |Browser / Web App| Frontend

    %% Frontend Stack
    subgraph "🖥️ Frontend (Vite + React)"
        Frontend[⚛️ React Application]
        UI[Glassmorphism UI Components]
        Router_FE[React Router DOM]
        API_Client[Axios REST Client]
        GeminiClient[🤖 Gemini AI Client]
        ContextStore["🌐 React Context\n(Auth / User / Data)"]

        Frontend --> UI
        Frontend --> Router_FE
        Frontend --> API_Client
        Frontend --> GeminiClient
        Frontend --> ContextStore
    end

    %% External APIs
    GeminiClient --> |Image bytes + Prompts| Gemini_API((🌐 Google Gemini API))

    %% Backend Stack
    subgraph "🚀 Backend (Node.js + Express)"
        Backend[Express API Server :3001]
        Auth_MW[🔐 JWT Auth Middleware]
        Routes["🛣️ Route Controllers\n/auth /users /meals\n/workouts /water /steps\n/streaks /goals /friends"]
        DB_Adapter[💾 JSON DB Adapter]

        Backend --> Auth_MW
        Auth_MW --> Routes
        Routes --> DB_Adapter
    end

    %% Connections
    API_Client --> |REST API: JSON over HTTP| Backend

    %% Data Storage
    subgraph "🗄️ Storage"
        DB[(db.json\nLocal Document Store)]
        DB_Adapter <--> |File I/O Read/Write| DB
    end

    %% Styles
    classDef main fill:#1e1e2e,stroke:#a78bfa,stroke-width:2px,color:#e2e8f0;
    classDef external fill:#1d4ed8,stroke:#93c5fd,stroke-width:2px,color:white;
    classDef db fill:#b45309,stroke:#fbbf24,stroke-width:2px,color:white;
    classDef user fill:#065f46,stroke:#34d399,stroke-width:2px,color:white;

    class Frontend,Backend main;
    class Gemini_API external;
    class DB db;
    class User user;
```

---

## 🔐 Authentication & Session Flow

Tracks how a user is verified, granted a JWT, and how that token protects every subsequent API call:

```mermaid
sequenceDiagram
    actor User
    participant FE as ⚛️ React Frontend
    participant BE as 🚀 Express Backend
    participant DB as 🗄️ db.json
    participant MW as 🔐 Auth Middleware

    User->>FE: Enter credentials (email + password)
    FE->>BE: POST /api/auth/login
    BE->>DB: Lookup user by email
    DB-->>BE: Return user record

    alt Credentials Valid
        BE-->>FE: 200 OK + JWT Token
        FE->>FE: Store JWT in localStorage
        FE-->>User: Redirect to Dashboard
    else Invalid Credentials
        BE-->>FE: 401 Unauthorized
        FE-->>User: Show error message
    end

    Note over FE,BE: Every subsequent request includes:<br/>Authorization: Bearer <token>

    FE->>MW: Protected API Request + JWT Header
    MW->>MW: Verify & decode JWT signature
    alt Token Valid
        MW->>BE: Pass req.user payload
        BE->>DB: Fetch / write user data
        DB-->>BE: Return data
        BE-->>FE: 200 OK + JSON response
    else Token Expired / Invalid
        MW-->>FE: 403 Forbidden
        FE->>FE: Clear token → Redirect to Login
    end
```

---

## 🤖 AI Meal Analysis Pipeline

Detailed flow of how a food photo becomes a structured macro breakdown:

```mermaid
flowchart TD
    A([👤 User]) --> B["📸 Tap 'Scan Food'\non Diet Page"]
    B --> C{Input Method}

    C -- Camera --> D["🎥 CameraCapture.jsx\nAccess device camera\ngetUserMedia API"]
    C -- Upload --> E["📁 File Upload\nDrag & Drop / Browse"]

    D --> F["🖼️ Image Captured\nas Base64 / Blob"]
    E --> F

    F --> G["gemini.js\nBuild Prompt:\n'Analyze food in image,\nestimate calories, protein,\ncarbs, fat, fiber'"]

    G --> H["🌐 Google Gemini\nVision API\ngenerateContent()"]

    H --> I{API Response}

    I -- Success --> J["📊 Parse JSON Response\nExtract: food_name,\ncalories, protein,\ncarbs, fat, fiber"]
    I -- Error/Retry --> K["⚠️ Fallback / Error UI\nAsk user to retake photo"]
    K --> B

    J --> L["✅ Confirm & Edit\nMacro Values UI"]
    L --> M["POST /api/meals\n{ food, macros, timestamp }"]
    M --> N[("🗄️ db.json\nMeal record saved")]
    N --> O["📈 Update Daily Totals\non Dashboard"]
    O --> P["🔥 Check & Update\nStreak Counter"]

    classDef ai fill:#4c1d95,stroke:#a78bfa,color:#e2e8f0,stroke-width:2px
    classDef action fill:#065f46,stroke:#34d399,color:white,stroke-width:2px
    classDef db fill:#b45309,stroke:#fbbf24,color:white,stroke-width:2px
    classDef ui fill:#1e3a5f,stroke:#60a5fa,color:white,stroke-width:2px

    class H ai
    class M,P action
    class N db
    class D,E,L,O ui
```

---

## 🏆 Gamification & Streak Engine

How FitAI's gamification loop drives daily habits and social competition:

```mermaid
flowchart TD
    LOGIN([👤 User Logs In]) --> LOAD["Load Today's Activity\nGET /api/streaks"]
    LOAD --> CHECK{Activity\nLogged Today?}

    CHECK -- Yes --> STREAK_OK["✅ Streak Maintained\nIncrement day count"]
    CHECK -- No --> GRACE{Within\nGrace Period?}
    GRACE -- Yes --> WARN["⚠️ Warning Banner\n'Don't lose your streak!'"]
    GRACE -- No --> RESET["💔 Streak Reset to 0"]

    STREAK_OK --> POINTS["🎯 Award Points\nBased on Activity Type:\n• Meal Log: +10pts\n• Workout Done: +25pts\n• Water Goal: +5pts\n• Steps Goal: +15pts"]
    RESET --> POINTS

    POINTS --> BADGE{Milestone\nReached?}
    BADGE -- Yes --> AWARD["🏅 Unlock Badge\n7-Day / 30-Day / 100-Day"]
    BADGE -- No --> LEADERBOARD

    AWARD --> NOTIFY["🔔 Show Achievement\nToast Notification"]
    NOTIFY --> LEADERBOARD

    LEADERBOARD["🏆 Recalculate\nFriends Leaderboard\nGET /api/friends"] --> RANK["📊 Update Rank\nAmong Friends"]
    RANK --> SAVE["POST /api/streaks\nPersist to db.json"]

    classDef win fill:#065f46,stroke:#34d399,color:white,stroke-width:2px
    classDef warn fill:#78350f,stroke:#fbbf24,color:white,stroke-width:2px
    classDef lose fill:#7f1d1d,stroke:#f87171,color:white,stroke-width:2px
    classDef neutral fill:#1e1e2e,stroke:#a78bfa,color:#e2e8f0,stroke-width:2px

    class STREAK_OK,AWARD,NOTIFY win
    class WARN,GRACE warn
    class RESET lose
    class POINTS,LEADERBOARD,RANK,SAVE neutral
```

---

## 🛣️ API Routes Map

Complete overview of all backend REST endpoints:

```mermaid
graph LR
    Client["⚛️ React\nClient"] --> |HTTP| API["🚀 Express\n:3001/api"]

    API --> AUTH["/auth"]
    AUTH --> A1["POST /login"]
    AUTH --> A2["POST /register"]

    API --> USERS["/users"]
    USERS --> U1["GET /:id — Fetch profile"]
    USERS --> U2["PUT /:id — Update profile"]

    API --> MEALS["/meals"]
    MEALS --> M1["GET / — All meal logs"]
    MEALS --> M2["POST / — Save new meal"]
    MEALS --> M3["DELETE /:id — Remove entry"]

    API --> WORKOUTS["/workouts"]
    WORKOUTS --> W1["GET / — Fetch plans"]
    WORKOUTS --> W2["POST / — Save plan"]
    WORKOUTS --> W3["PUT /:id — Update checklist"]

    API --> WATER["/water"]
    WATER --> WA1["GET / — Today's intake"]
    WATER --> WA2["POST / — Log water amount"]

    API --> STEPS["/steps"]
    STEPS --> S1["GET / — Fetch step history"]
    STEPS --> S2["POST / — Log daily steps"]

    API --> STREAKS["/streaks"]
    STREAKS --> ST1["GET / — Current streak info"]
    STREAKS --> ST2["POST / — Update streak"]

    API --> GOALS["/goals"]
    GOALS --> G1["GET / — Fetch goals"]
    GOALS --> G2["PUT / — Update targets"]

    API --> FRIENDS["/friends"]
    FRIENDS --> F1["GET / — Friend list + stats"]
    FRIENDS --> F2["POST /add — Add by code"]
    FRIENDS --> F3["GET /leaderboard — Rankings"]

    classDef client fill:#1e3a5f,stroke:#60a5fa,color:white
    classDef server fill:#1e1e2e,stroke:#a78bfa,color:#e2e8f0
    classDef route fill:#065f46,stroke:#34d399,color:white
    classDef endpoint fill:#3b1f6e,stroke:#a78bfa,color:#e2e8f0

    class Client client
    class API server
    class AUTH,USERS,MEALS,WORKOUTS,WATER,STEPS,STREAKS,GOALS,FRIENDS route
```

---

## 🔄 Full User Journey

End-to-end experience from first visit to active daily use:

```mermaid
flowchart TD
    Start([🚀 Open FitAI]) --> Auth{Logged In?\nJWT in localStorage}

    Auth -- No --> Login["🔐 Login / Register\nPOST /api/auth/login\nPOST /api/auth/register"]
    Login --> JWT["JWT Token Issued\nStored in localStorage"]
    JWT --> Onboard{First Time\nUser?}
    Onboard -- Yes --> Setup["📝 Onboarding Wizard\n• Name & Age\n• Height & Weight\n• Fitness Goal\n• Activity Level"]
    Setup --> DB1[("db.json\nUser Profile Saved")]
    DB1 --> Dashboard
    Onboard -- No --> Dashboard
    Auth -- Yes --> Dashboard

    Dashboard["🏠 Dashboard\nStats · Streaks · Quick Actions\nCalorie Ring · Progress Summary"]

    Dashboard --> D1["🍽️ Diet Page"]
    Dashboard --> D2["🏋️ Fitness Page"]
    Dashboard --> D3["👥 Social Page"]
    Dashboard --> D4["📊 History Page"]

    D1 --> Cam["📸 Scan Food\nCameraCapture UI"]
    Cam --> Gemini(("🤖 Gemini\nVision API"))
    Gemini --> Macros["Calories & Macros\nReturned as JSON"]
    Macros --> MealLog["POST /api/meals\nSave Meal Entry"]
    MealLog --> DB2[("db.json")]

    D2 --> Gen["⚙️ Generate Workout Plan\nPersonalized to Goal"]
    Gen --> Check["✅ Daily Exercise Checklist\nMark Sets & Reps Done"]
    Check --> WorkoutSave["POST /api/workouts\nPUT /:id (update progress)"]
    WorkoutSave --> DB3[("db.json")]

    D3 --> Friends["🤝 Add Friend\nby Unique Code"]
    Friends --> Board["🏆 Leaderboard\n& Weekly Challenge"]
    Board --> DB4[("db.json")]

    D4 --> Charts["📈 Trend Charts\n& Calendar Log\nWeight · Calories · Steps"]
    Charts --> DB5[("db.json")]

    classDef page fill:#1e1e2e,stroke:#a78bfa,color:#e2e8f0,stroke-width:2px
    classDef external fill:#1d4ed8,stroke:#93c5fd,color:white,stroke-width:2px
    classDef db fill:#b45309,stroke:#fbbf24,color:white,stroke-width:2px
    classDef action fill:#065f46,stroke:#34d399,color:white,stroke-width:2px

    class Dashboard,D1,D2,D3,D4 page
    class Gemini external
    class DB1,DB2,DB3,DB4,DB5 db
    class MealLog,WorkoutSave,Friends action
```

---

## ⚡ Development Lifecycle

```mermaid
flowchart TD
    A([🧑‍💻 Developer]) --> B["Clone Repository\ngit clone https://github.com/Srijith004/Fit-AI.git"]
    B --> C["Install Dependencies\nnpm install\ncd server && npm install"]
    C --> D["Configure .env\nVITE_GEMINI_API_KEY=your_key"]
    D --> E["npm run dev:all"]

    subgraph DEV ["⚡ Concurrent Dev Servers"]
        E --> F["🎨 Vite Dev Server\nlocalhost:5173\nHMR + React Fast Refresh"]
        E --> G["🚀 Express API Server\nlocalhost:3001\nNodemon Auto-Restart"]
    end

    F --> H{Code Change?}
    G --> H
    H -- Frontend --> I["HMR Hot Reload 🔥\nInstant browser update"]
    H -- Backend --> J["Nodemon Restart ♻️\nAPI server reloads"]
    I --> H
    J --> H
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 18** | Component-based UI framework |
| **Vite** | Lightning-fast dev server & bundler |
| **React Router DOM** | Client-side SPA routing |
| **Lucide React** | Clean, consistent icon set |
| **Vanilla CSS** | Custom Glassmorphism design system |
| **@google/generative-ai** | Gemini Vision API integration |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js** | JavaScript runtime |
| **Express.js** | REST API framework |
| **JSON Web Tokens (JWT)** | Stateless auth tokens |
| **CORS** | Cross-origin request handling |
| **db.json (custom adapter)** | Lightweight file-based persistence |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v16.x or newer
- npm or yarn
- A **Google Gemini API Key** → [Get one here](https://aistudio.google.com/app/apikey)

### 1. Clone the Repository
```bash
git clone https://github.com/Srijith004/Fit-AI.git
cd Fit-AI
```

### 2. Install Dependencies
```bash
# Root (concurrently + frontend deps)
npm install

# Backend deps
cd server && npm install && cd ..
```

### 3. Configure Environment Variables
Create a `.env` file in the **root** directory:
```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Run the Application
```bash
npm run dev:all
```
| Service | URL |
|---|---|
| 🎨 Frontend | http://localhost:5173 |
| 🚀 Backend API | http://localhost:3001 |

---

## 📂 Project Structure

```
📦 Fit-AI/
│
├── 📄 index.html                   # App HTML shell / entry point
├── 📄 vite.config.js               # Vite build & dev server config
├── 📄 package.json                 # Root scripts (dev:all via concurrently)
├── 📄 .env                         # 🔑 Gemini API Key (not committed)
├── 📄 .gitignore                   # Git ignore rules
│
├── 📁 src/                         # ⚛️  React Frontend Source
│   ├── 📄 main.jsx                 # React DOM root renderer
│   ├── 📄 App.jsx                  # Route definitions & layout wrapper
│   ├── 📄 index.css                # Global styles & Glassmorphism tokens
│   │
│   ├── 📁 pages/                   # 🖥️  Full-page route views
│   │   ├── 📄 Login.jsx            # Auth — login & register forms
│   │   ├── 📄 Onboarding.jsx       # New-user profile & goals wizard
│   │   ├── 📄 Dashboard.jsx        # Home — stats, streaks & overview
│   │   ├── 📄 Diet.jsx             # AI food scan & meal log
│   │   ├── 📄 Fitness.jsx          # Workout plans & exercise tracker
│   │   ├── 📄 Social.jsx           # Friends, leaderboard & challenges
│   │   └── 📄 History.jsx          # Historical logs & trend charts
│   │
│   ├── 📁 components/              # 🧩  Reusable UI components
│   │   ├── 📄 Layout.jsx           # App shell with sidebar navigation
│   │   ├── 📄 GlassCard.jsx        # Glassmorphism card primitive
│   │   ├── 📄 ProgressBar.jsx      # Animated progress indicator
│   │   └── 📄 CameraCapture.jsx    # Camera / image-upload for AI scan
│   │
│   ├── 📁 context/                 # 🌐  React Context (global state)
│   │   ├── 📄 AuthContext.jsx      # Authentication state & JWT helpers
│   │   ├── 📄 UserContext.jsx      # User profile & preferences
│   │   └── 📄 DataContext.jsx      # Meals, workouts & health data
│   │
│   ├── 📁 hooks/                   # 🪝  Custom React hooks
│   │   └── 📄 useStepCounter.js    # Pedometer / step-count hook
│   │
│   └── 📁 lib/                     # 🛠️  Utility & API helpers
│       ├── 📄 api.js               # Axios client & REST API wrappers
│       └── 📄 gemini.js            # Google Gemini Vision AI integration
│
└── 📁 server/                      # 🚀  Node.js + Express Backend
    ├── 📄 index.js                 # Express app entry & server bootstrap
    ├── 📄 db.js                    # JSON file-based DB adapter (CRUD)
    ├── 📄 db.json                  # 🗄️ Persistent local data store
    ├── 📄 package.json             # Backend-specific dependencies
    │
    ├── 📁 middleware/              # 🔐  Express middleware
    │   └── 📄 auth.js              # JWT verification middleware
    │
    └── 📁 routes/                  # 🛣️  API route controllers
        ├── 📄 auth.js              # POST /register  POST /login
        ├── 📄 users.js             # GET|PUT /users/:id  (profile)
        ├── 📄 meals.js             # GET|POST|DELETE /meals
        ├── 📄 workouts.js          # GET|POST|PUT /workouts
        ├── 📄 water.js             # GET|POST /water     (hydration)
        ├── 📄 steps.js             # GET|POST /steps     (activity)
        ├── 📄 streaks.js           # GET|POST /streaks
        ├── 📄 goals.js             # GET|PUT  /goals
        └── 📄 friends.js           # GET|POST /friends   (social)
```

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository: [github.com/Srijith004/Fit-AI/fork](https://github.com/Srijith004/Fit-AI/fork)
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request at: [github.com/Srijith004/Fit-AI/pulls](https://github.com/Srijith004/Fit-AI/pulls)

Please report bugs at [github.com/Srijith004/Fit-AI/issues](https://github.com/Srijith004/Fit-AI/issues).

---

## 📝 License

This project is licensed under the **MIT License** — see the [LICENSE](https://github.com/Srijith004/Fit-AI/blob/main/LICENSE) file for details.

---

<div align="center">

Made with ❤️ by [Srijith](https://github.com/Srijith004) · ⭐ Star this repo if you found it useful!

**[🌐 github.com/Srijith004/Fit-AI](https://github.com/Srijith004/Fit-AI)**

</div>
