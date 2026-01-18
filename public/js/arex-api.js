/**
 * AREX Platform API - CORRECTED VERSION
 * Uses the actual working endpoints we discovered
 */

class AREXAPI {
    constructor() {
        this.baseUrl = window.location.origin; // Same origin, uses Firebase Hosting rewrites
        this.authToken = localStorage.getItem('arex_auth_token') || null;
        this.isAuthenticated = !!this.authToken;
        
        // ✅ CONFIRMED WORKING ENDPOINTS
        this.endpoints = {
            health: '/health',          // ✅ Works
            financial: '/financial',    // ✅ Works (NOT /api/financial/summary)
            finance: '/finance',        // ✅ Works (alternative)
            revenue: '/revenue',        // ✅ Works (alternative)
            api: '/api',                // Main API endpoint
            auth: {
                login: '/auth/login'    // Note: This needs to be verified
            }
        };
        
        console.log('✅ AREX API Initialized with corrected endpoints');
    }
    
    /**
     * Make API request
     */
    async call(endpoint, method = 'GET', data = null) {
        const url = endpoint.startsWith('http') ? endpoint : endpoint;
        
        console.log(`📤 API Call: ${method} ${url}`);
        
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin' // Important for sessions
        };
        
        if (this.authToken) {
            options.headers['Authorization'] = `Bearer ${this.authToken}`;
        }
        
        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            options.body = JSON.stringify(data);
        }
        
        try {
            const response = await fetch(url, options);
            console.log(`📥 API Response: ${response.status}`, response);
            
            // Check if response is HTML (404 page) instead of JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                
                // If it's HTML, it's likely a 404 page
                if (text.includes('<!DOCTYPE') || text.includes('<html')) {
                    throw new Error(`Endpoint returned HTML (likely 404). Path: ${url}`);
                }
                
                // Try to parse as JSON anyway
                try {
                    return JSON.parse(text);
                } catch (e) {
                    return { text: text.substring(0, 200) }; // Return first 200 chars
                }
            }
            
            const result = await response.json();
            
            if (!response.ok) {
                return {
                    success: false,
                    status: response.status,
                    error: result.error || `HTTP ${response.status}`,
                    ...result
                };
            }
            
            return {
                success: true,
                status: response.status,
                ...result
            };
            
        } catch (error) {
            console.error('❌ API Error:', error);
            return {
                success: false,
                error: error.message,
                connected: false
            };
        }
    }
    
    /**
     * ✅ CORRECTED: Get financial summary
     * Uses /financial instead of /api/financial/summary
     */
    async getFinancialSummary() {
        console.log('💰 Getting financial summary from /financial...');
        return await this.call(this.endpoints.financial, 'GET');
    }
    
    /**
     * ✅ Test connection to all confirmed endpoints
     */
    async testConnection() {
        console.log('🧪 Testing API connections...');
        
        const endpointsToTest = [
            { name: 'Health', endpoint: this.endpoints.health },
            { name: 'Financial', endpoint: this.endpoints.financial },
            { name: 'Finance', endpoint: this.endpoints.finance },
            { name: 'Revenue', endpoint: this.endpoints.revenue }
        ];
        
        const results = [];
        
        for (const test of endpointsToTest) {
            try {
                const response = await fetch(test.endpoint);
                results.push({
                    name: test.name,
                    endpoint: test.endpoint,
                    connected: response.ok,
                    status: response.status
                });
                
                console.log(`${test.name} (${test.endpoint}): ${response.ok ? '✅' : '❌'} ${response.status}`);
                
            } catch (error) {
                results.push({
                    name: test.name,
                    endpoint: test.endpoint,
                    connected: false,
                    error: error.message
                });
                
                console.log(`${test.name} (${test.endpoint}): ❌ ${error.message}`);
            }
            
            // Small delay between tests
            await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        // Check overall connection
        const connectedCount = results.filter(r => r.connected).length;
        const allConnected = connectedCount === endpointsToTest.length;
        
        if (!allConnected) {
            console.warn('⚠️ API Connection issues:', results.filter(r => !r.connected));
        }
        
        return {
            connected: allConnected,
            results: results,
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * Login - NOTE: Need to verify /auth/login endpoint exists
     */
    async login(email, password) {
        console.log('🔐 Attempting login...');
        
        // First, let's test if the login endpoint exists
        try {
            const testResponse = await fetch(this.endpoints.auth.login, {
                method: 'OPTIONS' // Preflight request
            });
            
            if (!testResponse.ok) {
                console.warn(`⚠️ Login endpoint ${this.endpoints.auth.login} may not exist (HTTP ${testResponse.status})`);
            }
        } catch (testError) {
            console.warn(`⚠️ Cannot reach login endpoint: ${testError.message}`);
        }
        
        // Try login
        const result = await this.call(this.endpoints.auth.login, 'POST', {
            email: email,
            password: password
        });
        
        if (result.success && result.token) {
            this.authToken = result.token;
            this.isAuthenticated = true;
            localStorage.setItem('arex_auth_token', result.token);
            console.log('✅ Login successful, token stored');
        } else {
            console.log('❌ Login failed:', result.error);
        }
        
        return result;
    }
    
    /**
     * Logout
     */
    async logout() {
        this.authToken = null;
        this.isAuthenticated = false;
        localStorage.removeItem('arex_auth_token');
        console.log('✅ Logged out');
        return { success: true, message: 'Logged out' };
    }
    
    /**
     * Get agent payments
     */
    async getAgentPayments(agentId = null) {
        // Try different possible endpoints for agent payments
        const possibleEndpoints = [
            '/agents/payments',
            '/api/agents/payments',
            '/financial/agents'
        ];
        
        for (const endpoint of possibleEndpoints) {
            try {
                const result = await this.call(endpoint);
                if (result && !result.error && result.success !== false) {
                    console.log(`✅ Found agent payments at ${endpoint}`);
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
        return await this.call(this.endpoints.api);
    }
    
    /**
     * Debug: Test all endpoints and show what works
     */
    async debugEndpoints() {
        console.log('🔍 Debug: Testing all possible endpoints...');
        
        const testEndpoints = [
            '/health',
            '/financial',
            '/finance',
            '/revenue',
            '/api',
            '/auth/login',
            '/agents/payments',
            '/financial/summary', // This should fail
            '/api/financial/summary' // This should fail
        ];
        
        const results = [];
        
        for (const endpoint of testEndpoints) {
            try {
                const response = await fetch(endpoint);
                results.push({
                    endpoint: endpoint,
                    status: response.status,
                    works: response.ok,
                    note: response.ok ? '✅ Works' : '❌ Does not work'
                });
            } catch (error) {
                results.push({
                    endpoint: endpoint,
                    status: 'Error',
                    works: false,
                    note: `❌ ${error.message}`
                });
            }
            
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        console.table(results);
        return results;
    }
}

// Export globally
if (typeof window !== 'undefined') {
    window.arexAPI = new AREXAPI();
    
    // Test connection on load
    setTimeout(() => {
        if (window.arexAPI) {
            window.arexAPI.testConnection().then(result => {
                console.log('Initial connection test:', result);
            });
        }
    }, 2000);
}
