import * as vscode from 'vscode';

import { Commands } from '../constants/commands';
import { copyOpenSpecChangeCommandSnippet, OpenSpecChangeCommand } from '../utils/changeCommandSnippet';
import { ErrorHandler } from '../utils/errorHandler';
import { ExtensionRuntimeState } from './runtime';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeChangeItem(input: unknown): { changeId: string } | null {
  if (!isRecord(input)) {
    return null;
  }

  const directChangeId = readString(input.changeId);
  if (directChangeId) {
    return { changeId: directChangeId };
  }

  const itemLabel = readString(input.label);
  const itemType = readString(input.type);
  if (itemLabel && itemType === 'change') {
    return { changeId: itemLabel };
  }

  return null;
}

function registerChangeCommandCopy(
  commandId: string,
  opsxCommand: OpenSpecChangeCommand,
  successLabel: string
): vscode.Disposable {
  return vscode.commands.registerCommand(commandId, async (item) => {
    const changeItem = normalizeChangeItem(item);
    if (!changeItem) {
      vscode.window.showWarningMessage('No change selected');
      return;
    }

    try {
      await copyOpenSpecChangeCommandSnippet({
        changeId: changeItem.changeId,
        command: opsxCommand
      });
      vscode.window.showInformationMessage(`${successLabel} copied to clipboard`);
    } catch (error) {
      ErrorHandler.handle(error as Error, `copying ${commandId}`, true);
    }
  });
}

function registerChangeNameCopy(commandId: string): vscode.Disposable {
  return vscode.commands.registerCommand(commandId, async (item) => {
    const changeItem = normalizeChangeItem(item);
    if (!changeItem) {
      vscode.window.showWarningMessage('No change selected');
      return;
    }

    try {
      await vscode.env.clipboard.writeText(changeItem.changeId);
      vscode.window.showInformationMessage('Change name copied to clipboard');
    } catch (error) {
      ErrorHandler.handle(error as Error, `copying ${commandId}`, true);
    }
  });
}

export function registerCommands(context: vscode.ExtensionContext, runtime: ExtensionRuntimeState): void {
  const viewDetailsCommand = vscode.commands.registerCommand(Commands.viewDetails, (item) => {
    if (!runtime.webviewProvider) {
      vscode.window.showErrorMessage('OpenSpec details panel is not available yet');
      return;
    }

    if (item && item.path) {
      runtime.webviewProvider.showDetails(item);
    } else {
      vscode.window.showWarningMessage('No change selected');
    }
  });

  const listChangesCommand = vscode.commands.registerCommand(Commands.listChanges, () => {
    runtime.explorerProvider?.refresh();
    vscode.commands.executeCommand(Commands.explorerFocus);
  });

  const copyChangeName = registerChangeNameCopy(Commands.copyChangeName);
  const copyChangeCommandPropose = registerChangeCommandCopy(Commands.copyChangeCommandPropose, 'propose', '/opsx:propose');
  const copyChangeCommandApply = registerChangeCommandCopy(Commands.copyChangeCommandApply, 'apply', '/opsx:apply');
  const copyChangeCommandArchive = registerChangeCommandCopy(Commands.copyChangeCommandArchive, 'archive', '/opsx:archive');
  const copyChangeCommandContinue = registerChangeCommandCopy(Commands.copyChangeCommandContinue, 'continue', '/opsx:continue');
  const copyChangeCommandFastForward = registerChangeCommandCopy(Commands.copyChangeCommandFastForward, 'ff', '/opsx:ff');
  const copyChangeCommandVerify = registerChangeCommandCopy(Commands.copyChangeCommandVerify, 'verify', '/opsx:verify');
  const copyChangeCommandSync = registerChangeCommandCopy(Commands.copyChangeCommandSync, 'sync', '/opsx:sync');

  const generateProposalCommand = vscode.commands.registerCommand(Commands.generateProposal, async () => {
    const changeId = await vscode.window.showInputBox({
      prompt: 'Enter a change ID (kebab-case, verb-led)',
      placeHolder: 'add-new-feature',
      validateInput: (value) => {
        if (!value) return 'Change ID is required';
        if (!/^[a-z][a-z0-9-]+$/.test(value)) {
          return 'Use kebab-case, starting with a letter';
        }
        return null;
      }
    });

    if (!changeId) {
      return;
    }

    const commandText = `openspec create-proposal ${changeId}`;
    const choice = await vscode.window.showInformationMessage(
      `Ready to run: ${commandText}`,
      'Run in Terminal',
      'Copy Command'
    );

    if (choice === 'Run in Terminal') {
      const terminal = vscode.window.createTerminal({ name: 'OpenSpec Workspace' });
      terminal.show(true);
      terminal.sendText(commandText, true);
    } else if (choice === 'Copy Command') {
      await vscode.env.clipboard.writeText(commandText);
      vscode.window.showInformationMessage('Command copied to clipboard');
    }
  });

  const initCommand = vscode.commands.registerCommand(Commands.init, async () => {
    const terminal = vscode.window.createTerminal({ name: 'OpenSpec Workspace Init' });
    terminal.show(true);
    terminal.sendText('openspec init', true);
    vscode.window.showInformationMessage('Initialized terminal with `openspec init`');
  });

  const showOutputCommand = vscode.commands.registerCommand(Commands.showOutput, () => {
    ErrorHandler.showOutputChannel();
  });

  context.subscriptions.push(
    viewDetailsCommand,
    listChangesCommand,
    copyChangeName,
    copyChangeCommandPropose,
    copyChangeCommandApply,
    copyChangeCommandArchive,
    copyChangeCommandContinue,
    copyChangeCommandFastForward,
    copyChangeCommandVerify,
    copyChangeCommandSync,
    generateProposalCommand,
    initCommand,
    showOutputCommand
  );
}
