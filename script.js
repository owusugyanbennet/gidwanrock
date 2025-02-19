// Sample users (in a real application, this would be in a database)
const users = {
    admin: { 
        password: 'admin123', 
        role: 'admin',
        fullName: 'Administrator',
        status: 'active',
        lastLogin: new Date().toLocaleString()
    },
    employee1: { 
        password: 'emp123', 
        role: 'selling',
        fullName: 'Sales Person 1',
        status: 'active',
        lastLogin: 'Never'
    },
    employee2: { 
        password: 'emp456', 
        role: 'account',
        fullName: 'Accountant 1',
        status: 'active',
        lastLogin: 'Never'
    }
};

// Initialize empty arrays
let categories = [];
let inventory = [];
let currentCart = [];
let sales = [];

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

// Variable to store current sale details for modal
let currentSaleDetails = null;

// Function to load employees from local storage
function loadEmployees() {
    const savedEmployees = localStorage.getItem('employees');
    if (savedEmployees) {
        employees = JSON.parse(savedEmployees);
    }
}

// Function to add a new employee
function addEmployee() {
    const username = document.getElementById('employeeUsername').value.trim();
    const password = document.getElementById('employeePassword').value;
    const fullName = document.getElementById('employeeFullName').value.trim();
    const phone = document.getElementById('employeePhone').value.trim();
    const role = document.getElementById('employeeRole').value;
    const status = document.getElementById('employeeStatus').value;

    // Check if trying to add admin
    if (role === 'admin' && !checkAdminPermissions()) {
        return;
    }

    if (!username || !password || !fullName || !role) {
        alert('Please fill all required fields!');
        return;
    }

    // Additional password validation for admin accounts
    if (role === 'admin' && password.length < 8) {
        alert('Admin passwords must be at least 8 characters long!');
        return;
    }

    // Check if username already exists
    if (employees.some(emp => emp.username === username)) {
        alert('Username already exists!');
        return;
    }

    // Create new employee object
    const newEmployee = {
        id: Date.now(),
        username,
        password,
        fullName,
        phone,
        role,
        status,
        dateAdded: new Date().toISOString(),
        lastLogin: null,
        addedBy: currentUser // Track who added this employee
    };

    // Add to employees array
    employees.push(newEmployee);

    // Add to users object for authentication
    users[username] = {
        password: password,
        role: role,
        status: status
    };

    // Save to localStorage
    saveEmployees();
    
    // Clear form
    clearEmployeeForm();
    
    // Update display
    updateEmployeeList();
    
    alert('Employee added successfully!');
}

// Function to save employees to localStorage
function saveEmployees() {
    localStorage.setItem('employees', JSON.stringify(employees));
    localStorage.setItem('users', JSON.stringify(users));
}

// Function to update employee list display
function updateEmployeeList() {
    const employeeList = document.getElementById('employeeList');
    if (!employeeList) return;

    employeeList.innerHTML = '';
    employees.forEach(emp => {
        const statusClass = emp.status === 'active' ? 'status-active' : 'status-inactive';
        const roleDisplay = getRoleDisplay(emp.role);
        const isAdminUser = emp.role === 'admin';
        const canModify = isAdmin() || !isAdminUser; // Only admins can modify other admins
        
        employeeList.innerHTML += `
            <tr class="${isAdminUser ? 'admin-row' : ''}">
                <td>${emp.username}</td>
                <td>${emp.fullName}</td>
                <td>
                    <span class="role-badge ${isAdminUser ? 'role-admin' : ''}">${roleDisplay}</span>
                </td>
                <td><span class="status-badge ${statusClass}">${emp.status}</span></td>
                <td class="action-buttons">
                    ${canModify ? `
                        <button onclick="editEmployee(${emp.id})" class="btn-primary btn-sm">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button onclick="toggleEmployeeStatus(${emp.id})" class="btn-warning btn-sm">
                            ${emp.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button onclick="deleteEmployee(${emp.id})" class="btn-danger btn-sm">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    ` : '<span class="admin-protected">Protected</span>'}
                </td>
            </tr>
        `;
    });
}

// Helper function to get role display name
function getRoleDisplay(role) {
    switch(role) {
        case 'admin':
            return 'Administrator';
        case 'selling':
            return 'Sales Person';
        case 'account':
            return 'Accountant';
        default:
            return role;
    }
}

// Function to toggle employee status
function toggleEmployeeStatus(employeeId) {
    const employee = employees.find(emp => emp.id === employeeId);
    if (employee) {
        employee.status = employee.status === 'active' ? 'inactive' : 'active';
        users[employee.username].status = employee.status;
        saveEmployees();
        updateEmployeeList();
    }
}

// Function to edit employee
function editEmployee(employeeId) {
    // Check admin permissions
    if (!checkAdminPermissions()) return;

    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) {
        alert('Employee not found!');
        return;
    }

    // Open edit modal
    const modal = document.getElementById('editEmployeeModal');
    if (!modal) {
        // If modal doesn't exist, create it
        createEditModal();
    }

    // Populate form with employee data
    document.getElementById('editEmployeeId').value = employee.id;
    document.getElementById('editUsername').value = employee.username;
    document.getElementById('editFullName').value = employee.fullName;
    document.getElementById('editPhone').value = employee.phone || '';
    document.getElementById('editRole').value = employee.role;
    document.getElementById('editStatus').value = employee.status;

    // Show modal
    document.getElementById('editEmployeeModal').style.display = 'block';
}

