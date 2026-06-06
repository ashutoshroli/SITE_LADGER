/* ===========================
   MAIN APPLICATION CONTROLLER
   =========================== */

let currentTheme = localStorage.getItem('theme') || 'light';
let currentPage = 'dashboard';

// Initialize Application
document.addEventListener('DOMContentLoaded', async function() {
    // Check authentication
    if (Auth.isAuthenticated()) {
        await initializeDashboard();
    } else {
        showLoginSection();
    }
});

// Initialize Dashboard
async function initializeDashboard() {
    // Load components
    await loadComponents();
    
    // Update theme
    applyTheme(currentTheme);
    
    // Update user info
    const user = Auth.getCurrentUser();
    if (user) {
        document.getElementById('userNameNav').textContent = user.name || 'User';
    }
    
    // Initialize modules
    await Dashboard.initialize();
    
    // Show dashboard section
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('dashboard-section').style.display = 'flex';
}

// Load HTML Components
async function loadComponents() {
    try {
        // Load Sidebar
        const sidebarRes = await fetch('components/sidebar.html');
        const sidebarHTML = await sidebarRes.text();
        document.getElementById('sidebar-container').innerHTML = sidebarHTML;
        
        // Load Navbar
        const navbarRes = await fetch('components/navbar.html');
        const navbarHTML = await navbarRes.text();
        document.getElementById('navbar-container').innerHTML = navbarHTML;
        
        // Load Footer
        const footerRes = await fetch('components/footer.html');
        const footerHTML = await footerRes.text();
        document.getElementById('footer-container').innerHTML = footerHTML;
        
        // Setup event listeners for navigation
        setupNavigation();
    } catch (error) {
        console.error('Error loading components:', error);
    }
}

// Setup Navigation
function setupNavigation() {
    const navLinks = document.querySelectorAll('.sidebar-menu a[data-page]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            navigateToPage(page);
        });
    });
}

