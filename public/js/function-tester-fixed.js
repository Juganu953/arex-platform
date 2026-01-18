/**
 * AREX Function Tester - Fixed Version
 * Fixed 'func is not defined' error
 */

class FunctionTester {
    constructor() {
        this.projectId = 'arex-platform-7d3cb'; // Your actual project ID
        this.baseUrl = `https://us-central1-${this.projectId}.cloudfunctions.net`;
        
        this.functions = [
            {
                name: 'api',
                url: `${this.baseUrl}/api`,
                description: 'Main API endpoint'
            },
            {
                name: 'financialApi',
                url: `${this.baseUrl}/financialApi`,
                description: 'Financial operations'
            },
            {
                name: 'login',
                url: `${this.baseUrl}/login`,
                description: 'User authentication'
            },
            {
                name: 'getAgentPaymentSummary',
                url: `${this.baseUrl}/getAgentPaymentSummary`,
                description: 'Agent payments'
            },
            {
                name: 'calculateCommissionCallable',
                url: `${this.baseUrl}/calculateCommissionCallable`,
                description: 'Commission calculations'
            },
            {
                name: 'simpleHealth',
                url: `${this.baseUrl}/simpleHealth`,
                description: 'Health check'
            },
            {
                name: 'unifiedApi',
                url: `${this.baseUrl}/unifiedApi`,
                description: 'Unified API'
            },
            {
                name: 'debugBackend',
                url: `${this.baseUrl}/debugBackend`,
                description: 'Debug endpoint'
            }
        ];
    }
    
    async testFunction(functionName) {
        console.log(`Testing ${functionName}...`);
        
        // Find the function
        const func = this.functions.find(f => f.name === functionName);
        if (!func) {
            return { 
                name: functionName, 
                connected: false, 
                error: 'Function not found in list' 
            };
        }
        
        try {
            const response = await fetch(func.url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                return { 
                    name: functionName, 
                    connected: true, 
                    status: response.status,
                    url: func.url
                };
            } else {
                const errorText = await response.text();
                return { 
                    name: functionName, 
                    connected: false, 
                    status: response.status,
                    error: errorText || `HTTP ${response.status}`,
                    url: func.url
                };
            }
        } catch (error) {
            return { 
                name: functionName, 
                connected: false, 
                error: error.message,
                url: func.url
            };
        }
    }
    
    async testAllFunctions() {
        const results = [];
        
        for (const func of this.functions) {
            const result = await this.testFunction(func.name);
            results.push(result);
            
            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        return results;
    }
}

// Export globally
if (typeof window !== 'undefined') {
    window.functionTester = new FunctionTester();
}
