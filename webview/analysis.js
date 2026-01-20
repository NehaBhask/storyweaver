// Get the vscode API
const vscode = acquireVsCodeApi();

// DOM Elements
const scoreElement = document.getElementById('scoreValue');
const summaryElement = document.getElementById('summaryText');
const suggestionsList = document.getElementById('suggestionsList');
const issuesList = document.getElementById('issuesList');
const suggestionCount = document.getElementById('suggestionCount');
const issueCount = document.getElementById('issueCount');
const rawDataSection = document.getElementById('rawDataSection');
const rawDataElement = document.getElementById('rawData');

// Buttons
const applyBestPracticesBtn = document.getElementById('applyBestPractices');
const showDetailedReportBtn = document.getElementById('showDetailedReport');
const copyReportBtn = document.getElementById('copyReport');

// Current analysis data
let currentAnalysis = null;

// Handle messages from the extension
window.addEventListener('message', event => {
    const message = event.data;
    
    switch (message.command) {
        case 'updateAnalysis':
            updateAnalysisUI(message.data);
            break;
            
        case 'showNotification':
            showNotification(message.text, message.type);
            break;
            
        case 'toggleRawData':
            toggleRawData();
            break;
    }
});

// Update the UI with analysis data
function updateAnalysisUI(analysis) {
    currentAnalysis = analysis;
    
    // Update scores and counts
    scoreElement.textContent = analysis.score || '?';
    summaryElement.textContent = analysis.summary || 'No summary available.';
    suggestionCount.textContent = analysis.suggestions ? analysis.suggestions.length : 0;
    issueCount.textContent = analysis.issues ? analysis.issues.length : 0;
    
    // Update suggestions list
    suggestionsList.innerHTML = '';
    if (analysis.suggestions && analysis.suggestions.length > 0) {
        analysis.suggestions.forEach(suggestion => {
            const suggestionElement = createSuggestionElement(suggestion);
            suggestionsList.appendChild(suggestionElement);
        });
    } else {
        suggestionsList.innerHTML = '<div class="no-data">No suggestions available.</div>';
    }
    
    // Update issues list
    issuesList.innerHTML = '';
    if (analysis.issues && analysis.issues.length > 0) {
        analysis.issues.forEach(issue => {
            const issueElement = createIssueElement(issue);
            issuesList.appendChild(issueElement);
        });
    } else {
        issuesList.innerHTML = '<div class="no-data">No issues found! 🎉</div>';
    }
    
    // Update raw data
    rawDataElement.textContent = JSON.stringify(analysis, null, 2);
}

// Create a suggestion element
function createSuggestionElement(suggestion) {
    const div = document.createElement('div');
    div.className = 'suggestion-item';
    
    const title = document.createElement('div');
    title.className = 'suggestion-title';
    title.textContent = suggestion.title || 'Suggestion';
    
    const desc = document.createElement('div');
    desc.className = 'suggestion-desc';
    desc.textContent = suggestion.description || '';
    
    div.appendChild(title);
    div.appendChild(desc);
    
    if (suggestion.impact) {
        const impact = document.createElement('span');
        impact.className = `impact-badge impact-${suggestion.impact.toLowerCase()}`;
        impact.textContent = suggestion.impact;
        div.appendChild(impact);
    }
    
    // Add click handler to apply suggestion
    div.addEventListener('click', () => {
        vscode.postMessage({
            command: 'applySuggestion',
            suggestion: suggestion
        });
    });
    
    return div;
}

// Create an issue element
function createIssueElement(issue) {
    const div = document.createElement('div');
    div.className = 'issue-item';
    
    if (typeof issue === 'string') {
        div.textContent = issue;
    } else {
        const title = document.createElement('div');
        title.className = 'issue-title';
        title.textContent = issue.title || 'Issue';
        div.appendChild(title);
        
        if (issue.description) {
            const desc = document.createElement('div');
            desc.className = 'issue-desc';
            desc.textContent = issue.description;
            div.appendChild(desc);
        }
        
        if (issue.severity) {
            const severity = document.createElement('span');
            severity.className = `impact-badge impact-${issue.severity.toLowerCase()}`;
            severity.textContent = issue.severity;
            div.appendChild(severity);
        }
    }
    
    // Add click handler to fix issue
    div.addEventListener('click', () => {
        vscode.postMessage({
            command: 'fixIssue',
            issue: issue
        });
    });
    
    return div;
}

// Show notification
function showNotification(text, type = 'info') {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = text;
    
    // Style based on type
    if (type === 'error') {
        notification.style.backgroundColor = '#f44336';
    } else if (type === 'success') {
        notification.style.backgroundColor = '#4CAF50';
    } else {
        notification.style.backgroundColor = '#2196F3';
    }
    
    notification.style.cssText += `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        color: white;
        border-radius: 6px;
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Toggle raw data section
function toggleRawData() {
    if (rawDataSection.style.display === 'none') {
        rawDataSection.style.display = 'block';
    } else {
        rawDataSection.style.display = 'none';
    }
}

// Copy report to clipboard
function copyReport() {
    if (!currentAnalysis) return;
    
    const report = {
        score: currentAnalysis.score,
        summary: currentAnalysis.summary,
        suggestions: currentAnalysis.suggestions,
        issues: currentAnalysis.issues,
        timestamp: new Date().toISOString()
    };
    
    vscode.postMessage({
        command: 'copyReport',
        data: JSON.stringify(report, null, 2)
    });
    
    showNotification('Report copied to clipboard!', 'success');
}

// Event listeners for buttons
applyBestPracticesBtn.addEventListener('click', () => {
    vscode.postMessage({
        command: 'applyBestPractices'
    });
});

showDetailedReportBtn.addEventListener('click', toggleRawData);
copyReportBtn.addEventListener('click', copyReport);

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .no-data {
        text-align: center;
        padding: 40px;
        color: #999;
        font-style: italic;
    }
    
    .suggestion-item, .issue-item {
        cursor: pointer;
        transition: transform 0.2s;
    }
    
    .suggestion-item:hover, .issue-item:hover {
        transform: translateX(5px);
    }
`;
document.head.appendChild(style);

// Request initial data when page loads
window.addEventListener('load', () => {
    vscode.postMessage({
        command: 'getInitialData'
    });
});