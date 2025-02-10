// Sample users (in a real application, this would be in a database)
const users = {
    admin: { password: 'admin123', role: 'admin' },
    employee: { password: 'emp123', role: 'employee' }
};

// Sample data storage (in a real application, this would be in a database)
let categories = ['Electronics', 'Clothing', 'Food'];
let inventory = [
    { id: 1, name: 'Laptop', category: 'Electronics', quantity: 10, price: 5999.99 },
    { id: 2, name: 'T-Shirt', category: 'Clothing', quantity: 50, price: 89.99 }
];
let sales = [];

// Initialize cart array
let currentCart = [];

// Add these variables at the top of your script
let salesUpdateInterval;
let lastSaleTimestamp = Date.now();

// Global variables for sales tracking
let salesData = {
    daily: [],
    weekly: [],
    monthly: [],
    yearly: []
};

// Login function
function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (users[username] && users[username].password === password) {
        currentUser = username; // Store current user
        document.getElementById('loginForm').style.display = 'none';
        if (users[username].role === 'admin') {
            document.getElementById('adminDashboard').style.display = 'block';
            initializeAdminDashboard();
            startSalesUpdateCheck();
        } else {
            document.getElementById('employeeDashboard').style.display = 'block';
            updateProductSelect(); // Initialize product dropdown
            currentCart = []; // Initialize empty cart
            updateCartDisplay(); // Initialize cart display
        }
    } else {
        alert('Invalid credentials!');
    }
}

// Logout function
function logout() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('adminDashboard').style.display = 'none';
    document.getElementById('employeeDashboard').style.display = 'none';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}

// Show different sections
function showSection(sectionId) {
    const sections = document.getElementsByClassName('section');
    for (let section of sections) {
        section.style.display = 'none';
    }
    document.getElementById(sectionId).style.display = 'block';
}

// Add new category
function addCategory() {
    const categoryName = document.getElementById('categoryName').value;
    if (categoryName && !categories.includes(categoryName)) {
        categories.push(categoryName);
        updateCategoryList();
        document.getElementById('categoryName').value = '';
    }
}

// Add new stock
function addStock() {
    const name = document.getElementById('productName').value;
    const quantity = parseInt(document.getElementById('quantity').value);
    const price = parseFloat(document.getElementById('price').value);
    const category = document.getElementById('categorySelect').value;
    const imageFile = document.getElementById('productImage').files[0];

    if (name && quantity && price && category) {
        // Handle image
        if (imageFile) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const newItem = {
                    id: inventory.length + 1,
                    name,
                    category,
                    quantity,
                    price,
                    image: e.target.result
                };
                inventory.push(newItem);
                updateStockList();
                clearAddStockForm();
            };
            reader.readAsDataURL(imageFile);
        } else {
            // Add item without image
            const newItem = {
                id: inventory.length + 1,
                name,
                category,
                quantity,
                price,
                image: null
            };
            inventory.push(newItem);
            updateStockList();
            clearAddStockForm();
        }
    }
}

// Update the employee view functions
function updateProductGrid() {
    const productGrid = document.getElementById('productGrid');
    productGrid.innerHTML = '';
    
    inventory.forEach(item => {
        if (item.quantity > 0) {
            const imageElement = item.image 
                ? `<img src="${item.image}" alt="${item.name}">`
                : `<div class="no-image-placeholder">No Image Available</div>`;

            productGrid.innerHTML += `
                <div class="product-card">
                    ${imageElement}
                    <h4>${item.name}</h4>
                    <p class="price">${formatGhanaCedis(item.price)}</p>
                    <p class="stock">Available: ${item.quantity} units</p>
                    <div class="sell-controls">
                        <input type="number" 
                               id="quantity-${item.id}" 
                               min="1" 
                               max="${item.quantity}" 
                               value="1"
                               onchange="validateQuantity(this, ${item.quantity})">
                        <button onclick="sellProductItem(${item.id})">Sell</button>
                    </div>
                </div>
            `;
        }
    });
}

