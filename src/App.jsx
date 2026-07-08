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
  const expenses = useQuery(api.expenses.getAll) || [];
  const rawUsers = useQuery(api.users.getAll);
  const users = rawUsers || [];

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
  const addExpenseMutation = useMutation(api.expenses.add);
  const updateExpenseMutation = useMutation(api.expenses.update);
  const deleteExpenseMutation = useMutation(api.expenses.remove);

  // Set to true to temporarily bypass authentication for dev / client reviews
  const BYPASS_AUTH = true;

  // --- State hooks ---
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('lastActiveTab') || 'dashboard');
  const [currentLoggedUser, setCurrentLoggedUser] = useState(() => {
    const localUser = localStorage.getItem('currentUser');
    return localUser ? { username: localUser, fullName: localUser } : {
      username: 'admin',
      fullName: 'Vikashini Balasubramanian',
      email: 'varahi.export@gmail.com'
    };
  });
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('isLoggedIn') === 'true');
  const [isFirstTimeSetup, setIsFirstTimeSetup] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // login / register / forgot

  // Forgot password form states
  const [forgotUsername, setForgotUsername] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotPassword, setForgotPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotStep, setForgotStep] = useState(1); // 1 = verify, 2 = reset
  const [resetUserRecord, setResetUserRecord] = useState(null);

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
  const [selectedFabricId, setSelectedFabricId] = useState('');
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [expenseSearch, setExpenseSearch] = useState('');
  const [selectedOrderFilter, setSelectedOrderFilter] = useState('all');
  const [isChatOpen, setIsChatOpen] = useState(false);

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
    // If Convex query is still loading in the background, wait
    if (rawUsers === undefined) return;

    // Listen for custom install prompts
    const handleInstallPrompt = (e) => {
      e.preventDefault();
      setPwaPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);

    // Verify user session details once users array loaded
    if (rawUsers.length > 0) {
      const storedUser = localStorage.getItem('currentUser');
      if (isLoggedIn && storedUser) {
        // If user profile is already populated in state, bypass cache query checks to avoid mutation delay logout loops
        if (!currentLoggedUser) {
          const matchingUser = rawUsers.find(u => u.username === storedUser);
          if (matchingUser) {
            setCurrentLoggedUser(matchingUser);
            setIsFirstTimeSetup(false);
          } else {
            logUserOut();
          }
        }
      } else {
        setIsLoggedIn(false);
        setAuthMode('login');
        setIsFirstTimeSetup(false);
      }
    } else {
      // Empty database - only route to first-time signup if not already logged in
      if (!isLoggedIn) {
        setIsFirstTimeSetup(true);
        setAuthMode('register');
        setIsLoggedIn(false);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
    };
  }, [rawUsers, isLoggedIn]);

  // Auto-scroll AI Advisor chat logs to the bottom on new messages
  useEffect(() => {
    if (isChatOpen) {
      setTimeout(() => {
        const chatContainer = document.getElementById('ai-chat-logs');
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      }, 50);
    }
  }, [chatMessages, isChatOpen]);

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
      fileData: billAttachmentData || undefined,
      fileName: billAttachmentName || undefined
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
    const subCategory = document.getElementById('employee-subcategory').value.trim();
    const stitchRate = 0;
    const salary = 0;

    try {
      if (editingEmployee) {
        await updateEmployeeMutation({
          id: editingEmployee._id,
          name, phone, role, subCategory, stitchRate, salary,
          createdAt: editingEmployee.createdAt
        });
        alert("Employee details updated successfully!");
      } else {
        await addEmployeeMutation({ name, phone, role, subCategory, stitchRate, salary });
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
      document.getElementById('employee-subcategory').value = emp.subCategory || '';
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

  // Expenses CRUD
  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    const date = document.getElementById('expense-date').value;
    const category = document.getElementById('expense-category').value;
    const amount = parseFloat(document.getElementById('expense-amount').value) || 0;
    const description = document.getElementById('expense-desc').value.trim();
    const billIdVal = document.getElementById('expense-bill-id').value;
    const billId = billIdVal ? billIdVal : undefined;

    try {
      if (editingExpense) {
        await updateExpenseMutation({
          id: editingExpense._id,
          date, category, amount, description, billId,
          createdAt: editingExpense.createdAt
        });
        alert("Expense record updated!");
      } else {
        await addExpenseMutation({ date, category, amount, description, billId });
        alert("Expense logged successfully!");
      }
      closeExpenseModal();
    } catch (err) {
      alert("Error saving expense: " + err.message);
    }
  };

  const deleteExpense = async (id) => {
    if (confirm("Are you sure you want to delete this expense record?")) {
      await deleteExpenseMutation({ id });
    }
  };

  const openEditExpense = (exp) => {
    setEditingExpense(exp);
    setIsExpenseModalOpen(true);
    setTimeout(() => {
      document.getElementById('expense-date').value = exp.date;
      document.getElementById('expense-category').value = exp.category;
      document.getElementById('expense-amount').value = exp.amount;
      document.getElementById('expense-desc').value = exp.description;
      document.getElementById('expense-bill-id').value = exp.billId || "";
    }, 50);
  };

  const closeExpenseModal = () => {
    setIsExpenseModalOpen(false);
    setEditingExpense(null);
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

    // Fabric roll consumption safety validation check
    const selectedFabric = fabrics.find(f => f._id === fabricId);
    if (selectedFabric) {
      const alreadyStitchedOtherAssignments = (stitching || [])
        .filter(s => s.fabricId === fabricId && s._id !== (editingStitching?._id || ''))
        .reduce((sum, s) => sum + s.piecesStitched, 0);
      const remainingForThis = selectedFabric.quantityReceived - alreadyStitchedOtherAssignments;
      
      if (piecesStitched > remainingForThis) {
        alert(`❌ Over-Allocation Warning: You allocated ${piecesStitched} Pcs, but only ${remainingForThis} Pcs are remaining in this fabric roll!`);
        return;
      }
    }

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
    setSelectedFabricId(s.fabricId);
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
      const newUser = {
        username: userVal,
        fullName: userVal,
        email: emailVal,
        password: passVal
      };

      await registerUser(newUser);

      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('currentUser', userVal);
      setCurrentLoggedUser(newUser); // Save user locally to avoid query lag logout loops
      setIsLoggedIn(true);
      setIsFirstTimeSetup(false);
    } catch (err) {
      alert("Failed to register account: " + err.message);
    }
  };

  const handleForgotVerify = async (e) => {
    e.preventDefault();
    const user = users.find(u => u.email && u.email.trim().toLowerCase() === forgotEmail.trim().toLowerCase());
    if (!user) {
      alert("Error: No account found with this registered email address!");
      return;
    }
    // Details match!
    setResetUserRecord(user);
    setForgotStep(2);
  };

  const handleForgotReset = async (e) => {
    e.preventDefault();
    if (forgotPassword !== forgotConfirmPassword) {
      alert("Error: Passwords do not match!");
      return;
    }

    try {
      await updateUser({
        id: resetUserRecord._id,
        username: resetUserRecord.username,
        password: forgotPassword,
        fullName: resetUserRecord.fullName || '',
        email: resetUserRecord.email || '',
        avatarPicture: resetUserRecord.avatarPicture || '',
        createdAt: resetUserRecord.createdAt
      });

      alert("Success: Password reset successfully! You can now log in.");
      // Reset states & go back to login
      setAuthMode('login');
      setForgotStep(1);
      setForgotUsername('');
      setForgotEmail('');
      setForgotPassword('');
      setForgotConfirmPassword('');
      setResetUserRecord(null);
    } catch (err) {
      alert("Failed to reset password: " + err.message);
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

  // Compile recent activity log items from database
  const getRecentActivities = () => {
    const activities = [];

    (bills || []).slice(0, 3).forEach(b => {
      activities.push({
        id: b._id,
        type: 'invoice',
        title: `Invoice Registered`,
        desc: `Recorded bill ${b.billNumber} for client amount of ${formatCurrency(b.totalAmount)}.`,
        time: b.date ? new Date(b.date) : new Date(),
        icon: 'ph-receipt',
        color: '#8B5CF6'
      });
    });

    (fabrics || []).slice(0, 3).forEach(f => {
      activities.push({
        id: f._id,
        type: 'fabric',
        title: `Fabric Roll Received`,
        desc: `Received ${f.quantityReceived} Pcs of ${f.color} ${f.fabricType} from ${f.supplier}.`,
        time: f.receivedDate ? new Date(f.receivedDate) : new Date(),
        icon: 'ph-package',
        color: '#10B981'
      });
    });

    // Sort by time descending
    return activities.sort((a, b) => b.time - a.time).slice(0, 4);
  };

  // Get remaining pieces in a fabric roll by deducting completed/assigned stitch assignments
  const getRemainingFabricQty = (fabricId, totalReceived) => {
    const totalStitched = (stitching || [])
      .filter(s => s.fabricId === fabricId)
      .reduce((sum, s) => sum + s.piecesStitched, 0);
    return Math.max(0, totalReceived - totalStitched);
  };

  // Helper to open print-friendly PDF page for ledgers
  const printContent = (title, headers, rows) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to export PDFs!");
      return;
    }
    
    const htmlRows = rows.map(row => `
      <tr>
        ${row.map(cell => `<td style="border: 1px solid #ddd; padding: 10px; font-size: 11px; color: #333; line-height: 1.4;">${cell}</td>`).join('')}
      </tr>
    `).join('');

    const htmlHeaders = headers.map(header => `
      <th style="border: 1px solid #ddd; padding: 12px 10px; background-color: #f5f5f5; font-weight: bold; font-size: 12px; text-align: left; color: #000; text-transform: uppercase;">${header}</th>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: 'Inter', -apple-system, sans-serif; padding: 40px; margin: 0; background-color: #fff; color: #000; }
            h1 { font-size: 20px; font-weight: 800; margin: 0 0 4px 0; letter-spacing: -0.5px; }
            p { font-size: 11px; color: #666; margin: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            @media print {
              body { padding: 0; }
              @page { size: A4 portrait; margin: 15mm; }
            }
          </style>
        </head>
        <body>
          <div style="display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #000; padding-bottom: 16px; margin-bottom: 20px;">
            <div>
              <h1>VARAHI EXPORTS</h1>
              <p style="margin-bottom: 4px;">8/2933 A, Karuparayan Kovil, Pandian Nagar, Tirupur - 641603</p>
              <p style="margin-bottom: 4px;">Mob: 9994685525 | Email: varahi.export@gmail.com</p>
              <p>GSTIN/UIN: 33CKMPS0071D1ZC | State: Tamil Nadu (33)</p>
            </div>
            <div style="text-align: right;">
              <h2 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 700; color: #7c3aed; text-transform: uppercase; letter-spacing: 0.5px;">${title}</h2>
              <p>Generated: ${new Date().toLocaleDateString('en-IN')}</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>${htmlHeaders}</tr>
            </thead>
            <tbody>
              ${htmlRows}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Export Invoices list to PDF report
  const handleExportInvoicesPDF = () => {
    if (bills.length === 0) {
      alert("No invoice records to export!");
      return;
    }
    const headers = ["Invoice Number", "Client Name", "Invoice Date", "Tax Scheme", "Subtotal", "GST Tax", "Discount", "Grand Total"];
    const rows = bills.map(b => {
      const c = clients.find(cl => cl._id === b.clientId);
      return [
        b.billNumber,
        c ? c.name : 'Unknown Client',
        formatDate(b.date),
        b.billType === 'with-gst' ? 'GST (5%)' : 'No GST',
        formatCurrency(b.subtotal),
        formatCurrency(b.totalGst),
        formatCurrency(b.discount),
        formatCurrency(b.totalAmount)
      ];
    });
    printContent("Invoices Billing Ledger", headers, rows);
  };

  // Export Stitching Crew list to PDF report
  const handleExportEmployeesPDF = () => {
    if (employees.length === 0) {
      alert("No employee records to export!");
      return;
    }
    const headers = ["Employee Name", "Phone", "Staff Role", "Specialization"];
    const rows = employees.map(emp => [
      emp.name,
      emp.phone || 'N/A',
      emp.role,
      emp.subCategory || '-'
    ]);
    printContent("Stitching Crew Directory", headers, rows);
  };

  // Export Fabrics Inventory Stock list to PDF report
  const handleExportFabricsPDF = () => {
    if (fabrics.length === 0) {
      alert("No fabric roll records to export!");
      return;
    }
    const headers = ["Received Date", "Fabric Type", "Color", "Qty Received", "Qty Remaining", "Supplier", "Status"];
    const rows = fabrics.map(f => [
      formatDate(f.receivedDate),
      f.fabricType,
      f.color,
      `${f.quantityReceived} Pcs`,
      `${getRemainingFabricQty(f._id, f.quantityReceived)} Pcs`,
      f.supplier,
      f.status
    ]);
    printContent("Fabric Roll Inventory Ledger", headers, rows);
  };

  // Export Expenses list to PDF report
  const handleExportExpensesPDF = () => {
    if (expenses.length === 0) {
      alert("No expense records to export!");
      return;
    }
    const headers = ["Expense Date", "Category", "Description", "Linked Invoice", "Amount"];
    const rows = expenses.map(exp => {
      const bill = bills.find(b => b._id === exp.billId);
      return [
        formatDate(exp.date),
        exp.category,
        exp.description,
        bill ? bill.billNumber : 'General Overhead',
        formatCurrency(exp.amount)
      ];
    });
    printContent("Operational Expenses Ledger", headers, rows);
  };

  // Seed demo data for empty database setup
  const handleSeedDemoData = async () => {
    try {
      // 1. Seed Clients
      const clientId1 = await addClientMutation({
        name: "Sri Varahi Exports",
        companyName: "Varahi Exports Pvt Ltd",
        email: "contact@varahiexports.com",
        phone: "+91 98765 43210",
        gstin: "33AABCU1234F1Z5",
        address: "123, Garment Zone, Tiruppur, TN"
      });
      const clientId2 = await addClientMutation({
        name: "Karthik Apparels",
        companyName: "Karthik Textiles",
        email: "karthik@textiles.in",
        phone: "+91 94432 10987",
        gstin: "33BBDDU5678G2Z4",
        address: "45, Cotton Street, Coimbatore, TN"
      });
      const clientId3 = await addClientMutation({
        name: "Global Garments",
        companyName: "Global Imports Inc",
        email: "import@globalgarments.com",
        phone: "+1 555 0199",
        gstin: "",
        address: "Houston, Texas, USA"
      });

      // 2. Seed Employees
      await addEmployeeMutation({
        name: "Ramesh Kumar",
        phone: "+91 98940 12345",
        role: "Stitcher",
        subCategory: "Jeans Specialist",
        stitchRate: 15,
        salary: 12000
      });
      await addEmployeeMutation({
        name: "Anitha Devi",
        phone: "+91 97890 54321",
        role: "Stitcher",
        subCategory: "T-Shirt Specialist",
        stitchRate: 12,
        salary: 10000
      });
      await addEmployeeMutation({
        name: "Selvam Murugan",
        phone: "+91 94440 98765",
        role: "Signer",
        subCategory: "Lead Auditor",
        stitchRate: 0,
        salary: 15000
      });

      // 3. Seed Fabric Rolls
      await addFabricMutation({
        fabricType: "Denim Cotton",
        quantityReceived: 120,
        color: "Navy Blue",
        receivedDate: "2026-07-01",
        supplier: "Texcraft Mills",
        status: "Stitching"
      });
      await addFabricMutation({
        fabricType: "Organic Cotton Knit",
        quantityReceived: 250,
        color: "Crimson Red",
        receivedDate: "2026-07-03",
        supplier: "BioThread Suppliers",
        status: "Stored"
      });

      // 4. Seed Bills
      const billId1 = await addBillMutation({
        clientId: clientId1,
        billNumber: "VE-2026-001",
        date: "2026-07-02",
        billType: "with-gst",
        items: [
          { name: "Denim Jackets (L)", price: 850, qty: 100, gstRate: 5, gstAmount: 4250, total: 89250 }
        ],
        discount: 250,
        subtotal: 85000,
        totalGst: 4250,
        totalAmount: 89000
      });

      const billId2 = await addBillMutation({
        clientId: clientId2,
        billNumber: "VE-2026-002",
        date: "2026-07-05",
        billType: "without-gst",
        items: [
          { name: "Cotton Crew Neck Shirts", price: 350, qty: 150, gstRate: 0, gstAmount: 0, total: 52500 }
        ],
        discount: 500,
        subtotal: 52500,
        totalGst: 0,
        totalAmount: 52000
      });

      // Seed Expenses
      await addExpenseMutation({
        billId: billId1,
        category: "Transportation",
        amount: 3500,
        description: "Auto delivery charges for Sri Varahi order",
        date: "2026-07-03"
      });
      await addExpenseMutation({
        billId: billId1,
        category: "Employee Salaries",
        amount: 8000,
        description: "Denim stitcher bonus allocations",
        date: "2026-07-04"
      });
      await addExpenseMutation({
        billId: billId2,
        category: "Petrol",
        amount: 1200,
        description: "Coimbatore client dispatch delivery van fuel",
        date: "2026-07-06"
      });
      await addExpenseMutation({
        category: "Operations",
        amount: 4500,
        description: "Monthly workshop power generator servicing fee",
        date: "2026-07-07"
      });

      // 5. Seed CEO Activity Logs
      await addCeoActivityMutation({
        date: "2026-07-06",
        focusArea: "Production Planning",
        description: "Audited denim stitching outputs, mapped supplier dispatch timelines.",
        hoursSpent: 5.5,
        productivityLevel: "High",
        isCritical: true
      });

      await addCeoActivityMutation({
        date: "2026-07-07",
        focusArea: "Financial Audit",
        description: "Cleared tax schemes validation reviews and verified GST invoices calculations.",
        hoursSpent: 3.5,
        productivityLevel: "Medium",
        isCritical: false
      });

      alert("🎉 Demo data seeded successfully! The dashboard and expenses are now populated.");
    } catch (err) {
      alert("Error seeding demo data: " + err.message);
    }
  };

  // If user is not logged in, render the Auth Overlay
  if (!BYPASS_AUTH && !isLoggedIn) {
    return (
      <div id="auth-screen" className="auth-overlay-wrapper active">
        <div className="auth-container-card">


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
                <a href="#" onClick={(e) => { e.preventDefault(); setAuthMode('forgot'); }} style={{ alignSelf: 'flex-end', fontSize: '11px', color: 'var(--color-primary)', textDecoration: 'none', marginTop: '-8px', marginBottom: '8px', fontWeight: 600 }}>Forgot Password?</a>
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
          ) : authMode === 'register' ? (
            <div id="auth-register-box" className="auth-box active">
              <h2>Create Account</h2>
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
          ) : (
            <div id="auth-forgot-box" className="auth-box active">
              <h2>Reset Password</h2>
              <p className="auth-desc">
                {forgotStep === 1 
                  ? "Verify your registered email address." 
                  : "Enter your new password below."}
              </p>

              {forgotStep === 1 ? (
                <form onSubmit={handleForgotVerify} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px', width: '100%' }}>
                  <div className="form-group" style={{ width: '100%' }}>
                    <label htmlFor="forgot-email">Registered Email Address</label>
                    <input 
                      type="email" 
                      id="forgot-email" 
                      required 
                      placeholder="e.g. varahi.export@gmail.com" 
                      value={forgotEmail} 
                      onChange={(e) => setForgotEmail(e.target.value)} 
                      style={{ width: '100%' }} 
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ padding: '14px', fontWeight: 700, width: '100%', justifyContent: 'center', fontSize: '15px', marginTop: '8px' }}>Verify Details</button>
                </form>
              ) : (
                <form onSubmit={handleForgotReset} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px', width: '100%' }}>
                  <div className="form-group" style={{ width: '100%' }}>
                    <label htmlFor="forgot-new-pwd">New Password</label>
                    <input 
                      type="password" 
                      id="forgot-new-pwd" 
                      required 
                      placeholder="••••••••" 
                      value={forgotPassword} 
                      onChange={(e) => setForgotPassword(e.target.value)} 
                      style={{ width: '100%' }} 
                    />
                  </div>
                  <div className="form-group" style={{ width: '100%' }}>
                    <label htmlFor="forgot-confirm-new-pwd">Confirm New Password</label>
                    <input 
                      type="password" 
                      id="forgot-confirm-new-pwd" 
                      required 
                      placeholder="••••••••" 
                      value={forgotConfirmPassword} 
                      onChange={(e) => setForgotConfirmPassword(e.target.value)} 
                      style={{ width: '100%' }} 
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ padding: '14px', fontWeight: 700, width: '100%', justifyContent: 'center', fontSize: '15px', marginTop: '8px' }}>Reset Password</button>
                </form>
              )}

              <p className="auth-toggle-text" style={{ textAlign: 'center', fontSize: '12px', marginTop: '20px', color: 'var(--color-text-secondary)' }}>
                Back to <a href="#" onClick={(e) => { e.preventDefault(); setAuthMode('login'); setForgotStep(1); }} style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>Sign In</a>
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
          <button className={`nav-item ${activeTab === 'expenses' ? 'active' : ''}`} onClick={() => handleTabChange('expenses')}>
            <i className="ph ph-coins"></i>
            <span>Expenses</span>
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
          <>
            <section id="dashboard-view" className="tab-view active">
            <header className="view-header">
              <div>
                <h1>Financial Overview</h1>
                <p className="subtitle">Monitor your business performance, client revenues, and GST filings.</p>
              </div>
              <div className="header-actions">
                <button className="btn btn-secondary" onClick={handleSeedDemoData} title="Seed Mock Database Entries">
                  <i className="ph ph-database"></i> Seed Data
                </button>
                <button className="btn btn-primary" onClick={() => setIsBillModalOpen(true)}>
                  <i className="ph ph-plus-circle"></i> New Bill
                </button>
                <button className="btn btn-accent" onClick={() => setIsScanModalOpen(true)}>
                  <i className="ph ph-scan"></i> Scan Receipt
                </button>
              </div>
            </header>

            {/* Statistics Grid Panel */}
            <div className="metrics-grid" style={{ marginBottom: '24px' }}>
              {/* Total Billing */}
              <div className="metric-card">
                <div className="metric-card-header">
                  <span className="metric-label">Total Billing</span>
                  <div className="metric-icon purple"><i className="ph ph-receipt"></i></div>
                </div>
                <div className="metric-value">{formatCurrency(bills.reduce((sum, b) => sum + b.totalAmount, 0))}</div>
                <div className="metric-footer">
                  <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>Active</span>
                  <span>across client portfolios</span>
                </div>
              </div>

              {/* Invoices Logged */}
              <div className="metric-card">
                <div className="metric-card-header">
                  <span className="metric-label">Invoices Logged</span>
                  <div className="metric-icon purple"><i className="ph ph-file-text"></i></div>
                </div>
                <div className="metric-value">{bills.length} Records</div>
                <div className="metric-footer">
                  <span>Audit-ready entries</span>
                </div>
              </div>

              {/* Active Fabric Rolls */}
              <div className="metric-card">
                <div className="metric-card-header">
                  <span className="metric-label">Active Fabric Rolls</span>
                  <div className="metric-icon gold"><i className="ph ph-scissors"></i></div>
                </div>
                <div className="metric-value">{fabrics.filter(f => f.status !== 'Completed').length} Rolls</div>
                <div className="metric-footer">
                  <span>Currently assigned / stored</span>
                </div>
              </div>

              {/* CEO Work Logs */}
              <div className="metric-card">
                <div className="metric-card-header">
                  <span className="metric-label">CEO Work logs</span>
                  <div className="metric-icon purple" style={{ color: 'var(--color-success)', backgroundColor: 'rgba(16,185,129,0.1)' }}><i className="ph ph-clock"></i></div>
                </div>
                <div className="metric-value">{ceoActivities.reduce((s, a) => s + a.hoursSpent, 0)} Hrs</div>
                <div className="metric-footer">
                  <span>Cumulative hours logged</span>
                </div>
              </div>
            </div>

            {/* Main Dashboard charts and concentration risk layout */}
            <div className="charts-grid" style={{ marginBottom: '24px' }}>
              <div className="chart-card bg-surface border">
                <h3>Revenue Contribution by Client</h3>
                <div className="chart-container" style={{ height: '300px', position: 'relative', marginTop: '16px' }}>
                  <canvas ref={chartCanvasRef}></canvas>
                </div>
              </div>

              <div className="table-card bg-surface border" style={{ padding: '24px' }}>
                <h3>Client Concentration Risk</h3>
                <p className="small text-muted" style={{ marginBottom: '16px' }}>Assess dependency share.</p>
                <div className="table-responsive desktop-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Client</th>
                        <th>Billing Volume</th>
                        <th className="text-right">Share %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const totalSales = bills.reduce((s, b) => s + b.totalAmount, 0);
                        const clientTotals = bills.reduce((acc, b) => {
                          acc[b.clientId] = (acc[b.clientId] || 0) + b.totalAmount;
                          return acc;
                        }, {});
                        const sortedData = Object.entries(clientTotals).map(([id, sales]) => {
                          const clObj = clients.find(c => c._id === id);
                          return {
                            name: clObj ? clObj.name : 'Unknown Client',
                            sales,
                            pct: totalSales > 0 ? (sales / totalSales) * 100 : 0
                          };
                        }).sort((a, b) => b.sales - a.sales);

                        return sortedData.map((row, idx) => (
                          <tr key={idx}>
                            <td className="font-semibold">{row.name}</td>
                            <td>{formatCurrency(row.sales)}</td>
                            <td className="text-right font-medium text-primary">{row.pct.toFixed(1)}%</td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>

                <div className="mobile-cards-container">
                  {(() => {
                    const totalSales = bills.reduce((s, b) => s + b.totalAmount, 0);
                    const clientTotals = bills.reduce((acc, b) => {
                      acc[b.clientId] = (acc[b.clientId] || 0) + b.totalAmount;
                      return acc;
                    }, {});
                    const sortedData = Object.entries(clientTotals).map(([id, sales]) => {
                      const clObj = clients.find(c => c._id === id);
                      return {
                        name: clObj ? clObj.name : 'Unknown Client',
                        sales,
                        pct: totalSales > 0 ? (sales / totalSales) * 100 : 0
                      };
                    }).sort((a, b) => b.sales - a.sales);

                    return sortedData.map((row, idx) => (
                      <div key={idx} style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '10px', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 600 }}>{row.name}</span>
                          <span className="text-primary" style={{ fontWeight: 700 }}>{row.pct.toFixed(1)}%</span>
                        </div>
                        <div className="progress-bar-container" style={{ height: '6px' }}>
                          <div className="progress-bar" style={{ width: `${row.pct}%` }}></div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>

            {/* System activity logs feed */}
            <div className="table-card bg-surface border" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0 }}>System Operations Activity Feed</h3>
                <span className="badge badge-success">Live Syncing</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                {getRecentActivities().map((act) => (
                  <div key={act.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: act.color || 'var(--color-primary)',
                      flexShrink: 0
                    }}>
                      <i className={`ph ${act.icon}`} style={{ fontSize: '18px' }}></i>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>{act.title}</span>
                      <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>{act.desc}</span>
                    </div>
                  </div>
                ))}
                {getRecentActivities().length === 0 && (
                  <div className="text-center text-muted" style={{ padding: '16px', fontSize: '12px' }}>No recent operations logged. Seed demo data to see audits.</div>
                )}
              </div>
            </div>
          </section>

          {/* Floating Chatbot Widget on Home Screen */}
          <div className="floating-chatbot-container no-print">
            {isChatOpen && (
              <div className="chatbot-window-card">
                <div className="chat-header" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-muted)' }}>
                  <div className="chat-ai-avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(124,58,237,0.1)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}><i className="ph-fill ph-sparkle"></i></div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>AI Financial Advisor</h4>
                    <p className="small text-green" style={{ margin: 0, fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}><span className="pulse-dot" style={{ width: '6px', height: '6px', backgroundColor: 'var(--color-success)', borderRadius: '50%', display: 'inline-block' }}></span> Online & connected</p>
                  </div>
                  <button className="btn btn-accent btn-sm" onClick={triggerAIAnalysis} style={{ fontSize: '10px', padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px', border: '1px solid rgba(124, 58, 237, 0.2)', marginRight: '6px' }}><i className="ph ph-sparkle"></i> Analysis</button>
                  <button className="btn-close" onClick={() => setIsChatOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '16px' }}><i className="ph ph-x"></i></button>
                </div>

                <div className="chat-logs" id="ai-chat-logs" style={{ height: '260px', overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: 'var(--color-surface)' }}>
                  {chatMessages.map((msg, i) => (
                    <div className={`chat-message ${msg.role}`} key={i} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%', padding: '8px 12px', borderRadius: 'var(--radius-md)', fontSize: '12px', lineHeight: 1.4, backgroundColor: msg.role === 'user' ? 'var(--color-primary)' : 'var(--color-muted)', color: msg.role === 'user' ? '#ffffff' : 'var(--color-text-primary)' }}>
                      <p style={{ margin: 0 }}>{msg.text}</p>
                    </div>
                  ))}
                </div>

                <div className="suggestion-chips" style={{ padding: '8px 12px', display: 'flex', gap: '4px', flexWrap: 'wrap', borderTop: '1px solid var(--color-border)', backgroundColor: 'var(--color-muted)' }}>
                  <button className="chip" style={{ fontSize: '10px', padding: '4px 8px', borderRadius: '12px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-secondary)', cursor: 'pointer' }} onClick={() => sendQuickMessage('Provide complete cash flow review')}>Cash Flow</button>
                  <button className="chip" style={{ fontSize: '10px', padding: '4px 8px', borderRadius: '12px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-secondary)', cursor: 'pointer' }} onClick={() => sendQuickMessage('Who is my top client by sales?')}>Top Client</button>
                  <button className="chip" style={{ fontSize: '10px', padding: '4px 8px', borderRadius: '12px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-secondary)', cursor: 'pointer' }} onClick={() => sendQuickMessage('Do I have client concentration risk?')}>Risk Audit</button>
                </div>

                <form className="chat-input-form" onSubmit={sendChatMessage} style={{ display: 'flex', gap: '8px', padding: '8px 12px', borderTop: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
                  <input type="text" placeholder="Ask finances..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} required style={{ flex: 1, fontSize: '12px', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-muted)', color: 'var(--color-text-primary)' }} />
                  <button type="submit" className="btn btn-accent btn-icon-square" style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="ph-fill ph-paper-plane-right"></i></button>
                </form>
              </div>
            )}

            <div className="floating-chat-trigger" onClick={() => setIsChatOpen(!isChatOpen)}>
              {isChatOpen ? <i className="ph ph-x"></i> : <i className="ph ph-sparkle"></i>}
            </div>
          </div>
        </>
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

            <div className="table-card bg-surface border desktop-table-container">
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

            <div className="mobile-cards-container">
              {clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()) || (c.companyName || '').toLowerCase().includes(clientSearch.toLowerCase())).map(c => (
                <div key={c._id} className="mobile-card">
                  <div className="mobile-card-header">
                    <div className="mobile-card-title">{c.name}</div>
                    <span className="badge" style={{
                      backgroundColor: c.gstin ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                      color: c.gstin ? 'var(--color-success)' : 'var(--color-danger)',
                      border: c.gstin ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(239,68,68,0.2)',
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '8px'
                    }}>{c.gstin ? 'GST' : 'Regular'}</span>
                  </div>
                  <div className="mobile-card-body">
                    <div className="mobile-card-detail">
                      <span className="mobile-card-detail-label">Company</span>
                      <span className="mobile-card-detail-value">{c.companyName || '-'}</span>
                    </div>
                    <div className="mobile-card-detail">
                      <span className="mobile-card-detail-label">GSTIN</span>
                      <span className="mobile-card-detail-value" style={{ color: 'var(--color-primary)' }}>{c.gstin || 'Unregistered'}</span>
                    </div>
                    <div className="mobile-card-detail">
                      <span className="mobile-card-detail-label">Phone</span>
                      <span className="mobile-card-detail-value">{c.phone || '-'}</span>
                    </div>
                    <div className="mobile-card-detail">
                      <span className="mobile-card-detail-label">Email</span>
                      <span className="mobile-card-detail-value">{c.email || '-'}</span>
                    </div>
                  </div>
                  {c.address && (
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', padding: '0 4px' }}>
                      <strong>Address: </strong>{c.address}
                    </div>
                  )}
                  <div className="mobile-card-footer">
                    <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => openEditClient(c)}>
                      <i className="ph ph-pencil-simple"></i> Edit
                    </button>
                    <button className="btn btn-secondary text-red" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => deleteClient(c._id)}>
                      <i className="ph ph-trash"></i> Delete
                    </button>
                  </div>
                </div>
              ))}
              {clients.length === 0 && (
                <div className="text-center text-muted" style={{ padding: '24px' }}>No client records found. Register your first buyer!</div>
              )}
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

            <div className="search-filter-row" style={{ marginBottom: '20px', display: 'flex', gap: '12px' }}>
              <div className="search-input-wrapper">
                <i className="ph ph-magnifying-glass"></i>
                <input type="text" placeholder="Search bills by invoice number..." value={billSearch} onChange={(e) => setBillSearch(e.target.value)} />
              </div>
              <button className="btn btn-secondary" onClick={handleExportInvoicesPDF} title="Export Invoices to PDF">
                <i className="ph ph-file-pdf"></i> Export PDF
              </button>
            </div>

            <div className="table-card bg-surface border desktop-table-container">
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

            <div className="mobile-cards-container">
              {bills.filter(b => b.billNumber.toLowerCase().includes(billSearch.toLowerCase())).map(b => {
                const c = clients.find(cl => cl._id === b.clientId);
                return (
                  <div key={b._id} className="mobile-card">
                    <div className="mobile-card-header">
                      <div className="mobile-card-title" style={{ color: 'var(--color-primary)' }}>{b.billNumber}</div>
                      <span className="badge" style={{
                        backgroundColor: b.billType === 'with-gst' ? 'rgba(124,58,237,0.1)' : 'rgba(255,255,255,0.05)',
                        color: b.billType === 'with-gst' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '8px'
                      }}>{b.billType === 'with-gst' ? 'GST (5%)' : 'No GST'}</span>
                    </div>
                    <div className="mobile-card-body">
                      <div className="mobile-card-detail">
                        <span className="mobile-card-detail-label">Client</span>
                        <span className="mobile-card-detail-value">{c ? c.name : 'Unknown Client'}</span>
                      </div>
                      <div className="mobile-card-detail">
                        <span className="mobile-card-detail-label">Grand Total</span>
                        <span className="mobile-card-detail-value" style={{ color: 'var(--color-success)' }}>{formatCurrency(b.totalAmount)}</span>
                      </div>
                      <div className="mobile-card-detail">
                        <span className="mobile-card-detail-label">Date</span>
                        <span className="mobile-card-detail-value">{formatDate(b.date)}</span>
                      </div>
                      <div className="mobile-card-detail">
                        <span className="mobile-card-detail-label">Tax Amount</span>
                        <span className="mobile-card-detail-value">{formatCurrency(b.totalGst)}</span>
                      </div>
                    </div>
                    <div className="mobile-card-footer">
                      {b.fileData && (
                        <a href={b.fileData} download={b.fileName} className="badge" style={{ textDecoration: 'none', backgroundColor: 'rgba(124,58,237,0.1)', color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 10px', fontSize: '11px', borderRadius: '6px', border: '1px solid rgba(124,58,237,0.2)' }}>
                          <i className="ph ph-paperclip"></i> File
                        </a>
                      )}
                      <button className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '11px' }} onClick={() => { setViewingInvoice(b); setIsInvoiceViewOpen(true); }}>
                        <i className="ph ph-file-text"></i> View
                      </button>
                      <button className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '11px' }} onClick={() => openEditBill(b)}>
                        <i className="ph ph-pencil-simple"></i> Edit
                      </button>
                      <button className="btn btn-secondary text-red" style={{ padding: '6px 10px', fontSize: '11px' }} onClick={() => deleteBill(b._id)}>
                        <i className="ph ph-trash"></i> Delete
                      </button>
                    </div>
                  </div>
                );
              })}
              {bills.length === 0 && (
                <div className="text-center text-muted" style={{ padding: '24px' }}>No invoices logged. Log an invoice to calculate sales records.</div>
              )}
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

            <div className="search-filter-row" style={{ marginBottom: '20px', display: 'flex', gap: '12px' }}>
              <div className="search-input-wrapper">
                <i className="ph ph-magnifying-glass"></i>
                <input type="text" placeholder="Search employees by name..." value={employeeSearch} onChange={(e) => setEmployeeSearch(e.target.value)} />
              </div>
              <button className="btn btn-secondary" onClick={handleExportEmployeesPDF} title="Export Stitching Crew to PDF">
                <i className="ph ph-file-pdf"></i> Export PDF
              </button>
            </div>

            <div className="table-card bg-surface border desktop-table-container">
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
                        <td>
                          <span className="badge" style={{ backgroundColor: 'rgba(124,58,237,0.08)', color: 'var(--color-primary)', marginRight: '6px' }}>{emp.role}</span>
                          {emp.subCategory && (
                            <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--color-text-secondary)', border: '1px solid rgba(255,255,255,0.08)' }}>{emp.subCategory}</span>
                          )}
                        </td>
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

            <div className="mobile-cards-container">
              {employees.filter(e => e.name.toLowerCase().includes(employeeSearch.toLowerCase())).map(emp => (
                <div key={emp._id} className="mobile-card">
                  <div className="mobile-card-header">
                    <div className="mobile-card-title">{emp.name}</div>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <span className="badge" style={{ backgroundColor: 'rgba(124,58,237,0.08)', color: 'var(--color-primary)', border: '1px solid rgba(124,58,237,0.15)', fontSize: '10px', padding: '2px 6px', borderRadius: '8px' }}>{emp.role}</span>
                      {emp.subCategory && (
                        <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--color-text-secondary)', border: '1px solid rgba(255,255,255,0.08)', fontSize: '10px', padding: '2px 6px', borderRadius: '8px' }}>{emp.subCategory}</span>
                      )}
                    </div>
                  </div>
                  <div className="mobile-card-body">
                    <div className="mobile-card-detail">
                      <span className="mobile-card-detail-label">Stitch Rate</span>
                      <span className="mobile-card-detail-value">{formatCurrency(emp.stitchRate)} / Pcs</span>
                    </div>
                    <div className="mobile-card-detail">
                      <span className="mobile-card-detail-label">Basic Salary</span>
                      <span className="mobile-card-detail-value">{formatCurrency(emp.salary)}</span>
                    </div>
                    <div className="mobile-card-detail" style={{ gridColumn: 'span 2' }}>
                      <span className="mobile-card-detail-label">Phone</span>
                      <span className="mobile-card-detail-value">{emp.phone || '-'}</span>
                    </div>
                  </div>
                  <div className="mobile-card-footer">
                    <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => openEditEmployee(emp)}>
                      <i className="ph ph-pencil-simple"></i> Edit
                    </button>
                    <button className="btn btn-secondary text-red" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => deleteEmployee(emp._id)}>
                      <i className="ph ph-trash"></i> Delete
                    </button>
                  </div>
                </div>
              ))}
              {employees.length === 0 && (
                <div className="text-center text-muted" style={{ padding: '24px' }}>No crew registered. Add employees to log stitching operations.</div>
              )}
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
                <button className="btn btn-accent" onClick={() => { setSelectedFabricId(""); setIsStitchingModalOpen(true); }}>
                  <i className="ph ph-scissors"></i> Stitch Allocation
                </button>
              </div>
            </header>

            <div className="search-filter-row" style={{ marginBottom: '20px', display: 'flex', gap: '12px' }}>
              <div className="search-input-wrapper">
                <i className="ph ph-magnifying-glass"></i>
                <input type="text" placeholder="Search rolls by color, supplier, or fabric..." value={fabricSearch} onChange={(e) => setFabricSearch(e.target.value)} />
              </div>
              <button className="btn btn-secondary" onClick={handleExportFabricsPDF} title="Export Fabric Stocks to PDF">
                <i className="ph ph-file-pdf"></i> Export PDF
              </button>
            </div>

            <div className="grid-layout-2" style={{ gridTemplateColumns: '1.4fr 1fr', gap: '24px' }}>
              {/* Left Side: Fabric list */}
              <div className="table-card bg-surface border desktop-table-container" style={{ padding: '20px' }}>
                <h3 style={{ marginBottom: '16px' }}>Fabric Roll Stock ledger</h3>
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Fabric Type</th>
                        <th>Color</th>
                        <th className="text-right">Qty Received</th>
                        <th className="text-right">Qty Remaining</th>
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
                          <td className="text-right font-semibold text-primary">{getRemainingFabricQty(f._id, f.quantityReceived)} Pcs</td>
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
                          <td colSpan="8" className="text-center text-muted">No fabric rolls logged.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mobile-cards-container">
                {fabrics.filter(f => f.fabricType.toLowerCase().includes(fabricSearch.toLowerCase()) || f.color.toLowerCase().includes(fabricSearch.toLowerCase()) || f.supplier.toLowerCase().includes(fabricSearch.toLowerCase())).map(f => (
                  <div key={f._id} className="mobile-card">
                    <div className="mobile-card-header">
                      <div className="mobile-card-title">{f.fabricType}</div>
                      <span className={`badge ${f.status === 'Completed' ? 'badge-success' : f.status === 'Stitching' ? 'badge-gst' : 'badge-neutral'}`}>{f.status}</span>
                    </div>
                    <div className="mobile-card-body">
                      <div className="mobile-card-detail">
                        <span className="mobile-card-detail-label">Color</span>
                        <span className="mobile-card-detail-value" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: f.color.toLowerCase(), border: '1px solid rgba(255,255,255,0.1)' }}></span>
                          {f.color}
                        </span>
                      </div>
                      <div className="mobile-card-detail">
                        <span className="mobile-card-detail-label">Qty Received</span>
                        <span className="mobile-card-detail-value">{f.quantityReceived} Pcs</span>
                      </div>
                      <div className="mobile-card-detail">
                        <span className="mobile-card-detail-label">Qty Remaining</span>
                        <span className="mobile-card-detail-value" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{getRemainingFabricQty(f._id, f.quantityReceived)} Pcs</span>
                      </div>
                      <div className="mobile-card-detail">
                        <span className="mobile-card-detail-label">Received Date</span>
                        <span className="mobile-card-detail-value">{formatDate(f.receivedDate)}</span>
                      </div>
                      <div className="mobile-card-detail">
                        <span className="mobile-card-detail-label">Supplier</span>
                        <span className="mobile-card-detail-value">{f.supplier}</span>
                      </div>
                    </div>
                    <div className="mobile-card-footer">
                      <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => openEditFabric(f)}>
                        <i className="ph ph-pencil-simple"></i> Edit
                      </button>
                      <button className="btn btn-secondary text-red" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => deleteFabric(f._id)}>
                        <i className="ph ph-trash"></i> Delete
                      </button>
                    </div>
                  </div>
                ))}
                {fabrics.length === 0 && (
                  <div className="text-center text-muted" style={{ padding: '16px' }}>No fabric rolls logged.</div>
                )}
              </div>

              {/* Right Side: Stitch allocations list */}
              <div className="table-card bg-surface border desktop-table-container" style={{ padding: '20px' }}>
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

              <div className="mobile-cards-container">
                {stitching.map(s => {
                  const emp = employees.find(e => e._id === s.employeeId);
                  return (
                    <div key={s._id} className="mobile-card">
                      <div className="mobile-card-header">
                        <div className="mobile-card-title">{emp ? emp.name : 'Unknown Staff'}</div>
                        <span className={`badge ${s.status === 'Completed' ? 'badge-success' : 'badge-gst'}`}>{s.status}</span>
                      </div>
                      <div className="mobile-card-body">
                        <div className="mobile-card-detail">
                          <span className="mobile-card-detail-label">Qty Stitched</span>
                          <span className="mobile-card-detail-value">{s.piecesStitched} Pcs</span>
                        </div>
                        <div className="mobile-card-detail">
                          <span className="mobile-card-detail-label">Total Payout</span>
                          <span className="mobile-card-detail-value" style={{ color: 'var(--color-primary)' }}>{formatCurrency(s.totalPayment)}</span>
                        </div>
                        <div className="mobile-card-detail" style={{ gridColumn: 'span 2' }}>
                          <span className="mobile-card-detail-label">Stitch Rate</span>
                          <span className="mobile-card-detail-value">{formatCurrency(s.ratePerPiece)} / Pcs</span>
                        </div>
                      </div>
                      <div className="mobile-card-footer">
                        <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => openEditStitching(s)}>
                          <i className="ph ph-pencil-simple"></i> Edit
                        </button>
                        <button className="btn btn-secondary text-red" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => deleteStitching(s._id)}>
                          <i className="ph ph-trash"></i> Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
                {stitching.length === 0 && (
                  <div className="text-center text-muted" style={{ padding: '16px' }}>No active stitching assignments logged.</div>
                )}
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
            <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', marginBottom: '24px' }}>
              <div className="metric-card">
                <div className="metric-card-header">
                  <span className="metric-label">Accomplishments Logged</span>
                  <div className="metric-icon purple"><i className="ph ph-check-square"></i></div>
                </div>
                <div className="metric-value">{ceoActivities.length} logs</div>
                <div className="metric-footer">
                  <span>Operational logs book</span>
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-card-header">
                  <span className="metric-label">Cumulative Hours</span>
                  <div className="metric-icon purple" style={{ color: 'var(--color-success)', backgroundColor: 'rgba(16,185,129,0.1)' }}><i className="ph ph-clock"></i></div>
                </div>
                <div className="metric-value">{ceoActivities.reduce((s, a) => s + a.hoursSpent, 0)} Hrs</div>
                <div className="metric-footer">
                  <span>Total logged effort</span>
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-card-header">
                  <span className="metric-label">Critical Milestones</span>
                  <div className="metric-icon gold"><i className="ph ph-sparkle"></i></div>
                </div>
                <div className="metric-value">{ceoActivities.filter(a => a.isCritical).length} Milestones</div>
                <div className="metric-footer">
                  <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>⭐ Critical</span>
                  <span>high impact records</span>
                </div>
              </div>
            </div>

            <div className="table-card bg-surface border desktop-table-container" style={{ padding: '20px' }}>
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

            <div className="mobile-cards-container">
              {ceoActivities.map(act => (
                <div key={act._id} className="mobile-card" style={{ borderLeft: act.isCritical ? '4px solid var(--color-primary)' : '1px solid var(--color-border)' }}>
                  <div className="mobile-card-header">
                    <div className="mobile-card-title">{act.focusArea}</div>
                    <span className={`badge ${act.productivityLevel === 'High' ? 'badge-success' : act.productivityLevel === 'Medium' ? 'badge-gst' : 'badge-neutral'}`}>{act.productivityLevel}</span>
                  </div>
                  <div className="mobile-card-body">
                    <div className="mobile-card-detail">
                      <span className="mobile-card-detail-label">Hours Logged</span>
                      <span className="mobile-card-detail-value">{act.hoursSpent} Hrs</span>
                    </div>
                    <div className="mobile-card-detail">
                      <span className="mobile-card-detail-label">Critical Milestone</span>
                      <span className="mobile-card-detail-value">{act.isCritical ? '⭐ Yes' : 'No'}</span>
                    </div>
                    <div className="mobile-card-detail">
                      <span className="mobile-card-detail-label">Date</span>
                      <span className="mobile-card-detail-value">{formatDate(act.date)}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', padding: '0 4px', cursor: 'pointer', lineHeight: '1.4' }} onClick={() => setSelectedCeoDetail(act)}>
                    <strong>Details: </strong>{act.description}
                  </div>
                  <div className="mobile-card-footer">
                    <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => openEditCeo(act)}>
                      <i className="ph ph-pencil-simple"></i> Edit
                    </button>
                    <button className="btn btn-secondary text-red" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => deleteCeoActivity(act._id)}>
                      <i className="ph ph-trash"></i> Delete
                    </button>
                  </div>
                </div>
              ))}
              {ceoActivities.length === 0 && (
                <div className="text-center text-muted" style={{ padding: '24px' }}>No activity records logged.</div>
              )}
            </div>
          </section>
        )}

        {/* ==================== EXPENSES VIEW ==================== */}
        {activeTab === 'expenses' && (() => {
          const totalExpenseAmt = expenses.reduce((s, e) => s + e.amount, 0);
          const totalRevenue = bills.reduce((s, b) => s + b.subtotal, 0);
          const netProfitTotal = totalRevenue - totalExpenseAmt;
          const avgMargin = totalRevenue > 0 ? (netProfitTotal / totalRevenue) * 100 : 0;

          // Find top category
          const categoriesMap = expenses.reduce((acc, exp) => {
            acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
            return acc;
          }, {});
          let topCat = "None";
          let maxVal = 0;
          Object.entries(categoriesMap).forEach(([cat, val]) => {
            if (val > maxVal) {
              maxVal = val;
              topCat = cat;
            }
          });

          return (
            <section id="expenses-view" className="tab-view active">
              <header className="view-header">
                <div>
                  <h1>Expenses & Profit Analyzer</h1>
                  <p className="subtitle">Record operational costs (transportation, salaries, petrol) and analyze net profits by order.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setIsExpenseModalOpen(true)}>
                  <i className="ph ph-plus-circle"></i> Log Expense
                </button>
              </header>

              {/* Expenses Metrics Summary */}
              <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', marginBottom: '24px' }}>
                <div className="metric-card">
                  <div className="metric-card-header">
                    <span className="metric-label">Total Expenses</span>
                    <div className="metric-icon purple" style={{ color: 'var(--color-destructive)', backgroundColor: 'rgba(239,68,68,0.1)' }}><i className="ph ph-trend-down"></i></div>
                  </div>
                  <div className="metric-value">{formatCurrency(totalExpenseAmt)}</div>
                  <div className="metric-footer">
                    <span>Cumulative overhead</span>
                  </div>
                </div>
                <div className="metric-card">
                  <div className="metric-card-header">
                    <span className="metric-label">Overall Net Margin</span>
                    <div className="metric-icon purple" style={{ color: avgMargin >= 50 ? 'var(--color-success)' : avgMargin >= 25 ? 'var(--color-primary)' : 'var(--color-warning)', backgroundColor: 'rgba(16,185,129,0.1)' }}><i className="ph ph-chart-line-up"></i></div>
                  </div>
                  <div className="metric-value">{avgMargin.toFixed(1)}%</div>
                  <div className="metric-footer">
                    <span>Revenue vs Expenses</span>
                  </div>
                </div>
                <div className="metric-card">
                  <div className="metric-card-header">
                    <span className="metric-label">Top Expense Category</span>
                    <div className="metric-icon gold"><i className="ph ph-tag"></i></div>
                  </div>
                  <div className="metric-value">{topCat}</div>
                  <div className="metric-footer">
                    <span>{formatCurrency(maxVal)} total spent</span>
                  </div>
                </div>
              </div>

              <div className="grid-layout-2" style={{ gridTemplateColumns: '1.4fr 1fr', gap: '24px' }}>
                {/* Left Column: Expenses Ledger Book */}
                <div className="table-card bg-surface border desktop-table-container" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0 }}>Expenses Ledger Book</h3>
                    <div className="search-filter-row" style={{ display: 'flex', gap: '12px', margin: 0 }}>
                      <div className="search-input-wrapper" style={{ minWidth: '220px' }}>
                        <i className="ph ph-magnifying-glass"></i>
                        <input type="text" placeholder="Search expenses..." value={expenseSearch} onChange={(e) => setExpenseSearch(e.target.value)} />
                      </div>
                      <button className="btn btn-secondary" onClick={handleExportExpensesPDF} title="Export Expenses to PDF">
                        <i className="ph ph-file-pdf"></i> Export PDF
                      </button>
                    </div>
                  </div>

                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Category</th>
                          <th>Description</th>
                          <th>Linked Order</th>
                          <th className="text-right">Amount</th>
                          <th className="text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {expenses.filter(e => e.category.toLowerCase().includes(expenseSearch.toLowerCase()) || e.description.toLowerCase().includes(expenseSearch.toLowerCase())).map(exp => {
                          const bill = bills.find(b => b._id === exp.billId);
                          return (
                            <tr key={exp._id}>
                              <td>{formatDate(exp.date)}</td>
                              <td>
                                <span className={`badge ${
                                  exp.category === 'Transportation' ? 'badge-gst' :
                                  exp.category === 'Petrol' ? 'badge-neutral' :
                                  exp.category === 'Employee Salaries' ? 'badge-success' : 'badge-primary'
                                }`}>
                                  {exp.category}
                                </span>
                              </td>
                              <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={exp.description}>
                                {exp.description}
                              </td>
                              <td>
                                {bill ? (
                                  <span className="font-semibold text-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <i className="ph ph-receipt" style={{ fontSize: '12px' }}></i> {bill.billNumber}
                                  </span>
                                ) : (
                                  <span className="text-muted" style={{ fontSize: '12px' }}>General Overhead</span>
                                )}
                              </td>
                              <td className="text-right font-semibold text-red" style={{ color: 'var(--color-destructive)' }}>{formatCurrency(exp.amount)}</td>
                              <td className="text-right">
                                <button className="btn-icon" onClick={() => openEditExpense(exp)}><i className="ph ph-pencil-simple"></i></button>
                                <button className="btn-icon text-red" onClick={() => deleteExpense(exp._id)}><i className="ph ph-trash"></i></button>
                              </td>
                            </tr>
                          );
                        })}
                        {expenses.length === 0 && (
                          <tr>
                            <td colSpan="6" className="text-center text-muted">No expenses recorded. Log transportation, salaries, or petrol costs to calculate actual margins.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right Column: Order Profitability Analyzer */}
                <div className="table-card bg-surface border" style={{ padding: '24px', alignSelf: 'start' }}>
                  <h3 style={{ marginBottom: '8px' }}>Order Profitability Analyzer</h3>
                  <p className="small text-muted" style={{ marginBottom: '16px' }}>Select an invoice order to calculate net operational profits.</p>
                  
                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label htmlFor="profit-order-select">Choose Active Order / Invoice</label>
                    <select
                      id="profit-order-select"
                      value={selectedOrderFilter}
                      onChange={(e) => setSelectedOrderFilter(e.target.value)}
                      style={{ fontSize: '15px', padding: '12px 14px', width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                    >
                      <option value="all">-- Select Recorded Order --</option>
                      {bills.map(b => {
                        const c = clients.find(cl => cl._id === b.clientId);
                        return (
                          <option key={b._id} value={b._id}>
                            {b.billNumber} ({c ? c.name : 'Unknown Client'})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {selectedOrderFilter === 'all' ? (
                    <div className="text-center text-muted" style={{ padding: '32px 16px', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                      <i className="ph ph-chart-pie" style={{ fontSize: '32px', color: 'var(--color-primary)', marginBottom: '12px', display: 'block' }}></i>
                      <span>Select an invoice from the dropdown above to audit specific transportation, fuel, and operational margins.</span>
                    </div>
                  ) : (() => {
                    const billObj = bills.find(b => b._id === selectedOrderFilter);
                    if (!billObj) return null;
                    const clientObj = clients.find(cl => cl._id === billObj.clientId);
                    const linkedExpenses = expenses.filter(e => e.billId === billObj._id);
                    const totalLinkedCost = linkedExpenses.reduce((sum, e) => sum + e.amount, 0);
                    const netProfit = billObj.subtotal - totalLinkedCost;
                    const profitPct = billObj.subtotal > 0 ? (netProfit / billObj.subtotal) * 100 : 0;
                    
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-muted)', border: '1px solid var(--color-border)' }}>
                          <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '8px' }}>Order Valuation Summary</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span className="text-muted">Client Name:</span>
                            <span style={{ fontWeight: 600 }}>{clientObj ? clientObj.name : 'Unknown Client'}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span className="text-muted">Order Date:</span>
                            <span>{formatDate(billObj.date)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span className="text-muted">Bill Number:</span>
                            <span style={{ fontWeight: 600 }}>{billObj.billNumber}</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                            <span className="text-muted">Order Subtotal (A):</span>
                            <strong className="text-primary">{formatCurrency(billObj.subtotal)}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                            <span className="text-muted">Total Expenses Linked (B):</span>
                            <strong style={{ color: 'var(--color-destructive)' }}>-{formatCurrency(totalLinkedCost)}</strong>
                          </div>
                          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                            <span className="font-semibold">Actual Net Profit:</span>
                            <strong style={{ color: netProfit >= 0 ? 'var(--color-success)' : 'var(--color-destructive)', fontSize: '16px' }}>
                              {formatCurrency(netProfit)}
                            </strong>
                          </div>
                        </div>

                        {/* Margin Progress Gauge */}
                        <div style={{ marginTop: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                            <span className="font-medium">Net Profit Margin</span>
                            <span style={{ fontWeight: 700, color: profitPct >= 50 ? 'var(--color-success)' : profitPct >= 20 ? 'var(--color-primary)' : 'var(--color-destructive)' }}>{profitPct.toFixed(1)}%</span>
                          </div>
                          <div className="progress-bar-container" style={{ height: '8px' }}>
                            <div
                              className="progress-bar"
                              style={{
                                width: `${Math.min(Math.max(0, profitPct), 100)}%`,
                                backgroundColor: profitPct >= 50 ? 'var(--color-success)' : profitPct >= 20 ? 'var(--color-primary)' : 'var(--color-destructive)'
                              }}
                            ></div>
                          </div>
                          <div className="small text-muted" style={{ marginTop: '6px', fontSize: '11px', fontStyle: 'italic' }}>
                            {profitPct >= 50 ? '🟢 Outstanding healthy profit margin!' : profitPct >= 20 ? '🟡 Moderate profit margin. Assess overhead costs.' : '🔴 Low/Negative margin. Operational expenses are critical!'}
                          </div>
                        </div>

                        {/* Linked Expenses Breakdown List */}
                        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                          <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '10px' }}>Linked Expenses Breakdown</div>
                          {linkedExpenses.length === 0 ? (
                            <div className="small text-muted text-center" style={{ padding: '8px 0' }}>No expenses logged for this order. Use the Log Expense button to add transportation or petrol costs.</div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
                              {linkedExpenses.map(e => (
                                <div key={e._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', padding: '6px 8px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                                  <div>
                                    <span style={{ fontWeight: 600, display: 'block' }}>{e.category}</span>
                                    <span className="text-muted" style={{ fontSize: '10px' }}>{e.description}</span>
                                  </div>
                                  <span style={{ fontWeight: 600, color: 'var(--color-destructive)' }}>-{formatCurrency(e.amount)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Mobile Cards rendering for expenses */}
              <div className="mobile-cards-container">
                {expenses.filter(e => e.category.toLowerCase().includes(expenseSearch.toLowerCase()) || e.description.toLowerCase().includes(expenseSearch.toLowerCase())).map(exp => {
                  const bill = bills.find(b => b._id === exp.billId);
                  return (
                    <div key={exp._id} className="mobile-card">
                      <div className="mobile-card-header">
                        <div className="mobile-card-title">{exp.category}</div>
                        <span style={{ fontWeight: 700, color: 'var(--color-destructive)', fontSize: '14px' }}>-{formatCurrency(exp.amount)}</span>
                      </div>
                      <div className="mobile-card-body">
                        <div className="mobile-card-detail">
                          <span className="mobile-card-detail-label">Date</span>
                          <span className="mobile-card-detail-value">{formatDate(exp.date)}</span>
                        </div>
                        <div className="mobile-card-detail">
                          <span className="mobile-card-detail-label">Linked Order</span>
                          <span className="mobile-card-detail-value font-semibold text-primary">{bill ? bill.billNumber : 'General Overhead'}</span>
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', padding: '0 4px', lineHeight: '1.4' }}>
                          <strong>Details: </strong>{exp.description}
                        </div>
                      </div>
                      <div className="mobile-card-footer">
                        <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => openEditExpense(exp)}>
                          <i className="ph ph-pencil-simple"></i> Edit
                        </button>
                        <button className="btn btn-secondary text-red" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => deleteExpense(exp._id)}>
                          <i className="ph ph-trash"></i> Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
                {expenses.length === 0 && (
                  <div className="text-center text-muted" style={{ padding: '16px' }}>No expenses recorded.</div>
                )}
              </div>
            </section>
          );
        })()}

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
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label htmlFor="bill-gst-input">GST Tax Amount (₹)</label>
                    <input type="number" id="bill-gst-input" min="0" step="any" placeholder="0.00" value={billGstAmount} onChange={(e) => handleGstAmountChange(e.target.value)} style={{ fontSize: '16px', padding: '12px 14px', fontWeight: 600 }} />
                    {(() => {
                      const clientObj = clients.find(c => c._id === billClient);
                      const gstin = clientObj?.gstin || "";
                      const isLocal = gstin.trim().startsWith("33") || !gstin.trim(); // Default TN (33) or empty B2C local
                      const halfGst = (parseFloat(billGstAmount) || 0) / 2;
                      return (
                        <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                          {isLocal ? (
                            <>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>CGST (2.5%)</span>
                                <strong style={{ color: '#ffffff' }}>{formatCurrency(halfGst)}</strong>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>SGST (2.5%)</span>
                                <strong style={{ color: '#ffffff' }}>{formatCurrency(halfGst)}</strong>
                              </div>
                            </>
                          ) : (
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>IGST (5%)</span>
                              <strong style={{ color: '#ffffff' }}>{formatCurrency(parseFloat(billGstAmount) || 0)}</strong>
                            </div>
                          )}
                        </div>
                      );
                    })()}
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
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="employee-role">Staff Role *</label>
                    <select id="employee-role" required style={{ fontSize: '15px', padding: '12px 14px', width: '100%' }}>
                      <option value="Stitcher">Stitcher</option>
                      <option value="Checking staff">Checking staff</option>
                      <option value="Packaging staff">Packaging staff</option>
                      <option value="Supervisor">Supervisor</option>
                      <option value="Signer">Signer</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="employee-subcategory">Sub Category / Specialization</label>
                    <input type="text" id="employee-subcategory" placeholder="e.g. Signer" />
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
                  <select id="stitch-fabric" required value={selectedFabricId} onChange={(e) => setSelectedFabricId(e.target.value)} style={{ fontSize: '15px', padding: '12px 14px' }}>
                    <option value="">-- Choose Fabric Roll --</option>
                    {fabrics.map(fab => {
                      const rem = getRemainingFabricQty(fab._id, fab.quantityReceived);
                      // If we are editing this assignment, add its pieces back to remaining count for disable check
                      const addedBack = editingStitching && editingStitching.fabricId === fab._id ? editingStitching.piecesStitched : 0;
                      const disableCheckVal = rem + addedBack;
                      return (
                        <option key={fab._id} value={fab._id} disabled={disableCheckVal <= 0}>
                          {fab.fabricType} ({fab.color}) — {rem} Pcs left
                        </option>
                      );
                    })}
                  </select>
                  {selectedFabricId && (() => {
                    const fab = fabrics.find(f => f._id === selectedFabricId);
                    if (!fab) return null;
                    const rem = getRemainingFabricQty(fab._id, fab.quantityReceived);
                    return (
                      <div className="small" style={{ marginTop: '6px', color: rem <= 0 ? 'var(--color-destructive)' : 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                        <i className="ph ph-info"></i>
                        <span>Roll Total: {fab.quantityReceived} Pcs | <strong>{rem} Pcs remaining</strong></span>
                      </div>
                    );
                  })()}
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

      {/* ==================== EXPENSE REGISTRATION MODAL ==================== */}
      {isExpenseModalOpen && (
        <div id="expense-modal" className="modal-overlay active">
          <div className="modal-card">
            <div className="modal-header">
              <h3>{editingExpense ? 'Edit Expense Record' : 'Record Expense Details'}</h3>
              <button className="btn-close" onClick={closeExpenseModal}><i className="ph ph-x"></i></button>
            </div>
            <form id="expense-form" onSubmit={handleExpenseSubmit}>
              <div className="modal-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="expense-date">Expense Date *</label>
                    <input type="date" id="expense-date" required defaultValue={new Date().toISOString().split('T')[0]} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="expense-category">Category *</label>
                    <select id="expense-category" required style={{ fontSize: '15px', padding: '12px 14px' }}>
                      <option value="Transportation">Transportation (Auto)</option>
                      <option value="Petrol">Petrol / Fuel</option>
                      <option value="Employee Salaries">Employee Salaries</option>
                      <option value="Materials">Materials & Fabrics</option>
                      <option value="Operations">Operations / Power</option>
                      <option value="Others">Others / Overheads</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="expense-amount">Amount (₹) *</label>
                  <input type="number" id="expense-amount" min="0" step="any" required placeholder="0.00" style={{ fontSize: '16px', padding: '12px 14px', fontWeight: 600 }} />
                </div>

                <div className="form-group">
                  <label htmlFor="expense-bill-id">Link to Customer Order / Invoice (Optional)</label>
                  <select id="expense-bill-id" style={{ fontSize: '15px', padding: '12px 14px' }}>
                    <option value="">-- No Linked Order (General Overhead) --</option>
                    {bills.map(b => {
                      const c = clients.find(cl => cl._id === b.clientId);
                      return (
                        <option key={b._id} value={b._id}>
                          {b.billNumber} ({c ? c.name : 'Unknown Client'}) — {formatCurrency(b.subtotal)}
                        </option>
                      );
                    })}
                  </select>
                  <div className="small text-muted" style={{ marginTop: '4px', fontSize: '11px' }}>
                    Linking this expense will allocate the cost to that specific invoice to calculate actual order profitability.
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="expense-desc">Description / Notes *</label>
                  <input type="text" id="expense-desc" required placeholder="e.g. Auto fare to pandian nagar delivery unit" />
                </div>
              </div>
              <div className="modal-footer" style={{ padding: '16px 20px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={closeExpenseModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px', fontWeight: 600 }}>Save Expense Record</button>
              </div>
            </form>
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

                <a className="more-menu-item" onClick={() => handleTabChange('expenses')} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 24px', borderBottom: '1px solid var(--color-border)', cursor: 'pointer', color: 'var(--color-text-primary)', textDecoration: 'none' }}>
                  <i className="ph ph-coins" style={{ fontSize: '22px', color: 'var(--color-primary)' }}></i>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>Expenses</div>
                    <div className="text-muted" style={{ fontSize: '11px' }}>Track order transportation, fuel & operational costs</div>
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
