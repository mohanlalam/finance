# Tasks: Biometric Unlock Implementation

- [x] **Phase 1: Security & WebAuthn Utilities**
  - [x] 1.1 Create `src/utils/biometrics.ts` (hardware detection, WebAuthn create/get credentials, vault storage)
  - [x] 1.2 Update `src/utils/auth.ts` to sync biometric state during PIN changes/resets
- [x] **Phase 2: UI & Lock Screen Integration**
  - [x] 2.1 Add `Fingerprint` and `ScanFace` icons to `src/components/icons/AppIcons.tsx`
  - [x] 2.2 Update `src/components/PinLockScreen.tsx` with biometric keypad button & auto-prompt flow
  - [x] 2.3 Add Biometric toggle switch in `src/components/ChangePinModal.tsx`
- [x] **Phase 3: Verification & Git Sync**
  - [x] 3.1 Run `npx tsc --noEmit`
  - [x] 3.2 Run `npm test` (15/15 test suites, 89/89 tests passed)
  - [x] 3.3 Run `npm run build` (PWA generated cleanly)
  - [x] 3.4 Commit and push to `origin/main`
