// Centralized command IDs used across the extension.

export const Commands = {
  viewDetails: 'openspecWorkspace.viewDetails',
  listChanges: 'openspecWorkspace.listChanges',
  copyChangeName: 'openspecWorkspace.copyChangeName',
  copyChangeCommandPropose: 'openspecWorkspace.copyChangeCommand.propose',
  copyChangeCommandApply: 'openspecWorkspace.copyChangeCommand.apply',
  copyChangeCommandArchive: 'openspecWorkspace.copyChangeCommand.archive',
  copyChangeCommandContinue: 'openspecWorkspace.copyChangeCommand.continue',
  copyChangeCommandFastForward: 'openspecWorkspace.copyChangeCommand.ff',
  copyChangeCommandVerify: 'openspecWorkspace.copyChangeCommand.verify',
  copyChangeCommandSync: 'openspecWorkspace.copyChangeCommand.sync',

  generateProposal: 'openspecWorkspace.generateProposal',
  init: 'openspecWorkspace.init',
  showOutput: 'openspecWorkspace.showOutput',

  explorerFocus: 'openspecWorkspaceExplorer.focus'
} as const;
