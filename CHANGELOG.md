# Changelog

All notable changes to OpenSpec Workspace will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-03-30

### Added
- Initial independent baseline for the extension.
- Explorer and details view for workspace-root OpenSpec content.
- Change context menu actions that copy canonical `/opsx:* <change-name>` commands.

### Removed
- Legacy OpenCode-specific controls, runtime assumptions, bundled runner files, and related tests.
- Historical OpenSpec change artifacts that no longer describe the trimmed baseline.

## [1.0.0] - 2026-04-01

### Changed
- Finalized the simplified, general-purpose OpenSpec Workspace baseline as the intended long-term shape of the extension.
- Clarified welcome guidance for no-folder and uninitialized-workspace states while preserving root-only OpenSpec discovery.
- Hardened the welcome init action with a shared terminal flow and a manual fallback note for interactive terminal edge cases.

### Added
- Main specs for welcome setup guidance and welcome-state-aware root discovery behavior.
- Command-path and watcher coverage for welcome onboarding and interactive init handling.
