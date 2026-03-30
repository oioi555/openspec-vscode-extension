## Purpose
Define requirements for rendering OpenSpec change artifacts in the VS Code change-details view.

## Requirements

### Requirement: Change details renders artifacts
The change-details view SHALL render the following artifacts when they exist in `openspec/changes/<change>/`:

- `proposal.md`
- `design.md`
- `tasks.md`
- each `specs/*/spec.md`

#### Scenario: Artifacts exist
- **WHEN** any of the supported artifact files exist for the selected change
- **THEN** the view shows sections for each existing artifact and allows opening the underlying files

### Requirement: Empty state guidance
The change-details view SHALL show a neutral empty state when a change exists but has no artifacts.

#### Scenario: No artifacts exist
- **WHEN** `proposal.md`, `design.md`, `tasks.md`, and `specs/*/spec.md` are all missing
- **THEN** the view shows guidance to use OpenSpec commands without referencing a specific assistant runtime
