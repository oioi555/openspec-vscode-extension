## 1. Repository Identity Alignment

- [x] 1.1 Replace old repository URLs, badges, and package metadata with the independent package identity.
- [x] 1.2 Update README, welcome text, and other user-facing copy to match the new package direction.

## 2. Tool-Agnostic Cleanup

- [x] 2.1 Remove OpenCode-specific commands, runtime state, server probes, and webview controls.
- [x] 2.2 Remove bundled OpenCode-specific assets, runner files, and tests.
- [x] 2.3 Update docs and UI copy so the extension no longer assumes `opencode` or `localhost:4099`.

## 3. Change Command Context Menu

- [x] 3.1 Add a shared formatter that builds canonical `/opsx:<step> <change-name>` snippets.
- [x] 3.2 Add change tree item context menu entries that copy the supported OpenSpec commands requiring `[change-name]`.
- [x] 3.3 Keep tree navigation and artifact browsing intact while moving command actions to the context menu.
- [x] 3.4 Add a context menu action that copies only the change name.

## 4. Workflow Alignment

- [x] 4.1 Align the copied command list with the OpenSpec commands documentation for existing changes.
- [x] 4.2 Keep the copied syntax canonical for now and avoid hard-coding one assistant's command style.

## 5. Verification

- [x] 5.1 Add or update tests for change command snippet formatting and command registration.
- [x] 5.2 Run compile, lint, and tests.
