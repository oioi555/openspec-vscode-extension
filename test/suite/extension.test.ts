import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('Extension should be present', () => {
    assert.ok(vscode.extensions.getExtension('oioi555.openspec-workspace'));
  });

  test('Extension should activate', async () => {
    const extension = vscode.extensions.getExtension('oioi555.openspec-workspace');
    if (extension) {
      await extension.activate();
      assert.ok(true);
    } else {
      assert.fail('Extension not found');
    }
  });

  test('Should register commands', async () => {
    const commands = await vscode.commands.getCommands();
    
    const expectedCommands = [
      'openspecWorkspace.viewDetails',
      'openspecWorkspace.listChanges',
      'openspecWorkspace.openSettings',
      'openspecWorkspace.copyChangeName',
      'openspecWorkspace.copyChangeCommand.propose',
      'openspecWorkspace.copyChangeCommand.explore',
      'openspecWorkspace.copyChangeCommand.new',
      'openspecWorkspace.copyChangeCommand.bulkArchive',
      'openspecWorkspace.copyChangeCommand.apply',
      'openspecWorkspace.copyChangeCommand.archive',
      'openspecWorkspace.copyChangeCommand.continue',
      'openspecWorkspace.copyChangeCommand.ff',
      'openspecWorkspace.copyChangeCommand.verify',
      'openspecWorkspace.copyChangeCommand.sync',
      'openspecWorkspace.init',
      'openspecWorkspace.runCliTool',
      'openspecWorkspace.openCliHelp'
    ];

    expectedCommands.forEach(command => {
      assert.ok(commands.includes(command), `Command ${command} should be registered`);
    });

    assert.ok(!commands.includes('openspecWorkspace.generateProposal'));
    assert.ok(!commands.includes('openspecWorkspace.showOutput'));
  });

  test('Should contribute separate CLI Tools view and updated settings', async () => {
    const extension = vscode.extensions.getExtension('oioi555.openspec-workspace');
    assert.ok(extension, 'Extension not found');

    const packageJSON = extension!.packageJSON as {
      contributes?: {
        configuration?: { properties?: Record<string, unknown> };
        views?: Record<string, Array<{ id: string; name: string }>>;
        viewsWelcome?: Array<{ view: string; contents: string; when?: string }>;
      };
    };

    const properties = packageJSON.contributes?.configuration?.properties ?? {};
    assert.ok(properties['openspecWorkspace.expandedCommands.new']);
    assert.ok(properties['openspecWorkspace.expandedCommands.bulkArchive']);
    assert.ok(properties['openspecWorkspace.expandedCommands.continue']);
    assert.ok(properties['openspecWorkspace.expandedCommands.fastForward']);
    assert.ok(properties['openspecWorkspace.expandedCommands.verify']);
    assert.ok(properties['openspecWorkspace.expandedCommands.sync']);
    assert.ok(!properties['openspecWorkspace.enableExpandedCommands']);

    const commandSyntax = properties['openspecWorkspace.commandSyntax'] as {
      default?: string;
      enum?: string[];
      enumItemLabels?: string[];
    };
    assert.strictEqual(commandSyntax.default, 'default');
    assert.deepStrictEqual(commandSyntax.enum, ['default', 'claudeCode']);
    assert.deepStrictEqual(commandSyntax.enumItemLabels, ['Default', 'Claude Code']);

    const views = packageJSON.contributes?.views?.openspecWorkspace ?? [];
    assert.ok(views.some(view => view.id === 'openspecWorkspaceExplorer'));
    assert.ok(views.some(view => view.id === 'openspecWorkspaceCliTools'));
    assert.ok(views.some(view => view.id === 'openspecWorkspaceWelcome'));

    const welcomeEntries = (packageJSON.contributes?.viewsWelcome ?? []).filter(
      viewWelcome => viewWelcome.view === 'openspecWorkspaceWelcome'
    );

    assert.strictEqual(welcomeEntries.length, 2);

    const noFolderEntry = welcomeEntries.find(
      viewWelcome => viewWelcome.when?.includes('!openspecWorkspace:hasWorkspaceFolder')
    );
    const uninitializedEntry = welcomeEntries.find(
      viewWelcome =>
        viewWelcome.when?.includes('openspecWorkspace:hasWorkspaceFolder')
        && viewWelcome.when.includes('!openspecWorkspace:initialized')
    );

    assert.ok(noFolderEntry, 'Expected no-folder welcome entry');
    assert.ok(uninitializedEntry, 'Expected uninitialized-workspace welcome entry');
    assert.notStrictEqual(noFolderEntry!.when, uninitializedEntry!.when);

    const openSpecRepoUrl = 'https://github.com/Fission-AI/OpenSpec';
    assert.ok(noFolderEntry!.contents.includes(openSpecRepoUrl));
    assert.ok(uninitializedEntry!.contents.includes(openSpecRepoUrl));
    assert.ok(!noFolderEntry!.contents.includes('command:openspecWorkspace.init'));
    assert.ok(uninitializedEntry!.contents.includes('command:openspecWorkspace.init'));
  });
});
