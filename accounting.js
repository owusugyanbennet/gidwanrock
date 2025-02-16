// Initialize accounting data structure
let accountingData = {
    expenses: [],
    transactions: [],
    revenue: {
        daily: {},
        weekly: {},
        monthly: {}
    }
};

// Load data from localStorage on page load
document.addEventListener('DOMContentLoaded', function() {
    loadAccountingData();
    showAccountSection('dailyAccounts');
    updateDashboard();
});

// Function to load accounting data
function loadAccountingData() {
    const savedData = localStorage.getItem('accountingData');
    if (savedData) {
        accountingData = JSON.parse(savedData);
    }
    
    // Load user info
    const username = sessionStorage.getItem('currentUser');
    if (username) {
        document.getElementById('accountUsername').textContent = username;
    } else {
        window.location.href = 'index.html'; // Redirect if not logged in
    }
}

// Function to save accounting data
function saveAccountingData() {
    localStorage.setItem('accountingData', JSON.stringify(accountingData));
}

// Function to show different accounting sections
function showAccountSection(sectionId) {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.style.display = 'none';
    });
    
    document.getElementById(sectionId).style.display = 'block';
    
    // Update section specific data
    switch(sectionId) {
        case 'dailyAccounts':
            updateDailyAccounts();
            break;
        case 'expenses':
            updateExpensesList();
            break;
        case 'revenue':
            updateRevenueDisplay();
            break;
        case 'reports':
            generateFinancialReport();
            break;
    }
}

// Function to add new expense
function addExpense() {
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    const category = document.getElementById('expenseCategory').value;
    const description = document.getElementById('expenseDescription').value;

    if (!amount || !category || !description) {
        alert('Please fill all required fields');
        return;
    }

    const expense = {
        id: Date.now(),
        date: new Date().toISOString(),
        amount: amount,
        category: category,
        description: description
    };

    accountingData.expenses.push(expense);
    saveAccountingData();
    updateExpensesList();
    updateDashboard();

    // Clear form
    document.getElementById('expenseAmount').value = '';
    document.getElementById('expenseCategory').value = '';
    document.getElementById('expenseDescription').value = '';

    alert('Expense added successfully!');
}

// Function to update expenses list
function updateExpensesList() {
    const expensesList = document.getElementById('expensesList');
    if (!expensesList) return;

    expensesList.innerHTML = '';
    
    accountingData.expenses.sort((a, b) => new Date(b.date) - new Date(a.date))
        .forEach(expense => {
            expensesList.innerHTML += `
                <tr>
                    <td>${formatDate(expense.date)}</td>
                    <td>${expense.category}</td>
                    <td>${expense.description}</td>
                    <td>${formatGhanaCedis(expense.amount)}</td>
                    <td>
                        <button onclick="deleteExpense(${expense.id})" class="btn-danger">
                            Delete
                        </button>
                    </td>
                </tr>
            `;
        });
}

// Function to delete expense
function deleteExpense(expenseId) {
    if (confirm('Are you sure you want to delete this expense?')) {
        accountingData.expenses = accountingData.expenses.filter(exp => exp.id !== expenseId);
        saveAccountingData();
        updateExpensesList();
        updateDashboard();
    }
}

// Function to update daily accounts
function updateDailyAccounts() {
    const today = new Date().toISOString().split('T')[0];
    
    // Calculate today's totals
    const todayExpenses = accountingData.expenses
        .filter(exp => exp.date.startsWith(today))
        .reduce((sum, exp) => sum + exp.amount, 0);
    
    const todaySales = accountingData.revenue.daily[today] || 0;
    const netIncome = todaySales - todayExpenses;

    // Update display
    document.getElementById('todaySales').textContent = formatGhanaCedis(todaySales);
    document.getElementById('todayExpenses').textContent = formatGhanaCedis(todayExpenses);
    document.getElementById('todayNet').textContent = formatGhanaCedis(netIncome);

    updateTransactionsList();
}

// Function to update transactions list
function updateTransactionsList() {
    const transactionsList = document.getElementById('transactionsList');
    if (!transactionsList) return;

    const today = new Date().toISOString().split('T')[0];
    const todayTransactions = accountingData.transactions
        .filter(trans => trans.date.startsWith(today))
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    transactionsList.innerHTML = '';
    todayTransactions.forEach(trans => {
        transactionsList.innerHTML += `
            <tr>
                <td>${formatTime(trans.date)}</td>
                <td>${trans.type}</td>
                <td>${trans.description}</td>
                <td>${formatGhanaCedis(trans.amount)}</td>
                <td>${formatGhanaCedis(trans.balance)}</td>
            </tr>
        `;
    });
}

// Helper function to format currency
function formatGhanaCedis(amount) {
    return new Intl.NumberFormat('en-GH', {
        style: 'currency',
        currency: 'GHS'
    }).format(amount);
}

// Helper function to format date
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-GH');
}

// Helper function to format time
function formatTime(dateString) {
    return new Date(dateString).toLocaleTimeString('en-GH');
}

// Function to generate financial report
function generateFinancialReport() {
    const reportType = document.getElementById('reportType').value;
    const startDate = document.getElementById('reportStartDate').value;
    const endDate = document.getElementById('reportEndDate').value;

    // Calculate totals based on date range
    const reportData = calculateReportTotals(startDate, endDate);
    
    // Update summary display
    document.getElementById('reportRevenue').textContent = formatGhanaCedis(reportData.totalRevenue);
    document.getElementById('reportExpenses').textContent = formatGhanaCedis(reportData.totalExpenses);
    document.getElementById('reportProfit').textContent = formatGhanaCedis(reportData.netProfit);
    document.getElementById('reportMargin').textContent = 
        `${((reportData.netProfit / reportData.totalRevenue) * 100 || 0).toFixed(2)}%`;

    // Update detailed report table
    updateReportTable(reportData.details);
}

// Function to calculate report totals
function calculateReportTotals(startDate, endDate) {
    // Implementation for calculating report totals
    // This would aggregate data based on the date range
    return {
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        details: []
    };
}

// Function to update report table
function updateReportTable(details) {
    const reportTable = document.getElementById('financialReportData');
    if (!reportTable) return;

    reportTable.innerHTML = '';
    details.forEach(detail => {
        reportTable.innerHTML += `
            <tr>
                <td>${formatDate(detail.date)}</td>
                <td>${detail.category}</td>
                <td>${formatGhanaCedis(detail.revenue)}</td>
                <td>${formatGhanaCedis(detail.expenses)}</td>
                <td>${formatGhanaCedis(detail.profit)}</td>
            </tr>
        `;
    });
}

// Function to export financial report
function exportFinancialReport() {
    // Implementation for exporting report to Excel/CSV
    alert('Export functionality to be implemented');
}

// Function to print financial report
function printFinancialReport() {
    window.print();
}

// Function to logout
function logout() {
    sessionStorage.clear();
    window.location.href = 'index.html';
} 