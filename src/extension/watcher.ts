import * as vscode from 'vscode';

import { ErrorHandler } from '../utils/errorHandler';
import { WorkspaceUtils } from '../utils/workspace';
import { ExtensionRuntimeState } from './runtime';

export function registerOpenSpecWatcher(
  context: vscode.ExtensionContext,
  runtime: ExtensionRuntimeState
): void {
  if (runtime.fileWatcher) {
    runtime.fileWatcher.dispose();
    runtime.fileWatcher = undefined;
  }

  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    ErrorHandler.warning('No workspace folder found', false);
    return;
  }

  const workspaceFolder = workspaceFolders[0];
  // Only watch the workspace-root openspec folder.
  // This avoids accidentally binding to nested examples (e.g. testingproject/openspec).
  const openspecGlob = new vscode.RelativePattern(workspaceFolder, 'openspec/**');

  try {
    runtime.fileWatcher = vscode.workspace.createFileSystemWatcher(openspecGlob);

    runtime.fileWatcher.onDidCreate(() => {
      debounce(runtime, () => {
        WorkspaceUtils.invalidateCache();
        checkWorkspaceInitialization(runtime);
      }, 500);
    });

    runtime.fileWatcher.onDidChange(() => {
      debounce(runtime, () => {
        WorkspaceUtils.invalidateCache();
        checkWorkspaceInitialization(runtime);
      }, 500);
    });

    runtime.fileWatcher.onDidDelete(() => {
      debounce(runtime, () => {
        WorkspaceUtils.invalidateCache();
        checkWorkspaceInitialization(runtime);
      }, 500);
    });

    context.subscriptions.push(runtime.fileWatcher);
    ErrorHandler.info('File system watcher initialized', false);
  } catch (error) {
    ErrorHandler.handle(error as Error, 'Failed to setup file system watcher');
  }
}

function updateWelcomeStateContext(
  runtime: ExtensionRuntimeState,
  hasWorkspaceFolder: boolean,
  isInitialized: boolean
): Promise<void> {
  const isUninitializedWorkspace = hasWorkspaceFolder && !isInitialized;

  return Promise.all([
    vscode.commands.executeCommand('setContext', 'openspecWorkspace:hasWorkspaceFolder', hasWorkspaceFolder),
    vscode.commands.executeCommand('setContext', 'openspecWorkspace:initialized', isInitialized),
    vscode.commands.executeCommand('setContext', 'openspecWorkspace:uninitialized', isUninitializedWorkspace)
  ])
    .then(() => {
      runtime.explorerProvider?.refresh();
      runtime.cliToolsProvider?.refresh();
      ErrorHandler.info(
        `Workspace welcome state updated: hasWorkspaceFolder=${hasWorkspaceFolder}, initialized=${isInitialized}`,
        false
      );
    });
}

export function checkWorkspaceInitialization(runtime: ExtensionRuntimeState): void {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    updateWelcomeStateContext(runtime, false, false)
      .catch(error => {
        ErrorHandler.handle(error as Error, 'Failed to update welcome state for missing workspace');
      });

    ErrorHandler.warning('No workspace folder found', false);
    return;
  }

  const workspaceFolder = workspaceFolders[0];

  WorkspaceUtils.isOpenSpecInitialized(workspaceFolder)
    .then(isInitialized => {
      return updateWelcomeStateContext(runtime, true, isInitialized);
    })
    .catch(error => {
      ErrorHandler.handle(error as Error, 'Failed to check workspace initialization');
    });
}

export function debounce(
  runtime: ExtensionRuntimeState,
  func: () => void,
  delay: number,
  key: string = 'default'
): void {
  if (runtime.debounceMap.has(key)) {
    clearTimeout(runtime.debounceMap.get(key)!);
  }

  const timeout = setTimeout(func, delay);
  runtime.debounceMap.set(key, timeout);
}
