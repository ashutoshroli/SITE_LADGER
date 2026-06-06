/* ===========================
   TRANSACTIONS MODULE
   =========================== */

const Transactions = {
    currentPage: 1,
    pageSize: 15,
    allTransactions: [],
    filteredTransactions: [],
    filters: {
        startDate: null,
        endDate: null,
        paymentMode: 'all',
        searchQuery: ''
    },

    async initialize() {
        await this.loadTransactions();
        this.setupEventListeners();
    },

    async loadTransactions() {
        try {
            const response = await API.getSheetData('TRANSACTIONS');

            if (response.status === 'success') {
                this.allTransactions = response.rows;
                this.filteredTransactions = [...this.allTransactions];
                this.displayTransactions();
            } else {
                this.showError('Failed to load transactions');
            }
        } catch (error) {
            console.error('Error loading transactions:', error);
            this.showError('Error loading transactions');
        }
    },

    displayTransactions() {
        const container = document.getElementById('transactions-table-body');
        if (!container) return;

        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        const paginatedTransactions = this.filteredTransactions.slice(start, end);

        if (paginatedTransactions.length === 0) {
            container.innerHTML = `<tr><td colspan="6" class="text-center p-4">No transactions found</td></tr>`;
            return;
        }

        let html = '';
        paginatedTransactions.forEach((transaction, index) => {
            const amount = parseFloat(transaction[2]) || 0;
            const amountClass = amount > 0 ? 'credit' : 'debit';
            
            html += `
                <tr>
                    <td>${start + index + 1}</td>
                    <td>${transaction[0] || '-'}</td>
                    <td>${transaction[1] || '-'}</td>
                    <td class="text-end">
                        <span class="badge ${amountClass === 'credit' ? 'bg-success' : 'bg-danger'}">
                            ₹ ${this.formatNumber(Math.abs(amount))}
                        </span>
                    </td>
                    <td>${transaction[3] || '-'}</td>
                    <td>
                        <button class="btn btn-sm btn-info" onclick="Transactions.viewDetails('${index}')">
                            👁️ View
                        </button>
                    </td>
                </tr>
            `;
        });

        container.innerHTML = html;
        this.updatePagination();
        this.updateTransactionStats();
    },

    viewDetails(index) {
        const transaction = this.filteredTransactions[index];
        if (transaction) {
            const modal = document.getElementById('transaction-details-modal');
            if (modal) {
                document.getElementById('transaction-date').textContent = transaction[0];
                document.getElementById('transaction-description').textContent = transaction[1];
                document.getElementById('transaction-amount').textContent = `₹ ${this.formatNumber(transaction[2])}`;
                document.getElementById('transaction-mode').textContent = transaction[3];
                document.getElementById('transaction-ref').textContent = transaction[4] || 'N/A';
                
                modal.style.display = 'block';
            }
        }
    },

    filterByDateRange(startDate, endDate) {
        this.filters.startDate = startDate;
        this.filters.endDate = endDate;
        this.applyFilters();
    },

    filterByPaymentMode(mode) {
        this.filters.paymentMode = mode;
        this.applyFilters();
    },

    searchTransactions(query) {
        this.filters.searchQuery = query.toLowerCase();
        this.applyFilters();
    },

    applyFilters() {
        this.filteredTransactions = this.allTransactions.filter(transaction => {
            // Search filter
            if (this.filters.searchQuery) {
                const searchMatch = 
                    transaction[0].toLowerCase().includes(this.filters.searchQuery) ||
                    transaction[1].toLowerCase().includes(this.filters.searchQuery);
                if (!searchMatch) return false;
            }

            // Date filter
            if (this.filters.startDate || this.filters.endDate) {
                const transDate = new Date(transaction[0]);
                if (this.filters.startDate && transDate < new Date(this.filters.startDate)) return false;
                if (this.filters.endDate && transDate > new Date(this.filters.endDate)) return false;
            }

            // Payment mode filter
            if (this.filters.paymentMode !== 'all' && transaction[3] !== this.filters.paymentMode) {
                return false;
            }

            return true;
        });

        this.currentPage = 1;
        this.displayTransactions();
    },

    updateTransactionStats() {
        let totalCredit = 0;
        let totalDebit = 0;
        
        this.filteredTransactions.forEach(transaction => {
            const amount = parseFloat(transaction[2]) || 0;
            if (amount > 0) totalCredit += amount;
            else totalDebit += Math.abs(amount);
        });

        const statsContainer = document.getElementById('transaction-stats');
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class="stat-box">
                    <div class="stat-label">Total Credit</div>
                    <div class="stat-value credit">₹ ${this.formatNumber(totalCredit)}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">Total Debit</div>
                    <div class="stat-value debit">₹ ${this.formatNumber(totalDebit)}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">Net Amount</div>
                    <div class="stat-value">${totalCredit - totalDebit > 0 ? '+' : ''}₹ ${this.formatNumber(totalCredit - totalDebit)}</div>
                </div>
            `;
        }
    },

    updatePagination() {
        const totalPages = Math.ceil(this.filteredTransactions.length / this.pageSize);
        const paginationContainer = document.getElementById('transactions-pagination');
        if (!paginationContainer) return;

        let html = '';
        for (let i = 1; i <= totalPages; i++) {
            html += `
                <li class="page-item ${i === this.currentPage ? 'active' : ''}">
                    <button class="page-link" onclick="Transactions.goToPage(${i})">${i}</button>
                </li>
            `;
        }
        paginationContainer.innerHTML = html;
    },

    goToPage(page) {
        this.currentPage = page;
        this.displayTransactions();
    },

    exportToCSV() {
        let csv = 'Date,Description,Amount,Mode,Reference\n';
        this.filteredTransactions.forEach(transaction => {
            csv += `"${transaction[0]}","${transaction[1]}","${transaction[2]}","${transaction[3]}","${transaction[4] || 'N/A'}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    },

    printTransactions() {
        const printWindow = window.open('', '', 'height=600,width=800');
        let html = '<h2>Transaction Report</h2><table border="1" cellpadding="5">';
        html += '<thead><tr><th>Date</th><th>Description</th><th>Amount</th><th>Mode</th><th>Reference</th></tr></thead><tbody>';
        
        this.filteredTransactions.forEach(transaction => {
            html += `<tr><td>${transaction[0]}</td><td>${transaction[1]}</td><td>₹${transaction[2]}</td><td>${transaction[3]}</td><td>${transaction[4] || 'N/A'}</td></tr>`;
        });
        
        html += '</tbody></table>';
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
    },

    formatNumber(num) {
        return new Intl.NumberFormat('en-IN').format(num);
    },

    setupEventListeners() {
        const searchInput = document.getElementById('transactions-search');
        if (searchInput) {
            searchInput.addEventListener('keyup', (e) => {
                this.searchTransactions(e.target.value);
            });
        }

        const startDateInput = document.getElementById('filter-start-date');
        const endDateInput = document.getElementById('filter-end-date');
        if (startDateInput && endDateInput) {
            startDateInput.addEventListener('change', () => {
                this.filterByDateRange(startDateInput.value, endDateInput.value);
            });
            endDateInput.addEventListener('change', () => {
                this.filterByDateRange(startDateInput.value, endDateInput.value);
            });
        }

        const modeFilter = document.getElementById('filter-payment-mode');
        if (modeFilter) {
            modeFilter.addEventListener('change', (e) => {
                this.filterByPaymentMode(e.target.value);
            });
        }
    },

    showError(message) {
        console.error(message);
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Transactions;
}
