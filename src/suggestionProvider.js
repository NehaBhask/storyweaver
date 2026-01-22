const vscode = require('vscode');
const { CompletionItemKind, MarkdownString } = require('vscode');

class SuggestionProvider {
    constructor(geminiClient, configManager) {
        this.geminiClient = geminiClient;
        this.configManager = configManager;
        this.debounceTimer = null;
        this.lastRequestTime = 0;
        this.minRequestInterval = 2000; // 2 seconds between requests
        this.cache = new Map();
        this.maxCacheSize = 100;
        
        // Register the completion provider
        this.providerDisposable = vscode.languages.registerCompletionItemProvider(
            [
                { language: 'javascript' },
                { language: 'typescript' },
                { language: 'python' },
                { language: 'java' },
                { language: 'c' },
                { language: 'cpp' },
                { language: 'go' },
                { language: 'rust' },
                { language: 'ruby' },
                { language: 'php' },
                { language: 'csharp' }
            ],
            this,
            '.', // Trigger on dot
            ' ', // Trigger on space
            '(', // Trigger on opening parenthesis
            '{', // Trigger on opening brace
            '[', // Trigger on opening bracket
            ','  // Trigger on comma
        );
    }
    
    /**
     * Main method called by VS Code to provide completion items
     */
    async provideCompletionItems(document, position, token, context) {
        // Check if suggestions are enabled
        if (!this.configManager || !this.configManager.get('autoSuggest')) {
            return [];
        }
        
        // Rate limiting
        const now = Date.now();
        if (now - this.lastRequestTime < this.minRequestInterval) {
            return [];
        }
        
        // Validate document and position
        if (!document || !position) {
            return [];
        }
        
        if (!this.isValidPosition(document, position)) {
            return [];
        }
        
        this.lastRequestTime = now;
        
        try {
            // Get safe context around cursor
            const contextText = this.getContextText(document, position, 10, 5);
            
            if (!contextText || contextText.trim().length < 10) {
                return [];
            }
            
            // Get current word being typed
            const currentWord = this.getCurrentWord(document, position);
            
            // Check cache
            const cacheKey = this.getCacheKey(document, position, currentWord);
            if (this.cache.has(cacheKey)) {
                const cached = this.cache.get(cacheKey);
                if (this.isCacheValid(cached)) {
                    return cached.items;
                } else {
                    this.cache.delete(cacheKey);
                }
            }
            
            // Generate suggestions from Gemini
            const suggestions = await this.generateSuggestions(
                contextText,
                document.languageId,
                position,
                currentWord
            );
            
            if (suggestions && suggestions.length > 0) {
                // Cache the results
                this.cacheResults(cacheKey, suggestions);
                return suggestions;
            }
            
        } catch (error) {
            console.debug('Suggestion generation failed:', error.message);
        }
        
        return [];
    }
    
    /**
     * Validate that position is within document bounds
     */
    isValidPosition(document, position) {
        if (position.line < 0 || position.line >= document.lineCount) {
            console.warn(`Invalid line: ${position.line}, max: ${document.lineCount - 1}`);
            return false;
        }
        
        try {
            const line = document.lineAt(position.line);
            if (position.character < 0 || position.character > line.text.length) {
                console.warn(`Invalid character: ${position.character}, max: ${line.text.length}`);
                return false;
            }
        } catch (error) {
            console.error('Error validating position:', error);
            return false;
        }
        
        return true;
    }
    
    /**
     * Safely get context text around cursor position
     */
    getContextText(document, position, linesBefore = 10, linesAfter = 5) {
        try {
            const currentLine = position.line;
            const startLine = Math.max(0, currentLine - linesBefore);
            const endLine = Math.min(document.lineCount - 1, currentLine + linesAfter);
            
            const lines = [];
            
            for (let i = startLine; i <= endLine; i++) {
                try {
                    if (i >= 0 && i < document.lineCount) {
                        const lineText = document.lineAt(i).text;
                        
                        // Mark cursor position
                        if (i === currentLine) {
                            const beforeCursor = lineText.substring(0, position.character);
                            const afterCursor = lineText.substring(position.character);
                            lines.push(beforeCursor + '[CURSOR]' + afterCursor);
                        } else {
                            lines.push(lineText);
                        }
                    }
                } catch (lineError) {
                    console.debug(`Could not read line ${i}:`, lineError.message);
                }
            }
            
            return lines.join('\n');
            
        } catch (error) {
            console.error('Error getting context text:', error);
            return '';
        }
    }
    
    /**
     * Get the word currently being typed at cursor
     */
    getCurrentWord(document, position) {
        try {
            const wordRange = document.getWordRangeAtPosition(position);
            if (wordRange) {
                return document.getText(wordRange);
            }
        } catch (error) {
            console.debug('Could not get current word:', error.message);
        }
        return '';
    }
    
