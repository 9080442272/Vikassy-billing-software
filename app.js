/**
 * Core Application Logic for Varahi Export Accounting Software
 */

// Global State
let allClients = [];
let allBills = [];
let incomeChart = null;
let gstChart = null;

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
    updateDashboard();
    
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
  populateClientsDropdowns();
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
      <td>
        <span class="badge ${bill.billType === 'with-gst' ? 'badge-gst' : 'badge-nogst'}">
          ${bill.billType === 'with-gst' ? 'With GST' : 'No GST'}
        </span>
      </td>
      <td>${formatCurrency(bill.totalGst)}</td>
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
          backgroundColor: '#8B5CF6', // Accent color
          borderColor: '#8B5CF6',
          borderRadius: 6,
          stack: 'combined'
        },
        {
          label: 'GST Collected (₹)',
          data: gstData,
          backgroundColor: '#F59E0B', // Primary Gold
          borderColor: '#F59E0B',
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
            color: '#94A3B8',
            font: { family: 'Inter', size: 12 }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: '#94A3B8' },
          grid: { color: 'rgba(255,255,255,0.05)' }
        },
        y: {
          ticks: { color: '#94A3B8' },
          grid: { color: 'rgba(255,255,255,0.05)' }
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
  const colors = hasData ? ['#F59E0B', '#272F42'] : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)'];

  gstChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: chartLabels,
      datasets: [{
        data: chartData,
        backgroundColor: colors,
        borderWidth: 1,
        borderColor: '#131A2E'
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
            color: '#94A3B8',
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
      <td>${client.companyName || '<span class="text-muted">N/A</span>'}</td>
      <td>
        <div>${client.email || ''}</div>
        <div class="text-muted small">${client.phone || ''}</div>
      </td>
      <td><code class="text-gold font-medium">${client.gstin || '<span class="text-muted">Unregistered</span>'}</code></td>
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
    tbody.innerHTML = `<tr><td colspan="9" class="text-center text-muted">No invoices found. Add a client and upload a bill to begin.</td></tr>`;
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

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="font-medium">${bill.billNumber}</td>
      <td>${clientName}</td>
      <td>${formatDate(bill.date)}</td>
      <td>
        <span class="badge ${bill.billType === 'with-gst' ? 'badge-gst' : 'badge-nogst'}">
          ${bill.billType === 'with-gst' ? 'With GST' : 'No GST'}
        </span>
      </td>
      <td>${formatCurrency(bill.subtotal)}</td>
      <td>${formatCurrency(bill.totalGst)}</td>
      <td class="font-medium">${formatCurrency(bill.totalAmount)}</td>
      <td>${attachmentBadge}</td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="viewInvoice(${bill.id})">
          <i class="ph ph-eye"></i> Invoice
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
  document.getElementById('bill-items-tbody').innerHTML = '';
  document.getElementById('bill-discount').value = 0;
  
  // Set Date input default to today
  document.getElementById('bill-date').value = new Date().toISOString().split('T')[0];

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
    // Fill from scan
    document.getElementById('bill-number').value = prefilledData.billNumber || '';
    document.getElementById('bill-date').value = prefilledData.date || new Date().toISOString().split('T')[0];
    taxToggle.checked = prefilledData.billType === 'with-gst';
    toggleTaxLayout();

    // Populate prefilled items
    if (prefilledData.items && prefilledData.items.length > 0) {
      prefilledData.items.forEach(item => {
        addInvoiceLineItem(item.name, item.price, item.qty, item.gstRate);
      });
    }

    // Set file attachment
    if (uploadedFileData) {
      document.getElementById('bill-attachment-container').classList.remove('hidden');
      document.getElementById('bill-attachment-img').src = uploadedFileData;
      document.getElementById('bill-attachment-name').textContent = truncateText(uploadedFileName, 20);
    }
  } else {
    // Start with 1 empty row
    addInvoiceLineItem();
  }

  calculateBillTotals();
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
  const gstCols = document.querySelectorAll('.gst-col');
  
  gstCols.forEach(col => {
    if (isGstEnabled) {
      col.classList.remove('hidden');
    } else {
      col.classList.add('hidden');
    }
  });

  // Also toggle items columns hidden classes in rows
  const tbody = document.getElementById('bill-items-tbody');
  const rows = tbody.querySelectorAll('tr');
  rows.forEach(row => {
    const rowGstRate = row.querySelector('.row-gst-rate-td');
    const rowGstAmt = row.querySelector('.row-gst-amt-td');
    if (rowGstRate && rowGstAmt) {
      if (isGstEnabled) {
        rowGstRate.classList.remove('hidden');
        rowGstAmt.classList.remove('hidden');
      } else {
        rowGstRate.classList.add('hidden');
        rowGstAmt.classList.add('hidden');
      }
    }
  });

  calculateBillTotals();
}

