# Roadmap

Statuses: ✅ Done · 🚧 In Progress · 📋 Planned · 💡 Idea

---

## Phase 1 — Fuel Tracking (MVP)

### Core App Shell
- ✅ Expo Router + Stack + Tabs navigation
- ✅ Dark theme UI
- ✅ First-run setup screen (car name, mileage unit, default currency)
- ✅ Zustand state management with AsyncStorage persistence
- 📋 Color mode: dark / light / system (currently dark-only)

### Fuel Logging
- ✅ Manual entry: mileage, fuel amount, cost
- ✅ Currency picker with "make default" option
- ✅ Real-time fuel efficiency preview while typing
- ✅ Mileage validation (cannot be lower than last entry)
- ✅ Camera capture for odometer and pump meter photos (in-memory, never saved to disk)
- 🚧 OCR: extract mileage from odometer photo (ML Kit, on-device)
- 🚧 OCR: extract fuel amount and cost from pump meter photo (ML Kit, on-device)
- 📋 After OCR fill, all fields remain manually editable (always-edit fallback)
- 📋 Edit existing fuel entries (mileage overlap validation against neighbours)

### History & Stats
- ✅ Fuel history list with filters
- ✅ Basic stats (monthly cost summary, efficiency per entry)
- 📋 Fuel price trend chart (price per liter/gallon over time)
- 📋 Fuel efficiency trend chart (consumption per distance over time)

### Settings
- ✅ Distance unit (km / miles)
- ✅ Reset car / clear data
- 📋 Fuel volume unit (liters / gallons) — currently hardcoded to liters
- 📋 Remove default currency from Settings — manage it from the log screen only (reduce clutter)

### Data Portability
- 📋 Export fuel log to CSV
- 📋 Export fuel log to JSON
- 📋 Import from CSV/JSON backup

### Design & UX
- 📋 Design overhaul: big photo-capture button as primary CTA, round edges, cohesive color palette, nicer icons
- 📋 App icon and splash screen (AI-generated or open-source artwork)
- 📋 Simple user-facing how-to doc / onboarding guide

---

## Phase 2 — Maintenance Reminders

- 📋 Service reminder: distance-based (e.g. oil change every 10,000 km)
- 📋 Service reminder: time-based (e.g. every 12 months)
- 📋 Service reminder: whichever comes first (distance or time)
- 📋 Manual maintenance task entry (task name, interval)
- 📋 Service history log (what was done, when, at what mileage)
- 📋 Dashboard: upcoming maintenance summary
- 📋 Push notifications when service is due
- 📋 Mark tasks as completed
- 📋 Predefined common tasks: oil change, air filter, cabin filter, brakes, coolant, brake fluid, wipers

---

## Phase 3 — Seasonal Reminders

- 📋 Winter / summer tire change notifications (configurable by date or mileage)
- 📋 Seasonal maintenance checklist

---

## Distribution & Monetization

- 💡 App Store submission — once camera + OCR is proven working on device
- 💡 App Store Search Ads — promote after launch
- 💡 In-app ads — evaluate only after core UX is solid; must not compromise privacy-first principle

---

## Engineering & Quality

- 💡 GitHub Actions CI pipeline — explore what makes sense for React Native / Expo:
  - TypeScript type-check
  - ESLint
  - Unit tests (Jest)
  - Expo build validation (EAS Build or local prebuild check)

---

## Out of Scope

- Cloud sync or multi-device sync
- Fuel price comparison or external price data
- Social features or sharing
- Any cloud-based OCR (privacy violation)
