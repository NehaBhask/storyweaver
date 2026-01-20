const { GoogleGenAI } = require('@google/genai');

class GeminiClient {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.ai = null;
        this.initializeAI();
    }
    
    initializeAI() {
        if (this.apiKey) {
            try {
                this.ai = new GoogleGenAI({
                    apiKey: this.apiKey
                });
                console.log('✅ Gemini 3 AI initialized successfully');
            } catch (error) {
                console.error('Failed to initialize Gemini AI:', error);
            }
        }
    }
    
    async generateContent(prompt) {
        if (!this.ai) {
            throw new Error('Gemini AI not initialized. Check API key.');
        }
        
        try {
            const response = await this.ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: prompt
            });
            
            return response.text;
        } catch (error) {
            console.error('Gemini API error:', error);
            throw new Error(`Gemini API error: ${error.message}`);
        }
    }
    
    async explainCode(code, language) {
        const prompt = `Explain this ${language} code in simple terms. Be concise and helpful.
        
        Code:
        \`\`\`${language}
        ${code}
        \`\`\`
        
        Provide a clear explanation of what this code does.`;
        
        return await this.generateContent(prompt);
    }
    
    async analyzeCode(code, language) {
        const prompt = `Analyze this ${language} code for quality, issues, and improvements.
        Provide a JSON response with score (1-10), summary, suggestions, and issues.
        
        Code:
        \`\`\`${language}
        ${code}
        \`\`\``;
        
        return await this.generateContent(prompt);
    }
    
    updateApiKey(newApiKey) {
        this.apiKey = newApiKey;
        this.initializeAI();
    }
}

module.exports = GeminiClient;