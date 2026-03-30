## Overview

This change has three parts:

1. Reposition the extension as an independent OpenSpec package
2. Remove OpenCode-specific UX and runtime assumptions
3. Replace execution-oriented change actions with clipboard-based OpenSpec command actions

## Repository Alignment

- Update package metadata, links, icon references, and user-facing copy for the independent package
- Reset changelog/versioning for the new baseline
- Keep attribution in documentation while avoiding any implication of official OpenSpec endorsement

## Tool-Agnostic Command Copy

- Add a shared formatter that returns canonical `/opsx:<step> <change-name>` snippets
- Register one command per supported change-level OpenSpec action
- Add a dedicated command for copying only the change name
- Surface these actions from the change tree item's context menu

Supported copied commands:

- `/opsx:propose <change-name>`
- `/opsx:apply <change-name>`
- `/opsx:archive <change-name>`
- `/opsx:continue <change-name>`
- `/opsx:ff <change-name>`
- `/opsx:verify <change-name>`
- `/opsx:sync <change-name>`

## Removal of OpenCode-Specific Behavior

- Remove server status controls, attach flows, local port assumptions, and runner integration
- Remove OpenCode-specific commands, assets, tests, and helper files
- Keep the details view focused on reading artifacts and opening files

## Details View Behavior

- Existing artifacts remain readable in the details view
- When no artifacts exist, show neutral guidance instead of assistant-specific controls
- Change selection stays separate from command execution; the context menu is the command surface

## Syntax Assumption

OpenSpec command syntax differs by tool in upstream docs, but this change intentionally copies the canonical `/opsx:<step> <change-name>` form for now.