function addInvoiceLineItem(name = '', price = 0, qty = 1, gstRate = 18) {
  const tbody = document.getElementById('bill-items-tbody');
  const isGstEnabled = document.getElementById('bill-tax-type').checked;
  const rowId = 'row-' + Date.now() + '-' + Math.floor(Math.random()*1000);

  const tr = document.createElement('tr');
  tr.id = rowId;
  tr.innerHTML = `
    <td>
      <input type="text" class="item-name" required placeholder="Item description" value="${name}">
    </td>
    <td>
      <input type="number" class="item-price" min="0" step="any" required placeholder="0.00" value="${price > 0 ? price : ''}" oninput="calculateRowTotal('${rowId}')">
    </td>
    <td>
      <input type="number" class="item-qty" min="1" required placeholder="1" value="${qty}" oninput="calculateRowTotal('${rowId}')">
    </td>
    <td class="row-gst-rate-td ${isGstEnabled ? '' : 'hidden'}">
      <select class="item-gst-rate" onchange="calculateRowTotal('${rowId}')">
        <option value="0" ${gstRate === 0 ? 'selected' : ''}>0%</option>
        <option value="5" ${gstRate === 5 ? 'selected' : ''}>5%</option>
        <option value="12" ${gstRate === 12 ? 'selected' : ''}>12%</option>
        <option value="18" ${gstRate === 18 ? 'selected' : ''}>18%</option>
        <option value="28" ${gstRate === 28 ? 'selected' : ''}>28%</option>
      </select>
    </td>
    <td class="row-gst-amt-td ${isGstEnabled ? '' : 'hidden'}">
      <span class="row-gst-amt">₹0.00</span>
    </td>
    <td>
      <span class="row-total font-medium">₹0.00</span>
    </td>
    <td>
      <button type="button" class="btn-icon text-red" onclick="deleteInvoiceLineItem('${rowId}')"><i class="ph ph-trash"></i></button>
    </td>
  `;

  tbody.appendChild(tr);
  calculateRowTotal(rowId);
}

function deleteInvoiceLineItem(rowId) {
  const row = document.getElementById(rowId);
  if (row) {
    row.remove();
    calculateBillTotals();
  }
}

function calculateRowTotal(rowId) {
  const row = document.getElementById(rowId);
  if (!row) return;

  const price = Number(row.querySelector('.item-price').value) || 0;
  const qty = Number(row.querySelector('.item-qty').value) || 0;
  const isGstEnabled = document.getElementById('bill-tax-type').checked;
  const gstRate = isGstEnabled ? (Number(row.querySelector('.item-gst-rate').value) || 0) : 0;

  const subtotal = price * qty;
  const gstAmt = subtotal * (gstRate / 100);
  const total = subtotal + gstAmt;

  row.querySelector('.row-gst-amt').textContent = formatCurrency(gstAmt);
  row.querySelector('.row-total').textContent = formatCurrency(total);

  calculateBillTotals();
}

function calculateBillTotals() {
  const tbody = document.getElementById('bill-items-tbody');
  const rows = tbody.querySelectorAll('tr');
  const isGstEnabled = document.getElementById('bill-tax-type').checked;

  let subtotalSum = 0;
  let gstSum = 0;

  rows.forEach(row => {
    const price = Number(row.querySelector('.item-price').value) || 0;
    const qty = Number(row.querySelector('.item-qty').value) || 0;
    const gstRate = isGstEnabled ? (Number(row.querySelector('.item-gst-rate').value) || 0) : 0;

    const rowSubtotal = price * qty;
    const rowGst = rowSubtotal * (gstRate / 100);

    subtotalSum += rowSubtotal;
    gstSum += rowGst;
  });

  const discount = Number(document.getElementById('bill-discount').value) || 0;
  const grandTotal = Math.max(0, (subtotalSum + gstSum) - discount);

  document.getElementById('summary-subtotal').textContent = formatCurrency(subtotalSum);
  
  const gstRow = document.querySelector('.summary-row.gst-row');
  if (isGstEnabled) {
    gstRow.classList.remove('hidden');
    document.getElementById('summary-gst').textContent = formatCurrency(gstSum);
  } else {
    gstRow.classList.add('hidden');
    gstSum = 0; // enforce zero tax
  }

  document.getElementById('summary-total').textContent = formatCurrency(grandTotal);
}

async function saveBill(event) {
  event.preventDefault();

  const clientId = document.getElementById('bill-client').value;
  const billNumber = document.getElementById('bill-number').value.trim();
  const date = document.getElementById('bill-date').value;
  const isGstEnabled = document.getElementById('bill-tax-type').checked;
  const discount = Number(document.getElementById('bill-discount').value) || 0;

  if (!clientId) {
    alert('Please select or register a client first.');
    return;
  }

  const tbody = document.getElementById('bill-items-tbody');
  const rows = tbody.querySelectorAll('tr');
  if (rows.length === 0) {
    alert('Please add at least one line item.');
    return;
  }

  // Compile line items
  const items = [];
  let subtotalSum = 0;
  let gstSum = 0;

  for (const row of rows) {
    const name = row.querySelector('.item-name').value.trim();
    const price = Number(row.querySelector('.item-price').value) || 0;
    const qty = Number(row.querySelector('.item-qty').value) || 0;
    const gstRate = isGstEnabled ? (Number(row.querySelector('.item-gst-rate').value) || 0) : 0;

    const itemSubtotal = price * qty;
    const itemGst = itemSubtotal * (gstRate / 100);
    const itemTotal = itemSubtotal + itemGst;

    items.push({
      name,
      price,
      qty,
      gstRate,
      gstAmount: itemGst,
      total: itemTotal
    });

    subtotalSum += itemSubtotal;
    gstSum += itemGst;
  }

  const grandTotal = Math.max(0, (subtotalSum + gstSum) - discount);

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