// Function to create edit modal if it doesn't exist
function createEditModal() {
    const modalHtml = `
        <div id="editEmployeeModal" class="modal">
            <div class="modal-content">
                <span class="close-modal" onclick="closeEditModal()">&times;</span>
                <h3>Edit Employee</h3>
                <form id="editEmployeeForm" onsubmit="updateEmployee(event)">
                    <input type="hidden" id="editEmployeeId">
                    <div class="form-group">
                        <label for="editUsername">Username</label>
                        <input type="text" id="editUsername" readonly>
                    </div>
                    <div class="form-group">
                        <label for="editFullName">Full Name*</label>
                        <input type="text" id="editFullName" required>
                    </div>
                    <div class="form-group">
                        <label for="editPhone">Phone Number</label>
                        <input type="tel" id="editPhone">
                    </div>
                    <div class="form-group">
                        <label for="editRole">Role*</label>
                        <select id="editRole" required>
                            <option value="admin">Administrator</option>
                            <option value="selling">Sales Person</option>
                            <option value="account">Accountant</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="editStatus">Status</label>
                        <select id="editStatus">
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                    <div class="modal-buttons">
                        <button type="submit" class="save-btn">Save Changes</button>
                        <button type="button" class="cancel-btn" onclick="closeEditModal()">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// Function to update employee
function updateEmployee(event) {
    event.preventDefault();

    const employeeId = parseInt(document.getElementById('editEmployeeId').value);
    const employee = employees.find(emp => emp.id === employeeId);
    
    if (!employee) {
        alert('Employee not found!');
        return;
    }

    const newFullName = document.getElementById('editFullName').value.trim();
    const newPhone = document.getElementById('editPhone').value.trim();
    const newRole = document.getElementById('editRole').value;
    const newStatus = document.getElementById('editStatus').value;

    // Validate role change for admin
    if ((employee.role === 'admin' || newRole === 'admin') && !checkAdminPermissions()) {
        return;
    }

    // Update employee data
    employee.fullName = newFullName;
    employee.phone = newPhone;
    employee.role = newRole;
    employee.status = newStatus;
    employee.lastModified = new Date().toISOString();
    employee.modifiedBy = currentUser;

    // Save changes
    saveEmployees();
    
    // Update display
    updateUserList();
    
    // Close modal
    closeEditModal();
    
    // Show success message
    alert('Employee updated successfully!');
}

// Function to close edit modal
function closeEditModal() {
    const modal = document.getElementById('editEmployeeModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Function to clear employee form
function clearEmployeeForm() {
    document.getElementById('employeeUsername').value = '';
    document.getElementById('employeePassword').value = '';
    document.getElementById('employeeFullName').value = '';
    document.getElementById('employeePhone').value = '';
    document.getElementById('employeeRole').value = '';
    document.getElementById('employeeStatus').value = 'active';
}

// Initialize employee management
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('employeeManagement')) {
        loadEmployees();
        updateEmployeeList();
    }
});

// Company information object
const companyInfo = {
    name: "GIDWANROCK ENTERPRISE",
    address: "Anyinasusu Off Offinso Road",
    phone: "0242779167",
    mobile: "0554528600",
    email: "gidwanrock1@email.com",
    website: "www.gidwanrock.com",
    vatNumber: "VAT: 0.5%",
    regNumber: "Reg: 1234567890",
    logo: "images/loganb.png",
    branch: "Anyinasusu",
    socialMedia: {
        facebook: "gidwanrock1.facebook",
        twitter: "@gidwanrock1",
        instagram: "@gidwanrock1"
    },
    customMessage: "Special message or promotional text",
    termsAndConditions: [
        "No returns after 7 days",
        "Receipt must be presented for returns",
        "Other terms..."
    ]
};
// Initialize goods array
let goods = [];

// Function to load goods from local storage
function loadGoods() {
    const savedGoods = localStorage.getItem('goods');
    if (savedGoods) {
        goods = JSON.parse(savedGoods);
    }
}

// Function to add goods
function addGoods() {
    const goodsName = document.getElementById('goodsName').value.trim();
    const goodsAvailable = parseInt(document.getElementById('goodsAvailable').value);
    const costPrice = parseFloat(document.getElementById('costPrice').value);
    const sellingPrice = parseFloat(document.getElementById('sellingPrice').value);

    if (!goodsName || isNaN(goodsAvailable) || isNaN(costPrice) || isNaN(sellingPrice)) {
        alert('Please fill all fields with valid values!');
        return;
    }

    // Add new goods
    goods.push({ name: goodsName, available: goodsAvailable, cost: costPrice, selling: sellingPrice });
    
    // Save to localStorage
    localStorage.setItem('goods', JSON.stringify(goods));

    // Clear input fields
    document.getElementById('goodsName').value = '';
    document.getElementById('goodsAvailable').value = '';
    document.getElementById('costPrice').value = '';
    document.getElementById('sellingPrice').value = '';

    alert('Goods added successfully!');
    updateGoodsList(); // Update the goods list display
}

// Function to update goods list display
function updateGoodsList() {
    const goodsList = document.getElementById('goodsList');
    if (!goodsList) return;

    goodsList.innerHTML = '';
    goods.forEach(good => {
        goodsList.innerHTML += `
            <div>
                <span>${good.name} - Available: ${good.available}, Cost: ${good.cost}, Selling: ${good.selling}</span>
            </div>
        `;
    });
}

// Call this function to initialize accounting on page load
document.addEventListener('DOMContentLoaded', function() {
    loadGoods(); // Load existing goods from local storage
    updateGoodsList(); // Display the goods list
}); 
// Add session management variables
let currentUser = null;
let currentUserRole = null;

// Function to save session
function saveSession(username, role) {
    sessionStorage.setItem('currentUser', username);
    sessionStorage.setItem('currentUserRole', role);
}

// Function to load session
function loadSession() {
    const savedUser = sessionStorage.getItem('currentUser');
    const savedRole = sessionStorage.getItem('currentUserRole');
    
    if (savedUser && savedRole) {
        currentUser = savedUser;
        currentUserRole = savedRole;
        return true;
    }
    return false;
}

// Function to clear session
function clearSession() {
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('currentUserRole');
    currentUser = null;
    currentUserRole = null;
}

// Clear any existing data
function clearDefaultData() {
    localStorage.removeItem('inventory');
    localStorage.removeItem('categories');
    inventory = [];
    categories = [];
    updateStockList();
    updateCategoryList();
    updateProductSelect();
}

// Initialize admin dashboard
function initializeAdminDashboard() {
    loadFromLocalStorage();
    updateCategoryList();
    updateCategorySelect();
    updateStockList();
    setupNotificationPanel();
    updateSalesNotifications();
}

// Initialize employee dashboard
function initializeEmployeeSales() {
    loadFromLocalStorage();
    currentCart = []; // Reset cart
    updateProductSelect();
    updateCartDisplay();
}

// Update product selection for employees
function updateProductSelect() {
    const productSelect = document.getElementById('productSelect');
    if (!productSelect) return;

    productSelect.innerHTML = '<option value="">Select a product...</option>';
    
    // Only show products with quantity > 0
    inventory.filter(item => item.quantity > 0).forEach(item => {
        productSelect.innerHTML += `
            <option value="${item.id}" data-price="${item.price}" data-available="${item.quantity}" data-name="${item.name}">
                ${item.name} - ${formatGhanaCedis(item.price)} 
                (${item.quantity} available)
            </option>
        `;
    });
}

// Update page load initialization
document.addEventListener('DOMContentLoaded', function() {
    loadFromLocalStorage();
    
    // Check for existing session
    if (loadSession()) {
        showDashboard();
    } else {
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('adminDashboard').style.display = 'none';
        document.getElementById('employeeDashboard').style.display = 'none';
    }
});

// Update the login function
function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (users[username] && users[username].password === password) {
        currentUser = username;
        currentUserRole = users[username].role;
        
        // Save session
        saveSession(username, users[username].role);
        
        if (currentUserRole === 'account') {
            window.location.href = 'accounting.html';
        } else {
            showDashboard();
            if (currentUserRole !== 'admin') {
                initializeEmployeeDashboard();
            }
        }
    } else {
        alert('Invalid credentials!');
    }
}

// Function to show different sections
function showSection(sectionId) {
    // Hide all sections first
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.style.display = 'none';
    });

    // Show the selected section
    const selectedSection = document.getElementById(sectionId);
    if (!selectedSection) {
        console.error(`Section with id "${sectionId}" not found`);
        return;
    }
    selectedSection.style.display = 'block';

    // Special handling for specific sections
    switch(sectionId) {
        case 'salesHistory':
            initializeSalesHistory();
            break;
        case 'inventory':
            initializeInventoryView();
            break;
        case 'sell':
            initializeSaleSection();
            break;
        case 'userManagement':
            initializeUserManagement();
            break;
    }
}

// Update the showDashboard function
function showDashboard() {
    document.getElementById('loginForm').style.display = 'none';
    
    if (currentUserRole === 'admin') {
        // Show admin dashboard and its default section
        document.getElementById('adminDashboard').style.display = 'block';
        document.getElementById('employeeDashboard').style.display = 'none';
        
        // Show the default section (e.g., viewStock)
        showSection('viewStock');
        initializeAdminDashboard();
    } else {
        // Show employee dashboard
        document.getElementById('adminDashboard').style.display = 'none';
        document.getElementById('employeeDashboard').style.display = 'block';
        showSection('sell'); // Default to sell section for employees
        initializeEmployeeDashboard();
    }
}

// Update the logout function
function logout() {
    clearSession();
    // Hide all dashboards and sections
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('adminDashboard').style.display = 'none';
    document.getElementById('employeeDashboard').style.display = 'none';
    
    // Clear any active sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.style.display = 'none';
    });
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
    
    // Save to localStorage
    localStorage.setItem('categories', JSON.stringify(categories));
    
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
            // Save to localStorage
            localStorage.setItem('categories', JSON.stringify(categories));
            updateCategoryList();
            updateCategorySelect();
        }
    }
}

// Function to update stock list
function updateStockList() {
    const stockTable = document.getElementById('stockTable');
    if (!stockTable) {
        // Create table if it doesn't exist
        const tableContainer = document.getElementById('stockTableContainer');
        if (tableContainer) {
            tableContainer.innerHTML = `
                <table id="stockTable" class="table">
                    <thead>
                        <tr>
                            <th>Image</th>
                            <th>Product</th>
                            <th>Category</th>
                            <th>Quantity</th>
                            <th>Cost</th>
                            <th>Selling Price (GH₵)</th>
                            <th>Profit</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="stockList"></tbody>
                </table>
            `;
        }
    }

    const stockList = document.getElementById('stockList');
    if (!stockList) return;

    stockList.innerHTML = '';
    inventory.forEach(item => {
        const profit = item.price - item.cost; // Calculate profit
        stockList.innerHTML += `
            <tr>
                <td>
                    ${item.image ? 
                        `<img src="${item.image}" alt="${item.name}" class="stock-image">` : 
                        '<div class="no-image">No Image</div>'}
                </td>
                <td>${item.name}</td>
                <td>${item.category}</td>
                <td>${item.quantity}</td>
                <td>${formatGhanaCedis(item.cost)}</td>
                <td>${formatGhanaCedis(item.price)}</td>
                <td>${formatGhanaCedis(profit)}</td> <!-- Display profit -->
                <td>
                    <button onclick="editStock(${item.id})" class="btn btn-primary btn-sm">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button onclick="deleteStock(${item.id})" class="btn btn-danger btn-sm">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            </tr>
        `;
    });
}

// Add these styles
const styles = `
    #stockTable {
        width: 100%;
        border-collapse: collapse;
        margin-top: 20px;
        background: white;
    }

    #stockTable thead {
        background-color: rgb(20, 4, 80);
    }

    #stockTable th {
        padding: 12px;
        text-align: left;
        font-weight: 600;
        border-bottom: 2px solid #ddd;
        color: white;
    }

    #stockTable td {
        padding: 12px;
        text-align: left;
        border-bottom: 1px solid #ddd;
    }

    .stock-image {
        width: 50px;
        height: 50px;
        object-fit: cover;
        border-radius: 4px;
    }

    .no-image {
        width: 50px;
        height: 50px;
        background-color: rgb(38, 0, 206);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        color: white;
        border-radius: 4px;
    }

    .profit-positive {
        color: #4CAF50;
        font-weight: bold;
    }

    .profit-negative {
        color: #f44336;
        font-weight: bold;
    }

    .btn-sm {
        padding: 5px 10px;
        margin: 0 2px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        display: inline-flex;
        align-items: center;
        gap: 5px;
    }

    .btn-primary {
        background-color: #2196F3;
        color: white;
    }

    .btn-danger {
        background-color: #f44336;
        color: white;
    }

    .btn-primary:hover {
        background-color: #1976D2;
    }

    .btn-danger:hover {
        background-color: #D32F2F;
    }

    #stockTableContainer {
        margin-top: 20px;
        padding: 20px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .fas {
        font-size: 14px;
    }
