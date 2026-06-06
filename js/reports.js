/* ===========================
   REPORTS MODULE
   =========================== */

const Reports = {
    currentReport: 'date-wise',
    reportData: {},

    async initialize() {
        this.setupEventListeners();
        await this.loadDateWiseReport();
    },

    async loadDateWiseReport() {
        try {
            const response = await API.getSheetData('BY DATE');
            if (response.status === 'success') {
                this.displayDateWiseReport(response.rows);
            }
        } catch (error) {
            console.error('Error loading date-wise report:', error);
        }
    },

    displayDateWiseReport(rows) {
        const container = document.getElementById('report-content');
        if (!container) return;

        let html = '<h3>Date-Wise Report</h3><table class="table table-striped"><thead><tr><th>Date</th><th>Amount</th><th>Count</th></tr></thead><tbody>';
        
        rows.forEach(row => {
            html += `<tr><td>${row[0]}</td><td>₹${this.formatNumber(row[1])}</td><td>${row[2]}</td></tr>`;
        });
        
        html += '</tbody></table>';
        container.innerHTML = html;
    },

    async loadItemWiseReport() {
        try {
            const response = await API.getSheetData('ITEM BY DATE');
            if (response.status === 'success') {
                this.displayItemWiseReport(response.rows);
            }
        } catch (error) {
            console.error('Error loading item-wise report:', error);
        }
    },

    displayItemWiseReport(rows) {
        const container = document.getElementById('report-content');
        if (!container) return;

        let html = '<h3>Item-Wise Report</h3><table class="table table-striped"><thead><tr><th>Item</th><th>Quantity</th><th>Rate</th><th>Total</th></tr></thead><tbody>';
        
        rows.forEach(row => {
            const total = parseFloat(row[2]) * parseFloat(row[3]) || 0;
            html += `<tr><td>${row[0]}</td><td>${row[1]}</td><td>₹${this.formatNumber(row[2])}</td><td>₹${this.formatNumber(total)}</td></tr>`;
        });
        
        html += '</tbody></table>';
        container.innerHTML = html;
    },

    async loadCreditReport() {
        try {
            const response = await API.getSheetData('TRANSACTIONS');
            if (response.status === 'success') {
                const creditRows = response.rows.filter(row => parseFloat(row[2]) > 0);
                this.displayCreditReport(creditRows);
            }
        } catch (error) {
            console.error('Error loading credit report:', error);
        }
    },

    displayCreditReport(rows) {
        const container = document.getElementById('report-content');
        if (!container) return;

        let totalCredit = 0;
        let html = '<h3>Credit Report</h3><table class="table table-striped"><thead><tr><th>Date</th><th>Description</th><th>Amount</th></tr></thead><tbody>';
        
        rows.forEach(row => {
            const amount = parseFloat(row[2]) || 0;
            totalCredit += amount;
            html += `<tr><td>${row[0]}</td><td>${row[1]}</td><td><span class="badge bg-success">₹${this.formatNumber(amount)}</span></td></tr>`;
        });
        
        html += '</tbody></table>';
        html += `<div class="alert alert-info mt-3"><strong>Total Credit:</strong> ₹${this.formatNumber(totalCredit)}</div>`;
        container.innerHTML = html;
    },

    async loadDuesReport() {
        try {
            const response = await API.getSheetData('DUES');
            if (response.status === 'success') {
                this.displayDuesReport(response.rows);
            }
        } catch (error) {
            console.error('Error loading dues report:', error);
        }
    },

    displayDuesReport(rows) {
        const container = document.getElementById('report-content');
        if (!container) return;

        let totalDues = 0;
        let html = '<h3>Dues Report</h3><table class="table table-striped"><thead><tr><th>Customer</th><th>Amount</th><th>Status</th></tr></thead><tbody>';
        
        rows.forEach(row => {
            const amount = parseFloat(row[2]) || 0;
            totalDues += Math.abs(amount);
            const status = amount > 0 ? '<span class="badge bg-danger">Outstanding</span>' : '<span class="badge bg-success">Cleared</span>';
            html += `<tr><td>${row[1]}</td><td>₹${this.formatNumber(Math.abs(amount))}</td><td>${status}</td></tr>`;
        });
        
        html += '</tbody></table>';
        html += `<div class="alert alert-warning mt-3"><strong>Total Outstanding Dues:</strong> ₹${this.formatNumber(totalDues)}</div>`;
        container.innerHTML = html;
    },

    async loadSummaryReport() {
        try {
            const dashboard = await API.getDashboard();
            if (dashboard.status === 'success') {
                this.displaySummaryReport(dashboard.data);
            }
        } catch (error) {
            console.error('Error loading summary report:', error);
        }
    },

    displaySummaryReport(data) {
        const container = document.getElementById('report-content');
        if (!container) return;

        const html = `
            <h3>Summary Report</h3>
            <div class="row">
                <div class="col-md-3">
                    <div class="card bg-success text-white">
                        <div class="card-body">
                            <h6>Total Income</h6>
                            <h3>₹${this.formatNumber(data.income)}</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-danger text-white">
                        <div class="card-body">
                            <h6>Total Expense</h6>
                            <h3>₹${this.formatNumber(data.expense)}</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-primary text-white">
                        <div class="card-body">
                            <h6>Net Balance</h6>
                            <h3>₹${this.formatNumber(data.balance)}</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-warning text-dark">
                        <div class="card-body">
                            <h6>Market Dues</h6>
                            <h3>₹${this.formatNumber(data.dues)}</h3>
                        </div>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML = html;
    },

    exportToCSV(reportName) {
        const table = document.querySelector('table');
        if (!table) {
            alert('No table to export');
            return;
        }

        let csv = '';
        const rows = table.querySelectorAll('tr');
        rows.forEach(row => {
            const cols = row.querySelectorAll('td, th');
            const csvRow = Array.from(cols).map(col => `"${col.textContent.trim()}"`).join(',');
            csv += csvRow + '\n';
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportName}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    },

    printReport() {
        window.print();
    },

    formatNumber(num) {
        return new Intl.NumberFormat('en-IN').format(num);
    },

    setupEventListeners() {
        const dateWiseBtn = document.getElementById('report-date-wise');
        const itemWiseBtn = document.getElementById('report-item-wise');
        const creditBtn = document.getElementById('report-credit');
        const duesBtn = document.getElementById('report-dues');
        const summaryBtn = document.getElementById('report-summary');

        if (dateWiseBtn) dateWiseBtn.addEventListener('click', () => this.loadDateWiseReport());
        if (itemWiseBtn) itemWiseBtn.addEventListener('click', () => this.loadItemWiseReport());
        if (creditBtn) creditBtn.addEventListener('click', () => this.loadCreditReport());
        if (duesBtn) duesBtn.addEventListener('click', () => this.loadDuesReport());
        if (summaryBtn) summaryBtn.addEventListener('click', () => this.loadSummaryReport());
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Reports;
}
