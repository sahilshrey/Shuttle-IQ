# ShuttleIQ

AI-powered badminton umpire and match analytics platform.

## Status

The dashboard includes Live Court camera setup, Live AI Court with a fixed side-view camera, transparent singles/doubles overlay and session-only four-point visual calibration, and an interactive Virtual Court with official court dimensions and an explicitly simulated demo match. Live AI Court calibration is a manual visual projection and does not verify physical court accuracy. Player/shuttle detection and AI umpiring are not connected; no detections or official calls are fabricated. Virtual Court data is generated for demonstration only and is not real match data.

## Structure

- `app/` - routes (Overview, Live Court, Live AI Court, Virtual Court, Analytics, Match History, Settings) and global styles
- `components/layout/` - dashboard shell and responsive sidebar
- `components/live-court/` - court setup, camera preview, and system status
- `components/live-ai-court/` - fixed-camera live view, overlay calibration, and AI connection statuses
- `components/virtual-court/` - interactive digital court and simulated match
- `components/ui/` - shared presentational pieces
- `lib/camera/` - browser camera access and error mapping
- `lib/calibration/` and `lib/ai/` - perspective mapping and modular tracking provider contracts
- `lib/court-config.ts`, `lib/features.ts`, `lib/navigation.ts` - configuration and feature status

A Python FastAPI computer-vision service can be added later as a separate `backend/` directory, with the browser calling it through a small client module in `lib/`.