`;

// Add the styles to the document
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

// Update the addStock function to handle image upload
function addStock() {
    const productName = document.getElementById('productName').value.trim();
    const category = document.getElementById('categorySelect').value;
    const quantity = parseInt(document.getElementById('quantity').value);
    const cost = parseFloat(document.getElementById('cost').value);
    const price = parseFloat(document.getElementById('price').value);
    const imageInput = document.getElementById('productImage');
    
    // Validation
    if (!productName || !category || isNaN(quantity) || isNaN(cost) || isNaN(price)) {
        alert('Please fill all fields with valid values!');
        return;
    }

    // Handle image
    const handleImageAndSave = (imageData = null) => {
        // Create new stock item
        const newItem = {
            id: Date.now(),
            name: productName,
            category: category,
            quantity: quantity,
            cost: cost,
            price: price,
            image: imageData
        };

        // Add to inventory
        inventory.push(newItem);

        // Save to localStorage
        saveToLocalStorage();

        // Update displays
        updateStockList();
        updateProductSelect();

        // Clear form
        document.getElementById('productName').value = '';
        document.getElementById('categorySelect').value = '';
        document.getElementById('quantity').value = '';
        document.getElementById('cost').value = '';
        document.getElementById('price').value = '';
        if (imageInput) imageInput.value = '';
        document.getElementById('imagePreview').innerHTML = '';

        // Show success message
        alert('Stock added successfully!');
    };

    // If there's an image file, process it
    if (imageInput && imageInput.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => handleImageAndSave(e.target.result);
        reader.readAsDataURL(imageInput.files[0]);
    } else {
        handleImageAndSave();
    }

    // After successfully adding stock
    saveInventory();
    
    // Refresh sales section if on employee dashboard
    const employeeDashboard = document.getElementById('employeeDashboard');
    if (employeeDashboard && employeeDashboard.style.display !== 'none') {
        updateProductSelection();
    }
}

// Add this helper function at the top of your script
function formatGhanaCedis(amount) {
    return 'GH₵ ' + amount.toFixed(2);
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
        saveToLocalStorage();
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

// Function to add item to cart
function addToCart() {
    const productSelect = document.getElementById('productSelect');
    const quantityInput = document.getElementById('quantity');
    
    const productId = parseInt(productSelect.value);
    
    if (!productId) {
        alert('Please select a product');
        return;
    }

    const selectedOption = productSelect.options[productSelect.selectedIndex];
    const available = parseInt(selectedOption.dataset.available);
    const price = parseFloat(selectedOption.dataset.price);
    const productName = selectedOption.dataset.name;

    // Get quantity value and ensure it's a valid number
    let quantity = parseInt(quantityInput.value);
    
    // Validate quantity
    if (!quantity || quantity < 1) {
        alert('Please enter a valid quantity');
        return;
    }

    // Check stock availability
    if (quantity > available) {
        alert(`Only ${available} items available in stock`);
        return;
    }

    // Add to cart with proper quantity tracking
    const existingItem = currentCart.find(item => item.productId === productId);
    if (existingItem) {
        const newTotal = existingItem.quantity + quantity;
        if (newTotal > available) {
            alert(`Cannot add more items. Only ${available} available in stock`);
            return;
        }
        existingItem.quantity = newTotal;
        existingItem.total = existingItem.quantity * existingItem.price;
        existingItem.itemCount = existingItem.quantity; // Track item count
    } else {
        currentCart.push({
            productId,
            productName: productName,
            quantity: quantity,
            price: price,
            total: quantity * price,
            itemCount: quantity, // Track item count
            available: available // Track available stock
        });
    }

    // Update cart display
    updateCartDisplay();
    
    // Show success message with quantity
    showCartUpdateMessage(quantity, productName);
    
    // Reset only the product selection, keep the quantity
    productSelect.value = '';
}

// Function to update cart display with detailed quantities
function updateCartDisplay() {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    if (!cartItems || !cartTotal) return;

    cartItems.innerHTML = '';
    let total = 0;
    let totalItems = 0;

    currentCart.forEach((item, index) => {
        const itemTotal = item.quantity * item.price;
        total += itemTotal;
        totalItems += item.quantity;

        cartItems.innerHTML += `
            <tr>
                <td>${item.productName}</td>
                <td>
                    <div class="quantity-control">
                        <button onclick="updateQuantity(${index}, -1)" class="qty-btn">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="updateQuantity(${index}, 1)" class="qty-btn">+</button>
                    </div>
                </td>
                <td>${formatGhanaCedis(item.price)}</td>
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
    
    // Update total items count
    const totalItemsDisplay = document.getElementById('totalItems');
    if (totalItemsDisplay) {
        totalItemsDisplay.textContent = `Total Items: ${totalItems}`;
    }
    
    // Update final total and payment
    updateFinalTotal();
}

