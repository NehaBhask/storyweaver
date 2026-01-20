module.exports = class ConfigManager {
    getApiKey() { return process.env.GEMINI_API_KEY || ''; }
};