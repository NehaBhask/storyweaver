class CacheManager {
    constructor() {
        this.cache = new Map();
        this.defaultTTL = 3600000; // 1 hour
    }
    
    set(key, value, ttl = this.defaultTTL) {
        this.cache.set(key, {
            data: value,
            expiry: Date.now() + ttl
        });
        
        // Clean up expired entries occasionally
        if (this.cache.size % 10 === 0) {
            this.cleanup();
        }
    }
    
    get(key) {
        const entry = this.cache.get(key);
        if (!entry) return null;
        
        if (Date.now() > entry.expiry) {
            this.cache.delete(key);
            return null;
        }
        
        return entry.data;
    }
    
    delete(key) {
        this.cache.delete(key);
    }
    
    has(key) {
        const entry = this.cache.get(key);
        if (!entry) return false;
        
        if (Date.now() > entry.expiry) {
            this.cache.delete(key);
            return false;
        }
        
        return true;
    }
    
    clear() {
        this.cache.clear();
    }
    
    size() {
        return this.cache.size;
    }
    
    cleanup() {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiry) {
                this.cache.delete(key);
            }
        }
    }
    
    getStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}

module.exports = CacheManager;