// Function to update quantity from cart
function updateQuantity(index, change) {
    const item = currentCart[index];
    const newQuantity = item.quantity + change;
    
    // Validate new quantity
    if (newQuantity < 1) {
        if (confirm('Remove item from cart?')) {
            removeFromCart(index);
        }
        return;
    }
    
    // Check stock availability
    if (newQuantity > item.available) {
        alert(`Only ${item.available} items available in stock`);
        return;
    }
    
    // Update quantity and total
    item.quantity = newQuantity;
    item.total = item.quantity * item.price;
    
    // Update display
    updateCartDisplay();
}

// Function to show cart update message
function showCartUpdateMessage(quantity, productName) {
    const message = `Added ${quantity} x ${productName} to cart`;
    // You can replace this with a more sophisticated notification system
    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Remove notification after 2 seconds
    setTimeout(() => {
        notification.remove();
    }, 2000);
}

// Function to update final total
function updateFinalTotal() {
    const subtotal = calculateTotal();
    const discount = parseFloat(document.getElementById('discount').value) || 0;
    const finalTotal = subtotal - discount;
    
    document.getElementById('finalTotal').textContent = formatGhanaCedis(finalTotal);
    
    // Auto-update payment amount to match final total
    const paymentInput = document.getElementById('payment');
    paymentInput.value = finalTotal.toFixed(2);
    
    // Calculate change
    calculateChange();
}

// Function to calculate change
function calculateChange() {
    const finalTotal = calculateTotal() - (parseFloat(document.getElementById('discount').value) || 0);
    const payment = parseFloat(document.getElementById('payment').value) || 0;
    const change = payment - finalTotal;
    
    document.getElementById('changeAmount').textContent = formatGhanaCedis(Math.max(0, change));
    
    // Highlight payment field if insufficient
    const paymentInput = document.getElementById('payment');
    if (payment < finalTotal) {
        paymentInput.classList.add('invalid-payment');
    } else {
        paymentInput.classList.remove('invalid-payment');
    }
}

// Helper function to calculate total
function calculateTotal() {
    return currentCart.reduce((sum, item) => sum + (item.quantity * item.price), 0);
}

// Function to remove item from cart
function removeFromCart(index) {
    currentCart.splice(index, 1);
    updateCartDisplay();
}

// Clear cart
function clearCart() {
    currentCart = [];
    updateCartDisplay();
    document.getElementById('customerName').value = '';
    document.getElementById('customerPhone').value = '';
    document.getElementById('discount').value = '';
    document.getElementById('payment').value = '';
}

// Function to complete sale
function completeSale() {
    if (currentCart.length === 0) {
        alert('Cart is empty!');
        return;
    }

    const customerName = document.getElementById('customerName').value.trim();
    if (!customerName) {
        alert('Please enter customer name!');
        return;
    }

    try {
        // Calculate totals
        const subtotal = calculateTotal();
        const discount = parseFloat(document.getElementById('discount').value) || 0;
        const finalTotal = subtotal - discount;
        const payment = parseFloat(document.getElementById('payment').value) || 0;

        // Validate payment
        if (payment < finalTotal) {
            alert('Payment amount must be equal to or greater than the total amount!');
            document.getElementById('payment').focus();
            return;
        }

        // Load latest inventory data
        const savedInventory = localStorage.getItem('inventory');
        if (savedInventory) {
            inventory = JSON.parse(savedInventory);
        }

        // Validate stock availability
        for (const item of currentCart) {
            const product = inventory.find(p => p.id === parseInt(item.productId));
            if (!product) {
                alert(`Product ${item.productName} not found in inventory!`);
                return;
            }
            if (product.quantity < item.quantity) {
                alert(`Not enough stock available for ${item.productName}. Only ${product.quantity} remaining.`);
                return;
            }
        }

        // Create sale object
        const sale = {
            id: generateSaleId(),
            invoiceNumber: generateInvoiceNumber(),
            date: new Date().toISOString(),
            cashier: currentUser,
            customer: {
                name: customerName,
                phone: document.getElementById('customerPhone').value || ''
            },
            items: currentCart.map(item => ({
                productId: parseInt(item.productId),
                productName: item.productName,
                quantity: item.quantity,
                price: item.price,
                total: item.quantity * item.price
            })),
            subtotal,
            discount,
            total: finalTotal,
            payment,
            change: payment - finalTotal
        };

        // Update inventory quantities
        currentCart.forEach(item => {
            const product = inventory.find(p => p.id === parseInt(item.productId));
            if (product) {
                product.quantity -= item.quantity;
            }
        });

        // Save updated inventory
        localStorage.setItem('inventory', JSON.stringify(inventory));

        // Initialize sales array if it doesn't exist
        if (!Array.isArray(sales)) {
            sales = [];
        }

        // Add to sales history
        sales.push(sale);
        localStorage.setItem('sales', JSON.stringify(sales));

        // Print receipt
        if (typeof printReceipt === 'function') {
            printReceipt(sale);
        }

        // Clear cart and form
        clearCart();
        
        // Reset payment fields
        document.getElementById('discount').value = '0';
        document.getElementById('payment').value = '0';
        document.getElementById('finalTotal').textContent = 'GH₵ 0.00';
        document.getElementById('changeAmount').textContent = 'GH₵ 0.00';

        // Update product selection dropdown
        updateProductSelection();
        
        // Show success message
        alert('Sale completed successfully!');

        // Update sales history if visible
        if (document.getElementById('salesHistory').style.display === 'block') {
            filterEmployeeSales();
        }

    } catch (error) {
        console.error('Error completing sale:', error);
        alert(`Error completing sale: ${error.message}`);
    }
}

// Function to generate sale ID
function generateSaleId() {
    return 'SALE-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
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

    displayFilteredStock(filteredSales);
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

// Function to generate invoice number
function generateInvoiceNumber() {
    const timestamp = new Date().getTime();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `INV-${timestamp}-${random}`;
}

// Optional: Add charts for visual representation
function updateReportCharts(sales) {
    if (typeof Chart !== 'undefined' && document.getElementById('salesChart')) {
        // Create/update sales charts
        // ... chart implementation ...
    }
}

// Function to initialize user management
function initializeUserManagement() {
    // Convert users object to array for display
    const userArray = Object.entries(users).map(([username, userData]) => ({
        id: Date.now(), // Generate temporary ID
        username: username,
        role: userData.role,
        status: userData.status || 'active',
        fullName: userData.fullName || username,
        lastLogin: userData.lastLogin || 'Never'
    }));

    // Update the employees array with users
    employees = userArray;
    
    // Update the display
    updateUserList();
}

// Function to update user list
function updateUserList() {
    const userList = document.getElementById('userList');
    if (!userList) return;

    userList.innerHTML = '';
    
    // Display all users
    employees.forEach(employee => {
        const isCurrentUser = employee.username === currentUser;
        const statusClass = employee.status === 'active' ? 'status-active' : 'status-inactive';
        const isAdminUser = employee.role === 'admin';
        const canModify = currentUserRole === 'admin' && !isCurrentUser;
        
        userList.innerHTML += `
            <tr class="${isAdminUser ? 'admin-row' : ''}">
                <td>${employee.username}</td>
                <td>${employee.fullName}</td>
                <td>
                    <span class="role-badge role-${employee.role}">
                        ${getRoleDisplay(employee.role)}
                    </span>
                </td>
                <td>
                    <span class="status-badge ${statusClass}">
                        ${employee.status}
                    </span>
                </td>
                <td>${employee.lastLogin}</td>
                <td class="action-buttons">
                    ${canModify ? `
                        <button onclick="editEmployee(${employee.id})" class="btn-primary btn-sm">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button onclick="toggleEmployeeStatus(${employee.id})" class="btn-warning btn-sm">
                            ${employee.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button onclick="resetPassword(${employee.id})" class="btn-info btn-sm">
                            <i class="fas fa-key"></i> Reset Password
                        </button>
                        ${!isAdminUser ? `
                            <button onclick="deleteEmployee(${employee.id})" class="btn-danger btn-sm">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        ` : ''}
                    ` : '<span class="current-user-label">Current User</span>'}
                </td>
            </tr>
        `;
    });
}

// Helper function to get role display name
function getRoleDisplay(role) {
    switch(role) {
        case 'admin':
            return 'Administrator';
        case 'selling':
            return 'Sales Person';
        case 'account':
            return 'Accountant';
        default:
            return role.charAt(0).toUpperCase() + role.slice(1);
    }
}

// Add this to your initialization code
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('userManagement')) {
        initializeUserManagement();
    }
});

