# OpenSpec Workspace

[![Version](https://img.shields.io/badge/version-0.1.0-2ea44f)](package.json)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![VS Code](https://img.shields.io/badge/vscode-%5E1.74.0-007ACC.svg)](https://code.visualstudio.com/)

![OpenSpec icon](media/icon.png)

OpenSpec Workspace is a VS Code extension for spec-driven development.

> Unofficial extension.

- Browse `openspec/changes/*` and `openspec/specs/*` from the Activity Bar
- Read `proposal.md`, `design.md`, and `tasks.md` in a focused details webview
- Copy OpenSpec change commands from the change context menu

## Workflow

1. Plan the change with your preferred assistant.
2. Create or update OpenSpec artifacts.
3. Use the change context menu to copy the OpenSpec command you want to run.
4. Run that command in your preferred assistant or terminal workflow.

## What you get

- OpenSpec Explorer tree: active changes, archived changes, and workspace specs
- Change details webview: renders artifacts and previews other files in a change folder
- Command-first actions: copy `/opsx:* <change-name>` commands directly from change items

## Prerequisites

- VS Code `^1.74.0`
- An OpenSpec-initialized workspace (or run `openspec init`)
- `openspec` available in your terminal

## Quickstart

1. Open a folder that contains `openspec/` at the workspace root.
2. Open the OpenSpec view from the Activity Bar.
3. Right-click a change in the explorer.
4. Copy the `/opsx:* <change-name>` command you want.
5. Run it in your preferred assistant.

## Help / troubleshooting

- Logs: VS Code Output panel -> `OpenSpec Extension`
- OpenSpec upstream: https://github.com/Fission-AI/OpenSpec

## Development

Install deps and build:

```bash
npm install
npm run compile
```

Package a VSIX:

```bash
npm run vscode:prepublish
npx vsce package
```

## Special Thanks

- Fork origin: https://github.com/AngDrew/openspec-vscode

More:

- Release notes: `CHANGELOG.md`
- Contributing: `CONTRIBUTING.md`
- License: `LICENSE`
