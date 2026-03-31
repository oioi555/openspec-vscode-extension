## MODIFIED Requirements

### Requirement: Workspace root OpenSpec discovery
The extension SHALL treat the workspace-root `openspec/` directory as the only OpenSpec root for discovery, listing, refresh, and welcome-state selection.

#### Scenario: Workspace has openspec folder at root
- **WHEN** the workspace root contains `openspec/config.yaml`
- **THEN** the extension marks the workspace as initialized and populates the OpenSpec views

#### Scenario: Workspace has nested openspec examples
- **WHEN** the workspace contains nested folders that also include an `openspec/` directory (e.g. `testingproject/openspec/`)
- **THEN** the extension ignores those nested folders for initialization and file watching

#### Scenario: No workspace folder is open
- **WHEN** VS Code has no workspace folder available
- **THEN** the extension keeps the OpenSpec explorer in a welcome state
- **AND** it does not mark the workspace as initialized

#### Scenario: Workspace folder is open but root OpenSpec setup is missing
- **WHEN** the workspace root does not contain an OpenSpec setup
- **THEN** the extension keeps the OpenSpec explorer in a welcome state
- **AND** it does not mark the workspace as initialized
- **AND** it distinguishes this state from the no-folder case for welcome guidance purposes
