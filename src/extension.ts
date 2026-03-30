import * as vscode from 'vscode';

import { OpenSpecExplorerProvider } from './providers/explorerProvider';
import { OpenSpecWebviewProvider } from './providers/webviewProvider';
import { ErrorHandler } from './utils/errorHandler';
import { CacheManager } from './utils/cache';

import { activateExtension } from './extension/activate';
import { deactivateExtension } from './extension/deactivate';
import { registerCommands } from './extension/commands';
import { checkWorkspaceInitialization, registerOpenSpecWatcher } from './extension/watcher';
import { ExtensionRuntimeState } from './extension/runtime';

let runtime: ExtensionRuntimeState | undefined;

export function activate(context: vscode.ExtensionContext) {
  console.log('OpenSpec extension is now active!');

  // Initialize error handling and cache
  ErrorHandler.initialize();

  runtime = activateExtension(context);
  runtime.cacheManager = CacheManager.getInstance();

  // Register the tree data provider
  runtime.explorerProvider = new OpenSpecExplorerProvider();
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('openspecWorkspaceExplorer', runtime.explorerProvider),
    vscode.window.registerTreeDataProvider('openspecWorkspaceWelcome', runtime.explorerProvider)
  );

  // Register the webview provider
  runtime.webviewProvider = new OpenSpecWebviewProvider(context.extensionUri);

  // Register commands
  registerCommands(context, runtime);

  // Set up file system watcher
  registerOpenSpecWatcher(context, runtime);

  // Check workspace initialization
  checkWorkspaceInitialization(runtime);

  // Log activation success
  ErrorHandler.info('Extension activated successfully', false);
}

export function deactivate() {
  deactivateExtension(runtime);
}
