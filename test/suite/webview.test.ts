import * as assert from 'assert';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as vscode from 'vscode';
import * as path from 'path';
import { OpenSpecWebviewProvider } from '../../src/providers/webviewProvider';
import { TreeItemData } from '../../src/types';

suite('Webview Provider Test Suite', () => {
  let webviewProvider: OpenSpecWebviewProvider;
  let tempRoot: string;
  let testChangePath: string;
  const testExtensionUri = vscode.Uri.file(path.join(__dirname, '../../../'));

  suiteSetup(async () => {
    tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'openspec-webview-test-'));
    testChangePath = path.join(tempRoot, 'sample-change');

    await fs.mkdir(path.join(testChangePath, 'specs', 'sample-capability'), { recursive: true });
    await fs.writeFile(path.join(testChangePath, 'proposal.md'), '# Proposal\n\nSample proposal\n', 'utf8');
    await fs.writeFile(path.join(testChangePath, 'design.md'), '# Design\n\nSample design\n', 'utf8');
    await fs.writeFile(path.join(testChangePath, 'tasks.md'), '## Tasks\n\n- [ ] 1.1 Sample task\n', 'utf8');
    await fs.writeFile(path.join(testChangePath, 'specs', 'sample-capability', 'spec.md'), '## Purpose\n\nSample spec\n', 'utf8');
  });

  suiteTeardown(async () => {
    await fs.rm(tempRoot, { recursive: true, force: true });
  });

  setup(() => {
    webviewProvider = new OpenSpecWebviewProvider(testExtensionUri);
  });

  test('Should create webview provider', () => {
    assert.ok(webviewProvider);
  });

  test('Should generate file links with correct attributes', async () => {
    const testItem: TreeItemData = {
      id: 'test-change',
      label: 'Test Change',
      path: testChangePath,
      type: 'change',
      metadata: { isActive: true }
    };

    const mockWebview: vscode.Webview = {
      asWebviewUri: (uri: vscode.Uri) => uri.toString(),
      cspSource: 'test-csp',
      html: ''
    } as any;

    const htmlContent = await (webviewProvider as any).getHtmlContent(mockWebview, testItem);

    assert.ok(htmlContent.includes('artifact-open'), 'HTML should contain artifact open buttons');
    assert.ok(!htmlContent.includes('data-copy-artifact-snippet'), 'HTML should not contain removed copy snippet controls');
  });

  test('Should handle file open messages correctly', async () => {
    const testItem: TreeItemData = {
      id: 'test-change',
      label: 'Test Change',
      path: testChangePath,
      type: 'change',
      metadata: { isActive: true }
    };

    let receivedMessage: any = null;
    const mockPanel: vscode.WebviewPanel = {
      webview: {
        onDidReceiveMessage: (callback: (message: any) => any) => {
          const testMessage = {
            type: 'openFile',
            uri: vscode.Uri.file(path.join(testItem.path!, 'proposal.md')).toString()
          };
          receivedMessage = callback(testMessage);
        }
      }
    } as any;

    (webviewProvider as any).setupWebviewMessageHandling(mockPanel, testItem, 'details');

    assert.ok(receivedMessage !== null, 'Message handling should be set up');
  });

  test('Should render artifact open controls', async () => {
    const testItem: TreeItemData = {
      id: 'test-change',
      label: 'Test Change',
      path: testChangePath,
      type: 'change',
      metadata: { isActive: true }
    };

    const mockWebview: vscode.Webview = {
      asWebviewUri: (uri: vscode.Uri) => uri.toString(),
      cspSource: 'test-csp',
      html: ''
    } as any;

    const htmlContent = await (webviewProvider as any).getHtmlContent(mockWebview, testItem);
    assert.ok(htmlContent.includes('Open proposal.md'), 'HTML should contain open controls for artifacts');
    assert.ok(!htmlContent.includes('Copy step'), 'HTML should not contain removed copy controls for artifacts');
  });

  test('Should render workspace spec content', async () => {
    const testItem: TreeItemData = {
      id: 'test-spec',
      label: 'sample-capability (1 requirements)',
      path: path.join(testChangePath, 'specs', 'sample-capability', 'spec.md'),
      type: 'spec',
      metadata: { requirementCount: 1 }
    };

    const mockWebview: vscode.Webview = {
      asWebviewUri: (uri: vscode.Uri) => uri.toString(),
      cspSource: 'test-csp',
      html: ''
    } as any;

    const htmlContent = await (webviewProvider as any).getHtmlContent(mockWebview, testItem);
    assert.ok(htmlContent.includes('Specification'), 'HTML should contain a specification section');
    assert.ok(htmlContent.includes('Sample spec'), 'HTML should render spec content');
    assert.ok(htmlContent.includes('Open spec.md'), 'HTML should contain open control for spec file');
  });
});
