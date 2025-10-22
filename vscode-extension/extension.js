const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

/**
 * VS Code Extension for Code Canvas
 * Embeds the Svelte 5 + XState webapp in a webview
 */

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('Code Canvas extension is now active');

    // Register command to open canvas editor
    let openEditor = vscode.commands.registerCommand('code-canvas.openEditor', async (uri) => {
        const panel = vscode.window.createWebviewPanel(
            'codeCanvasEditor',
            'Canvas Editor',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.file(path.join(context.extensionPath, '../webapp/dist'))
                ]
            }
        );

        // Get the webapp dist path
        const webappPath = path.join(context.extensionPath, '../webapp/dist');
        const htmlPath = path.join(webappPath, 'index.html');

        if (!fs.existsSync(htmlPath)) {
            vscode.window.showErrorMessage('Canvas webapp not built. Run: cd webapp && npm run build');
            return;
        }

        // Load HTML content
        let html = fs.readFileSync(htmlPath, 'utf-8');

        // Update resource URIs for webview
        const webviewUri = panel.webview.asWebviewUri(vscode.Uri.file(webappPath));
        html = html.replace(/\/assets\//g, `${webviewUri}/assets/`);
        html = html.replace(/src="\//g, `src="${webviewUri}/`);
        html = html.replace(/href="\//g, `href="${webviewUri}/`);

        panel.webview.html = html;

        // Handle messages from webview
        panel.webview.onDidReceiveMessage(
            message => {
                switch (message.type) {
                    case 'save':
                        handleSave(message.canvas);
                        break;
                    case 'load':
                        handleLoad(message.path);
                        break;
                }
            },
            undefined,
            context.subscriptions
        );
    });

    // Register command to create XState machine
    let createMachine = vscode.commands.registerCommand('code-canvas.createMachine', async () => {
        const name = await vscode.window.showInputBox({
            prompt: 'Enter machine name',
            placeHolder: 'myFeature'
        });

        if (!name) return;

        const initialState = await vscode.window.showInputBox({
            prompt: 'Enter initial state',
            placeHolder: 'idle',
            value: 'idle'
        });

        // Create machine file
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('No workspace folder open');
            return;
        }

        const machinesDir = path.join(workspaceFolder.uri.fsPath, 'src/machines');
        if (!fs.existsSync(machinesDir)) {
            fs.mkdirSync(machinesDir, { recursive: true });
        }

        const machineContent = `import { createMachine, assign } from 'xstate';

/**
 * ${name} Machine
 */
export const ${name}Machine = createMachine({
  id: '${name}',
  initial: '${initialState}',
  context: {},
  states: {
    ${initialState}: {
      on: {}
    }
  }
});
`;

        const filePath = path.join(machinesDir, `${name}Machine.js`);
        fs.writeFileSync(filePath, machineContent);

        // Open the file
        const doc = await vscode.workspace.openTextDocument(filePath);
        await vscode.window.showTextDocument(doc);

        vscode.window.showInformationMessage(`Created ${name}Machine.js`);
    });

    // Register command to visualize machine
    let visualizeMachine = vscode.commands.registerCommand('code-canvas.visualizeMachine', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor');
            return;
        }

        // TODO: Parse machine and visualize in canvas
        vscode.window.showInformationMessage('Machine visualization coming soon!');
    });

    context.subscriptions.push(openEditor, createMachine, visualizeMachine);
}

function handleSave(canvas) {
    // TODO: Implement save to file system
    vscode.window.showInformationMessage('Canvas saved!');
}

function handleLoad(path) {
    // TODO: Implement load from file system
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
