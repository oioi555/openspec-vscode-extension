## Why

The current welcome experience is hard to understand because the tree provider returns a placeholder item, which can suppress `viewsWelcome` content and leave setup guidance less visible than intended. Users who have not opened a folder, or who opened a folder that has not been initialized for OpenSpec yet, need clearer guidance that distinguishes learning about OpenSpec from running `openspec init`.

## What Changes

- Make the uninitialized experience rely on real `viewsWelcome` content instead of a placeholder tree item.
- Show distinct setup guidance for two cases: no folder selected and workspace selected but not yet initialized for OpenSpec.
- Keep a direct link to the upstream OpenSpec repository as the learn-more path.
- Present the init action as the primary next step only when a workspace is open but the root `openspec/` folder is missing.

## Capabilities

### New Capabilities
- `welcome-setup-guidance`: Defines how the extension presents welcome/setup guidance when no OpenSpec workspace is available yet.

### Modified Capabilities
- `root-openspec-discovery`: Clarify how no-folder and uninitialized-workspace states map to the visible explorer experience.

## Impact

- `package.json`
- `src/extension.ts`
- `src/extension/watcher.ts`
- `src/providers/explorerProvider.ts`
- any new helper/state logic needed for welcome context keys
- related tests for welcome-state rendering and context updates
