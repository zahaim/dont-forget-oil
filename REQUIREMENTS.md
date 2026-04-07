# Requirements

## MVP (Phase 1): Fuel Tracking

### Core Features
- **Photo-based data entry**
  - Take photo of car odometer (before refueling)
  - Take photo of fuel pump meter (after refueling)
  - Auto-extract numerical values (mileage, fuel amount, cost) from photos
  - Manual override option for values if OCR fails

- **Fuel log storage**
  - Record: date, mileage, fuel amount, cost, timestamp
  - Store in simple flat file format (CSV, JSON, or SQLite)
  - Delete photos after processing (no photo storage)

- **Basic calculations**
  - Fuel consumption rate (liters/km or gallons/mile)
  - Cost per unit fuel
  - Cost per km/mile driven

- **Data visualization**
  - List view of all refuel entries
  - Monthly fuel cost summary
  - Fuel price trend over time
  - Fuel efficiency trend (consumption per distance)

- **Data export/import**
  - Export data to shareable format (CSV, JSON)
  - Ability to import existing data
  - Data stored in location user controls (phone storage, cloud drive)

### User Experience
- Simple, clean UI
- Quick logging flow (take 2 photos → done)
- Visual feedback for successful data extraction
- Settings for units (metric/imperial)

## Phase 2: Maintenance Reminders

### Features
- **Maintenance database**
  - Predefined car makes/models with service intervals
  - OR manual entry of service tasks

- **Service task scheduling**
  - Oil change reminders (mileage-based or time-based)
  - Filter replacement (air, cabin, fuel)
  - General maintenance tasks: brakes, liquids (coolant, brake fluid), windshield wipers

- **Reminder system**
  - Push notifications when service due
  - Dashboard showing upcoming maintenance
  - Mark tasks as completed

### Data
- Store service history alongside fuel data
- Track what maintenance was done and when

## Phase 3: Seasonal Reminders

### Features
- Winter/summer tire change notifications
- Configurable dates or mileage thresholds
- Seasonal maintenance checklist suggestions

## Non-Functional Requirements

### Privacy & Security
- ✓ No personal data stored (name, location, license plate, etc.)
- ✓ Photos deleted immediately after OCR processing
- ✓ All data stored locally
- ✓ No cloud sync (user chooses storage location)
- ✓ No analytics or telemetry
- ✓ Open-source code for transparency

### Data Storage
- Simple file format (human-readable)
- Single database file or flat files
- User can inspect/edit data manually if needed
- Compatible with cloud drives (Google Drive, Dropbox, OneDrive, etc.)

### Platform
- Mobile app (iOS and/or Android)
- Works offline
- Lightweight (minimal storage footprint)

## Out of Scope (for now)
- Cloud sync or multi-device sync
- Fuel price comparison or external data integration
- Social features or sharing
- Commercial functionality
