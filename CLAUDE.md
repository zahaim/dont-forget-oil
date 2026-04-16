# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Fuel & Maintenance Tracker** — A privacy-first mobile app for tracking fuel consumption and vehicle maintenance.

Users take photos of their car odometer and fuel pump meter to automatically log fuel consumption, costs, and efficiency. Future phases add maintenance reminders and seasonal notifications.

**See [PROJECT_IDEA.md](PROJECT_IDEA.md) for full vision and motivation.**

## Key Principles

- 🔒 **Privacy-first**: No personal data stored, photos deleted after processing, offline-only
- 📱 **Mobile-first**: iOS and Android via cross-platform framework
- 📄 **Portable data**: Simple flat files/SQLite database users can sync via any cloud drive
- 🔓 **Open-source**: Non-commercial, MIT or similar license
- 📸 **Photo-based**: OCR to extract odometer and fuel meter readings

## Documentation

- **[PROJECT_IDEA.md](PROJECT_IDEA.md)** — Vision, motivation, and three-phase scope
- **[REQUIREMENTS.md](REQUIREMENTS.md)** — MVP features, Phase 2/3 features, and non-functional requirements
- **[TECH_STACK.md](TECH_STACK.md)** — Technical decisions, platform choice, OCR approach, data storage
- **[ROADMAP.md](ROADMAP.md)** — Detailed task tracking with statuses (Done/In Progress/Planned/Idea) for all three phases plus distribution and engineering

**Start here when picking up the project**: Read ROADMAP.md first to see what's done and what's next, then PROJECT_IDEA.md for context if needed.

## Claude Memory (persists across conversations)

Detailed OCR lessons, dependency gotchas, and UX preferences are stored in Claude's auto-memory system. These are loaded automatically at the start of each conversation. Key memories:

- **OCR lessons** — ML Kit details, `expo-image-manipulator` incompatibility with SDK 54 (tried v13/v14/v55, all fail at pod install), seven-segment display limitations, implemented improvements
- **UX preferences** — User prefers colored chips over dropdowns, wants number roller editor for digit editing, wants pump OCR values assignable to either volume or cost field

## Development Stack

**React Native / Expo SDK ~54** with Expo Router v6 (file-based navigation). See [TECH_STACK.md](TECH_STACK.md) for full rationale.

## Getting Started

### Prerequisites

- Node.js and npm installed
- Xcode installed on macOS
- Apple Developer account (free)
- iPhone running iOS 12+

### Setup

1. **Install dependencies:**
   ```bash
   cd app
   npm install
   ```

2. **Configure bundle ID:**
   - Open `app/app.json`
   - Change `"bundleIdentifier": "com.anonymous.app"` to something like `"com.yourname.app"`
   - Save the file

3. **Enable Developer Mode on iPhone:**
   - Connect iPhone to Mac via USB
   - On iPhone: **Settings** → **Privacy & Security** → **Developer Mode** → **Toggle ON**
   - Restart your iPhone
   - Trust the Mac when prompted

### Building & Deploying to iPhone

```bash
cd app

# Regenerate iOS native project (do this after changing app.json)
npx expo prebuild --platform ios --clean

# Build and install on connected iPhone (release version, no dev server needed)
npx expo run:ios --device --configuration Release
```

First time setup may ask you to:
1. **Trust the developer certificate** on your iPhone (**Settings** → **General** → **VPN & Device Management**)
2. Allow Xcode to access your credentials

### Development Commands

**For local testing with hot reload** (requires dev server):
```bash
cd app
npx expo start
# Then press 'i' to open in iOS simulator, or scan QR with Expo Go app
```

**For building a standalone release** (works offline on device):
```bash
cd app
npx expo run:ios --device --configuration Release
```

**Clean rebuild** (if you hit cache issues):
```bash
cd app
rm -rf ios/Pods ios/Podfile.lock node_modules
npm install
npx expo prebuild --platform ios --clean
npx expo run:ios --device --configuration Release
```

**When to run prebuild**: `npx expo prebuild` regenerates the native iOS project from `app.json`. Run it after:
- Changing `app.json` (bundle ID, plugins, permissions)
- Adding a package that includes native code (e.g. `expo-image-picker`)

## Architecture

```
app/
  app/                    # Expo Router screens (file-based routing)
    (tabs)/               # Bottom tab navigator
      index.tsx           # Home — 30-day stats, last entry, quick actions
      explore.tsx         # Placeholder (unused)
    _layout.tsx           # Root Stack navigator
    log-fuel.tsx          # Log a fuel entry (camera + OCR + manual input)
    history.tsx           # Fuel history with filters and stats
    settings.tsx          # App settings (currency, unit, reset)
    setup.tsx             # First-run setup (car name, mileage, unit, currency)
  utils/
    ocr.ts                # OCR pipeline — ML Kit recognize, letter-to-digit coercion,
                          #   confidence filtering, extractMileage(), extractPumpReading()
  store/
    fuelStore.ts          # Zustand store — fuel entries, persisted via AsyncStorage
    settingsStore.ts      # Zustand store — user preferences, persisted via AsyncStorage
  constants/
    currencies.ts         # Shared CURRENCIES list used across screens
```

**State management**: Zustand with AsyncStorage persistence
**Navigation**: Expo Router v6 Stack + Tabs
**Camera**: `expo-image-picker` (system camera, in-memory only — photos never written to disk)
**OCR**: `@react-native-ml-kit/text-recognition` v2 (on-device Google ML Kit, Latin script)

## Important Notes

### Privacy & Security
- Never store photos to disk — delete after OCR extraction
- No cloud sync, no analytics, no telemetry
- No permissions beyond Camera and File Storage
- All data stored locally on device
- Users control where their data lives (cloud drive, local storage, etc.)

### Data Format
- Primary storage: SQLite database (`fuel_tracker.db`)
- Export format: CSV/JSON for portability
- Users should be able to back up a single file to their cloud drive

### OCR Approach
- **Library**: `@react-native-ml-kit/text-recognition` v2.0.0 (on-device, offline, privacy-friendly)
- **Pipeline** (`utils/ocr.ts`): recognize → confidence filter → letter-to-digit coerce → regex extract → rank candidates
- Fallback: Manual data entry if photo extraction fails — all fields always editable
- Avoid cloud-based OCR APIs (privacy violation)
- **Known limitation**: ML Kit struggles with seven-segment LCD/LED displays (gaps between segments confuse the model). See Claude memory for full details and fallback options.

### Known Dependency Issues
- **DO NOT use `expo-image-manipulator`** — incompatible with Expo SDK 54. All versions fail at `pod install` (v13/v14 need missing `EXImageLoader` pod, v55 needs Swift APIs from newer `expo-modules-core`). Revisit when upgrading to SDK 55.
- To suppress git dirty warnings during prebuild: `EXPO_NO_GIT_STATUS=1 npx expo prebuild ...`

## Current Status

**Working on device (iOS):**
- Fuel logging with currency selection, mileage, fuel amount, cost
- Real-time efficiency calculation
- Fuel history with filters and stats
- Settings (currency, unit, car reset)
- Camera capture for odometer and pump meter (in-memory only, never saved to disk)
- OCR: mileage extraction from odometer photos (letter-to-digit coercion, confidence filtering, smart ranking by last mileage)
- OCR: fuel amount and cost extraction from pump meter photos (volume/currency regex, fallback heuristics)
- Multi-candidate picker when OCR detects multiple values

**See [ROADMAP.md](ROADMAP.md) for full task tracking and next steps.**
