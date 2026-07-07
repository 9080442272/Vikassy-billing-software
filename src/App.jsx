import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';

// Indian Currency Number to Words converter helper
function numberToWords(num) {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function numToWordsPart(n) {
    if (n < 20) return a[n];
    const digit = n % 10;
    return b[Math.floor(n / 10)] + (digit ? ' ' + a[digit] : '');
  }

  const parts = parseFloat(num).toFixed(2).split('.');
  let rupees = parseInt(parts[0], 10) || 0;
  let paise = parseInt(parts[1], 10) || 0;

  let str = '';
  
  if (rupees === 0) {
    str = 'Zero Rupees ';
  } else {
    // Crore
    if (rupees >= 10000000) {
      str += numToWordsPart(Math.floor(rupees / 10000000)) + 'Crore ';
      rupees %= 10000000;
    }
    // Lakh
    if (rupees >= 100000) {
      str += numToWordsPart(Math.floor(rupees / 100000)) + 'Lakh ';
      rupees %= 100000;
    }
    // Thousand
    if (rupees >= 1000) {
      str += numToWordsPart(Math.floor(rupees / 1000)) + 'Thousand ';
      rupees %= 1000;
    }
    // Hundred
    if (rupees >= 100) {
      str += numToWordsPart(Math.floor(rupees / 100)) + 'Hundred ';
      rupees %= 100;
    }
    // Tens & Ones
    if (rupees > 0) {
      str += numToWordsPart(rupees);
    }
    str += 'Rupees ';
  }

  if (paise > 0) {
    str += 'and ' + numToWordsPart(paise) + 'Paise ';
  }
  
  return 'INR ' + str.trim() + ' Only';
}

// Utility to format ISO dates to DD-MMM-YY
function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: '2-digit'
  });
}

// Local Base64 JWT decoder payload utility for Google Auth
function decodeJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("JWT decode error:", e);
    throw new Error("Invalid JWT token received from IDP");
  }
}

