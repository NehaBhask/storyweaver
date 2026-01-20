# StoryWeaver - Gemini 3 VS Code Extension
Your whole stack, one conversation.
An AI-powered VS Code extension that understands your entire codebase at once, not just single files. Built with Google's Gemini API.

🚀 Killer Feature: Full Repository Analysis
While other AI assistants analyze one file at a time, StoryWeaver analyzes your entire repository simultaneously using Gemini's massive 2M token context window.
What makes this unique?

📊 Instant codebase understanding - Analyze 100+ files in seconds
🔍 Cross-file intelligence - Ask questions that span multiple files
🗺️ Architecture mapping - Automatic architecture and dependency analysis
💬 Natural language queries - "How does authentication flow through the system?"
🎯 Smart file finding - Find all files related to any feature


✨ Features
1. 🔬 Analyze Entire Repository
Command: StoryWeaver: Analyze Entire Repository

Scans all supported files in your workspace
Generates comprehensive architecture overview
Identifies tech stack, patterns, and dependencies
Provides actionable recommendations

Demo:

Open any project in VS Code
Press Ctrl+Shift+P → "StoryWeaver: Analyze Entire Repository"
Get instant insights about your entire codebase

2. 💬 Ask Questions About Your Codebase
Command: StoryWeaver: Ask Question About Codebase

Ask natural language questions about your code
Get answers that reference specific files
Understand complex flows across multiple files

Examples:

"How does user authentication work?"
"Where is the payment processing logic?"
"What database models are used for the user system?"

3. 🎯 Find Related Files
Command: StoryWeaver: Find Related Files

Search for files by feature or concept
AI-powered relevance ranking
Instant navigation to related code

4. 📝 Explain Selected Code
Right-click selection → "StoryWeaver: Explain Selected Code"

Select any code snippet
Get instant, clear explanations
Perfect for understanding unfamiliar code

5. 🔍 Analyze Current File
Command: StoryWeaver: Analyze Current File

Code quality scoring
Suggestions for improvement
Issue detection


🎬 Quick Start
1. Install
bash# Clone the repository
git clone https://github.com/NehaBhask/storyweaver
cd storyweaver

# Install dependencies
npm install
2. Get Gemini API Key

Visit Google AI Studio
Create a free API key
Copy your key

3. Configure
Create a .env file:
envGEMINI_API_KEY=your_api_key_here
4. Run
Press F5 in VS Code to launch the extension in development mode

🎯 Use Cases
For Learning

Understand legacy code - Analyze unfamiliar codebases instantly
Learn architecture patterns - See how real projects are structured
Study best practices - Get AI-powered insights on code quality

For Development

Onboard faster - Understand new projects in minutes, not days
Debug smarter - Find all related files when tracking down bugs
Refactor confidently - Understand dependencies before making changes

For Code Review

Comprehensive reviews - Analyze entire PRs in context
Security audits - AI-powered vulnerability detection
Architecture validation - Ensure changes align with overall structure


🛠️ How It Works

Scan: Recursively scans your workspace for supported files
Context Building: Aggregates file contents into comprehensive context
AI Analysis: Sends to Gemini with 2M token context window
Structured Output: Parses and presents insights in clean UI

Supported Languages
JavaScript • TypeScript • Python • Java • C/C++ • Go • Rust • Ruby • PHP • C# • Swift • Kotlin • Scala • HTML • CSS • YAML • JSON • Markdown

📊 Technical Details

AI Model: Google Gemini 1.5 Flash/Pro
Context Window: Up to 2 million tokens
Max Files: Unlimited (with smart truncation)
Performance: Analyzes 100+ file repos in ~10 seconds


🎓 Built for Google DeepMind Gemini API Developer Competition
This project showcases Gemini's unique capabilities:
✅ 2M Token Context - Analyzes entire codebases at once
✅ Multimodal Future - Ready for screenshot-based debugging
✅ Fast Inference - Real-time insights on large projects
✅ Production Ready - Built on official Google Gemini SDK

🏗️ Project Structure
storyweaver/
├── extension.js              # Main extension entry point
├── src/
│   ├── geminiClient.js       # Gemini API integration
│   ├── repositoryAnalyzer.js # Full repo analysis
│   ├── codeAnalyzer.js       # Single file analysis
│   ├── ui/                   # UI components
│   └── utils/                # Helper utilities
├── webview/                  # Analysis visualization
└── package.json



🔮 Future Enhancements

 Visual Debugging - Upload UI screenshots, AI finds CSS issues
 Voice Coding - Describe features, AI generates code
 Architecture Diagrams - Auto-generate system diagrams
 PR Analysis - Analyze pull requests with full context
 Dependency Graphs - Interactive component relationship maps


🤝 Contributing
Contributions welcome! This is a hackathon project that can grow into something amazing.

Fork the repository
Create a feature branch
Make your changes
Submit a pull request


📄 License
MIT License - feel free to use in your own projects!

🙏 Acknowledgments

Google DeepMind - For the amazing Gemini API
VS Code Team - For the excellent extension API
Open Source Community - For inspiration and support

