/* ===========================
   DUES MODULE
   =========================== */

const Dues = {
    currentPage: 1,
    pageSize: 10,
    allDues: [],
    filteredDues: [],
    filters: {
        searchQuery: '',
        status: 'all'
    },

    async initialize() {
        await this.loadDues();
        this.setupEventListeners();
    },

    async loadDues() {
        try {
            const response = await API.getSheetData('DUES');

            if (response.status === 'success') {
                this.allDues = response.rows;
                this.filteredDues = [...this.allDues];
                this.displayDues();
            } else {
                this.showError('Failed to load dues');
            }
        } catch (error) {
            console.error('Error loading dues:', error);
            this.showError('Error loading dues');
        }
    },

    displayDues() {
        const container = document.getElementById('dues-table-body');
        if (!container) return;

        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        const paginatedDues = this.filteredDues.slice(start, end);

        if (paginatedDues.length === 0) {
            container.innerHTML = `<tr><td colspan="5" class="text-center p-4">No dues found</td></tr>`;
            return;
        }

        let html = '';
        paginatedDues.forEach((due, index) => {
            const amount = parseFloat(due[2]) || 0;
            const statusBadge = amount > 0 ? '<span class="badge bg-danger">Outstanding</span>' : '<span class="badge bg-success">Cleared</span>';
            
            html += `
                <tr>
                    <td>${start + index + 1}</td>
                    <td>${due[0] || '-'}</td>
                    <td>${due[1] || '-'}</td>
                    <td class="text-end">
                        <strong>₹ ${this.formatNumber(Math.abs(amount))}</strong>
                    </td>
                    <td>
                        ${statusBadge}
                        <button class="btn btn-sm btn-info ms-2" onclick="Dues.viewDetails('${due[0]}')">
                            👁️ View
                        </button>
                    </td>
                </tr>
            `;
        });

        container.innerHTML = html;
        this.updatePagination();
        this.updateDuesStats();
    },

    viewDetails(customerId) {
        const due = this.allDues.find(d => d[0] === customerId);
        if (due) {
            const modal = document.getElementById('due-details-modal');
            if (modal) {
                document.getElementById('due-customer-id').textContent = due[0];
                document.getElementById('due-customer-name').textContent = due[1];
                document.getElementById('due-amount').textContent = `₹ ${this.formatNumber(due[2])}`;
                document.getElementById('due-date').textContent = due[3] || 'N/A';
                document.getElementById('due-notes').textContent = due[4] || 'No notes';
                
                modal.style.display = 'block';
            }
        }
    },

    searchDues(query) {
        this.filters.searchQuery = query.toLowerCase();
        this.applyFilters();
    },

    filterByStatus(status) {
        this.filters.status = status;
        this.applyFilters();
    },

    applyFilters() {
        this.filteredDues = this.allDues.filter(due => {
            // Search filter
            if (this.filters.searchQuery) {
                const searchMatch = 
                    due[0].toLowerCase().includes(this.filters.searchQuery) ||
                    due[1].toLowerCase().includes(this.filters.searchQuery);
                if (!searchMatch) return false;
            }

            // Status filter
            if (this.filters.status !== 'all') {
                const amount = parseFloat(due[2]) || 0;
                if (this.filters.status === 'outstanding' && amount <= 0) return false;
                if (this.filters.status === 'cleared' && amount > 0) return false;
            }

            return true;
        });

        this.currentPage = 1;
        this.displayDues();
    },

    updateDuesStats() {
        let totalOutstanding = 0;
        let totalCleared = 0;
        
        this.allDues.forEach(due => {
            const amount = parseFloat(due[2]) || 0;
            if (amount > 0) totalOutstanding += amount;
            else totalCleared += Math.abs(amount);
        });

        const statsContainer = document.getElementById('dues-stats');
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class="stat-box">
                    <div class="stat-label">Total Outstanding</div>
                    <div class="stat-value outstanding">₹ ${this.formatNumber(totalOutstanding)}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">Total Cleared</div>
                    <div class="stat-value cleared">₹ ${this.formatNumber(totalCleared)}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">Number of Dues</div>
                    <div class="stat-value">${this.filteredDues.length}</div>
                </div>
            `;
        }
    },

    updatePagination() {
        const totalPages = Math.ceil(this.filteredDues.length / this.pageSize);
        const paginationContainer = document.getElementById('dues-pagination');
        if (!paginationContainer) return;

        let html = '';
        for (let i = 1; i <= totalPages; i++) {
            html += `
                <li class="page-item ${i === this.currentPage ? 'active' : ''}">
                    <button class="page-link" onclick="Dues.goToPage(${i})">${i}</button>
                </li>
            `;
        }
        paginationContainer.innerHTML = html;
    },

    goToPage(page) {
        this.currentPage = page;
        this.displayDues();
    },

    exportToCSV() {
        let csv = 'Customer ID,Customer Name,Outstanding Amount,Due Date,Notes\n';
        this.filteredDues.forEach(due => {
            csv += `"${due[0]}","${due[1]}","${due[2]}","${due[3]}","${due[4] || 'N/A'}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dues-report-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    },

    formatNumber(num) {
        return new Intl.NumberFormat('en-IN').format(num);
    },

    setupEventListeners() {
        const searchInput = document.getElementById('dues-search');
        if (searchInput) {
            searchInput.addEventListener('keyup', (e) => {
                this.searchDues(e.target.value);
            });
        }

        const statusFilter = document.getElementById('dues-status-filter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.filterByStatus(e.target.value);
            });
        }
    },

    showError(message) {
        console.error(message);
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Dues;
}
