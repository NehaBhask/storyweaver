const vscode = require('vscode');
const { CompletionItemKind, MarkdownString } = require('vscode');

class SuggestionProvider {
    constructor(geminiClient, configManager) {
        this.geminiClient = geminiClient;
        this.configManager = configManager;
        this.debounceTimer = null;
        this.lastRequestTime = 0;
        this.minRequestInterval = 2000;
        this.cache = new Map();
        
        this.providerDisposable = vscode.languages.registerCompletionItemProvider(
            [
                { language: 'javascript' },
                { language: 'typescript' },
                { language: 'python' },
                { language: 'java' },
                { language: 'c' },
                { language: 'cpp' },
                { language: 'go' },
                { language: 'rust' }
            ],
            this,
            '.',
            ' ',
            '(',
            '{',
            '['
        );
    }
    
    async provideCompletionItems(document, position, token, context) {
        if (!this.configManager.get('autoSuggest')) {
            return [];
        }
        
        const now = Date.now();
        if (now - this.lastRequestTime < this.minRequestInterval) {
            return [];
        }
        
        this.lastRequestTime = now;
        
        try {
            const line = position.line;
            const startLine = Math.max(0, line - 5);
            const endLine = Math.min(document.lineCount, line + 5);
            
            let contextText = '';
            for (let i = startLine; i <= endLine; i++) {
                contextText += document.lineAt(i).text + '\n';
            }
            
            const wordRange = document.getWordRangeAtPosition(position);
            const currentWord = wordRange ? document.getText(wordRange) : '';
            
            const cacheKey = `${document.languageId}_${position.line}_${position.character}_${currentWord}`;
            
            if (this.cache.has(cacheKey)) {
                return this.cache.get(cacheKey);
            }
            
            const suggestions = await this.generateSuggestions(
                contextText,
                document.languageId,
                position,
                currentWord
            );
            
            if (suggestions && suggestions.length > 0) {
                this.cache.set(cacheKey, suggestions);
                
                if (this.cache.size > 100) {
                    const firstKey = this.cache.keys().next().value;
                    this.cache.delete(firstKey);
                }
                
                return suggestions;
            }
            
        } catch (error) {
            console.debug('Suggestion generation failed:', error.message);
        }
        
        return [];
    }
    
    async generateSuggestions(context, language, position, currentWord) {
        const prompt = `Based on this ${language} code context, suggest completions for the current position.
        Current word: "${currentWord}"
        Cursor position: line ${position.line}, character ${position.character}
        
        Code context:
        \`\`\`${language}
        ${context}
        \`\`\`
        
        Provide 3-5 relevant code completions. Format each as:
        COMPLETION: [the actual code to insert]
        EXPLANATION: [brief explanation]
        
        Focus on:
        1. Method/function completions
        2. Variable names
        3. API calls
        4. Syntax completion`;
        
        try {
            const response = await this.geminiClient.generateContent(
                prompt,
                '',
                this.configManager.get('temperature')
            );
            
            return this.parseSuggestions(response, language);
        } catch (error) {
            console.error('Failed to generate suggestions:', error);
            return [];
        }
    }
    
    parseSuggestions(response, language) {
        const suggestions = [];
        const lines = response.split('\n');
        
        let currentCompletion = null;
        let currentExplanation = null;
        
        for (const line of lines) {
            if (line.startsWith('COMPLETION:')) {
                if (currentCompletion && currentExplanation) {
                    suggestions.push(this.createCompletionItem(
                        currentCompletion,
                        currentExplanation,
                        language
                    ));
                }
                
                currentCompletion = line.substring(11).trim();
                currentExplanation = null;
            } else if (line.startsWith('EXPLANATION:') && currentCompletion) {
                currentExplanation = line.substring(12).trim();
            }
        }
        
        if (currentCompletion && currentExplanation) {
            suggestions.push(this.createCompletionItem(
                currentCompletion,
                currentExplanation,
                language
            ));
        }
        
        if (suggestions.length === 0 && response.trim()) {
            const codeBlockRegex = /```(?:\w+)?\n([\s\S]*?)\n```/g;
            let match;
            
            while ((match = codeBlockRegex.exec(response)) !== null && suggestions.length < 5) {
                const code = match[1].trim();
                if (code && code.length < 100) {
                    suggestions.push(this.createCompletionItem(
                        code,
                        'AI-generated suggestion',
                        language
                    ));
                }
            }
        }
        
        return suggestions.slice(0, 5);
    }
    
    createCompletionItem(completion, explanation, language) {
        const item = new vscode.CompletionItem(
            completion,
            CompletionItemKind.Snippet
        );
        
        item.detail = '🤖 AI Suggestion';
        item.documentation = new MarkdownString(explanation);
        item.insertText = completion;
        item.sortText = 'zzz';
        
        item.commitCharacters = [' ', '.', ',', ';', '('];
        
        return item;
    }
    
    getContextText(document, position, linesBefore = 10, linesAfter = 5) {
        const startLine = Math.max(0, position.line - linesBefore);
        const endLine = Math.min(document.lineCount - 1, position.line + linesAfter);
        
        let context = '';
        for (let i = startLine; i <= endLine; i++) {
            const lineText = document.lineAt(i).text;
            if (i === position.line) {
                context += lineText.substring(0, position.character) + '[CURSOR]';
                if (position.character < lineText.length) {
                    context += lineText.substring(position.character);
                }
            } else {
                context += lineText;
            }
            context += '\n';
        }
        
        return context;
    }
    
    clearCache() {
        this.cache.clear();
    }
    
    dispose() {
        if (this.providerDisposable) {
            this.providerDisposable.dispose();
        }
    }
}

module.exports = SuggestionProvider;