    /**
     * Generate cache key for position
     */
    getCacheKey(document, position, currentWord) {
        return `${document.uri.toString()}_${document.languageId}_${position.line}_${position.character}_${currentWord}`;
    }
    
    /**
     * Check if cached item is still valid (5 minutes TTL)
     */
    isCacheValid(cachedItem) {
        const TTL = 5 * 60 * 1000; // 5 minutes
        return (Date.now() - cachedItem.timestamp) < TTL;
    }
    
    /**
     * Cache suggestion results
     */
    cacheResults(key, items) {
        this.cache.set(key, {
            items: items,
            timestamp: Date.now()
        });
        
        // Limit cache size
        if (this.cache.size > this.maxCacheSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
    }
    
    /**
     * Generate suggestions using Gemini API
     */
    async generateSuggestions(context, language, position, currentWord) {
        const prompt = `You are a code completion assistant. Based on the code context below, suggest 3-5 relevant completions.

Language: ${language}
Current word being typed: "${currentWord}"
Cursor position: line ${position.line}, character ${position.character}

Code context (cursor marked with [CURSOR]):
\`\`\`${language}
${context}
\`\`\`

Provide completions in this exact format:
COMPLETION: [exact code to insert]
EXPLANATION: [brief explanation in one line]

Guidelines:
- Provide only the code that should be inserted, not the entire line
- Focus on method/function names, variable names, or completing statements
- Keep completions short and contextual
- Don't repeat code that's already there
- Only provide completions that make sense for the cursor position`;

        try {
            const response = await this.geminiClient.generateContent(prompt);
            return this.parseSuggestions(response, language);
        } catch (error) {
            console.error('Failed to generate suggestions from Gemini:', error);
            return [];
        }
    }
    
    /**
     * Parse Gemini response into VS Code completion items
     */
    parseSuggestions(response, language) {
        const suggestions = [];
        
        if (!response || typeof response !== 'string') {
            return suggestions;
        }
        
        const lines = response.split('\n');
        let currentCompletion = null;
        let currentExplanation = null;
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            
            if (trimmedLine.startsWith('COMPLETION:')) {
                // Save previous completion if exists
                if (currentCompletion && currentExplanation) {
                    suggestions.push(
                        this.createCompletionItem(currentCompletion, currentExplanation, language)
                    );
                }
                
                currentCompletion = trimmedLine.substring('COMPLETION:'.length).trim();
                currentExplanation = null;
                
            } else if (trimmedLine.startsWith('EXPLANATION:') && currentCompletion) {
                currentExplanation = trimmedLine.substring('EXPLANATION:'.length).trim();
            }
        }
        
        // Don't forget the last one
        if (currentCompletion && currentExplanation) {
            suggestions.push(
                this.createCompletionItem(currentCompletion, currentExplanation, language)
            );
        }
        
        // Fallback: try to extract code blocks if parsing failed
        if (suggestions.length === 0) {
            const codeBlockRegex = /```(?:\w+)?\n([\s\S]*?)\n```/g;
            let match;
            
            while ((match = codeBlockRegex.exec(response)) !== null && suggestions.length < 5) {
                const code = match[1].trim();
                if (code && code.length < 100) {
                    suggestions.push(
                        this.createCompletionItem(code, 'AI-generated suggestion', language)
                    );
                }
            }
        }
        
        return suggestions.slice(0, 5); // Limit to 5 suggestions
    }
    
    /**
     * Create a VS Code completion item
     */
    createCompletionItem(completion, explanation, language) {
        // Clean up the completion text
        const cleanCompletion = completion.replace(/^['"`]|['"`]$/g, '').trim();
        
        const item = new vscode.CompletionItem(
            cleanCompletion,
            CompletionItemKind.Snippet
        );
        
        item.detail = '🤖 Gemini AI Suggestion';
        
        const documentation = new MarkdownString();
        documentation.appendMarkdown(`**AI Suggestion**\n\n${explanation}`);
        documentation.isTrusted = true;
        item.documentation = documentation;
        
        item.insertText = cleanCompletion;
        
        // Sort AI suggestions below IntelliSense but above random text
        item.sortText = 'zzz_ai_' + cleanCompletion;
        
        // Characters that will commit the completion
        item.commitCharacters = [' ', '.', ',', ';', '(', ')', '{', '}'];
        
        return item;
    }
    
    /**
     * Clear the cache
     */
    clearCache() {
        this.cache.clear();
    }
    
    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxCacheSize,
            keys: Array.from(this.cache.keys())
        };
    }
    
    /**
     * Dispose of the provider and clean up resources
     */
    dispose() {
        if (this.providerDisposable) {
            this.providerDisposable.dispose();
        }
        this.clearCache();
        console.log('SuggestionProvider disposed');
    }
}

module.exports = SuggestionProvider;