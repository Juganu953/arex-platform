/**
 * AREX Platform - Real API Interface
 * Connects to actual Firebase Cloud Functions
 */

// First load the config
// <script src="/js/arex-api-config.js"></script>

class AREXRealAPI {
    constructor() {
        if (!window.arexApiConfig) {
            console.error('⚠️ API config not loaded. Include arex-api-config.js first.');
            return;
        }
        
        this.config = window.arexApiConfig;
        this.authToken = localStorage.getItem('arex_auth_token') || null;
        this.isAuthenticated = !!this.authToken;
    }
    
    /**
     * Make request to actual Firebase function
     */
    async _callFunction(functionName, method = 'GET', data = null, customPath = '') {
        const functionUrl = this.config.endpoints[functionName];
        
        if (!functionUrl) {
            console.error(`Function ${functionName} not found in config`);
            return { success: false, error: `Function ${functionName} not configured` };
        }
        
        const url = customPath ? `${functionUrl}${customPath}` : functionUrl;
        
        const headers = {
            'Content-Type': 'application/json'
        };
        
        // Add auth token if available
        if (this.authToken) {
            headers['Authorization'] = `Bearer ${this.authToken}`;
        }
        
        const options = {
            method,
            headers
        };
        
        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            options.body = JSON.stringify(data);
        }
        
        try {
            console.log(`🌐 Calling ${functionName}: ${method} ${url}`);
            const response = await fetch(url, options);
            
            // Handle HTTP errors
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`HTTP ${response.status}:`, errorText);
                return {
                    success: false,
                    status: response.status,
                    error: errorText || 'HTTP error'
                };
            }
            
            // Try to parse JSON
            try {
                const result = await response.json();
                return result;
            } catch (jsonError) {
                // If not JSON, return text
                const text = await response.text();
                return {
                    success: true,
                    data: text,
                    raw: true
                };
            }
            
        } catch (error) {
            console.error(`Network error calling ${functionName}:`, error);
            return {
                success: false,
                error: error.message,
                connected: false
            };
        }
    }
    
    /**
     * ==================== AUTHENTICATION ====================
     */
    
    async login(email, password) {
        const result = await this._callFunction('login', 'POST', {
            email,
            password
        });
        
        if (result.success && result.token) {
            this.authToken = result.token;
            this.isAuthenticated = true;
            localStorage.setItem('arex_auth_token', result.token);
        }
        
        return result;
    }
    
    async logout() {
        this.authToken = null;
        this.isAuthenticated = false;
        localStorage.removeItem('arex_auth_token');
        return { success: true, message: 'Logged out' };
    }
    
    /**
     * ==================== FINANCIAL ====================
     */
    
    async getFinancialSummary() {
        // Try financialApi first, fall back to main api
        let result = await this._callFunction('financialApi', 'GET', null, '/summary');
        
        if (!result.success) {
            // Fallback to main API
            result = await this._callFunction('api', 'GET', null, '/financial/summary');
        }
        
        return result;
    }
    
    async getAgentPaymentSummary(agentId = null) {
        const path = agentId ? `/agent/${agentId}` : '';
        return await this._callFunction('getAgentPaymentSummary', 'GET', null, path);
    }
    
    async calculateCommission(data) {
        return await this._callFunction('calculateCommissionCallable', 'POST', data);
    }
    
    async requestWithdrawal(amount, agentId) {
        return await this._callFunction('requestWithdrawal', 'POST', {
            amount,
            agentId
        });
    }
    
    /**
     * ==================== AGENT MANAGEMENT ====================
     */
    
    async getAgents() {
        return await this._callFunction('api', 'GET', null, '/agents');
    }
    
    async getAgent(agentId) {
        return await this._callFunction('api', 'GET', null, `/agents/${agentId}`);
    }
    
    async getAgentPerformance(agentId) {
        return await this._callFunction('api', 'GET', null, `/agents/${agentId}/performance`);
    }
    
    async getAgentCommissions(agentId) {
        return await this._callFunction('api', 'GET', null, `/agents/${agentId}/commissions`);
    }
    
    /**
     * ==================== PLATFORM ====================
     */
    
    async getPlatformStats() {
        return await this._callFunction('api', 'GET', null, '/stats');
    }
    
    async getPlatformStatus() {
        return await this._callFunction('api', 'GET', null, '/status');
    }
    
    /**
     * ==================== HEALTH & DEBUG ====================
     */
    
    async getHealth() {
        return await this._callFunction('simpleHealth', 'GET');
    }
    
    async debugBackend() {
        return await this._callFunction('debugBackend', 'GET');
    }
    
    async testSetup() {
        return await this._callFunction('testSetup', 'GET');
    }
    
    /**
     * ==================== UTILITIES ====================
     */
    
    async testAllFunctions() {
        const results = {};
        
        // Test each function
        const functionsToTest = [
            'api',
            'financialApi',
            'login',
            'simpleHealth',
            'getAgentPaymentSummary',
            'unifiedApi',
            'debugBackend'
        ];
        
        for (const funcName of functionsToTest) {
            console.log(`Testing ${funcName}...`);
            results[funcName] = await this._callFunction(funcName, 'GET');
        }
        
        return results;
    }
    
    async testConnection() {
        try {
            const health = await this.getHealth();
            const api = await this._callFunction('api', 'GET', null, '/health');
            
            return {
                connected: health.success || api.success,
                health: health,
                api: api,
                timestamp: new Date().toISOString(),
                functions: this.config.getAvailableFunctions()
            };
        } catch (error) {
            return {
                connected: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

// Export as global
if (typeof window !== 'undefined') {
    window.arexRealAPI = new AREXRealAPI();
}
