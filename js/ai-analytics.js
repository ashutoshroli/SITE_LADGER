/* ===========================
   AI ANALYTICS MODULE
   =========================== */

const AIAnalytics = {
    // Get Transaction Analysis
    async analyzeTransactions() {
        try {
            const response = await API.getSheetData('TRANSACTIONS');
            if (response.status !== 'success') return null;

            const data = response.rows;
            const prompt = this.generateTransactionPrompt(data);

            return await this.getAIAnalysis(prompt);
        } catch (error) {
            console.error('Transaction analysis error:', error);
            return null;
        }
    },

    // Get Dues Analysis
    async analyzeDues() {
        try {
            const response = await API.getSheetData('DUES');
            if (response.status !== 'success') return null;

            const data = response.rows;
            const prompt = this.generateDuesPrompt(data);

            return await this.getAIAnalysis(prompt);
        } catch (error) {
            console.error('Dues analysis error:', error);
            return null;
        }
    },

    // Get Business Summary
    async getBusinessSummary() {
        try {
            const dashboard = await API.getDashboard();
            if (dashboard.status !== 'success') return null;

            const prompt = this.generateSummaryPrompt(dashboard.data);
            return await this.getAIAnalysis(prompt);
        } catch (error) {
            console.error('Summary analysis error:', error);
            return null;
        }
    },

    // Generate Transaction Analysis Prompt
    generateTransactionPrompt(transactions) {
        let totalCredit = 0, totalDebit = 0, count = 0;
        transactions.forEach(t => {
            const amount = parseFloat(t[2]) || 0;
            if (amount > 0) totalCredit += amount;
            else totalDebit += Math.abs(amount);
            count++;
        });

        return `Analyze these transaction statistics and provide insights:
        - Total Transactions: ${count}
        - Total Credits: ₹${totalCredit.toFixed(2)}
        - Total Debits: ₹${totalDebit.toFixed(2)}
        - Net Flow: ₹${(totalCredit - totalDebit).toFixed(2)}
        
        Please identify:
        1. Key transaction trends
        2. Potential issues or anomalies
        3. Recommendations for improvement`;
    },

    // Generate Dues Analysis Prompt
    generateDuesPrompt(dues) {
        let outstanding = 0, cleared = 0, totalCustomers = 0;
        dues.forEach(d => {
            const amount = parseFloat(d[2]) || 0;
            if (amount > 0) outstanding += amount;
            else cleared += Math.abs(amount);
            totalCustomers++;
        });

        return `Analyze these dues statistics and provide insights:
        - Total Customers: ${totalCustomers}
        - Outstanding Dues: ₹${outstanding.toFixed(2)}
        - Cleared Dues: ₹${cleared.toFixed(2)}
        - Outstanding Percentage: ${((outstanding / (outstanding + cleared)) * 100).toFixed(2)}%
        
        Please provide:
        1. Risk assessment for outstanding dues
        2. Collection strategy recommendations
        3. Customer payment patterns analysis`;
    },

    // Generate Business Summary Prompt
    generateSummaryPrompt(data) {
        return `Analyze this business performance data and provide strategic insights:
        - Total Income: ₹${data.income.toFixed(2)}
        - Total Expense: ₹${data.expense.toFixed(2)}
        - Net Balance: ₹${data.balance.toFixed(2)}
        - Outstanding Dues: ₹${data.dues.toFixed(2)}
        - Profit Margin: ${((data.balance / data.income) * 100).toFixed(2)}%
        
        Please provide:
        1. Overall business health assessment
        2. Key performance indicators analysis
        3. Strategic recommendations for growth
        4. Risk mitigation suggestions`;
    },

    // Get AI Analysis
    async getAIAnalysis(prompt) {
        return await AIChat.sendMessage(prompt);
    },

    // Generate Predictive Report
    async generatePredictiveReport() {
        try {
            const dashboard = await API.getDashboard();
            const transactions = await API.getSheetData('TRANSACTIONS');
            
            const prompt = `Based on historical business data, provide a predictive analysis:
            Current Metrics:
            - Monthly Income: ₹${dashboard.data.income}
            - Monthly Expense: ₹${dashboard.data.expense}
            - Recent Transaction Count: ${transactions.rows.length}
            
            Please predict:
            1. Expected revenue for next quarter
            2. Potential expense trends
            3. Cash flow forecast
            4. Growth opportunities`;

            return await this.getAIAnalysis(prompt);
        } catch (error) {
            console.error('Predictive report error:', error);
            return null;
        }
    },

    // Anomaly Detection
    async detectAnomalies() {
        try {
            const transactions = await API.getSheetData('TRANSACTIONS');
            const amounts = transactions.rows.map(t => parseFloat(t[2]) || 0);
            const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
            const stdDev = Math.sqrt(amounts.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / amounts.length);

            const anomalies = amounts.filter(a => Math.abs(a - mean) > 2 * stdDev).length;

            const prompt = `Analyze these transaction anomalies:
            - Total Transactions: ${transactions.rows.length}
            - Average Transaction: ₹${mean.toFixed(2)}
            - Anomalies Detected: ${anomalies}
            - Anomaly Percentage: ${((anomalies / transactions.rows.length) * 100).toFixed(2)}%
            
            Please provide:
            1. Cause analysis
            2. Fraud risk assessment
            3. Remedial actions`;

            return await this.getAIAnalysis(prompt);
        } catch (error) {
            console.error('Anomaly detection error:', error);
            return null;
        }
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIAnalytics;
}
