# TODO - DataCaptureApp fixes

## Build pipeline & EAS
- [ ] Exclude unnecessary files from `.easignore` to reduce archive size (currently ~448MB) and resolve EAS upload metadata 400.
- [x] Fix Android EAS build “Bundle JavaScript build phase” by disabling `nativewind/babel` in `babel.config.js`.

## Functional capture/import/analyze/export (items 2–13)
### Persistence-first wiring
- [x] Implement real SQLite persistence in `src/services/DatabaseService.ts`.
- [ ] Update `app/review/index.tsx` to load detected sources from `DatabaseService.fetchActiveItems()` instead of mock data.



### Capture flows (after persistence)
- [ ] Implement real camera capture + OCR pipeline in `app/capture/camera.tsx` (CameraView snapshot + AIEngineService.extractText).
- [ ] Implement real file import in `app/capture/file.tsx` using `expo-document-picker` and parse CSV/JSON/PDF.
- [ ] Implement real URL extraction in `app/capture/url.tsx` via network fetch + parse.

### Review UI correctness
- [ ] Wire file/url/camera extracted items into review “Detected Sources”.
- [ ] Replace drag/drop mock behavior in `app/review/index.tsx` with real drag-drop or at least working reorder interactions.
- [ ] Implement real widget mapping state persistence (so export uses selected widgets).

### Export/save/open
- [ ] Implement real artifact generation + save/share in `src/services/ExportService.ts` using Expo file APIs.

## Testing
- [ ] Run `npm test` and `npm run lint`.
- [ ] Run a local EAS android build simulation after persistence changes.