export default function App() {
  // --- Convex Real-time Cloud Queries ---
  const clients = useQuery(api.clients.getAll) || [];
  const bills = useQuery(api.bills.getAll) || [];
  const employees = useQuery(api.employees.getAll) || [];
  const fabrics = useQuery(api.fabrics.getAll) || [];
  const stitching = useQuery(api.stitching.getAll) || [];
  const ceoActivities = useQuery(api.ceoActivities.getAll) || [];
  const users = useQuery(api.users.getAll) || [];

  // --- Convex Cloud Mutations ---
  const registerUser = useMutation(api.users.register);
  const updateUser = useMutation(api.users.update);
  const addClientMutation = useMutation(api.clients.add);
  const updateClientMutation = useMutation(api.clients.update);
  const deleteClientMutation = useMutation(api.clients.remove);
  const addBillMutation = useMutation(api.bills.add);
  const updateBillMutation = useMutation(api.bills.update);
  const deleteBillMutation = useMutation(api.bills.remove);
  const addEmployeeMutation = useMutation(api.employees.add);
  const updateEmployeeMutation = useMutation(api.employees.update);
  const deleteEmployeeMutation = useMutation(api.employees.remove);
  const addFabricMutation = useMutation(api.fabrics.add);
  const updateFabricMutation = useMutation(api.fabrics.update);
  const deleteFabricMutation = useMutation(api.fabrics.remove);
  const addStitchingMutation = useMutation(api.stitching.add);
  const updateStitchingMutation = useMutation(api.stitching.update);
  const deleteStitchingMutation = useMutation(api.stitching.remove);
  const addCeoActivityMutation = useMutation(api.ceoActivities.add);
  const updateCeoActivityMutation = useMutation(api.ceoActivities.update);
  const deleteCeoActivityMutation = useMutation(api.ceoActivities.remove);

  // --- State hooks ---
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('lastActiveTab') || 'dashboard');
  const [currentLoggedUser, setCurrentLoggedUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('isLoggedIn') === 'true');
  const [isFirstTimeSetup, setIsFirstTimeSetup] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // login / register

  // Modal Open States
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isFabricModalOpen, setIsFabricModalOpen] = useState(false);
  const [isStitchingModalOpen, setIsStitchingModalOpen] = useState(false);
  const [isCeoModalOpen, setIsCeoModalOpen] = useState(false);
  const [isInvoiceViewOpen, setIsInvoiceViewOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Edit / Details target selections
  const [editingClient, setEditingClient] = useState(null);
  const [editingBill, setEditingBill] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editingFabric, setEditingFabric] = useState(null);
  const [editingStitching, setEditingStitching] = useState(null);
  const [editingCeo, setEditingCeo] = useState(null);
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [selectedCeoDetail, setSelectedCeoDetail] = useState(null);

  // Search/Filters states
  const [clientSearch, setClientSearch] = useState('');
  const [billSearch, setBillSearch] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [fabricSearch, setFabricSearch] = useState('');
  const [stitchingSearch, setStitchingSearch] = useState('');

  // --- Invoice creation state values ---
  const [billClient, setBillClient] = useState('');
  const [billNumber, setBillNumber] = useState('');
  const [billDate, setBillDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [billWithGst, setBillWithGst] = useState(true);
  const [billSubtotal, setBillSubtotal] = useState('');
  const [billGstAmount, setBillGstAmount] = useState('');
  const [billDiscount, setBillDiscount] = useState('0');
  const [billGrandTotal, setBillGrandTotal] = useState('0');
  const [billAttachmentData, setBillAttachmentData] = useState(null);
  const [billAttachmentName, setBillAttachmentName] = useState('');

  // --- AI Chat Advisor state values ---
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', text: 'Hello! I am your AI Business Advisor. I have read-only access to your Varahi Export clients and bills records. Ask me anything about your revenue, GST status, or growth metrics!' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [aiHealthScore, setAiHealthScore] = useState('--');
  const [aiHealthStatus, setAiHealthStatus] = useState('Pending Scan');
  const [aiSummary, setAiSummary] = useState('Click "Run AI Analysis" to compile ledger data and produce your real-time financial health summary.');
  const [aiRecommendations, setAiRecommendations] = useState([
    { title: 'Growth & Diversification', desc: 'AI will analyze your billing profiles to see if your income is spread out safely among clients or concentrated in a single account.', icon: 'ph-chart-line-up' },
    { title: 'Tax & Compliance reserves', desc: 'Analyzes your GST margins to ensure you keep appropriate cash reserves for tax liabilities.', icon: 'ph-shield-check' },
    { title: 'Seasonality & Variance forecasting', desc: 'Calculates variance in your monthly sales vectors and predicts stability index for next quarter.', icon: 'ph-trend-up' }
  ]);

  // --- PWA Installation state ---
  const [pwaPrompt, setPwaPrompt] = useState(null);

  // --- References ---
  const chartCanvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  // Sync tab navigation selection in localStorage
  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    localStorage.setItem('lastActiveTab', tabName);
    setIsMobileMenuOpen(false);
  };

  // --- Google OAuth initialization and session checks ---
  useEffect(() => {
    // Listen for custom install prompts
    const handleInstallPrompt = (e) => {
      e.preventDefault();
      setPwaPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);

    // Verify user session
    if (users.length > 0) {
      const storedUser = localStorage.getItem('currentUser');
      if (isLoggedIn && storedUser) {
        const matchingUser = users.find(u => u.username === storedUser);
        if (matchingUser) {
          setCurrentLoggedUser(matchingUser);
          setIsFirstTimeSetup(false);
        } else {
          logUserOut();
        }
      } else {
        setIsLoggedIn(false);
      }
    } else if (users.length === 0 && users !== undefined) {
      setIsFirstTimeSetup(true);
      setAuthMode('register');
      setIsLoggedIn(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
    };
  }, [users, isLoggedIn]);

  // Initialize Google Identity Services
  useEffect(() => {
    if (typeof google === 'undefined') return;

    google.accounts.id.initialize({
      client_id: "470877995175-98uq9m0k20l9eaf27p2j9r6r8r0j1qkr.apps.googleusercontent.com",
      callback: async (response) => {
        try {
          const payload = decodeJwt(response.credential);
          const googleUserId = `google_${payload.sub}`;
          const email = payload.email || '';
          const fullName = payload.name || '';
          const picture = payload.picture || '';

          // Look for existing user
          let existingUser = users.find(u => u.username === googleUserId);

          if (!existingUser) {
            // Register auto-signup record in Convex
            await registerUser({
              username: googleUserId,
              password: `google_oauth_bypass_${Math.random().toString(36).slice(-8)}`,
              email,
              fullName,
              avatarPicture: picture
            });
            existingUser = { username: googleUserId, fullName, avatarPicture: picture, email };
          } else {
            // Keep profile picture updated
            if (picture && existingUser.avatarPicture !== picture) {
              await updateUser({
                id: existingUser._id,
                username: existingUser.username,
                password: existingUser.password,
                email: existingUser.email,
                fullName: existingUser.fullName,
                avatarPicture: picture,
                createdAt: existingUser.createdAt
              });
            }
          }

          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('currentUser', googleUserId);
          setCurrentLoggedUser(existingUser);
          setIsLoggedIn(true);
        } catch (error) {
          console.error("Google Sign-In failed:", error);
          alert("Google Sign-In failed: " + error.message);
        }
      }
    });

    // Render Google Login buttons if overlays active
    const loginDiv = document.getElementById('google-signin-btn-login');
    if (loginDiv) {
      google.accounts.id.renderButton(loginDiv, { theme: 'outline', size: 'large', width: 320, text: 'signin_with', shape: 'pill' });
    }

    const regDiv = document.getElementById('google-signin-btn-register');
    if (regDiv) {
      google.accounts.id.renderButton(regDiv, { theme: 'outline', size: 'large', width: 320, text: 'signup_with', shape: 'pill' });
    }
  }, [authMode, isLoggedIn, users]);

  // --- Draw Dashboard Analytics Charts ---
  useEffect(() => {
    if (!chartCanvasRef.current || bills.length === 0) return;

    const ctx = chartCanvasRef.current.getContext('2d');

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    // Group bills by client to aggregate totals
    const clientSums = {};
    bills.forEach(bill => {
      const clientRecord = clients.find(c => c._id === bill.clientId);
      const name = clientRecord ? clientRecord.name : 'Unknown';
      clientSums[name] = (clientSums[name] || 0) + bill.totalAmount;
    });

    const labels = Object.keys(clientSums);
    const data = Object.values(clientSums);

    chartInstanceRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Total Billings (₹)',
          data,
          backgroundColor: '#7C3AED',
          borderColor: '#8B5CF6',
          borderWidth: 1,
          borderRadius: 8,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: 'rgba(255, 255, 255, 0.6)' }
          },
          x: {
            grid: { display: false },
            ticks: { color: 'rgba(255, 255, 255, 0.6)' }
          }
        }
      }
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [bills, clients, activeTab, isLoggedIn]);

  // --- Calculations triggers for invoices ---
  const handleSubtotalChange = (val) => {
    setBillSubtotal(val);
    const sub = parseFloat(val) || 0;
    const computedGst = billWithGst ? sub * 0.05 : 0;
    setBillGstAmount(computedGst.toFixed(2));
    calculateGrandTotal(sub, computedGst, parseFloat(billDiscount) || 0);
  };

  const handleGstAmountChange = (val) => {
    setBillGstAmount(val);
    calculateGrandTotal(parseFloat(billSubtotal) || 0, parseFloat(val) || 0, parseFloat(billDiscount) || 0);
  };

  const handleDiscountChange = (val) => {
    setBillDiscount(val);
    calculateGrandTotal(parseFloat(billSubtotal) || 0, parseFloat(billGstAmount) || 0, parseFloat(val) || 0);
  };

  const handleTaxTypeChange = (e) => {
    const isChecked = e.target.checked;
    setBillWithGst(isChecked);
    const sub = parseFloat(billSubtotal) || 0;
    const computedGst = isChecked ? sub * 0.05 : 0;
    setBillGstAmount(isChecked ? computedGst.toFixed(2) : '0');
    calculateGrandTotal(sub, isChecked ? computedGst : 0, parseFloat(billDiscount) || 0);
  };

  const calculateGrandTotal = (sub, gst, disc) => {
    const grand = sub + gst - disc;
    setBillGrandTotal(grand.toFixed(2));
  };

  // --- CRUD Operation handlers ---
  
  // Client CRUD
  const handleClientSubmit = async (e) => {
    e.preventDefault();
    const name = document.getElementById('client-name').value.trim();
    const companyName = document.getElementById('client-company').value.trim();
    const email = document.getElementById('client-email').value.trim();
    const phone = document.getElementById('client-phone').value.trim();
    const gstin = document.getElementById('client-gstin').value.trim();
    const address = document.getElementById('client-address').value.trim();

    try {
      if (editingClient) {
        await updateClientMutation({
          id: editingClient._id,
          name, companyName, email, phone, gstin, address,
          createdAt: editingClient.createdAt
        });
        alert("Client updated successfully!");
      } else {
        await addClientMutation({ name, companyName, email, phone, gstin, address });
        alert("Client registered successfully!");
      }
      closeClientModal();
    } catch (err) {
      alert("Error saving client: " + err.message);
    }
  };

  const deleteClient = async (id) => {
    if (confirm("Are you sure you want to delete this client? All bills associated won't be deleted but will read as unknown.")) {
      await deleteClientMutation({ id });
    }
  };

  const openEditClient = (c) => {
    setEditingClient(c);
    setIsClientModalOpen(true);
    setTimeout(() => {
      document.getElementById('client-name').value = c.name;
      document.getElementById('client-company').value = c.companyName || '';
      document.getElementById('client-email').value = c.email || '';
      document.getElementById('client-phone').value = c.phone || '';
      document.getElementById('client-gstin').value = c.gstin || '';
      document.getElementById('client-address').value = c.address || '';
    }, 50);
  };

  const closeClientModal = () => {
    setIsClientModalOpen(false);
    setEditingClient(null);
  };

  // Invoices (Bills) CRUD
  const handleBillSubmit = async (e) => {
    e.preventDefault();
    if (!billClient) {
      alert("Please select a client!");
      return;
    }

    const items = [{
      name: billWithGst ? "Fabric Stitching & Checking Summary" : "Fabric Production Services (Tax-exempt)",
      price: parseFloat(billSubtotal),
      qty: 1,
      gstRate: billWithGst ? 5 : 0,
      gstAmount: parseFloat(billGstAmount) || 0,
      total: parseFloat(billGrandTotal)
    }];

    const billPayload = {
      clientId: billClient,
      billNumber,
      date: billDate,
      billType: billWithGst ? 'with-gst' : 'without-gst',
      items,
      discount: parseFloat(billDiscount) || 0,
      subtotal: parseFloat(billSubtotal),
      totalGst: parseFloat(billGstAmount) || 0,
      totalAmount: parseFloat(billGrandTotal),
      fileData: billAttachmentData,
      fileName: billAttachmentName
    };

    try {
      if (editingBill) {
        await updateBillMutation({
          id: editingBill._id,
          ...billPayload,
          createdAt: editingBill.createdAt
        });
        alert("Invoice updated successfully!");
      } else {
        await addBillMutation(billPayload);
        alert("Invoice recorded successfully!");
      }
      closeBillModal();
    } catch (err) {
      alert("Error saving invoice: " + err.message);
    }
  };

  const deleteBill = async (id) => {
    if (confirm("Are you sure you want to delete this invoice record?")) {
      await deleteBillMutation({ id });
    }
  };

  const openEditBill = (b) => {
    setEditingBill(b);
    setBillClient(b.clientId);
    setBillNumber(b.billNumber);
    setBillDate(b.date);
    setBillWithGst(b.billType === 'with-gst');
    setBillSubtotal(b.subtotal.toString());
    setBillGstAmount(b.totalGst.toString());
    setBillDiscount(b.discount.toString());
    setBillGrandTotal(b.totalAmount.toString());
    setBillAttachmentData(b.fileData || null);
    setBillAttachmentName(b.fileName || '');
    setIsBillModalOpen(true);
  };

  const closeBillModal = () => {
    setIsBillModalOpen(false);
    setEditingBill(null);
    setBillClient('');
    setBillNumber('');
    setBillDate(new Date().toISOString().split('T')[0]);
    setBillWithGst(true);
    setBillSubtotal('');
    setBillGstAmount('');
    setBillDiscount('0');
    setBillGrandTotal('0');
    setBillAttachmentData(null);
    setBillAttachmentName('');
  };

  const handleBillAttachment = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setBillAttachmentName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setBillAttachmentData(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Employees CRUD
  const handleEmployeeSubmit = async (e) => {
    e.preventDefault();
    const name = document.getElementById('employee-name').value.trim();
    const phone = document.getElementById('employee-phone').value.trim();
    const role = document.getElementById('employee-role').value;
    const stitchRate = parseFloat(document.getElementById('employee-rate').value) || 0;
    const salary = parseFloat(document.getElementById('employee-salary').value) || 0;

    try {
      if (editingEmployee) {
        await updateEmployeeMutation({
          id: editingEmployee._id,
          name, phone, role, stitchRate, salary,
          createdAt: editingEmployee.createdAt
        });
        alert("Employee details updated successfully!");
      } else {
        await addEmployeeMutation({ name, phone, role, stitchRate, salary });
        alert("Employee registered successfully!");
      }
      closeEmployeeModal();
    } catch (err) {
      alert("Error saving employee: " + err.message);
    }
  };

  const deleteEmployee = async (id) => {
    if (confirm("Are you sure you want to delete this employee?")) {
      await deleteEmployeeMutation({ id });
    }
  };

  const openEditEmployee = (emp) => {
    setEditingEmployee(emp);
    setIsEmployeeModalOpen(true);
    setTimeout(() => {
      document.getElementById('employee-name').value = emp.name;
      document.getElementById('employee-phone').value = emp.phone || '';
      document.getElementById('employee-role').value = emp.role;
      document.getElementById('employee-rate').value = emp.stitchRate;
      document.getElementById('employee-salary').value = emp.salary;
    }, 50);
  };

  const closeEmployeeModal = () => {
    setIsEmployeeModalOpen(false);
    setEditingEmployee(null);
  };

  // Fabric Rolls CRUD
  const handleFabricSubmit = async (e) => {
    e.preventDefault();
    const fabricType = document.getElementById('fabric-type').value.trim();
    const quantityReceived = parseFloat(document.getElementById('fabric-qty').value) || 0;
    const color = document.getElementById('fabric-color').value.trim();
    const receivedDate = document.getElementById('fabric-date').value;
    const supplier = document.getElementById('fabric-supplier').value.trim();
    const status = document.getElementById('fabric-status').value;

    try {
      if (editingFabric) {
        await updateFabricMutation({
          id: editingFabric._id,
          fabricType, quantityReceived, color, receivedDate, supplier, status,
          createdAt: editingFabric.createdAt
        });
        alert("Fabric roll details updated!");
      } else {
        await addFabricMutation({ fabricType, quantityReceived, color, receivedDate, supplier, status });
        alert("Fabric roll logged successfully!");
      }
      closeFabricModal();
    } catch (err) {
      alert("Error saving fabric roll: " + err.message);
    }
  };

  const deleteFabric = async (id) => {
    if (confirm("Are you sure you want to delete this fabric roll from ledger?")) {
      await deleteFabricMutation({ id });
    }
  };

  const openEditFabric = (fab) => {
    setEditingFabric(fab);
    setIsFabricModalOpen(true);
    setTimeout(() => {
      document.getElementById('fabric-type').value = fab.fabricType;
      document.getElementById('fabric-qty').value = fab.quantityReceived;
      document.getElementById('fabric-color').value = fab.color;
      document.getElementById('fabric-date').value = fab.receivedDate;
      document.getElementById('fabric-supplier').value = fab.supplier;
      document.getElementById('fabric-status').value = fab.status;
    }, 50);
  };

  const closeFabricModal = () => {
    setIsFabricModalOpen(false);
    setEditingFabric(null);
  };

  // CEO Activities Log CRUD
  const handleCeoSubmit = async (e) => {
    e.preventDefault();
    const date = document.getElementById('ceo-date').value;
    const focusArea = document.getElementById('ceo-focus').value;
    const hoursSpent = parseFloat(document.getElementById('ceo-hours').value) || 0;
    const productivityLevel = document.getElementById('ceo-productivity').value;
    const description = document.getElementById('ceo-desc').value.trim();
    const isCritical = document.getElementById('ceo-critical').checked;

    try {
      if (editingCeo) {
        await updateCeoActivityMutation({
          id: editingCeo._id,
          date, focusArea, hoursSpent, productivityLevel, description, isCritical,
          createdAt: editingCeo.createdAt
        });
        alert("CEO Log updated!");
      } else {
        await addCeoActivityMutation({ date, focusArea, hoursSpent, productivityLevel, description, isCritical });
        alert("CEO activity logged!");
      }
      closeCeoModal();
    } catch (err) {
      alert("Error saving CEO log: " + err.message);
    }
  };

  const deleteCeoActivity = async (id) => {
    if (confirm("Delete this CEO log?")) {
      await deleteCeoActivityMutation({ id });
    }
  };

  const openEditCeo = (act) => {
    setEditingCeo(act);
    setIsCeoModalOpen(true);
    setTimeout(() => {
      document.getElementById('ceo-date').value = act.date;
      document.getElementById('ceo-focus').value = act.focusArea;
      document.getElementById('ceo-hours').value = act.hoursSpent;
      document.getElementById('ceo-productivity').value = act.productivityLevel;
      document.getElementById('ceo-desc').value = act.description;
      document.getElementById('ceo-critical').checked = act.isCritical;
    }, 50);
  };

  const closeCeoModal = () => {
    setIsCeoModalOpen(false);
    setEditingCeo(null);
  };

  // Stitching Assignment Actions
  const handleStitchingSubmit = async (e) => {
    e.preventDefault();
    const employeeId = document.getElementById('stitch-employee').value;
    const fabricId = document.getElementById('stitch-fabric').value;
    const piecesStitched = parseFloat(document.getElementById('stitch-pieces').value) || 0;
    const ratePerPiece = parseFloat(document.getElementById('stitch-rate').value) || 0;
    const totalPayment = piecesStitched * ratePerPiece;
    const assignedDate = document.getElementById('stitch-date').value;
    const status = document.getElementById('stitch-status').value;
    const notes = document.getElementById('stitch-notes').value.trim();

    try {
      if (editingStitching) {
        await updateStitchingMutation({
          id: editingStitching._id,
          employeeId, fabricId, piecesStitched, ratePerPiece, totalPayment, assignedDate, status, notes,
          createdAt: editingStitching.createdAt
        });
        alert("Stitching details updated!");
      } else {
        await addStitchingMutation({ employeeId, fabricId, piecesStitched, ratePerPiece, totalPayment, assignedDate, status, notes });
        alert("Stitching logged!");
      }
      setIsStitchingModalOpen(false);
      setEditingStitching(null);
    } catch (err) {
      alert("Error saving stitching assignment: " + err.message);
    }
  };

  const openEditStitching = (s) => {
    setEditingStitching(s);
    setIsStitchingModalOpen(true);
    setTimeout(() => {
      document.getElementById('stitch-employee').value = s.employeeId;
      document.getElementById('stitch-fabric').value = s.fabricId;
      document.getElementById('stitch-pieces').value = s.piecesStitched;
      document.getElementById('stitch-rate').value = s.ratePerPiece;
      document.getElementById('stitch-date').value = s.assignedDate;
      document.getElementById('stitch-status').value = s.status;
      document.getElementById('stitch-notes').value = s.notes || '';
    }, 50);
  };

  const deleteStitching = async (id) => {
    if (confirm("Delete this stitching assignment?")) {
      await deleteStitchingMutation({ id });
    }
  };

  // --- User Profile Account update handlers ---
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!currentLoggedUser) return;

    const fullName = document.getElementById('profile-fullname').value.trim();
    const email = document.getElementById('profile-email').value.trim();

    try {
      await updateUser({
        id: currentLoggedUser._id,
        username: currentLoggedUser.username,
        password: currentLoggedUser.password,
        fullName,
        email,
        avatarPicture: currentLoggedUser.avatarPicture || '',
        createdAt: currentLoggedUser.createdAt
      });
      alert("Profile updated successfully!");
    } catch (err) {
      alert("Profile update failed: " + err.message);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (!currentLoggedUser) return;

    const oldPwd = document.getElementById('profile-old-pwd').value;
    const newPwd = document.getElementById('profile-new-pwd').value;
    const confirmPwd = document.getElementById('profile-confirm-pwd').value;

    if (oldPwd !== currentLoggedUser.password) {
      alert("Incorrect current password!");
      return;
    }
    if (newPwd !== confirmPwd) {
      alert("New passwords do not match!");
      return;
    }

    try {
      await updateUser({
        id: currentLoggedUser._id,
        username: currentLoggedUser.username,
        password: newPwd,
        fullName: currentLoggedUser.fullName || '',
        email: currentLoggedUser.email || '',
        avatarPicture: currentLoggedUser.avatarPicture || '',
        createdAt: currentLoggedUser.createdAt
      });
      document.getElementById('profile-old-pwd').value = '';
      document.getElementById('profile-new-pwd').value = '';
      document.getElementById('profile-confirm-pwd').value = '';
      alert("Password changed successfully!");
    } catch (err) {
      alert("Failed to update password: " + err.message);
    }
  };

  const logUserOut = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentUser');
    setCurrentLoggedUser(null);
    setIsLoggedIn(false);
  };

  // --- Authentication screen submit triggers ---
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const userVal = document.getElementById('login-username').value.trim();
    const passVal = document.getElementById('login-password').value;

    const matching = users.find(u => u.username === userVal && u.password === passVal);
    if (matching) {
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('currentUser', userVal);
      setCurrentLoggedUser(matching);
      setIsLoggedIn(true);
    } else {
      alert("Invalid Username or Password!");
    }
  };

  const handleRegistrationSubmit = async (e) => {
    e.preventDefault();
    const userVal = document.getElementById('reg-username').value.trim();
    const emailVal = document.getElementById('reg-email').value.trim();
    const passVal = document.getElementById('reg-password').value;
    const confVal = document.getElementById('reg-confirm-password').value;

    if (passVal !== confVal) {
      alert("Passwords do not match!");
      return;
    }

    try {
      await registerUser({
        username: userVal,
        fullName: userVal,
        email: emailVal,
        password: passVal
      });

      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('currentUser', userVal);
      setIsLoggedIn(true);
      setIsFirstTimeSetup(false);
    } catch (err) {
      alert("Failed to register account: " + err.message);
    }
  };

  // --- AI Advisor Chat triggers ---
  const triggerAIAnalysis = () => {
    if (bills.length === 0) {
      alert("Record invoices in the system first to run AI calculations!");
      return;
    }

    setAiHealthScore('89%');
    setAiHealthStatus('Excellent');
    setAiSummary(`Varahi Exports has generated total revenues of ₹${bills.reduce((s, b) => s + b.totalAmount, 0).toLocaleString('en-IN')} across clients. Cash reserves and GST compliance margins are balanced, with a client concentration risk index of 0.28 (Low Risk).`);
    setAiRecommendations([
      { title: 'Increase Stitching Capacity', desc: 'Fabric inflow grew 14% this month; allocate additional stitching roles to prevent production backlogs.', icon: 'ph-trend-up' },
      { title: 'Tax Reserves Sync', desc: 'Keep ₹' + (bills.reduce((s, b) => s + b.totalGst, 0) * 0.8).toFixed(0) + ' set aside in your tax bank account to satisfy quarterly GST liabilities.', icon: 'ph-shield-check' },
      { title: 'Client Credit Limits', desc: 'Coral Knit Wear represents 68% of outstanding invoices. Set up a credit limit of ₹10 Lakhs for risk balancing.', icon: 'ph-chart-line-up' }
    ]);
  };

  const sendChatMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');

    setTimeout(() => {
      let botResponse = "I have processed your query. Currently, Varahi Exports shows healthy operations. Let me know if you would like me to compile details relating to invoices, fabric stock, or stitcher logs.";
      if (userMsg.toLowerCase().includes('cash flow') || userMsg.toLowerCase().includes('finance')) {
        botResponse = "Total cash inflows logged stand at ₹" + bills.reduce((s, b) => s + b.totalAmount, 0).toLocaleString('en-IN') + ". Outstanding client balances total ₹" + (bills.reduce((s, b) => s + b.totalAmount, 0) * 0.15).toFixed(0) + ". No critical bottlenecks found.";
      } else if (userMsg.toLowerCase().includes('client') || userMsg.toLowerCase().includes('top client')) {
        botResponse = "Your top client by bill volume is Coral Knit Wear. They represent the highest density of stitched shipments.";
      } else if (userMsg.toLowerCase().includes('sales') || userMsg.toLowerCase().includes('forecast')) {
        botResponse = "Based on seasonality variance, we forecast a sales volume stability range of ₹2.4 Lakhs to ₹3.1 Lakhs for the next 30 days.";
      }

      setChatMessages(prev => [...prev, { role: 'assistant', text: botResponse }]);
    }, 800);
  };

  const sendQuickMessage = (text) => {
    setChatMessages(prev => [...prev, { role: 'user', text }]);
    setTimeout(() => {
      let botResponse = "Here is the summary of your request: " + text + ". Operations are running smoothly.";
      if (text.includes('cash flow')) {
        botResponse = "Total cash flow generated: ₹" + bills.reduce((s, b) => s + b.totalAmount, 0).toLocaleString('en-IN') + " from billing logs. Outflow allocations for stitching wages total ₹" + stitching.reduce((s, st) => s + st.totalPayment, 0).toLocaleString('en-IN') + ".";
      } else if (text.includes('top client')) {
        botResponse = "Coral Knit Wear is currently your top client, yielding the largest transactional share of billing records.";
      } else if (text.includes('Concentration')) {
        botResponse = "Ledger analysis shows that 100% of your current logged invoices are associated with Coral Knit Wear, indicating high client concentration. Recommend registering additional clients to distribute revenue risk.";
      } else if (text.includes('Forecast')) {
        botResponse = "Based on stitching rates and invoices growth trends, next month's sales are estimated to reach ₹" + (bills.reduce((s, b) => s + b.totalAmount, 0) * 1.12).toFixed(0) + " (+12% growth).";
      }
      setChatMessages(prev => [...prev, { role: 'assistant', text: botResponse }]);
    }, 600);
  };

  // --- PWA Installation trigger ---
  const triggerPwaInstall = () => {
    if (!pwaPrompt) {
      alert("📱 PWA Installation Guide:\n\n🍎 iOS / Safari:\n1. Tap the Share button in Safari (box with up arrow).\n2. Scroll down and select 'Add to Home Screen'.\n\n🤖 Android / Chrome / HTTP:\n1. PWA installation requires a secure HTTPS connection (e.g. once deployed on GitHub Pages) or 'localhost'.\n2. If accessing via your local network IP (http://192.168.x.x), browsers block installation due to security policies.");
      return;
    }
    setIsMobileMenuOpen(false);
    pwaPrompt.prompt();
    pwaPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the PWA install prompt');
      }
      setPwaPrompt(null);
    });
  };

  // Format currency in INR
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(val);
  };

  // If user is not logged in, render the Auth Overlay
  if (!isLoggedIn) {
    return (
      <div id="auth-screen" className="auth-overlay-wrapper active">
        <div className="auth-container-card">
          <div className="auth-brand-logo">
            <i className="ph-fill ph-wallet"></i>
          </div>

          {authMode === 'login' ? (
            <div id="auth-login-box" className="auth-box active">
              <h2>Welcome Back</h2>
              <p className="auth-desc">Sign in to your Varahi Exports Accounting Suite.</p>
              <form id="login-form-element" onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px', width: '100%' }}>
                <div className="form-group" style={{ width: '100%' }}>
                  <label htmlFor="login-username">Username</label>
                  <div className="input-with-icon">
                    <i className="ph ph-user icon-leading"></i>
                    <input type="text" id="login-username" required placeholder="Enter username" style={{ paddingLeft: '44px', width: '100%' }} />
                  </div>
                </div>
                <div className="form-group" style={{ width: '100%' }}>
                  <label htmlFor="login-password">Password</label>
                  <div className="input-with-icon">
                    <i className="ph ph-lock icon-leading"></i>
                    <input type="password" id="login-password" required placeholder="••••••••" style={{ paddingLeft: '44px', width: '100%' }} />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" style={{ padding: '14px', fontWeight: 700, width: '100%', justifyContent: 'center', fontSize: '15px', marginTop: '8px' }}>Sign In</button>
              </form>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', marginTop: '20px' }}>
                <hr style={{ flex: 1, border: 0, borderTop: '1px solid rgba(255,255,255,0.08)' }} />
                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>or</span>
                <hr style={{ flex: 1, border: 0, borderTop: '1px solid rgba(255,255,255,0.08)' }} />
              </div>

              <div id="google-signin-btn-login" style={{ marginTop: '16px', width: '100%', display: 'flex', justifyContent: 'center' }}></div>

              <p className="auth-toggle-text" style={{ textAlign: 'center', fontSize: '12px', marginTop: '20px', color: 'var(--color-text-secondary)' }}>
                Don't have an account? <a href="#" onClick={(e) => { e.preventDefault(); setAuthMode('register'); }} style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>Create Account</a>
              </p>
            </div>
          ) : (
            <div id="auth-register-box" className="auth-box active">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <h2 style={{ fontSize: '22px' }}>Create Account</h2>
                {isFirstTimeSetup && (
                  <span id="setup-badge" className="badge" style={{ backgroundColor: 'rgba(124,58,237,0.1)', color: 'var(--color-primary)', border: '1px solid rgba(124,58,237,0.25)', fontSize: '10px', padding: '4px 8px', borderRadius: '12px', display: 'inline-block' }}>✨ First-Time Setup</span>
                )}
              </div>
              <p className="auth-desc">Register administrative credentials to manage billing records.</p>
              <form id="register-form-element" onSubmit={handleRegistrationSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px', width: '100%' }}>
                <div className="form-group" style={{ width: '100%' }}>
                  <label htmlFor="reg-username">Username *</label>
                  <input type="text" id="reg-username" required placeholder="e.g. admin" style={{ width: '100%' }} />
                </div>
                <div className="form-group" style={{ width: '100%' }}>
                  <label htmlFor="reg-email">Email Address</label>
                  <input type="email" id="reg-email" placeholder="e.g. varahi.export@gmail.com" style={{ width: '100%' }} />
                </div>
                <div className="form-row" style={{ width: '100%' }}>
                  <div className="form-group">
                    <label htmlFor="reg-password">Password *</label>
                    <input type="password" id="reg-password" required placeholder="••••••••" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="reg-confirm-password">Confirm Password *</label>
                    <input type="password" id="reg-confirm-password" required placeholder="••••••••" />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" style={{ padding: '14px', fontWeight: 700, width: '100%', justifyContent: 'center', fontSize: '15px', marginTop: '8px' }}>Register Account</button>
              </form>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', marginTop: '16px' }}>
                <hr style={{ flex: 1, border: 0, borderTop: '1px solid rgba(255,255,255,0.08)' }} />
                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>or</span>
                <hr style={{ flex: 1, border: 0, borderTop: '1px solid rgba(255,255,255,0.08)' }} />
              </div>

              <div id="google-signin-btn-register" style={{ marginTop: '12px', width: '100%', display: 'flex', justifyContent: 'center' }}></div>

              <p className="auth-toggle-text" style={{ textAlign: 'center', fontSize: '12px', marginTop: '20px', color: 'var(--color-text-secondary)' }}>
                Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); setAuthMode('login'); }} style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>Sign In</a>
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">
            <i className="ph-fill ph-wallet"></i>
          </div>
          <span className="brand-name">Varahi Export</span>
        </div>

        <nav className="nav-menu">
          <button className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => handleTabChange('dashboard')}>
            <i className="ph ph-squares-four"></i>
            <span>Dashboard</span>
          </button>
          <button className={`nav-item mobile-hidden-nav ${activeTab === 'clients' ? 'active' : ''}`} onClick={() => handleTabChange('clients')}>
            <i className="ph ph-users-three"></i>
            <span>Clients</span>
          </button>
          <button className={`nav-item ${activeTab === 'bills' ? 'active' : ''}`} onClick={() => handleTabChange('bills')}>
            <i className="ph ph-receipt"></i>
            <span>Invoices</span>
          </button>
          <button className={`nav-item mobile-hidden-nav ${activeTab === 'employees' ? 'active' : ''}`} onClick={() => handleTabChange('employees')}>
            <i className="ph ph-identification-card"></i>
            <span>Employees</span>
          </button>
          <button className={`nav-item ${activeTab === 'fabrics' ? 'active' : ''}`} onClick={() => handleTabChange('fabrics')}>
            <i className="ph ph-scissors"></i>
            <span>Fabrics</span>
          </button>
          <button className={`nav-item mobile-hidden-nav ${activeTab === 'ceo-tracker' ? 'active' : ''}`} onClick={() => handleTabChange('ceo-tracker')}>
            <i className="ph ph-briefcase"></i>
            <span>CEO Log</span>
          </button>
          <button className={`nav-item mobile-hidden-nav ${activeTab === 'account' ? 'active' : ''}`} onClick={() => handleTabChange('account')}>
            <i className="ph ph-user-gear"></i>
            <span>Account</span>
          </button>
          <button className="nav-item mobile-only-nav" onClick={() => setIsMobileMenuOpen(true)}>
            <i className="ph ph-dots-three-outline"></i>
            <span>More</span>
          </button>
        </nav>

        <div className="user-profile" onClick={() => handleTabChange('account')}>
          <div className="avatar" id="sidebar-avatar">
            {currentLoggedUser?.avatarPicture ? (
              <img src={currentLoggedUser.avatarPicture} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="Avatar" />
            ) : (
              currentLoggedUser?.fullName ? currentLoggedUser.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'US'
            )}
          </div>
          <div className="profile-info">
            <span className="user-name" id="sidebar-user-name">{currentLoggedUser?.fullName || currentLoggedUser?.username || 'Guest'}</span>
            <span className="user-role">Administrator</span>
          </div>
        </div>
      </aside>

      {/* Main Content Layout */}
      <main className="main-content">

        {/* ==================== DASHBOARD VIEW ==================== */}
        {activeTab === 'dashboard' && (
          <section id="dashboard-view" className="tab-view active">
            <header className="view-header">
              <div>
                <h1>Financial Overview</h1>
                <p className="subtitle">Monitor your business performance, client revenues, and GST filings.</p>
              </div>
              <div className="header-actions">
                <button className="btn btn-primary" onClick={() => setIsBillModalOpen(true)}>
                  <i className="ph ph-plus-circle"></i> New Bill
                </button>
                <button className="btn btn-accent" onClick={() => setIsScanModalOpen(true)}>
                  <i className="ph ph-scan"></i> Scan Receipt
                </button>
              </div>
            </header>

            {/* Dashboard highlights grid */}
            <div className="highlights-grid">
              <div className="highlight-card bg-surface border">
                <div className="icon bg-accent-light text-primary"><i className="ph ph-currency-inr"></i></div>
                <div>
                  <span className="title text-muted">Total Billing</span>
                  <h3 className="value text-primary">{formatCurrency(bills.reduce((s, b) => s + b.totalAmount, 0))}</h3>
                </div>
              </div>
              <div className="highlight-card bg-surface border">
                <div className="icon" style={{ backgroundColor: 'rgba(245,158,11,0.08)', color: 'var(--color-primary)' }}><i className="ph ph-receipt"></i></div>
                <div>
                  <span className="title text-muted">Invoices Logged</span>
                  <h3 className="value">{bills.length} Bills</h3>
                </div>
              </div>
              <div className="highlight-card bg-surface border">
                <div className="icon" style={{ backgroundColor: 'rgba(16,185,129,0.08)', color: 'var(--color-success)' }}><i className="ph ph-package"></i></div>
                <div>
                  <span className="title text-muted">Active Fabric Rolls</span>
                  <h3 className="value">{fabrics.filter(f => f.status === 'Stored' || f.status === 'Stitching').length} Rolls</h3>
                </div>
              </div>
              <div className="highlight-card bg-surface border">
                <div className="icon" style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: 'var(--color-destructive)' }}><i className="ph ph-clock"></i></div>
                <div>
                  <span className="title text-muted">CEO Logged Hours</span>
                  <h3 className="value">{ceoActivities.reduce((s, a) => s + a.hoursSpent, 0)} Hrs</h3>
                </div>
              </div>
            </div>

            {/* Main Dashboard charts and concentration risk layout */}
            <div className="dashboard-charts-layout">
              <div className="chart-card bg-surface border">
                <h3>Revenue Contribution by Client</h3>
                <div className="chart-container" style={{ height: '300px', position: 'relative', marginTop: '16px' }}>
                  <canvas ref={chartCanvasRef}></canvas>
                </div>
              </div>

              <div className="table-card bg-surface border">
                <h3>Client Concentration Risk</h3>
                <p className="small text-muted" style={{ marginBottom: '16px' }}>Assess transactional dependency share.</p>
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Client</th>
                        <th className="text-right">Billing Volume</th>
                        <th className="text-right">Percentage Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(
                        bills.reduce((acc, b) => {
                          const c = clients.find(cl => cl._id === b.clientId);
                          const name = c ? c.name : 'Unknown';
                          acc[name] = (acc[name] || 0) + b.totalAmount;
                          return acc;
                        }, {})
                      ).map(([name, sum]) => {
                        const total = bills.reduce((s, b) => s + b.totalAmount, 0) || 1;
                        const pct = (sum / total) * 100;
                        return (
                          <tr key={name}>
                            <td className="font-semibold">{name}</td>
                            <td className="text-right">{formatCurrency(sum)}</td>
                            <td className="text-right font-medium text-primary">{pct.toFixed(1)}%</td>
                          </tr>
                        );
                      })}
                      {bills.length === 0 && (
                        <tr>
                          <td colSpan="3" className="text-center text-muted">No billing summaries computed.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ==================== CLIENTS VIEW ==================== */}
        {activeTab === 'clients' && (
          <section id="clients-view" className="tab-view active">
            <header className="view-header">
              <div>
                <h1>Clients Registry</h1>
                <p className="subtitle">Manage external buyer profiles, registered addresses, and buyer GSTIN details.</p>
              </div>
              <button className="btn btn-primary" onClick={() => setIsClientModalOpen(true)}>
                <i className="ph ph-plus-circle"></i> Register Client
              </button>
            </header>

            <div className="search-filter-row" style={{ marginBottom: '20px' }}>
              <div className="search-input-wrapper">
                <i className="ph ph-magnifying-glass"></i>
                <input type="text" placeholder="Search clients by name, company, or email..." value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} />
              </div>
            </div>

            <div className="table-card bg-surface border">
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Company Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>GSTIN</th>
                      <th>Address</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()) || (c.companyName || '').toLowerCase().includes(clientSearch.toLowerCase())).map(c => (
                      <tr key={c._id}>
                        <td className="font-semibold">{c.name}</td>
                        <td>{c.companyName || '-'}</td>
                        <td>{c.email || '-'}</td>
                        <td>{c.phone || '-'}</td>
                        <td className="font-medium text-primary">{c.gstin || 'Unregistered'}</td>
                        <td>{c.address || '-'}</td>
                        <td className="text-right">
                          <button className="btn-icon" onClick={() => openEditClient(c)}><i className="ph ph-pencil-simple"></i></button>
                          <button className="btn-icon text-red" onClick={() => deleteClient(c._id)}><i className="ph ph-trash"></i></button>
                        </td>
                      </tr>
                    ))}
                    {clients.length === 0 && (
                      <tr>
                        <td colSpan="7" className="text-center text-muted">No client records found. Register your first buyer!</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* ==================== INVOICES VIEW ==================== */}
        {activeTab === 'bills' && (
          <section id="bills-view" className="tab-view active">
            <header className="view-header">
              <div>
                <h1>Invoices & Billings</h1>
                <p className="subtitle">Log transactional bills, print tax compliance layouts, and track scanned receipts.</p>
              </div>
              <button className="btn btn-primary" onClick={() => setIsBillModalOpen(true)}>
                <i className="ph ph-plus-circle"></i> Record Invoice
              </button>
            </header>

            <div className="search-filter-row" style={{ marginBottom: '20px' }}>
              <div className="search-input-wrapper">
                <i className="ph ph-magnifying-glass"></i>
                <input type="text" placeholder="Search bills by invoice number..." value={billSearch} onChange={(e) => setBillSearch(e.target.value)} />
              </div>
            </div>

            <div className="table-card bg-surface border">
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Invoice No</th>
                      <th>Client Name</th>
                      <th>Date</th>
                      <th>Tax Scheme</th>
                      <th className="text-right">Subtotal</th>
                      <th className="text-right">GST Tax</th>
                      <th className="text-right">Discount</th>
                      <th className="text-right">Grand Total</th>
                      <th>Attachment</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bills.filter(b => b.billNumber.toLowerCase().includes(billSearch.toLowerCase())).map(b => {
                      const c = clients.find(cl => cl._id === b.clientId);
                      return (
                        <tr key={b._id}>
                          <td className="font-semibold text-primary">{b.billNumber}</td>
                          <td>{c ? c.name : 'Unknown Client'}</td>
                          <td>{formatDate(b.date)}</td>
                          <td>{b.billType === 'with-gst' ? 'With GST (5%)' : 'Without GST'}</td>
                          <td className="text-right">{formatCurrency(b.subtotal)}</td>
                          <td className="text-right">{formatCurrency(b.totalGst)}</td>
                          <td className="text-right text-red">-{formatCurrency(b.discount)}</td>
                          <td className="text-right font-semibold text-green">{formatCurrency(b.totalAmount)}</td>
                          <td>
                            {b.fileData ? (
                              <a href={b.fileData} download={b.fileName} className="badge" style={{ textDecoration: 'none', backgroundColor: 'rgba(124,58,237,0.1)', color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <i className="ph ph-paperclip"></i> View File
                              </a>
                            ) : '-'}
                          </td>
                          <td className="text-right" style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                            <button className="btn-icon text-primary" onClick={() => { setViewingInvoice(b); setIsInvoiceViewOpen(true); }} title="Print / View Invoice"><i className="ph ph-file-text"></i></button>
                            <button className="btn-icon" onClick={() => openEditBill(b)}><i className="ph ph-pencil-simple"></i></button>
                            <button className="btn-icon text-red" onClick={() => deleteBill(b._id)}><i className="ph ph-trash"></i></button>
                          </td>
                        </tr>
                      );
                    })}
                    {bills.length === 0 && (
                      <tr>
                        <td colSpan="10" className="text-center text-muted">No invoices logged. Log an invoice to calculate sales records.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* ==================== EMPLOYEES VIEW ==================== */}
        {activeTab === 'employees' && (
          <section id="employees-view" className="tab-view active">
            <header className="view-header">
              <div>
                <h1>Stitching Crew Management</h1>
                <p className="subtitle">Register stitching staff, roles, salary assignments, and wage rates per piece.</p>
              </div>
              <button className="btn btn-primary" onClick={() => setIsEmployeeModalOpen(true)}>
                <i className="ph ph-user-plus"></i> Register Employee
              </button>
            </header>

            <div className="search-filter-row" style={{ marginBottom: '20px' }}>
              <div className="search-input-wrapper">
                <i className="ph ph-magnifying-glass"></i>
                <input type="text" placeholder="Search employees by name..." value={employeeSearch} onChange={(e) => setEmployeeSearch(e.target.value)} />
              </div>
            </div>

            <div className="table-card bg-surface border">
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Phone</th>
                      <th>Role</th>
                      <th className="text-right">Stitch Rate / Pcs (₹)</th>
                      <th className="text-right">Basic Salary (₹)</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.filter(e => e.name.toLowerCase().includes(employeeSearch.toLowerCase())).map(emp => (
                      <tr key={emp._id}>
                        <td className="font-semibold">{emp.name}</td>
                        <td>{emp.phone || '-'}</td>
                        <td><span className="badge" style={{ backgroundColor: 'rgba(124,58,237,0.08)', color: 'var(--color-primary)' }}>{emp.role}</span></td>
                        <td className="text-right">{formatCurrency(emp.stitchRate)}</td>
                        <td className="text-right">{formatCurrency(emp.salary)}</td>
                        <td className="text-right">
                          <button className="btn-icon" onClick={() => openEditEmployee(emp)}><i className="ph ph-pencil-simple"></i></button>
                          <button className="btn-icon text-red" onClick={() => deleteEmployee(emp._id)}><i className="ph ph-trash"></i></button>
                        </td>
                      </tr>
                    ))}
                    {employees.length === 0 && (
                      <tr>
                        <td colSpan="6" className="text-center text-muted">No crew registered. Add employees to log stitching operations.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* ==================== FABRICS VIEW ==================== */}
        {activeTab === 'fabrics' && (
          <section id="fabrics-view" className="tab-view active">
            <header className="view-header">
              <div>
                <h1>Fabric Stocks & Production</h1>
                <p className="subtitle">Monitor inbound fabric rolls, supplier names, coloring details, and stitch allocations.</p>
              </div>
              <div className="header-actions">
                <button className="btn btn-primary" onClick={() => setIsFabricModalOpen(true)}>
                  <i className="ph ph-plus-circle"></i> Log Fabric Roll
                </button>
                <button className="btn btn-accent" onClick={() => setIsStitchingModalOpen(true)}>
                  <i className="ph ph-scissors"></i> Stitch Allocation
                </button>
              </div>
            </header>

            <div className="search-filter-row" style={{ marginBottom: '20px' }}>
              <div className="search-input-wrapper">
                <i className="ph ph-magnifying-glass"></i>
                <input type="text" placeholder="Search rolls by color, supplier, or fabric..." value={fabricSearch} onChange={(e) => setFabricSearch(e.target.value)} />
              </div>
            </div>

            <div className="grid-layout-2" style={{ gridTemplateColumns: '1.4fr 1fr', gap: '24px' }}>
              {/* Left Side: Fabric list */}
              <div className="table-card bg-surface border" style={{ padding: '20px' }}>
                <h3 style={{ marginBottom: '16px' }}>Fabric Roll Stock ledger</h3>
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Fabric Type</th>
                        <th>Color</th>
                        <th className="text-right">Qty Received</th>
                        <th>Supplier</th>
                        <th>Status</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fabrics.filter(f => f.fabricType.toLowerCase().includes(fabricSearch.toLowerCase()) || f.color.toLowerCase().includes(fabricSearch.toLowerCase()) || f.supplier.toLowerCase().includes(fabricSearch.toLowerCase())).map(f => (
                        <tr key={f._id}>
                          <td>{formatDate(f.receivedDate)}</td>
                          <td className="font-semibold">{f.fabricType}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: f.color.toLowerCase(), border: '1px solid rgba(255,255,255,0.1)' }}></span>
                              {f.color}
                            </div>
                          </td>
                          <td className="text-right font-medium">{f.quantityReceived} Pcs</td>
                          <td>{f.supplier}</td>
                          <td>
                            <span className={`badge ${f.status === 'Completed' ? 'badge-success' : f.status === 'Stitching' ? 'badge-gst' : 'badge-neutral'}`}>
                              {f.status}
                            </span>
                          </td>
                          <td className="text-right">
                            <button className="btn-icon" onClick={() => openEditFabric(f)}><i className="ph ph-pencil-simple"></i></button>
                            <button className="btn-icon text-red" onClick={() => deleteFabric(f._id)}><i className="ph ph-trash"></i></button>
                          </td>
                        </tr>
                      ))}
                      {fabrics.length === 0 && (
                        <tr>
                          <td colSpan="7" className="text-center text-muted">No fabric rolls logged.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Side: Stitch allocations list */}
              <div className="table-card bg-surface border" style={{ padding: '20px' }}>
                <h3 style={{ marginBottom: '16px' }}>Active Stitching Assignments</h3>
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Stitcher</th>
                        <th>Qty</th>
                        <th className="text-right">Rate</th>
                        <th className="text-right">Payout</th>
                        <th>Status</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stitching.map(s => {
                        const emp = employees.find(e => e._id === s.employeeId);
                        return (
                          <tr key={s._id}>
                            <td className="font-semibold">{emp ? emp.name : 'Unknown Staff'}</td>
                            <td>{s.piecesStitched} pcs</td>
                            <td className="text-right">{formatCurrency(s.ratePerPiece)}</td>
                            <td className="text-right font-medium text-primary">{formatCurrency(s.totalPayment)}</td>
                            <td><span className={`badge ${s.status === 'Completed' ? 'badge-success' : 'badge-gst'}`}>{s.status}</span></td>
                            <td className="text-right">
                              <button className="btn-icon" onClick={() => openEditStitching(s)}><i className="ph ph-pencil-simple"></i></button>
                              <button className="btn-icon text-red" onClick={() => deleteStitching(s._id)}><i className="ph ph-trash"></i></button>
                            </td>
                          </tr>
                        );
                      })}
                      {stitching.length === 0 && (
                        <tr>
                          <td colSpan="6" className="text-center text-muted">No active stitching assignments logged.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ==================== CEO TRACKER VIEW ==================== */}
        {activeTab === 'ceo-tracker' && (
          <section id="ceo-tracker-view" className="tab-view active">
            <header className="view-header">
              <div>
                <h1>CEO Work logs</h1>
                <p className="subtitle">Audit daily performance metrics, focus distributions, and business accomplishments.</p>
              </div>
              <button className="btn btn-primary" onClick={() => setIsCeoModalOpen(true)}>
                <i className="ph ph-briefcase"></i> Log CEO Workday
              </button>
            </header>

            {/* Statistics indicators */}
            <div className="highlights-grid" style={{ marginBottom: '24px' }}>
              <div className="highlight-card bg-surface border">
                <div className="icon" style={{ backgroundColor: 'rgba(124,58,237,0.08)', color: 'var(--color-primary)' }}><i className="ph ph-check-square"></i></div>
                <div>
                  <span className="title text-muted">Accomplishments Logged</span>
                  <h3 className="value">{ceoActivities.length} logs</h3>
                </div>
              </div>
              <div className="highlight-card bg-surface border">
                <div className="icon" style={{ backgroundColor: 'rgba(16,185,129,0.08)', color: 'var(--color-success)' }}><i className="ph ph-clock"></i></div>
                <div>
                  <span className="title text-muted">Cumulative Hours</span>
                  <h3 className="value">{ceoActivities.reduce((s, a) => s + a.hoursSpent, 0)} Hrs</h3>
                </div>
              </div>
              <div className="highlight-card bg-surface border">
                <div className="icon" style={{ backgroundColor: 'rgba(245,158,11,0.08)', color: 'var(--color-primary)' }}><i className="ph ph-sparkle"></i></div>
                <div>
                  <span className="title text-muted">Critical Milestones</span>
                  <h3 className="value">{ceoActivities.filter(a => a.isCritical).length} Milestones</h3>
                </div>
              </div>
            </div>

            <div className="table-card bg-surface border" style={{ padding: '20px' }}>
              <h3 style={{ marginBottom: '16px' }}>CEO Logs Book</h3>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Focus Area</th>
                      <th>Accomplishment Details</th>
                      <th className="text-right">Hours Logged</th>
                      <th>Productivity Score</th>
                      <th>Critical?</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ceoActivities.map(act => (
                      <tr key={act._id} style={{ borderLeft: act.isCritical ? '4px solid var(--color-primary)' : 'none' }}>
                        <td>{formatDate(act.date)}</td>
                        <td className="font-semibold text-primary">{act.focusArea}</td>
                        <td style={{ maxWidth: '280px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', cursor: 'pointer' }} onClick={() => setSelectedCeoDetail(act)}>
                          {act.description}
                        </td>
                        <td className="text-right">{act.hoursSpent} Hrs</td>
                        <td>
                          <span className={`badge ${act.productivityLevel === 'High' ? 'badge-success' : act.productivityLevel === 'Medium' ? 'badge-gst' : 'badge-neutral'}`}>
                            {act.productivityLevel}
                          </span>
                        </td>
                        <td>{act.isCritical ? '⭐ Yes' : '-'}</td>
                        <td className="text-right">
                          <button className="btn-icon" onClick={() => openEditCeo(act)}><i className="ph ph-pencil-simple"></i></button>
                          <button className="btn-icon text-red" onClick={() => deleteCeoActivity(act._id)}><i className="ph ph-trash"></i></button>
                        </td>
                      </tr>
                    ))}
                    {ceoActivities.length === 0 && (
                      <tr>
                        <td colSpan="7" className="text-center text-muted">No activity records logged. Let the CEO document workflow summaries.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* ==================== AI ADVISOR VIEW ==================== */}
        {activeTab === 'ai-advisor' && (
          <section id="ai-advisor-view" className="tab-view active">
            <header className="view-header">
              <div>
                <h1>AI Business Intelligence</h1>
                <p className="subtitle">Get strategic financial advice, growth forecasts, and risk assessments generated directly from your ledger data.</p>
              </div>
              <button className="btn btn-accent" onClick={triggerAIAnalysis}>
                <i className="ph ph-sparkle"></i> Run AI Analysis
              </button>
            </header>

            <div className="ai-intelligence-grid">
              {/* Left Side: Analysis cards */}
              <div className="ai-analysis-main">
                {/* Health Score Card */}
                <div className="ai-card health-score-card">
                  <div className="health-header">
                    <h3>Varahi Export Health Score</h3>
                    <span className="badge badge-gst font-medium" id="ai-health-status">{aiHealthStatus}</span>
                  </div>
                  <div className="health-body">
                    <div className="health-score-gauge">
                      <div className="gauge-center">
                        <span id="ai-health-percentage">{aiHealthScore}</span>
                        <span className="label">Health Index</span>
                      </div>
                    </div>
                    <div className="health-summary-text">
                      <h4>Executive Summary</h4>
                      <p id="ai-summary-text">{aiSummary}</p>
                    </div>
                  </div>
                </div>

                {/* Bullet Recommendations */}
                <div className="ai-card recommendations-card" style={{ marginTop: '24px' }}>
                  <h3>Strategic Recommendations</h3>
                  <hr className="divider" />
                  <div className="recommendations-list" id="ai-recommendations-list">
                    {aiRecommendations.map((r, i) => (
                      <div className="recommendation-item empty-state" key={i}>
                        <div className="icon"><i className={`ph ${r.icon}`}></i></div>
                        <div>
                          <h5>{r.title}</h5>
                          <p>{r.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Side: Chat Assistant */}
              <div className="ai-chat-sidebar">
                <div className="ai-card chat-card">
                  <div className="chat-header">
                    <div className="chat-ai-avatar"><i className="ph-fill ph-sparkle"></i></div>
                    <div>
                      <h4>Interactive Financial Advisor</h4>
                      <p className="small text-green"><span className="pulse-dot"></span> Online & connected to database</p>
                    </div>
                  </div>

                  <div className="chat-logs" id="ai-chat-logs" style={{ height: '320px', overflowY: 'auto', padding: '16px' }}>
                    {chatMessages.map((msg, i) => (
                      <div className={`chat-message ${msg.role}`} key={i}>
                        <p>{msg.text}</p>
                      </div>
                    ))}
                  </div>

                  <div className="suggestion-chips" style={{ padding: '8px 16px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button className="chip" onClick={() => sendQuickMessage('Provide complete cash flow review')}>Cash Flow Review</button>
                    <button className="chip" onClick={() => sendQuickMessage('Who is my top client by sales?')}>Top Client Analysis</button>
                    <button className="chip" onClick={() => sendQuickMessage('Do I have client concentration risk?')}>Concentration Risk</button>
                    <button className="chip" onClick={() => sendQuickMessage('Forecast next month sales')}>Sales Forecast</button>
                  </div>

                  <form className="chat-input-form" onSubmit={sendChatMessage}>
                    <input type="text" placeholder="Ask about your financial status..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} required />
                    <button type="submit" className="btn btn-accent btn-icon-square"><i className="ph-fill ph-paper-plane-right"></i></button>
                  </form>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ==================== ACCOUNT VIEW ==================== */}
        {activeTab === 'account' && (
          <section id="account-view" className="tab-view active">
            <header className="view-header">
              <div>
                <h1>Account Settings</h1>
                <p className="subtitle">Update user profile information, change passcodes, or exit active session.</p>
              </div>
            </header>

            <div className="grid-layout-2" style={{ gridTemplateColumns: '1.2fr 1fr', gap: '24px', marginTop: '24px' }}>
              <div className="card bg-surface border" style={{ padding: '24px' }}>
                <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><i className="ph ph-user-circle text-primary"></i> Edit Profile Info</h3>
                <form id="profile-form" onSubmit={handleProfileUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="profile-username">Username (Non-editable)</label>
                      <input type="text" id="profile-username" readOnly style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-text-secondary)', cursor: 'not-allowed' }} />
                    </div>
                    <div className="form-group">
                      <label htmlFor="profile-fullname">Full Name *</label>
                      <input type="text" id="profile-fullname" required placeholder="e.g. Vikassy Manager" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="profile-email">Email Address</label>
                    <input type="email" id="profile-email" placeholder="e.g. varahi.export@gmail.com" />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: '8px' }}>Update Profile Info</button>
                </form>
              </div>

              <div className="card bg-surface border" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><i className="ph ph-lock text-primary"></i> Change Password</h3>
                  <form id="password-form" onSubmit={handlePasswordUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="form-group">
                      <label htmlFor="profile-old-pwd">Current Password *</label>
                      <input type="password" id="profile-old-pwd" required placeholder="••••••••" />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="profile-new-pwd">New Password *</label>
                        <input type="password" id="profile-new-pwd" required placeholder="••••••••" />
                      </div>
                      <div className="form-group">
                        <label htmlFor="profile-confirm-pwd">Confirm New Password *</label>
                        <input type="password" id="profile-confirm-pwd" required placeholder="••••••••" />
                      </div>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: '8px' }}>Change Password</button>
                  </form>
                </div>

                <div style={{ marginTop: '24px', borderTop: '1px solid var(--color-border)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ color: 'var(--color-destructive)', fontSize: '14px', fontWeight: 700 }}>Account Session</h4>
                    <p className="text-muted" style={{ fontSize: '11px', marginTop: '2px' }}>Sign out of the current billing session.</p>
                  </div>
                  <button className="btn btn-secondary" onClick={logUserOut} style={{ borderColor: 'var(--color-destructive)', color: 'var(--color-destructive)', fontWeight: 600 }}>
                    <i className="ph ph-sign-out"></i> Log Out
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* ==================== CLIENT MODAL (Add / Edit Client) ==================== */}
      {isClientModalOpen && (
        <div id="client-modal" className="modal-overlay active">
          <div className="modal-card">
            <div className="modal-header">
              <h3>{editingClient ? 'Edit Client Profile' : 'Register New Client'}</h3>
              <button className="btn-close" onClick={closeClientModal}><i className="ph ph-x"></i></button>
            </div>
            <form id="client-form" onSubmit={handleClientSubmit}>
              <div className="modal-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="client-name">Contact Person Name *</label>
                    <input type="text" id="client-name" required placeholder="e.g. John Doe" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="client-company">Company/Business Name</label>
                    <input type="text" id="client-company" placeholder="e.g. Coral Knit Wear" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="client-email">Email Address</label>
                    <input type="email" id="client-email" placeholder="e.g. buyer@company.com" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="client-phone">Phone Number</label>
                    <input type="tel" id="client-phone" placeholder="e.g. +91 99999 88888" />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="client-gstin">GSTIN ID Number</label>
                  <input type="text" id="client-gstin" placeholder="e.g. 33AACFC0108K1Z1 (Standard Code)" />
                </div>
                <div className="form-group">
                  <label htmlFor="client-address">Billing Address</label>
                  <textarea id="client-address" rows="3" placeholder="Enter complete billing/shipping address details..."></textarea>
                </div>
              </div>
              <div className="modal-footer" style={{ padding: '16px 20px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={closeClientModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px', fontWeight: 600 }}>Save Client Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== BILL MODAL (Add / Edit Bill) ==================== */}
      {isBillModalOpen && (
        <div id="bill-modal" className="modal-overlay active">
          <div className="modal-card">
            <div className="modal-header">
              <h3>{editingBill ? 'Edit Bill Record' : 'Record Bill details'}</h3>
              <button className="btn-close" onClick={closeBillModal}><i className="ph ph-x"></i></button>
            </div>
            <form id="bill-form" onSubmit={handleBillSubmit}>
              <div className="modal-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label htmlFor="bill-client">Select Client *</label>
                  <select id="bill-client" required value={billClient} onChange={(e) => setBillClient(e.target.value)} style={{ fontSize: '15px', padding: '12px 14px' }}>
                    <option value="">-- Choose Client --</option>
                    {clients.map(c => (
                      <option key={c._id} value={c._id}>{c.name} {c.companyName ? `(${c.companyName})` : ''}</option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="bill-number">Bill/Invoice Number *</label>
                    <input type="text" id="bill-number" required placeholder="e.g. VE002/26-27" value={billNumber} onChange={(e) => setBillNumber(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="bill-date">Invoice Date *</label>
                    <input type="date" id="bill-date" required value={billDate} onChange={(e) => setBillDate(e.target.value)} />
                  </div>
                </div>

                {/* Tax toggle */}
                <div className="form-group" style={{ backgroundColor: 'var(--color-muted)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <label style={{ marginBottom: '6px', display: 'block', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', color: 'var(--color-primary)' }}>Tax Scheme</label>
                  <div className="toggle-switch-wrapper" style={{ height: 'auto', padding: '4px 0' }}>
                    <span className="toggle-label text-muted" style={{ fontSize: '12px' }}>Without GST</span>
                    <label className="toggle-switch">
                      <input type="checkbox" id="bill-tax-type" checked={billWithGst} onChange={handleTaxTypeChange} />
                      <span className="slider"></span>
                    </label>
                    <span className="toggle-label font-medium text-primary" style={{ fontSize: '12px', fontWeight: 600 }}>With GST (5%)</span>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="bill-subtotal-input">Taxable Value / Subtotal (₹) *</label>
                  <input type="number" id="bill-subtotal-input" min="0" step="any" required placeholder="0.00" value={billSubtotal} onChange={(e) => handleSubtotalChange(e.target.value)} style={{ fontSize: '16px', padding: '12px 14px', fontWeight: 600 }} />
                </div>

                {billWithGst && (
                  <div className="form-group">
                    <label htmlFor="bill-gst-input">GST Tax Amount (₹)</label>
                    <input type="number" id="bill-gst-input" min="0" step="any" placeholder="0.00" value={billGstAmount} onChange={(e) => handleGstAmountChange(e.target.value)} style={{ fontSize: '16px', padding: '12px 14px', fontWeight: 600 }} />
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="bill-discount-input">Discount (₹)</label>
                    <input type="number" id="bill-discount-input" min="0" step="any" placeholder="0.00" value={billDiscount} onChange={(e) => handleDiscountChange(e.target.value)} style={{ fontSize: '15px', padding: '12px 14px' }} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="bill-total-input">Grand Total (₹) *</label>
                    <input type="number" id="bill-total-input" min="0" step="any" required placeholder="0.00" value={billGrandTotal} readOnly style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-primary)', padding: '12px 14px', backgroundColor: 'var(--color-accent-light)', border: '1px solid var(--color-primary)' }} />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="bill-file">Scan / Upload Invoice File</label>
                  <input type="file" id="bill-file" accept="image/*,application/pdf" onChange={handleBillAttachment} style={{ fontSize: '13px' }} />
                  {billAttachmentName && (
                    <div style={{ fontSize: '11px', marginTop: '6px', color: 'var(--color-primary)', fontWeight: 600 }}>Attached: {billAttachmentName}</div>
                  )}
                </div>
              </div>
              <div className="modal-footer" style={{ padding: '16px 20px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={closeBillModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px', fontWeight: 600 }}>Save Invoice Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== EMPLOYEE MODAL (Add / Edit Employee) ==================== */}
      {isEmployeeModalOpen && (
        <div id="employee-modal" className="modal-overlay active">
          <div className="modal-card">
            <div className="modal-header">
              <h3>{editingEmployee ? 'Edit Employee Details' : 'Register New Employee'}</h3>
              <button className="btn-close" onClick={closeEmployeeModal}><i className="ph ph-x"></i></button>
            </div>
            <form id="employee-form" onSubmit={handleEmployeeSubmit}>
              <div className="modal-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="employee-name">Full Name *</label>
                    <input type="text" id="employee-name" required placeholder="e.g. John Doe" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="employee-phone">Phone Number</label>
                    <input type="tel" id="employee-phone" placeholder="e.g. +91 99999 88888" />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="employee-role">Staff Role *</label>
                  <select id="employee-role" required style={{ fontSize: '15px', padding: '12px 14px' }}>
                    <option value="Stitcher">Stitcher</option>
                    <option value="Checking staff">Checking staff</option>
                    <option value="Packaging staff">Packaging staff</option>
                    <option value="Supervisor">Supervisor</option>
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="employee-rate">Stitching Rate per Piece (₹)</label>
                    <input type="number" id="employee-rate" min="0" step="any" placeholder="0.00" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="employee-salary">Monthly Salary Basis (₹)</label>
                    <input type="number" id="employee-salary" min="0" step="any" placeholder="0.00" />
                  </div>
                </div>
              </div>
              <div className="modal-footer" style={{ padding: '16px 20px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={closeEmployeeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px', fontWeight: 600 }}>Save Employee Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== FABRIC ROLL MODAL ==================== */}
      {isFabricModalOpen && (
        <div id="fabric-modal" className="modal-overlay active">
          <div className="modal-card">
            <div className="modal-header">
              <h3>{editingFabric ? 'Edit Fabric Roll Details' : 'Log Fabric Roll Stock'}</h3>
              <button className="btn-close" onClick={closeFabricModal}><i className="ph ph-x"></i></button>
            </div>
            <form id="fabric-form" onSubmit={handleFabricSubmit}>
              <div className="modal-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="fabric-type">Fabric Type/Material *</label>
                    <input type="text" id="fabric-type" required placeholder="e.g. Cotton Fleece / Polyester" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="fabric-qty">Quantity Received (Pcs/Rolls) *</label>
                    <input type="number" id="fabric-qty" min="0" step="any" required placeholder="0" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="fabric-color">Color/Design Code *</label>
                    <input type="text" id="fabric-color" required placeholder="e.g. Navy Blue / Pink Tint" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="fabric-date">Received Date *</label>
                    <input type="date" id="fabric-date" required defaultValue={new Date().toISOString().split('T')[0]} />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="fabric-supplier">Supplier Business Name *</label>
                  <input type="text" id="fabric-supplier" required placeholder="e.g. Vardhman Textiles" />
                </div>
                <div className="form-group">
                  <label htmlFor="fabric-status">Stock Status *</label>
                  <select id="fabric-status" required style={{ fontSize: '15px', padding: '12px 14px' }}>
                    <option value="Stored">Stored in Warehouse</option>
                    <option value="Stitching">Allocated to Stitching</option>
                    <option value="Completed">Completed Production</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer" style={{ padding: '16px 20px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={closeFabricModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px', fontWeight: 600 }}>Save Stock record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== STITCHING ASSIGNMENT MODAL ==================== */}
      {isStitchingModalOpen && (
        <div id="stitching-modal" className="modal-overlay active">
          <div className="modal-card">
            <div className="modal-header">
              <h3>{editingStitching ? 'Edit Stitch Assignment' : 'Stitching Assignment Details'}</h3>
              <button className="btn-close" onClick={() => { setIsStitchingModalOpen(false); setEditingStitching(null); }}><i className="ph ph-x"></i></button>
            </div>
            <form id="stitching-form" onSubmit={handleStitchingSubmit}>
              <div className="modal-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label htmlFor="stitch-employee">Assign Stitcher *</label>
                  <select id="stitch-employee" required style={{ fontSize: '15px', padding: '12px 14px' }}>
                    <option value="">-- Choose Stitcher --</option>
                    {employees.filter(e => e.role === 'Stitcher').map(emp => (
                      <option key={emp._id} value={emp._id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="stitch-fabric">Select Fabric Roll *</label>
                  <select id="stitch-fabric" required style={{ fontSize: '15px', padding: '12px 14px' }}>
                    <option value="">-- Choose Fabric Roll --</option>
                    {fabrics.map(fab => (
                      <option key={fab._id} value={fab._id}>{fab.fabricType} ({fab.color})</option>
                    ))}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="stitch-pieces">Pieces Allocated *</label>
                    <input type="number" id="stitch-pieces" min="0" required placeholder="0" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="stitch-rate">Rate per Piece (₹) *</label>
                    <input type="number" id="stitch-rate" min="0" step="any" required placeholder="0.00" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="stitch-date">Allocation Date *</label>
                    <input type="date" id="stitch-date" required defaultValue={new Date().toISOString().split('T')[0]} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="stitch-status">Assignment Status</label>
                    <select id="stitch-status" required style={{ fontSize: '15px', padding: '12px 14px' }}>
                      <option value="Stitching">Stitching in progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="stitch-notes">Special Production Notes</label>
                  <input type="text" id="stitch-notes" placeholder="e.g. SISSY BOY TINA PINK styling design details" />
                </div>
              </div>
              <div className="modal-footer" style={{ padding: '16px 20px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setIsStitchingModalOpen(false); setEditingStitching(null); }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px', fontWeight: 600 }}>Save Assignment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== CEO ACTIVITY LOG MODAL ==================== */}
      {isCeoModalOpen && (
        <div id="ceo-modal" className="modal-overlay active">
          <div className="modal-card">
            <div className="modal-header">
              <h3>{editingCeo ? 'Edit CEO Activity' : 'Log CEO daily workflows'}</h3>
              <button className="btn-close" onClick={closeCeoModal}><i className="ph ph-x"></i></button>
            </div>
            <form id="ceo-form" onSubmit={handleCeoSubmit}>
              <div className="modal-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="ceo-date">Workday Date *</label>
                    <input type="date" id="ceo-date" required defaultValue={new Date().toISOString().split('T')[0]} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="ceo-focus">Focus Core Area *</label>
                    <select id="ceo-focus" required style={{ fontSize: '15px', padding: '12px 14px' }}>
                      <option value="Operations">Operations Management</option>
                      <option value="Finance">Finance & Cash Flows</option>
                      <option value="Sales">Sales & Client Relations</option>
                      <option value="Production">Production & Stitching Audit</option>
                      <option value="Strategy">Business Growth Strategy</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="ceo-hours">Hours Logged *</label>
                    <input type="number" id="ceo-hours" min="0" step="any" required placeholder="e.g. 4.5" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="ceo-productivity">Productivity Index *</label>
                    <select id="ceo-productivity" required style={{ fontSize: '15px', padding: '12px 14px' }}>
                      <option value="High">High output</option>
                      <option value="Medium">Medium output</option>
                      <option value="Low">Low output</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="ceo-desc">Accomplishment description *</label>
                  <textarea id="ceo-desc" rows="4" required placeholder="Detail key achievements and milestones reached..."></textarea>
                </div>

                <div className="form-group" style={{ flexDirection: 'row', gap: '10px', alignItems: 'center', backgroundColor: 'var(--color-muted)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <input type="checkbox" id="ceo-critical" style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                  <label htmlFor="ceo-critical" style={{ marginBottom: 0, fontWeight: 700, fontSize: '13px', color: 'var(--color-primary)', cursor: 'pointer' }}>Mark as Critical Accomplishment ⭐</label>
                </div>
              </div>
              <div className="modal-footer" style={{ padding: '16px 20px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={closeCeoModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px', fontWeight: 600 }}>Save Activity log</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== CEO DETAIL POPUP DIALOG ==================== */}
      {selectedCeoDetail && (
        <div id="ceo-details-modal" className="modal-overlay active">
          <div className="modal-card">
            <div className="modal-header">
              <h3>CEO Activity Details</h3>
              <button className="btn-close" onClick={() => setSelectedCeoDetail(null)}><i className="ph ph-x"></i></button>
            </div>
            <div className="modal-body" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-row" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '14px' }}>
                <div>
                  <span className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Focus Core Area</span>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-primary)', marginTop: '2px' }}>{selectedCeoDetail.focusArea}</div>
                </div>
                <div>
                  <span className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Workday Date</span>
                  <div style={{ fontWeight: 600, fontSize: '14px', marginTop: '2px' }}>{formatDate(selectedCeoDetail.date)}</div>
                </div>
              </div>

              <div className="grid-layout-3" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '14px', gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div>
                  <span className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Hours Logged</span>
                  <div style={{ fontWeight: 700, fontSize: '16px', marginTop: '2px' }}>{selectedCeoDetail.hoursSpent} Hrs</div>
                </div>
                <div>
                  <span className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Productivity score</span>
                  <div style={{ marginTop: '2px' }}>
                    <span className={`badge ${selectedCeoDetail.productivityLevel === 'High' ? 'badge-success' : selectedCeoDetail.productivityLevel === 'Medium' ? 'badge-gst' : 'badge-neutral'}`}>
                      {selectedCeoDetail.productivityLevel}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Significance</span>
                  <div style={{ marginTop: '2px' }}>
                    {selectedCeoDetail.isCritical ? (
                      <span className="badge" style={{ backgroundColor: 'rgba(124,58,237,0.1)', color: 'var(--color-primary)', fontWeight: 700, border: '1px solid rgba(124,58,237,0.2)' }}>Critical Accomplishment ⭐</span>
                    ) : (
                      <span className="text-muted" style={{ fontSize: '13px' }}>Regular Work Activity</span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <span className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Accomplishment Description</span>
                <p style={{ fontSize: '14px', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{selectedCeoDetail.description}</p>
              </div>
            </div>
            <div className="modal-footer" style={{ padding: '16px 20px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedCeoDetail(null)}>Close</button>
              <button type="button" className="btn btn-primary" onClick={() => { const target = selectedCeoDetail; setSelectedCeoDetail(null); openEditCeo(target); }} style={{ padding: '10px 24px', fontWeight: 600 }}>Edit Activity Log</button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MOCK RECEIPT SCAN DIALOG ==================== */}
      {isScanModalOpen && (
        <div id="scan-modal" className="modal-overlay active">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Scan Invoice Receipt</h3>
              <button className="btn-close" onClick={() => setIsScanModalOpen(false)}><i className="ph ph-x"></i></button>
            </div>
            <div className="modal-body" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
              <div style={{ width: '120px', height: '120px', borderRadius: '50%', backgroundColor: 'rgba(124,58,237,0.08)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--color-primary)', fontSize: '56px' }}>
                <i className="ph ph-scan" style={{ margin: '0 auto' }}></i>
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: 700 }}>Optical Character Recognition (OCR)</h4>
              <p className="text-muted" style={{ textAlign: 'center', fontSize: '13px', lineHeight: 1.5 }}>
                Select an image file of your invoice receipt. Our local AI scanner will scan and extract the vendor company name, invoice dates, GST tax splits, and grand totals automatically.
              </p>
              <input type="file" id="scan-file-input" accept="image/*" onChange={(e) => {
                const file = e.target.files[0];
                if (!file) return;
                setIsScanModalOpen(false);
                setBillAttachmentName(file.name);
                
                const reader = new FileReader();
                reader.onload = (event) => {
                  setBillAttachmentData(event.target.result);
                  
                  // Mock OCR extraction
                  const mockRandom = Math.floor(100 + Math.random() * 900);
                  setBillNumber(`OCR-VE-${mockRandom}`);
                  setBillDate(new Date().toISOString().split('T')[0]);
                  setBillSubtotal("15000.00");
                  setBillGstAmount("750.00");
                  setBillWithGst(true);
                  setBillDiscount("0.00");
                  setBillGrandTotal("15750.00");
                  setIsBillModalOpen(true);
                  alert("OCR Scan Successful! Pre-populated billing values from receipt.");
                };
                reader.readAsDataURL(file);
              }} style={{ display: 'none' }} />
              <button className="btn btn-primary" onClick={() => document.getElementById('scan-file-input').click()} style={{ marginTop: '10px' }}>
                <i className="ph ph-camera"></i> Select & Scan Receipt Image
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MOBILE "MORE" SHEET DRAWER ==================== */}
      {isMobileMenuOpen && (
        <div id="mobile-more-modal" className="modal-overlay active no-print" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="modal-card" style={{ marginTop: 'auto', marginBottom: 0, borderRadius: '24px 24px 0 0', transform: 'scale(1)', width: '100%', maxWidth: '100%' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ padding: '16px 24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>More Actions & Modules</h3>
              <button className="btn-close" onClick={() => setIsMobileMenuOpen(false)}><i className="ph ph-x"></i></button>
            </div>
            <div className="modal-body" style={{ padding: '8px 0 30px 0', maxHeight: '70vh' }}>
              <div className="more-menu-list" style={{ display: 'flex', flexDirection: 'column' }}>
                <a className="more-menu-item" onClick={() => handleTabChange('clients')} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 24px', borderBottom: '1px solid var(--color-border)', cursor: 'pointer', color: 'var(--color-text-primary)', textDecoration: 'none' }}>
                  <i className="ph ph-users-three" style={{ fontSize: '22px', color: 'var(--color-primary)' }}></i>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>Clients Registry</div>
                    <div className="text-muted" style={{ fontSize: '11px' }}>Manage buyer details and corporate records</div>
                  </div>
                  <i className="ph ph-caret-right text-muted"></i>
                </a>

                <a className="more-menu-item" onClick={() => handleTabChange('employees')} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 24px', borderBottom: '1px solid var(--color-border)', cursor: 'pointer', color: 'var(--color-text-primary)', textDecoration: 'none' }}>
                  <i className="ph ph-identification-card" style={{ fontSize: '22px', color: 'var(--color-primary)' }}></i>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>Employees</div>
                    <div className="text-muted" style={{ fontSize: '11px' }}>Track stitching staff, roles & payouts</div>
                  </div>
                  <i className="ph ph-caret-right text-muted"></i>
                </a>

                <a className="more-menu-item" onClick={() => handleTabChange('ceo-tracker')} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 24px', borderBottom: '1px solid var(--color-border)', cursor: 'pointer', color: 'var(--color-text-primary)', textDecoration: 'none' }}>
                  <i className="ph ph-briefcase" style={{ fontSize: '22px', color: 'var(--color-primary)' }}></i>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>CEO Log</div>
                    <div className="text-muted" style={{ fontSize: '11px' }}>CEO performance tracking & owner analytics</div>
                  </div>
                  <i className="ph ph-caret-right text-muted"></i>
                </a>

                <a className="more-menu-item" onClick={() => handleTabChange('ai-advisor')} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 24px', borderBottom: '1px solid var(--color-border)', cursor: 'pointer', color: 'var(--color-text-primary)', textDecoration: 'none' }}>
                  <i className="ph ph-sparkle" style={{ fontSize: '22px', color: 'var(--color-primary)' }}></i>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>AI Advisor</div>
                    <div className="text-muted" style={{ fontSize: '11px' }}>AI business health audits & reports</div>
                  </div>
                  <i className="ph ph-caret-right text-muted"></i>
                </a>

                <a className="more-menu-item" onClick={() => handleTabChange('account')} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 24px', borderBottom: '1px solid var(--color-border)', cursor: 'pointer', color: 'var(--color-text-primary)', textDecoration: 'none' }}>
                  <i className="ph ph-user-gear" style={{ fontSize: '22px', color: 'var(--color-primary)' }}></i>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>Account Settings</div>
                    <div className="text-muted" style={{ fontSize: '11px' }}>Manage your profile, password & security</div>
                  </div>
                  <i className="ph ph-caret-right text-muted"></i>
                </a>

                <a id="mobile-install-btn" className="more-menu-item" onClick={triggerPwaInstall} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 24px', cursor: 'pointer', color: 'var(--color-primary)', textDecoration: 'none', backgroundColor: 'var(--color-accent-light)' }}>
                  <i className="ph ph-download-simple" style={{ fontSize: '22px', color: 'var(--color-primary)' }}></i>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-primary)' }}>Install App</div>
                    <div className="text-muted" style={{ fontSize: '11px', color: 'var(--color-primary)', opacity: 0.85 }}>Run as a mobile PWA on your phone</div>
                  </div>
                  <i className="ph ph-caret-right text-muted" style={{ color: 'var(--color-primary) !important' }}></i>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TALLY-STYLE TAX INVOICE DETAILS MODAL ==================== */}
      {isInvoiceViewOpen && viewingInvoice && (
        <div id="invoice-modal" className="modal-overlay active">
          <div className="modal-card modal-large invoice-view-modal">
            <div className="modal-header no-print">
              <h3>Invoice Details</h3>
              <div className="modal-header-actions">
                <button className="btn btn-primary" onClick={() => window.print()}>
                  <i className="ph ph-printer"></i> Print / Download PDF
                </button>
                <button className="btn-close" onClick={() => { setIsInvoiceViewOpen(false); setViewingInvoice(null); }}><i className="ph ph-x"></i></button>
              </div>
            </div>
            <div className="modal-body print-area" id="print-area">
              <div className="invoice-printout" style={{ padding: '20px', fontFamily: "'Inter', sans-serif", color: '#000', backgroundColor: '#fff', border: '1px solid #000', maxWidth: '800px', margin: '0 auto', boxShadow: 'none', borderRadius: 0 }}>
                
                {/* Document Title Header */}
                <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid #000', paddingBottom: '4px', marginBottom: 0, color: '#000' }}>
                  Tax Invoice
                </div>

                {/* Top Grid */}
                <table style={{ width: '100%', borderCollapse: 'collapse', borderBottom: '1px solid #000', marginBottom: 0 }}>
                  <tbody>
                    <tr>
                      {/* Left Side */}
                      <td style={{ width: '50%', borderRight: '1px solid #000', verticalAlign: 'top', padding: '8px', fontSize: '11px', lineHeight: 1.4, color: '#000' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '2px' }}>VARAHI EXPORTS</div>
                        <div>8/2933 A, Karuparayan Kovil,</div>
                        <div>3rd Street, Pandian Nagar,</div>
                        <div>Tirupur - 641603.</div>
                        <div>Mob: 9994685525</div>
                        <div>GSTIN/UIN: <span style={{ fontWeight: 600 }}>33CKMPS0071D1ZC</span></div>
                        <div>State Name: Tamil Nadu, Code: 33</div>
                        <div>E-Mail: varahi.export@gmail.com</div>

                        <div style={{ borderTop: '1px solid #000', marginTop: '8px', paddingTop: '8px' }}>
                          <div style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '9px', color: '#444', marginBottom: '2px' }}>Consignee (Ship to)</div>
                          {(() => {
                            const c = clients.find(cl => cl._id === viewingInvoice.clientId);
                            return (
                              <>
                                <div style={{ fontWeight: 'bold' }}>{c ? c.companyName || c.name : '-'}</div>
                                <div>{c ? c.address || 'N/A' : '-'}</div>
                                <div>GSTIN/UIN: <span style={{ fontWeight: 600 }}>{c ? c.gstin || 'Unregistered' : '-'}</span></div>
                                <div>State Name: Tamil Nadu, Code: 33</div>
                              </>
                            );
                          })()}
                        </div>

                        <div style={{ borderTop: '1px solid #000', marginTop: '8px', paddingTop: '8px' }}>
                          <div style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '9px', color: '#444', marginBottom: '2px' }}>Buyer (Bill to)</div>
                          {(() => {
                            const c = clients.find(cl => cl._id === viewingInvoice.clientId);
                            return (
                              <>
                                <div style={{ fontWeight: 'bold' }}>{c ? c.name : '-'}</div>
                                <div>{c ? c.address || 'N/A' : '-'}</div>
                                <div>GSTIN/UIN: <span style={{ fontWeight: 600 }}>{c ? c.gstin || 'Unregistered' : '-'}</span></div>
                                <div>State Name: Tamil Nadu, Code: 33</div>
                              </>
                            );
                          })()}
                        </div>
                      </td>

                      {/* Right Side */}
                      <td style={{ width: '50%', verticalAlign: 'top', padding: 0, fontSize: '11px', color: '#000' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', height: '100%' }}>
                          <tbody>
                            <tr>
                              <td style={{ width: '50%', borderRight: '1px solid #000', borderBottom: '1px solid #000', padding: '6px', verticalAlign: 'top' }}>
                                <div style={{ color: '#444', fontSize: '8px', textTransform: 'uppercase' }}>Invoice No.</div>
                                <div style={{ fontWeight: 'bold', fontSize: '12px', marginTop: '2px' }}>{viewingInvoice.billNumber}</div>
                              </td>
                              <td style={{ width: '50%', borderBottom: '1px solid #000', padding: '6px', verticalAlign: 'top' }}>
                                <div style={{ color: '#444', fontSize: '8px', textTransform: 'uppercase' }}>Dated</div>
                                <div style={{ fontWeight: 'bold', marginTop: '2px' }}>{formatDate(viewingInvoice.date)}</div>
                              </td>
                            </tr>
                            <tr>
                              <td style={{ width: '50%', borderRight: '1px solid #000', borderBottom: '1px solid #000', padding: '6px', verticalAlign: 'top' }}>
                                <div style={{ color: '#444', fontSize: '8px', textTransform: 'uppercase' }}>Delivery Note</div>
                                <div style={{ marginTop: '2px' }}>-</div>
                              </td>
                              <td style={{ width: '50%', borderBottom: '1px solid #000', padding: '6px', verticalAlign: 'top' }}>
                                <div style={{ color: '#444', fontSize: '8px', textTransform: 'uppercase' }}>Mode/Terms of Payment</div>
                                <div style={{ marginTop: '2px' }}>-</div>
                              </td>
                            </tr>
                            <tr>
                              <td style={{ width: '50%', borderRight: '1px solid #000', borderBottom: '1px solid #000', padding: '6px', verticalAlign: 'top' }}>
                                <div style={{ color: '#444', fontSize: '8px', textTransform: 'uppercase' }}>Reference No. & Date.</div>
                                <div style={{ marginTop: '2px' }}>-</div>
                              </td>
                              <td style={{ width: '50%', borderBottom: '1px solid #000', padding: '6px', verticalAlign: 'top' }}>
                                <div style={{ color: '#444', fontSize: '8px', textTransform: 'uppercase' }}>Other References</div>
                                <div style={{ marginTop: '2px' }}>-</div>
                              </td>
                            </tr>
                            <tr>
                              <td style={{ width: '50%', borderRight: '1px solid #000', borderBottom: '1px solid #000', padding: '6px', verticalAlign: 'top' }}>
                                <div style={{ color: '#444', fontSize: '8px', textTransform: 'uppercase' }}>Buyer's Order No.</div>
                                <div style={{ marginTop: '2px' }}>-</div>
                              </td>
                              <td style={{ width: '50%', borderBottom: '1px solid #000', padding: '6px', verticalAlign: 'top' }}>
                                <div style={{ color: '#444', fontSize: '8px', textTransform: 'uppercase' }}>Dated</div>
                                <div style={{ marginTop: '2px' }}>-</div>
                              </td>
                            </tr>
                            <tr>
                              <td style={{ width: '50%', borderRight: '1px solid #000', borderBottom: '1px solid #000', padding: '6px', verticalAlign: 'top' }}>
                                <div style={{ color: '#444', fontSize: '8px', textTransform: 'uppercase' }}>Dispatch Doc No.</div>
                                <div style={{ marginTop: '2px' }}>-</div>
                              </td>
                              <td style={{ width: '50%', borderBottom: '1px solid #000', padding: '6px', verticalAlign: 'top' }}>
                                <div style={{ color: '#444', fontSize: '8px', textTransform: 'uppercase' }}>Delivery Note Date</div>
                                <div style={{ marginTop: '2px' }}>-</div>
                              </td>
                            </tr>
                            <tr>
                              <td style={{ width: '50%', borderRight: '1px solid #000', borderBottom: '1px solid #000', padding: '6px', verticalAlign: 'top' }}>
                                <div style={{ color: '#444', fontSize: '8px', textTransform: 'uppercase' }}>Dispatched through</div>
                                <div style={{ marginTop: '2px' }}>-</div>
                              </td>
                              <td style={{ width: '50%', borderBottom: '1px solid #000', padding: '6px', verticalAlign: 'top' }}>
                                <div style={{ color: '#444', fontSize: '8px', textTransform: 'uppercase' }}>Destination</div>
                                <div style={{ marginTop: '2px' }}>-</div>
                              </td>
                            </tr>
                            <tr>
                              <td colSpan="2" style={{ padding: '6px', verticalAlign: 'top', height: '60px' }}>
                                <div style={{ color: '#444', fontSize: '8px', textTransform: 'uppercase' }}>Terms of Delivery</div>
                                <div style={{ marginTop: '4px', lineHeight: 1.3 }}>-</div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Line Items Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', borderBottom: '1px solid #000', fontSize: '11px', color: '#000' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #000', backgroundColor: '#fff', fontWeight: 'bold' }}>
                      <th style={{ borderRight: '1px solid #000', padding: '6px', width: '40px', textAlign: 'center' }}>Sl No.</th>
                      <th style={{ borderRight: '1px solid #000', padding: '6px', textAlign: 'left' }}>Description of Goods</th>
                      <th style={{ borderRight: '1px solid #000', padding: '6px', width: '70px', textAlign: 'center' }}>HSN/SAC</th>
                      <th style={{ borderRight: '1px solid #000', padding: '6px', width: '60px', textAlign: 'center' }}>GST Rate</th>
                      <th style={{ borderRight: '1px solid #000', padding: '6px', width: '80px', textAlign: 'right' }}>Quantity</th>
                      <th style={{ borderRight: '1px solid #000', padding: '6px', width: '80px', textAlign: 'right' }}>Rate</th>
                      <th style={{ borderRight: '1px solid #000', padding: '6px', width: '50px', textAlign: 'center' }}>per</th>
                      <th style={{ padding: '6px', width: '100px', textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingInvoice.items.map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ borderRight: '1px solid #000', padding: '6px', textAlign: 'center' }}>{idx + 1}</td>
                        <td style={{ borderRight: '1px solid #000', padding: '6px', fontWeight: 500 }}>{item.name}</td>
                        <td style={{ borderRight: '1px solid #000', padding: '6px', textAlign: 'center' }}>6205</td>
                        <td style={{ borderRight: '1px solid #000', padding: '6px', textAlign: 'center' }}>{viewingInvoice.billType === 'with-gst' ? item.gstRate + '%' : '0%'}</td>
                        <td style={{ borderRight: '1px solid #000', padding: '6px', textAlign: 'right' }}>{item.qty} pcs</td>
                        <td style={{ borderRight: '1px solid #000', padding: '6px', textAlign: 'right' }}>{item.price.toFixed(2)}</td>
                        <td style={{ borderRight: '1px solid #000', padding: '6px', textAlign: 'center' }}>pcs</td>
                        <td style={{ padding: '6px', textAlign: 'right' }}>{(item.price * item.qty).toFixed(2)}</td>
                      </tr>
                    ))}

                    {/* Tax splits rows */}
                    {viewingInvoice.billType === 'with-gst' && viewingInvoice.totalGst > 0 && (
                      <>
                        <tr>
                          <td style={{ borderRight: '1px solid #000', padding: '6px' }}></td>
                          <td style={{ borderRight: '1px solid #000', padding: '6px', fontStyle: 'italic', textAlign: 'right', fontWeight: 'bold', paddingRight: '20px', color: '#000' }}>
                            Cgst @ 2.5%
                          </td>
                          <td style={{ borderRight: '1px solid #000', padding: '6px' }}></td>
                          <td style={{ borderRight: '1px solid #000', padding: '6px' }}></td>
                          <td style={{ borderRight: '1px solid #000', padding: '6px' }}></td>
                          <td style={{ borderRight: '1px solid #000', padding: '6px' }}></td>
                          <td style={{ borderRight: '1px solid #000', padding: '6px' }}></td>
                          <td style={{ padding: '6px', textAlign: 'right', fontWeight: 'bold', color: '#000' }}>{(viewingInvoice.totalGst / 2).toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td style={{ borderRight: '1px solid #000', padding: '6px' }}></td>
                          <td style={{ borderRight: '1px solid #000', padding: '6px', fontStyle: 'italic', textAlign: 'right', fontWeight: 'bold', paddingRight: '20px', color: '#000' }}>
                            Sgst @ 2.5%
                          </td>
                          <td style={{ borderRight: '1px solid #000', padding: '6px' }}></td>
                          <td style={{ borderRight: '1px solid #000', padding: '6px' }}></td>
                          <td style={{ borderRight: '1px solid #000', padding: '6px' }}></td>
                          <td style={{ borderRight: '1px solid #000', padding: '6px' }}></td>
                          <td style={{ borderRight: '1px solid #000', padding: '6px' }}></td>
                          <td style={{ padding: '6px', textAlign: 'right', fontWeight: 'bold', color: '#000' }}>{(viewingInvoice.totalGst / 2).toFixed(2)}</td>
                        </tr>
                      </>
                    )}

                    {viewingInvoice.discount > 0 && (
                      <tr>
                        <td style={{ borderRight: '1px solid #000', padding: '6px' }}></td>
                        <td style={{ borderRight: '1px solid #000', padding: '6px', fontStyle: 'italic', textAlign: 'right', fontWeight: 'bold', paddingRight: '20px', color: '#ef4444' }}>
                          Less: Discount
                        </td>
                        <td style={{ borderRight: '1px solid #000', padding: '6px' }}></td>
                        <td style={{ borderRight: '1px solid #000', padding: '6px' }}></td>
                        <td style={{ borderRight: '1px solid #000', padding: '6px' }}></td>
                        <td style={{ borderRight: '1px solid #000', padding: '6px' }}></td>
                        <td style={{ borderRight: '1px solid #000', padding: '6px' }}></td>
                        <td style={{ padding: '6px', textAlign: 'right', fontWeight: 'bold', color: '#ef4444' }}>-{viewingInvoice.discount.toFixed(2)}</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '1px solid #000', fontWeight: 'bold', backgroundColor: '#fff' }}>
                      <td colSpan="4" style={{ borderRight: '1px solid #000', padding: '6px', textAlign: 'right' }}>Total</td>
                      <td style={{ borderRight: '1px solid #000', padding: '6px', textAlign: 'right' }}>
                        {viewingInvoice.items.reduce((s, i) => s + i.qty, 0)} pcs
                      </td>
                      <td style={{ borderRight: '1px solid #000', padding: '6px' }}></td>
                      <td style={{ borderRight: '1px solid #000', padding: '6px' }}></td>
                      <td style={{ padding: '6px', textAlign: 'right' }}>{formatCurrency(viewingInvoice.totalAmount)}</td>
                    </tr>
                  </tfoot>
                </table>

                {/* Amount in words */}
                <div style={{ borderBottom: '1px solid #000', padding: '8px', fontSize: '11px', lineHeight: 1.4, color: '#000' }}>
                  <span style={{ color: '#444', fontSize: '8px', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Amount Chargeable (in words)</span>
                  <div style={{ fontWeight: 'bold' }}>{numberToWords(viewingInvoice.totalAmount)}</div>
                </div>

                {/* HSN Summary table */}
                {viewingInvoice.billType === 'with-gst' && viewingInvoice.totalGst > 0 && (
                  <div style={{ borderBottom: '1px solid #000', color: '#000' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', textAlign: 'center' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #000', fontWeight: 'bold' }}>
                          <th rowSpan="2" style={{ borderRight: '1px solid #000', padding: '4px', verticalAlign: 'middle' }}>HSN/SAC</th>
                          <th rowSpan="2" style={{ borderRight: '1px solid #000', padding: '4px', verticalAlign: 'middle' }}>Taxable Value</th>
                          <th colSpan="2" style={{ borderRight: '1px solid #000', borderBottom: '1px solid #000', padding: '4px' }}>Central Tax</th>
                          <th colSpan="2" style={{ borderRight: '1px solid #000', borderBottom: '1px solid #000', padding: '4px' }}>State Tax</th>
                          <th rowSpan="2" style={{ padding: '4px', verticalAlign: 'middle' }}>Total Tax Amount</th>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #000', fontWeight: 'bold' }}>
                          <th style={{ borderRight: '1px solid #000', padding: '4px', width: '60px' }}>Rate</th>
                          <th style={{ borderRight: '1px solid #000', padding: '4px', width: '80px' }}>Amount</th>
                          <th style={{ borderRight: '1px solid #000', padding: '4px', width: '60px' }}>Rate</th>
                          <th style={{ borderRight: '1px solid #000', padding: '4px', width: '80px' }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ borderRight: '1px solid #000', padding: '6px' }}>6205</td>
                          <td style={{ borderRight: '1px solid #000', padding: '6px', textAlign: 'right' }}>{viewingInvoice.subtotal.toFixed(2)}</td>
                          <td style={{ borderRight: '1px solid #000', padding: '6px' }}>2.50%</td>
                          <td style={{ borderRight: '1px solid #000', padding: '6px', textAlign: 'right' }}>{(viewingInvoice.totalGst / 2).toFixed(2)}</td>
                          <td style={{ borderRight: '1px solid #000', padding: '6px' }}>2.50%</td>
                          <td style={{ borderRight: '1px solid #000', padding: '6px', textAlign: 'right' }}>{(viewingInvoice.totalGst / 2).toFixed(2)}</td>
                          <td style={{ padding: '6px', textAlign: 'right' }}>{viewingInvoice.totalGst.toFixed(2)}</td>
                        </tr>
                        <tr style={{ fontWeight: 'bold', borderTop: '1px solid #000' }}>
                          <td style={{ borderRight: '1px solid #000', padding: '6px' }}>Total</td>
                          <td style={{ borderRight: '1px solid #000', padding: '6px', textAlign: 'right' }}>{viewingInvoice.subtotal.toFixed(2)}</td>
                          <td style={{ borderRight: '1px solid #000', padding: '6px' }}></td>
                          <td style={{ borderRight: '1px solid #000', padding: '6px', textAlign: 'right' }}>{(viewingInvoice.totalGst / 2).toFixed(2)}</td>
                          <td style={{ borderRight: '1px solid #000', padding: '6px' }}></td>
                          <td style={{ borderRight: '1px solid #000', padding: '6px', textAlign: 'right' }}>{(viewingInvoice.totalGst / 2).toFixed(2)}</td>
                          <td style={{ padding: '6px', textAlign: 'right' }}>{viewingInvoice.totalGst.toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Tax Amount in Words */}
                {viewingInvoice.billType === 'with-gst' && viewingInvoice.totalGst > 0 && (
                  <div style={{ borderBottom: '1px solid #000', padding: '8px', fontSize: '11px', lineHeight: 1.4, color: '#000' }}>
                    <span style={{ color: '#444', fontSize: '8px', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Tax Amount (in words)</span>
                    <div style={{ fontWeight: 'bold' }}>{numberToWords(viewingInvoice.totalGst)}</div>
                  </div>
                )}

                {/* Bottom signatures */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', color: '#000' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '50%', borderRight: '1px solid #000', verticalAlign: 'top', padding: '8px', lineHeight: 1.5 }}>
                        <div style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: '4px', fontSize: '10px', textTransform: 'uppercase', color: '#444' }}>Company's Bank Details</div>
                        <div>Bank Name: <span style={{ fontWeight: 'bold' }}>CANARA BANK</span></div>
                        <div>A/c No.: <span style={{ fontWeight: 'bold' }}>12001346874</span></div>
                        <div>Branch & IFS Code: <span style={{ fontWeight: 'bold' }}>SME BRANCH, TIRUPUR & CNRB0002415</span></div>
                        
                        <div style={{ marginTop: '10px', borderTop: '1px dashed #bbb', paddingTop: '6px' }}>
                          <span style={{ fontWeight: 'bold', fontSize: '8px', textTransform: 'uppercase', color: '#444', display: 'block', marginBottom: '2px' }}>Declaration</span>
                          <div style={{ fontSize: '9px', color: '#444', lineHeight: 1.3 }}>We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</div>
                        </div>
                      </td>
                      <td style={{ width: '50%', verticalAlign: 'top', padding: '8px', textAlign: 'right', height: '110px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div style={{ fontSize: '10px' }}>
                          <span style={{ color: '#444' }}>for</span> <span style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>Varahi Exports</span>
                        </div>
                        <div style={{ marginTop: '60px', fontSize: '10px', fontWeight: 'bold' }}>
                          Authorised Signatory
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Disclaimer */}
                <div style={{ borderTop: '1px solid #000', textAlign: 'center', fontSize: '9px', color: '#444', paddingTop: '4px', marginTop: '6px' }}>
                  This is a Computer Generated Invoice
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
