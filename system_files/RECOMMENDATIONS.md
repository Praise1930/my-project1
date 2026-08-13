# MamaTrack GPS — System Architectural & Technical Recommendations

This document tracks the latest architectural recommendations, design improvements, security considerations, and system roadmap for MamaTrack GPS.

---

## 📌 Status & Recommendations Overview

| Category | Recommendation | Priority | Status |
| :--- | :--- | :---: | :---: |
| **Architecture** | Service Layer Modularization (Decouple `db.ts` into discrete domain services) | High | ⏳ In Progress |
| **Performance** | Lazy Loading Heavy Components (`MapComponent` via `React.lazy`) | High | 🛠️ Implemented |
| **Offline-First** | IndexedDB Offline Storage for Low-Connectivity Rural VHT Emergency Logs | High | 🛠️ Implemented (`offlineStorage.ts`) |
| **Offline-First** | Service Worker Background Sync for Dispatched Emergency Actions | Medium | 📅 Planned |
| **Security** | Supabase Row Level Security (RLS) & Role-Based Access Enforcement | High | 🔒 Recommended |
| **Code Quality** | Comprehensive Type Safety (Eliminate loose `any` casts) | Medium | 🛠️ Implemented |
| **Testing** | Automated Unit & E2E Testing Suite (Vitest + Playwright) | Medium | 📅 Planned |

---

## 🚀 Detailed Recommendations & Action Plan

### 1. Architecture & Maintenance
* **Service Decomposition (`db.ts`)**:
  * Decouple data handling into `emergencyService.ts`, `userService.ts`, `checkupService.ts`, and `notificationService.ts`.
  * Ensure clear separation of concerns between client UI state and persistence layers.
* **Component Modularization**:
  * Decompose monolithic dashboard files (`AdminDashboard.tsx`, `MotherDashboard.tsx`, `VhtDashboard.tsx`) into modular widget components (e.g., `<EmergencyStatsWidget />`, `<PatientVitalsTable />`, `<DriverStatusMap />`).

### 2. Offline-First Resilience
* **IndexedDB & Local Storage Fallback**:
  * `offlineStorage.ts` provides structured offline persistence for emergency queues, checkup schedules, and patient records when mobile cellular networks drop.
* **Background Sync**:
  * Register service worker background sync events to transmit queued offline SOS emergency alerts once network connectivity is restored.

### 3. Performance & Asset Optimization
* **Code Splitting & Component Lazy Loading**:
  * Lazy-load Leaflet map instances and modal components to keep initial JavaScript bundle size low and decrease initial page load time.
* **Asset Path Resolution**:
  * Ensure public image assets (hero banners, background graphics, icons) are optimized in SVG/WebP format and served directly from the `/public` static asset directory.

### 4. Security & Access Control
* **Database Row Level Security (RLS)**:
  * Enforce role-based RLS policies on Supabase tables to ensure expectant mothers, VHTs, doctors, drivers, and admins can only read/write authorized records.
* **Input Validation & Sanitization**:
  * Use schema validation for all incoming form payloads (vitals, medical history, emergency location updates).

---

## 📝 Change & Recommendation Log
- **2026-08-13**: Documented current system state recommendations, added offline storage abstraction (`offlineStorage.ts`), configured type-safety linter policies, and established system roadmap.