// Function to reset password
function resetPassword(employeeId) {
    if (!checkAdminPermissions()) return;
    
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) {
        alert('Employee not found!');
        return;
    }

    // Create and show password reset modal
    createPasswordResetModal();
    
    // Set employee details in modal
    document.getElementById('resetEmployeeId').value = employeeId;
    document.getElementById('resetEmployeeName').textContent = employee.username;
    
    // Show modal
    document.getElementById('passwordResetModal').style.display = 'block';
}

// Function to create password reset modal
function createPasswordResetModal() {
    // Only create if it doesn't exist
    if (!document.getElementById('passwordResetModal')) {
        const modalHtml = `
            <div id="passwordResetModal" class="modal">
                <div class="modal-content">
                    <span class="close-modal" onclick="closePasswordResetModal()">&times;</span>
                    <h3>Reset Password</h3>
                    <form id="passwordResetForm" onsubmit="submitPasswordReset(event)">
                        <input type="hidden" id="resetEmployeeId">
                        <div class="form-group">
                            <label>Employee Username:</label>
                            <p id="resetEmployeeName" class="employee-name"></p>
                        </div>
                        <div class="form-group">
                            <label for="newPassword">New Password*</label>
                            <input type="password" id="newPassword" required minlength="6">
                        </div>
                        <div class="form-group">
                            <label for="confirmPassword">Confirm Password*</label>
                            <input type="password" id="confirmPassword" required minlength="6">
                        </div>
                        <div class="password-requirements">
                            <p>Password Requirements:</p>
                            <ul>
                                <li>Minimum 6 characters</li>
                                <li>Both passwords must match</li>
                            </ul>
                        </div>
                        <div class="modal-buttons">
                            <button type="submit" class="save-btn">Reset Password</button>
                            <button type="button" class="cancel-btn" onclick="closePasswordResetModal()">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }
}

// Function to submit password reset
function submitPasswordReset(event) {
    event.preventDefault();
    
    const employeeId = parseInt(document.getElementById('resetEmployeeId').value);
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validate passwords
    if (newPassword !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }

    if (newPassword.length < 6) {
        alert('Password must be at least 6 characters long!');
        return;
    }

    const employee = employees.find(emp => emp.id === employeeId);
    if (employee) {
        // Update password
        employee.password = newPassword;
        saveEmployees();
        
        // Close modal and show success message
        closePasswordResetModal();
        alert(`Password has been reset successfully for ${employee.username}`);
    } else {
        alert('Employee not found!');
    }
}

// Function to close password reset modal
function closePasswordResetModal() {
    const modal = document.getElementById('passwordResetModal');
    if (modal) {
        modal.style.display = 'none';
        document.getElementById('passwordResetForm').reset();
    }
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
    const savedEmployees = localStorage.getItem('employees');
    if (savedEmployees) {
        employees = JSON.parse(savedEmployees);
    }
    updateEmployeeList();
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

// Function to delete employee
function deleteEmployee(username) {
    if (confirm('Are you sure you want to delete this employee?')) {
        const index = employees.findIndex(emp => emp.username === username);
        if (index !== -1) {
            const employee = employees[index];
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

// Make sure this is called when employee dashboard is loaded
function showEmployeeDashboard() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('employeeDashboard').style.display = 'block';
    initializeEmployeeSales();
}

// Add this function to save inventory
function saveInventory() {
    localStorage.setItem('inventory', JSON.stringify(inventory));
}

// Function to save data to localStorage
function saveToLocalStorage() {
    localStorage.setItem('inventory', JSON.stringify(inventory));
    localStorage.setItem('categories', JSON.stringify(categories));
}

// Function to load data from localStorage
function loadFromLocalStorage() {
    const savedInventory = localStorage.getItem('inventory');
    const savedCategories = localStorage.getItem('categories');
    
    if (savedInventory) {
        inventory = JSON.parse(savedInventory);
    }
    if (savedCategories) {
        categories = JSON.parse(savedCategories);
    }
}

// Document ready function
document.addEventListener('DOMContentLoaded', function() {
    loadFromLocalStorage();
});

// Function to check permissions based on role
function canSellGoods(role) {
    return role === 'selling'; // Only 'selling' role can sell goods
}

// Example function to sell goods
function sellGoods(employeeUsername) {
    const employee = employees.find(emp => emp.username === employeeUsername);
    if (employee) {
        if (canSellGoods(employee.role)) {
            // Logic to sell goods
            alert(`${employee.username} is allowed to sell goods.`);
        } else {
            alert(`${employee.username} does not have permission to sell goods.`);
        }
    }
}

// Function to log in an employee
function loginEmployee() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    // Load employees from local storage
    loadEmployees();

    // Check if the employee exists
    const employee = employees.find(emp => emp.username === username && emp.password === password);
    if (employee) {
        alert(`Welcome, ${employee.username}!`);
        // Redirect based on role
        if (employee.role === 'account') {
            window.location.href = 'accounting.html'; // Redirect to accounting page
        } else {
            window.location.href = 'employeeDashboard.html'; // Redirect to employee dashboard
        }
    } else {
        alert('Invalid username or password. Please try again.');
    }
}

// Add function to delete user
function deleteUser(username) {
    if (username === currentUser) {
        alert("You cannot delete your own account!");
        return;
    }

    if (confirm(`Are you sure you want to delete user "${username}"?`)) {
        // Remove from users object
        delete users[username];
        
        // Remove from employees array if exists
        const employeeIndex = employees.findIndex(emp => emp.username === username);
        if (employeeIndex !== -1) {
            employees.splice(employeeIndex, 1);
            // Update employees in localStorage
            localStorage.setItem('employees', JSON.stringify(employees));
        }
        
        // Update the display
        updateUserList();
        
        // Also update employee list if it's visible
        if (document.getElementById('employeeList')) {
            updateEmployeeList();
        }
        
        alert(`User "${username}" has been deleted successfully.`);
    }
}

// Add this function to check if current user is admin
function isAdmin() {
    return currentUserRole === 'admin';
}

// Add this function to check admin permissions
function checkAdminPermissions() {
    if (!isAdmin()) {
        alert('Only administrators can perform this action!');
        return false;
    }
    return true;
}

// Function to initialize employee dashboard
function initializeEmployeeDashboard() {
    // Clear all sections
    clearCart();
    clearSalesHistory();
    clearInventoryView();
    
    // Set employee name
    const employeeName = document.getElementById('employeeName');
    if (employeeName) {
        employeeName.textContent = users[currentUser]?.fullName || currentUser;
    }

    // Initialize empty cart
    currentCart = [];
    
    // Load fresh inventory data
    loadInventory();
    
    // Update product selection
    updateProductSelection();
}

// Function to clear cart
function clearCart() {
    currentCart = [];
    
    // Clear cart display
    const cartItems = document.getElementById('cartItems');
    if (cartItems) {
        cartItems.innerHTML = '';
    }
    
    // Reset all form fields
    document.getElementById('customerName').value = '';
    document.getElementById('customerPhone').value = '';
    document.getElementById('discount').value = '0';
    document.getElementById('payment').value = '0';
    document.getElementById('cartTotal').textContent = 'GH₵ 0.00';
    document.getElementById('finalTotal').textContent = 'GH₵ 0.00';
    document.getElementById('changeAmount').textContent = 'GH₵ 0.00';
    
    // Reset product selection
    const productSelect = document.getElementById('productSelect');
    if (productSelect) {
        productSelect.value = '';
    }
    
    // Reset quantity
    const quantityInput = document.getElementById('quantity');
    if (quantityInput) {
        quantityInput.value = '1';
    }
}

// Function to clear sales history
function clearSalesHistory() {
    const salesHistoryData = document.getElementById('salesHistoryData');
    if (salesHistoryData) {
        salesHistoryData.innerHTML = '';
    }
    
    // Reset summary cards
    document.getElementById('todaySalesCount').textContent = '0 Sales';
    document.getElementById('todaySalesAmount').textContent = 'GH₵ 0.00';
    document.getElementById('todayItemsSold').textContent = '0 Items';
    document.getElementById('averageSaleAmount').textContent = 'GH₵ 0.00';
}

// Function to clear inventory view
function clearInventoryView() {
    const stockList = document.getElementById('stockList');
    if (stockList) {
        stockList.innerHTML = '';
    }
}

// Function to load inventory
function loadInventory() {
    const savedInventory = localStorage.getItem('inventory');
    if (savedInventory) {
        inventory = JSON.parse(savedInventory);
    } else {
        inventory = [];
    }
}

// Function to add item to cart
function addToCart() {
    const productSelect = document.getElementById('productSelect');
    const quantityInput = document.getElementById('quantity');
    
    const productId = parseInt(productSelect.value);
    
    if (!productId) {
        alert('Please select a product');
        return;
    }

    const selectedOption = productSelect.options[productSelect.selectedIndex];
    const available = parseInt(selectedOption.dataset.available);
    const price = parseFloat(selectedOption.dataset.price);
    const productName = selectedOption.dataset.name;

    // Get quantity value and ensure it's a valid number
    let quantity = parseInt(quantityInput.value);
    
    // Validate quantity
    if (!quantity || quantity < 1) {
        alert('Please enter a valid quantity');
        return;
    }

    // Check stock availability
    if (quantity > available) {
        alert(`Only ${available} items available in stock`);
        return;
    }

    // Add to cart with proper quantity tracking
    const existingItem = currentCart.find(item => item.productId === productId);
    if (existingItem) {
        const newTotal = existingItem.quantity + quantity;
        if (newTotal > available) {
            alert(`Cannot add more items. Only ${available} available in stock`);
            return;
        }
        existingItem.quantity = newTotal;
        existingItem.total = existingItem.quantity * existingItem.price;
        existingItem.itemCount = existingItem.quantity; // Track item count
    } else {
        currentCart.push({
            productId,
            productName: productName,
            quantity: quantity,
            price: price,
            total: quantity * price,
            itemCount: quantity, // Track item count
            available: available // Track available stock
        });
    }

    // Update cart display
    updateCartDisplay();
    
    // Show success message with quantity
    showCartUpdateMessage(quantity, productName);
    
    // Reset only the product selection, keep the quantity
    productSelect.value = '';
}

// Function to update cart display with detailed quantities
function updateCartDisplay() {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    if (!cartItems || !cartTotal) return;

    cartItems.innerHTML = '';
    let total = 0;
    let totalItems = 0;

    currentCart.forEach((item, index) => {
        const itemTotal = item.quantity * item.price;
        total += itemTotal;
        totalItems += item.quantity;

        cartItems.innerHTML += `
            <tr>
                <td>${item.productName}</td>
                <td>
                    <div class="quantity-control">
                        <button onclick="updateQuantity(${index}, -1)" class="qty-btn">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="updateQuantity(${index}, 1)" class="qty-btn">+</button>
                    </div>
                </td>
                <td>${formatGhanaCedis(item.price)}</td>
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
    
    // Update total items count
    const totalItemsDisplay = document.getElementById('totalItems');
    if (totalItemsDisplay) {
        totalItemsDisplay.textContent = `Total Items: ${totalItems}`;
    }
    
    // Update final total and payment
    updateFinalTotal();
}

// Function to update quantity from cart
function updateQuantity(index, change) {
    const item = currentCart[index];
    const newQuantity = item.quantity + change;
    
    // Validate new quantity
    if (newQuantity < 1) {
        if (confirm('Remove item from cart?')) {
            removeFromCart(index);
        }
        return;
    }
    
    // Check stock availability
    if (newQuantity > item.available) {
        alert(`Only ${item.available} items available in stock`);
        return;
    }
    
    // Update quantity and total
    item.quantity = newQuantity;
    item.total = item.quantity * item.price;
    
    // Update display
    updateCartDisplay();
}

// Function to show cart update message
function showCartUpdateMessage(quantity, productName) {
    const message = `Added ${quantity} x ${productName} to cart`;
    // You can replace this with a more sophisticated notification system
    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Remove notification after 2 seconds
    setTimeout(() => {
        notification.remove();
    }, 2000);
}

// Add this to your initialization code
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('employeeDashboard')) {
        initializeEmployeeDashboard();
    }
});

