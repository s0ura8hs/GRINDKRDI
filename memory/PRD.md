# GRIND — Universal Roadmap Tracker

## Overview
Mobile app (React Native Expo) that tracks any learning/work roadmap with custom streams, daily tasks, and photo proof accountability. Ships with a default 8-Month Engineering Roadmap (224 days, 4 streams) but users can import their own roadmaps with any number of custom streams.

## Core Features
1. **Custom JSON Import** — Upload a JSON file with custom streams, months, weeks, and daily topics. The app completely transforms to match your data.
2. **Multiple Roadmaps** — Save and switch between multiple imported roadmaps. Each has its own progress.
3. **Dynamic Streams** — Not limited to DSA/Backend/Data/Cloud. Any custom stream names work (Marketing, Design, etc.)
4. **Study Timer** — Countdown timer per task with play/pause/reset. Starts from the stream's configured duration.
5. **Share Progress** — Detailed share card with overall stats, stream-level progress, and monthly breakdown via system share sheet.
6. **Push Notifications** — Daily reminder at user-selected time using expo-notifications.
7. **Photo Proof Requirement** — Must upload image proof before marking task done (base64 local storage).
8. **Sequential Day Locking** — Must complete previous days to unlock next.
9. **Streak Counter** — Consecutive days completed from start.
10. **Analytics Dashboard** — Overall stats, stream breakdown, monthly breakdown.

## Architecture
- **Frontend**: React Native Expo with expo-router (file-based routing)
- **Backend**: FastAPI (minimal - health check only)
- **Storage**: AsyncStorage with multi-key structure:
  - `grind_meta_v3`: Active roadmap ID, roadmap list, notification settings
  - `grind_roadmap_{id}`: Full roadmap data for custom roadmaps
  - `grind_progress_{id}`: Per-roadmap progress data
- **Navigation**: 4 bottom tabs (Today, Roadmap, Analytics, Settings) + Stack screens

## Screens
1. **Today** — Current active day with dynamic task cards, progress bar, streak, study timers
2. **Roadmap** — Browse months/weeks/days with stream filter pills
3. **Analytics** — Stats + Share button
4. **Settings** — Active roadmap, switch/manage roadmaps, import, notifications
5. **Import** — JSON file picker, validation, preview, import
6. **Day Detail** — View/complete any day's tasks with timer

## Import JSON Format
```json
{
  "name": "Your Roadmap",
  "streams": [
    { "name": "Stream 1", "duration": "30 min" },
    { "name": "Stream 2", "duration": "45 min" }
  ],
  "weeks": [
    {
      "month": 1,
      "monthTitle": "Month 1 — Title",
      "days": [
        { "Stream 1": "Day 1 topic", "Stream 2": "Day 1 topic" }
      ]
    }
  ]
}
```

## Tech Stack
- Expo SDK 54, expo-router v6, TypeScript
- AsyncStorage for persistence
- expo-image-picker, expo-document-picker, expo-notifications, expo-sharing
- @expo/vector-icons (Feather)
