/* ===========================
   AI CHAT MODULE
   =========================== */

const AIChat = {
    provider: 'chatgpt', // 'chatgpt' or 'gemini'
    isOpen: false,
    conversationHistory: [],
    
    // Initialize AI Chat
    initialize() {
        this.setupEventListeners();
        this.loadConversationHistory();
    },

    // Setup Event Listeners
    setupEventListeners() {
        const input = document.getElementById('ai-input');
        const sendBtn = document.getElementById('ai-send-btn');
        
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.sendMessage();
            });
        }
        
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendMessage());
        }
    },

    // Toggle Chat Window
    toggleChat() {
        const widget = document.getElementById('ai-chat-widget');
        this.isOpen = !this.isOpen;
        
        if (widget) {
            widget.classList.toggle('open', this.isOpen);
        }
    },

    // Send Message
    async sendMessage() {
        const input = document.getElementById('ai-input');
        if (!input || !input.value.trim()) return;

        const userMessage = input.value.trim();
        input.value = '';

        // Add user message to chat
        this.displayMessage(userMessage, 'user');

        // Show loading indicator
        this.displayMessage('Thinking...', 'ai', true);

        try {
            // Get AI response based on provider
            let response;
            if (this.provider === 'chatgpt') {
                response = await this.getChatGPTResponse(userMessage);
            } else if (this.provider === 'gemini') {
                response = await this.getGeminiResponse(userMessage);
            }

            // Remove loading message
            const loadingMsg = document.querySelector('[data-loading="true"]');
            if (loadingMsg) loadingMsg.remove();

            // Display AI response
            this.displayMessage(response, 'ai');

            // Save to history
            this.conversationHistory.push({
                role: 'user',
                content: userMessage
            });
            this.conversationHistory.push({
                role: 'assistant',
                content: response
            });
            this.saveConversationHistory();
        } catch (error) {
            console.error('AI Error:', error);
            this.displayMessage('Sorry, I encountered an error. Please try again.', 'ai');
        }
    },

    // Get ChatGPT Response
    async getChatGPTResponse(message) {
        // Note: In production, you should use a backend endpoint to protect your API key
        const apiKey = localStorage.getItem('chatgpt_api_key');
        
        if (!apiKey) {
            return 'Please configure your ChatGPT API key in settings.';
        }

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'gpt-4',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a helpful assistant for a construction ERP system. Help users understand their business data, provide insights, and answer questions about the portal.'
                        },
                        ...this.conversationHistory,
                        { role: 'user', content: message }
                    ],
                    max_tokens: 500,
                    temperature: 0.7
                })
            });

            const data = await response.json();
            if (data.choices && data.choices[0]) {
                return data.choices[0].message.content;
            }
            return 'Unable to get response from ChatGPT';
        } catch (error) {
            console.error('ChatGPT Error:', error);
            return 'Error connecting to ChatGPT. Please check your API key.';
        }
    },

    // Get Gemini Response
    async getGeminiResponse(message) {
        // Note: In production, you should use a backend endpoint to protect your API key
        const apiKey = localStorage.getItem('gemini_api_key');
        
        if (!apiKey) {
            return 'Please configure your Gemini API key in settings.';
        }

        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: `You are a helpful assistant for a construction ERP system. Help users understand their business data, provide insights, and answer questions about the portal.\n\nUser question: ${message}`
                            }]
                        }],
                        generationConfig: {
                            temperature: 0.7,
                            topP: 0.9,
                            topK: 40,
                            maxOutputTokens: 500
                        }
                    })
                }
            );

            const data = await response.json();
            if (data.candidates && data.candidates[0]) {
                return data.candidates[0].content.parts[0].text;
            }
            return 'Unable to get response from Gemini';
        } catch (error) {
            console.error('Gemini Error:', error);
            return 'Error connecting to Gemini. Please check your API key.';
        }
    },

    // Display Message in Chat
    displayMessage(message, role = 'user', isLoading = false) {
        const chatMessages = document.getElementById('ai-chat-messages');
        if (!chatMessages) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${role}`;
        messageDiv.setAttribute('data-loading', isLoading);
        
        if (role === 'user') {
            messageDiv.innerHTML = `
                <div class="message-content user-message">
                    <i class="fas fa-user"></i>
                    <p>${this.escapeHTML(message)}</p>
                </div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="message-content ai-message">
                    <i class="fas fa-robot"></i>
                    <p>${isLoading ? '<span class="typing">●●●</span>' : this.escapeHTML(message)}</p>
                </div>
            `;
        }

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    },

    // Escape HTML
    escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    // Save Conversation History
    saveConversationHistory() {
        localStorage.setItem('ai_conversation_history', JSON.stringify(this.conversationHistory));
    },

    // Load Conversation History
    loadConversationHistory() {
        const saved = localStorage.getItem('ai_conversation_history');
        if (saved) {
            this.conversationHistory = JSON.parse(saved);
        }
    },

    // Clear Chat History
    clearHistory() {
        this.conversationHistory = [];
        localStorage.removeItem('ai_conversation_history');
        const chatMessages = document.getElementById('ai-chat-messages');
        if (chatMessages) {
            chatMessages.innerHTML = '';
        }
    },

    // Get AI-Powered Insights
    async getDataInsights() {
        try {
            const dashboard = await API.getDashboard();
            const prompt = `Based on this ERP data, provide 3 key business insights:
            - Total Income: ₹${dashboard.data.income}
            - Total Expense: ₹${dashboard.data.expense}
            - Net Balance: ₹${dashboard.data.balance}
            - Outstanding Dues: ₹${dashboard.data.dues}
            
            Please provide actionable insights.`;

            let response;
            if (this.provider === 'chatgpt') {
                response = await this.getChatGPTResponse(prompt);
            } else {
                response = await this.getGeminiResponse(prompt);
            }

            return response;
        } catch (error) {
            console.error('Error getting insights:', error);
            return 'Unable to generate insights at this moment.';
        }
    },

    // Switch AI Provider
    switchProvider(provider) {
        this.provider = provider;
        localStorage.setItem('ai_provider', provider);
        this.clearHistory();
        this.displayMessage(`Switched to ${provider}. How can I help?`, 'ai');
    },

    // Set API Key
    setAPIKey(key, provider = this.provider) {
        if (provider === 'chatgpt') {
            localStorage.setItem('chatgpt_api_key', key);
        } else if (provider === 'gemini') {
            localStorage.setItem('gemini_api_key', key);
        }
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIChat;
}
