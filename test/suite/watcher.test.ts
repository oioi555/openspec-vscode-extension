import * as assert from 'assert';
import * as vscode from 'vscode';

import { checkWorkspaceInitialization } from '../../src/extension/watcher';
import { ExtensionRuntimeState } from '../../src/extension/runtime';
import { WorkspaceUtils } from '../../src/utils/workspace';

suite('Watcher Test Suite', () => {
  function createRuntimeState(refreshCalls: { explorer: number; cli: number }): ExtensionRuntimeState {
    return {
      debounceMap: new Map(),
      explorerProvider: {
        refresh: () => {
          refreshCalls.explorer += 1;
        }
      } as unknown as ExtensionRuntimeState['explorerProvider'],
      cliToolsProvider: {
        refresh: () => {
          refreshCalls.cli += 1;
        }
      } as unknown as ExtensionRuntimeState['cliToolsProvider']
    };
  }

  function createWorkspaceFolder(fsPath: string, name: string): vscode.WorkspaceFolder {
    return {
      uri: vscode.Uri.file(fsPath),
      name,
      index: 0
    };
  }

  async function withPatchedProperty<T extends object, K extends keyof T>(
    target: T,
    key: K,
    value: T[K],
    callback: () => Promise<void>
  ): Promise<void> {
    const descriptor = Object.getOwnPropertyDescriptor(target, key);

    Object.defineProperty(target, key, {
      configurable: true,
      value
    });

    try {
      await callback();
    } finally {
      if (descriptor) {
        Object.defineProperty(target, key, descriptor);
      } else {
        delete (target as Record<PropertyKey, unknown>)[key as PropertyKey];
      }
    }
  }

  async function flushAsyncWork(): Promise<void> {
    await new Promise<void>(resolve => setImmediate(resolve));
  }

  const executeCommandMock: typeof vscode.commands.executeCommand = <T = unknown>(
    command: string,
    ...args: unknown[]
  ): Thenable<T> => {
    if (command === 'setContext') {
      currentContextCalls?.set(String(args[0]), args[1]);
    }

    return Promise.resolve(undefined as T);
  };

  let currentContextCalls: Map<string, unknown> | undefined;

  test('Should set no-workspace welcome context keys', async () => {
    const refreshCalls = { explorer: 0, cli: 0 };
    const runtime = createRuntimeState(refreshCalls);
    const contextCalls = new Map<string, unknown>();

    await withPatchedProperty(vscode.workspace, 'workspaceFolders', undefined, async () => {
      currentContextCalls = contextCalls;
      await withPatchedProperty(vscode.commands, 'executeCommand', executeCommandMock, async () => {
        checkWorkspaceInitialization(runtime);
        await flushAsyncWork();
      });
    });

    currentContextCalls = undefined;

    assert.strictEqual(contextCalls.get('openspecWorkspace:hasWorkspaceFolder'), false);
    assert.strictEqual(contextCalls.get('openspecWorkspace:initialized'), false);
    assert.strictEqual(contextCalls.get('openspecWorkspace:uninitialized'), false);
    assert.strictEqual(refreshCalls.explorer, 1);
    assert.strictEqual(refreshCalls.cli, 1);
  });

  test('Should set uninitialized-workspace welcome context keys', async () => {
    const refreshCalls = { explorer: 0, cli: 0 };
    const runtime = createRuntimeState(refreshCalls);
    const contextCalls = new Map<string, unknown>();
    const workspaceFolder = createWorkspaceFolder('/tmp/uninitialized-workspace', 'uninitialized-workspace');
    const originalIsOpenSpecInitialized = WorkspaceUtils.isOpenSpecInitialized;

    (WorkspaceUtils as typeof WorkspaceUtils & {
      isOpenSpecInitialized: typeof WorkspaceUtils.isOpenSpecInitialized;
    }).isOpenSpecInitialized = async () => false;

    try {
      await withPatchedProperty(vscode.workspace, 'workspaceFolders', [workspaceFolder], async () => {
        currentContextCalls = contextCalls;
        await withPatchedProperty(vscode.commands, 'executeCommand', executeCommandMock, async () => {
          checkWorkspaceInitialization(runtime);
          await flushAsyncWork();
        });
      });
    } finally {
      currentContextCalls = undefined;
      (WorkspaceUtils as typeof WorkspaceUtils & {
        isOpenSpecInitialized: typeof WorkspaceUtils.isOpenSpecInitialized;
      }).isOpenSpecInitialized = originalIsOpenSpecInitialized;
    }

    assert.strictEqual(contextCalls.get('openspecWorkspace:hasWorkspaceFolder'), true);
    assert.strictEqual(contextCalls.get('openspecWorkspace:initialized'), false);
    assert.strictEqual(contextCalls.get('openspecWorkspace:uninitialized'), true);
    assert.strictEqual(refreshCalls.explorer, 1);
    assert.strictEqual(refreshCalls.cli, 1);
  });

  test('Should set initialized welcome context keys', async () => {
    const refreshCalls = { explorer: 0, cli: 0 };
    const runtime = createRuntimeState(refreshCalls);
    const contextCalls = new Map<string, unknown>();
    const workspaceFolder = createWorkspaceFolder('/tmp/initialized-workspace', 'initialized-workspace');
    const originalIsOpenSpecInitialized = WorkspaceUtils.isOpenSpecInitialized;

    (WorkspaceUtils as typeof WorkspaceUtils & {
      isOpenSpecInitialized: typeof WorkspaceUtils.isOpenSpecInitialized;
    }).isOpenSpecInitialized = async () => true;

    try {
      await withPatchedProperty(vscode.workspace, 'workspaceFolders', [workspaceFolder], async () => {
        currentContextCalls = contextCalls;
        await withPatchedProperty(vscode.commands, 'executeCommand', executeCommandMock, async () => {
          checkWorkspaceInitialization(runtime);
          await flushAsyncWork();
        });
      });
    } finally {
      currentContextCalls = undefined;
      (WorkspaceUtils as typeof WorkspaceUtils & {
        isOpenSpecInitialized: typeof WorkspaceUtils.isOpenSpecInitialized;
      }).isOpenSpecInitialized = originalIsOpenSpecInitialized;
    }

    assert.strictEqual(contextCalls.get('openspecWorkspace:hasWorkspaceFolder'), true);
    assert.strictEqual(contextCalls.get('openspecWorkspace:initialized'), true);
    assert.strictEqual(contextCalls.get('openspecWorkspace:uninitialized'), false);
    assert.strictEqual(refreshCalls.explorer, 1);
    assert.strictEqual(refreshCalls.cli, 1);
  });
});
