import * as vscode from 'vscode';

import { OpenSpecCliToolsProvider } from './providers/cliToolsProvider';
import { OpenSpecExplorerProvider } from './providers/explorerProvider';
import { OpenSpecWebviewProvider } from './providers/webviewProvider';
import {
  isOpenSpecConfigurationChange,
  updateOpenSpecConfigurationContext
} from './utils/config';
import { ErrorHandler } from './utils/errorHandler';
import { CacheManager } from './utils/cache';
import { WorkspaceUtils } from './utils/workspace';

import { activateExtension } from './extension/activate';
import { deactivateExtension } from './extension/deactivate';
import { registerCommands } from './extension/commands';
import { checkWorkspaceInitialization, registerOpenSpecWatcher } from './extension/watcher';
import { ExtensionRuntimeState } from './extension/runtime';

let runtime: ExtensionRuntimeState | undefined;

export function activate(context: vscode.ExtensionContext) {
  // Initialize error handling and cache
  ErrorHandler.initialize();

  runtime = activateExtension(context);
  runtime.cacheManager = CacheManager.getInstance();

  // Register the tree data provider
  runtime.explorerProvider = new OpenSpecExplorerProvider();
  runtime.cliToolsProvider = new OpenSpecCliToolsProvider();
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('openspecWorkspaceExplorer', runtime.explorerProvider),
    vscode.window.registerTreeDataProvider('openspecWorkspaceCliTools', runtime.cliToolsProvider),
    vscode.window.registerTreeDataProvider('openspecWorkspaceWelcome', runtime.explorerProvider)
  );

  // Register the webview provider
  runtime.webviewProvider = new OpenSpecWebviewProvider(context.extensionUri);

  // Register commands
  registerCommands(context, runtime);

  const refreshConfigurationContext = () => {
    updateOpenSpecConfigurationContext()
      .catch(error => {
        ErrorHandler.handle(error as Error, 'updating OpenSpec configuration context', false);
      });
  };

  refreshConfigurationContext();

  const refreshWorkspaceState = () => {
    WorkspaceUtils.invalidateCache();
    registerOpenSpecWatcher(context, runtime!);
    checkWorkspaceInitialization(runtime!);
  };

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(event => {
      if (isOpenSpecConfigurationChange(event)) {
        refreshConfigurationContext();
      }
    }),
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      refreshWorkspaceState();
    })
  );

  refreshWorkspaceState();

  // Log activation success
  ErrorHandler.info('Extension activated successfully', false);
}

export function deactivate() {
  deactivateExtension(runtime);
}
