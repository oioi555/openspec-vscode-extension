import * as vscode from 'vscode';

import { Commands } from '../constants/commands';
import {
  copyOpenSpecCommandSnippet,
  isChangeAwareOpenSpecCommand,
  OpenSpecChangeCommand
} from '../utils/changeCommandSnippet';
import { OPENSPEC_SETTINGS_QUERY } from '../utils/config';
import { ErrorHandler } from '../utils/errorHandler';
import { ExtensionRuntimeState } from './runtime';
import { checkWorkspaceInitialization } from './watcher';

const OPEN_SPEC_CLI_TERMINAL_NAME = 'OpenSpec CLI';
const OPEN_SPEC_INIT_FOLLOW_UP_DELAY_MS = 700;

async function delay(ms: number): Promise<void> {
  await new Promise<void>(resolve => {
    setTimeout(resolve, ms);
  });
}

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

function normalizeCliCommand(input: unknown): { cliCommand: string } | null {
  if (typeof input === 'string') {
    const cliCommand = readString(input);
    return cliCommand ? { cliCommand } : null;
  }

  if (!isRecord(input)) {
    return null;
  }

  const directCommand = readString(input.cliCommand);
  if (directCommand) {
    return { cliCommand: directCommand };
  }

  const metadata = isRecord(input.metadata) ? input.metadata : undefined;
  const metadataCommand = readString(metadata?.cliCommand);
  if (metadataCommand) {
    return { cliCommand: metadataCommand };
  }

  const itemLabel = readString(input.label);
  const itemType = readString(input.type);
  if (itemLabel && itemType === 'cliCommand') {
    return { cliCommand: itemLabel };
  }

  return null;
}

function normalizeExternalUrl(input: unknown): { externalUrl: string } | null {
  if (typeof input === 'string') {
    const externalUrl = readString(input);
    return externalUrl ? { externalUrl } : null;
  }

  if (!isRecord(input)) {
    return null;
  }

  const directUrl = readString(input.externalUrl);
  if (directUrl) {
    return { externalUrl: directUrl };
  }

  const metadata = isRecord(input.metadata) ? input.metadata : undefined;
  const metadataUrl = readString(metadata?.externalUrl);
  if (metadataUrl) {
    return { externalUrl: metadataUrl };
  }

  return null;
}

function getOrCreateTerminal(name: string): vscode.Terminal {
  const existingTerminal = vscode.window.terminals.find(terminal => terminal.name === name);
  if (existingTerminal) {
    return existingTerminal;
  }

  return vscode.window.createTerminal({ name });
}

function registerCommandSnippetCopy(
  commandId: string,
  opsxCommand: OpenSpecChangeCommand
): vscode.Disposable {
  return vscode.commands.registerCommand(commandId, async (item) => {
    const request: { command: OpenSpecChangeCommand; changeId?: string } = {
      command: opsxCommand
    };

    if (isChangeAwareOpenSpecCommand(opsxCommand)) {
      const changeItem = normalizeChangeItem(item);
      if (!changeItem) {
        vscode.window.showWarningMessage('No change selected');
        return;
      }

      request.changeId = changeItem.changeId;
    }

    try {
      const snippet = await copyOpenSpecCommandSnippet(request);
      vscode.window.showInformationMessage(`Copied to clipboard: ${snippet}`);
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
      vscode.window.showInformationMessage(`Copied to clipboard: ${changeItem.changeId}`);
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
    checkWorkspaceInitialization(runtime);
    vscode.commands.executeCommand(Commands.explorerFocus);
  });

  const openSettingsCommand = vscode.commands.registerCommand(Commands.openSettings, async () => {
    await vscode.commands.executeCommand('workbench.action.openSettings', OPENSPEC_SETTINGS_QUERY);
  });

  const copyChangeName = registerChangeNameCopy(Commands.copyChangeName);
  const copyChangeCommandPropose = registerCommandSnippetCopy(Commands.copyChangeCommandPropose, 'propose');
  const copyChangeCommandExplore = registerCommandSnippetCopy(Commands.copyChangeCommandExplore, 'explore');
  const copyChangeCommandNew = registerCommandSnippetCopy(Commands.copyChangeCommandNew, 'new');
  const copyChangeCommandBulkArchive = registerCommandSnippetCopy(Commands.copyChangeCommandBulkArchive, 'bulk-archive');
  const copyChangeCommandApply = registerCommandSnippetCopy(Commands.copyChangeCommandApply, 'apply');
  const copyChangeCommandArchive = registerCommandSnippetCopy(Commands.copyChangeCommandArchive, 'archive');
  const copyChangeCommandContinue = registerCommandSnippetCopy(Commands.copyChangeCommandContinue, 'continue');
  const copyChangeCommandFastForward = registerCommandSnippetCopy(Commands.copyChangeCommandFastForward, 'ff');
  const copyChangeCommandVerify = registerCommandSnippetCopy(Commands.copyChangeCommandVerify, 'verify');
  const copyChangeCommandSync = registerCommandSnippetCopy(Commands.copyChangeCommandSync, 'sync');

  const initCommand = vscode.commands.registerCommand(Commands.init, async () => {
    const terminal = getOrCreateTerminal(OPEN_SPEC_CLI_TERMINAL_NAME);
    terminal.show(false);
    terminal.sendText('openspec init', true);
    await delay(OPEN_SPEC_INIT_FOLLOW_UP_DELAY_MS);
    terminal.sendText('', true);
  });

  const runCliToolCommand = vscode.commands.registerCommand(Commands.runCliTool, (item) => {
    const cliItem = normalizeCliCommand(item);
    if (!cliItem) {
      vscode.window.showWarningMessage('No CLI command selected');
      return;
    }

    const terminal = getOrCreateTerminal(OPEN_SPEC_CLI_TERMINAL_NAME);
    terminal.show(true);
    terminal.sendText(cliItem.cliCommand, true);
  });

  const openCliHelpCommand = vscode.commands.registerCommand(Commands.openCliHelp, async (item) => {
    const helpItem = normalizeExternalUrl(item);
    if (!helpItem) {
      vscode.window.showWarningMessage('No help link available');
      return;
    }

    await vscode.env.openExternal(vscode.Uri.parse(helpItem.externalUrl));
  });

  context.subscriptions.push(
    viewDetailsCommand,
    listChangesCommand,
    openSettingsCommand,
    copyChangeName,
    copyChangeCommandPropose,
    copyChangeCommandExplore,
    copyChangeCommandNew,
    copyChangeCommandBulkArchive,
    copyChangeCommandApply,
    copyChangeCommandArchive,
    copyChangeCommandContinue,
    copyChangeCommandFastForward,
    copyChangeCommandVerify,
    copyChangeCommandSync,
    initCommand,
    runCliToolCommand,
    openCliHelpCommand
  );
}
