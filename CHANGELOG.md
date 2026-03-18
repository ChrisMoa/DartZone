# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-03-18

### Added
- Interactive SVG dartboard with click detection (Single, Double, Triple, Bull, Bullseye)
- Game scoring engine with turn management, undo, bust detection
- Checkout route calculator with suggested finishes
- Club management (CRUD, crest upload as BLOB in SQLite)
- Player management with club assignment
- Tournament management with status lifecycle (planned, running, finished, aborted)
- Tournament formats: Round Robin and Knockout with auto-generated match pairings
- League table with live standings
- Match scheduling and result tracking
- GSAP-powered animations for special hits (Bullseye, T20, 180, Checkout)
- Custom animation uploads (GIF, WebP, MP4, WebM, Lottie)
- Player and club statistics with averages and checkout percentages
- Dartboard heatmap overlay
- Excel import for clubs and players
- Database backup and restore (SQLite export/import)
- In-app feedback page (creates GitHub issues)
- Settings page with theme customization, color presets, animation toggles
- Dark/light mode toggle
- Responsive design with DaisyUI components
- SQLite persistence with repository pattern
- Versioning system with build date display
