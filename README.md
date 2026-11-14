# ShuttleIQ

AI-powered badminton umpire and match analytics platform.

## Status

Phase 1 foundation: dashboard shell, Live Court camera preview with permission handling and camera selection, and court setup. AI umpiring, court calibration, and analytics are planned and not yet active.

## Structure

- `app/` - routes (Overview, Live Court, Analytics, Match History, Settings) and global styles
- `components/layout/` - dashboard shell and responsive sidebar
- `components/live-court/` - court setup, camera preview, and system status
- `components/ui/` - shared presentational pieces
- `lib/camera/` - browser camera access and error mapping
- `lib/court-config.ts`, `lib/features.ts`, `lib/navigation.ts` - configuration and feature status

A Python FastAPI computer-vision service can be added later as a separate `backend/` directory, with the browser calling it through a small client module in `lib/`.
