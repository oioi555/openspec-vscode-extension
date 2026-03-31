import * as assert from 'assert';
import * as vscode from 'vscode';

import { Commands } from '../../src/constants/commands';
import { OpenSpecCliToolsProvider, OPEN_SPEC_CLI_COMMANDS, OPEN_SPEC_CLI_REFERENCE_URL } from '../../src/providers/cliToolsProvider';
import { OpenSpecExplorerProvider } from '../../src/providers/explorerProvider';
import { TreeItemData } from '../../src/types';
import { WorkspaceUtils } from '../../src/utils/workspace';

suite('Explorer Provider Test Suite', () => {
  let provider: OpenSpecExplorerProvider;
  let cliProvider: OpenSpecCliToolsProvider;

  setup(() => {
    provider = new OpenSpecExplorerProvider();
    cliProvider = new OpenSpecCliToolsProvider();
  });

  test('Should return an empty array when no workspace folder is available', async () => {
    (provider as unknown as { _workspaceFolder?: vscode.WorkspaceFolder })._workspaceFolder = undefined;

    const children = await provider.getChildren();

    assert.deepStrictEqual(children, []);
  });

  test('Should return an empty array when the workspace is not initialized', async () => {
    const originalIsOpenSpecInitialized = WorkspaceUtils.isOpenSpecInitialized;
    const workspaceFolder: vscode.WorkspaceFolder = {
      uri: vscode.Uri.file('/tmp/uninitialized-workspace'),
      name: 'uninitialized-workspace',
      index: 0
    };

    (provider as unknown as { _workspaceFolder?: vscode.WorkspaceFolder })._workspaceFolder = workspaceFolder;
    (WorkspaceUtils as typeof WorkspaceUtils & {
      isOpenSpecInitialized: typeof WorkspaceUtils.isOpenSpecInitialized;
    }).isOpenSpecInitialized = async () => false;

    try {
      const children = await provider.getChildren();

      assert.deepStrictEqual(children, []);
    } finally {
      (WorkspaceUtils as typeof WorkspaceUtils & {
        isOpenSpecInitialized: typeof WorkspaceUtils.isOpenSpecInitialized;
      }).isOpenSpecInitialized = originalIsOpenSpecInitialized;
    }
  });

  test('Should return root items when the workspace is initialized', async () => {
    const originalIsOpenSpecInitialized = WorkspaceUtils.isOpenSpecInitialized;
    const workspaceFolder: vscode.WorkspaceFolder = {
      uri: vscode.Uri.file('/tmp/initialized-workspace'),
      name: 'initialized-workspace',
      index: 0
    };

    (provider as unknown as { _workspaceFolder?: vscode.WorkspaceFolder })._workspaceFolder = workspaceFolder;
    (WorkspaceUtils as typeof WorkspaceUtils & {
      isOpenSpecInitialized: typeof WorkspaceUtils.isOpenSpecInitialized;
    }).isOpenSpecInitialized = async () => true;

    try {
      const children = await provider.getChildren();

      assert.deepStrictEqual(children.map(item => item.id), ['changes', 'specs']);
    } finally {
      (WorkspaceUtils as typeof WorkspaceUtils & {
        isOpenSpecInitialized: typeof WorkspaceUtils.isOpenSpecInitialized;
      }).isOpenSpecInitialized = originalIsOpenSpecInitialized;
    }
  });

  test('Should expose root items in the expected order', () => {
    const rootItems = (provider as any).getRootItems() as TreeItemData[];

    assert.deepStrictEqual(rootItems.map(item => item.id), ['changes', 'specs']);
    assert.strictEqual(rootItems[0].contextValue, 'changes-root');
    assert.ok(!rootItems.some(item => item.id === 'cli-tools'));
  });

  test('Should expose CLI tools in separate provider with reference help entry', () => {
    const cliItems = (cliProvider as any).getCliToolsItems() as TreeItemData[];
    const commandItems = cliItems.slice(0, OPEN_SPEC_CLI_COMMANDS.length);
    const helpItem = cliItems[cliItems.length - 1];

    assert.deepStrictEqual(
      commandItems.map(item => item.metadata?.cliCommand),
      [...OPEN_SPEC_CLI_COMMANDS]
    );
    assert.strictEqual(helpItem.type, 'cliHelp');
    assert.strictEqual(helpItem.metadata?.externalUrl, OPEN_SPEC_CLI_REFERENCE_URL);
  });

  test('Should configure tree items for CLI commands, help, and archived changes', () => {
    const cliTreeItem = cliProvider.getTreeItem({
      id: 'cli-openspec-view',
      label: 'openspec view',
      type: 'cliCommand',
      contextValue: 'cli-command',
      metadata: { cliCommand: 'openspec view' }
    });

    const helpTreeItem = cliProvider.getTreeItem({
      id: 'cli-help',
      label: 'OpenSpec CLI Reference',
      type: 'cliHelp',
      contextValue: 'cli-help',
      metadata: { externalUrl: OPEN_SPEC_CLI_REFERENCE_URL }
    });

    const archivedChangeTreeItem = provider.getTreeItem({
      id: 'change-archived-change',
      label: 'archived-change',
      type: 'change',
      path: '/tmp/archived-change',
      contextValue: 'completed-change',
      metadata: { isActive: false, status: 'completed' }
    });

    const activeChangeTreeItem = provider.getTreeItem({
      id: 'change-active-change',
      label: 'active-change',
      type: 'change',
      path: '/tmp/active-change',
      contextValue: 'active-change',
      metadata: { isActive: true, status: 'in-progress' }
    });

    assert.strictEqual(cliTreeItem.command?.command, Commands.runCliTool);
    assert.strictEqual(helpTreeItem.command?.command, Commands.openCliHelp);
    assert.strictEqual((archivedChangeTreeItem.iconPath as vscode.ThemeIcon).id, 'package');
    assert.strictEqual((activeChangeTreeItem.iconPath as vscode.ThemeIcon).id, 'package');
  });

  test('Should set an explicit icon for completed changes folder', () => {
    const completedFolderTreeItem = provider.getTreeItem({
      id: 'completed-changes',
      label: 'Completed Changes (1)',
      type: 'folder',
      iconPath: 'archive',
      children: []
    });

    assert.strictEqual((completedFolderTreeItem.iconPath as vscode.ThemeIcon).id, 'archive');
  });
});
