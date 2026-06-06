/* ===========================
   VILLAGES MODULE
   =========================== */

const Villages = {
    currentPage: 1,
    pageSize: 10,
    allVillages: [],
    filteredVillages: [],
    searchQuery: '',

    async initialize() {
        await this.loadVillages();
        this.setupEventListeners();
    },

    async loadVillages() {
        try {
            const response = await API.getSheetData('VILLAGE MASTER');

            if (response.status === 'success') {
                this.allVillages = response.rows;
                this.filteredVillages = [...this.allVillages];
                this.displayVillages();
            } else {
                this.showError('Failed to load villages');
            }
        } catch (error) {
            console.error('Error loading villages:', error);
            this.showError('Error loading villages');
        }
    },

    displayVillages() {
        const container = document.getElementById('villages-table-body');
        if (!container) return;

        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        const paginatedVillages = this.filteredVillages.slice(start, end);

        if (paginatedVillages.length === 0) {
            container.innerHTML = `<tr><td colspan="5" class="text-center p-4">No villages found</td></tr>`;
            return;
        }

        let html = '';
        paginatedVillages.forEach((village, index) => {
            html += `
                <tr>
                    <td>${start + index + 1}</td>
                    <td><strong>${village[0] || '-'}</strong></td>
                    <td>${village[1] || '-'}</td>
                    <td>${village[2] || '-'}</td>
                    <td>
                        <button class="btn btn-sm btn-info" onclick="Villages.viewVillageDetails('${village[0]}')">
                            👁️ View
                        </button>
                    </td>
                </tr>
            `;
        });

        container.innerHTML = html;
        this.updatePagination();
    },

    viewVillageDetails(villageId) {
        const village = this.allVillages.find(v => v[0] === villageId);
        if (village) {
            const modal = document.getElementById('village-details-modal');
            if (modal) {
                document.getElementById('village-detail-id').textContent = village[0];
                document.getElementById('village-detail-name').textContent = village[0];
                document.getElementById('village-detail-district').textContent = village[1] || 'N/A';
                document.getElementById('village-detail-state').textContent = village[2] || 'N/A';
                document.getElementById('village-detail-code').textContent = village[3] || 'N/A';
                
                modal.style.display = 'block';
            }
        }
    },

    searchVillages(query) {
        this.searchQuery = query.toLowerCase();
        this.filteredVillages = this.allVillages.filter(village => 
            village[0].toLowerCase().includes(this.searchQuery) ||
            village[1].toLowerCase().includes(this.searchQuery) ||
            village[2].toLowerCase().includes(this.searchQuery)
        );
        this.currentPage = 1;
        this.displayVillages();
    },

    updatePagination() {
        const totalPages = Math.ceil(this.filteredVillages.length / this.pageSize);
        const paginationContainer = document.getElementById('villages-pagination');
        if (!paginationContainer) return;

        let html = '';
        for (let i = 1; i <= totalPages; i++) {
            html += `
                <li class="page-item ${i === this.currentPage ? 'active' : ''}">
                    <button class="page-link" onclick="Villages.goToPage(${i})">${i}</button>
                </li>
            `;
        }
        paginationContainer.innerHTML = html;
    },

    goToPage(page) {
        this.currentPage = page;
        this.displayVillages();
    },

    exportToCSV() {
        let csv = 'Village Name,District,State,Code\n';
        this.filteredVillages.forEach(village => {
            csv += `"${village[0]}","${village[1]}","${village[2]}","${village[3] || 'N/A'}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `villages-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    },

    setupEventListeners() {
        const searchInput = document.getElementById('villages-search');
        if (searchInput) {
            searchInput.addEventListener('keyup', (e) => {
                this.searchVillages(e.target.value);
            });
        }
    },

    showError(message) {
        console.error(message);
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Villages;
}