// Navigate to Page
async function navigateToPage(page) {
    currentPage = page;
    
    // Hide all views
    document.querySelectorAll('.view-section').forEach(view => {
        view.classList.remove('active');
    });
    
    // Remove active class from all nav links
    document.querySelectorAll('.sidebar-menu a').forEach(link => {
        link.classList.remove('active');
    });
    
    // Show selected view
    const viewId = `${page}-view`;
    const viewElement = document.getElementById(viewId);
    if (viewElement) {
        viewElement.classList.add('active');
    }
    
    // Mark nav link as active
    const activeLink = document.querySelector(`.sidebar-menu a[data-page="${page}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    // Close sidebar on mobile
    toggleSidebar(false);
    
    // Initialize page-specific modules
    switch(page) {
        case 'dashboard':
            await Dashboard.initialize();
            break;
        case 'users':
            await Users.initialize();
            break;
        case 'transactions':
            await Transactions.initialize();
            break;
        case 'dues':
            await Dues.initialize();
            break;
        case 'items':
            await Items.initialize();
            break;
        case 'villages':
            await Villages.initialize();
            break;
        case 'reports':
            await Reports.initialize();
            break;
        case 'invoice':
            await Invoice.initialize();
            break;
        case 'profile':
            await Profile.initialize();
            break;
    }
}

// Login Handler
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const loginBtn = document.getElementById('login-btn');
    const errorBox = document.getElementById('error-msg');
    
    if (!email || !password) {
        showError('Please enter email and password', errorBox);
        return;
    }
    
    // Show loading
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
    loginBtn.disabled = true;
    errorBox.classList.add('d-none');
    
    try {
        const result = await Auth.login(email, password);
        
        if (result.success) {
            // Success - initialize dashboard
            await initializeDashboard();
        } else {
            // Show error
            showError(result.message, errorBox);
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('Server connection failed', errorBox);
    } finally {
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> LOGIN';
        loginBtn.disabled = false;
    }
}

// Show Login Section
function showLoginSection() {
    document.getElementById('login-section').style.display = 'block';
    document.getElementById('dashboard-section').style.display = 'none';
}

// Show Error
function showError(message, element = null) {
    if (element) {
        element.textContent = message;
        element.classList.remove('d-none');
    } else {
        const alert = document.createElement('div');
        alert.className = 'alert alert-danger';
        alert.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        document.body.insertAdjacentElement('afterbegin', alert);
        setTimeout(() => alert.remove(), 3000);
    }
}

// Show Success
function showSuccess(message) {
    const alert = document.createElement('div');
    alert.className = 'alert alert-success';
    alert.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    document.body.insertAdjacentElement('afterbegin', alert);
    setTimeout(() => alert.remove(), 3000);
}

// Toggle Sidebar
function toggleSidebar(show = null) {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (show === null) {
        sidebar.classList.toggle('open');
        overlay?.classList.toggle('show');
    } else if (show) {
        sidebar.classList.add('open');
        overlay?.classList.add('show');
    } else {
        sidebar.classList.remove('open');
        overlay?.classList.remove('show');
    }
}

// Toggle Theme
function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', currentTheme);
    applyTheme(currentTheme);
}

// Apply Theme
function applyTheme(theme) {
    const body = document.body;
    const themeToggle = document.getElementById('themeToggle');
    
    if (theme === 'dark') {
        body.classList.add('dark-theme');
        if (themeToggle) themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        body.classList.remove('dark-theme');
        if (themeToggle) themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
}

// Global Export to CSV
function exportTableToCSV(tableId, filename) {
    const table = document.getElementById(tableId);
    if (!table) return;
    
    let csv = '';
    const rows = table.querySelectorAll('tr');
    
    rows.forEach(row => {
        const cols = row.querySelectorAll('td, th');
        const csvRow = Array.from(cols)
            .map(col => `"${col.textContent.trim()}"`)
            .join(',');
        csv += csvRow + '\n';
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
}

// Global Print Function
function printTable(tableId) {
    const table = document.getElementById(tableId);
    if (!table) return;
    
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write(table.outerHTML);
    printWindow.document.close();
    printWindow.print();
}

// Format Number
function formatNumber(num) {
    return new Intl.NumberFormat('en-IN').format(num);
}

// Format Currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0
    }).format(amount);
}

// Format Date
function formatDate(date) {
    return new Intl.DateTimeFormat('en-IN').format(new Date(date));
}

// Show Loading Spinner
function showLoading(show = true) {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.display = show ? 'flex' : 'none';
    }
}

// Debounce function for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Local Storage utilities
const Storage = {
    set: (key, value) => {
        localStorage.setItem(key, JSON.stringify(value));
    },
    get: (key) => {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    },
    remove: (key) => {
        localStorage.removeItem(key);
    },
    clear: () => {
        localStorage.clear();
    }
};

// Session timeout warning
let inactivityTimer;
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
        // Show warning
        console.warn('Session timeout due to inactivity');
        // Optional: Auto logout
        // Auth.logout();
    }, INACTIVITY_TIMEOUT);
}

// Track user activity
if (Auth.isAuthenticated()) {
    document.addEventListener('click', resetInactivityTimer);
    document.addEventListener('keypress', resetInactivityTimer);
    document.addEventListener('scroll', resetInactivityTimer);
    resetInactivityTimer();
}

// Global error handler
window.addEventListener('error', function(event) {
    console.error('Global error:', event.error);
});

// Global unhandled promise rejection handler
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
});

// Initialize search for all modules (debounced)
const debouncedSearch = debounce(function(query) {
    if (currentPage === 'users') Users.searchUsers(query);
    else if (currentPage === 'transactions') Transactions.searchTransactions(query);
    else if (currentPage === 'dues') Dues.searchDues(query);
    else if (currentPage === 'items') Items.searchItems(query);
    else if (currentPage === 'villages') Villages.searchVillages(query);
}, 300);

// Apply theme on page load
window.addEventListener('load', () => {
    applyTheme(currentTheme);
});

// Keyboard shortcuts
document.addEventListener('keydown', function(event) {
    // Ctrl/Cmd + L for logout
    if ((event.ctrlKey || event.metaKey) && event.key === 'l') {
        event.preventDefault();
        if (confirm('Are you sure you want to logout?')) {
            Auth.logout();
        }
    }
    
    // Escape to close modals
    if (event.key === 'Escape') {
        const modals = document.querySelectorAll('.modal.show');
        modals.forEach(modal => {
            const bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) bsModal.hide();
        });
    }
});

// Page visibility handler
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        console.log('Page hidden');
    } else {
        console.log('Page visible - refreshing data');
        // Optional: Refresh current page data
    }
});

console.log('%c🏗️ Jai Hind Construction ERP Portal Loaded', 'color: #667eea; font-size: 14px; font-weight: bold;');
console.log('%cThis is a READ-ONLY portal. No data modifications are allowed.', 'color: #f5576c; font-size: 12px;');
