// src/repositoryAnalyzer.js
const vscode = require('vscode');
const fs = require('fs').promises;
const path = require('path');

class RepositoryAnalyzer {
    constructor(geminiClient) {
        this.geminiClient = geminiClient;
        this.maxFileSize = 100000; // 100KB per file
        this.supportedExtensions = [
            '.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', 
            '.go', '.rs', '.rb', '.php', '.cs', '.swift', '.kt', '.scala',
            '.html', '.css', '.scss', '.json', '.yml', '.yaml', '.md'
        ];
        this.ignorePatterns = [
            'node_modules', 'dist', 'build', 'out', '.git', 
            'coverage', '__pycache__', '.vscode', '.idea',
            'vendor', 'target', 'bin', 'obj'
        ];
    }

    async analyzeFullRepository() {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        
        if (!workspaceFolder) {
            throw new Error('No workspace folder open');
        }

        const rootPath = workspaceFolder.uri.fsPath;
        
        // Show progress notification
        return vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Analyzing entire repository with Gemini...",
            cancellable: true
        }, async (progress, token) => {
            
            progress.report({ increment: 0, message: "Scanning files..." });
            
            // 1. Scan repository
            const files = await this.scanRepository(rootPath);
            
            if (files.length === 0) {
                throw new Error('No supported files found in repository');
            }
            
            progress.report({ increment: 20, message: `Found ${files.length} files` });
            
            // 2. Read file contents
            const fileContents = await this.readFiles(files, rootPath);
            
            progress.report({ increment: 40, message: "Building context..." });
            
            // 3. Build context for Gemini
            const context = this.buildRepositoryContext(fileContents, rootPath);
            
            progress.report({ increment: 60, message: "Analyzing with Gemini..." });
            
            // 4. Analyze with Gemini
            const analysis = await this.analyzeWithGemini(context);
            
            progress.report({ increment: 100, message: "Complete!" });
            
            return {
                files: fileContents,
                analysis: analysis,
                stats: {
                    totalFiles: files.length,
                    totalLines: fileContents.reduce((sum, f) => sum + f.lines, 0),
                    languages: [...new Set(fileContents.map(f => f.language))]
                }
            };
        });
    }

    async scanRepository(rootPath, currentPath = rootPath) {
        const files = [];
        
        try {
            const entries = await fs.readdir(currentPath, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(currentPath, entry.name);
                
                // Skip ignored directories
                if (this.shouldIgnore(entry.name)) {
                    continue;
                }
                
                if (entry.isDirectory()) {
                    // Recursively scan subdirectories
                    const subFiles = await this.scanRepository(rootPath, fullPath);
                    files.push(...subFiles);
                } else if (entry.isFile()) {
                    const ext = path.extname(entry.name);
                    if (this.supportedExtensions.includes(ext)) {
                        files.push(fullPath);
                    }
                }
            }
        } catch (error) {
            console.error(`Error scanning ${currentPath}:`, error);
        }
        
        return files;
    }

    shouldIgnore(name) {
        return this.ignorePatterns.some(pattern => 
            name === pattern || name.startsWith('.')
        );
    }

    async readFiles(filePaths, rootPath) {
        const fileContents = [];
        
        for (const filePath of filePaths) {
            try {
                const stats = await fs.stat(filePath);
                
                // Skip files that are too large
                if (stats.size > this.maxFileSize) {
                    continue;
                }
                
                const content = await fs.readFile(filePath, 'utf8');
                const relativePath = path.relative(rootPath, filePath);
                const ext = path.extname(filePath);
                
                fileContents.push({
                    path: relativePath,
                    content: content,
                    lines: content.split('\n').length,
                    size: stats.size,
                    language: this.getLanguageFromExtension(ext)
                });
                
            } catch (error) {
                console.error(`Error reading ${filePath}:`, error);
            }
        }
        
        return fileContents;
    }

    getLanguageFromExtension(ext) {
        const map = {
            '.js': 'JavaScript', '.ts': 'TypeScript', '.jsx': 'React',
            '.tsx': 'React TypeScript', '.py': 'Python', '.java': 'Java',
            '.cpp': 'C++', '.c': 'C', '.go': 'Go', '.rs': 'Rust',
            '.rb': 'Ruby', '.php': 'PHP', '.cs': 'C#', '.swift': 'Swift',
            '.kt': 'Kotlin', '.scala': 'Scala', '.html': 'HTML',
            '.css': 'CSS', '.scss': 'SCSS', '.json': 'JSON',
            '.yml': 'YAML', '.yaml': 'YAML', '.md': 'Markdown'
        };
        return map[ext] || 'Unknown';
    }

    buildRepositoryContext(fileContents, rootPath) {
        const projectName = path.basename(rootPath);
        
        // Build a comprehensive context
        let context = `# Repository Analysis: ${projectName}\n\n`;
        context += `Total Files: ${fileContents.length}\n`;
        context += `Total Lines: ${fileContents.reduce((sum, f) => sum + f.lines, 0)}\n\n`;
        
        context += `## File Structure:\n`;
        fileContents.forEach(file => {
            context += `- ${file.path} (${file.language}, ${file.lines} lines)\n`;
        });
        
        context += `\n## File Contents:\n\n`;
        
        // Include actual file contents (truncated if needed)
        fileContents.forEach(file => {
            context += `### ${file.path}\n`;
            context += `\`\`\`${file.language.toLowerCase()}\n`;
            
            // Truncate very long files
            const lines = file.content.split('\n');
            if (lines.length > 100) {
                context += lines.slice(0, 50).join('\n');
                context += `\n... (${lines.length - 100} lines omitted) ...\n`;
                context += lines.slice(-50).join('\n');
            } else {
                context += file.content;
            }
            
            context += `\n\`\`\`\n\n`;
        });
        
        return context;
    }

    async analyzeWithGemini(context) {
        const prompt = `You are analyzing an entire codebase. Provide a comprehensive analysis.

${context}

Please analyze this codebase and provide:

1. **Architecture Overview**: What is the overall structure and architecture pattern?
2. **Tech Stack**: What technologies, frameworks, and libraries are being used?
3. **Main Features**: What are the key features/functionality of this project?
4. **Code Quality**: Overall code quality assessment (1-10)
5. **Strengths**: Top 3 strengths of this codebase
6. **Issues**: Top 5 issues or areas for improvement
7. **Dependencies**: Key dependencies and how components interact
8. **Security Concerns**: Any potential security issues
9. **Performance Considerations**: Any performance bottlenecks or optimizations
10. **Recommendations**: Top 3 actionable recommendations for improvement

Format your response clearly with headers and bullet points.`;

        const response = await this.geminiClient.generateContent(prompt);
        return this.parseAnalysis(response);
    }

    parseAnalysis(response) {
        // Parse the Gemini response into structured data
        return {
            fullText: response,
            sections: this.extractSections(response)
        };
    }

    extractSections(text) {
        const sections = {};
        const lines = text.split('\n');
        let currentSection = 'overview';
        let currentContent = [];
        
        for (const line of lines) {
            if (line.startsWith('**') || line.startsWith('##')) {
                if (currentContent.length > 0) {
                    sections[currentSection] = currentContent.join('\n').trim();
                }
                currentSection = line.replace(/[*#]/g, '').trim().toLowerCase();
                currentContent = [];
            } else {
                currentContent.push(line);
            }
        }
        
        if (currentContent.length > 0) {
            sections[currentSection] = currentContent.join('\n').trim();
        }
        
        return sections;
    }

    async askQuestionAboutCodebase(question, previousContext = null) {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        
        if (!workspaceFolder) {
            throw new Error('No workspace folder open');
        }

        const rootPath = workspaceFolder.uri.fsPath;
        
        // If no previous context, analyze repository first
        let context = previousContext;
        if (!context) {
            const files = await this.scanRepository(rootPath);
            const fileContents = await this.readFiles(files, rootPath);
            context = this.buildRepositoryContext(fileContents, rootPath);
        }

        const prompt = `Based on this codebase:

${context}

User Question: ${question}

Please provide a detailed answer referencing specific files and code when relevant.`;

        return await this.geminiClient.generateContent(prompt);
    }

    async findRelatedFiles(searchTerm) {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        
        if (!workspaceFolder) {
            throw new Error('No workspace folder open');
        }

        const rootPath = workspaceFolder.uri.fsPath;
        const files = await this.scanRepository(rootPath);
        const fileContents = await this.readFiles(files, rootPath);
        
        // Build context
        const context = fileContents.map(f => 
            `${f.path}:\n${f.content.substring(0, 500)}`
        ).join('\n\n');

        const prompt = `Given this codebase structure and content:

${context}

Find all files related to: "${searchTerm}"

List the most relevant files and explain why they're related.`;

        return await this.geminiClient.generateContent(prompt);
    }
}

module.exports = RepositoryAnalyzer;