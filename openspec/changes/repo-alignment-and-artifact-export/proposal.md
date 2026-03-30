## Summary

Align this extension with an independent OpenSpec-focused direction.

The change removes OpenCode-specific runtime assumptions and UI controls, keeps artifact browsing intact, and adds change-level command copy actions based on canonical `/opsx:<step> <change-name>` snippets.

## Goals

- Present the extension as an independent package
- Remove OpenCode-specific commands, runner wiring, server assumptions, and related assets
- Expose change context menu actions for OpenSpec commands that take `[change-name]`
- Keep the details view useful for browsing proposal/design/tasks/spec artifacts

## Non-Goals

- Do not hard-code one assistant's command syntax beyond the current canonical `/opsx:<step> <change-name>` form
- Do not enforce workflow timing for when a copied command should be used
- Do not add assistant-specific execution controls back into the UI

## Affected Areas

- `package.json`
- `src/extension/commands.ts`
- `src/providers/explorerProvider.ts`
- `src/providers/webviewProvider.ts`
- `src/utils/changeCommandSnippet.ts`
- `README.md`, `CHANGELOG.md`, tests, and related media assets
