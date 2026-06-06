/* ===========================
   ITEMS MODULE
   =========================== */

const Items = {
    currentPage: 1,
    pageSize: 15,
    allItems: [],
    filteredItems: [],
    filters: {
        searchQuery: '',
        itemType: 'all'
    },

    async initialize() {
        await this.loadItems();
        this.setupEventListeners();
    },

    async loadItems() {
        try {
            const response = await API.getSheetData('ITEM LIST');

            if (response.status === 'success') {
                this.allItems = response.rows;
                this.filteredItems = [...this.allItems];
                this.displayItems();
            } else {
                this.showError('Failed to load items');
            }
        } catch (error) {
            console.error('Error loading items:', error);
            this.showError('Error loading items');
        }
    },

    displayItems() {
        const container = document.getElementById('items-table-body');
        if (!container) return;

        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        const paginatedItems = this.filteredItems.slice(start, end);

        if (paginatedItems.length === 0) {
            container.innerHTML = `<tr><td colspan="6" class="text-center p-4">No items found</td></tr>`;
            return;
        }

        let html = '';
        paginatedItems.forEach((item, index) => {
            html += `
                <tr>
                    <td>${start + index + 1}</td>
                    <td><strong>${item[0] || '-'}</strong></td>
                    <td>${item[1] || '-'}</td>
                    <td>${item[2] || '-'}</td>
                    <td class="text-end">
                        <span class="badge bg-info">₹ ${this.formatNumber(item[3] || 0)}</span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-info" onclick="Items.viewItemDetails('${item[0]}')">
                            👁️ View
                        </button>
                    </td>
                </tr>
            `;
        });

        container.innerHTML = html;
        this.updatePagination();
        this.updateItemStats();
    },

    async viewItemDetails(itemId) {
        try {
            const response = await API.getSheetData('ITEM DETAILS');
            const itemDetails = response.rows.find(row => row[0] === itemId);
            
            if (itemDetails) {
                const modal = document.getElementById('item-details-modal');
                if (modal) {
                    document.getElementById('item-detail-id').textContent = itemDetails[0];
                    document.getElementById('item-detail-name').textContent = itemDetails[1];
                    document.getElementById('item-detail-type').textContent = itemDetails[2];
                    document.getElementById('item-detail-description').textContent = itemDetails[3] || 'N/A';
                    document.getElementById('item-detail-price').textContent = `₹ ${this.formatNumber(itemDetails[4])}`;
                    document.getElementById('item-detail-quantity').textContent = itemDetails[5] || '0';
                    document.getElementById('item-detail-unit').textContent = itemDetails[6] || 'N/A';
                    
                    modal.style.display = 'block';
                }
            }
        } catch (error) {
            console.error('Error loading item details:', error);
        }
    },

    searchItems(query) {
        this.filters.searchQuery = query.toLowerCase();
        this.applyFilters();
    },

    filterByType(type) {
        this.filters.itemType = type;
        this.applyFilters();
    },

    applyFilters() {
        this.filteredItems = this.allItems.filter(item => {
            // Search filter
            if (this.filters.searchQuery) {
                const searchMatch = 
                    item[0].toLowerCase().includes(this.filters.searchQuery) ||
                    item[1].toLowerCase().includes(this.filters.searchQuery) ||
                    item[2].toLowerCase().includes(this.filters.searchQuery);
                if (!searchMatch) return false;
            }

            // Item type filter
            if (this.filters.itemType !== 'all' && item[2] !== this.filters.itemType) {
                return false;
            }

            return true;
        });

        this.currentPage = 1;
        this.displayItems();
    },

    updateItemStats() {
        let totalValue = 0;
        let avgPrice = 0;
        
        this.filteredItems.forEach(item => {
            const price = parseFloat(item[3]) || 0;
            totalValue += price;
        });

        avgPrice = this.filteredItems.length > 0 ? totalValue / this.filteredItems.length : 0;

        const statsContainer = document.getElementById('items-stats');
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class="stat-box">
                    <div class="stat-label">Total Items</div>
                    <div class="stat-value">${this.filteredItems.length}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">Total Value</div>
                    <div class="stat-value">₹ ${this.formatNumber(totalValue)}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">Average Price</div>
                    <div class="stat-value">₹ ${this.formatNumber(avgPrice)}</div>
                </div>
            `;
        }
    },

    updatePagination() {
        const totalPages = Math.ceil(this.filteredItems.length / this.pageSize);
        const paginationContainer = document.getElementById('items-pagination');
        if (!paginationContainer) return;

        let html = '';
        for (let i = 1; i <= totalPages; i++) {
            html += `
                <li class="page-item ${i === this.currentPage ? 'active' : ''}">
                    <button class="page-link" onclick="Items.goToPage(${i})">${i}</button>
                </li>
            `;
        }
        paginationContainer.innerHTML = html;
    },

    goToPage(page) {
        this.currentPage = page;
        this.displayItems();
    },

    exportToCSV() {
        let csv = 'Item ID,Item Name,Type,Rate,Quantity\n';
        this.filteredItems.forEach(item => {
            csv += `"${item[0]}","${item[1]}","${item[2]}","${item[3]}","${item[4] || 0}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `items-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    },

    formatNumber(num) {
        return new Intl.NumberFormat('en-IN').format(num);
    },

    setupEventListeners() {
        const searchInput = document.getElementById('items-search');
        if (searchInput) {
            searchInput.addEventListener('keyup', (e) => {
                this.searchItems(e.target.value);
            });
        }

        const typeFilter = document.getElementById('items-type-filter');
        if (typeFilter) {
            typeFilter.addEventListener('change', (e) => {
                this.filterByType(e.target.value);
            });
        }
    },

    showError(message) {
        console.error(message);
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Items;
}
