const vscode = require('vscode');

class Logger {
    constructor() {
        this.outputChannel = vscode.window.createOutputChannel('Story weaver');
        this.enabled = true;
    }
    
    log(message, level = 'INFO') {
        if (!this.enabled) return;
        
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${level}] ${message}`;
        
        this.outputChannel.appendLine(logMessage);
        
        if (level === 'ERROR') {
            console.error(logMessage);
        } else if (level === 'WARN') {
            console.warn(logMessage);
        } else {
            console.log(logMessage);
        }
    }
    
    info(message) {
        this.log(message, 'INFO');
    }
    
    warn(message) {
        this.log(message, 'WARN');
    }
    
    error(message) {
        this.log(message, 'ERROR');
    }
    
    debug(message) {
        this.log(message, 'DEBUG');
    }
    
    show() {
        this.outputChannel.show();
    }
    
    hide() {
        this.outputChannel.hide();
    }
    
    clear() {
        this.outputChannel.clear();
    }
    
    dispose() {
        this.outputChannel.dispose();
    }
}

module.exports = Logger;