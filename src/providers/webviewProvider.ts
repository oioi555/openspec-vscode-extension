import * as vscode from 'vscode';
import * as path from 'path';
import { marked } from 'marked';
import { WorkspaceUtils } from '../utils/workspace';
import { ErrorHandler } from '../utils/errorHandler';
import { TreeItemData } from '../types';

export class OpenSpecWebviewProvider implements vscode.WebviewPanelSerializer {
  private _panels = new Map<string, vscode.WebviewPanel>();
  private _extensionUri: vscode.Uri;

  private escapeAttr(value: string): string {
    return value.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  constructor(extensionUri: vscode.Uri) {
    this._extensionUri = extensionUri;
    
    // Configure marked options
    marked.setOptions({
      breaks: true,
      gfm: true,
      headerIds: true,
      headerPrefix: ''
    });
  }

  async deserializeWebviewPanel(_webviewPanel: vscode.WebviewPanel, _state: unknown) {
    ErrorHandler.debug('Deserializing webview panel');
    // Handle panel restoration if needed
  }

  async showDetails(item: TreeItemData): Promise<void> {
    if (!item.path) {
      vscode.window.showErrorMessage('No path available for this item');
      return;
    }

    const panelKey = 'details';
    
    if (this._panels.has(panelKey)) {
      const existingPanel = this._panels.get(panelKey)!;
      // Update the title to reflect the current change
      existingPanel.title = `OpenSpec: ${item.label}`;
      // Update the HTML content
      existingPanel.webview.html = await this.getHtmlContent(existingPanel.webview, item);
      existingPanel.reveal();
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'openspecWorkspace.details',
      `OpenSpec: ${item.label}`,
      vscode.ViewColumn.Active,
      {
        enableScripts: true,
        localResourceRoots: [
          this._extensionUri,
          vscode.Uri.file(path.dirname(item.path))
        ],
        retainContextWhenHidden: true
      }
    );

    panel.webview.html = await this.getHtmlContent(panel.webview, item);
    this.setupWebviewMessageHandling(panel, item, panelKey);

    panel.onDidDispose(() => {
      this._panels.delete(panelKey);
    });

    this._panels.set(panelKey, panel);
  }

  private async getHtmlContent(webview: vscode.Webview, item: TreeItemData): Promise<string> {
    const stylesUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'styles.css'));
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'script.js'));

    const { proposalContent, designContent, tasksContent, specsList } = await this.buildChangeContent(item);
    const specContent = await this.buildSpecContent(item);

    const escapeAttr = (value: string): string => this.escapeAttr(value);

    const proposalFilePath = item.type === 'change' && item.path ? path.join(item.path, 'proposal.md') : '';
    const designFilePath = item.type === 'change' && item.path ? path.join(item.path, 'design.md') : '';
    const tasksFilePath = item.type === 'change' && item.path ? path.join(item.path, 'tasks.md') : '';
    const renderArtifactActions = (
      filePath: string,
      label: string
    ): string => {
      if (!filePath) {
        return '';
      }
      return `
        <div class="artifact-actions">
          <button type="button" class="artifact-open" data-open-file="${escapeAttr(filePath)}" aria-label="Open ${label}">
            Open ${label}
          </button>
        </div>
      `;
    };

    const isEmptyChange = item.type === 'change'
      && typeof item.path === 'string'
      && !(await WorkspaceUtils.hasAnyChangeArtifacts(item.path));

    const emptyStateHtml = isEmptyChange ? this.renderEmptyStatePanel() : '';
 
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src ${webview.cspSource}; img-src ${webview.cspSource} https: data:;">
          <title>OpenSpec: ${item.label}</title>
          <link href="${stylesUri}" rel="stylesheet">
      </head>
      <body>
           <div class="container">
               <header class="header">
                   <div class="header-title">
                    <div class="header-title-left">
                      <h1>${item.label}</h1>
                      ${this.renderStatusBadge(item)}
                    </div>
                    </div>
                </header>

              <div class="content">
                    ${emptyStateHtml}
                    ${specContent ? `
                        <div class="collapsible-section" data-section="spec">
                            <button class="section-header" tabindex="0" aria-expanded="true" aria-controls="spec-content">
                                <span class="section-title">Specification</span>
                                <span class="collapse-icon">▼</span>
                            </button>
                            <div id="spec-content" class="section-content markdown-content">
                                ${item.type === 'spec' && item.path ? renderArtifactActions(item.path, 'spec.md') : ''}
                                ${specContent}
                            </div>
                        </div>
                    ` : ''}
                    ${proposalContent ? `
                         <div class="collapsible-section" data-section="proposal">
                             <button class="section-header" tabindex="0" aria-expanded="true" aria-controls="proposal-content">
                                 <span class="section-title">Proposal</span>
                                 <span class="collapse-icon">▼</span>
                             </button>
                             <div id="proposal-content" class="section-content markdown-content">
                                 ${renderArtifactActions(proposalFilePath, 'proposal.md')}
                                 ${proposalContent}
                             </div>
                         </div>
                     ` : ''}

                    ${designContent ? `
                        <div class="collapsible-section" data-section="design">
                            <button class="section-header" tabindex="0" aria-expanded="true" aria-controls="design-content">
                                <span class="section-title">Design</span>
                                <span class="collapse-icon">▼</span>
                            </button>
                            <div id="design-content" class="section-content markdown-content">
                                ${renderArtifactActions(designFilePath, 'design.md')}
                                ${designContent}
                            </div>
                        </div>
                    ` : ''}

                    ${tasksContent ? `
                        <div class="collapsible-section" data-section="tasks">
                            <button class="section-header" tabindex="0" aria-expanded="true" aria-controls="tasks-content">
                                <span class="section-title">Tasks</span>
                                <span class="collapse-icon">▼</span>
                            </button>
                            <div
                              id="tasks-content"
                              class="section-content markdown-content"
                              data-openspec-artifact-file="${escapeAttr(tasksFilePath)}"
                            >
                                ${renderArtifactActions(tasksFilePath, 'tasks.md')}
                                <div data-openspec-artifact-body>
                                  ${tasksContent}
                                </div>
                            </div>
                        </div>
                    ` : ''}

                  ${specsList ? `
                      <div class="collapsible-section" data-section="specs">
                          <button class="section-header" tabindex="0" aria-expanded="true" aria-controls="specs-content">
                              <span class="section-title">Specifications</span>
                              <span class="collapse-icon">▼</span>
                          </button>
                          <div id="specs-content" class="section-content specs-list">
                              ${specsList}
                          </div>
                      </div>
                  ` : ''}

                   ${await this.renderFilesList(item)}
               </div>
           </div>
           <script src="${scriptUri}"></script>
       </body>
       </html>
    `;
  }

  private renderEmptyStatePanel(): string {
    return `
      <section class="empty-state" aria-label="Empty change">
        <h2 class="empty-state-title">No artifacts yet</h2>
        <p class="empty-state-body">This change has no proposal, design, tasks, or specs yet. Use the change context menu to copy an OpenSpec command for this change.</p>
      </section>
    `;
  }



  private async renderFilesList(item: TreeItemData): Promise<string> {
    if (!item.path || item.type !== 'change') {
      return '';
    }

    try {
      const files = (await WorkspaceUtils.listFiles(item.path, ''))
        .filter(fileName => fileName !== 'proposal.md' && fileName !== 'design.md' && fileName !== 'tasks.md');
      if (files.length === 0) {
        return '';
      }

      const fileSections = await Promise.all(files.map(async (file) => {
        const filePath = path.join(item.path!, file);
        const fileName = path.basename(filePath);
        const fileExtension = path.extname(fileName).toLowerCase();
        const isMarkdown = fileExtension === '.md';
        
        // Escape special characters in file path for HTML attributes
        const escapedPath = filePath.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        const sectionId = `file-${file.replace(/[^a-zA-Z0-9]/g, '-')}`;
        
        return `
          <div class="collapsible-section" data-section="file">
            <button class="section-header file-header" 
                    tabindex="0" 
                    aria-expanded="false" 
                    aria-controls="${sectionId}-content"
                    data-filepath="${escapedPath}"
                    data-file-type="${isMarkdown ? 'markdown' : 'code'}">
              <span class="section-title">
                <span class="file-chip" aria-hidden="true">${isMarkdown ? 'MD' : 'FILE'}</span>
                ${file}
              </span>
              <span class="collapse-icon">▶</span>
            </button>
            <div id="${sectionId}-content" class="section-content ${isMarkdown ? 'markdown-content' : 'code-content'}" hidden>
              <pre class="file-preview"><code>Loading preview…</code></pre>
            </div>
          </div>
        `;
      }));
      
      return fileSections.join('');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      ErrorHandler.handle(err, 'rendering files list', false);
      return '';
    }
  }

  private renderStatusBadge(item: TreeItemData): string {
    const isActive = item.metadata?.isActive;
    if (isActive === undefined) {
      return '';
    }
    const badgeClass = isActive ? 'badge active' : 'badge completed';
    const label = isActive ? 'Active' : 'Completed';
    return `<span class="${badgeClass}">${label}</span>`;
  }

  private async buildChangeContent(item: TreeItemData): Promise<{
    proposalContent: string;
    designContent: string;
    tasksContent: string;
    specsList: string;
  }> {
    let proposalContent = '';
    let designContent = '';
    let tasksContent = '';
    let specsList = '';

    if (item.type !== 'change' || !item.path) {
      return { proposalContent, designContent, tasksContent, specsList };
    }

    try {
      const proposalPath = path.join(item.path, 'proposal.md');
      if (await WorkspaceUtils.fileExists(proposalPath)) {
        const proposalMarkdown = await WorkspaceUtils.readFile(proposalPath);
        proposalContent = marked(proposalMarkdown);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      ErrorHandler.handle(err, 'reading proposal.md', false);
    }

    try {
      const designPath = path.join(item.path, 'design.md');
      if (await WorkspaceUtils.fileExists(designPath)) {
        const designMarkdown = await WorkspaceUtils.readFile(designPath);
        designContent = marked(designMarkdown);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      ErrorHandler.handle(err, 'reading design.md', false);
    }

    try {
      const tasksPath = path.join(item.path, 'tasks.md');
      if (await WorkspaceUtils.fileExists(tasksPath)) {
        const tasksMarkdown = await WorkspaceUtils.readFile(tasksPath);
        tasksContent = marked(tasksMarkdown);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      ErrorHandler.handle(err, 'reading tasks.md', false);
    }

    try {
      // Specs are scoped to the selected change:
      // `openspec/changes/<change>/specs/*/spec.md` (or archived change path).
      // Prefer `item.path/specs`, but fall back to `item.path/<change>/specs` if needed.
      const directSpecsDir = path.join(item.path, 'specs');
      const nestedSpecsDir = path.join(item.path, item.label, 'specs');

      const specsDir = (await WorkspaceUtils.fileExists(directSpecsDir))
        ? directSpecsDir
        : ((await WorkspaceUtils.fileExists(nestedSpecsDir)) ? nestedSpecsDir : directSpecsDir);

      const capabilityDirs = await WorkspaceUtils.listDirectories(specsDir);
      if (capabilityDirs.length > 0) {
        const specLinks: string[] = [];
        for (const capability of capabilityDirs) {
          const specPath = path.join(specsDir, capability, 'spec.md');
          if (await WorkspaceUtils.fileExists(specPath)) {
            const escapedPath = specPath.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
            specLinks.push(`<button class="spec-link" data-filepath="${escapedPath}" aria-label="Open ${capability} spec">
              <span class="codicon codicon-file-text"></span>
              ${capability} spec
            </button>`);
          }
        }
        specsList = specLinks.join('');
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      ErrorHandler.handle(err, 'building specs list', false);
    }

    return { proposalContent, designContent, tasksContent, specsList };
  }

  private async buildSpecContent(item: TreeItemData): Promise<string> {
    if (item.type !== 'spec' || !item.path) {
      return '';
    }

    try {
      if (!(await WorkspaceUtils.fileExists(item.path))) {
        return '';
      }

      const specMarkdown = await WorkspaceUtils.readFile(item.path);
      return marked(specMarkdown);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      ErrorHandler.handle(err, 'reading spec.md', false);
      return '';
    }
  }

  private setupWebviewMessageHandling(panel: vscode.WebviewPanel, _item: TreeItemData, _panelKey: string): void {
    panel.webview.onDidReceiveMessage(async (message) => {
      if (message.type === 'openFile') {
        const fileUri = message.filepath
          ? vscode.Uri.file(message.filepath)
          : vscode.Uri.parse(message.uri);
        const preview = typeof message.preview === 'boolean' ? message.preview : true;
        await vscode.commands.executeCommand('vscode.open', fileUri, { preview });
      } else if (message.type === 'loadFileContent') {
        try {
          const fileUri = vscode.Uri.file(message.filepath);
          const fileExtension = path.extname(fileUri.fsPath).toLowerCase();
          const isMarkdown = fileExtension === '.md';
          
          // Check file size first (500KB limit)
          const stats = await vscode.workspace.fs.stat(fileUri);
          const maxFileSize = 500 * 1024; // 500KB
          
          if (stats.size > maxFileSize) {
            panel.webview.postMessage({
              type: 'fileContentError',
              filepath: message.filepath,
              error: `File is too large (${Math.round(stats.size / 1024)}KB). Please open files larger than 500KB in the editor.`
            });
            return;
          }
          
          // Read file content
          const contentBuffer = await vscode.workspace.fs.readFile(fileUri);
          const content = Buffer.from(contentBuffer).toString('utf8');
          
          // Process content based on file type
          let processedContent = content;
          if (isMarkdown) {
            processedContent = marked(content);
          }
          
          panel.webview.postMessage({
            type: 'fileContentLoaded',
            filepath: message.filepath,
            content: processedContent,
            fileType: isMarkdown ? 'markdown' : 'code'
          });
        } catch (error) {
          panel.webview.postMessage({
            type: 'fileContentError',
            filepath: message.filepath,
            error: `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`
          });
        }
      }
    });
  }
}
