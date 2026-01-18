/**
 * AREX Platform - API Configuration
 * Connects frontend to actual Firebase Cloud Functions
 */

class AREXAPIConfig {
    constructor() {
        // Get your Firebase project ID (update this with your actual ID)
        this.projectId = 'arex-platform-7d3cb'; // Replace with your actual project ID
        this.region = 'us-central1';
        
        // Base URL for all functions
        this.baseUrl = `https://${this.region}-${this.projectId}.cloudfunctions.net`;
        
        // Define all your actual function endpoints
        this.endpoints = {
            // Main API endpoints
            api: `${this.baseUrl}/api`,
            financialApi: `${this.baseUrl}/financialApi`,
            unifiedApi: `${this.baseUrl}/unifiedApi`,
            
            // Authentication
            login: `${this.baseUrl}/login`,
            validateOAuth: `${this.baseUrl}/validateOAuth`,
            exchangeOAuthCode: `${this.baseUrl}/exchangeOAuthCode`,
            
            // Financial
            getAgentPaymentSummary: `${this.baseUrl}/getAgentPaymentSummary`,
            calculateCommission: `${this.baseUrl}/calculateCommissionCallable`,
            requestWithdrawal: `${this.baseUrl}/requestWithdrawal`,
            
            // Health & Debug
            health: `${this.baseUrl}/simpleHealth`,
            debug: `${this.baseUrl}/debugBackend`,
            
            // Development
            getDevToken: `${this.baseUrl}/getDevToken`,
            testSetup: `${this.baseUrl}/testSetup`,
            working: `${this.baseUrl}/working`
        };
        
        // Map frontend calls to actual function endpoints
        this.routes = {
            // Authentication
            'POST /auth/login': this.endpoints.login,
            'GET /auth/profile': this.endpoints.api + '/profile',
            
            // Financial
            'GET /financial/summary': this.endpoints.financialApi + '/summary',
            'GET /financial/agent-payments': this.endpoints.getAgentPaymentSummary,
            'POST /financial/calculate-commission': this.endpoints.calculateCommission,
            'POST /financial/request-withdrawal': this.endpoints.requestWithdrawal,
            
            // Agents
            'GET /agents': this.endpoints.api + '/agents',
            'GET /agents/:id': this.endpoints.api + '/agents/:id',
            'GET /agents/:id/performance': this.endpoints.api + '/agents/:id/performance',
            'GET /agents/:id/commissions': this.endpoints.api + '/agents/:id/commissions',
            
            // Health
            'GET /health': this.endpoints.health,
            
            // Platform
            'GET /platform/stats': this.endpoints.api + '/stats',
            'GET /platform/status': this.endpoints.api + '/status'
        };
        
        // Store auth token
        this.authToken = null;
    }
    
    /**
     * Get URL for a specific route
     */
    getUrl(route, params = {}) {
        // Check if it's a direct endpoint
        if (route.startsWith('http')) {
            return route;
        }
        
        // Check if it's a mapped route
        const routeKey = Object.keys(this.routes).find(key => {
            const [method, path] = key.split(' ');
            return route.includes(path.replace(/:[^/]+/g, '[^/]+'));
        });
        
        if (routeKey && this.routes[routeKey]) {
            let url = this.routes[routeKey];
            
            // Replace path parameters
            Object.keys(params).forEach(key => {
                url = url.replace(`:${key}`, params[key]);
            });
            
            return url;
        }
        
        // Default to main API with the route
        return `${this.endpoints.api}${route}`;
    }
    
    /**
     * Test connection to all endpoints
     */
    async testAllEndpoints() {
        const results = {};
        
        console.log('🔍 Testing connection to all functions...');
        
        // Test main endpoints
        const endpointsToTest = [
            { name: 'api', url: this.endpoints.api },
            { name: 'financialApi', url: this.endpoints.financialApi },
            { name: 'login', url: this.endpoints.login },
            { name: 'health', url: this.endpoints.health },
            { name: 'agentPayments', url: this.endpoints.getAgentPaymentSummary }
        ];
        
        for (const endpoint of endpointsToTest) {
            try {
                const response = await fetch(endpoint.url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                results[endpoint.name] = {
                    connected: response.ok,
                    status: response.status,
                    statusText: response.statusText,
                    url: endpoint.url
                };
                
                console.log(`${endpoint.name}: ${response.ok ? '✅' : '❌'} ${response.status}`);
            } catch (error) {
                results[endpoint.name] = {
                    connected: false,
                    error: error.message,
                    url: endpoint.url
                };
                console.log(`${endpoint.name}: ❌ ${error.message}`);
            }
        }
        
        return results;
    }
    
    /**
     * Get all available functions
     */
    getAvailableFunctions() {
        return [
            {
                name: 'api',
                url: this.endpoints.api,
                type: 'HTTP',
                description: 'Main API endpoint for general operations'
            },
            {
                name: 'financialApi',
                url: this.endpoints.financialApi,
                type: 'HTTP',
                description: 'Financial operations and reporting'
            },
            {
                name: 'login',
                url: this.endpoints.login,
                type: 'HTTP',
                description: 'User authentication'
            },
            {
                name: 'getAgentPaymentSummary',
                url: this.endpoints.getAgentPaymentSummary,
                type: 'HTTP',
                description: 'Agent payment calculations and summaries'
            },
            {
                name: 'calculateCommissionCallable',
                url: this.endpoints.calculateCommission,
                type: 'HTTP',
                description: 'Calculate commissions for agents'
            },
            {
                name: 'simpleHealth',
                url: this.endpoints.health,
                type: 'HTTP',
                description: 'Health check endpoint'
            },
            {
                name: 'unifiedApi',
                url: this.endpoints.unifiedApi,
                type: 'HTTP',
                description: 'Unified API gateway'
            },
            {
                name: 'debugBackend',
                url: this.endpoints.debug,
                type: 'HTTP',
                description: 'Debug and testing endpoint'
            }
        ];
    }
}

// Export as global
if (typeof window !== 'undefined') {
    window.arexApiConfig = new AREXAPIConfig();
}
