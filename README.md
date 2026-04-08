# dont-forget-oil

Mobile app to track fuel consumption and vehicle maintenance. Privacy-first, offline-only, photo-based fuel logging with OCR.

## Documentation

- **[PROJECT_IDEA.md](PROJECT_IDEA.md)** — Vision and three-phase scope
- **[REQUIREMENTS.md](REQUIREMENTS.md)** — MVP and future features
- **[TECH_STACK.md](TECH_STACK.md)** — Technical approach and architecture
- **[CLAUDE.md](CLAUDE.md)** — Developer guidance for Claude Code

## Getting Started

### Prerequisites

- **Node.js** v18+ (check with `node --version`)
- **npm** or **yarn** for package management
- **iOS Simulator** (on macOS) or **Android Emulator** (or physical device)

### Setup

1. **Install dependencies**:
   ```bash
   cd app
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run ios
   ```

   This launches the iOS Simulator with the app running.

### Development Commands

- **Run on iOS Simulator**:
  ```bash
  npm run ios
  ```

- **Run on Android Emulator**:
  ```bash
  npm run android
  ```

- **Run on web** (for testing, not production):
  ```bash
  npm run web
  ```

- **Start dev server** (if you want to manage the simulator separately):
  ```bash
  npx expo start
  ```
  Then press `i` for iOS or `a` for Android.

### Project Structure

```
dont-forget-oil/
├── app/                    # React Native/Expo app code
│   ├── app/               # Navigation and screens
│   ├── package.json       # Dependencies
│   └── app.json           # Expo configuration
├── PROJECT_IDEA.md        # Project vision and scope
├── REQUIREMENTS.md        # Feature specifications
├── TECH_STACK.md          # Technical decisions
├── CLAUDE.md              # Developer guidance
└── .gitignore             # Git exclusions
```

## Next Steps

1. **Verify setup**: Run `npm run ios` to test the development environment
2. **Explore the structure**: Code is in `app/app/` directory
3. **Start building**: Begin implementing Phase 1 features (fuel logging, photo capture)

See [CLAUDE.md](CLAUDE.md) for architecture details and coding patterns.
