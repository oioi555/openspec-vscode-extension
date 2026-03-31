## Context

The extension currently contributes a dedicated `openspecWorkspaceWelcome` view plus a `viewsWelcome` entry, but the registered tree provider returns a placeholder item (`OpenSpec workspace not detected`) when the workspace is missing or uninitialized. According to VS Code's `viewsWelcome` behavior, welcome content only renders when the view is empty, so returning a placeholder item works against the intended setup guidance.

There are two distinct user states that need different guidance:

1. **No folder selected**: the user needs a lightweight explanation and a link to OpenSpec so they can understand what to set up.
2. **Folder selected but not initialized**: the user already has a workspace open and should be prompted to run `openspec init` as the primary next step.

## Goals / Non-Goals

**Goals:**
- Ensure `viewsWelcome` content actually renders in the welcome view.
- Distinguish "no workspace folder" from "workspace open but OpenSpec not initialized".
- Keep the upstream OpenSpec repository link visible as setup guidance.
- Make the init action easier to understand and more context-specific.

**Non-Goals:**
- Do not change initialized explorer behavior.
- Do not change root-only OpenSpec discovery semantics.
- Do not add a custom webview-based onboarding flow.

## Decisions

- Use `viewsWelcome` as the canonical welcome surface and stop returning a placeholder tree item for the welcome view state.
  - Rationale: this matches VS Code's native empty-view onboarding model and avoids duplicating guidance in tree items.
- Introduce explicit context keys for welcome-state rendering, at minimum separating:
  - no workspace folder available
  - workspace folder available but not initialized
  - initialized
  - Rationale: `openspecWorkspace:initialized` alone cannot distinguish the first two states.
- Keep the upstream link as a markdown link and put the `Initialize OpenSpec` command on its own line so it renders as a button when applicable.
  - Rationale: the button becomes more visually obvious without inventing a custom UI.
- Refresh the context keys both on activation and when filesystem/workspace state changes.
  - Rationale: the welcome content should react when the user opens a folder or creates/removes `openspec/`.

## Risks / Trade-offs

- **More context keys to manage** → Centralize updates in one helper so activation, refresh, and workspace changes stay consistent.
- **No-folder state may be harder to test manually in normal repos** → Add explicit tests around the provider/context update path.
- **Welcome copy can grow noisy** → Keep the content short: one learn-more link, one init action only where it is relevant.

## Migration Plan

- No migration required for users.
- After shipping, users in uninitialized states should see the updated welcome copy automatically on next activation/refresh.

## Implementation Note

- The welcome view init action now tries to advance the interactive `openspec init` terminal flow automatically.
- If terminal timing or shell behavior causes this flow to misbehave again in the future, the fallback is to ask the user to run `openspec init` manually in the terminal.

## Open Questions

- None.