// Add quantity validation
function validateQuantity(input, max) {
    if (input.value > max) {
        input.value = max;
    }
    if (input.value < 1) {
        input.value = 1;
    }
}

// Update the sell function
function sellProductItem(productId) {
    const quantityInput = document.getElementById(`quantity-${productId}`);
    const quantity = parseInt(quantityInput.value);
    
    const product = inventory.find(item => item.id === productId);
    if (product && quantity <= product.quantity) {
        product.quantity -= quantity;
        sales.push({
            productId,
            productName: product.name,
            quantity,
            price: product.price,
            date: new Date()
        });
        
        // Show success message
        alert(`Sold ${quantity} ${product.name}(s) for ${formatGhanaCedis(quantity * product.price)}`);
        
        // Update the display
        updateProductGrid();
    } else {
        alert('Invalid quantity or insufficient stock!');
    }
}

// Update UI functions
function updateCategoryList() {
    const categoryList = document.getElementById('categoryList');
    const categorySelect = document.getElementById('categorySelect');
    
    categoryList.innerHTML = '';
    categorySelect.innerHTML = '';
    
    categories.forEach(category => {
        categoryList.innerHTML += `<li>${category}</li>`;
        categorySelect.innerHTML += `<option value="${category}">${category}</option>`;
    });
}

// Add this helper function at the top of your script
function formatGhanaCedis(amount) {
    return new Intl.NumberFormat('en-GH', {
        style: 'currency',
        currency: 'GHS'
    }).format(amount);
}

// Then update the display functions to use it
function updateStockList() {
    const stockList = document.getElementById('stockList');
    stockList.innerHTML = '';
    
    inventory.forEach(item => {
        const imageCell = item.image 
            ? `<img src="${item.image}" alt="${item.name}" class="product-image">`
            : `<div class="product-image-placeholder">No Image</div>`;
            
        stockList.innerHTML += `
            <tr data-id="${item.id}">
                <td>${imageCell}</td>
                <td>${item.name}</td>
                <td>${item.category}</td>
                <td>${item.quantity}</td>
                <td>${formatGhanaCedis(item.price)}</td>
                <td class="action-buttons">
                    <button class="edit-btn" onclick="openEditModal(${item.id})">
                        Edit
                    </button>
                    <button class="delete-btn" onclick="deleteStock(${item.id})">
                        Delete
                    </button>
                </td>
            </tr>
        `;
    });
}

function clearAddStockForm() {
    document.getElementById('productName').value = '';
    document.getElementById('quantity').value = '';
    document.getElementById('price').value = '';
    document.getElementById('categorySelect').value = categories[0];
    document.getElementById('productImage').value = '';
    document.getElementById('imagePreview').innerHTML = '';
}

function previewImage(event) {
    const imagePreview = document.getElementById('imagePreview');
    const file = event.target.files[0];
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        }
        reader.readAsDataURL(file);
    } else {
        imagePreview.innerHTML = '';
    }
}

// Add scroll effect for header
window.addEventListener('scroll', function() {
    const header = document.querySelector('.company-header');
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// Edit Stock Functions
function openEditModal(itemId) {
    const item = inventory.find(i => i.id === itemId);
    if (!item) return;

    document.getElementById('editItemId').value = item.id;
    document.getElementById('editProductName').value = item.name;
    document.getElementById('editQuantity').value = item.quantity;
    document.getElementById('editPrice').value = item.price;
    
    // Populate categories
    const editCategorySelect = document.getElementById('editCategorySelect');
    editCategorySelect.innerHTML = categories.map(cat => 
        `<option value="${cat}" ${cat === item.category ? 'selected' : ''}>${cat}</option>`
    ).join('');

    // Show current image
    const imagePreview = document.getElementById('editImagePreview');
    if (item.image) {
        imagePreview.innerHTML = `<img src="${item.image}" alt="Current Image" style="max-width: 100px;">`;
    } else {
        imagePreview.innerHTML = '';
    }

    document.getElementById('editStockModal').style.display = 'block';
}

// Handle form submission
document.getElementById('editStockForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const itemId = parseInt(document.getElementById('editItemId').value);
    const item = inventory.find(i => i.id === itemId);
    if (!item) return;

    const imageFile = document.getElementById('editProductImage').files[0];
    
    if (imageFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            updateStockItem(itemId, e.target.result);
        };
        reader.readAsDataURL(imageFile);
    } else {
        updateStockItem(itemId, item.image); // Keep existing image
    }
});

