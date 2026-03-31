## 1. Welcome state modeling

- [x] 1.1 Add context handling that distinguishes no-workspace, uninitialized-workspace, and initialized states for the OpenSpec views.
- [x] 1.2 Update activation/refresh flows so welcome-state context keys are recomputed when workspace folders or OpenSpec files change.

## 2. Welcome content behavior

- [x] 2.1 Remove the placeholder welcome tree item behavior that prevents `viewsWelcome` from rendering.
- [x] 2.2 Update `package.json` welcome contributions so no-folder and uninitialized-workspace states show distinct guidance, both linking to `https://github.com/Fission-AI/OpenSpec`, with the init action shown only for the uninitialized-workspace state.

## 3. Verification

- [x] 3.1 Add or update tests for the welcome-state logic and rendered empty-view conditions.
- [x] 3.2 Verify the welcome view shows the intended guidance in both no-folder and uninitialized-workspace scenarios without affecting initialized explorer behavior.
