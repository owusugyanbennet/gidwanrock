// Sample users (in a real application, this would be in a database)
const users = {
    admin: { password: 'admin123', role: 'admin' },
    employee: { password: 'emp123', role: 'employee' }
};

// Sample data storage (in a real application, this would be in a database)
let categories = [];
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

// Initialize employees array
let employees = [];

// Company information object
const companyInfo = {
    name: "YOUR COMPANY NAME",
    address: "Your Complete Address",
    phone: "Your Phone Number",
    mobile: "Your Mobile Number",
    email: "your@email.com",
    website: "www.yourwebsite.com",
    vatNumber: "VAT: Your VAT Number",
    regNumber: "Reg: Your Registration Number",
    logo: "path/to/your/logo.png",
    branch: "Branch Name/Location",
    socialMedia: {
        facebook: "your.facebook",
        twitter: "@yourtwitter",
        instagram: "@yourinstagram"
    },
    customMessage: "Special message or promotional text",
    termsAndConditions: [
        "No returns after 7 days",
        "Receipt must be presented for returns",
        "Other terms..."
    ]
};

// Login function
function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (users[username] && users[username].password === password) {
        // Update last login timestamp
        users[username].lastLogin = new Date().toISOString();
        
        currentUser = username;
        document.getElementById('loginForm').style.display = 'none';
        
        if (users[username].role === 'admin') {
            document.getElementById('adminDashboard').style.display = 'block';
            initializeAdminDashboard();
            initializeUserManagement();
            startSalesUpdateCheck();
        } else {
            document.getElementById('employeeDashboard').style.display = 'block';
            initializeEmployeeSales();
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

// Function to add new category
function addCategory() {
    const categoryInput = document.getElementById('categoryName');
    const categoryName = categoryInput.value.trim();

    if (!categoryName) {
        alert('Please enter a category name!');
        return;
    }

    if (categories.includes(categoryName)) {
        alert('This category already exists!');
        return;
    }

    // Add new category
    categories.push(categoryName);
    
    // Clear input
    categoryInput.value = '';
    
    // Update displays
    updateCategoryList();
    updateCategorySelect();
    
    // Show success message
    alert('Category added successfully!');
}

// Function to update category list display
function updateCategoryList() {
    const categoryList = document.getElementById('categoryList');
    if (!categoryList) return;

    categoryList.innerHTML = '';
    categories.forEach(category => {
        categoryList.innerHTML += `
            <div class="category-item">
                <span>${category}</span>
                <button onclick="deleteCategory('${category}')" class="btn btn-danger btn-sm">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `;
    });
}

// Function to update category select in add stock form
function updateCategorySelect() {
    const categorySelect = document.getElementById('categorySelect');
    if (!categorySelect) return;

    categorySelect.innerHTML = '<option value="">Select a category</option>';
    categories.forEach(category => {
        categorySelect.innerHTML += `
            <option value="${category}">${category}</option>
        `;
    });
}

// Function to delete category
function deleteCategory(category) {
    if (confirm(`Are you sure you want to delete "${category}"?`)) {
        const index = categories.indexOf(category);
        if (index > -1) {
            categories.splice(index, 1);
            updateCategoryList();
            updateCategorySelect();
        }
    }
}

// Add this to your initialization code
function initializeAdminDashboard() {
    updateCategoryList();
    updateCategorySelect();
    updateStockList();
    setupNotificationPanel();
    updateSalesNotifications();
}

// Function to update stock list
function updateStockList() {
    const stockList = document.getElementById('stockList');
    stockList.innerHTML = '';
    
    inventory.forEach(item => {
        const profitMargin = ((item.price - item.cost) / item.cost) * 100;
        stockList.innerHTML += `
            <tr>
                <td>
                    ${item.image ? `<img src="${item.image}" alt="${item.name}" class="product-image">` : 'No Image'}
                </td>
                <td>${item.name}</td>
                <td>${item.category}</td>
                <td>${item.quantity}</td>
                <td>${formatGhanaCedis(item.cost)}</td>
                <td>${formatGhanaCedis(item.price)}</td>
                <td class="${profitMargin >= 0 ? 'profit-positive' : 'profit-negative'}">
                    ${profitMargin.toFixed(2)}%
                </td>
                <td>
                    <button onclick="editStock(${item.id})" class="edit-btn">Edit</button>
                    <button onclick="deleteStock(${item.id})" class="delete-btn">Delete</button>
                </td>
            </tr>
        `;
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
        const profitMargin = ((item.price - item.cost) / item.cost) * 100;
        stockList.innerHTML += `
            <tr>
                <td>
                    ${item.image ? `<img src="${item.image}" alt="${item.name}" class="product-image">` : 'No Image'}
                </td>
                <td>${item.name}</td>
                <td>${item.category}</td>
                <td>${item.quantity}</td>
                <td>${formatGhanaCedis(item.cost)}</td>
                <td>${formatGhanaCedis(item.price)}</td>
                <td class="${profitMargin >= 0 ? 'profit-positive' : 'profit-negative'}">
                    ${profitMargin.toFixed(2)}%
                </td>
                <td>
                    <button onclick="editStock(${item.id})" class="edit-btn">Edit</button>
                    <button onclick="deleteStock(${item.id})" class="delete-btn">Delete</button>
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
    
    // Filter sales based on date range
    const filteredSales = sales.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate >= startDate && saleDate <= endDate;
    });

    // Calculate totals
    let totalRevenue = 0;
    let totalCost = 0;

    filteredSales.forEach(sale => {
        sale.items.forEach(item => {
            const product = inventory.find(p => p.id === item.productId);
            if (product) {
                totalRevenue += item.quantity * item.unitPrice;
                totalCost += item.quantity * product.cost;
            }
        });
    });

    const totalProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    // Update summary displays
    document.getElementById('totalRevenue').textContent = formatGhanaCedis(totalRevenue);
    document.getElementById('totalCost').textContent = formatGhanaCedis(totalCost);
    document.getElementById('totalProfit').textContent = formatGhanaCedis(totalProfit);
    document.getElementById('profitMarginTotal').textContent = `${profitMargin.toFixed(2)}%`;

    // Update detailed report
    updateDetailedReport(filteredSales);
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
    // Validate inputs
    const customerName = document.getElementById('customerName').value;
    const customerPhone = document.getElementById('customerPhone').value;

    if (!customerName) {
        alert('Please enter customer name!');
        return;
    }

    if (currentCart.length === 0) {
        alert('Cart is empty! Please add items.');
        return;
    }

    try {
        // Create sale record
        const saleRecord = {
            id: generateSaleId(),
            date: new Date(),
            customer: {
                name: customerName,
                phone: customerPhone || 'N/A'
            },
            items: currentCart.map(item => ({
                productId: item.productId,
                productName: item.productName,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                total: item.quantity * item.unitPrice
            })),
            total: currentCart.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0),
            employee: currentUser
        };

        // Update inventory
        currentCart.forEach(item => {
            const productIndex = inventory.findIndex(p => p.id === item.productId);
            if (productIndex !== -1) {
                inventory[productIndex].quantity -= item.quantity;
            }
        });

        // Add to sales history
        if (!Array.isArray(sales)) {
            sales = [];
        }
        sales.push(saleRecord);

        // Print receipt
        printSaleReceipt(saleRecord);

        // Clear form and cart
        resetSaleForm();

        // Show success message
        showSuccessMessage('Sale completed successfully!');

        // Update displays
        updateStockList();
        updateSalesHistory();

        return true;
    } catch (error) {
        console.error('Sale completion error:', error);
        alert('Error completing sale: ' + error.message);
        return false;
    }
}

// Function to reset sale form
function resetSaleForm() {
    document.getElementById('customerName').value = '';
    document.getElementById('customerPhone').value = '';
    currentCart = [];
    updateCartDisplay();
}

// Function to show success message
function showSuccessMessage(message) {
    // You can replace this with a more sophisticated notification system
    alert(message);
}

// Function to update sales history
function updateSalesHistory() {
    const salesHistoryData = document.getElementById('salesHistoryData');
    if (!salesHistoryData) return;

    salesHistoryData.innerHTML = '';
    
    sales.forEach(sale => {
        salesHistoryData.innerHTML += `
            <tr>
                <td>${new Date(sale.date).toLocaleString()}</td>
                <td>${sale.customer.name}</td>
                <td>${formatGhanaCedis(sale.total)}</td>
                <td>
                    <button onclick="printSaleReceipt(${JSON.stringify(sale)})" class="print-btn">
                        <i class="fas fa-print"></i> Print
                    </button>
                </td>
            </tr>
        `;
    });
}

// Updated print receipt function
function printSaleReceipt(saleData) {
    const printWindow = window.open('', '_blank');
    
    const receiptHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Sales Receipt - ${companyInfo.name}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 20px;
                    color: #333;
                }
                .receipt {
                    max-width: 300px;
                    margin: 0 auto;
                    padding: 20px;
                    border: 1px solid #ddd;
                }
                .header {
                    text-align: center;
                    margin-bottom: 20px;
                    padding-bottom: 10px;
                    border-bottom: 2px solid #333;
                }
                .logo {
                    max-width: 150px;
                    height: auto;
                    margin-bottom: 10px;
                }
                .company-name {
                    font-size: 24px;
                    font-weight: bold;
                    margin-bottom: 5px;
                    color: #000;
                }
                .company-info {
                    font-size: 12px;
                    margin-bottom: 5px;
                }
                .receipt-title {
                    text-align: center;
                    font-size: 16px;
                    font-weight: bold;
                    margin: 15px 0;
                    text-transform: uppercase;
                }
                .receipt-details {
                    margin-bottom: 20px;
                    font-size: 14px;
                }
                .receipt-details div {
                    margin-bottom: 5px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                    font-size: 14px;
                }
                th, td {
                    padding: 8px;
                    text-align: left;
                    border-bottom: 1px solid #ddd;
                }
                th {
                    font-weight: bold;
                }
                .total-section {
                    margin-top: 20px;
                    padding-top: 10px;
                    border-top: 1px dashed #000;
                    font-weight: bold;
                }
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    font-size: 12px;
                    padding-top: 10px;
                    border-top: 1px solid #ddd;
                }
                .thank-you {
                    font-size: 14px;
                    font-weight: bold;
                    margin-bottom: 5px;
                }
                .barcode {
                    text-align: center;
                    margin-top: 20px;
                }
                @media print {
                    body {
                        padding: 0;
                    }
                    .no-print {
                        display: none;
                    }
                    .receipt {
                        border: none;
                    }
                }
            </style>
        </head>
        <body>
            <div class="receipt">
                <div class="header">
                    ${companyInfo.logo ? `<img src="${companyInfo.logo}" alt="${companyInfo.name}" class="logo">` : ''}
                    <div class="company-name">${companyInfo.name}</div>
                    <div class="company-info">${companyInfo.address}</div>
                    <div class="company-info">Tel: ${companyInfo.phone}</div>
                    <div class="company-info">Email: ${companyInfo.email}</div>
                    <div class="company-info">${companyInfo.website}</div>
                    <div class="company-info">${companyInfo.vatNumber}</div>
                </div>

                <div class="receipt-title">Sales Receipt</div>

                <div class="receipt-details">
                    <div><strong>Receipt #:</strong> ${saleData.id}</div>
                    <div><strong>Date:</strong> ${new Date(saleData.date).toLocaleString()}</div>
                    <div><strong>Customer:</strong> ${saleData.customer.name}</div>
                    <div><strong>Phone:</strong> ${saleData.customer.phone}</div>
                    <div><strong>Served By:</strong> ${saleData.employee}</div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Qty</th>
                            <th>Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${saleData.items.map(item => `
                            <tr>
                                <td>${item.productName}</td>
                                <td>${item.quantity}</td>
                                <td>${formatGhanaCedis(item.unitPrice)}</td>
                                <td>${formatGhanaCedis(item.quantity * item.unitPrice)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="total-section">
                    <div><strong>Subtotal:</strong> ${formatGhanaCedis(saleData.total)}</div>
                    <div><strong>VAT (0%):</strong> ${formatGhanaCedis(0)}</div>
                    <div style="font-size: 16px; margin-top: 10px;">
                        <strong>Total Amount:</strong> ${formatGhanaCedis(saleData.total)}
                    </div>
                </div>

                <div class="footer">
                    <div class="thank-you">Thank you for your purchase!</div>
                    <div>Please come again</div>
                    <div style="margin-top: 10px;">
                        Goods sold are not returnable
                    </div>
                </div>

                <div class="barcode">
                    <!-- You can add a barcode library to generate actual barcodes -->
                    ${saleData.id}
                </div>
            </div>
            
            <div class="no-print" style="text-align: center; margin-top: 20px;">
                <button onclick="window.print()" style="
                    padding: 10px 20px;
                    background-color: #4CAF50;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;">
                    Print Receipt
                </button>
            </div>
        </body>
        </html>
    `;

    printWindow.document.write(receiptHTML);
    printWindow.document.close();
}

// Add these styles to your CSS 

// Add these functions for admin dashboard
function initializeAdminDashboard() {
    // Initialize empty categories if not exists
    if (!Array.isArray(categories)) {
        categories = [];
    }
    
    updateCategoryList();
    updateCategorySelect();
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

// Add these functions to your existing JavaScript

// Function to initialize user management
function initializeUserManagement() {
    updateUserList();
    setupPasswordChangeHandlers();
}

// Function to update user list
function updateUserList() {
    const userList = document.getElementById('userList');
    if (!userList) return;

    userList.innerHTML = '';
    
    Object.entries(users).forEach(([username, userData]) => {
        userList.innerHTML += `
            <tr>
                <td>${username}</td>
                <td>${userData.role}</td>
                <td>${userData.lastLogin ? new Date(userData.lastLogin).toLocaleString() : 'Never'}</td>
                <td class="user-actions">
                    <button onclick="openPasswordModal('${username}')" 
                            class="change-password-btn">
                        Change Password
                    </button>
                </td>
            </tr>
        `;
    });
}

// Function to open password change modal
function openPasswordModal(username) {
    const modal = document.getElementById('changePasswordModal');
    const selectedUsernameInput = document.getElementById('selectedUsername');
    const displayUsernameInput = document.getElementById('displayUsername');
    
    selectedUsernameInput.value = username;
    displayUsernameInput.value = username;
    
    modal.style.display = 'block';
}

// Function to close password modal
function closePasswordModal() {
    const modal = document.getElementById('changePasswordModal');
    const form = document.getElementById('changePasswordForm');
    
    modal.style.display = 'none';
    form.reset();
    clearPasswordErrors();
}

// Function to setup password change handlers
function setupPasswordChangeHandlers() {
    const form = document.getElementById('changePasswordForm');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (validatePasswordChange()) {
            changeUserPassword();
        }
    });

    // Close modal when clicking outside
    window.onclick = function(event) {
        const modal = document.getElementById('changePasswordModal');
        if (event.target === modal) {
            closePasswordModal();
        }
    };

    // Close modal with X button
    document.querySelector('.close-modal').onclick = closePasswordModal;
}

// Function to validate password change
function validatePasswordChange() {
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    let isValid = true;

    clearPasswordErrors();

    // Check password length
    if (newPassword.length < 6) {
        showError('newPassword', 'Password must be at least 6 characters long');
        isValid = false;
    }

    // Check if password contains at least one number and one letter
    if (!/\d/.test(newPassword) || !/[a-zA-Z]/.test(newPassword)) {
        showError('newPassword', 'Password must contain at least one number and one letter');
        isValid = false;
    }

    // Check if passwords match
    if (newPassword !== confirmPassword) {
        showError('confirmPassword', 'Passwords do not match');
        isValid = false;
    }

    return isValid;
}

// Function to show error message
function showError(inputId, message) {
    const input = document.getElementById(inputId);
    const formGroup = input.closest('.form-group');
    
    formGroup.classList.add('error');
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    formGroup.appendChild(errorDiv);
}

// Function to clear password errors
function clearPasswordErrors() {
    const errorMessages = document.querySelectorAll('.error-message');
    const errorInputs = document.querySelectorAll('.form-group.error');
    
    errorMessages.forEach(error => error.remove());
    errorInputs.forEach(input => input.classList.remove('error'));
}

// Function to change user password
function changeUserPassword() {
    const username = document.getElementById('selectedUsername').value;
    const newPassword = document.getElementById('newPassword').value;
    
    if (users[username]) {
        users[username].password = newPassword;
        
        // Update last modified timestamp
        users[username].lastModified = new Date().toISOString();
        
        // Show success message
        alert(`Password changed successfully for user: ${username}`);
        
        // Close modal and update user list
        closePasswordModal();
        updateUserList();
    } else {
        alert('User not found!');
    }
}

// Update the inventory item structure
function addNewStock(event) {
    event.preventDefault();
    
    const newItem = {
        id: Date.now(),
        name: document.getElementById('productName').value,
        category: document.getElementById('category').value,
        quantity: parseInt(document.getElementById('quantity').value),
        cost: parseFloat(document.getElementById('cost').value),
        price: parseFloat(document.getElementById('price').value),
        image: document.getElementById('productImage').files[0] 
            ? URL.createObjectURL(document.getElementById('productImage').files[0]) 
            : null
    };

    inventory.push(newItem);
    updateStockList();
    event.target.reset();
    calculateProfitMargin(); // Reset profit margin display
}

// Add profit margin calculator
function calculateProfitMargin() {
    const cost = parseFloat(document.getElementById('cost').value) || 0;
    const price = parseFloat(document.getElementById('price').value) || 0;
    const profitMarginElement = document.getElementById('profitMargin');
    
    if (cost > 0 && price > 0) {
        const margin = ((price - cost) / cost) * 100;
        profitMarginElement.textContent = `${margin.toFixed(2)}%`;
        profitMarginElement.className = margin >= 0 ? 'profit-positive' : 'profit-negative';
    } else {
        profitMarginElement.textContent = '0%';
        profitMarginElement.className = '';
    }
}

// Add event listeners for cost and price inputs
document.getElementById('cost').addEventListener('input', calculateProfitMargin);
document.getElementById('price').addEventListener('input', calculateProfitMargin);

// Update the detailed report display
function updateDetailedReport(sales) {
    const reportData = document.getElementById('reportData');
    if (!reportData) return;

    reportData.innerHTML = '';
    sales.forEach(sale => {
        let saleProfit = 0;
        let saleCost = 0;

        sale.items.forEach(item => {
            const product = inventory.find(p => p.id === item.productId);
            if (product) {
                saleCost += item.quantity * product.cost;
                saleProfit += item.quantity * (item.unitPrice - product.cost);
            }
        });

        reportData.innerHTML += `
            <tr>
                <td>${formatDate(sale.date)}</td>
                <td>${sale.customer.name}</td>
                <td>${formatGhanaCedis(saleCost)}</td>
                <td>${formatGhanaCedis(sale.total)}</td>
                <td class="${saleProfit >= 0 ? 'profit-positive' : 'profit-negative'}">
                    ${formatGhanaCedis(saleProfit)}
                </td>
                <td>${sale.employee}</td>
            </tr>
        `;
    });
}

// Add profit analysis functions
function analyzeProfitTrends() {
    const profitData = sales.reduce((acc, sale) => {
        const saleDate = new Date(sale.date).toISOString().split('T')[0];
        if (!acc[saleDate]) {
            acc[saleDate] = {
                revenue: 0,
                cost: 0,
                profit: 0
            };
        }

        sale.items.forEach(item => {
            const product = inventory.find(p => p.id === item.productId);
            if (product) {
                acc[saleDate].revenue += item.quantity * item.unitPrice;
                acc[saleDate].cost += item.quantity * product.cost;
                acc[saleDate].profit += item.quantity * (item.unitPrice - product.cost);
            }
        });

        return acc;
    }, {});

    return profitData;
}

// Optional: Add chart visualization
function updateProfitChart() {
    const profitData = analyzeProfitTrends();
    // Implement chart visualization using your preferred charting library
    // Example: Chart.js, D3.js, etc.
}

// Function to initialize employee management
function initializeEmployeeManagement() {
    updateEmployeeList();
    setupEmployeeFormHandlers();
}

// Function to open add employee modal
function openAddEmployeeModal() {
    const modal = document.getElementById('addEmployeeModal');
    modal.style.display = 'block';
}

// Function to close add employee modal
function closeAddEmployeeModal() {
    const modal = document.getElementById('addEmployeeModal');
    const form = document.getElementById('addEmployeeForm');
    modal.style.display = 'none';
    form.reset();
    clearErrors();
}

// Function to setup form handlers
function setupEmployeeFormHandlers() {
    const form = document.getElementById('addEmployeeForm');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        if (validateEmployeeForm()) {
            addEmployee();
        }
    });

    // Close modal when clicking outside
    window.onclick = function(event) {
        const modal = document.getElementById('addEmployeeModal');
        if (event.target === modal) {
            closeAddEmployeeModal();
        }
    };

    // Close modal with X button
    document.querySelector('.close-modal').onclick = closeAddEmployeeModal;
}

// Function to validate employee form
function validateEmployeeForm() {
    clearErrors();
    let isValid = true;

    const username = document.getElementById('empUsername').value;
    const password = document.getElementById('empPassword').value;
    const confirmPassword = document.getElementById('empConfirmPassword').value;

    // Check if username already exists
    if (employees.some(emp => emp.username === username)) {
        showError('empUsername', 'Username already exists');
        isValid = false;
    }

    // Validate password
    if (password.length < 6) {
        showError('empPassword', 'Password must be at least 6 characters');
        isValid = false;
    }

    // Check password match
    if (password !== confirmPassword) {
        showError('empConfirmPassword', 'Passwords do not match');
        isValid = false;
    }

    return isValid;
}

// Function to add new employee
function addEmployee() {
    const newEmployee = {
        id: generateEmployeeId(),
        fullName: document.getElementById('empFullName').value,
        username: document.getElementById('empUsername').value,
        password: document.getElementById('empPassword').value,
        phone: document.getElementById('empPhone').value,
        email: document.getElementById('empEmail').value,
        role: document.getElementById('empRole').value,
        status: document.getElementById('empStatus').value,
        dateAdded: new Date().toISOString(),
        lastLogin: null
    };

    employees.push(newEmployee);
    
    // Add to users object for login functionality
    users[newEmployee.username] = {
        password: newEmployee.password,
        role: newEmployee.role
    };

    updateEmployeeList();
    closeAddEmployeeModal();
    showNotification('Employee added successfully!');
}

// Function to update employee list
function updateEmployeeList() {
    const employeeList = document.getElementById('employeeList');
    if (!employeeList) return;

    employeeList.innerHTML = '';
    
    employees.forEach(emp => {
        employeeList.innerHTML += `
            <tr>
                <td>${emp.id}</td>
                <td>${emp.fullName}</td>
                <td>${emp.username}</td>
                <td>${emp.phone || 'N/A'}</td>
                <td>${emp.role}</td>
                <td>
                    <span class="employee-status status-${emp.status}">
                        ${emp.status}
                    </span>
                </td>
                <td class="employee-actions">
                    <button onclick="editEmployee('${emp.id}')" class="edit-employee-btn">
                        Edit
                    </button>
                    <button onclick="deleteEmployee('${emp.id}')" class="delete-employee-btn">
                        Delete
                    </button>
                </td>
            </tr>
        `;
    });
}

// Function to generate employee ID
function generateEmployeeId() {
    return 'EMP' + Date.now().toString().slice(-6);
}

// Function to show error message
function showError(inputId, message) {
    const input = document.getElementById(inputId);
    const formGroup = input.closest('.form-group');
    
    formGroup.classList.add('error');
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    formGroup.appendChild(errorDiv);
}

// Function to clear errors
function clearErrors() {
    const errorMessages = document.querySelectorAll('.error-message');
    const errorInputs = document.querySelectorAll('.form-group.error');
    
    errorMessages.forEach(error => error.remove());
    errorInputs.forEach(input => input.classList.remove('error'));
}

// Function to delete employee
function deleteEmployee(employeeId) {
    if (confirm('Are you sure you want to delete this employee?')) {
        const index = employees.findIndex(emp => emp.id === employeeId);
        if (index !== -1) {
            const username = employees[index].username;
            employees.splice(index, 1);
            delete users[username];
            updateEmployeeList();
            showNotification('Employee deleted successfully!');
        }
    }
}

// Function to show notification
function showNotification(message) {
    alert(message); // You can replace this with a better notification system
}

// Add to your initialization code
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('adminDashboard')) {
        initializeEmployeeManagement();
    }
});

// Function to generate sale ID
function generateSaleId() {
    return 'SALE-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

// Make sure to initialize these when the employee logs in
function initializeEmployeeSales() {
    currentCart = [];
    updateCartDisplay();
    updateStockList();
    if (Array.isArray(sales)) {
        updateSalesHistory();
    }
} 