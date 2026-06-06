/* ===========================
   AI AUTHENTICATION MODULE
   =========================== */

const AIAuth = {
    // OpenAI OAuth Configuration
    OPENAI_CONFIG: {
        clientId: localStorage.getItem('openai_client_id') || '',
        clientSecret: localStorage.getItem('openai_client_secret') || '',
        redirectUri: window.location.origin + '/callback'
    },

    // Google/Gemini OAuth Configuration
    GEMINI_CONFIG: {
        clientId: localStorage.getItem('gemini_client_id') || '',
        clientSecret: localStorage.getItem('gemini_client_secret') || '',
        redirectUri: window.location.origin + '/callback'
    },

    // Login with OpenAI
    async loginWithOpenAI() {
        if (!this.OPENAI_CONFIG.clientId) {
            alert('Please configure OpenAI OAuth credentials in settings.');
            return;
        }

        const scopes = 'openid profile email';
        const params = new URLSearchParams({
            client_id: this.OPENAI_CONFIG.clientId,
            redirect_uri: this.OPENAI_CONFIG.redirectUri,
            response_type: 'code',
            scope: scopes,
            state: this.generateState()
        });

        window.location.href = `https://auth.openai.com/authorize?${params.toString()}`;
    },

    // Login with Google/Gemini
    async loginWithGemini() {
        if (!this.GEMINI_CONFIG.clientId) {
            alert('Please configure Google/Gemini OAuth credentials in settings.');
            return;
        }

        const scopes = 'openid profile email';
        const params = new URLSearchParams({
            client_id: this.GEMINI_CONFIG.clientId,
            redirect_uri: this.GEMINI_CONFIG.redirectUri,
            response_type: 'code',
            scope: scopes,
            state: this.generateState()
        });

        window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    },

    // Handle OAuth Callback
    async handleCallback() {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');

        if (!code) {
            console.error('No authorization code received');
            return false;
        }

        try {
            // Exchange code for token
            const response = await fetch('/api/oauth/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, state })
            });

            const data = await response.json();
            if (data.success) {
                // Store tokens
                localStorage.setItem('ai_access_token', data.accessToken);
                localStorage.setItem('ai_refresh_token', data.refreshToken);
                localStorage.setItem('ai_provider', data.provider);

                // Redirect to app
                window.location.href = '/';
                return true;
            }
        } catch (error) {
            console.error('OAuth callback error:', error);
        }

        return false;
    },

    // Generate State for CSRF Protection
    generateState() {
        const state = Math.random().toString(36).substring(7);
        sessionStorage.setItem('oauth_state', state);
        return state;
    },

    // Verify State
    verifyState(state) {
        return state === sessionStorage.getItem('oauth_state');
    },

    // Logout from AI
    logout() {
        localStorage.removeItem('ai_access_token');
        localStorage.removeItem('ai_refresh_token');
        localStorage.removeItem('ai_provider');
        localStorage.removeItem('ai_chat_history');
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIAuth;
}
