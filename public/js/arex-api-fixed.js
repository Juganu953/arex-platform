/**
 * AREX Platform API - Fixed Version
 * Uses correct endpoints that actually work
 */

// Base configuration
const AREX_CONFIG = {
    baseUrl: '', // Use same-origin (Firebase Hosting proxy)
    endpoints: {
        health: '/health',
        financial: '/financial',      // ✅ This works!
        finance: '/finance',          // ✅ Also works
        revenue: '/revenue',          // ✅ Also works
        api: '/api',
        login: '/auth/login'
    }
};

class AREXAPI {
    constructor() {
        this.authToken = localStorage.getItem('arex_auth_token');
    }
    
    async request(method, endpoint, data = null) {
        const url = endpoint.startsWith('http') ? endpoint : endpoint;
        
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        if (this.authToken) {
            options.headers['Authorization'] = `Bearer ${this.authToken}`;
        }
        
        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            options.body = JSON.stringify(data);
        }
        
        try {
            console.log(`API Call: ${method} ${url}`);
            const response = await fetch(url, options);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            return await response.json();
            
        } catch (error) {
            console.error('API Error:', error);
            return {
                success: false,
                error: error.message,
                connected: false
            };
        }
    }
    
    /**
     * ✅ FIXED: Get financial summary
     * Now uses /financial instead of /financial/summary
     */
    async getFinancialSummary() {
        // Try /financial first (we know this works)
        let result = await this.request('GET', AREX_CONFIG.endpoints.financial);
        
        // If that fails, try /finance or /revenue
        if (!result.success && result.error && result.error.includes('404')) {
            console.log('Trying /finance as fallback...');
            result = await this.request('GET', AREX_CONFIG.endpoints.finance);
        }
        
        if (!result.success && result.error && result.error.includes('404')) {
            console.log('Trying /revenue as fallback...');
            result = await this.request('GET', AREX_CONFIG.endpoints.revenue);
        }
        
        return result;
    }
    
    /**
     * Test API connection
     */
    async testConnection() {
        try {
            const health = await this.request('GET', AREX_CONFIG.endpoints.health);
            return {
                connected: true,
                health: health,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                connected: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
    
    /**
     * Get agent payments
     */
    async getAgentPayments() {
        // Try different endpoints for agent payments
        const endpoints = [
            '/agents/payments',
            '/api/agents/payments',
            '/financial/agents'
        ];
        
        for (const endpoint of endpoints) {
            try {
                const result = await this.request('GET', endpoint);
                if (result && !result.error) {
                    return result;
                }
            } catch (e) {
                continue;
            }
        }
        
        return {
            success: false,
            error: 'Could not find agent payments endpoint',
            payments: []
        };
    }
    
    /**
     * Get platform status
     */
    async getPlatformStatus() {
        try {
            return await this.request('GET', AREX_CONFIG.endpoints.api);
        } catch (error) {
            return {
                success: false,
                error: error.message,
                status: 'unknown'
            };
        }
    }
    
    /**
     * Login
     */
    async login(email, password) {
        try {
            const result = await this.request('POST', AREX_CONFIG.endpoints.login, {
                email,
                password
            });
            
            if (result.success && result.token) {
                this.authToken = result.token;
                localStorage.setItem('arex_auth_token', result.token);
            }
            
            return result;
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Export globally
if (typeof window !== 'undefined') {
    window.arexAPI = new AREXAPI();
}
