# MamaTrack GPS — Maternal & Emergency Health Tracking System

MamaTrack GPS is a web and mobile PWA application designed for tracking expectant mothers, community VHT (Village Health Team) health records, doctor consultations, driver emergency dispatch, and administrative analytics.

---

## 📌 System Documentation & Recommendations
* **Latest System Recommendations & Roadmap**: See [RECOMMENDATIONS.md](./RECOMMENDATIONS.md) for the latest architectural recommendations, offline-first strategy, security policies, and performance enhancements.
* **Supabase Integration Guide**: See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for setup instructions and SQL database schema migration steps.

---

## 🛠️ Development & Available Scripts

In the `system_files` directory, you can run:

### `npm run dev`
Runs the app in development mode using Vite. Open [http://localhost:5173](http://localhost:5173) to view in browser.

### `npm run build`
Builds the production-ready application bundle in the `dist` folder.

### `npm run type-check`
Runs the TypeScript compiler check (`tsc -b`) across all modules without emitting files.

### `npm run lint`
Runs ESLint across `src/` to verify code quality and rule compliance.

---

## 🏗️ Core Architecture Overview
* **Frontend**: React 18 + TypeScript + Vite + Tailwind/Vanilla CSS
* **Mapping**: Leaflet + OpenStreetMap + OSRM Routing Engine
* **Persistence & Synchronization**: Local Storage + IndexedDB (`offlineStorage.ts`) + Supabase DB Client
* **PWA & Mobile**: Service Worker + Web App Manifest (`manifest.json`)
