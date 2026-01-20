const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up CodeMentor AI in VS Code...');

// Create directories
const dirs = [
    'src/ui',
    'src/utils',
    'webview',
    'media'
];

dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✓ Created directory: ${dir}`);
    }
});

// Create minimal package.json if not exists
if (!fs.existsSync('package.json')) {
    const packageJson = {
        name: "storyweaver",
        displayName: "CodeMentor AI",
        description: "AI-powered pair programming with Gemini 3",
        version: "1.0.0",
        engines: { "vscode": "^1.60.0" },
        categories: ["Programming Languages", "Snippets", "Machine Learning"],
        activationEvents: ["onStartupFinished"],
        main: "./extension.js",
        contributes: {
            commands: [
                {
                    command: "codementor.analyzeCode",
                    title: "Analyze Current Code"
                }
            ]
        },
        dependencies: {
            "@google/genai": "^0.5.0"
        }
    };
    
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
    console.log('✓ Created package.json');
}

console.log('\n✅ Setup complete!');
console.log('\nNext steps:');
console.log('1. Open Terminal in VS Code (Ctrl+`)');
console.log('2. Run: npm install');
console.log('3. Create .env file with: GEMINI_API_KEY=your_key_here');
console.log('4. Press F5 to run extension!');