function updateStockItem(itemId, imageData) {
    const item = inventory.find(i => i.id === itemId);
    if (!item) return;

    item.name = document.getElementById('editProductName').value;
    item.category = document.getElementById('editCategorySelect').value;
    item.quantity = parseInt(document.getElementById('editQuantity').value);
    item.price = parseFloat(document.getElementById('editPrice').value);
    item.image = imageData;

    updateStockList();
    closeModal();
    showNotification('Stock updated successfully!');
}

// Delete Stock Function
function deleteStock(itemId) {
    if (confirm('Are you sure you want to delete this item?')) {
        inventory = inventory.filter(item => item.id !== itemId);
        updateStockList();
        showNotification('Stock deleted successfully!');
    }
}

// Helper Functions
function closeModal() {
    document.getElementById('editStockModal').style.display = 'none';
    document.getElementById('editStockForm').reset();
}

function showNotification(message) {
    // You can implement a more sophisticated notification system
    alert(message);
}

// Search and Filter Functions
function searchStock() {
    const searchTerm = document.getElementById('stockSearch').value.toLowerCase();
    const filteredInventory = inventory.filter(item => 
        item.name.toLowerCase().includes(searchTerm) ||
        item.category.toLowerCase().includes(searchTerm)
    );
    displayFilteredStock(filteredInventory);
}

function filterStock() {
    const category = document.getElementById('filterCategory').value;
    const filteredInventory = category 
        ? inventory.filter(item => item.category === category)
        : inventory;
    displayFilteredStock(filteredInventory);
}

function displayFilteredStock(filteredInventory) {
    const stockList = document.getElementById('stockList');
    stockList.innerHTML = '';
    
    filteredInventory.forEach(item => {
        // Same as updateStockList row generation
        // ... (copy the row generation code from updateStockList)
    });
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('editStockModal');
    if (event.target === modal) {
        closeModal();
    }
}

// Close modal with X button
document.querySelector('.close-modal').onclick = closeModal;
document.querySelector('.cancel-btn').onclick = closeModal;

// Sales Report Functions
function generateReport() {
    const reportType = document.getElementById('reportType').value;
    const startDate = new Date(document.getElementById('startDate').value);
    const endDate = new Date(document.getElementById('endDate').value);

    let relevantSales = [];
    
    // Get sales based on report type
    switch(reportType) {
        case 'daily':
            const dailyKey = startDate.toISOString().split('T')[0];
            relevantSales = salesData.daily[dailyKey] || [];
            break;
        case 'weekly':
            const weekKey = getWeekNumber(startDate);
            relevantSales = salesData.weekly[weekKey] || [];
            break;
        case 'monthly':
            const monthKey = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
            relevantSales = salesData.monthly[monthKey] || [];
            break;
        case 'yearly':
            const yearKey = startDate.getFullYear().toString();
            relevantSales = salesData.yearly[yearKey] || [];
            break;
    }

    // Filter sales within date range
    const filteredSales = relevantSales.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate >= startDate && saleDate <= endDate;
    });

    updateReportDisplay(filteredSales);
}

function calculateSummary(sales) {
    return sales.reduce((summary, sale) => {
        summary.totalSales += sale.total;
        summary.itemsSold += sale.items.reduce((total, item) => total + item.quantity, 0);
        summary.transactions += 1;
        return summary;
    }, { totalSales: 0, itemsSold: 0, transactions: 0 });
}

function updateSummaryDisplay(summary) {
    document.getElementById('totalSales').textContent = 
        formatGhanaCedis(summary.totalSales);
    document.getElementById('itemsSold').textContent = 
        summary.itemsSold;
    document.getElementById('averageSale').textContent = 
        formatGhanaCedis(summary.itemsSold ? summary.totalSales / summary.itemsSold : 0);
}

