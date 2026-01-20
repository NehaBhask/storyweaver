const vscode = require('vscode');

class SuggestionWidget {
    constructor() {
        this.decorationType = vscode.window.createTextEditorDecorationType({
            after: {
                margin: '0 0 0 1em',
                color: '#88888888'
            },
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
        });
        
        this.suggestions = new Map();
    }
    
    showSuggestion(editor, position, suggestion) {
        const range = new vscode.Range(position, position);
        
        const decoration = {
            range: range,
            renderOptions: {
                after: {
                    contentText: `💡 ${suggestion}`,
                    color: '#4CAF50'
                }
            }
        };
        
        editor.setDecorations(this.decorationType, [decoration]);
        
        // Store suggestion for this position
        const key = `${editor.document.uri.toString()}:${position.line}:${position.character}`;
        this.suggestions.set(key, {
            suggestion: suggestion,
            range: range
        });
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            this.clearSuggestion(editor, position);
        }, 5000);
    }
    
    clearSuggestion(editor, position) {
        const key = `${editor.document.uri.toString()}:${position.line}:${position.character}`;
        this.suggestions.delete(key);
        editor.setDecorations(this.decorationType, []);
    }
    
    clearAll(editor) {
        const uri = editor.document.uri.toString();
        for (const key of this.suggestions.keys()) {
            if (key.startsWith(uri)) {
                this.suggestions.delete(key);
            }
        }
        editor.setDecorations(this.decorationType, []);
    }
    
    dispose() {
        this.decorationType.dispose();
        this.suggestions.clear();
    }
}

module.exports = SuggestionWidget;