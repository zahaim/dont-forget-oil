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

**Start here when picking up the project**: Read PROJECT_IDEA.md first for context, then REQUIREMENTS.md to understand what needs to be built.

## Development Stack (To Be Determined)

See [TECH_STACK.md](TECH_STACK.md) for technical approach recommendations.

**Decision pending**: React Native/Expo vs Flutter as the primary platform.

## Getting Started

### Prerequisites
*(Will be filled in once tech stack is chosen)*

### Setup
*(Will be filled in once development environment is configured)*

### Development Commands
*(Will be added once project is initialized)*

## Architecture

*(Will be documented as code structure emerges)*

The app will follow clean architecture with feature-based folder structure. See TECH_STACK.md for architectural recommendations.

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
- Recommended: Google ML Kit (on-device, offline, privacy-friendly)
- Fallback: Manual data entry if photo extraction fails
- Avoid cloud-based OCR APIs (privacy violation)

## Next Steps

1. **Choose tech stack**: React Native/Expo or Flutter?
2. **Initialize project**: Create repo structure and basic setup
3. **Build MVP**: Fuel logging with photo-based data entry
4. **Add visualization**: Basic reports and trends
5. **Test thoroughly**: Privacy and data handling verification
