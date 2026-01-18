/**
 * AREX API - CORS Fixed Version
 * Uses Firebase Hosting proxy to avoid CORS issues
 */

class AREXAPICorsFixed {
    constructor() {
        // Use relative paths through Firebase Hosting proxy
        this.baseUrl = ''; // Same origin - uses Firebase Hosting rewrites
        
        // Define API routes through proxy
        this.endpoints = {
            // Health
            health: '/health',
            
            // Main API
            api: '/api',
            
            // Financial
            financial: '/financial',
            
            // Authentication
            auth: '/auth',
            
            // Agents
            agentPayments: '/agents/payments',
            
            // Commission
            commission: '/commission/calculate',
            
            // Unified API
            unified: '/unified',
            
            // Debug
            debug: '/debug'
        };
        
        this.authToken = localStorage.getItem('arex_auth_token');
    }
    
    /**
     * Make request through Firebase Hosting proxy
     */
    async request(method, endpoint, data = null, params = {}) {
        // Build URL
        let url = endpoint;
        
        // Add query parameters
        if (Object.keys(params).length > 0) {
            const queryString = new URLSearchParams(params).toString();
            url += `?${queryString}`;
        }
        
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin' // Important for cookies/sessions
        };
        
        // Add auth token if available
        if (this.authToken) {
            options.headers['Authorization'] = `Bearer ${this.authToken}`;
        }
        
        // Add body for POST/PUT/PATCH
        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            options.body = JSON.stringify(data);
        }
        
        try {
            console.log(`🌐 ${method} ${url}`);
            const response = await fetch(url, options);
            
            // Handle HTTP errors
            if (!response.ok) {
                let errorText = 'Unknown error';
                try {
                    errorText = await response.text();
                } catch (e) {
                    errorText = `HTTP ${response.status}`;
                }
                
                console.error(`HTTP ${response.status}:`, errorText);
                return {
                    success: false,
                    status: response.status,
                    error: errorText
                };
            }
            
            // Parse response
            try {
                const result = await response.json();
                return result;
            } catch (jsonError) {
                // If not JSON, return as text
                const text = await response.text();
                return {
                    success: true,
                    data: text
                };
            }
            
        } catch (error) {
            console.error('Network error:', error);
            return {
                success: false,
                error: error.message,
                connected: false
            };
        }
    }
    
    /**
     * ==================== HEALTH & STATUS ====================
     */
    
    async getHealth() {
        return await this.request('GET', this.endpoints.health);
    }
    
    async testConnection() {
        try {
            const health = await this.getHealth();
            return {
                connected: health.success || false,
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
     * ==================== FINANCIAL ====================
     */
    
    async getFinancialSummary() {
        return await this.request('GET', `${this.endpoints.financial}/summary`);
    }
    
    async getAgentPayments(agentId = null) {
        const endpoint = agentId ? 
            `${this.endpoints.agentPayments}/${agentId}` : 
            this.endpoints.agentPayments;
        return await this.request('GET', endpoint);
    }
    
    async calculateCommission(data) {
        return await this.request('POST', this.endpoints.commission, data);
    }
    
    /**
     * ==================== AUTHENTICATION ====================
     */
    
    async login(email, password) {
        const result = await this.request('POST', `${this.endpoints.auth}/login`, {
            email,
            password
        });
        
        if (result.success && result.token) {
            this.authToken = result.token;
            localStorage.setItem('arex_auth_token', result.token);
        }
        
        return result;
    }
    
    async logout() {
        this.authToken = null;
        localStorage.removeItem('arex_auth_token');
        return { success: true, message: 'Logged out' };
    }
    
    /**
     * ==================== PLATFORM ====================
     */
    
    async getPlatformStats() {
        return await this.request('GET', `${this.endpoints.api}/stats`);
    }
    
    async getPlatformStatus() {
        return await this.request('GET', `${this.endpoints.api}/status`);
    }
    
    /**
     * ==================== TEST ALL ENDPOINTS ====================
     */
    
    async testAllEndpoints() {
        const tests = [
            { name: 'Health Check', func: () => this.getHealth() },
            { name: 'Financial Summary', func: () => this.getFinancialSummary() },
            { name: 'Agent Payments', func: () => this.getAgentPayments() },
            { name: 'Platform Stats', func: () => this.getPlatformStats() }
        ];
        
        const results = {};
        
        for (const test of tests) {
            try {
                console.log(`Testing ${test.name}...`);
                const result = await test.func();
                results[test.name] = {
                    success: result.success || false,
                    error: result.error,
                    data: result.success ? 'Connected' : result.error
                };
            } catch (error) {
                results[test.name] = {
                    success: false,
                    error: error.message
                };
            }
            
            // Small delay between tests
            await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        return results;
    }
}

// Export globally
if (typeof window !== 'undefined') {
    window.arexApi = new AREXAPICorsFixed();
}