function displayDetailedReport(sales) {
    const reportData = document.getElementById('reportData');
    reportData.innerHTML = '';

    sales.forEach((sale, index) => {
        reportData.innerHTML += `
            <tr>
                <td>${formatDate(sale.date)}</td>
                <td>INV-${String(index + 1).padStart(4, '0')}</td>
                <td>${sale.productName}</td>
                <td>${sale.quantity}</td>
                <td>${formatGhanaCedis(sale.price)}</td>
                <td>${formatGhanaCedis(sale.price * sale.quantity)}</td>
                <td>${sale.employee || 'N/A'}</td>
            </tr>
        `;
    });
}

// Helper Functions
function formatDate(date) {
    return new Date(date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

function setDefaultDates() {
    const today = new Date();
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    
    // Set end date to today
    endDate.value = today.toISOString().split('T')[0];
    
    // Set start date based on report type
    const reportType = document.getElementById('reportType').value;
    switch(reportType) {
        case 'daily':
            startDate.value = today.toISOString().split('T')[0];
            break;
        case 'weekly':
            const weekAgo = new Date(today.setDate(today.getDate() - 7));
            startDate.value = weekAgo.toISOString().split('T')[0];
            break;
        case 'monthly':
            const monthAgo = new Date(today.setMonth(today.getMonth() - 1));
            startDate.value = monthAgo.toISOString().split('T')[0];
            break;
        case 'yearly':
            const yearAgo = new Date(today.setFullYear(today.getFullYear() - 1));
            startDate.value = yearAgo.toISOString().split('T')[0];
            break;
    }
}

// Print and Export Functions
function printReport() {
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Sales Report</title>');
    
    // Add styles for printing
    printWindow.document.write(`
        <style>
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
            .report-header { text-align: center; margin-bottom: 20px; }
        </style>
    `);
    
    printWindow.document.write('</head><body>');
    printWindow.document.write(`
        <div class="report-header">
            <h1>Sales Report</h1>
            <p>Period: ${document.getElementById('startDate').value} to ${document.getElementById('endDate').value}</p>
        </div>
    `);
    
    printWindow.document.write(document.getElementById('reportTable').outerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
}

function exportToExcel() {
    const table = document.getElementById('reportTable');
    const ws = XLSX.utils.table_to_sheet(table);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sales Report');
    XLSX.writeFile(wb, 'sales_report.xlsx');
}

// Event Listeners
document.getElementById('reportType').addEventListener('change', setDefaultDates);
window.addEventListener('load', () => {
    setDefaultDates();
    generateReport();
});

// Update product selection with unit price
function updateUnitPrice() {
    const productId = parseInt(document.getElementById('productSelect').value);
    const product = inventory.find(item => item.id === productId);
    if (product) {
        document.getElementById('sellQuantity').max = product.quantity;
    }
}

// Update the updateProductSelect function
function updateProductSelect() {
    const productSelect = document.getElementById('productSelect');
    if (!productSelect) return; // Guard clause in case element doesn't exist
    
    productSelect.innerHTML = '<option value="">Select a product...</option>';
    
    inventory.forEach(item => {
        if (item.quantity > 0) {
            productSelect.innerHTML += `
                <option value="${item.id}">${item.name} - GH₵ ${item.price.toFixed(2)} 
                (${item.quantity} available)</option>
            `;
        }
    });
}

// Add item to cart
function addToCart() {
    const productSelect = document.getElementById('productSelect');
    const quantityInput = document.getElementById('sellQuantity');
    
    if (!productSelect.value) {
        alert('Please select a product!');
        return;
    }
    
    const productId = parseInt(productSelect.value);
    const quantity = parseInt(quantityInput.value);
    const product = inventory.find(item => item.id === productId);

    if (!product) {
        alert('Product not found!');
        return;
    }

    if (!quantity || quantity <= 0) {
        alert('Please enter a valid quantity!');
        return;
    }

    if (quantity > product.quantity) {
        alert('Insufficient stock!');
        return;
    }

    // Check if product already in cart
    const existingItem = currentCart.find(item => item.productId === productId);
    if (existingItem) {
        if (existingItem.quantity + quantity > product.quantity) {
            alert('Insufficient stock!');
            return;
        }
        existingItem.quantity += quantity;
    } else {
        currentCart.push({
            productId,
            productName: product.name,
            quantity,
            unitPrice: product.price
        });
    }

    updateCartDisplay();
    quantityInput.value = '1'; // Reset quantity to 1
    console.log('Current Cart:', currentCart); // For debugging
}

// Update cart display
function updateCartDisplay() {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    if (!cartItems || !cartTotal) return; // Guard clause
    
    let total = 0;
    cartItems.innerHTML = '';

    currentCart.forEach((item, index) => {
        const itemTotal = item.quantity * item.unitPrice;
        total += itemTotal;

        cartItems.innerHTML += `
            <tr>
                <td>${item.productName}</td>
                <td>${item.quantity}</td>
                <td>${formatGhanaCedis(item.unitPrice)}</td>
                <td>${formatGhanaCedis(itemTotal)}</td>
                <td>
                    <button onclick="removeFromCart(${index})" class="delete-btn">
                        <i class="fas fa-trash"></i> Remove
                    </button>
                </td>
            </tr>
        `;
    });

    cartTotal.textContent = formatGhanaCedis(total);
}

// Initialize cart when page loads
document.addEventListener('DOMContentLoaded', function() {
    currentCart = []; // Initialize empty cart
    updateProductSelect(); // Populate product dropdown
});

// Remove item from cart
function removeFromCart(index) {
    currentCart.splice(index, 1);
    updateCartDisplay();
}

// Clear cart
function clearCart() {
    currentCart = [];
    updateCartDisplay();
}

// Function to complete sale
function completeSale() {
    const customerName = document.getElementById('customerName').value;
    const customerPhone = document.getElementById('customerPhone').value;

    if (!customerName || currentCart.length === 0) {
        alert('Please enter customer name and add items to cart!');
        return;
    }

    try {
        // Create sale record
        const saleRecord = {
            id: Date.now(), // Unique ID for the sale
            date: new Date(),
            customer: {
                name: customerName,
                phone: customerPhone
            },
            items: [...currentCart], // Create a copy of cart items
            total: currentCart.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0),
            employee: currentUser
        };

        // Update inventory quantities
        currentCart.forEach(item => {
            const product = inventory.find(p => p.id === item.productId);
            if (product) {
                product.quantity -= item.quantity;
            }
        });

        // Add to sales history
        sales.push(saleRecord);

        // Clear the form and cart
        document.getElementById('customerName').value = '';
        document.getElementById('customerPhone').value = '';
        currentCart = [];
        updateCartDisplay();

        // Update stock list and notify admin
        updateStockList();
        notifyAdmin(saleRecord);

        // Show success message
        alert('Sale completed successfully!');
        
        // Update reports if we're in admin view
        if (document.getElementById('adminDashboard').style.display === 'block') {
            generateReport();
        }

    } catch (error) {
        console.error('Sale error:', error);
        alert('Error completing sale. Please try again.');
    }
}

// Function to notify admin
function notifyAdmin(saleRecord) {
    try {
        // Initialize adminNotifications if it doesn't exist
        if (!window.adminNotifications) {
            window.adminNotifications = [];
        }

        // Add the new sale to notifications
        window.adminNotifications.unshift({
            ...saleRecord,
            isNew: true,
            notificationTime: new Date()
        });

        // Update admin dashboard if it's open
        if (document.getElementById('adminDashboard').style.display === 'block') {
            updateSalesNotifications();
        }
    } catch (error) {
        console.error('Notification error:', error);
    }
}

// Function to update stock list
function updateStockList() {
    const stockList = document.getElementById('stockList');
    if (!stockList) return;

    stockList.innerHTML = '';
    inventory.forEach(item => {
        stockList.innerHTML += `
            <tr>
                <td>
                    ${item.image ? `<img src="${item.image}" alt="${item.name}" class="product-image">` : 'No Image'}
                </td>
                <td>${item.name}</td>
                <td>${item.category}</td>
                <td>${item.quantity}</td>
                <td>${formatGhanaCedis(item.price)}</td>
                <td>
                    <button onclick="editStock(${item.id})" class="edit-btn">Edit</button>
                    <button onclick="deleteStock(${item.id})" class="delete-btn">Delete</button>
                </td>
            </tr>
        `;
    });
}

// Helper function to format currency
function formatGhanaCedis(amount) {
    return 'GH₵ ' + Number(amount).toFixed(2);
}

// Function to update cart display
function updateCartDisplay() {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    if (!cartItems || !cartTotal) return;

    let total = 0;
    cartItems.innerHTML = '';

    currentCart.forEach((item, index) => {
        const itemTotal = item.quantity * item.unitPrice;
        total += itemTotal;

        cartItems.innerHTML += `
            <tr>
                <td>${item.productName}</td>
                <td>${item.quantity}</td>
                <td>${formatGhanaCedis(item.unitPrice)}</td>
                <td>${formatGhanaCedis(itemTotal)}</td>
                <td>
                    <button onclick="removeFromCart(${index})" class="delete-btn">Remove</button>
                </td>
            </tr>
        `;
    });

    cartTotal.textContent = formatGhanaCedis(total);
}

// Function to remove item from cart
function removeFromCart(index) {
    currentCart.splice(index, 1);
    updateCartDisplay();
}

// Function to clear cart
function clearCart() {
    currentCart = [];
    updateCartDisplay();
}

// Add these functions for admin dashboard
function initializeAdminDashboard() {
    updateCategoryList();
    updateStockList();
    setupNotificationPanel();
    updateSalesNotifications();
}

function setupNotificationPanel() {
    // Add notification panel to admin dashboard
    const adminDashboard = document.getElementById('adminDashboard');
    
    if (!document.getElementById('notificationPanel')) {
        const notificationPanel = `
            <div id="notificationPanel" class="notification-panel">
                <div class="notification-header">
                    <h3>Recent Sales Notifications</h3>
                    <span class="notification-count">0</span>
                </div>
                <div id="notificationList" class="notification-list"></div>
            </div>
        `;
        
        adminDashboard.insertAdjacentHTML('afterbegin', notificationPanel);
    }
}

function updateSalesNotifications() {
    const notificationList = document.getElementById('notificationList');
    const notificationCount = document.querySelector('.notification-count');
    
    if (notificationList && window.adminNotifications) {
        notificationList.innerHTML = window.adminNotifications
            .slice(0, 5) // Show only last 5 notifications
            .map(sale => `
                <div class="notification-item ${sale.isNew ? 'new' : ''}" data-sale-id="${sale.id}">
                    <div class="notification-content">
                        <div class="notification-title">
                            New Sale by ${sale.employee}
                        </div>
                        <div class="notification-details">
                            Customer: ${sale.customer.name}<br>
                            Amount: ${formatGhanaCedis(sale.total)}<br>
                            Items: ${sale.items.length}
                        </div>
                        <div class="notification-time">
                            ${formatTimeAgo(sale.timestamp)}
                        </div>
                    </div>
                    <button onclick="viewSaleDetails('${sale.id}')" class="view-details-btn">
                        View Details
                    </button>
                </div>
            `).join('');

        // Update notification count
        const newNotifications = window.adminNotifications.filter(n => n.isNew).length;
        notificationCount.textContent = newNotifications;
        if (newNotifications > 0) {
            notificationCount.classList.add('has-new');
        }
    }
}

// Function to check for new sales
function startSalesUpdateCheck() {
    if (salesUpdateInterval) {
        clearInterval(salesUpdateInterval);
    }
    
    salesUpdateInterval = setInterval(() => {
        if (lastSaleTimestamp > Date.now() - 1000) { // Check for sales in last second
            updateSalesNotifications();
            updateStockList();
            playNotificationSound();
        }
    }, 1000);
}

// Helper function to format time ago
function formatTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return new Date(timestamp).toLocaleDateString();
}

// Filter sales history
function filterSales() {
    const date = document.getElementById('salesDate').value;
    const searchTerm = document.getElementById('searchCustomer').value.toLowerCase();

    const filteredSales = sales.filter(sale => {
        const saleDate = new Date(sale.date).toISOString().split('T')[0];
        return (!date || saleDate === date) &&
               (!searchTerm || sale.customer.name.toLowerCase().includes(searchTerm));
    });

    displaySalesHistory(filteredSales);
}

// Display sales history
function displaySalesHistory(salesData) {
    const salesHistory = document.getElementById('salesHistoryData');
    salesHistory.innerHTML = '';

    salesData.forEach((sale, index) => {
        salesHistory.innerHTML += `
            <tr>
                <td>${formatDate(sale.date)}</td>
                <td>INV-${String(index + 1).padStart(4, '0')}</td>
                <td>${sale.customer.name}</td>
                <td>${sale.customer.phone || 'N/A'}</td>
                <td>${sale.items.length} items</td>
                <td>${formatGhanaCedis(sale.total)}</td>
                <td>
                    <button onclick="viewSaleDetails(${index})" class="view-btn">
                        View Details
                    </button>
                </td>
            </tr>
        `;
    });
}

// Function to update sales data
function updateSalesData(saleRecord) {
    const saleDate = new Date(saleRecord.date);
    
    // Update daily sales
    const dailyKey = saleDate.toISOString().split('T')[0];
    if (!salesData.daily[dailyKey]) {
        salesData.daily[dailyKey] = [];
    }
    salesData.daily[dailyKey].push(saleRecord);

    // Update weekly sales
    const weekKey = getWeekNumber(saleDate);
    if (!salesData.weekly[weekKey]) {
        salesData.weekly[weekKey] = [];
    }
    salesData.weekly[weekKey].push(saleRecord);

    // Update monthly sales
    const monthKey = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`;
    if (!salesData.monthly[monthKey]) {
        salesData.monthly[monthKey] = [];
    }
    salesData.monthly[monthKey].push(saleRecord);

    // Update yearly sales
    const yearKey = saleDate.getFullYear().toString();
    if (!salesData.yearly[yearKey]) {
        salesData.yearly[yearKey] = [];
    }
    salesData.yearly[yearKey].push(saleRecord);

    // Update admin reports if admin is logged in
    updateAdminReports();
}

// Function to update admin reports
function updateAdminReports() {
    const adminDashboard = document.getElementById('adminDashboard');
    if (adminDashboard && adminDashboard.style.display !== 'none') {
        generateReport();
    }
}

// Function to update report display
function updateReportDisplay(sales) {
    // Update summary statistics
    const summary = calculateSummary(sales);
    updateSummaryDisplay(summary);

    // Update detailed report table
    const reportData = document.getElementById('reportData');
    reportData.innerHTML = '';

    sales.forEach(sale => {
        reportData.innerHTML += `
            <tr>
                <td>${formatDate(sale.date)}</td>
                <td>${sale.invoiceNumber}</td>
                <td>${sale.customer.name}</td>
                <td>${sale.customer.phone || 'N/A'}</td>
                <td>${formatItemsList(sale.items)}</td>
                <td>${formatGhanaCedis(sale.total)}</td>
                <td>${sale.employee}</td>
            </tr>
        `;
    });

    // Update charts if they exist
    updateReportCharts(sales);
}

function formatItemsList(items) {
    return items.map(item => 
        `${item.productName} (${item.quantity})`
    ).join(', ');
}

function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    return `${d.getUTCFullYear()}-W${Math.ceil((((d - yearStart) / 86400000) + 1)/7)}`;
}

function generateInvoiceNumber() {
    return 'INV-' + Date.now().toString().slice(-6) + '-' + 
           Math.random().toString(36).substring(2, 5).toUpperCase();
}

// Optional: Add charts for visual representation
function updateReportCharts(sales) {
    if (typeof Chart !== 'undefined' && document.getElementById('salesChart')) {
        // Create/update sales charts
        // ... chart implementation ...
    }
} 