/**
 * AREX Forms Handler - Fixed Version
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('📝 AREX Forms loaded');
    
    // Login form handler
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        console.log('🔐 Login form found');
        
        loginForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            
            // Get form elements
            const emailInput = this.querySelector('input[type="email"]');
            const passwordInput = this.querySelector('input[type="password"]');
            const submitButton = this.querySelector('button[type="submit"]');
            const errorElement = this.querySelector('.error-message') || document.createElement('div');
            
            if (!errorElement.classList.contains('error-message')) {
                errorElement.className = 'error-message';
                errorElement.style.cssText = 'color: #F44336; margin-top: 10px; padding: 10px; background: #ffebee; border-radius: 5px;';
                this.appendChild(errorElement);
            }
            
            // Get values
            const email = emailInput ? emailInput.value : '';
            const password = passwordInput ? passwordInput.value : '';
            
            // Validate
            if (!email || !password) {
                errorElement.textContent = 'Please enter both email and password';
                return;
            }
            
            // Save original button text if it exists
            const originalButtonText = submitButton ? submitButton.textContent : 'Login';
            
            // Update UI
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = 'Logging in...';
            }
            
            errorElement.textContent = '';
            
            console.log('🔐 Attempting login...', { email: email.substring(0, 3) + '...' });
            
            try {
                // Check if API is available
                if (!window.arexAPI) {
                    throw new Error('AREX API not loaded');
                }
                
                // Attempt login
                const result = await window.arexAPI.login(email, password);
                
                if (result.success) {
                    console.log('✅ Login successful');
                    errorElement.style.background = '#e8f5e9';
                    errorElement.style.color = '#2e7d32';
                    errorElement.textContent = '✅ Login successful! Redirecting...';
                    
                    // Redirect after successful login
                    setTimeout(() => {
                        window.location.href = '/dashboard.html';
                    }, 1500);
                    
                } else {
                    console.log('❌ Login failed:', result.error);
                    
                    // Show appropriate error message
                    let errorMessage = 'Login failed';
                    if (result.error) {
                        errorMessage = result.error;
                        
                        // Handle specific error cases
                        if (result.error.includes('404') || result.error.includes('HTML')) {
                            errorMessage = 'Login endpoint not found. The /auth/login API may not be implemented yet.';
                        } else if (result.error.includes('credentials') || result.error.includes('invalid')) {
                            errorMessage = 'Invalid email or password';
                        } else if (result.error.includes('network')) {
                            errorMessage = 'Network error. Please check your connection.';
                        }
                    }
                    
                    errorElement.textContent = `❌ ${errorMessage}`;
                    
                    // Restore button
                    if (submitButton) {
                        submitButton.disabled = false;
                        submitButton.textContent = originalButtonText;
                    }
                }
                
            } catch (error) {
                console.error('❌ Login error:', error);
                
                errorElement.textContent = `❌ Error: ${error.message}`;
                
                // Restore button
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = originalButtonText;
                }
            }
        });
    }
    
    // Registration form handler (if exists)
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            console.log('📝 Registration form submitted');
            // Add registration logic here
        });
    }
    
    // Dashboard forms (if any)
    const dashboardForms = document.querySelectorAll('form.dashboard-form');
    dashboardForms.forEach(form => {
        form.addEventListener('submit', function(event) {
            // Add dashboard form handling here
        });
    });
});

// Form validation helpers
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePassword(password) {
    return password.length >= 6;
}

// Form UI helpers
function showFormError(element, message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'form-error';
    errorDiv.style.cssText = 'color: #F44336; font-size: 14px; margin-top: 5px;';
    errorDiv.textContent = message;
    
    element.parentNode.appendChild(errorDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 5000);
}

function showFormSuccess(element, message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'form-success';
    successDiv.style.cssText = 'color: #4CAF50; font-size: 14px; margin-top: 5px;';
    successDiv.textContent = message;
    
    element.parentNode.appendChild(successDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (successDiv.parentNode) {
            successDiv.parentNode.removeChild(successDiv);
        }
    }, 5000);
}
