import * as assert from 'assert';
import * as vscode from 'vscode';

import { Commands } from '../../src/constants/commands';
import { registerCommands } from '../../src/extension/commands';
import { ExtensionRuntimeState } from '../../src/extension/runtime';

suite('Commands Test Suite', () => {
  type RegisteredCommandHandler = (...args: unknown[]) => unknown;

  async function withPatchedProperty<T extends object, K extends keyof T>(
    target: T,
    key: K,
    value: T[K],
    callback: () => Promise<void> | void
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

  function createRuntimeState(): ExtensionRuntimeState {
    return { debounceMap: new Map() };
  }

  function createExtensionContext(): vscode.ExtensionContext {
    return {
      subscriptions: []
    } as unknown as vscode.ExtensionContext;
  }

  function createTerminalRecorder(name: string) {
    const showCalls: Array<boolean | undefined> = [];
    const sendTextCalls: Array<{ text: string; addNewLine?: boolean }> = [];

    const terminal = {
      name,
      show: (preserveFocus?: boolean) => {
        showCalls.push(preserveFocus);
      },
      sendText: (text: string, addNewLine?: boolean) => {
        sendTextCalls.push({ text, addNewLine });
      },
      dispose: () => undefined
    } as unknown as vscode.Terminal;

    return { terminal, showCalls, sendTextCalls };
  }

  function createImmediateSetTimeoutRecorder() {
    const delayCalls: number[] = [];

    const setTimeoutMock = ((callback: (...args: unknown[]) => void, delay?: number, ...args: unknown[]) => {
      delayCalls.push(delay ?? 0);
      callback(...args);
      return 0 as unknown as ReturnType<typeof setTimeout>;
    }) as typeof setTimeout;

    return { setTimeoutMock, delayCalls };
  }

  test('Should reuse existing OpenSpec CLI terminal for CLI tool commands', async () => {
    const registeredCommands = new Map<string, RegisteredCommandHandler>();
    const existingTerminal = createTerminalRecorder('OpenSpec CLI');
    let createTerminalCalls = 0;

    const registerCommandMock = ((command: string, callback: RegisteredCommandHandler) => {
      registeredCommands.set(command, callback);
      return { dispose: () => registeredCommands.delete(command) };
    }) as typeof vscode.commands.registerCommand;

    const createTerminalMock = (() => {
      createTerminalCalls += 1;
      return createTerminalRecorder('OpenSpec CLI').terminal;
    }) as typeof vscode.window.createTerminal;

    await withPatchedProperty(vscode.commands, 'registerCommand', registerCommandMock, async () => {
      await withPatchedProperty(vscode.window, 'terminals', [existingTerminal.terminal], async () => {
        await withPatchedProperty(vscode.window, 'createTerminal', createTerminalMock, async () => {
          registerCommands(createExtensionContext(), createRuntimeState());

          const command = registeredCommands.get(Commands.runCliTool);
          assert.ok(command, 'Expected runCliTool command to be registered');

          command!({ cliCommand: 'openspec validate' });
        });
      });
    });

    assert.strictEqual(createTerminalCalls, 0);
    assert.deepStrictEqual(existingTerminal.showCalls, [true]);
    assert.deepStrictEqual(existingTerminal.sendTextCalls, [
      { text: 'openspec validate', addNewLine: true }
    ]);
  });

  test('Should reuse existing OpenSpec CLI terminal for workspace init and execute the delayed follow-up Enter press', async () => {
    const registeredCommands = new Map<string, RegisteredCommandHandler>();
    const existingTerminal = createTerminalRecorder('OpenSpec CLI');
    const setTimeoutRecorder = createImmediateSetTimeoutRecorder();
    let createTerminalCalls = 0;

    const registerCommandMock = ((command: string, callback: RegisteredCommandHandler) => {
      registeredCommands.set(command, callback);
      return { dispose: () => registeredCommands.delete(command) };
    }) as typeof vscode.commands.registerCommand;

    const createTerminalMock = (() => {
      createTerminalCalls += 1;
      return createTerminalRecorder('OpenSpec CLI').terminal;
    }) as typeof vscode.window.createTerminal;

    await withPatchedProperty(globalThis, 'setTimeout', setTimeoutRecorder.setTimeoutMock, async () => {
      await withPatchedProperty(vscode.commands, 'registerCommand', registerCommandMock, async () => {
        await withPatchedProperty(vscode.window, 'terminals', [existingTerminal.terminal], async () => {
          await withPatchedProperty(vscode.window, 'createTerminal', createTerminalMock, async () => {
            registerCommands(createExtensionContext(), createRuntimeState());

            const command = registeredCommands.get(Commands.init);
            assert.ok(command, 'Expected init command to be registered');

            await command!();
          });
        });
      });
    });

    assert.strictEqual(createTerminalCalls, 0);
    assert.deepStrictEqual(setTimeoutRecorder.delayCalls, [700]);
    assert.deepStrictEqual(existingTerminal.showCalls, [false]);
    assert.deepStrictEqual(existingTerminal.sendTextCalls, [
      { text: 'openspec init', addNewLine: true },
      { text: '', addNewLine: true }
    ]);
  });

  test('Should create the shared OpenSpec CLI terminal for workspace init and execute the delayed follow-up Enter press when needed', async () => {
    const registeredCommands = new Map<string, RegisteredCommandHandler>();
    const createdTerminal = createTerminalRecorder('OpenSpec CLI');
    const createdTerminalNames: string[] = [];
    const setTimeoutRecorder = createImmediateSetTimeoutRecorder();

    const registerCommandMock = ((command: string, callback: RegisteredCommandHandler) => {
      registeredCommands.set(command, callback);
      return { dispose: () => registeredCommands.delete(command) };
    }) as typeof vscode.commands.registerCommand;

    const createTerminalMock = ((options?: vscode.TerminalOptions | vscode.ExtensionTerminalOptions | string) => {
      const name = typeof options === 'string' ? options : options?.name ?? '';
      createdTerminalNames.push(name);
      return createdTerminal.terminal;
    }) as typeof vscode.window.createTerminal;

    await withPatchedProperty(globalThis, 'setTimeout', setTimeoutRecorder.setTimeoutMock, async () => {
      await withPatchedProperty(vscode.commands, 'registerCommand', registerCommandMock, async () => {
        await withPatchedProperty(vscode.window, 'terminals', [], async () => {
          await withPatchedProperty(vscode.window, 'createTerminal', createTerminalMock, async () => {
            registerCommands(createExtensionContext(), createRuntimeState());

            const command = registeredCommands.get(Commands.init);
            assert.ok(command, 'Expected init command to be registered');

            await command!();
          });
        });
      });
    });

    assert.deepStrictEqual(createdTerminalNames, ['OpenSpec CLI']);
    assert.deepStrictEqual(setTimeoutRecorder.delayCalls, [700]);
    assert.deepStrictEqual(createdTerminal.showCalls, [false]);
    assert.deepStrictEqual(createdTerminal.sendTextCalls, [
      { text: 'openspec init', addNewLine: true },
      { text: '', addNewLine: true }
    ]);
  });
});
