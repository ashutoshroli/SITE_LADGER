/* ===========================
   AI CHAT & ANALYTICS MODULE
   =========================== */

const AI = {
    // Configuration
    CONFIG: {
        OPENAI_API_KEY: localStorage.getItem('openai_api_key') || '',
        GEMINI_API_KEY: localStorage.getItem('gemini_api_key') || '',
        PROVIDER: localStorage.getItem('ai_provider') || 'chatgpt',
        MODEL: {
            chatgpt: 'gpt-4',
            gemini: 'gemini-pro'
        }
    },

    // Chat History
    chatHistory: [],
    maxMessages: 50,

    // Initialize AI
    async initialize() {
        this.loadChatHistory();
        this.setupUI();
        this.setupEventListeners();
    },

    // Setup Event Listeners
    setupEventListeners() {
        const chatInput = document.getElementById('ai-chat-input');
        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage();
                }
            });
        }
    },

    // Setup Chat UI
    setupUI() {
        const widget = document.getElementById('ai-chat-widget');
        if (widget) {
            widget.style.display = 'block';
        }
    },

    // Send Message to AI
    async sendMessage() {
        const input = document.getElementById('ai-chat-input');
        const message = input.value.trim();

        if (!message) return;

        // Add user message
        this.addMessage('user', message);
        input.value = '';
        this.displayMessage('user', message);

        // Show typing indicator
        this.showTyping(true);

        try {
            let response;
            if (this.CONFIG.PROVIDER === 'chatgpt') {
                response = await this.callOpenAI(message);
            } else if (this.CONFIG.PROVIDER === 'gemini') {
                response = await this.callGemini(message);
            }

            if (response) {
                this.addMessage('assistant', response);
                this.displayMessage('assistant', response);
            }
        } catch (error) {
            console.error('AI Error:', error);
            const errorMsg = 'Sorry, I encountered an error. Please try again.';
            this.displayMessage('error', errorMsg);
        } finally {
            this.showTyping(false);
        }
    },

    // Call OpenAI API
    async callOpenAI(message) {
        if (!this.CONFIG.OPENAI_API_KEY) {
            return 'Please configure OpenAI API key in settings.';
        }

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.CONFIG.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.CONFIG.MODEL.chatgpt,
                    messages: [
                        ...this.chatHistory.slice(-10).map(m => ({
                            role: m.role,
                            content: m.content
                        })),
                        { role: 'user', content: message }
                    ],
                    max_tokens: 1000,
                    temperature: 0.7
                })
            });

            const data = await response.json();
            if (data.error) {
                throw new Error(data.error.message);
            }

            return data.choices[0].message.content;
        } catch (error) {
            console.error('OpenAI Error:', error);
            return `Error: ${error.message}`;
        }
    },

    // Call Gemini API
    async callGemini(message) {
        if (!this.CONFIG.GEMINI_API_KEY) {
            return 'Please configure Gemini API key in settings.';
        }

        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.CONFIG.GEMINI_API_KEY}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        contents: [
                            {
                                parts: [
                                    { text: message }
                                ]
                            }
                        ],
                        generationConfig: {
                            maxOutputTokens: 1000,
                            temperature: 0.7
                        }
                    })
                }
            );

            const data = await response.json();
            if (data.error) {
                throw new Error(data.error.message);
            }

            return data.candidates[0].content.parts[0].text;
        } catch (error) {
            console.error('Gemini Error:', error);
            return `Error: ${error.message}`;
        }
    },

    // Add Message to History
    addMessage(role, content) {
        this.chatHistory.push({ role, content, timestamp: new Date() });
        if (this.chatHistory.length > this.maxMessages) {
            this.chatHistory.shift();
        }
        this.saveChatHistory();
    },

    // Display Message in Chat
    displayMessage(role, content) {
        const chatMessages = document.getElementById('ai-chat-messages');
        if (!chatMessages) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${role}`;
        messageDiv.innerHTML = `
            <div class="message-avatar">
                ${role === 'user' ? '👤' : role === 'assistant' ? '🤖' : '⚠️'}
            </div>
            <div class="message-content">${this.escapeHtml(content)}</div>
        `;

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    },

    // Show/Hide Typing Indicator
    showTyping(show) {
        const typingDiv = document.getElementById('ai-typing');
        if (typingDiv) {
            typingDiv.style.display = show ? 'block' : 'none';
        }
    },

    // ERP Data Analysis
    async analyzeTransactions() {
        try {
            const transactions = await API.getSheetData('TRANSACTIONS');
            const analysis = this.generateAnalysisPrompt('transactions', transactions);
            return await this.sendMessage(analysis);
        } catch (error) {
            console.error('Analysis Error:', error);
            return 'Unable to analyze transactions.';
        }
    },

    async analyzeDues() {
        try {
            const dues = await API.getSheetData('DUES');
            const analysis = this.generateAnalysisPrompt('dues', dues);
            return await this.sendMessage(analysis);
        } catch (error) {
            console.error('Analysis Error:', error);
            return 'Unable to analyze dues.';
        }
    },

    async generateReport(type) {
        try {
            let data;
            switch(type) {
                case 'summary':
                    data = await API.getDashboard();
                    break;
                case 'transactions':
                    data = await API.getSheetData('TRANSACTIONS');
                    break;
                case 'dues':
                    data = await API.getSheetData('DUES');
                    break;
                default:
                    return 'Unknown report type.';
            }

            const prompt = `Generate a comprehensive ${type} report based on this data: ${JSON.stringify(data)}`;
            return await this.callOpenAI(prompt);
        } catch (error) {
            console.error('Report Error:', error);
            return 'Unable to generate report.';
        }
    },

    // Generate Analysis Prompt
    generateAnalysisPrompt(type, data) {
        const summary = JSON.stringify(data).substring(0, 500);
        return `Analyze this ${type} data and provide insights, trends, and recommendations: ${summary}...`;
    },

    // Escape HTML
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    },

    // Save Chat History
    saveChatHistory() {
        localStorage.setItem('ai_chat_history', JSON.stringify(this.chatHistory));
    },

    // Load Chat History
    loadChatHistory() {
        const saved = localStorage.getItem('ai_chat_history');
        if (saved) {
            this.chatHistory = JSON.parse(saved);
        }
    },

    // Clear Chat
    clearChat() {
        this.chatHistory = [];
        localStorage.removeItem('ai_chat_history');
        const chatMessages = document.getElementById('ai-chat-messages');
        if (chatMessages) {
            chatMessages.innerHTML = '';
        }
    },

    // Set API Key
    setOpenAIKey(key) {
        this.CONFIG.OPENAI_API_KEY = key;
        localStorage.setItem('openai_api_key', key);
    },

    setGeminiKey(key) {
        this.CONFIG.GEMINI_API_KEY = key;
        localStorage.setItem('gemini_api_key', key);
    },

    // Set Provider
    setProvider(provider) {
        this.CONFIG.PROVIDER = provider;
        localStorage.setItem('ai_provider', provider);
        const badge = document.getElementById('ai-provider-badge');
        if (badge) {
            badge.textContent = provider === 'chatgpt' ? 'ChatGPT' : 'Gemini';
        }
    }
};

// Initialize AI on page load
if (Auth.isAuthenticated()) {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => AI.initialize(), 1000);
    });
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AI;
}