// Function to initialize event listeners
function initializeEventListeners() {
    // Add event listeners for inventory filters
    const productSearch = document.getElementById('productSearch');
    const categoryFilter = document.getElementById('categoryFilter');
    const stockFilter = document.getElementById('stockFilter');
    
    if (productSearch) {
        productSearch.addEventListener('keyup', filterProducts);
    }
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterProducts);
    }
    
    if (stockFilter) {
        stockFilter.addEventListener('change', filterProducts);
    }

    // Sales history button
    const salesHistoryBtn = document.querySelector('button[onclick="showSection(\'salesHistory\')"]');
    if (salesHistoryBtn) {
        salesHistoryBtn.addEventListener('click', function() {
            showSection('salesHistory');
        });
    }

    // Other buttons...
}

// Function to update inventory view
function updateInventoryView() {
    const inventoryList = document.getElementById('inventoryList');
    if (!inventoryList) return;

    // Load latest inventory data
    const savedInventory = localStorage.getItem('inventory');
    if (savedInventory) {
        inventory = JSON.parse(savedInventory);
    }

    inventoryList.innerHTML = '';
    inventory.forEach(product => {
        const stockStatus = getStockStatus(product.quantity);
        inventoryList.innerHTML += `
            <tr class="stock-${stockStatus.toLowerCase()}">
                <td>
                    ${product.image ? 
                        `<img src="${product.image}" alt="${product.name}" class="product-thumbnail">` :
                        '<div class="no-image">No Image</div>'
                    }
                </td>
                <td>${product.name}</td>
                <td>${product.category || 'Uncategorized'}</td>
                <td>${product.quantity}</td>
                <td>${formatGhanaCedis(product.price)}</td>
                <td>
                    <span class="stock-badge ${stockStatus.toLowerCase()}">
                        ${stockStatus}
                    </span>
                </td>
            </tr>
        `;
    });
}

// Function to get stock status
function getStockStatus(quantity) {
    if (quantity <= 0) return 'Out of Stock';
    if (quantity <= 5) return 'Low Stock';
    return 'In Stock';
}

// Function to update category filter
function updateCategoryFilter() {
    const categoryFilter = document.getElementById('categoryFilter');
    if (!categoryFilter) return;

    categoryFilter.innerHTML = '<option value="">All Categories</option>';
    categories.forEach(category => {
        categoryFilter.innerHTML += `<option value="${category}">${category}</option>`;
    });
}

// Function to filter employee sales
function filterEmployeeSales() {
    const date = document.getElementById('salesDate').value;
    const searchTerm = document.getElementById('searchCustomer').value.toLowerCase();
    
    // Filter sales for current employee only
    const employeeSales = sales.filter(sale => {
        const saleDate = new Date(sale.date).toISOString().split('T')[0];
        const matchesDate = !date || saleDate === date;
        const matchesSearch = !searchTerm || 
            sale.customer.name.toLowerCase().includes(searchTerm);
        const matchesEmployee = sale.cashier === currentUser;
        
        return matchesDate && matchesSearch && matchesEmployee;
    });

    updateSalesSummary(employeeSales);
    displayEmployeeSales(employeeSales);
}

