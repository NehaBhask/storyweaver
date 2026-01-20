const vscode = require('vscode');
module.exports = class StatusBar {
    constructor() {
        this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
        this.item.text = '$(wand) StoryWeaver';
        this.item.show();
    }
};