/**
 * Core Application Logic for Varahi Export Accounting Software
 */

// Global State
let allClients = [];
let allBills = [];
let allEmployees = [];
let allFabrics = [];
let allStitching = [];
let allCeoActivities = [];
let incomeChart = null;
let gstChart = null;
let ceoFocusChart = null;
let editingCeoActivityId = null;

// Temporary state for uploads/scans
let uploadedFileData = null;
let uploadedFileName = '';
let currentBillItems = [];

// Initialize App on DOM Content Loaded
document.addEventListener('DOMContentLoaded', async () => {
  setupTabNavigation();
  setupDragAndDrop();
  
  try {
    // Fetch initial data
    await refreshData();
    
    // Initial Render
    renderClients();
    renderBills();
    
    // Restore last active tab to prevent defaulting to Dashboard on reload/actions
    const lastActiveTab = localStorage.getItem('lastActiveTab') || 'dashboard';
    const activeNavItem = document.querySelector(`.nav-item[data-tab="${lastActiveTab}"]`);
    if (activeNavItem) {
      activeNavItem.click();
    } else {
      updateDashboard();
    }
    
    console.log('App initialized successfully');
  } catch (error) {
    console.error('Error during app initialization:', error);
  }
});

/**
 * ==========================================
 * NAVIGATION & TAB HANDLING
 * ==========================================
 */
function setupTabNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const tabViews = document.querySelectorAll('.tab-view');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetTab = item.getAttribute('data-tab');
      if (!targetTab) return;
      
      // Save state to localStorage to persist user tab context
      localStorage.setItem('lastActiveTab', targetTab);
      
      // Update nav active classes
      navItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      
      // Update view active classes
      tabViews.forEach(view => {
        view.classList.remove('active');
        if (view.id === `${targetTab}-view`) {
          view.classList.add('active');
        }
      });

      // Special re-renders / actions on tab change
      if (targetTab === 'dashboard') {
        updateDashboard();
      } else if (targetTab === 'clients') {
        renderClients();
      } else if (targetTab === 'bills') {
        renderBills();
        populateClientsDropdowns();
      } else if (targetTab === 'employees') {
        renderEmployees();
      } else if (targetTab === 'fabrics') {
        renderFabrics();
        populateProductionDropdowns();
      } else if (targetTab === 'ceo-tracker') {
        renderCeoLog();
      } else if (targetTab === 'ai-advisor') {
        initAIAdvisorTab();
      }
    });
  });

  // Setup dashboard quick triggers
  document.querySelector('[data-tab-trigger="bills"]').addEventListener('click', () => {
    const billsNavItem = document.querySelector('.nav-item[data-tab="bills"]');
    if (billsNavItem) billsNavItem.click();
  });
}

/**
 * ==========================================
 * DATABASE DATA SYNC
 * ==========================================
 */
async function refreshData() {
  allClients = await window.db.clients.getAll();
  allBills = await window.db.bills.getAll();
  allEmployees = await window.db.employees.getAll();
  allFabrics = await window.db.fabrics.getAll();
  allStitching = await window.db.stitching.getAll();
  allCeoActivities = await window.db.ceoActivities.getAll();
  
  populateClientsDropdowns();
  populateProductionDropdowns();
}

function populateClientsDropdowns() {
  const clientSelect = document.getElementById('bill-client');
  const filterClientSelect = document.getElementById('bill-filter-client');
  
  if (!clientSelect) return;

  // Clear options but preserve default placeholder
  clientSelect.innerHTML = '<option value="">-- Choose Client --</option>';
  filterClientSelect.innerHTML = '<option value="">All Clients</option>';

  // Sort alphabetically
  const sortedClients = [...allClients].sort((a, b) => a.name.localeCompare(b.name));

  sortedClients.forEach(client => {
    const clientText = client.companyName ? `${client.name} (${client.companyName})` : client.name;
    
    // Form Dropdown
    const optForm = document.createElement('option');
    optForm.value = client.id;
    optForm.textContent = clientText;
    clientSelect.appendChild(optForm);

    // Filter Dropdown
    const optFilter = document.createElement('option');
    optFilter.value = client.id;
    optFilter.textContent = clientText;
    filterClientSelect.appendChild(optFilter);
  });
}

/**
 * ==========================================
 * DASHBOARD VIEW LOGIC & CHART.JS
 * ==========================================
 */
function updateDashboard() {
  // Update KPI Counters
  const totalRevenue = allBills.reduce((sum, bill) => sum + bill.totalAmount, 0);
  const totalGst = allBills.reduce((sum, bill) => sum + bill.totalGst, 0);
  const totalBillsCount = allBills.length;
  const totalClientsCount = allClients.length;

  document.getElementById('kpi-revenue').textContent = formatCurrency(totalRevenue);
  document.getElementById('kpi-gst').textContent = formatCurrency(totalGst);
  document.getElementById('kpi-bills-count').textContent = totalBillsCount;
  document.getElementById('kpi-clients-count').textContent = totalClientsCount;

  // Unpaid bills follow-ups alert calculation
  const unpaidBills = allBills.filter(b => b.paymentStatus !== 'Paid');
  const unpaidCount = unpaidBills.length;
  const unpaidTotal = unpaidBills.reduce((sum, b) => sum + b.totalAmount, 0);
  const alertBanner = document.getElementById('unpaid-bills-alert');
  
  if (alertBanner) {
    if (unpaidCount > 0) {
      document.getElementById('unpaid-bills-count').textContent = unpaidCount;
      document.getElementById('unpaid-bills-total').textContent = formatCurrency(unpaidTotal);
      alertBanner.style.display = 'flex';
    } else {
      alertBanner.style.display = 'none';
    }
  }

  // GST Ratio breakdown text
  const gstRatio = totalRevenue > 0 ? ((totalGst / totalRevenue) * 100).toFixed(1) : '0.0';
  document.getElementById('kpi-gst-ratio').innerHTML = `<span>GST represents <strong>${gstRatio}%</strong> of total sales</span>`;

  // Bills Breakdown description
  const withGstCount = allBills.filter(b => b.billType === 'with-gst').length;
  const withoutGstCount = allBills.filter(b => b.billType === 'without-gst').length;
  document.getElementById('kpi-bills-type-breakdown').innerHTML = `<span><strong>${withGstCount}</strong> With GST · <strong>${withoutGstCount}</strong> Without GST</span>`;

  // Active Clients description
  const clientsWithRevenue = new Set(allBills.map(b => b.clientId)).size;
  document.getElementById('kpi-active-clients').innerHTML = `<span><strong>${clientsWithRevenue}</strong> of <strong>${totalClientsCount}</strong> clients have billed transactions</span>`;

  // Draw/Update Charts
  initTrendChart();
  initGstRatioChart();

  // Render recent transactions table (limit to 5)
  renderRecentBills();
}

