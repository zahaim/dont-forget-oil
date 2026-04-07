# Tech Stack & Technical Approach

## Platform Decision

**Recommended: React Native or Flutter**

For an MVP, cross-platform is ideal because:
- One codebase for iOS + Android
- Lower maintenance burden
- Faster time to MVP

**Alternatively: Native** (iOS or Android first)
- Better performance if OCR is demanding
- Full platform capabilities
- More development time per platform

## Core Technical Components

### Photo Processing & OCR

**Challenge**: Extract numbers from photos reliably

**Options:**
1. **ML Kit (Google)** - Free, on-device, fast
   - Works offline ✓
   - Privacy-friendly ✓
   - Available for React Native/Flutter
   - Decent accuracy for numbers

2. **Tesseract OCR** - Open-source, on-device
   - Free ✓
   - Offline ✓
   - Less accurate than ML Kit
   - Slower processing

3. **Cloud API** (Google Vision, Azure Computer Vision)
   - Better accuracy
   - ✗ Requires internet
   - ✗ Privacy concern (sends photos to cloud)
   - ✗ Potential costs

**Recommendation**: Start with ML Kit for speed and privacy. Fall back to manual entry if extraction fails.

### Data Storage

**Option 1: SQLite + JSON Export** (Recommended)
- Single `.db` file users can back up
- Fast local queries
- Export to CSV/JSON for sharing
- Good balance of simplicity and functionality
- Works well with cloud drive syncing

**Option 2: Plain JSON/CSV**
- Completely human-readable
- Can edit manually in text editor
- Simpler initially, harder to scale
- No query performance

**Recommendation**: SQLite + export capability. Users get a single file they can backup anywhere.

### File Structure

```
app-data/
├── fuel_tracker.db (SQLite database)
├── exports/
│   ├── fuel_log_2026.csv
│   └── maintenance_log_2026.json
└── backups/
    └── fuel_tracker_backup_2026-04-07.db
```

Users can sync the entire `app-data/` directory to their cloud drive.

## Stack Options

### Option A: React Native + Expo
**Pros:**
- Fast development
- One codebase for iOS/Android
- Good UI libraries
- Community support

**Cons:**
- Limited native API access (can eject if needed)
- Performance for intensive OCR

**Use case**: Best for MVP

### Option B: Flutter
**Pros:**
- Excellent performance
- Beautiful UI by default
- Strong type safety (Dart)
- Good native integrations

**Cons:**
- Smaller community than React Native
- Dart learning curve

**Use case**: Good alternative to React Native

### Option C: Native (Swift + Kotlin)
**Pros:**
- Best performance
- Full platform capabilities
- No compatibility issues

**Cons:**
- Two codebases to maintain
- Slower initial development

**Use case**: If you want iOS-only MVP first, or performance is critical

## Architecture Pattern

**Recommended: Clean Architecture / Feature-based**

```
lib/
├── features/
│   ├── fuel_logging/
│   │   ├── presentation/
│   │   ├── domain/
│   │   └── data/
│   ├── maintenance/
│   └── reports/
├── core/
│   ├── database/
│   ├── ocr/
│   └── storage/
└── main.dart
```

This keeps concerns separated and makes testing/scaling easier.

## Privacy & Security Implementation

- **No permissions** required except Camera and File Storage
- **Photo handling**: Load → OCR → Delete (never save to disk)
- **Data storage**: Entirely on device
- **Encryption**: Optional SQLite encryption (if sensitive)
- **No analytics**: Remove any telemetry libraries

## Development Workflow

1. **Local development**: Emulator/simulator
2. **Testing**: Unit + integration tests
3. **Build**: GitHub Actions for releases
4. **Distribution**: GitHub Releases (APK/IPA files)

## Dependencies to Consider

- **Camera**: `camera` package (React Native) or `camera` plugin (Flutter)
- **ML Kit**: `@react-native-ml-kit/text-recognition` or `google_ml_kit`
- **Database**: `sqlite3` wrapper
- **State Management**: Provider, Riverpod, or Bloc
- **UI**: Material 3 components

## Future Considerations

- Internationalization (i18n) for multi-language support
- Background notifications for maintenance reminders
- Widget/shortcut for quick logging
- Desktop/web export tool (optional)

## Decision Needed

**Start with React Native/Expo or Flutter?** This depends on:
- Your familiarity with JavaScript/TypeScript vs Dart
- Priority on development speed vs performance
- iOS vs Android first?
