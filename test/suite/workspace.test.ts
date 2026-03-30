import * as assert from 'assert';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import { WorkspaceUtils } from '../../src/utils/workspace';

suite('Workspace Utils Test Suite', () => {
  let workspaceFolder: vscode.WorkspaceFolder;

  suiteSetup(() => {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      throw new Error('No workspace folder found for testing');
    }
    workspaceFolder = workspaceFolders[0];
  });

  test('Should detect OpenSpec workspace', async () => {
    const isInitialized = await WorkspaceUtils.isOpenSpecInitialized(workspaceFolder);
    assert.strictEqual(typeof isInitialized, 'boolean');
  });

  test('Should return correct paths', () => {
    const rootPath = WorkspaceUtils.getOpenSpecRoot(workspaceFolder);
    const changesPath = WorkspaceUtils.getChangesDir(workspaceFolder);
    const specsPath = WorkspaceUtils.getSpecsDir(workspaceFolder);
    const archivePath = WorkspaceUtils.getArchiveDir(workspaceFolder);

    assert.ok(rootPath.endsWith('openspec'));
    assert.ok(changesPath.endsWith('openspec/changes'));
    assert.ok(specsPath.endsWith('openspec/specs'));
    assert.ok(archivePath.endsWith('openspec/changes/archive'));
  });

  test('Should handle file existence checks', async () => {
    const exists = await WorkspaceUtils.fileExists(workspaceFolder.uri.fsPath);
    assert.strictEqual(exists, true);
  });

  test('Should handle non-existent files', async () => {
    const nonExistentPath = `${workspaceFolder.uri.fsPath}/non-existent-file.txt`;
    const exists = await WorkspaceUtils.fileExists(nonExistentPath);
    assert.strictEqual(exists, false);
  });

  test('Should not display empty change directories', async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'openspec-workspace-test-'));
    const emptyChangeDir = path.join(tempRoot, 'empty-change');

    try {
      await fs.mkdir(emptyChangeDir, { recursive: true });

      const shouldDisplayActive = await WorkspaceUtils.shouldDisplayChange(emptyChangeDir, true);
      const shouldDisplayArchived = await WorkspaceUtils.shouldDisplayChange(emptyChangeDir, false);

      assert.strictEqual(shouldDisplayActive, false);
      assert.strictEqual(shouldDisplayArchived, false);
    } finally {
      await fs.rm(tempRoot, { recursive: true, force: true });
    }
  });

  test('Should display scaffold-only active changes', async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'openspec-workspace-test-'));
    const scaffoldChangeDir = path.join(tempRoot, 'scaffold-change');

    try {
      await fs.mkdir(scaffoldChangeDir, { recursive: true });
      await fs.writeFile(path.join(scaffoldChangeDir, '.openspec.yaml'), 'name: scaffold-change\n', 'utf8');

      const shouldDisplayActive = await WorkspaceUtils.shouldDisplayChange(scaffoldChangeDir, true);
      const shouldDisplayArchived = await WorkspaceUtils.shouldDisplayChange(scaffoldChangeDir, false);

      assert.strictEqual(shouldDisplayActive, true);
      assert.strictEqual(shouldDisplayArchived, false);
    } finally {
      await fs.rm(tempRoot, { recursive: true, force: true });
    }
  });

  test('Should only display workspace specs that contain spec.md', async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'openspec-workspace-test-'));
    const visibleSpecDir = path.join(tempRoot, 'visible-spec');
    const hiddenSpecDir = path.join(tempRoot, 'hidden-spec');

    try {
      await fs.mkdir(visibleSpecDir, { recursive: true });
      await fs.mkdir(hiddenSpecDir, { recursive: true });
      await fs.writeFile(path.join(visibleSpecDir, 'spec.md'), '## Purpose\n\nVisible\n', 'utf8');

      assert.strictEqual(await WorkspaceUtils.shouldDisplayWorkspaceSpec(visibleSpecDir), true);
      assert.strictEqual(await WorkspaceUtils.shouldDisplayWorkspaceSpec(hiddenSpecDir), false);
    } finally {
      await fs.rm(tempRoot, { recursive: true, force: true });
    }
  });
});