// Function to update sales summary
function updateSalesSummary(filteredSales) {
    const totalAmount = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
    const totalItems = filteredSales.reduce((sum, sale) => 
        sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
    const averageAmount = filteredSales.length > 0 ? totalAmount / filteredSales.length : 0;

    document.getElementById('todaySalesCount').textContent = 
        `${filteredSales.length} Sale${filteredSales.length !== 1 ? 's' : ''}`;
    document.getElementById('todaySalesAmount').textContent = 
        formatGhanaCedis(totalAmount);
    document.getElementById('todayItemsSold').textContent = 
        `${totalItems} Item${totalItems !== 1 ? 's' : ''}`;
    document.getElementById('averageSaleAmount').textContent = 
        formatGhanaCedis(averageAmount);
}

// Function to display employee sales
function displayEmployeeSales(salesData) {
    const salesHistory = document.getElementById('salesHistoryData');
    if (!salesHistory) return;

    salesHistory.innerHTML = '';
    
    salesData.forEach(sale => {
        const saleTime = new Date(sale.date).toLocaleTimeString();
        const itemsCount = sale.items.reduce((sum, item) => sum + item.quantity, 0);
        
        salesHistory.innerHTML += `
            <tr>
                <td>${saleTime}</td>
                <td>${sale.invoiceNumber}</td>
                <td>${sale.customer.name}</td>
                <td>${itemsCount} items</td>
                <td>${formatGhanaCedis(sale.total)}</td>
                <td>${formatGhanaCedis(sale.payment)}</td>
                <td class="action-buttons">
                    <button onclick="viewSaleDetails('${sale.id}')" class="btn-primary btn-sm">
                        View Details
                    </button>
                    <button onclick="printReceipt(${JSON.stringify(sale)})" class="btn-secondary btn-sm">
                        Print Receipt
                    </button>
                </td>
            </tr>
        `;
    });
}

// Function to view sale details
function viewSaleDetails(saleId) {
    const sale = sales.find(s => s.id === saleId);
    if (!sale) return;

    currentSaleDetails = sale;
    const modal = document.getElementById('saleDetailsModal');
    const content = document.getElementById('saleDetailsContent');

    content.innerHTML = `
        <div class="sale-details">
            <div class="sale-header">
                <p><strong>Invoice #:</strong> ${sale.invoiceNumber}</p>
                <p><strong>Date:</strong> ${formatDate(sale.date)}</p>
                <p><strong>Time:</strong> ${formatTime(sale.date)}</p>
            </div>
            
            <div class="customer-details">
                <p><strong>Customer:</strong> ${sale.customer.name}</p>
                ${sale.customer.phone ? `<p><strong>Phone:</strong> ${sale.customer.phone}</p>` : ''}
            </div>

            <table class="items-table">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${sale.items.map(item => `
                        <tr>
                            <td>${item.name}</td>
                            <td>${item.quantity}</td>
                            <td>${formatGhanaCedis(item.price)}</td>
                            <td>${formatGhanaCedis(item.quantity * item.price)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="sale-totals">
                <p><strong>Subtotal:</strong> ${formatGhanaCedis(sale.subtotal)}</p>
                ${sale.discount ? `<p><strong>Discount:</strong> ${formatGhanaCedis(sale.discount)}</p>` : ''}
                <p><strong>Total:</strong> ${formatGhanaCedis(sale.total)}</p>
                <p><strong>Payment:</strong> ${formatGhanaCedis(sale.payment)}</p>
                <p><strong>Change:</strong> ${formatGhanaCedis(sale.payment - sale.total)}</p>
            </div>
        </div>
    `;

    modal.style.display = 'block';
}

// Initialize sales history when showing the section
function initializeSalesHistory() {
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('salesDate').value = today;
    
    // Load sales data from localStorage
    loadSalesData();
    
    // Filter and display sales
    filterEmployeeSales();
}

// Function to load sales data
function loadSalesData() {
    const savedSales = localStorage.getItem('sales');
    if (savedSales) {
        sales = JSON.parse(savedSales);
    }
}

// Function to format date
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-GH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Function to format time
function formatTime(dateString) {
    return new Date(dateString).toLocaleTimeString('en-GH', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Function to filter products for employee view
function filterProducts() {
    const searchTerm = document.getElementById('productSearch').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    const stockFilter = document.getElementById('stockFilter').value;
    const inventoryList = document.getElementById('inventoryList');
    
    if (!inventoryList) return;

    // Load latest inventory data
    const savedInventory = localStorage.getItem('inventory');
    if (savedInventory) {
        inventory = JSON.parse(savedInventory);
    }

    const filteredProducts = inventory.filter(product => {
        // Apply search filter
        const matchesSearch = product.name.toLowerCase().includes(searchTerm);
        
        // Apply category filter
        const matchesCategory = !categoryFilter || product.category === categoryFilter;
        
        // Apply stock filter
        let matchesStock = true;
        if (stockFilter === 'low') {
            matchesStock = product.quantity > 0 && product.quantity <= 5;
        } else if (stockFilter === 'out') {
            matchesStock = product.quantity <= 0;
        }

        return matchesSearch && matchesCategory && matchesStock;
    });

    displayFilteredProducts(filteredProducts);
}

// Function to display filtered products
function displayFilteredProducts(products) {
    const inventoryList = document.getElementById('inventoryList');
    if (!inventoryList) return;

    inventoryList.innerHTML = '';
    
    products.forEach(product => {
        const stockStatus = getStockStatus(product.quantity);
        inventoryList.innerHTML += `
            <tr class="stock-${stockStatus.toLowerCase().replace(' ', '-')}">
                <td>
                    ${product.image ? 
                        `<img src="${product.image}" alt="${product.name}" class="product-thumbnail">` :
                        '<div class="no-image">No Image</div>'
                    }
                </td>
                <td>${product.name}</td>
                <td>${product.category || 'Uncategorized'}</td>
                <td>${product.quantity}</td>
                <td>${formatGhanaCedis(product.price)}</td>
                <td>
                    <span class="stock-badge ${stockStatus.toLowerCase().replace(' ', '-')}">
                        ${stockStatus}
                    </span>
                </td>
            </tr>
        `;
    });
}

// Function to initialize inventory view
function initializeInventoryView() {
    // Load latest inventory data
    const savedInventory = localStorage.getItem('inventory');
    if (savedInventory) {
        inventory = JSON.parse(savedInventory);
    }

    // Load categories
    const savedCategories = localStorage.getItem('categories');
    if (savedCategories) {
        categories = JSON.parse(savedCategories);
    }

    // Update category filter
    updateCategoryFilter();
    
    // Display all products initially
    displayInventory();
}

// Function to display inventory
function displayInventory() {
    const stockList = document.getElementById('stockList');
    if (!stockList) return;

    stockList.innerHTML = '';
    
    inventory.forEach(product => {
        const profitMargin = calculateProfitMargin(product.cost, product.price);
        
        stockList.innerHTML += `
            <tr>
                <td>
                    ${product.image ? 
                        `<img src="${product.image}" alt="${product.name}" class="product-thumbnail">` :
                        '<div class="no-image">No Image</div>'
                    }
                </td>
                <td>${product.name}</td>
                <td>${product.category || 'Uncategorized'}</td>
                <td>${product.quantity}</td>
                <td>${formatGhanaCedis(product.cost)}</td>
                <td>${formatGhanaCedis(product.price)}</td>
                <td>${profitMargin}%</td>
                <td class="action-buttons">
                    <button onclick="editStock(${product.id})" class="btn-primary btn-sm">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button onclick="deleteStock(${product.id})" class="btn-danger btn-sm">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            </tr>
        `;
    });
}

// Function to filter stock
function filterStock() {
    const searchInput = document.getElementById('stockSearch');
    const categorySelect = document.getElementById('filterCategory');
    const stockList = document.getElementById('stockList');
    
    if (!stockList) return;

    const searchTerm = searchInput.value.toLowerCase();
    const selectedCategory = categorySelect.value;

    stockList.innerHTML = '';
    
    inventory.forEach(product => {
        if (
            (searchTerm === '' || product.name.toLowerCase().includes(searchTerm)) &&
            (selectedCategory === '' || product.category === selectedCategory)
        ) {
            const profitMargin = calculateProfitMargin(product.cost, product.price);
            
            stockList.innerHTML += `
                <tr>
                    <td>
                        ${product.image ? 
                            `<img src="${product.image}" alt="${product.name}" class="product-thumbnail">` :
                            '<div class="no-image">No Image</div>'
                        }
                    </td>
                    <td>${product.name}</td>
                    <td>${product.category || 'Uncategorized'}</td>
                    <td>${product.quantity}</td>
                    <td>${formatGhanaCedis(product.cost)}</td>
                    <td>${formatGhanaCedis(product.price)}</td>
                    <td>${profitMargin}%</td>
                    <td class="action-buttons">
                        <button onclick="editStock(${product.id})" class="btn-primary btn-sm">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button onclick="deleteStock(${product.id})" class="btn-danger btn-sm">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </td>
                </tr>
            `;
        }
    });
}

// Helper function to calculate profit margin
function calculateProfitMargin(cost, price) {
    if (!cost || cost === 0) return 0;
    return Math.round(((price - cost) / cost) * 100);
}

// Function to update category filter
function updateCategoryFilter() {
    const categoryFilter = document.getElementById('filterCategory');
    if (!categoryFilter) return;

    categoryFilter.innerHTML = '<option value="">All Categories</option>';
    categories.forEach(category => {
        categoryFilter.innerHTML += `
            <option value="${category}">${category}</option>
        `;
    });
}

// Update any function that modifies inventory
function updateStock(productId, newQuantity) {
    const product = inventory.find(p => p.id === productId);
    if (product) {
        product.quantity = newQuantity;
        saveInventory();
    }
}

// Function to initialize sale section
function initializeSaleSection() {
    // Load latest inventory
    const savedInventory = localStorage.getItem('inventory');
    if (savedInventory) {
        inventory = JSON.parse(savedInventory);
    }

    // Update product selection dropdown
    updateProductSelection();
    
    // Clear current cart
    currentCart = [];
    updateCartDisplay();
}

// Function to update product selection dropdown
function updateProductSelection() {
    const productSelect = document.getElementById('productSelect');
    if (!productSelect) return;

    productSelect.innerHTML = '<option value="">Select Product</option>';
    
    // Filter only in-stock products
    const availableProducts = inventory.filter(product => product.quantity > 0);
    
    availableProducts.forEach(product => {
        productSelect.innerHTML += `
            <option value="${product.id}" 
                    data-price="${product.price}"
                    data-available="${product.quantity}"
                    data-name="${product.name}">
                ${product.name} (${product.quantity} in stock) - ${formatGhanaCedis(product.price)}
            </option>
        `;
    });
}

// Function to initialize reports
function initializeReports() {
    // Set default dates
    setDefaultDates();
    // Generate initial report
    generateReport();
}

// Function to set default dates
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
            const lastWeek = new Date(today.setDate(today.getDate() - 7));
            startDate.value = lastWeek.toISOString().split('T')[0];
            break;
        case 'monthly':
            const lastMonth = new Date(today.setMonth(today.getMonth() - 1));
            startDate.value = lastMonth.toISOString().split('T')[0];
            break;
        case 'yearly':
            const lastYear = new Date(today.setFullYear(today.getFullYear() - 1));
            startDate.value = lastYear.toISOString().split('T')[0];
            break;
    }
}

// Function to generate report
function generateReport() {
    const startDate = new Date(document.getElementById('startDate').value);
    const endDate = new Date(document.getElementById('endDate').value);
    endDate.setHours(23, 59, 59); // Include the entire end date

    // Load sales data
    const savedSales = localStorage.getItem('sales');
    const sales = savedSales ? JSON.parse(savedSales) : [];

    // Filter sales within date range
    const filteredSales = sales.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate >= startDate && saleDate <= endDate;
    });

    // Calculate summary
    const summary = {
        totalSales: filteredSales.length,
        totalRevenue: filteredSales.reduce((sum, sale) => sum + sale.total, 0),
        totalItems: filteredSales.reduce((sum, sale) => 
            sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0),
        averageSale: filteredSales.length > 0 ? 
            filteredSales.reduce((sum, sale) => sum + sale.total, 0) / filteredSales.length : 0
    };

    // Update summary display
    document.getElementById('totalSales').textContent = summary.totalSales;
    document.getElementById('totalRevenue').textContent = formatGhanaCedis(summary.totalRevenue);
    document.getElementById('totalItems').textContent = summary.totalItems;
    document.getElementById('averageSale').textContent = formatGhanaCedis(summary.averageSale);

    // Generate detailed report
    const reportTable = document.getElementById('reportTable');
    reportTable.innerHTML = `
        <thead>
            <tr>
                <th>Date</th>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Cashier</th>
            </tr>
        </thead>
        <tbody>
            ${filteredSales.map(sale => `
                <tr>
                    <td>${new Date(sale.date).toLocaleDateString()}</td>
                    <td>${sale.invoiceNumber}</td>
                    <td>${sale.customer.name}</td>
                    <td>${sale.items.reduce((sum, item) => sum + item.quantity, 0)} items</td>
                    <td>${formatGhanaCedis(sale.total)}</td>
                    <td>${formatGhanaCedis(sale.payment)}</td>
                    <td>${sale.cashier}</td>
                </tr>
            `).join('')}
        </tbody>
        <tfoot>
            <tr>
                <td colspan="4"><strong>Totals:</strong></td>
                <td><strong>${formatGhanaCedis(summary.totalRevenue)}</strong></td>
                <td colspan="2"></td>
            </tr>
        </tfoot>
    `;
}

// Add these event listeners
document.addEventListener('DOMContentLoaded', function() {
    const reportType = document.getElementById('reportType');
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');

    if (reportType && startDate && endDate) {
        reportType.addEventListener('change', function() {
            setDefaultDates();
            generateReport();
        });

        startDate.addEventListener('change', generateReport);
        endDate.addEventListener('change', generateReport);

        // Initialize reports
        initializeReports();
    }
});

// Function to print report
function printReport() {
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Sales Report</title>');
    
    // Add styles for printing
    printWindow.document.write(`
        <style>
            body { font-family: Arial, sans-serif; }
            table { border-collapse: collapse; width: 100%; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
            .report-header { text-align: center; margin-bottom: 20px; }
            .summary-section { margin-bottom: 30px; }
            .summary-item { margin: 10px 0; }
        </style>
    `);
    
    printWindow.document.write('</head><body>');
    
    // Add report header
    printWindow.document.write(`
        <div class="report-header">
            <h1>Sales Report</h1>
            <p>Period: ${document.getElementById('startDate').value} to ${document.getElementById('endDate').value}</p>
        </div>
        <div class="summary-section">
            <h2>Summary</h2>
            <div class="summary-item">Total Sales: ${document.getElementById('totalSales').textContent}</div>
            <div class="summary-item">Total Revenue: ${document.getElementById('totalRevenue').textContent}</div>
            <div class="summary-item">Total Items Sold: ${document.getElementById('totalItems').textContent}</div>
            <div class="summary-item">Average Sale: ${document.getElementById('averageSale').textContent}</div>
        </div>
    `);
    
    // Add the report table
    printWindow.document.write(document.getElementById('reportTable').outerHTML);
    
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
}