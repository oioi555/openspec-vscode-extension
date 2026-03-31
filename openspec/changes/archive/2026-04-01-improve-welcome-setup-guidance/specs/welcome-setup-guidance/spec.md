## ADDED Requirements

### Requirement: Welcome view shows setup guidance when no workspace is available
The extension SHALL render native welcome guidance for the OpenSpec activity view when no workspace folder is open.

#### Scenario: No folder is selected
- **WHEN** VS Code has no workspace folder for the extension to inspect
- **THEN** the `openspecWorkspaceWelcome` view renders `viewsWelcome` content instead of a placeholder tree item
- **AND** the content includes a link to `https://github.com/Fission-AI/OpenSpec`
- **AND** the content does not show an `Initialize OpenSpec` action

### Requirement: Welcome view promotes init only for uninitialized workspaces
The extension SHALL show the init action only when a workspace folder exists but the workspace-root OpenSpec setup is missing.

#### Scenario: Workspace is open but not initialized
- **WHEN** a workspace folder is open and the workspace root does not contain an OpenSpec setup
- **THEN** the `openspecWorkspaceWelcome` view renders `viewsWelcome` content instead of a placeholder tree item
- **AND** the content includes a visible `Initialize OpenSpec` action
- **AND** the content also includes a link to `https://github.com/Fission-AI/OpenSpec`
