import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('Extension should be present', () => {
    assert.ok(vscode.extensions.getExtension('oioi555.openspec-vscode-extension'));
  });

  test('Extension should activate', async () => {
    const extension = vscode.extensions.getExtension('oioi555.openspec-vscode-extension');
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
      'openspecWorkspace.copyChangeName',
      'openspecWorkspace.copyChangeCommand.propose',
      'openspecWorkspace.copyChangeCommand.apply',
      'openspecWorkspace.copyChangeCommand.archive',
      'openspecWorkspace.copyChangeCommand.continue',
      'openspecWorkspace.copyChangeCommand.ff',
      'openspecWorkspace.copyChangeCommand.verify',
      'openspecWorkspace.copyChangeCommand.sync',
      'openspecWorkspace.generateProposal',
      'openspecWorkspace.init',
      'openspecWorkspace.showOutput'
    ];

    expectedCommands.forEach(command => {
      assert.ok(commands.includes(command), `Command ${command} should be registered`);
    });
  });
});
