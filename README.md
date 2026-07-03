# Health Sync

### AI-Powered Smart Healthcare Monitoring Platform

**Tagline:** Real-Time Monitoring • AI Predictions • Better Healthcare Decisions

---

## Overview

Health Sync is an intelligent, high-fidelity healthcare dashboard designed for district and primary health centers (PHC/CHC). It offers telemetry aggregation, demand predictions, alerts monitoring, resources load-balancing suggestions, localized multilingual translation grids, an interactive geospatial heatmap, and conversational interfaces (voice commander & AI helper chatbot).

---

## Core Features

- **Government-Grade Design System:** Styled with premium Slate backgrounds, authoritative Teal/Blue status highlights, glowing indicator metrics, and glassmorphism panel styles.
- **Simulated Real-Time Firestore Engine:** Utilizes client-side observer models (`onSnapshot`) backing up state inside `localStorage` to synchronize values (medicines, patient influxes, roster status) across cards, logs, maps, and leaderboards reactively.
- **AI Demand Predictor & Logistic suggestions:** Evaluates past clinic telemetry logs to compute safety stocks, bed redirections, and transfer recommendations (e.g. shift ORS inventory between centres).
- **Incident Command Registry:** Logs active telemetry alerts (shortages, doctor absences, overcrowding spikes) and offers single-click resolution processes that run automated corrections.
- **Multilingual Localizer:** Swaps text headers, grid indicators, and charts translations instantly across English, Hindi, and Tamil without browser refreshes.
- **Interactive SVG Heatmap:** A custom tactical district canvas showcasing center rings pulsing Green, Orange, or Red based on dynamically calculated health scores.
- **Voice Commander & Chatbot:** Conversational interfaces enabling query resolutions (e.g. asking "Which center is overcrowded?") and voice-based tab changes ("Open reports").
- **Audit Reports Exporter:** Compiles state records into formatted CSV strings and triggers actual local storage downloads.

---

## Folder Structure

```text
health-sync
│
├── frontend
│   ├── public
│   ├── src
│   │   ├── assets/
│   │   ├── components/       # UI Components (Sidebar, Navbar, Cards, Charts, Chatbot)
│   │   ├── pages/            # Core views (Login, Signup, Dashboard, Alerts, Reports, Centers, Settings, Admin)
│   │   ├── firebase/         # Real-time simulated auth & firestore database observers
│   │   ├── ai/               # Demand predictor and redistribution recommendations logic
│   │   ├── context/          # Global AppContext state localizer & voice controls
│   │   ├── utils/            # Real-time dummy simulator ticks
│   │   ├── App.jsx           # Main routing coordinator
│   │   └── main.jsx          # React bootstrapper
│   │
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── functions/                # Firebase Cloud Functions (Cron triggers & translators)
│   ├── index.js
│   ├── aiPrediction.js
│   ├── alertGenerator.js
│   ├── reportGenerator.js
│   └── translate.js
│
├── firestore.rules
├── firestore.indexes.json
├── firebase.json
├── package.json              # Monorepo command runner
└── README.md
```

---

## Quick Start (Run Locally)

1. Clone or open the workspace directory.
2. Run npm installation and spin up the development environment from the project root:
   ```bash
   # Installs workspace assets
   npm install --prefix frontend
   
   # Starts Vite development server
   npm run dev
   ```
3. Open your browser and navigate to: [http://localhost:5173](http://localhost:5173)

---

## Demo Test Accounts

The platform includes **One-Click Quick Login** buttons on the login page for rapid role evaluations. Alternatively, you can use these email handles with any password of 6 characters or more:

| Government Role | Credentials | Node Scope |
| :--- | :--- | :--- |
| **Chief Admin** | `admin@healthsync.gov.in` | Global District metrics (All nodes) |
| **District Officer** | `officer@healthsync.gov.in` | Aggregated dashboard & PHC Leaderboards |
| **Pharmacist** | `staff@healthsync.gov.in` | Node PHC Anantapur (Stock modifications enabled) |
| **Node Doctor** | `doctor@healthsync.gov.in` | Node PHC Anantapur (Roster check-ins enabled) |