function renderRecentBills() {
  const tbody = document.getElementById('recent-bills-table-body');
  if (!tbody) return;

  tbody.innerHTML = '';
  
  // Sort bills by date descending
  const recentBills = [...allBills]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  if (recentBills.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No transactions found. Add a client and upload a bill to begin.</td></tr>`;
    return;
  }

  recentBills.forEach(bill => {
    const client = allClients.find(c => c.id === bill.clientId);
    const clientName = client ? (client.companyName ? `${client.companyName} (${client.name})` : client.name) : 'Unknown Client';
    
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="font-medium">${bill.billNumber}</td>
      <td>${clientName}</td>
      <td>${formatDate(bill.date)}</td>
      <td class="col-hide-mobile">
        <span class="badge ${bill.billType === 'with-gst' ? 'badge-gst' : 'badge-nogst'}">
          ${bill.billType === 'with-gst' ? 'With GST' : 'No GST'}
        </span>
      </td>
      <td class="col-hide-tablet">${formatCurrency(bill.totalGst)}</td>
      <td class="font-medium">${formatCurrency(bill.totalAmount)}</td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="viewInvoice(${bill.id})">
          <i class="ph ph-eye"></i> View
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function initTrendChart() {
  const ctx = document.getElementById('incomeTrendChart');
  if (!ctx) return;

  // Clean existing chart if any
  if (incomeChart) {
    incomeChart.destroy();
  }

  // Get last 6 months list
  const months = [];
  const monthlyData = {};
  
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthKey = d.toLocaleString('default', { month: 'short', year: '2-digit' });
    months.push(monthKey);
    monthlyData[monthKey] = { subtotal: 0, gst: 0, total: 0 };
  }

  // Aggregate bills by month
  allBills.forEach(bill => {
    const billDate = new Date(bill.date);
    const monthKey = billDate.toLocaleString('default', { month: 'short', year: '2-digit' });
    
    // Only accumulate if within our 6-month scale
    if (monthlyData.hasOwnProperty(monthKey)) {
      monthlyData[monthKey].subtotal += bill.subtotal - bill.discount;
      monthlyData[monthKey].gst += bill.totalGst;
      monthlyData[monthKey].total += bill.totalAmount;
    }
  });

  const subtotalData = months.map(m => monthlyData[m].subtotal);
  const gstData = months.map(m => monthlyData[m].gst);

  incomeChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [
        {
          label: 'Base Revenue (₹)',
          data: subtotalData,
          backgroundColor: '#7C3AED', // Tailwind Purple-600
          borderColor: '#7C3AED',
          borderRadius: 6,
          stack: 'combined'
        },
        {
          label: 'GST Collected (₹)',
          data: gstData,
          backgroundColor: '#A78BFA', // Tailwind Purple-400
          borderColor: '#A78BFA',
          borderRadius: 6,
          stack: 'combined'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: '#4B5563',
            font: { family: 'Inter', size: 12 }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: '#4B5563' },
          grid: { color: 'rgba(0,0,0,0.04)' }
        },
        y: {
          ticks: { color: '#4B5563' },
          grid: { color: 'rgba(0,0,0,0.04)' }
        }
      }
    }
  });
}

function initGstRatioChart() {
  const ctx = document.getElementById('gstRatioChart');
  if (!ctx) return;

  if (gstChart) {
    gstChart.destroy();
  }

  // Count GST vs Non-GST sales amounts
  let gstTotalAmt = 0;
  let nonGstTotalAmt = 0;

  allBills.forEach(b => {
    if (b.billType === 'with-gst') {
      gstTotalAmt += b.totalAmount;
    } else {
      nonGstTotalAmt += b.totalAmount;
    }
  });

  // If no transactions, setup simulated ratio for empty screen representation
  const hasData = gstTotalAmt > 0 || nonGstTotalAmt > 0;
  const chartData = hasData ? [gstTotalAmt, nonGstTotalAmt] : [1, 1];
  const chartLabels = hasData ? ['Bills with GST (₹)', 'Bills without GST (₹)'] : ['No Data (GST)', 'No Data (Non-GST)'];
  const colors = hasData ? ['#7C3AED', '#E5E7EB'] : ['rgba(0,0,0,0.04)', 'rgba(0,0,0,0.02)'];

  gstChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: chartLabels,
      datasets: [{
        data: chartData,
        backgroundColor: colors,
        borderWidth: 1,
        borderColor: '#FFFFFF'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#4B5563',
            font: { family: 'Inter', size: 11 }
          }
        }
      }
    }
  });
}

/**
 * ==========================================
 * CLIENT MANAGEMENT (CRUD)
 * ==========================================
 */
function renderClients() {
  const tbody = document.getElementById('clients-table-body');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (allClients.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No clients saved. Click "Add Client" to register.</td></tr>`;
    return;
  }

  // Render rows
  allClients.forEach(client => {
    // Calculate total business for client
    const clientBills = allBills.filter(b => b.clientId === client.id);
    const totalBusiness = clientBills.reduce((sum, b) => sum + b.totalAmount, 0);

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div class="font-medium">${client.name}</div>
      </td>
      <td class="col-hide-mobile">${client.companyName || '<span class="text-muted">N/A</span>'}</td>
      <td class="col-hide-tablet">
        <div>${client.email || ''}</div>
        <div class="text-muted small">${client.phone || ''}</div>
      </td>
      <td class="col-hide-mobile"><code class="text-gold font-medium">${client.gstin || '<span class="text-muted">Unregistered</span>'}</code></td>
      <td class="font-medium">${formatCurrency(totalBusiness)}</td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="editClient(${client.id})">
          <i class="ph ph-pencil-simple"></i> Edit
        </button>
        <button class="btn btn-secondary btn-sm btn-icon text-red" onclick="deleteClient(${client.id})" title="Delete Client">
          <i class="ph ph-trash"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

let isQuickAddMode = false;

function openClientModal(quickAdd = false) {
  isQuickAddMode = quickAdd;
  
  // Clear forms
  document.getElementById('client-form').reset();
  document.getElementById('client-id-field').value = '';
  document.getElementById('client-modal-title').textContent = quickAdd ? 'Quick Register Client' : 'Register New Client';
  
  document.getElementById('client-modal').classList.add('active');
}

function closeClientModal() {
  document.getElementById('client-modal').classList.remove('active');
}

async function saveClient(event) {
  event.preventDefault();

  const id = document.getElementById('client-id-field').value;
  const name = document.getElementById('client-name').value.trim();
  const companyName = document.getElementById('client-company').value.trim();
  const email = document.getElementById('client-email').value.trim();
  const phone = document.getElementById('client-phone').value.trim();
  const gstin = document.getElementById('client-gstin').value.trim().toUpperCase();
  const address = document.getElementById('client-address').value.trim();

  const clientData = { name, companyName, email, phone, gstin, address };

  try {
    if (id) {
      // Edit mode
      clientData.id = Number(id);
      const originalClient = allClients.find(c => c.id === clientData.id);
      clientData.createdAt = originalClient.createdAt;
      await window.db.clients.update(clientData);
      console.log('Client updated successfully');
    } else {
      // Add mode
      const newId = await window.db.clients.add(clientData);
      console.log('Client added with ID:', newId);
      
      // If we are quick adding from the Bill modal, auto-select this new client
      if (isQuickAddMode) {
        // Refetch client list immediately to populate options
        await refreshData();
        const selectElement = document.getElementById('bill-client');
        if (selectElement) {
          selectElement.value = newId;
        }
      }
    }

    closeClientModal();
    await refreshData();
    renderClients();
    updateDashboard();
  } catch (error) {
    alert('Error saving client data: ' + error.message);
  }
}

async function editClient(id) {
  const client = allClients.find(c => c.id === id);
  if (!client) return;

  document.getElementById('client-id-field').value = client.id;
  document.getElementById('client-name').value = client.name;
  document.getElementById('client-company').value = client.companyName || '';
  document.getElementById('client-email').value = client.email || '';
  document.getElementById('client-phone').value = client.phone || '';
  document.getElementById('client-gstin').value = client.gstin || '';
  document.getElementById('client-address').value = client.address || '';

  document.getElementById('client-modal-title').textContent = 'Modify Client Details';
  isQuickAddMode = false;
  document.getElementById('client-modal').classList.add('active');
}

async function deleteClient(id) {
  const client = allClients.find(c => c.id === id);
  if (!client) return;

  // Check if client has invoices linked
  const clientBills = allBills.filter(b => b.clientId === id);
  if (clientBills.length > 0) {
    alert(`Cannot delete client "${client.name}" because they have ${clientBills.length} billing records associated. Delete their bills first.`);
    return;
  }

  if (confirm(`Are you sure you want to delete client "${client.name}"? This action is irreversible.`)) {
    await window.db.clients.delete(id);
    await refreshData();
    renderClients();
    updateDashboard();
  }
}

function filterClients() {
  const query = document.getElementById('client-search').value.toLowerCase();
  const rows = document.querySelectorAll('#clients-table-body tr');

  if (rows.length === 0 || rows[0].cells.length === 1) return; // No clients listed

  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    if (text.includes(query)) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
}

/**
 * ==========================================
 * BILL & INVOICE MANAGEMENT (CRUD)
 * ==========================================
 */
function renderBills() {
  const tbody = document.getElementById('bills-table-body');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (allBills.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" class="text-center text-muted">No invoices found. Add a client and upload a bill to begin.</td></tr>`;
    return;
  }

  // Sort bills chronologically descending
  const sortedBills = [...allBills].sort((a, b) => new Date(b.date) - new Date(a.date));

  sortedBills.forEach(bill => {
    const client = allClients.find(c => c.id === bill.clientId);
    const clientName = client ? (client.companyName ? `${client.companyName} (${client.name})` : client.name) : '<span class="text-red">Unknown Client</span>';

    const attachmentBadge = bill.fileData 
      ? `<span class="badge badge-gst" style="cursor:pointer;" onclick="viewAttachedFile('${bill.id}')" title="Click to view file"><i class="ph ph-paperclip"></i> View Receipt</span>`
      : '<span class="text-muted">None</span>';

    const paymentStatus = bill.paymentStatus || 'Pending';
    const statusBadge = `<span class="badge ${paymentStatus === 'Paid' ? 'badge-gst' : 'badge-nogst'}" 
                               style="${paymentStatus === 'Paid' ? 'background-color:rgba(16,185,129,0.08); color:var(--color-success); border-color:rgba(16,185,129,0.2);' : 'background-color:rgba(239,68,68,0.08); color:var(--color-destructive); border-color:rgba(239,68,68,0.2);'}">
                          ${paymentStatus}
                         </span>`;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="font-medium">${bill.billNumber}</td>
      <td>${clientName}</td>
      <td class="col-hide-mobile">${formatDate(bill.date)}</td>
      <td class="col-hide-tablet">
        <span class="badge ${bill.billType === 'with-gst' ? 'badge-gst' : 'badge-nogst'}">
          ${bill.billType === 'with-gst' ? 'With GST' : 'No GST'}
        </span>
      </td>
      <td class="col-hide-tablet">${formatCurrency(bill.subtotal)}</td>
      <td class="col-hide-tablet">${formatCurrency(bill.totalGst)}</td>
      <td class="font-medium">${formatCurrency(bill.totalAmount)}</td>
      <td>${statusBadge}</td>
      <td class="col-hide-mobile">${attachmentBadge}</td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="viewInvoice(${bill.id})">
          <i class="ph ph-eye"></i> Invoice
        </button>
        <button class="btn btn-secondary btn-sm" style="padding: 4px 8px;" onclick="toggleBillStatus(${bill.id})" title="Toggle Payment Status">
          <i class="ph ${paymentStatus === 'Paid' ? 'ph-arrow-counter-clockwise' : 'ph-check-bold'}"></i>
          ${paymentStatus === 'Paid' ? 'Reopen' : 'Paid'}
        </button>
        <button class="btn btn-secondary btn-sm btn-icon text-red" onclick="deleteBill(${bill.id})" title="Delete Bill">
          <i class="ph ph-trash"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function viewAttachedFile(billId) {
  const bill = allBills.find(b => b.id === Number(billId));
  if (!bill || !bill.fileData) return;

  const newWindow = window.open();
  if (newWindow) {
    newWindow.document.write(`<iframe src="${bill.fileData}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
  } else {
    alert("Popup blocked! Enable popups to view attached receipt document.");
  }
}

function openBillModal(prefilledData = false) {
  // Reset Form
  document.getElementById('bill-form').reset();
  
  // Set Date input default to today
  document.getElementById('bill-date').value = new Date().toISOString().split('T')[0];

  // Reset inputs
  document.getElementById('bill-subtotal-input').value = '0.00';
  document.getElementById('bill-gst-input').value = '0.00';
  document.getElementById('bill-discount-input').value = '0.00';
  document.getElementById('bill-total-input').value = '0.00';

  // Reset attachment state
  if (!prefilledData) {
    uploadedFileData = null;
    uploadedFileName = '';
    document.getElementById('bill-attachment-container').classList.add('hidden');
  }

  // Toggle layout structure
  const taxToggle = document.getElementById('bill-tax-type');
  taxToggle.checked = true; // Default to With GST
  toggleTaxLayout();

  if (prefilledData) {
    // Fill from scan or prefilled values
    document.getElementById('bill-number').value = prefilledData.billNumber || '';
    document.getElementById('bill-date').value = prefilledData.date || new Date().toISOString().split('T')[0];
    taxToggle.checked = prefilledData.billType === 'with-gst';
    toggleTaxLayout();

    let subtotalSum = 0;
    let gstSum = 0;
    
    if (prefilledData.items && prefilledData.items.length > 0) {
      prefilledData.items.forEach(item => {
        const qty = item.qty || 1;
        const price = item.price || 0;
        const rate = item.gstRate || 0;
        const sub = price * qty;
        subtotalSum += sub;
        gstSum += sub * (rate / 100);
      });
    } else {
      // If we directly have values
      subtotalSum = prefilledData.subtotal || 0;
      gstSum = prefilledData.totalGst || 0;
    }
    const discount = prefilledData.discount || 0;
    const total = Math.max(0, (subtotalSum + gstSum) - discount);
    
    document.getElementById('bill-subtotal-input').value = subtotalSum.toFixed(2);
    document.getElementById('bill-gst-input').value = gstSum.toFixed(2);
    document.getElementById('bill-discount-input').value = discount.toFixed(2);
    document.getElementById('bill-total-input').value = total.toFixed(2);

    // Set file attachment
    if (uploadedFileData) {
      document.getElementById('bill-attachment-container').classList.remove('hidden');
      document.getElementById('bill-attachment-img').src = uploadedFileData;
      document.getElementById('bill-attachment-name').textContent = truncateText(uploadedFileName, 20);
    }
  }

  autoCalculateBillTotals();
  document.getElementById('bill-modal').classList.add('active');
}

function closeBillModal() {
  document.getElementById('bill-modal').classList.remove('active');
  clearUploadedFile();
}

function removeAttachment() {
  uploadedFileData = null;
  uploadedFileName = '';
  document.getElementById('bill-attachment-container').classList.add('hidden');
}

function toggleTaxLayout() {
  const isGstEnabled = document.getElementById('bill-tax-type').checked;
  const gstInputGroup = document.querySelector('.form-group.id-gst-input-group');
  
  if (gstInputGroup) {
    if (isGstEnabled) {
      gstInputGroup.classList.remove('hidden');
    } else {
      gstInputGroup.classList.add('hidden');
      document.getElementById('bill-gst-input').value = '0.00';
    }
  }
  
  autoCalculateBillTotals();
}

function autoCalculateBillTotals() {
  const subtotal = parseFloat(document.getElementById('bill-subtotal-input').value) || 0;
  const isGstEnabled = document.getElementById('bill-tax-type').checked;
  const gstAmt = isGstEnabled ? (parseFloat(document.getElementById('bill-gst-input').value) || 0) : 0;
  const discount = parseFloat(document.getElementById('bill-discount-input').value) || 0;

  const grandTotal = Math.max(0, (subtotal + gstAmt) - discount);
  document.getElementById('bill-total-input').value = grandTotal.toFixed(2);
}

async function saveBill(event) {
  event.preventDefault();

  const clientId = document.getElementById('bill-client').value;
  const billNumber = document.getElementById('bill-number').value.trim();
  const date = document.getElementById('bill-date').value;
  const isGstEnabled = document.getElementById('bill-tax-type').checked;

  if (!clientId) {
    alert('Please select or register a client first.');
    return;
  }

  const subtotalSum = parseFloat(document.getElementById('bill-subtotal-input').value) || 0;
  const gstSum = isGstEnabled ? (parseFloat(document.getElementById('bill-gst-input').value) || 0) : 0;
  const discount = parseFloat(document.getElementById('bill-discount-input').value) || 0;
  const grandTotal = parseFloat(document.getElementById('bill-total-input').value) || 0;

  // Compile a clean placeholder invoice summary item to keep data schema consistent
  const items = [{
    name: isGstEnabled ? 'Fabric Invoice Summary (Taxable)' : 'Fabric Invoice Summary',
    price: subtotalSum,
    qty: 1,
    gstRate: isGstEnabled ? 18 : 0,
    gstAmount: gstSum,
    total: grandTotal
  }];

  const billData = {
    clientId: Number(clientId),
    billNumber,
    date,
    billType: isGstEnabled ? 'with-gst' : 'without-gst',
    items,
    discount,
    subtotal: subtotalSum,
    totalGst: gstSum,
    totalAmount: grandTotal,
    fileData: uploadedFileData,
    fileName: uploadedFileName
  };

  try {
    await window.db.bills.add(billData);
    console.log('Bill invoice recorded successfully');
    
    closeBillModal();
    await refreshData();
    renderBills();
    updateDashboard();
  } catch (error) {
    alert('Error saving bill: ' + error.message);
  }
}

async function deleteBill(id) {
  if (confirm('Are you sure you want to delete this bill invoice? This will recalculate accounting metrics.')) {
    await window.db.bills.delete(id);
    await refreshData();
    renderBills();
    updateDashboard();
  }
}

function filterBills() {
  const searchNo = document.getElementById('bill-search').value.toLowerCase();
  const filterClient = document.getElementById('bill-filter-client').value;
  const filterGst = document.getElementById('bill-filter-gst').value;
  const filterDate = document.getElementById('bill-filter-date').value;

  const rows = document.querySelectorAll('#bills-table-body tr');
  if (rows.length === 0 || rows[0].cells.length === 1) return;

  rows.forEach((row, index) => {
    // Get matching bill record by chronological list sorting matching rendered list
    const sortedBills = [...allBills].sort((a, b) => new Date(b.date) - new Date(a.date));
    const bill = sortedBills[index];
    if (!bill) return;

    let matches = true;

    // Filter by number
    if (searchNo && !bill.billNumber.toLowerCase().includes(searchNo)) {
      matches = false;
    }
    // Filter by Client
    if (filterClient && bill.clientId !== Number(filterClient)) {
      matches = false;
    }
    // Filter by GST Type
    if (filterGst && bill.billType !== filterGst) {
      matches = false;
    }
    // Filter by Date
    if (filterDate && bill.date !== filterDate) {
      matches = false;
    }

    row.style.display = matches ? '' : 'none';
  });
}

/**
 * ==========================================
 * RECEIPT SCANNING / UPLOADER (SIMULATION)
 * ==========================================
 */
function setupDragAndDrop() {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');

  if (!dropZone) return;

  // Open browse dialog on click
  dropZone.addEventListener('click', () => fileInput.click());

  // Handle file selection
  fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

  // Drag listeners
  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
    }, false);
  });

  dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    handleFiles(dt.files);
  }, false);
}

function handleFiles(files) {
  if (files.length === 0) return;
  const file = files[0];

  uploadedFileName = file.name;
  
  // Read file as base64 data url
  const reader = new FileReader();
  reader.readAsDataURL(file);
  
  reader.onload = (e) => {
    uploadedFileData = e.target.result;
    
    // Show File Preview
    document.getElementById('drop-zone').classList.add('hidden');
    
    const previewContainer = document.getElementById('file-preview-container');
    previewContainer.classList.remove('hidden');
    
    const previewImg = document.getElementById('file-preview-img');
    const scanningPreviewImg = document.getElementById('scanning-preview-img');
    
    if (file.type.startsWith('image/')) {
      previewImg.src = uploadedFileData;
      scanningPreviewImg.src = uploadedFileData;
    } else {
      // PDF representation icon
      previewImg.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%238B5CF6" stroke-width="1"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';
      scanningPreviewImg.src = previewImg.src;
    }
    
    document.getElementById('uploaded-filename').textContent = truncateText(file.name, 30);
    
    // Enable scanning buttons
    document.getElementById('btn-start-scan').disabled = false;
  };
}

function clearUploadedFile() {
  uploadedFileData = null;
  uploadedFileName = '';
  
  document.getElementById('drop-zone').classList.remove('hidden');
  document.getElementById('file-preview-container').classList.add('hidden');
  document.getElementById('scanning-container').classList.add('hidden');
  document.getElementById('btn-start-scan').disabled = true;
  document.getElementById('file-input').value = '';
}

function openScanModal() {
  clearUploadedFile();
  document.getElementById('scan-modal').classList.add('active');
}

function closeScanModal() {
  document.getElementById('scan-modal').classList.remove('active');
}

function simulateScan() {
  // Swap upload screen for scanning visual loader
  document.getElementById('file-preview-container').classList.add('hidden');
  document.getElementById('scanning-container').classList.remove('hidden');
  document.getElementById('btn-start-scan').disabled = true;

  const progressBar = document.getElementById('scan-progress-bar');
  progressBar.style.width = '0%';

  let progress = 0;
  const intervalTime = 50; // ms
  const totalDuration = 2500; // 2.5s scan duration
  const step = (intervalTime / totalDuration) * 100;

  const progressInterval = setInterval(() => {
    progress += step;
    progressBar.style.width = `${Math.min(progress, 100)}%`;

    if (progress >= 100) {
      clearInterval(progressInterval);
      
      // Scanning completes. Generate random parsed results.
      setTimeout(() => {
        closeScanModal();
        
        // Mock parsed information
        const isGst = Math.random() > 0.3; // 70% chance of GST
        const mockBill = {
          billNumber: 'INV-' + (2026) + '-' + Math.floor(1000 + Math.random() * 9000),
          date: new Date().toISOString().split('T')[0],
          billType: isGst ? 'with-gst' : 'without-gst',
          items: [
            {
              name: 'High Performance Dell Workstation',
              price: 85000,
              qty: 1,
              gstRate: 18
            },
            {
              name: 'Logitech MX Master Mouse',
              price: 9500,
              qty: 2,
              gstRate: 18
            },
            {
              name: 'Office Space Rental Stationery Pack',
              price: 1500,
              qty: 5,
              gstRate: 12
            }
          ]
        };

        if (!isGst) {
          // Flatten items GST rates to 0
          mockBill.items.forEach(i => i.gstRate = 0);
        }

        // Open editing form with details prefilled
        openBillModal(mockBill);
      }, 300);
    }
  }, intervalTime);
}

/**
 * ==========================================
 * INVOICE VIEWER & PRINT LAYOUTS
 * ==========================================
 */
function viewInvoice(id) {
  const bill = allBills.find(b => b.id === Number(id));
  if (!bill) return;

  const client = allClients.find(c => c.id === bill.clientId);
  
  // Fill details into Print/View panel
  document.getElementById('print-inv-no').textContent = bill.billNumber;
  document.getElementById('print-inv-date').textContent = formatDate(bill.date);
  document.getElementById('print-inv-scheme').textContent = bill.billType === 'with-gst' ? 'With GST' : 'Without GST';

  // Client Details
  document.getElementById('print-client-name').textContent = client ? client.name : 'Unknown Client';
  document.getElementById('print-client-company').textContent = client ? (client.companyName || '') : '';
  document.getElementById('print-client-address').textContent = client ? (client.address || '') : '';
  document.getElementById('print-client-gstin').textContent = client ? (client.gstin || 'Unregistered') : 'N/A';
  document.getElementById('print-client-email').textContent = client ? (client.email || 'N/A') : 'N/A';
  document.getElementById('print-client-phone').textContent = client ? (client.phone || 'N/A') : 'N/A';

  // Populate items print table
  const tbody = document.getElementById('print-items-tbody');
  tbody.innerHTML = '';

  const isGst = bill.billType === 'with-gst';
  const printGstCols = document.querySelectorAll('.gst-print-col');
  
  // Hide GST column if bill doesn't have it
  printGstCols.forEach(col => {
    if (isGst) {
      col.style.display = '';
    } else {
      col.style.display = 'none';
    }
  });

  bill.items.forEach((item, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td class="font-medium">${item.name}</td>
      <td class="text-right">${formatCurrency(item.price)}</td>
      <td class="text-center">${item.qty}</td>
      <td class="text-right gst-print-col" style="${isGst ? '' : 'display:none;'}">${item.gstRate}%</td>
      <td class="text-right gst-print-col" style="${isGst ? '' : 'display:none;'}">${formatCurrency(item.gstAmount)}</td>
      <td class="text-right font-medium">${formatCurrency(item.total)}</td>
    `;
    tbody.appendChild(tr);
  });

  // Summary figures
  document.getElementById('print-subtotal').textContent = formatCurrency(bill.subtotal);
  document.getElementById('print-gst').textContent = formatCurrency(bill.totalGst);
  document.getElementById('print-discount').textContent = `- ${formatCurrency(bill.discount)}`;
  document.getElementById('print-total').textContent = formatCurrency(bill.totalAmount);

  // Show Modal
  document.getElementById('invoice-modal').classList.add('active');
}

function closeInvoiceModal() {
  document.getElementById('invoice-modal').classList.remove('active');
}

function printInvoice() {
  window.print();
}

/**
 * ==========================================
 * UTILITY HELPERS
 * ==========================================
 */
function formatCurrency(val) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(val);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function truncateText(str, n) {
  return (str.length > n) ? str.substr(0, n - 1) + '...' : str;
}

/**
 * ==========================================
 * EMPLOYEE MANAGEMENT MODULE
 * ==========================================
 */
function renderEmployees() {
  const tbody = document.getElementById('employees-table-body');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (allEmployees.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No employees registered. Click "Register Employee" to begin.</td></tr>`;
    return;
  }

  allEmployees.forEach(emp => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><div class="font-medium">${emp.name}</div></td>
      <td><span class="badge badge-nogst">${emp.role}</span></td>
      <td>${emp.phone}</td>
      <td class="text-right font-medium">₹${emp.stitchRate.toFixed(2)}</td>
      <td class="text-right font-medium">${emp.salary > 0 ? formatCurrency(emp.salary) : '<span class="text-muted">Piece-rate only</span>'}</td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="editEmployee(${emp.id})">
          <i class="ph ph-pencil-simple"></i> Edit
        </button>
        <button class="btn btn-secondary btn-sm btn-icon text-red" onclick="deleteEmployee(${emp.id})" title="Delete Employee">
          <i class="ph ph-trash"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function openEmployeeModal() {
  document.getElementById('employee-form').reset();
  document.getElementById('employee-id-field').value = '';
  document.getElementById('employee-modal-title').textContent = 'Register New Employee';
  document.getElementById('employee-modal').classList.add('active');
}

function closeEmployeeModal() {
  document.getElementById('employee-modal').classList.remove('active');
}

async function saveEmployee(event) {
  event.preventDefault();

  const id = document.getElementById('employee-id-field').value;
  const name = document.getElementById('employee-name').value.trim();
  const role = document.getElementById('employee-role').value;
  const phone = document.getElementById('employee-phone').value.trim();
  const stitchRate = Number(document.getElementById('employee-stitch-rate').value) || 0;
  const salary = Number(document.getElementById('employee-salary').value) || 0;

  const empData = { name, role, phone, stitchRate, salary };

  try {
    if (id) {
      empData.id = Number(id);
      const original = allEmployees.find(e => e.id === empData.id);
      empData.createdAt = original.createdAt;
      await window.db.employees.update(empData);
    } else {
      await window.db.employees.add(empData);
    }

    closeEmployeeModal();
    await refreshData();
    renderEmployees();
  } catch (error) {
    alert('Error saving employee: ' + error.message);
  }
}

async function editEmployee(id) {
  const emp = allEmployees.find(e => e.id === id);
  if (!emp) return;

  document.getElementById('employee-id-field').value = emp.id;
  document.getElementById('employee-name').value = emp.name;
  document.getElementById('employee-role').value = emp.role;
  document.getElementById('employee-phone').value = emp.phone;
  document.getElementById('employee-stitch-rate').value = emp.stitchRate;
  document.getElementById('employee-salary').value = emp.salary;

  document.getElementById('employee-modal-title').textContent = 'Modify Employee Details';
  document.getElementById('employee-modal').classList.add('active');
}

async function deleteEmployee(id) {
  const emp = allEmployees.find(e => e.id === id);
  if (!emp) return;

  const linkedJobs = allStitching.filter(s => s.employeeId === id);
  if (linkedJobs.length > 0) {
    alert(`Cannot delete employee "${emp.name}" because they have ${linkedJobs.length} stitching assignments recorded. Delete or close those jobs first.`);
    return;
  }

  if (confirm(`Are you sure you want to delete employee "${emp.name}"?`)) {
    await window.db.employees.delete(id);
    await refreshData();
    renderEmployees();
  }
}

function filterEmployees() {
  const query = document.getElementById('employee-search').value.toLowerCase();
  const rows = document.querySelectorAll('#employees-table-body tr');

  if (rows.length === 0 || rows[0].cells.length === 1) return;

  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(query) ? '' : 'none';
  });
}

/**
 * ==========================================
 * FABRICS & PRODUCTION MODULE
 * ==========================================
 */
function renderFabrics() {
  const fabBody = document.getElementById('fabrics-table-body');
  const stitchBody = document.getElementById('stitching-table-body');
  
  if (fabBody) renderIncomingFabrics(fabBody);
  if (stitchBody) renderStitchingAssignments(stitchBody);
}

function renderIncomingFabrics(tbody) {
  tbody.innerHTML = '';

  if (allFabrics.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No fabrics logged. Click "Record Fabric" to log stock.</td></tr>`;
    return;
  }

  allFabrics.forEach(fab => {
    let badgeClass = 'badge-nogst';
    if (fab.status === 'Stitching') badgeClass = 'badge-gst';
    if (fab.status === 'Completed') badgeClass = 'badge-gst';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><div class="font-medium">${fab.fabricType}</div></td>
      <td class="text-right font-medium">${fab.quantityReceived} m</td>
      <td>${fab.color}</td>
      <td class="col-hide-mobile">${formatDate(fab.receivedDate)}</td>
      <td class="col-hide-tablet">${fab.supplier || '<span class="text-muted">N/A</span>'}</td>
      <td><span class="badge ${badgeClass}">${fab.status}</span></td>
      <td>
        <select class="btn btn-secondary btn-sm" style="padding: 2px 6px; font-size:11px;" onchange="updateFabricStatus(${fab.id}, this.value)">
          <option value="Stored" ${fab.status === 'Stored' ? 'selected' : ''}>Stored</option>
          <option value="Stitching" ${fab.status === 'Stitching' ? 'selected' : ''}>Stitching</option>
          <option value="Completed" ${fab.status === 'Completed' ? 'selected' : ''}>Completed</option>
        </select>
        <button class="btn btn-secondary btn-sm btn-icon text-red" onclick="deleteFabric(${fab.id})" title="Delete Fabric">
          <i class="ph ph-trash"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function updateFabricStatus(id, newStatus) {
  const fab = allFabrics.find(f => f.id === id);
  if (!fab) return;
  
  fab.status = newStatus;
  await window.db.fabrics.update(fab);
  await refreshData();
  renderFabrics();
}

function renderStitchingAssignments(tbody) {
  tbody.innerHTML = '';

  if (allStitching.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No stitching jobs assigned. Click "Assign Stitching" to start.</td></tr>`;
    return;
  }

  allStitching.forEach(job => {
    const emp = allEmployees.find(e => e.id === job.employeeId);
    const fab = allFabrics.find(f => f.id === job.fabricId);

    const empName = emp ? emp.name : 'Unknown Employee';
    const fabricDesc = fab ? `${fab.fabricType} (${fab.color})` : 'Unknown Fabric';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><div class="font-medium">${empName}</div></td>
      <td>${fabricDesc}</td>
      <td class="text-right font-medium">${job.piecesStitched} pcs</td>
      <td class="text-right col-hide-tablet">₹${job.ratePerPiece.toFixed(2)}</td>
      <td class="text-right font-medium">${formatCurrency(job.totalPayment)}</td>
      <td><span class="badge ${job.status === 'Finished' ? 'badge-gst' : 'badge-nogst'}">${job.status}</span></td>
      <td>
        ${job.status === 'Stitching' ? `
          <button class="btn btn-primary btn-sm" onclick="completeStitchingJob(${job.id})" title="Mark job as finished">
            <i class="ph ph-check-bold"></i> Finish
          </button>
        ` : ''}
        <button class="btn btn-secondary btn-sm btn-icon text-red" onclick="deleteStitching(${job.id})" title="Delete Assignment">
          <i class="ph ph-trash"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function openFabricModal() {
  document.getElementById('fabric-form').reset();
  document.getElementById('fabric-id-field').value = '';
  document.getElementById('fabric-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('fabric-modal').classList.add('active');
}

function closeFabricModal() {
  document.getElementById('fabric-modal').classList.remove('active');
}

async function saveFabric(event) {
  event.preventDefault();

  const fabricType = document.getElementById('fabric-type').value.trim();
  const quantityReceived = Number(document.getElementById('fabric-qty').value) || 0;
  const color = document.getElementById('fabric-color').value.trim();
  const receivedDate = document.getElementById('fabric-date').value;
  const supplier = document.getElementById('fabric-supplier').value.trim();
  const status = document.getElementById('fabric-status').value;

  const fabData = { fabricType, quantityReceived, color, receivedDate, supplier, status };

  try {
    await window.db.fabrics.add(fabData);
    closeFabricModal();
    await refreshData();
    renderFabrics();
  } catch (error) {
    alert('Error saving fabric roll: ' + error.message);
  }
}

async function deleteFabric(id) {
  const linkedJobs = allStitching.filter(s => s.fabricId === id);
  if (linkedJobs.length > 0) {
    alert(`Cannot delete this fabric roll because it has ${linkedJobs.length} active stitching assignments.`);
    return;
  }

  if (confirm('Are you sure you want to delete this fabric log entry?')) {
    await window.db.fabrics.delete(id);
    await refreshData();
    renderFabrics();
  }
}

function openStitchingModal() {
  document.getElementById('stitching-form').reset();
  document.getElementById('stitching-id-field').value = '';
  document.getElementById('stitching-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('stitching-payout-display').textContent = '₹0.00';
  
  populateProductionDropdowns();
  document.getElementById('stitching-modal').classList.add('active');
}

function closeStitchingModal() {
  document.getElementById('stitching-modal').classList.remove('active');
}

function populateProductionDropdowns() {
  const empSelect = document.getElementById('stitching-employee');
  const fabSelect = document.getElementById('stitching-fabric');

  if (!empSelect || !fabSelect) return;

  empSelect.innerHTML = '<option value="">-- Choose Employee --</option>';
  fabSelect.innerHTML = '<option value="">-- Choose Fabric roll --</option>';

  allEmployees.filter(e => e.role === 'Stitcher' || e.role === 'Tailor').forEach(emp => {
    const opt = document.createElement('option');
    opt.value = emp.id;
    opt.textContent = `${emp.name} (${emp.role})`;
    empSelect.appendChild(opt);
  });

  allFabrics.filter(f => f.status !== 'Completed').forEach(fab => {
    const opt = document.createElement('option');
    opt.value = fab.id;
    opt.textContent = `${fab.fabricType} - ${fab.color} (${fab.quantityReceived}m)`;
    fabSelect.appendChild(opt);
  });
}

function autofillStitchRate() {
  const empId = document.getElementById('stitching-employee').value;
  if (!empId) return;

  const emp = allEmployees.find(e => e.id === Number(empId));
  if (emp) {
    document.getElementById('stitching-rate').value = emp.stitchRate;
    calculateStitchPayout();
  }
}

function calculateStitchPayout() {
  const pieces = Number(document.getElementById('stitching-pieces').value) || 0;
  const rate = Number(document.getElementById('stitching-rate').value) || 0;
  const payout = pieces * rate;
  document.getElementById('stitching-payout-display').textContent = formatCurrency(payout);
}

async function saveStitching(event) {
  event.preventDefault();

  const employeeId = document.getElementById('stitching-employee').value;
  const fabricId = document.getElementById('stitching-fabric').value;
  const piecesStitched = Number(document.getElementById('stitching-pieces').value) || 0;
  const ratePerPiece = Number(document.getElementById('stitching-rate').value) || 0;
  const assignedDate = document.getElementById('stitching-date').value;
  const status = document.getElementById('stitching-status').value;
  const notes = document.getElementById('stitching-notes').value.trim();

  if (!employeeId || !fabricId) {
    alert('Please select an employee and fabric consignment.');
    return;
  }

  const totalPayment = piecesStitched * ratePerPiece;

  const stitchData = {
    employeeId: Number(employeeId),
    fabricId: Number(fabricId),
    piecesStitched,
    ratePerPiece,
    totalPayment,
    assignedDate,
    status,
    notes
  };

  try {
    await window.db.stitching.add(stitchData);

    const fabric = allFabrics.find(f => f.id === Number(fabricId));
    if (fabric && fabric.status === 'Stored') {
      fabric.status = 'Stitching';
      await window.db.fabrics.update(fabric);
    }

    closeStitchingModal();
    await refreshData();
    renderFabrics();
  } catch (error) {
    alert('Error saving stitching job: ' + error.message);
  }
}

async function completeStitchingJob(id) {
  const job = allStitching.find(j => j.id === id);
  if (!job) return;

  if (confirm('Mark this stitching assignment as complete? This will finalize wages calculations.')) {
    job.status = 'Finished';
    await window.db.stitching.update(job);

    const fab = allFabrics.find(f => f.id === job.fabricId);
    if (fab && fab.status === 'Stitching') {
      const allFabJobs = allStitching.filter(s => s.fabricId === fab.id);
      const activeJobs = allFabJobs.filter(s => s.id !== id && s.status === 'Stitching');
      
      if (activeJobs.length === 0) {
        if (confirm(`No other active stitching assignments found for fabric roll "${fab.fabricType}". Update fabric inventory status to "Completed" too?`)) {
          fab.status = 'Completed';
          await window.db.fabrics.update(fab);
        }
      }
    }

    await refreshData();
    renderFabrics();
  }
}

async function deleteStitching(id) {
  if (confirm('Are you sure you want to delete this stitching assignment?')) {
    await window.db.stitching.delete(id);
    await refreshData();
    renderFabrics();
  }
}

/**
 * ==========================================
 * AI ADVISOR LOGIC & INTERACTIVE CHATBOT
 * ==========================================
 */
let aiAnalyzedBefore = false;

function initAIAdvisorTab() {
  const chatLogs = document.getElementById('ai-chat-logs');
  if (chatLogs) {
    chatLogs.scrollTop = chatLogs.scrollHeight;
  }
}

// Generates strategic analysis based on real ledger data
function generateAIReport() {
  const gauge = document.querySelector('.health-score-gauge');
  const percentageSpan = document.getElementById('ai-health-percentage');
  const statusSpan = document.getElementById('ai-health-status');
  const summaryText = document.getElementById('ai-summary-text');
  const recList = document.getElementById('ai-recommendations-list');

  if (!gauge || !percentageSpan || !statusSpan || !summaryText || !recList) return;

  // Trigger scanning visual loading state
  gauge.className = 'health-score-gauge scan-active';
  percentageSpan.textContent = '--';
  statusSpan.textContent = 'Analyzing...';
  statusSpan.className = 'badge badge-gst font-medium';
  summaryText.innerHTML = '<div class="spinner" style="margin: 10px auto;"></div> Analyzing ledger entries, bills distribution, tax slabs, and cash flow predictability...';

  setTimeout(() => {
    // 1. Calculations from active dataset
    const totalRev = allBills.reduce((sum, b) => sum + b.totalAmount, 0);
    const totalGst = allBills.reduce((sum, b) => sum + b.totalGst, 0);
    const billCount = allBills.length;
    const clientCount = allClients.length;

    // 2. Client concentration analysis
    const clientRevenue = {};
    allBills.forEach(b => {
      clientRevenue[b.clientId] = (clientRevenue[b.clientId] || 0) + b.totalAmount;
    });

    let maxClientRev = 0;
    let topClientId = null;
    for (const cid in clientRevenue) {
      if (clientRevenue[cid] > maxClientRev) {
        maxClientRev = clientRevenue[cid];
        topClientId = Number(cid);
      }
    }

    const topClient = allClients.find(c => c.id === topClientId);
    const topClientName = topClient ? (topClient.companyName || topClient.name) : 'N/A';
    const clientConcentrationRatio = totalRev > 0 ? (maxClientRev / totalRev) * 100 : 0;

    // 3. Score calculation logic
    let score = 95;

    if (clientCount === 0) {
      score = 0;
    } else {
      if (clientCount === 1) score -= 30; // Solo client risk
      else if (clientCount === 2) score -= 15;
      
      if (clientConcentrationRatio > 70) score -= 25; // Massive concentration risk
      else if (clientConcentrationRatio > 50) score -= 15;
      else if (clientConcentrationRatio > 35) score -= 8;

      if (billCount < 3) score -= 15; // Unstable data
      else if (billCount < 6) score -= 5;
    }

    score = Math.max(10, Math.min(100, Math.round(score)));

    // Apply color styling based on health score range
    if (score >= 80) {
      gauge.className = 'health-score-gauge good';
      statusSpan.textContent = 'Stable / Good';
      statusSpan.className = 'badge badge-gst font-medium text-green';
    } else if (score >= 50) {
      gauge.className = 'health-score-gauge warning';
      statusSpan.textContent = 'Moderate Risk';
      statusSpan.className = 'badge badge-nogst font-medium text-gold';
    } else {
      gauge.className = 'health-score-gauge warning';
      statusSpan.textContent = 'High Alert';
      statusSpan.className = 'badge badge-nogst font-medium text-red';
    }

    percentageSpan.textContent = `${score}%`;

    // 4. Executive Summary Generation
    if (clientCount === 0) {
      summaryText.textContent = "Your ledger database is currently empty. To perform a business intelligence sweep, register at least one client and upload/record transactions under the Bills tab.";
      recList.innerHTML = `
        <div class="recommendation-item alert-danger">
          <div class="icon" style="background-color: rgba(239, 68, 68, 0.1); color: var(--color-destructive);"><i class="ph ph-warning-octagon"></i></div>
          <div>
            <h5 style="color: var(--color-destructive);">No Ledger Data</h5>
            <p>Add clients and save bills to configure strategic insights.</p>
          </div>
        </div>
      `;
      return;
    }

    const formattedRevenue = formatCurrency(totalRev);
    const formattedGst = formatCurrency(totalGst);
    
    let summaryTextBody = `Varahi Export registers a Financial Health Index of **${score}%** compiled from **${billCount}** transactions and **${clientCount}** accounts. `;
    if (clientConcentrationRatio > 40) {
      summaryTextBody += `Your client portfolio displays a significant concentration risk, with **${topClientName}** accounting for **${clientConcentrationRatio.toFixed(1)}%** of your lifetime sales. We advise client outreach to diversify your revenue stream. `;
    } else {
      summaryTextBody += `Your client distribution is healthy, with no single account representing more than 40% of sales. `;
    }
    summaryTextBody += `Additionally, you have accrued **${formattedGst}** in GST liabilities. We suggest preserving this amount in a separate liquidity account to cover upcoming tax filing runs smoothly.`;
    
    summaryText.innerHTML = summaryTextBody.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // 5. Strategic Recommendations List Populate
    let recItemsHtml = '';

    // Card 1: Client Diversity
    if (clientConcentrationRatio > 40) {
      recItemsHtml += `
        <div class="recommendation-item alert-danger">
          <div class="icon" style="background-color: rgba(239, 68, 68, 0.15); color: var(--color-destructive);"><i class="ph ph-warning-octagon"></i></div>
          <div>
            <h5 style="color: var(--color-destructive);">High Concentration Risk (${clientConcentrationRatio.toFixed(1)}%)</h5>
            <p><strong>${topClientName}</strong> represents ${clientConcentrationRatio.toFixed(1)}% of your sales. If this account experiences delays or churns, Varahi Export will experience immediate cash pressure. Target client concentration levels below 30%.</p>
          </div>
        </div>
      `;
    } else {
      recItemsHtml += `
        <div class="recommendation-item alert-success">
          <div class="icon" style="background-color: rgba(16, 185, 129, 0.15); color: var(--color-success);"><i class="ph ph-check-circle"></i></div>
          <div>
            <h5 style="color: var(--color-success);">Healthy Client Diversification</h5>
            <p>Your largest client represents ${clientConcentrationRatio.toFixed(1)}% of sales, which falls within safe compliance thresholds (<40%). Your business exposure is safely distributed.</p>
          </div>
        </div>
      `;
    }

    // Card 2: Tax Liquidity Reserve
    if (totalGst > 0) {
      recItemsHtml += `
        <div class="recommendation-item">
          <div class="icon" style="background-color: rgba(245, 158, 11, 0.15); color: var(--color-primary);"><i class="ph ph-safe"></i></div>
          <div>
            <h5>GST Liquidity Reserve: ${formattedGst}</h5>
            <p>Move ${formattedGst} to a secondary tax reserve account. This prevents accidentally utilizing collected tax funds as operational working capital, ensuring zero filing frictions.</p>
          </div>
        </div>
      `;
    } else {
      recItemsHtml += `
        <div class="recommendation-item">
          <div class="icon"><i class="ph ph-info"></i></div>
          <div>
            <h5>GST Liability: ₹0.00</h5>
            <p>You have not recorded any GST billing entries. If you begin domestic business expansions, enable the "With GST" switch on bills to automate calculations.</p>
          </div>
        </div>
      `;
    }

    // Card 3: Revenue Variance
    const avgInvoiceSize = totalRev / billCount;
    recItemsHtml += `
      <div class="recommendation-item">
        <div class="icon" style="background-color: rgba(139, 92, 246, 0.15); color: var(--color-accent);"><i class="ph ph-chart-line-up"></i></div>
        <div>
          <h5>Average Transaction Size: ${formatCurrency(avgInvoiceSize)}</h5>
          <p>Your average invoice size is ${formatCurrency(avgInvoiceSize)} across ${billCount} tickets. To optimize margins, analyze the profitability of small tickets compared to operations overhead.</p>
        </div>
      </div>
    `;

    recList.innerHTML = recItemsHtml;
    aiAnalyzedBefore = true;

    // Send brief notification message in AI Chat
    addChatMessage('assistant', `I have successfully analyzed your ledger! Your business health index is **${score}%**. You can ask me questions about this analysis below.`);
  }, 1200);
}

// AI Chatbot Logic
function addChatMessage(sender, text) {
  const chatLogs = document.getElementById('ai-chat-logs');
  if (!chatLogs) return;

  const div = document.createElement('div');
  div.className = `chat-message ${sender}`;
  const parsedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  div.innerHTML = `<p>${parsedText}</p>`;
  
  chatLogs.appendChild(div);
  chatLogs.scrollTop = chatLogs.scrollHeight;
}

function submitChatMessage(event) {
  event.preventDefault();
  const input = document.getElementById('ai-chat-input');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;

  addChatMessage('user', text);
  input.value = '';

  // Show typing bubble
  const chatLogs = document.getElementById('ai-chat-logs');
  const typingDiv = document.createElement('div');
  typingDiv.className = 'chat-message assistant typing-indicator';
  typingDiv.innerHTML = '<p><span class="spinner" style="width:12px; height:12px; border-width:1px; display:inline-block; margin-right:4px;"></span> Thinking...</p>';
  chatLogs.appendChild(typingDiv);
  chatLogs.scrollTop = chatLogs.scrollHeight;

  // Process AI reply after delay
  setTimeout(() => {
    typingDiv.remove();
    const reply = generateAIChatReply(text);
    addChatMessage('assistant', reply);
  }, 750);
}

// Clicking chips triggers message
function sendQuickMessage(text) {
  addChatMessage('user', text);
  
  const chatLogs = document.getElementById('ai-chat-logs');
  const typingDiv = document.createElement('div');
  typingDiv.className = 'chat-message assistant typing-indicator';
  typingDiv.innerHTML = '<p><span class="spinner" style="width:12px; height:12px; border-width:1px; display:inline-block; margin-right:4px;"></span> Thinking...</p>';
  chatLogs.appendChild(typingDiv);
  chatLogs.scrollTop = chatLogs.scrollHeight;

  setTimeout(() => {
    typingDiv.remove();
    const reply = generateAIChatReply(text);
    addChatMessage('assistant', reply);
  }, 700);
}

// Basic simulated AI parsing engine running on live IndexedDB records
function generateAIChatReply(query) {
  const text = query.toLowerCase();
  
  if (allBills.length === 0) {
    return "Your database has no bills recorded. Please add some invoices under the **Bills** tab first so I can analyze your metrics!";
  }

  const totalRev = allBills.reduce((sum, b) => sum + b.totalAmount, 0);
  const totalGst = allBills.reduce((sum, b) => sum + b.totalGst, 0);
  const billCount = allBills.length;
  const clientCount = allClients.length;

  // Group client revenues
  const clientRevenue = {};
  allBills.forEach(b => {
    clientRevenue[b.clientId] = (clientRevenue[b.clientId] || 0) + b.totalAmount;
  });
  
  let maxClientRev = 0;
  let topClientId = null;
  for (const cid in clientRevenue) {
    if (clientRevenue[cid] > maxClientRev) {
      maxClientRev = clientRevenue[cid];
      topClientId = Number(cid);
    }
  }
  const topClient = allClients.find(c => c.id === topClientId);
  const topClientName = topClient ? (topClient.companyName || topClient.name) : 'N/A';
  const topClientContact = topClient ? topClient.name : 'N/A';
  const concentrationRatio = totalRev > 0 ? (maxClientRev / totalRev) * 100 : 0;

  // 1. Top Client Query
  if (text.includes('top client') || text.includes('biggest client') || text.includes('top client analysis') || text.includes('highest contributor')) {
    return `Your top client is **${topClientName}** (Contact: ${topClientContact}). Lifetime billing for this client is **${formatCurrency(maxClientRev)}**, which represents **${concentrationRatio.toFixed(1)}%** of your total sales.`;
  }

  // 2. GST Query
  if (text.includes('gst') || text.includes('tax') || text.includes('vat')) {
    const withGstCount = allBills.filter(b => b.billType === 'with-gst').length;
    return `You have generated **${withGstCount}** bills under the GST scheme. Total GST collected to date is **${formatCurrency(totalGst)}** on a base revenue of **${formatCurrency(totalRev - totalGst)}**. I suggest holding at least **${formatCurrency(totalGst)}** as liquid reserves for upcoming quarterly tax payouts.`;
  }

  // 3. Client Concentration Risk Query
  if (text.includes('concentration') || text.includes('risk') || text.includes('diversify')) {
    if (concentrationRatio > 40) {
      return `Yes, you have a **High Client Concentration Risk**. Your largest account (**${topClientName}**) represents **${concentrationRatio.toFixed(1)}%** of total revenue. If they churn, your business cashflow will drop significantly. I recommend acquiring new clients to drop this ratio below 35%.`;
    } else {
      return `Your client concentration is **healthy**. Your largest client represents **${concentrationRatio.toFixed(1)}%** of total business. Having no single client represent more than 40% means your sales are diversified safely.`;
    }
  }

  // 4. Sales Forecast Query
  if (text.includes('forecast') || text.includes('predict') || text.includes('future') || text.includes('next month')) {
    const monthlyAverages = totalRev / Math.max(1, (new Set(allBills.map(b => b.date.substring(0, 7))).size));
    const projectedMin = monthlyAverages * 0.85;
    const projectedMax = monthlyAverages * 1.15;
    return `Based on your monthly transaction volume, I project next month's sales to reach **${formatCurrency(monthlyAverages)}** (expected range: **${formatCurrency(projectedMin)}** to **${formatCurrency(projectedMax)}** with 90% confidence). *Tip: Increasing recurring invoice services can tighten this variance range.*`;
  }

  // 5. Cash Flow Review
  if (text.includes('cash flow') || text.includes('review') || text.includes('financial review')) {
    const avgInvoice = totalRev / billCount;
    return `**Cash Flow Summary:**\n\n• **Total Invoiced:** ${formatCurrency(totalRev)}\n• **Tax Liabilities (GST):** ${formatCurrency(totalGst)}\n• **Average Ticket Size:** ${formatCurrency(avgInvoice)}\n• **Clients Registered:** ${clientCount}\n\nYour operational liquidity indicators are stable. We recommend automating invoices to decrease collection intervals.`;
  }

  // 6. Suggestion Query
  if (text.includes('suggestion') || text.includes('improve') || text.includes('advice') || text.includes('recommendation')) {
    let advice = `Based on your records, here are 2 AI suggestions to improve Varahi Export's cashflows:\n\n`;
    if (concentrationRatio > 40) {
      advice += `1. **Diversification:** Dilute client concentration risk by targeting new contracts. Currently, **${topClientName}** holds too much leverage (${concentrationRatio.toFixed(1)}%).\n`;
    } else {
      advice += `1. **Upsell Core Accounts:** Your account diversity is safe. Try pitching volume discount deals to **${topClientName}** to increase revenue.\n`;
    }
    advice += `2. **Liquidity Reserve:** Keep a strict tax margin of **${formatCurrency(totalGst)}** reserved for tax filings.`;
    return advice;
  }

  // Default response
  return `I can help you review your accounting database! Try asking:
  \n• *"Who is my top client by sales?"*
  \n• *"How much GST did I collect?"*
  \n• *"Do I have client concentration risk?"*
  \n• *"Forecast next month's sales."*
  \n• *"Provide a complete cash flow review."*`;
}

/**
 * ==========================================
 * CEO PERFORMANCE & WORK ACTIVITY LOGS
 * ==========================================
 */
function renderCeoLog() {
  const tbody = document.getElementById('ceo-activities-table-body');
  const totalHoursSpan = document.getElementById('ceo-total-hours');
  const criticalCountSpan = document.getElementById('ceo-critical-count');

  if (!tbody) return;

  tbody.innerHTML = '';

  if (allCeoActivities.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No activity logs recorded. Let the CEO log daily workflows.</td></tr>`;
    totalHoursSpan.textContent = '0 hrs';
    criticalCountSpan.textContent = '0';
    updateCeoFocusChart({});
    document.getElementById('ceo-behavioral-report').textContent = 'No logs registered yet. Submit daily actions to analyze focus patterns.';
    return;
  }

  // Sort activities by date descending
  const sortedActivities = [...allCeoActivities].sort((a, b) => new Date(b.date) - new Date(a.date));

  let totalHours = 0;
  let criticalCount = 0;
  const focusTime = {
    Strategy: 0,
    Sales: 0,
    Finance: 0,
    Operations: 0,
    Production: 0
  };

  sortedActivities.forEach(act => {
    totalHours += act.hoursSpent;
    if (act.isCritical) criticalCount++;
    
    // Sum by focus area
    if (focusTime.hasOwnProperty(act.focusArea)) {
      focusTime[act.focusArea] += act.hoursSpent;
    }

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${formatDate(act.date)}</td>
      <td><span class="badge badge-gst" style="background-color:var(--color-accent-light); color:var(--color-primary);">${act.focusArea}</span></td>
      <td style="cursor:pointer; color:var(--color-primary); font-weight:500;" onclick="viewCeoActivity(${act.id})" title="Click to view details">${truncateText(act.description, 35)}</td>
      <td class="text-right font-medium">${act.hoursSpent} hrs</td>
      <td>
        <span class="badge ${act.productivityLevel === 'High' ? 'badge-gst' : (act.productivityLevel === 'Medium' ? 'badge-nogst' : 'badge-nogst')}" 
              style="${act.productivityLevel === 'High' ? 'background-color:rgba(16,185,129,0.08); color:var(--color-success); border-color:rgba(16,185,129,0.2);' : ''}">
          ${act.productivityLevel}
        </span>
      </td>
      <td>
        ${act.isCritical ? '<span class="badge" style="background-color:rgba(239,68,68,0.08); color:var(--color-destructive); border:1px solid rgba(239,68,68,0.2);">Critical</span>' : '<span class="text-muted" style="font-size:11px;">Regular</span>'}
      </td>
      <td class="text-center">
        <div style="display: flex; justify-content: center; align-items: center; gap: 6px;">
          <button class="btn btn-secondary btn-sm btn-icon" onclick="viewCeoActivity(${act.id})" title="View details">
            <i class="ph ph-eye"></i>
          </button>
          <button class="btn btn-secondary btn-sm btn-icon" onclick="editCeoActivity(${act.id})" title="Edit entry">
            <i class="ph ph-pencil"></i>
          </button>
          <button class="btn btn-secondary btn-sm btn-icon text-red" onclick="deleteCeoActivity(${act.id})" title="Delete entry">
            <i class="ph ph-trash"></i>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Update KPIs
  totalHoursSpan.textContent = `${totalHours.toFixed(1)} hrs`;
  criticalCountSpan.textContent = criticalCount;

  // Render focus distribution chart
  updateCeoFocusChart(focusTime);

  // Generate Owner Behavioral report
  generateCeoBehaviorReport(totalHours, criticalCount, focusTime);
}

function openCeoActivityModal(id = null) {
  document.getElementById('ceo-activity-form').reset();
  
  if (id) {
    // Edit mode
    editingCeoActivityId = id;
    const act = allCeoActivities.find(a => a.id === id);
    if (!act) return;

    document.getElementById('ceo-act-date').value = act.date;
    document.getElementById('ceo-act-hours').value = act.hoursSpent;
    document.getElementById('ceo-act-desc').value = act.description;
    document.getElementById('ceo-act-critical').checked = act.isCritical;
    
    // Select the focus card programmatically
    const cards = document.querySelectorAll('.focus-card');
    cards.forEach(card => {
      if (card.getAttribute('onclick').includes(act.focusArea)) {
        selectCeoFocus(act.focusArea, card);
      }
    });
    document.getElementById('ceo-act-focus').value = act.focusArea;

    // Select the emoji card programmatically
    const emojis = document.querySelectorAll('.emoji-option');
    emojis.forEach(opt => {
      if (opt.getAttribute('onclick').includes(act.productivityLevel)) {
        selectCeoProductivity(act.productivityLevel, opt);
      }
    });
    document.getElementById('ceo-act-productivity').value = act.productivityLevel;

    // Update texts
    document.querySelector('#ceo-activity-modal h3').textContent = 'Edit CEO Daily Activity';
    document.querySelector('#ceo-activity-form button[type="submit"]').textContent = 'Update Log Entry 🚀';
  } else {
    // Add mode
    editingCeoActivityId = null;
    document.getElementById('ceo-act-date').value = new Date().toISOString().split('T')[0];
    
    // Reset focus cards to default (Strategy active)
    document.querySelectorAll('.focus-card').forEach((card, idx) => {
      if (idx === 0) {
        card.style.border = '2px solid var(--color-primary)';
        card.style.backgroundColor = 'var(--color-accent-light)';
      } else {
        card.style.border = '1px solid var(--color-border)';
        card.style.backgroundColor = 'var(--color-surface)';
      }
    });
    document.getElementById('ceo-act-focus').value = 'Strategy';

    // Reset emoji options to default (High active)
    document.querySelectorAll('.emoji-option').forEach((opt, idx) => {
      if (idx === 0) {
        opt.style.borderColor = 'var(--color-primary)';
        opt.style.backgroundColor = 'var(--color-surface)';
        opt.querySelector('span:last-child').style.color = 'var(--color-success)';
        opt.querySelector('span:last-child').style.fontWeight = '700';
      } else {
        opt.style.borderColor = 'transparent';
        opt.style.backgroundColor = 'transparent';
        opt.querySelector('span:last-child').style.color = 'var(--color-text-secondary)';
        opt.querySelector('span:last-child').style.fontWeight = '600';
      }
    });
    document.getElementById('ceo-act-productivity').value = 'High';

    document.getElementById('ceo-act-hours').value = '8.0';
    document.getElementById('ceo-act-critical').checked = false;

    // Update texts
    document.querySelector('#ceo-activity-modal h3').textContent = 'Log Daily CEO Activity';
    document.querySelector('#ceo-activity-form button[type="submit"]').textContent = 'Log Entry 🚀';
  }

  document.getElementById('ceo-activity-modal').classList.add('active');
}

function closeCeoActivityModal() {
  document.getElementById('ceo-activity-modal').classList.remove('active');
}

async function saveCeoActivity(event) {
  event.preventDefault();

  const date = document.getElementById('ceo-act-date').value;
  const focusArea = document.getElementById('ceo-act-focus').value;
  const hoursSpent = Number(document.getElementById('ceo-act-hours').value) || 0;
  const productivityLevel = document.getElementById('ceo-act-productivity').value;
  const description = document.getElementById('ceo-act-desc').value.trim();
  const isCritical = document.getElementById('ceo-act-critical').checked;

  try {
    if (editingCeoActivityId) {
      const originalAct = allCeoActivities.find(a => a.id === editingCeoActivityId);
      if (originalAct) {
        originalAct.date = date;
        originalAct.focusArea = focusArea;
        originalAct.hoursSpent = hoursSpent;
        originalAct.productivityLevel = productivityLevel;
        originalAct.description = description;
        originalAct.isCritical = isCritical;
        
        await window.db.ceoActivities.update(originalAct);
      }
    } else {
      const actData = { date, focusArea, hoursSpent, productivityLevel, description, isCritical };
      await window.db.ceoActivities.add(actData);
    }
    
    closeCeoActivityModal();
    await refreshData();
    renderCeoLog();
  } catch (error) {
    alert('Error saving activity: ' + error.message);
  }
}

async function deleteCeoActivity(id) {
  if (confirm('Delete this CEO activity log entry?')) {
    await window.db.ceoActivities.delete(id);
    await refreshData();
    renderCeoLog();
  }
}

// Chart.js renderer for CEO Focus Areas
function updateCeoFocusChart(focusData) {
  const ctx = document.getElementById('ceoFocusChart');
  if (!ctx) return;

  if (ceoFocusChart) {
    ceoFocusChart.destroy();
  }

  const labels = ['Strategy', 'Sales', 'Finance', 'Operations', 'Production'];
  const values = labels.map(l => focusData[l] || 0);

  // Check if there is any data logged
  const total = values.reduce((s, v) => s + v, 0);
  const chartData = total > 0 ? values : [1, 1, 1, 1, 1];
  const colors = total > 0 
    ? ['#7C3AED', '#4F46E5', '#10B981', '#F59E0B', '#EF4444'] 
    : ['#E5E7EB', '#E5E7EB', '#E5E7EB', '#E5E7EB', '#E5E7EB'];

  ceoFocusChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels.map(l => `${l} (hrs)`),
      datasets: [{
        data: chartData,
        backgroundColor: colors,
        borderWidth: 1,
        borderColor: '#FFFFFF'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: '#4B5563',
            font: { family: 'Inter', size: 10 }
          }
        }
      }
    }
  });
}

// Client-side AI behavioral parser
function generateCeoBehaviorReport(totalHours, criticalCount, focusTime) {
  const reportBox = document.getElementById('ceo-behavioral-report');
  if (!reportBox) return;

  if (totalHours === 0) {
    reportBox.textContent = 'No logs registered yet. Submit daily actions to analyze focus patterns.';
    return;
  }

  // Calculate percentages
  const percentages = {};
  for (const area in focusTime) {
    percentages[area] = (focusTime[area] / totalHours) * 100;
  }

  // Calculate high productivity percentage
  const highProdLogs = allCeoActivities.filter(a => a.productivityLevel === 'High');
  const highProdHours = highProdLogs.reduce((sum, a) => sum + a.hoursSpent, 0);
  const highProdRatio = (highProdHours / totalHours) * 100;

  let reportText = `**CEO Work Audit Report (for Owner Vikassy):**\n\n`;
  reportText += `The CEO logged **${totalHours.toFixed(1)} hours** across **${allCeoActivities.length} logs**. `;

  // Behavioral Assessment
  if (percentages.Strategy < 15) {
    reportText += `⚠️ **Strategy Deficit:** The CEO spent only **${percentages.Strategy.toFixed(1)}%** on planning. An executive should spend >20% here to guide Varahi Export's market direction. `;
  } else {
    reportText += `✓ **Healthy Strategy Focus:** **${percentages.Strategy.toFixed(1)}%** time was spent on forward planning. `;
  }

  if (percentages.Operations > 40) {
    reportText += `⚠️ **Micro-management Warning:** **${percentages.Operations.toFixed(1)}%** of logged time is tied to daily Operations. The CEO is bogged down in helpers coordination. Advise delegation. `;
  }

  if (percentages.Sales > 25) {
    reportText += `🔥 **Revenue Driver:** Excellent focus on Sales & Client Acquisition (**${percentages.Sales.toFixed(1)}%**), directly aiding export contracts. `;
  } else if (percentages.Sales < 10) {
    reportText += `⚠️ **Sales Pipeline Risk:** Client acquisition is neglected (**${percentages.Sales.toFixed(1)}%**). CEO must prioritize client outreach. `;
  }

  if (highProdRatio > 70) {
    reportText += `\n\n**Efficiency Profile:** High Focus Ratio is outstanding (**${highProdRatio.toFixed(0)}%**), demonstrating peak operational alignment.`;
  } else if (highProdRatio < 40) {
    reportText += `\n\n**Efficiency Profile:** High Focus Ratio is low (**${highProdRatio.toFixed(0)}%**). CEO reports significant routine/distracted blocks. Review meeting schedules or tails bottlenecks to optimize.`;
  } else {
    reportText += `\n\n**Efficiency Profile:** Steady focus rating (**${highProdRatio.toFixed(0)}%** High Efficiency).`;
  }

  if (criticalCount > 0) {
    reportText += ` CEO registered **${criticalCount} critical accomplishments** this cycle.`;
  }

  // Parse markdown bold text
  reportBox.innerHTML = reportText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

async function toggleBillStatus(id) {
  const bill = allBills.find(b => b.id === id);
  if (!bill) return;

  bill.paymentStatus = (bill.paymentStatus === 'Paid') ? 'Pending' : 'Paid';
  try {
    await window.db.bills.update(bill);
    await refreshData();
    renderBills();
    updateDashboard();
  } catch (error) {
    alert('Error toggling payment status: ' + error.message);
  }
}

/**
 * ==========================================
 * MOBILE MORE MENU SYSTEM
 * ==========================================
 */
function openMoreMenu() {
  document.getElementById('mobile-more-modal').classList.add('active');
}

function closeMoreMenu() {
  document.getElementById('mobile-more-modal').classList.remove('active');
}

function triggerMobileTab(tabId) {
  closeMoreMenu();
  const target = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
  if (target) {
    target.click();
    
    // Visually highlight the 'More' button to show we are inside a sub-option
    document.querySelectorAll('.sidebar .nav-item').forEach(el => el.classList.remove('active'));
    const moreBtn = document.querySelector('.mobile-only-nav');
    if (moreBtn) moreBtn.classList.add('active');
  }
}

// Interactive CEO form helpers
function selectCeoFocus(focusArea, element) {
  document.getElementById('ceo-act-focus').value = focusArea;
  // Reset all focus cards styling
  document.querySelectorAll('.focus-card').forEach(card => {
    card.style.border = '1px solid var(--color-border)';
    card.style.backgroundColor = 'var(--color-surface)';
  });
  // Highlight active
  element.style.border = '2px solid var(--color-primary)';
  element.style.backgroundColor = 'var(--color-accent-light)';
}

function adjustCeoHours(delta) {
  const input = document.getElementById('ceo-act-hours');
  let val = parseFloat(input.value) || 0;
  val = Math.max(0.5, Math.min(24, val + delta));
  input.value = val.toFixed(1);
}

function setCeoHours(hours) {
  document.getElementById('ceo-act-hours').value = hours.toFixed(1);
}

function selectCeoProductivity(level, element) {
  document.getElementById('ceo-act-productivity').value = level;
  // Reset all emoji options
  document.querySelectorAll('.emoji-option').forEach(opt => {
    opt.style.borderColor = 'transparent';
    opt.style.backgroundColor = 'transparent';
    opt.querySelector('span:last-child').style.color = 'var(--color-text-secondary)';
    opt.querySelector('span:last-child').style.fontWeight = '600';
  });
  // Highlight active
  element.style.borderColor = 'var(--color-primary)';
  element.style.backgroundColor = 'var(--color-surface)';
  const label = element.querySelector('span:last-child');
  label.style.fontWeight = '700';
  if (level === 'High') {
    label.style.color = 'var(--color-success)';
  } else {
    label.style.color = 'var(--color-primary)';
  }
}

// CEO Details Drawer Helpers
function viewCeoActivity(id) {
  const act = allCeoActivities.find(a => a.id === id);
  if (!act) return;

  document.getElementById('ceo-detail-date').textContent = formatDate(act.date);
  document.getElementById('ceo-detail-focus').textContent = act.focusArea;
  document.getElementById('ceo-detail-hours').textContent = `${act.hoursSpent} hrs`;
  
  // Set productivity rating text with emoji
  const prodSpan = document.getElementById('ceo-detail-productivity');
  if (act.productivityLevel === 'High') {
    prodSpan.innerHTML = '<span class="badge" style="background-color:rgba(16,185,129,0.08); color:var(--color-success); border:1px solid rgba(16,185,129,0.2);">😄 Peak Focus</span>';
  } else if (act.productivityLevel === 'Medium') {
    prodSpan.innerHTML = '<span class="badge" style="background-color:rgba(59,130,246,0.08); color:var(--color-primary); border:1px solid rgba(59,130,246,0.2);">🙂 Steady</span>';
  } else {
    prodSpan.innerHTML = '<span class="badge" style="background-color:rgba(245,158,11,0.08); color:#D97706; border:1px solid rgba(245,158,11,0.2);">🥱 Distracted</span>';
  }

  // Type highlight
  const typeSpan = document.getElementById('ceo-detail-type');
  typeSpan.innerHTML = act.isCritical 
    ? '<span class="badge" style="background-color:rgba(239,68,68,0.08); color:var(--color-destructive); border:1px solid rgba(239,68,68,0.2); font-weight:700;">Critical Accomplishment ⭐</span>' 
    : '<span class="text-muted" style="font-size:13px;">Regular Work Activity</span>';

  // Description
  document.getElementById('ceo-detail-desc').textContent = act.description;

  // Bind the edit button click handler
  const editBtn = document.getElementById('ceo-detail-edit-btn');
  editBtn.onclick = () => {
    closeCeoDetailsModal();
    editCeoActivity(act.id);
  };

  document.getElementById('ceo-details-modal').classList.add('active');
}

function closeCeoDetailsModal() {
  document.getElementById('ceo-details-modal').classList.remove('active');
}

function editCeoActivity(id) {
  openCeoActivityModal(id);
}

// Progressive Web App (PWA) Custom Install Trigger
let pwaDeferredPrompt = null;

window.addEventListener('beforeinstallprompt', (event) => {
  // Prevent Chrome from automatically showing the prompt
  event.preventDefault();
  // Stash the event so it can be triggered later.
  pwaDeferredPrompt = event;
});

function triggerPwaInstall() {
  if (!pwaDeferredPrompt) {
    alert("📱 PWA Installation Guide:\n\n🍎 iOS / Safari:\n1. Tap the Share button in Safari (box with up arrow).\n2. Scroll down and select 'Add to Home Screen'.\n\n🤖 Android / Chrome / HTTP:\n1. PWA installation requires a secure HTTPS connection (e.g. once deployed on GitHub Pages) or 'localhost'.\n2. If accessing via your local network IP (http://192.168.x.x), browsers block installation due to security policies.");
    return;
  }
  
  // Close the More Options modal first
  closeMoreMenu();
  
  // Show the browser's install prompt
  pwaDeferredPrompt.prompt();
  
  // Wait for the user to respond to the prompt
  pwaDeferredPrompt.userChoice.then((choiceResult) => {
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the PWA install prompt');
    } else {
      console.log('User dismissed the PWA install prompt');
    }
    pwaDeferredPrompt = null;
  });
}
