const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

class WebviewPanel {
    constructor(context) {
        this.context = context;
        this.panels = new Map();
    }
    
    createAnalysisPanel(analysis, title = 'Code Analysis') {
        if (this.panels.has('analysis')) {
            this.panels.get('analysis').dispose();
        }
        
        const panel = vscode.window.createWebviewPanel(
            'codementorAnalysis',
            title,
            vscode.ViewColumn.Beside,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.file(path.join(this.context.extensionPath, 'media')),
                    vscode.Uri.file(path.join(this.context.extensionPath, 'webview'))
                ]
            }
        );
        
        this.panels.set('analysis', panel);
        
        panel.webview.html = this.getAnalysisHtml(panel, analysis);
        
        panel.webview.onDidReceiveMessage(
            async (message) => {
                await this.handleWebviewMessage(message, panel);
            },
            undefined,
            this.context.subscriptions
        );
        
        panel.onDidDispose(
            () => {
                this.panels.delete('analysis');
            },
            null,
            this.context.subscriptions
        );
        
        return panel;
    }
    
    getAnalysisHtml(panel, analysis) {
        const styleUri = panel.webview.asWebviewUri(
            vscode.Uri.file(path.join(this.context.extensionPath, 'webview', 'analysis.css'))
        );
        
        const scriptUri = panel.webview.asWebviewUri(
            vscode.Uri.file(path.join(this.context.extensionPath, 'webview', 'analysis.js'))
        );
        
        if (!fs.existsSync(path.join(this.context.extensionPath, 'webview', 'analysis.css'))) {
            return this.getInlineAnalysisHtml(analysis);
        }
        
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Code Analysis</title>
            <link href="${styleUri}" rel="stylesheet">
            <style>
                :root {
                    --vscode-font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, sans-serif);
                    --border-color: var(--vscode-panel-border, #ccc);
                    --hover-bg: var(--vscode-list-hoverBackground, #f0f0f0);
                }
            </style>
        </head>
        <body>
            <div class="container">
                <header class="header">
                    <h1>🤖 Code Analysis</h1>
                    <div class="score-badge">
                        Score: <span class="score-value">${analysis.score || 7}</span>/10
                    </div>
                </header>
                
                <section class="summary">
                    <h2>📋 Summary</h2>
                    <p>${analysis.summary || 'No summary available.'}</p>
                </section>
                
                <div class="content-grid">
                    <section class="suggestions">
                        <h2>💡 Suggestions (${analysis.suggestions ? analysis.suggestions.length : 0})</h2>
                        ${this.generateSuggestionsHtml(analysis.suggestions)}
                    </section>
                    
                    <section class="issues">
                        <h2>⚠️ Issues (${analysis.issues ? analysis.issues.length : 0})</h2>
                        ${this.generateIssuesHtml(analysis.issues)}
                    </section>
                </div>
                
                <section class="actions">
                    <h2>🔧 Quick Actions</h2>
                    <div class="action-buttons">
                        <button class="btn btn-primary" onclick="vscode.postMessage({command: 'applyBestPractices'})">
                            Apply Best Practices
                        </button>
                        <button class="btn btn-secondary" onclick="vscode.postMessage({command: 'showDetailedReport'})">
                            Detailed Report
                        </button>
                        <button class="btn btn-outline" onclick="vscode.postMessage({command: 'copyReport'})">
                            Copy to Clipboard
                        </button>
                    </div>
                </section>
            </div>
            
            <script src="${scriptUri}"></script>
            <script>
                const vscode = acquireVsCodeApi();
            </script>
        </body>
        </html>`;
    }
    
    getInlineAnalysisHtml(analysis) {
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Code Analysis</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
                    margin: 0;
                    padding: 20px;
                    background: var(--vscode-editor-background, #1e1e1e);
                    color: var(--vscode-editor-foreground, #d4d4d4);
                }
                
                .container {
                    max-width: 1200px;
                    margin: 0 auto;
                }
                
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                    padding-bottom: 15px;
                    border-bottom: 1px solid var(--border-color, #444);
                }
                
                h1, h2 {
                    color: var(--vscode-titleBar-activeForeground, #ffffff);
                    margin-top: 0;
                }
                
                .score-badge {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-weight: bold;
                    font-size: 1.1em;
                }
                
                .score-value {
                    font-size: 1.3em;
                }
                
                .content-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 30px;
                    margin: 30px 0;
                }
                
                @media (max-width: 768px) {
                    .content-grid {
                        grid-template-columns: 1fr;
                    }
                }
                
                .suggestions, .issues, .summary, .actions {
                    background: var(--vscode-sideBar-background, #252526);
                    border-radius: 8px;
                    padding: 20px;
                    margin-bottom: 20px;
                    border: 1px solid var(--border-color, #444);
                }
                
                .suggestion-item, .issue-item {
                    padding: 12px;
                    margin: 10px 0;
                    border-left: 4px solid;
                    background: var(--vscode-editor-inactiveSelectionBackground, #2a2d2e);
                    border-radius: 4px;
                    transition: background 0.2s;
                }
                
                .suggestion-item:hover, .issue-item:hover {
                    background: var(--hover-bg, #323232);
                }
                
                .suggestion-item {
                    border-left-color: #4CAF50;
                }
                
                .issue-item {
                    border-left-color: #f44336;
                }
                
                .suggestion-title, .issue-title {
                    font-weight: bold;
                    margin-bottom: 5px;
                    color: var(--vscode-foreground, #cccccc);
                }
                
                .suggestion-desc, .issue-desc {
                    font-size: 0.9em;
                    color: var(--vscode-descriptionForeground, #999);
                    margin-bottom: 5px;
                }
                
                .impact-badge {
                    display: inline-block;
                    padding: 2px 8px;
                    border-radius: 10px;
                    font-size: 0.8em;
                    font-weight: bold;
                    text-transform: uppercase;
                }
                
                .impact-high { background: #f44336; color: white; }
                .impact-medium { background: #ff9800; color: black; }
                .impact-low { background: #4CAF50; color: white; }
                
                .action-buttons {
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                }
                
                .btn {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: bold;
                    transition: opacity 0.2s;
                }
                
                .btn:hover {
                    opacity: 0.9;
                }
                
                .btn-primary {
                    background: var(--vscode-button-background, #007acc);
                    color: var(--vscode-button-foreground, white);
                }
                
                .btn-secondary {
                    background: var(--vscode-button-secondaryBackground, #3a3d41);
                    color: var(--vscode-button-secondaryForeground, white);
                }
                
                .btn-outline {
                    background: transparent;
                    border: 1px solid var(--border-color, #444);
                    color: var(--vscode-foreground, #cccccc);
                }
            </style>
        </head>
        <body>
            <div class="container">
                <header class="header">
                    <h1>🤖 Code Analysis</h1>
                    <div class="score-badge">
                        Score: <span class="score-value">${analysis.score || 7}</span>/10
                    </div>
                </header>
                
                <section class="summary">
                    <h2>📋 Summary</h2>
                    <p>${analysis.summary || 'No summary available.'}</p>
                </section>
                
                <div class="content-grid">
                    <section class="suggestions">
                        <h2>💡 Suggestions (${analysis.suggestions ? analysis.suggestions.length : 0})</h2>
                        ${this.generateSuggestionsHtml(analysis.suggestions)}
                    </section>
                    
                    <section class="issues">
                        <h2>⚠️ Issues (${analysis.issues ? analysis.issues.length : 0})</h2>
                        ${this.generateIssuesHtml(analysis.issues)}
                    </section>
                </div>
                
                <section class="actions">
                    <h2>🔧 Quick Actions</h2>
                    <div class="action-buttons">
                        <button class="btn btn-primary" onclick="vscode.postMessage({command: 'applyBestPractices'})">
                            Apply Best Practices
                        </button>
                        <button class="btn btn-secondary" onclick="vscode.postMessage({command: 'showDetailedReport'})">
                            Detailed Report
                        </button>
                        <button class="btn btn-outline" onclick="vscode.postMessage({command: 'copyReport'})">
                            Copy to Clipboard
                        </button>
                    </div>
                </section>
            </div>
            
            <script>
                const vscode = acquireVsCodeApi();
            </script>
        </body>
        </html>`;
    }
    
    generateSuggestionsHtml(suggestions) {
        if (!suggestions || suggestions.length === 0) {
            return '<div class="no-data">No suggestions available.</div>';
        }
        
        return suggestions.map(suggestion => `
            <div class="suggestion-item">
                <div class="suggestion-title">${suggestion.title || 'Suggestion'}</div>
                <div class="suggestion-desc">${suggestion.description || ''}</div>
                ${suggestion.impact ? `
                    <span class="impact-badge impact-${suggestion.impact.toLowerCase()}">
                        ${suggestion.impact}
                    </span>
                ` : ''}
            </div>
        `).join('');
    }
    
    generateIssuesHtml(issues) {
        if (!issues || issues.length === 0) {
            return '<div class="no-data">No issues found! 🎉</div>';
        }
        
        return issues.map(issue => `
            <div class="issue-item">
                <div class="issue-title">${typeof issue === 'string' ? issue : issue.title || 'Issue'}</div>
                ${typeof issue !== 'string' && issue.description ? `
                    <div class="issue-desc">${issue.description}</div>
                ` : ''}
                ${typeof issue !== 'string' && issue.severity ? `
                    <span class="impact-badge impact-${issue.severity.toLowerCase()}">
                        ${issue.severity}
                    </span>
                ` : ''}
            </div>
        `).join('');
    }
    
    async handleWebviewMessage(message, panel) {
        switch (message.command) {
            case 'applyBestPractices':
                await vscode.commands.executeCommand('codementor.applyBestPractices');
                panel.webview.postMessage({ 
                    command: 'showNotification', 
                    text: 'Applying best practices...' 
                });
                break;
                
            case 'showDetailedReport':
                panel.webview.postMessage({ 
                    command: 'toggleRawData' 
                });
                break;
                
            case 'copyReport':
                const analysisData = JSON.parse(message.data || '{}');
                await vscode.env.clipboard.writeText(JSON.stringify(analysisData, null, 2));
                vscode.window.showInformationMessage('Analysis report copied to clipboard!');
                break;
        }
    }
    
    createQuickSuggestionPanel(suggestion, language) {
        const panel = vscode.window.createWebviewPanel(
            'codementorQuickSuggestion',
            'AI Suggestion',
            vscode.ViewColumn.Beside,
            {
                enableScripts: true,
                retainContextWhenHidden: false
            }
        );
        
        panel.webview.html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { padding: 20px; font-family: var(--vscode-font-family); }
                .suggestion { 
                    background: var(--vscode-editor-background);
                    padding: 20px;
                    border-radius: 8px;
                    border-left: 4px solid #4CAF50;
                }
                .code-block {
                    background: var(--vscode-textCodeBlock-background);
                    padding: 15px;
                    border-radius: 4px;
                    font-family: 'Consolas', monospace;
                    margin: 10px 0;
                    white-space: pre-wrap;
                }
                .actions { margin-top: 20px; }
                button {
                    padding: 8px 16px;
                    margin-right: 10px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                }
            </style>
        </head>
        <body>
            <div class="suggestion">
                <h3>🤖 AI Suggestion for ${language}</h3>
                <p>${suggestion.explanation || 'Here is a suggested improvement:'}</p>
                <div class="code-block">${suggestion.code}</div>
                <div class="actions">
                    <button onclick="applySuggestion()">Apply</button>
                    <button onclick="copySuggestion()">Copy</button>
                    <button onclick="dismiss()">Dismiss</button>
                </div>
            </div>
            <script>
                const vscode = acquireVsCodeApi();
                function applySuggestion() {
                    vscode.postMessage({ command: 'applySuggestion', code: \`${suggestion.code}\` });
                }
                function copySuggestion() {
                    vscode.postMessage({ command: 'copySuggestion', code: \`${suggestion.code}\` });
                }
                function dismiss() {
                    vscode.postMessage({ command: 'dismiss' });
                }
            </script>
        </body>
        </html>`;
        
        return panel;
    }
    
    dispose() {
        for (const panel of this.panels.values()) {
            panel.dispose();
        }
        this.panels.clear();
    }
}

module.exports = WebviewPanel;