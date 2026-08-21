# Tasks: Biometric Login & iOS PWA Auto-Update Hardening

- [x] **Phase 1: Biometric Authentication Hardening**
  - [x] 1.1 Update `src/utils/biometrics.ts` to prevent deleting credentials on transient errors and broaden transport matching
  - [x] 1.2 Update `src/components/PinLockScreen.tsx` to handle direct user gesture tap and safe auto-prompt
  - [x] 1.3 Update `src/components/ChangePinModal.tsx` for seamless biometric enrollment
- [x] **Phase 2: iOS PWA Auto-Update Fix**
  - [x] 2.1 Update `src/main.tsx` to fix the `controllerchange` update handler and listen for app focus/resume
  - [x] 2.2 Add cache-control meta tags to `index.html`
  - [x] 2.3 Verify `vite.config.ts` Workbox PWA caching configuration
- [x] **Phase 3: Verification & Quality Assurance**
  - [x] 3.1 Update and run unit tests (`npm test` — 15/15 test files, 90/90 tests passed)
  - [x] 3.2 Run TypeScript verification (`npm run typecheck` — 0 errors)
  - [x] 3.3 Run production build (`npm run build` — PWA generated cleanly)
