# GRIND — Universal Roadmap Tracker

> A powerful, customizable mobile app for tracking any learning or work roadmap with daily tasks, photo proof accountability, study timers, and progress analytics.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Screenshots](#screenshots)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Building the APK](#building-the-apk)
- [Custom JSON Import Format](#custom-json-import-format)
- [Architecture](#architecture)

---

## Overview

GRIND ships with a default **8-Month Engineering Roadmap** (224 days across DSA, Backend, Data Analytics, and Cloud/DevOps), but its real power is that **anyone can upload their own roadmap** via a JSON file. The app completely transforms — new streams, new topics, new timeline — all from a single file upload.

---

## Features

### 1. Custom JSON Import (Core Feature)
Upload a JSON file from your device to create a completely custom roadmap. Define your own stream names (Marketing, Design, Music, Fitness — anything), set durations, and provide day-by-day topics. The entire app transforms to match your data including colors, navigation, progress tracking, and analytics.

**How it works:**
- Go to **Settings** → tap **+ Import**
- Pick a `.json` file from your device
- The app validates the structure and shows a preview
- Confirm to import — the app switches to your new roadmap instantly

### 2. Multiple Roadmaps
Save and switch between multiple imported roadmaps. Each roadmap maintains its own independent progress, so you can track multiple learning paths simultaneously.

- The default 8-Month Engineering Roadmap is always available
- Custom roadmaps can be deleted (with confirmation)
- Switch active roadmap from Settings with one tap

### 3. Study Timer
Every task card includes a **countdown timer** that starts from the stream's configured duration (e.g., 45 minutes for DSA). Helps maintain focus and accountability.

- **Play**: Start the countdown
- **Pause**: Pause and resume anytime
- **Reset**: Reset to the original duration
- **Alert**: Notifies you when time's up

### 4. Share Progress
Generate and share a detailed progress report via any app on your device (WhatsApp, Twitter, Messages, etc.). The share card includes:

- Overall completion percentage
- Current streak count
- Per-stream progress breakdown
- Monthly progress breakdown
- Backlog count

### 5. Push Notification Reminders
Set daily reminders to keep your streak alive. Choose your preferred time in Settings.

- Toggle notifications on/off
- Custom time picker (hour up/down)
- Daily scheduled notification: *"🔥 Time to GRIND! Your daily tasks are waiting."*

### 6. Photo Proof Accountability
Every task requires a **photo proof** before it can be marked as done. Take a photo or pick from your gallery. Proof images are stored locally as base64.

### 7. Sequential Day Locking
Days unlock sequentially — you must complete Day N before Day N+1 becomes accessible. This enforces discipline and prevents cherry-picking easy topics.

### 8. Streak Counter
Tracks consecutive days completed from Day 1. Displayed prominently on the Today screen header. Break the chain and your streak resets.

### 9. Backlog Tracking
If you skip a day and complete a later one, the skipped day becomes "backlog" (shown in red). Backlog days are still accessible so you can go back and complete them.

### 10. Analytics Dashboard
Full statistics dashboard with:
- **Overview cards**: Days done, streak, backlog, weeks completed
- **Overall progress bar** with percentage
- **Stream breakdown**: Per-stream completion with colored progress bars
- **Monthly breakdown**: 8 month cards showing individual progress

---

## Technology Stack

| Technology | Purpose | Version |
|---|---|---|
| **React Native** | Cross-platform mobile framework | 0.81.5 |
| **Expo** | Development platform & build tools | SDK 54 |
| **Expo Router** | File-based navigation | v6 |
| **TypeScript** | Type-safe JavaScript | 5.9 |
| **AsyncStorage** | Local data persistence | 2.2.0 |
| **expo-image-picker** | Photo capture & gallery access | 17.0 |
| **expo-document-picker** | JSON file import | Latest |
| **expo-notifications** | Push notification scheduling | 0.32 |
| **expo-sharing** | System share sheet | Latest |
| **expo-file-system** | File read/write operations | Latest |
| **@expo/vector-icons** | Feather icon library | 15.0 |
| **react-native-reanimated** | Smooth animations | 4.1 |
| **react-native-safe-area-context** | Safe area handling | 5.6 |
| **react-native-screens** | Native screen optimization | 4.16 |
| **FastAPI** | Backend API (Python) | Latest |
| **MongoDB** | Database (available for future use) | 7.0 |

### Why These Technologies?

- **Expo SDK 54**: Latest stable SDK with full Expo Go compatibility, EAS Build support, and access to all native modules
- **Expo Router v6**: File-based routing that maps directly to React Navigation, making navigation predictable and type-safe
- **AsyncStorage**: Industry-standard local storage for React Native — fast, reliable, and works across all platforms
- **TypeScript**: Catches bugs at compile time, especially important for complex data structures like dynamic roadmaps
- **Feather Icons**: Clean, consistent 24px stroke icons that match the Neo-Brutalist design aesthetic

---

## Project Structure

```
/app
├── backend/
│   ├── .env                  # MongoDB URL
│   ├── requirements.txt      # Python dependencies
│   ├── server.py             # FastAPI health endpoint
│   └── tests/
│       └── test_health.py    # Backend tests
│
├── frontend/
│   ├── app/                  # Expo Router screens (file-based routing)
│   │   ├── _layout.tsx       # Root layout (Stack navigator)
│   │   ├── import.tsx        # JSON import screen (modal)
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx   # Tab navigator (4 tabs)
│   │   │   ├── index.tsx     # Today screen
│   │   │   ├── roadmap.tsx   # Roadmap browser
│   │   │   ├── analytics.tsx # Analytics + Share
│   │   │   └── settings.tsx  # Settings + Notifications
│   │   └── day/
│   │       └── [dayNum].tsx  # Day detail screen (dynamic route)
│   │
│   ├── src/
│   │   ├── data/
│   │   │   └── syllabus.ts   # Default 224-day engineering curriculum
│   │   ├── hooks/
│   │   │   └── useRoadmap.ts # Main data loading hook
│   │   └── utils/
│   │       ├── types.ts      # TypeScript interfaces
│   │       ├── colors.ts     # Color palette & dynamic stream colors
│   │       └── storage.ts    # AsyncStorage CRUD, validation, migration
│   │
│   ├── app.json              # Expo configuration
│   ├── package.json          # Node dependencies
│   └── tsconfig.json         # TypeScript configuration
│
├── memory/
│   ├── PRD.md                # Product requirements document
│   └── test_credentials.md   # Test credentials (no auth in this app)
│
└── README.md                 # This file
```

---

## Installation & Setup

### Prerequisites
- **Node.js** 18+ ([download](https://nodejs.org/))
- **Expo CLI**: `npm install -g expo-cli`
- **Expo Go** app on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))

### Quick Start

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd app/frontend

# 2. Install dependencies
npm install

# 3. Start the development server
npx expo start

# 4. Scan the QR code with Expo Go (Android) or Camera app (iOS)
```

### Running on Web (Preview)

```bash
cd app/frontend
npx expo start --web
# Opens in browser at http://localhost:8081
```

### Running the Backend (Optional)

```bash
cd app/backend
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001
# Health check: http://localhost:8001/api/health
```

---

## Building the APK

### Method 1: EAS Build (Recommended — Cloud Build)

EAS (Expo Application Services) builds your APK in the cloud. No Android Studio needed.

```bash
# 1. Install EAS CLI
npm install -g eas-cli

# 2. Login to your Expo account
eas login

# 3. Configure the build (run from /frontend directory)
cd app/frontend
eas build:configure

# 4. Build the APK for Android
eas build --platform android --profile preview

# This creates an APK (not AAB). The build runs in the cloud.
# EAS will give you a download link when done (usually 10-15 minutes).
```

**Build profiles** — Add this to your `eas.json` (created by `eas build:configure`):

```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

- `preview` profile → Generates a `.apk` file (for direct install / sideloading)
- `production` profile → Generates a `.aab` file (for Google Play Store)

### Method 2: Local Build (Requires Android SDK)

```bash
# 1. Install EAS CLI
npm install -g eas-cli

# 2. Generate native Android project
cd app/frontend
npx expo prebuild --platform android

# 3. Build locally
eas build --platform android --profile preview --local

# The APK will be saved in the current directory
```

### Method 3: Expo Dev Build (For Development)

```bash
# Creates a development build with dev tools
eas build --platform android --profile development
```

### Installing the APK

1. **Download** the APK from the EAS build URL (sent to your terminal/email)
2. **Transfer** to your Android device (USB, email, cloud drive, etc.)
3. **Enable** "Install from Unknown Sources" in your Android Settings:
   - Settings → Security → Unknown Sources → Toggle ON
   - Or: Settings → Apps → Special Access → Install Unknown Apps → Your File Manager → Allow
4. **Tap** the APK file to install
5. **Open** the GRIND app and start tracking!

### iOS Build (TestFlight)

```bash
# Requires an Apple Developer account ($99/year)
eas build --platform ios --profile preview
# Upload to TestFlight for testing, or App Store for distribution
```

---

## Custom JSON Import Format

Create a `.json` file with this structure to import your own roadmap:

```json
{
  "name": "My Custom Roadmap",
  "streams": [
    { "name": "Marketing", "duration": "30 min" },
    { "name": "Design", "duration": "45 min" },
    { "name": "Coding", "duration": "60 min" }
  ],
  "weeks": [
    {
      "month": 1,
      "monthTitle": "Month 1 — Getting Started",
      "days": [
        {
          "Marketing": "Brand strategy fundamentals",
          "Design": "Color theory and typography",
          "Coding": "HTML & CSS basics"
        },
        {
          "Marketing": "Target audience research",
          "Design": "Layout principles",
          "Coding": "JavaScript fundamentals"
        }
      ]
    },
    {
      "month": 1,
      "monthTitle": "Month 1 — Getting Started",
      "days": [
        {
          "Marketing": "Content marketing intro",
          "Design": "Figma basics",
          "Coding": "React components"
        }
      ]
    }
  ]
}
```

### Field Descriptions

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | Yes | Display name for your roadmap |
| `streams` | array | Yes | List of learning streams/tracks |
| `streams[].name` | string | Yes | Stream display name (used as topic key in days) |
| `streams[].duration` | string | No | Suggested daily duration (default: "30 min") |
| `weeks` | array | Yes | List of week objects |
| `weeks[].month` | number | No | Month number (auto-calculated if missing) |
| `weeks[].monthTitle` | string | Yes | Display title for the month |
| `weeks[].days` | array | Yes | List of day objects (topics per stream) |

### Rules
- Each day object must have keys matching the stream **names** (not keys)
- You can have any number of streams (1 to 15+)
- Each week can have any number of days (typically 5-7)
- Month numbers can repeat (multiple weeks in one month)

---

## Architecture

### Data Flow

```
User Action → Screen Component → useRoadmap Hook → AsyncStorage
                                                       ↓
                                              Multi-key storage:
                                              • grind_meta_v3 (active roadmap, settings)
                                              • grind_roadmap_{id} (custom roadmap data)
                                              • grind_progress_{id} (per-roadmap progress)
```

### Navigation Structure

```
Root Stack (_layout.tsx)
├── Tab Navigator ((tabs)/_layout.tsx)
│   ├── Today (index.tsx)        — Current day's tasks + timer
│   ├── Roadmap (roadmap.tsx)    — Month/week/day browser
│   ├── Analytics (analytics.tsx) — Stats + share
│   └── Settings (settings.tsx)  — Roadmap management + notifications
│
├── Day Detail (day/[dayNum].tsx) — Full day view (stack screen)
└── Import (import.tsx)           — JSON import (modal)
```

### Dynamic Stream System

The app assigns colors and icons dynamically based on stream index:

| Index | Color | Icon |
|---|---|---|
| 0 | Indigo | zap |
| 1 | Emerald | server |
| 2 | Amber | bar-chart-2 |
| 3 | Sky | cloud |
| 4 | Pink | code |
| 5 | Violet | compass |
| 6 | Lime | edit-3 |
| 7+ | Cycles through palette | ... |

---

## License

MIT

---

**Built with discipline. Ship with GRIND. 🔥**
