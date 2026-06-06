/* ===========================
   AI LOGIN INTEGRATION
   =========================== */

const AILogin = {
    // ChatGPT OAuth Config
    chatGPTConfig: {
        clientId: 'YOUR_CHATGPT_CLIENT_ID',
        redirectUri: window.location.origin + '/callback',
        scope: 'openid profile email',
        endpoint: 'https://auth.openai.com/authorize'
    },

    // Gemini OAuth Config
    geminiConfig: {
        clientId: 'YOUR_GOOGLE_CLIENT_ID',
        redirectUri: window.location.origin + '/callback',
        scope: 'openid profile email',
        endpoint: 'https://accounts.google.com/o/oauth2/v2/auth'
    },

    // Login with ChatGPT
    async loginWithChatGPT() {
        const authUrl = new URL(this.chatGPTConfig.endpoint);
        authUrl.searchParams.append('client_id', this.chatGPTConfig.clientId);
        authUrl.searchParams.append('redirect_uri', this.chatGPTConfig.redirectUri);
        authUrl.searchParams.append('scope', this.chatGPTConfig.scope);
        authUrl.searchParams.append('response_type', 'code');
        authUrl.searchParams.append('prompt', 'login');

        window.location.href = authUrl.toString();
    },

    // Login with Gemini
    async loginWithGemini() {
        const authUrl = new URL(this.geminiConfig.endpoint);
        authUrl.searchParams.append('client_id', this.geminiConfig.clientId);
        authUrl.searchParams.append('redirect_uri', this.geminiConfig.redirectUri);
        authUrl.searchParams.append('scope', this.geminiConfig.scope);
        authUrl.searchParams.append('response_type', 'code');
        authUrl.searchParams.append('prompt', 'login');

        window.location.href = authUrl.toString();
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
            // Exchange code for token (should be done on backend for security)
            const response = await fetch('/api/auth/callback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, state })
            });

            const data = await response.json();

            if (data.success) {
                // Store user info
                localStorage.setItem('auth_user', JSON.stringify(data.user));
                localStorage.setItem('auth_token', data.token);
                localStorage.setItem('ai_provider', data.provider);

                // Redirect to app
                window.location.href = '/app.html';
                return true;
            }
        } catch (error) {
            console.error('OAuth callback error:', error);
            return false;
        }
    },

    // Link AI Account to Existing User
    async linkAIAccount(provider) {
        const user = Auth.getCurrentUser();
        if (!user) {
            alert('Please login first');
            return;
        }

        if (provider === 'chatgpt') {
            this.loginWithChatGPT();
        } else if (provider === 'gemini') {
            this.loginWithGemini();
        }
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AILogin;
}
