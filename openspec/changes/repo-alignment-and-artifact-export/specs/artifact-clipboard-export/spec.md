## ADDED Requirements

### Requirement: Change command copy actions
The extension SHALL copy canonical OpenSpec commands for an existing change to the clipboard.

#### Scenario: Copy from a change context menu
- **WHEN** the user invokes copy on a change tree item command entry
- **THEN** the clipboard receives plain text in the form `/opsx:<step> <change-name>`

### Requirement: Change name copy action
The extension SHALL provide a change context menu action that copies only the selected change name.

#### Scenario: Copy selected change name
- **WHEN** the user invokes the change-name copy action on a change tree item
- **THEN** the clipboard receives plain text containing only `<change-name>`

### Requirement: No markdown dump
The copied snippet SHALL NOT require copying artifact markdown or runtime-specific terminal commands.

### Requirement: Tool-agnostic export format
The copied snippet SHALL use plain text and SHALL remain readable in supported OpenSpec tool workflows.

### Requirement: Copy failure is reported
If the clipboard write fails, the extension SHALL report the failure and SHALL NOT claim success.
