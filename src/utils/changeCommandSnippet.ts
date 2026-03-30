import * as vscode from 'vscode';

export const OPEN_SPEC_CHANGE_COMMANDS = [
  'propose',
  'apply',
  'archive',
  'continue',
  'ff',
  'verify',
  'sync'
] as const;

export type OpenSpecChangeCommand = typeof OPEN_SPEC_CHANGE_COMMANDS[number];

export interface OpenSpecChangeCommandRequest {
  changeId: string;
  command: OpenSpecChangeCommand;
}

function normalizeText(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

export function buildOpenSpecChangeCommandSnippet(request: OpenSpecChangeCommandRequest): string {
  const changeId = normalizeText(request.changeId);
  if (!changeId) {
    throw new Error('Change ID is required');
  }

  return `/opsx:${request.command} ${changeId}`;
}

export async function copyOpenSpecChangeCommandSnippet(
  request: OpenSpecChangeCommandRequest,
  writeText: (value: string) => PromiseLike<void> | Promise<void> = (value: string) => vscode.env.clipboard.writeText(value)
): Promise<string> {
  const snippet = buildOpenSpecChangeCommandSnippet(request);
  await writeText(snippet);
  return snippet;
}
