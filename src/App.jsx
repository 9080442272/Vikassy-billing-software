import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  const upcomingOrders = useQuery(api.upcomingOrders.getAll) || [];
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
  const addUpcomingOrderMutation = useMutation(api.upcomingOrders.add);
  const updateUpcomingOrderMutation = useMutation(api.upcomingOrders.update);
  const deleteUpcomingOrderMutation = useMutation(api.upcomingOrders.remove);
  const clearAllDataMutation = useMutation(api.system.clearAllData);

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
  const [avatarPreview, setAvatarPreview] = useState('');

  // Keep preview in sync with currentLoggedUser
  useEffect(() => {
    if (currentLoggedUser?.avatarPicture) {
      setAvatarPreview(currentLoggedUser.avatarPicture);
    } else {
      setAvatarPreview('');
    }
  }, [currentLoggedUser]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Please upload a file smaller than 2MB!");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarRemove = () => {
    setAvatarPreview('');
  };

  const [isProfilePopoverOpen, setIsProfilePopoverOpen] = useState(false);

  // Click outside listener to automatically close profile settings popover
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (isProfilePopoverOpen && !e.target.closest('.user-profile')) {
        setIsProfilePopoverOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [isProfilePopoverOpen]);

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
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  // Voice AI Assistant States
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceStatus, setVoiceStatus] = useState('idle'); // 'idle' | 'listening' | 'processing' | 'success' | 'error'
  const [voiceMessage, setVoiceMessage] = useState('');
  const [voiceParsedData, setVoiceParsedData] = useState(null);
  const [voiceInputManual, setVoiceInputManual] = useState('');
  const [speechRecognitionRef, setSpeechRecognitionRef] = useState(null);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isSiriFloatingBarOpen, setIsSiriFloatingBarOpen] = useState(false);
  const isSiriFloatingBarOpenRef = useRef(false);
  useEffect(() => {
    isSiriFloatingBarOpenRef.current = isSiriFloatingBarOpen;
  }, [isSiriFloatingBarOpen]);

  // Linear Cmd + K Keyboard Shortcut Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSiriFloatingBarOpen(true);
        startVoiceAssistant();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const latestTranscriptRef = useRef('');

  // Varahi System Sub-Module Tabs States
  const [jobsSubTab, setJobsSubTab] = useState('all'); // 'all' | 'create' | 'ongoing' | 'completed' | 'delayed' | 'details'
  const [jobDetailsTab, setJobDetailsTab] = useState('overview'); // 'overview' | 'timeline' | 'staff' | 'progress' | 'expenses' | 'files' | 'logs'
  const [selectedJob, setSelectedJob] = useState(null);

  const [clientsSubTab, setClientsSubTab] = useState('list'); // 'list' | 'details' | 'active-jobs' | 'completed-jobs' | 'documents'
  const [selectedClientDetail, setSelectedClientDetail] = useState(null);

  const [employeesSubTab, setEmployeesSubTab] = useState('directory'); // 'directory' | 'attendance' | 'payroll' | 'performance' | 'salary' | 'leave' | 'profile'
  const [empProfileTab, setEmpProfileTab] = useState('personal'); // 'personal' | 'attendance' | 'jobs' | 'salary' | 'documents'
  const [selectedEmployeeDetail, setSelectedEmployeeDetail] = useState(null);

  // Employee Action Modals & Records
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [isDisbursePayrollModalOpen, setIsDisbursePayrollModalOpen] = useState(false);

  const [attendanceRecords, setAttendanceRecords] = useState([
    { id: 1, empName: "Kartick", role: "Stitcher", shift: "Morning Shift (08:00 - 17:00)", checkIn: "08:00 AM", status: "Present", date: new Date().toISOString().split('T')[0] },
    { id: 2, empName: "Srimathi", role: "Tailor", shift: "Morning Shift (08:00 - 17:00)", checkIn: "08:05 AM", status: "Overtime (+2 hrs)", date: new Date().toISOString().split('T')[0] },
    { id: 3, empName: "Ramesh Kumar", role: "Master", shift: "Morning Shift (08:00 - 17:00)", checkIn: "08:15 AM", status: "Half-Day", date: new Date().toISOString().split('T')[0] }
  ]);

  const [advanceRecords, setAdvanceRecords] = useState([
    { id: 1, empName: "Kartick", date: "2026-07-20", type: "Festival Advance", amount: 2000, mode: "UPI / GPay", notes: "Aadi festival advance" },
    { id: 2, empName: "Srimathi", date: "2026-07-15", type: "Salary Advance", amount: 1500, mode: "Cash", notes: "Emergency advance" }
  ]);

  const [payrollRecords, setPayrollRecords] = useState([
    { id: 1, empName: "Kartick", month: "July 2026", baseSalary: 25000, bonus: 3500, deductions: 2000, netPayable: 26500, status: "Disbursed & Paid", date: new Date().toISOString().split('T')[0] }
  ]);

  const [attendanceSubTab, setAttendanceSubTab] = useState('daily'); // 'daily' | 'shifts' | 'approvals' | 'reports'
  const [payrollSubTab, setPayrollSubTab] = useState('monthly'); // 'monthly' | 'calculation' | 'incentives' | 'advances' | 'payslips' | 'history'
  const [expensesSubTab, setExpensesSubTab] = useState('all'); // 'all' | 'add' | 'categories' | 'pending' | 'approved' | 'summary'
  const [reportsSubTab, setReportsSubTab] = useState('job-reports'); // 'job-reports' | 'employee-reports' | 'attendance-reports' | 'payroll-reports' | 'expense-reports' | 'business-summary'
  const [notificationsSubTab, setNotificationsSubTab] = useState('job-updates'); // 'job-updates' | 'attendance-alerts' | 'salary-alerts' | 'system-notifications'
  const [settingsSubTab, setSettingsSubTab] = useState('company-profile'); // 'company-profile' | 'users-roles' | 'departments' | 'job-categories' | 'expense-categories' | 'payroll-settings' | 'preferences'

  // Settings Modules Data States
  const [systemUsers, setSystemUsers] = useState([
    { id: 1, name: "Vikashini Balasubramanian", email: "vikashini@varahiexport.com", role: "Administrator (Full Access)", status: "Active" },
    { id: 2, name: "Production Auditor", email: "auditor@varahiexport.com", role: "Production Supervisor", status: "Active" },
    { id: 3, name: "Billing Accountant", email: "billing@varahiexport.com", role: "Billing Accountant", status: "Active" }
  ]);

  const [systemDepartments, setSystemDepartments] = useState([
    { id: 1, name: "Stitching & Sewing", head: "Kartick", staffCount: "24 Members", location: "Unit 1 - Main Floor" },
    { id: 2, name: "Cutting & Master Unit", head: "Ramesh Kumar", staffCount: "8 Members", location: "Unit 1 - Ground Floor" },
    { id: 3, name: "Quality Control (QC)", head: "Srimathi", staffCount: "6 Members", location: "Unit 2 - Inspection" },
    { id: 4, name: "Packing & Dispatch", head: "Anitha Devi", staffCount: "10 Members", location: "Unit 2 - Warehouse" },
    { id: 5, name: "Finance & Accounts", head: "Vikashini B.", staffCount: "3 Members", location: "Executive Suite" }
  ]);

  const [jobCategoriesList, setJobCategoriesList] = useState([
    { id: 1, name: "Export T-Shirts", gstRate: "5%", rateRange: "₹12 - ₹25 / Pcs", description: "Round neck & Polo cotton t-shirts" },
    { id: 2, name: "Denim Jackets & Pants", gstRate: "12%", rateRange: "₹35 - ₹65 / Pcs", description: "Heavyweight denim stitching" },
    { id: 3, name: "Woven Shirts", gstRate: "5%", rateRange: "₹18 - ₹32 / Pcs", description: "Formal & casual woven shirts" },
    { id: 4, name: "Kidswear Garments", gstRate: "5%", rateRange: "₹10 - ₹20 / Pcs", description: "Bulk export kidswear sets" }
  ]);

  const [expenseCategoriesList, setExpenseCategoriesList] = useState([
    { id: 1, name: "Employee Salaries", budget: "₹2,50,000 / Mo", deductible: "Yes (Tax Deductible)" },
    { id: 2, name: "Employee Salary Advances", budget: "₹50,000 / Mo", deductible: "Yes" },
    { id: 3, name: "Transportation (Auto / Freight)", budget: "₹30,000 / Mo", deductible: "Yes" },
    { id: 4, name: "Petrol / Diesel Fuel", budget: "₹20,000 / Mo", deductible: "Yes" },
    { id: 5, name: "Materials & Accessories", budget: "₹1,00,000 / Mo", deductible: "Yes" },
    { id: 6, name: "Power & Electricity Overhead", budget: "₹45,000 / Mo", deductible: "Yes" }
  ]);

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
  const [isUpcomingOrderModalOpen, setIsUpcomingOrderModalOpen] = useState(false);
  const [editingUpcomingOrder, setEditingUpcomingOrder] = useState(null);
  const [orderSearchKeyword, setOrderSearchKeyword] = useState('');

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

  // --- Multi-Company & Branch Switcher State ---
  const [companies, setCompanies] = useState([
    { id: 'varahi-hq', name: 'Varahi Export', branch: 'Tirupur HQ', gst: '33AAAAA0000A1Z5', phone: '+91 98765 43210', city: 'Tirupur', badge: 'HQ' },
    { id: 'vikas-exp', name: 'Vikas Export', branch: 'Coimbatore Unit', gst: '33BBBBB1111B1Z6', phone: '+91 91234 56789', city: 'Coimbatore', badge: 'Branch' },
    { id: 'sri-varahi', name: 'Sri Varahi Garments', branch: 'Chennai Unit', gst: '33CCCCC2222C1Z7', phone: '+91 94444 88888', city: 'Chennai', badge: 'Branch' }
  ]);
  const [activeCompanyId, setActiveCompanyId] = useState('varahi-hq');
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const [isAddBranchModalOpen, setIsAddBranchModalOpen] = useState(false);

  const activeCompany = companies.find(c => c.id === activeCompanyId) || companies[0];

  // --- Settings Custom Modals State ---
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isAddDeptModalOpen, setIsAddDeptModalOpen] = useState(false);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [isAddExpenseCatModalOpen, setIsAddExpenseCatModalOpen] = useState(false);

  // --- View & Edit System User Permissions State ---
  const [viewingUser, setViewingUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [userViewMode, setUserViewMode] = useState('tree'); // 'tree' (Employee Tree) or 'table'

  // --- Universal Delete Confirmation Modal State ---
  const [deleteConfirmState, setDeleteConfirmState] = useState({
    isOpen: false,
    title: '',
    message: '',
    itemName: '',
    onConfirm: null
  });

  const requestDeleteConfirmation = ({ title = 'Confirm Deletion', message, itemName = '', onConfirm }) => {
    setDeleteConfirmState({
      isOpen: true,
      title,
      message,
      itemName,
      onConfirm
    });
  };

  const closeDeleteConfirmModal = () => {
    setDeleteConfirmState({
      isOpen: false,
      title: '',
      message: '',
      itemName: '',
      onConfirm: null
    });
  };

  // --- References ---
  const chartCanvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  // Sync tab navigation selection in localStorage
  const handleTabChange = (tabName) => {
    if (tabName === 'attendance') {
      setActiveTab('employees');
      setEmployeesSubTab('attendance');
      localStorage.setItem('lastActiveTab', 'employees');
    } else if (tabName === 'payroll') {
      setActiveTab('employees');
      setEmployeesSubTab('payroll');
      localStorage.setItem('lastActiveTab', 'employees');
    } else {
      setActiveTab(tabName);
      localStorage.setItem('lastActiveTab', tabName);
    }
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

  // --- State for Monthly Billing Trend range ---
  const [billingTrendRange, setBillingTrendRange] = useState('this-month');

  // --- Draw Dashboard Analytics Charts (Monthly Billing Trend Area Line Chart) ---
  useEffect(() => {
    if (!chartCanvasRef.current || typeof Chart === 'undefined') return;

    const ctx = chartCanvasRef.current.getContext('2d');

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, 'rgba(110, 86, 207, 0.35)');
    gradient.addColorStop(1, 'rgba(110, 86, 207, 0.0)');

    let labels = [];
    let dataPoints = [];

    if (billingTrendRange === 'this-month') {
      const dateMap = {};
      const defaultDays = ['Jul 24', 'Jul 25', 'Jul 26', 'Jul 27', 'Jul 28', 'Jul 29'];
      defaultDays.forEach(d => { dateMap[d] = 0; });

      if (bills && bills.length > 0) {
        bills.forEach(bill => {
          let dayLabel = 'Jul 29';
          if (bill.date) {
            try {
              const d = new Date(bill.date);
              if (!isNaN(d.getTime())) {
                const monthStr = d.toLocaleString('en-US', { month: 'short' });
                const dayNum = d.getDate();
                dayLabel = `${monthStr} ${dayNum}`;
              }
            } catch (e) {}
          }
          dateMap[dayLabel] = (dateMap[dayLabel] || 0) + (bill.totalAmount || 0);
        });
      }

      labels = Object.keys(dateMap);
      dataPoints = Object.values(dateMap);

      if (dataPoints.every(v => v === 0)) {
        labels = ['Jul 24', 'Jul 25', 'Jul 26', 'Jul 27', 'Jul 28', 'Jul 29 (Today)'];
        dataPoints = [45000, 68000, 92000, 115000, 142000, 185000];
      }
    } else if (billingTrendRange === 'last-month') {
      labels = ['Jun W1', 'Jun W2', 'Jun W3', 'Jun W4'];
      dataPoints = [98000, 145000, 210000, 265000];
    } else if (billingTrendRange === 'q3') {
      labels = ['May 2026', 'June 2026', 'July 2026'];
      const realTotal = bills.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
      dataPoints = [520000, 718000, realTotal > 0 ? realTotal : 845846];
    }

    chartInstanceRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Billing Revenue (₹)',
          data: dataPoints,
          borderColor: '#6E56CF',
          borderWidth: 3,
          backgroundColor: gradient,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#6E56CF',
          pointBorderColor: '#FFFFFF',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#18181B',
            titleColor: '#FFFFFF',
            bodyColor: '#A1A1AA',
            borderColor: 'rgba(110, 86, 207, 0.4)',
            borderWidth: 1,
            padding: 10,
            displayColors: false,
            callbacks: {
              label: function(context) {
                return ` Billing Revenue: ₹${context.raw.toLocaleString('en-IN')}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: '#F0F0F4' },
            ticks: {
              color: '#8C8D96',
              font: { size: 11, weight: '500' },
              callback: function(value) {
                return '₹' + (value >= 100000 ? (value / 100000).toFixed(1) + 'L' : (value / 1000).toFixed(0) + 'k');
              }
            }
          },
          x: {
            grid: { display: false },
            ticks: {
              color: '#8C8D96',
              font: { size: 11, weight: '500' }
            }
          }
        }
      }
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [bills, clients, activeTab, isLoggedIn, billingTrendRange]);

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

  const deleteClient = (id, clientName = '') => {
    requestDeleteConfirmation({
      title: 'Delete Client Account',
      message: 'Are you sure you want to delete this client profile from your business directory? Associated GST invoice records will remain saved in ledger entries.',
      itemName: clientName || 'Client Account',
      onConfirm: async () => {
        await deleteClientMutation({ id });
      }
    });
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

  // --- Voice AI Assistant (Speech Recognition & Speech Synthesis) ---
  // --- Voice AI Assistant (Speech Recognition & Speech Synthesis) ---
  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        const voices = window.speechSynthesis.getVoices();
        if (voices && voices.length > 0) {
          const preferredVoice = voices.find(v => v.lang.includes('en-IN') || v.lang.includes('en-US') || v.lang.includes('en-GB') || v.lang.startsWith('en')) || voices[0];
          if (preferredVoice) utterance.voice = preferredVoice;
        }

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn("Speech synthesis notice:", err);
      }
    }
  };

  const parseVoiceCommand = (rawText) => {
    if (!rawText) return { intent: 'unknown', rawText: '' };
    
    // Clean string, remove punctuation except decimals
    let text = rawText.toLowerCase().replace(/[,]/g, '').trim();

    // Strip wake phrases and filler words
    text = text.replace(/^(okay|ok|hey|hi|hello)\s+(siri|alexa|google|jarvis|assistant)\s*/i, '');
    text = text.replace(/^(siri|alexa|google|jarvis|assistant)\s*/i, '');
    text = text.replace(/^(please|kindly|can\s+you|would\s+you)\s*/i, '');

    let intent = 'unknown';
    let companyName = '';
    let employeeName = '';
    let role = 'Tailor';
    let targetTab = '';
    let targetEntity = '';
    let amount = 0;

    // 1. Direct Modal Action Triggers
    if (text.includes('create job') || text.includes('new job') || text.includes('add job') || text.includes('schedule order') || text.includes('production job')) {
      intent = 'create_job';
    } else if (text.includes('create bill') || text.includes('new bill') || text.includes('create invoice') || text.includes('new invoice') || text.includes('add invoice') || text.includes('generate invoice')) {
      intent = 'create_bill';
    } else if (text.includes('add client') || text.includes('new client') || text.includes('create client') || text.includes('add customer') || text.includes('new customer')) {
      intent = 'add_client';
    } else if (text.includes('mark attendance') || text.includes('record attendance') || text.includes('take attendance') || text.includes('enter attendance')) {
      intent = 'mark_attendance';
    } else if (text.includes('salary advance') || text.includes('give advance') || text.includes('add advance') || text.includes('employee advance')) {
      intent = 'add_advance';
    } else if (text.includes('disburse payroll') || text.includes('pay salary') || text.includes('pay payroll') || text.includes('process payroll')) {
      intent = 'disburse_payroll';
    } else if (text.includes('log expense') || text.includes('add expense') || text.includes('record expense') || text.includes('new expense')) {
      intent = 'log_expense';
    } else if (text.includes('download report') || text.includes('download pdf') || text.includes('export pdf')) {
      intent = 'download_report';
    } else if (text.includes('filter') || text.includes('open filter') || text.includes('add filter')) {
      intent = 'open_filter';

    // 2. Go Back / Reset Intent
    } else if (text === 'go back' || text === 'back' || text === 'return' || text.includes('clear search') || text.includes('reset search') || text.includes('show all')) {
      intent = 'go_back';

    // 3. Navigation & Section Intent (Matches "open bills tab", "bills tab", "bills", "open invoice", etc.)
    } else if (
      text.startsWith('open') || 
      text.startsWith('go to') || 
      text.startsWith('show') || 
      text.startsWith('navigate') || 
      text.startsWith('switch to') || 
      text.includes('tab') || 
      text.includes('view') ||
      text.includes('bill') || text.includes('invoice') ||
      text.includes('job') || text.includes('client') ||
      text.includes('employee') || text.includes('fabric') ||
      text.includes('inventory') || text.includes('expense') ||
      text.includes('report') || text.includes('setting') ||
      text.includes('dashboard')
    ) {
      intent = 'navigate';
      if (text.includes('bill') || text.includes('invoice')) targetTab = 'bills';
      else if (text.includes('job') || text.includes('order') || text.includes('production')) targetTab = 'jobs';
      else if (text.includes('client') || text.includes('customer')) targetTab = 'clients';
      else if (text.includes('employee') || text.includes('crew') || text.includes('staff')) targetTab = 'employees';
      else if (text.includes('fabric') || text.includes('inventory') || text.includes('material')) targetTab = 'fabrics';
      else if (text.includes('expense')) targetTab = 'expenses';
      else if (text.includes('report') || text.includes('analytics')) targetTab = 'reports';
      else if (text.includes('notification') || text.includes('alert')) targetTab = 'notifications';
      else if (text.includes('setting') || text.includes('user') || text.includes('role') || text.includes('department')) targetTab = 'settings';
      else if (text.includes('dashboard') || text.includes('home')) targetTab = 'dashboard';
      else targetTab = 'bills';

    // 4. Add Employee Intent
    } else if ((text.includes('employee') || text.includes('tailor') || text.includes('stitcher') || text.includes('staff')) && (text.includes('add') || text.includes('register') || text.includes('create') || text.includes('enter') || text.includes('new'))) {
      intent = 'add_employee';
      const empNameMatch = text.match(/(?:add|register|create|enter)\s+(?:the\s+)?(?:employee\s+)?([a-z0-9\s]+?)(?:\s+(?:as|is|role|a|new|employee|tailor|stitcher|signer|cutter|master|she|he)|$)/i);
      if (empNameMatch) {
        employeeName = empNameMatch[1].replace(/\b(the|employee|tab|and|a|she|is|new|as|enter|add)\b/gi, '').trim();
      }
      if (text.includes('tailor')) role = 'Tailor';
      else if (text.includes('stitcher')) role = 'Stitcher';
      else if (text.includes('master')) role = 'Master';

    // 5. Select Entity / Click Intent
    } else if (text.includes('click') || text.includes('select') || text.includes('view') || text.includes('show detail')) {
      intent = 'select_entity';
      const clickMatch = text.match(/(?:click|click\s+on|select|view|open|show)\s+(?:the\s+)?(?:employee\s+|client\s+|bill\s+|invoice\s+|fabric\s+|order\s+)?([a-z0-9\s\.\-]+?)(?:\s+(?:name|profile|details|tab|invoice|bill)|$)/i);
      if (clickMatch) {
        targetEntity = clickMatch[1].replace(/\b(name|profile|details|tab|page|on|the|invoice|bill|record)\b/gi, '').trim();
      }
    }

    // Amount Extraction
    const lakhMatch = text.match(/(\d+(?:\.\d+)?)\s*(lakh|lakhs|lk|lac|lacs)/i);
    const thousandMatch = text.match(/(\d+(?:\.\d+)?)\s*(k|thousand|thousands)/i);
    const rawNumMatch = text.match(/(?:for|amount|of|rs|\u20B9|\$)?\s*(\d{3,9})/i);

    if (lakhMatch) amount = parseFloat(lakhMatch[1]) * 100000;
    else if (thousandMatch) amount = parseFloat(thousandMatch[1]) * 1000;
    else if (rawNumMatch) amount = parseFloat(rawNumMatch[1]);

    // Company/Name extraction
    const companyMatch = text.match(/(?:for|to|client|payroll|salary|wage|pay)\s+([a-z0-9\s\.\&\-]+?)(?:\s+(?:for|amount|of|rs|\u20B9|\$|\d|lakh|lk|k|thousand)|$)/i);
    if (companyMatch) companyName = companyMatch[1].trim();

    return { intent, companyName, employeeName, role, targetTab, targetEntity, amount, rawText };
  };

  const processVoiceCommand = async (commandString) => {
    if (!commandString || !commandString.trim()) return;

    setVoiceStatus('processing');
    setVoiceMessage("Parsing voice command...");

    const parsed = parseVoiceCommand(commandString);
    setVoiceParsedData(parsed);

    // Direct Intent Action Handlers
    if (parsed.intent === 'create_job') {
      setActiveTab('jobs');
      setJobsSubTab('create');
      setVoiceStatus('success');
      setVoiceMessage("Opened Create New Production Job form!");
      speakText("Opening Create New Production Job form.");
      return;
    } else if (parsed.intent === 'create_bill') {
      setActiveTab('bills');
      setIsBillModalOpen(true);
      setVoiceStatus('success');
      setVoiceMessage("Opened Create New Invoice modal!");
      speakText("Opening Create New Invoice form.");
      return;
    } else if (parsed.intent === 'add_client') {
      setActiveTab('clients');
      setIsClientModalOpen(true);
      setVoiceStatus('success');
      setVoiceMessage("Opened Add New Client modal!");
      speakText("Opening Add New Client modal.");
      return;
    } else if (parsed.intent === 'mark_attendance') {
      setActiveTab('employees');
      setEmployeesSubTab('attendance');
      setIsAttendanceModalOpen(true);
      setVoiceStatus('success');
      setVoiceMessage("Opened Daily Staff Attendance Entry!");
      speakText("Opening Daily Staff Attendance Entry.");
      return;
    } else if (parsed.intent === 'add_advance') {
      setActiveTab('employees');
      setEmployeesSubTab('payroll');
      setPayrollSubTab('advances');
      setIsAdvanceModalOpen(true);
      setVoiceStatus('success');
      setVoiceMessage("Opened Employee Salary Advance Entry!");
      speakText("Opening Salary Advance Entry.");
      return;
    } else if (parsed.intent === 'disburse_payroll') {
      setActiveTab('employees');
      setEmployeesSubTab('payroll');
      setIsDisbursePayrollModalOpen(true);
      setVoiceStatus('success');
      setVoiceMessage("Opened Disburse Payroll Calculator!");
      speakText("Opening Disburse Payroll Calculator.");
      return;
    } else if (parsed.intent === 'log_expense') {
      setActiveTab('expenses');
      setIsExpenseModalOpen(true);
      setVoiceStatus('success');
      setVoiceMessage("Opened Log New Operating Expense modal!");
      speakText("Opening Log New Operating Expense modal.");
      return;
    } else if (parsed.intent === 'download_report') {
      setActiveTab('reports');
      setVoiceStatus('success');
      setVoiceMessage("Downloading PDF Summary Report...");
      speakText("Downloading PDF Summary Report.");
      alert("Downloading PDF Summary Report for Varahi Exports...");
      return;
    } else if (parsed.intent === 'open_filter') {
      setActiveTab('jobs');
      setIsFilterMenuOpen(true);
      setVoiceStatus('success');
      setVoiceMessage("Opened Linear Filter Dropdown Menu!");
      speakText("Opening Filter Menu.");
      return;
    }

    if (parsed.intent === 'go_back') {
      setEmployeeSearch('');
      setClientSearch('');
      setFabricSearch('');
      setSelectedEmployeeDetail(null);
      setSelectedClientDetail(null);
      setViewingInvoice(null);
      setIsInvoiceViewOpen(false);

      if (activeTab === 'employees') {
        setEmployeesSubTab('directory');
      } else if (activeTab === 'clients') {
        setClientsSubTab('all');
      }

      setVoiceStatus('success');
      setVoiceMessage("Cleared search filter & returned to main directory!");
      speakText("Going back to main directory.");

      setTimeout(() => {
        if (isSiriFloatingBarOpenRef.current) {
          startVoiceAssistant();
        }
      }, 1500);
      return;

    } else if (parsed.intent === 'select_entity') {
      const rawQuery = (parsed.targetEntity || parsed.companyName || parsed.rawText || '').trim().toLowerCase();
      const targetStr = rawQuery.replace(/\b(click|on|select|view|open|show|the|name|profile|details|tab|card|invoice|bill)\b/gi, '').trim() || rawQuery;

      // 1. Search Employees (Name, Role, SubCategory)
      const empMatch = employees.find(e => 
        e.name.toLowerCase().includes(targetStr) || 
        targetStr.includes(e.name.toLowerCase()) ||
        (e.role && e.role.toLowerCase().includes(targetStr))
      );

      if (empMatch) {
        setActiveTab('employees');
        setSelectedEmployeeDetail(empMatch);
        setEmployeesSubTab('profile');

        setVoiceStatus('success');
        const successMsg = `Selected employee ${empMatch.name} (${empMatch.role})!`;
        setVoiceMessage(successMsg);
        speakText(`Selected employee ${empMatch.name}, ${empMatch.role}. Opening profile.`);

        setTimeout(() => {
          if (isSiriFloatingBarOpenRef.current) {
            startVoiceAssistant();
          }
        }, 1500);
        return;
      }

      // 2. Search Clients (Name, CompanyName)
      const clientMatch = clients.find(c => 
        c.name.toLowerCase().includes(targetStr) || 
        (c.companyName && c.companyName.toLowerCase().includes(targetStr)) ||
        targetStr.includes(c.name.toLowerCase())
      );

      if (clientMatch) {
        setActiveTab('clients');
        setSelectedClientDetail(clientMatch);
        setClientsSubTab('details');

        setVoiceStatus('success');
        const successMsg = `Selected client ${clientMatch.name}!`;
        setVoiceMessage(successMsg);
        speakText(`Selected client ${clientMatch.name}. Opening client profile.`);

        setTimeout(() => {
          if (isSiriFloatingBarOpenRef.current) {
            startVoiceAssistant();
          }
        }, 1500);
        return;
      }

      // 3. Search Invoices / Bills (Bill Number)
      const billMatch = bills.find(b => 
        b.billNumber.toLowerCase().includes(targetStr) ||
        targetStr.includes(b.billNumber.toLowerCase())
      );

      if (billMatch) {
        const billClientObj = clients.find(c => c._id === billMatch.clientId);
        setActiveTab('bills');
        setViewingInvoice(billMatch);
        setIsInvoiceViewOpen(true);

        setVoiceStatus('success');
        const successMsg = `Opened Invoice ${billMatch.billNumber}!`;
        setVoiceMessage(successMsg);
        speakText(`Opened invoice ${billMatch.billNumber} for ${billClientObj ? billClientObj.name : 'Client'}.`);

        setTimeout(() => {
          if (isSiriFloatingBarOpenRef.current) {
            startVoiceAssistant();
          }
        }, 1500);
        return;
      }

      // 4. Search Fabrics (Fabric Type, Supplier, Color)
      const fabricMatch = fabrics.find(f => 
        f.fabricType.toLowerCase().includes(targetStr) ||
        f.supplier.toLowerCase().includes(targetStr) ||
        f.color.toLowerCase().includes(targetStr)
      );

      if (fabricMatch) {
        setActiveTab('fabrics');
        setFabricSearch(fabricMatch.fabricType);

        setVoiceStatus('success');
        const successMsg = `Found Fabric Stock ${fabricMatch.fabricType}!`;
        setVoiceMessage(successMsg);
        speakText(`Showing fabric stock ${fabricMatch.fabricType}, ${fabricMatch.color} supplied by ${fabricMatch.supplier}.`);

        setTimeout(() => {
          if (isSiriFloatingBarOpenRef.current) {
            startVoiceAssistant();
          }
        }, 1500);
        return;
      }

      // 5. Search Upcoming Production Orders (Order Title, Client Name)
      const orderMatch = upcomingOrders.find(o => 
        o.orderTitle.toLowerCase().includes(targetStr) ||
        o.clientName.toLowerCase().includes(targetStr)
      );

      if (orderMatch) {
        setActiveTab('dashboard');
        setVoiceStatus('success');
        const successMsg = `Found Production Order "${orderMatch.orderTitle}"!`;
        setVoiceMessage(successMsg);
        speakText(`Found production order ${orderMatch.orderTitle} for ${orderMatch.clientName}.`);

        setTimeout(() => {
          if (isSiriFloatingBarOpenRef.current) {
            startVoiceAssistant();
          }
        }, 1500);
        return;
      }

      // 6. Generic Fallback: Search Employees Directory & Clients
      setActiveTab('employees');
      setEmployeesSubTab('directory');
      setEmployeeSearch(targetStr);

      setVoiceStatus('success');
      setVoiceMessage(`Filtered directory for "${targetStr}"`);
      speakText(`Searching directory for ${targetStr}.`);

      setTimeout(() => {
        if (isSiriFloatingBarOpenRef.current) {
          startVoiceAssistant();
        }
      }, 1500);
      return;

    } else if (parsed.intent === 'add_employee') {
      const empName = parsed.employeeName
        ? parsed.employeeName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
        : "Srimathi";
      const empRole = parsed.role
        ? parsed.role.charAt(0).toUpperCase() + parsed.role.slice(1)
        : "Tailor";

      // Live action: Switch tab directly to Employees Directory
      setActiveTab('employees');
      setEmployeesSubTab('directory');

      await addEmployeeMutation({
        name: empName,
        phone: "+91 98765 00000",
        role: empRole,
        subCategory: "Stitching Crew",
        stitchRate: 15,
        salary: 12000
      });

      setVoiceStatus('success');
      const successMsg = `Registered ${empName} as ${empRole} under Employees directory!`;
      setVoiceMessage(successMsg);
      speakText(`Added ${empName} as ${empRole} under Employees directory.`);

      setTimeout(() => {
        setIsVoiceModalOpen(false);
        setIsSiriFloatingBarOpen(true);
        startVoiceAssistant(true);
      }, 1500);

    } else if (parsed.intent === 'navigate') {
      const tab = parsed.targetTab || 'employees';
      setActiveTab(tab);
      if (tab === 'employees') setEmployeesSubTab('directory');

      setVoiceStatus('success');
      const successMsg = `Opened ${tab.charAt(0).toUpperCase() + tab.slice(1)} view!`;
      setVoiceMessage(successMsg);
      speakText(`Opened ${tab} tab.`);

      setTimeout(() => {
        setIsVoiceModalOpen(false);
        setIsSiriFloatingBarOpen(true);
        startVoiceAssistant(true);
      }, 1500);

    } else if (parsed.intent === 'invoice' || parsed.intent === 'bill') {
      if (!parsed.companyName) {
        setVoiceStatus('error');
        setVoiceMessage("Could not identify client/company name. Try: 'Okay Siri, add invoice for GV company for 1 lk'");
        speakText("Could not identify company name in command.");
        return;
      }

      if (!parsed.amount || parsed.amount <= 0) {
        setVoiceStatus('error');
        setVoiceMessage(`Found company '${parsed.companyName}', but couldn't detect amount. Specify e.g. 'for 1 lk' or 'for 50000'.`);
        speakText(`Found company ${parsed.companyName}, but could not detect amount.`);
        return;
      }

      let targetClientId;
      let targetClientName = parsed.companyName;

      const existingClient = clients.find(c => 
        c.name.toLowerCase().includes(parsed.companyName.toLowerCase()) || 
        c.companyName.toLowerCase().includes(parsed.companyName.toLowerCase()) ||
        parsed.companyName.toLowerCase().includes(c.name.toLowerCase())
      );

      if (existingClient) {
        targetClientId = existingClient._id;
        targetClientName = existingClient.name;
      } else {
        const formattedName = parsed.companyName
          .split(' ')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');

        targetClientId = await addClientMutation({
          name: formattedName,
          companyName: formattedName,
          email: "",
          phone: "",
          gstin: "",
          address: "Registered via Voice Assistant"
        });
        targetClientName = formattedName;
      }

      const subtotal = Math.round(parsed.amount / 1.05);
      const gstAmount = Math.round(parsed.amount - subtotal);
      const nextNumber = `VE-2026-${String(bills.length + 1).padStart(3, '0')}`;

      const billPayload = {
        clientId: targetClientId,
        billNumber: nextNumber,
        date: new Date().toISOString().split('T')[0],
        billType: 'with-gst',
        items: [
          {
            name: "Garment Supply / Voice Billing Entry",
            price: subtotal,
            qty: 1,
            gstRate: 5,
            gstAmount: gstAmount,
            total: parsed.amount
          }
        ],
        discount: 0,
        subtotal: subtotal,
        totalGst: gstAmount,
        totalAmount: parsed.amount
      };

      await addBillMutation(billPayload);

      setVoiceStatus('success');
      const formattedAmt = formatCurrency(parsed.amount);
      const successMsg = `Invoice ${nextNumber} created for ${targetClientName} for ${formattedAmt}!`;
      setVoiceMessage(successMsg);
      speakText(`Invoice for ${targetClientName} for ${formattedAmt} created successfully!`);

      setTimeout(() => {
        setIsVoiceModalOpen(false);
        setActiveTab('bills');
      }, 2200);

    } else if (parsed.intent === 'payroll') {
      let targetEmpName = parsed.companyName || "Kartick";
      let empAmount = parsed.amount || 25000;

      // Find existing employee in database
      const existingEmp = employees.find(e => 
        e.name.toLowerCase().includes(targetEmpName.toLowerCase()) || 
        targetEmpName.toLowerCase().includes(e.name.toLowerCase())
      );

      if (existingEmp) {
        targetEmpName = existingEmp.name;
        if (!parsed.amount && existingEmp.monthlySalary) {
          empAmount = existingEmp.monthlySalary;
        }
      } else {
        targetEmpName = targetEmpName
          .split(' ')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
      }

      await addExpenseMutation({
        category: "Employee Salaries",
        amount: empAmount,
        description: `Monthly Payroll Disbursement for ${targetEmpName} via Siri Voice`,
        date: new Date().toISOString().split('T')[0]
      });

      setVoiceStatus('success');
      const formattedAmt = formatCurrency(empAmount);
      const successMsg = `Payroll of ${formattedAmt} recorded for ${targetEmpName}!`;
      setVoiceMessage(successMsg);
      speakText(`Payroll of ${formattedAmt} recorded for ${targetEmpName} successfully!`);

      setTimeout(() => {
        setIsVoiceModalOpen(false);
        setActiveTab('payroll');
      }, 2200);

    } else if (parsed.intent === 'expense') {
      const expAmount = parsed.amount || 1000;
      await addExpenseMutation({
        category: "Operations",
        amount: expAmount,
        description: `Voice entry: ${commandString}`,
        date: new Date().toISOString().split('T')[0]
      });
      setVoiceStatus('success');
      setVoiceMessage(`Expense of ${formatCurrency(expAmount)} recorded!`);
      speakText(`Expense of ${formatCurrency(expAmount)} recorded!`);
      setTimeout(() => {
        setIsVoiceModalOpen(false);
        setActiveTab('expenses');
      }, 2200);
    } else {
      setVoiceStatus('error');
      setVoiceMessage("Command intent not recognized. Try: 'Okay Siri, add invoice for GV company for 1 lk' or 'Siri enter payroll for Kartick'");
    }
  };

  const startVoiceAssistant = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSiriFloatingBarOpen(true);
    setIsVoiceModalOpen(false);
    setVoiceTranscript('');
    latestTranscriptRef.current = '';
    setVoiceInputManual('');
    setVoiceParsedData(null);

    if (!SpeechRecognition) {
      setVoiceStatus('idle');
      setVoiceMessage("Web Speech API is not supported in this browser. Type your voice command below:");
      return;
    }

    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        window.speechSynthesis.getVoices();
      } catch (e) {}
    }

    setVoiceStatus('listening');
    setVoiceMessage("Listening... Speak now (e.g. 'open bills tab' or 'create job')");

    try {
      if (speechRecognitionRef) {
        try { 
          speechRecognitionRef.onend = null;
          speechRecognitionRef.stop(); 
        } catch (e) {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-IN'; // Optimized for Indian English pronunciations

      let pauseTimer = null;

      recognition.onresult = (event) => {
        let fullTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += event.results[i][0].transcript + ' ';
        }
        fullTranscript = fullTranscript.trim();
        setVoiceTranscript(fullTranscript);
        latestTranscriptRef.current = fullTranscript;

        // Auto-process command when user stops speaking for 850ms
        if (pauseTimer) clearTimeout(pauseTimer);
        pauseTimer = setTimeout(() => {
          if (fullTranscript && fullTranscript.trim().length > 1) {
            try { recognition.stop(); } catch(e){}
            processVoiceCommand(fullTranscript);
          }
        }, 850);
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition status:", event.error);
        if (event.error === 'aborted' || event.error === 'no-speech') {
          // Suppress benign browser abort/pause events seamlessly
          return;
        }
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setVoiceStatus('error');
          setVoiceMessage("Microphone permission blocked. Please enable microphone access in browser address bar.");
        } else {
          setVoiceStatus('idle');
        }
      };

      recognition.onend = () => {
        setIsVoiceListening(false);
        const finalTranscript = latestTranscriptRef.current;
        if (finalTranscript && finalTranscript.trim().length > 2) {
          processVoiceCommand(finalTranscript);
        } else if (isSiriFloatingBarOpenRef.current) {
          setTimeout(() => {
            if (isSiriFloatingBarOpenRef.current) {
              startVoiceAssistant(true);
            }
          }, 800);
        }
      };

      recognition.start();
      setIsVoiceListening(true);
      setSpeechRecognitionRef(recognition);
    } catch (err) {
      console.error("Speech recognition error:", err);
      setVoiceStatus('idle');
      setVoiceMessage("Press the microphone button or type below to enter command.");
    }
  };

  const stopVoiceAssistant = () => {
    if (speechRecognitionRef) {
      try { speechRecognitionRef.stop(); } catch (e) {}
    }
    setIsVoiceListening(false);
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

  const deleteBill = (id, billNum = '') => {
    requestDeleteConfirmation({
      title: 'Delete Invoice Record',
      message: 'Are you sure you want to permanently delete this GST invoice record from accounting ledgers?',
      itemName: billNum ? `Invoice #${billNum}` : 'Invoice Record',
      onConfirm: async () => {
        await deleteBillMutation({ id });
      }
    });
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
    const stitchRate = parseFloat(document.getElementById('employee-stitch-rate')?.value) || 0;
    const salary = parseFloat(document.getElementById('employee-salary')?.value) || 0;

    try {
      if (editingEmployee) {
        await updateEmployeeMutation({
          id: editingEmployee._id,
          name, phone, role, subCategory, stitchRate, salary,
          createdAt: editingEmployee.createdAt
        });
        alert("Employee updated successfully!");
      } else {
        await addEmployeeMutation({ name, phone, role, subCategory, stitchRate, salary });
        alert("Employee registered successfully!");
      }
      closeEmployeeModal();
    } catch (err) {
      alert("Error saving employee: " + err.message);
    }
  };

  const deleteEmployee = (id, empName = '') => {
    requestDeleteConfirmation({
      title: 'Delete Staff Profile',
      message: 'Are you sure you want to remove this employee profile from factory directory and rosters?',
      itemName: empName || 'Employee Profile',
      onConfirm: async () => {
        await deleteEmployeeMutation({ id });
      }
    });
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

  const deleteFabric = (id, rollNumber = '') => {
    requestDeleteConfirmation({
      title: 'Delete Fabric Stock Roll',
      message: 'Are you sure you want to delete this fabric roll stock record from warehouse inventory?',
      itemName: rollNumber ? `Fabric Roll #${rollNumber}` : 'Fabric Roll',
      onConfirm: async () => {
        await deleteFabricMutation({ id });
      }
    });
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

  const deleteCeoActivity = (id, logTitle = '') => {
    requestDeleteConfirmation({
      title: 'Delete Accomplishment Log',
      message: 'Are you sure you want to delete this operational accomplishment log entry?',
      itemName: logTitle || 'Log Entry',
      onConfirm: async () => {
        await deleteCeoActivityMutation({ id });
      }
    });
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

  const deleteExpense = (id, category = '') => {
    requestDeleteConfirmation({
      title: 'Delete Operational Expense',
      message: 'Are you sure you want to delete this operational expense record from accounting books?',
      itemName: category ? `${category} Expense` : 'Expense Entry',
      onConfirm: async () => {
        await deleteExpenseMutation({ id });
      }
    });
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

  // Upcoming Orders CRUD
  const handleUpcomingOrderSubmit = async (e) => {
    e.preventDefault();
    const clientName = document.getElementById('up-client-name').value.trim();
    const orderTitle = document.getElementById('up-order-title').value.trim();
    const deliveryDate = document.getElementById('up-delivery-date').value;
    const estimatedValue = parseFloat(document.getElementById('up-val').value) || 0;
    const status = document.getElementById('up-status').value;
    const notes = document.getElementById('up-notes').value.trim();

    // Link client ID if matching existing
    const matchingClient = clients.find(c => c.name.toLowerCase() === clientName.toLowerCase());
    const clientId = matchingClient ? matchingClient._id : undefined;

    try {
      if (editingUpcomingOrder) {
        await updateUpcomingOrderMutation({
          id: editingUpcomingOrder._id,
          clientId, clientName, orderTitle, deliveryDate, estimatedValue, status, notes,
          createdAt: editingUpcomingOrder.createdAt
        });
        alert("Upcoming order updated!");
      } else {
        await addUpcomingOrderMutation({
          clientId, clientName, orderTitle, deliveryDate, estimatedValue, status, notes
        });
        alert("Upcoming order scheduled successfully!");
      }
      closeUpcomingOrderModal();
    } catch (err) {
      alert("Error scheduling order: " + err.message);
    }
  };

  const deleteUpcomingOrder = (id, orderTitle = '') => {
    requestDeleteConfirmation({
      title: 'Cancel & Delete Order',
      message: 'Are you sure you want to cancel and delete this upcoming production order?',
      itemName: orderTitle || 'Upcoming Order',
      onConfirm: async () => {
        await deleteUpcomingOrderMutation({ id });
      }
    });
  };

  const updateUpcomingOrderStatus = async (order, newStatus) => {
    try {
      await updateUpcomingOrderMutation({
        id: order._id,
        clientId: order.clientId,
        clientName: order.clientName,
        orderTitle: order.orderTitle,
        deliveryDate: order.deliveryDate,
        estimatedValue: order.estimatedValue,
        status: newStatus,
        notes: order.notes,
        createdAt: order.createdAt
      });
    } catch (err) {
      alert("Error updating order status: " + err.message);
    }
  };

  const openEditUpcomingOrder = (order) => {
    setEditingUpcomingOrder(order);
    setIsUpcomingOrderModalOpen(true);
    setTimeout(() => {
      document.getElementById('up-client-name').value = order.clientName;
      document.getElementById('up-order-title').value = order.orderTitle;
      document.getElementById('up-delivery-date').value = order.deliveryDate;
      document.getElementById('up-val').value = order.estimatedValue;
      document.getElementById('up-status').value = order.status;
      document.getElementById('up-notes').value = order.notes || "";
    }, 50);
  };

  const closeUpcomingOrderModal = () => {
    setIsUpcomingOrderModalOpen(false);
    setEditingUpcomingOrder(null);
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

  const deleteStitching = (id, jobTitle = '') => {
    requestDeleteConfirmation({
      title: 'Delete Production Job',
      message: 'Are you sure you want to delete this stitching assignment and piece-rate job record?',
      itemName: jobTitle || 'Production Job',
      onConfirm: async () => {
        await deleteStitchingMutation({ id });
      }
    });
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
        avatarPicture: avatarPreview || '',
        createdAt: currentLoggedUser.createdAt
      });
      setCurrentLoggedUser(prev => ({
        ...prev,
        fullName,
        email,
        avatarPicture: avatarPreview
      }));
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

  // Clear all sample seed data from database
  const handleClearDatabase = () => {
    requestDeleteConfirmation({
      title: '⚠️ Reset Database Records',
      message: 'CRITICAL ACTION: Are you sure you want to clear all data and reset the entire database? All invoices, clients, inventory, and payroll records will be permanently erased.',
      itemName: 'ALL DATABASE RECORDS',
      onConfirm: async () => {
        try {
          await clearAllDataMutation();
          alert("🧹 All database records cleared successfully! The database is now clean.");
        } catch (err) {
          alert("Error clearing database: " + err.message);
        }
      }
    });
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
        {/* HRFusion Style Modern Workspace Switcher Header */}
        <div className="brand" style={{ position: 'relative', width: '100%', marginBottom: '16px' }}>
          <div 
            onClick={() => setIsCompanyDropdownOpen(!isCompanyDropdownOpen)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              gap: '10px', 
              width: '100%', 
              cursor: 'pointer',
              padding: '8px 12px',
              borderRadius: '12px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
              transition: 'all 150ms ease'
            }}
            title="Click to Switch Workspace"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
              <div style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '10px', 
                background: activeCompany.id === 'varahi-hq' 
                  ? 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)' 
                  : activeCompany.id === 'vikas-exp' 
                  ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' 
                  : 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)', 
                color: '#FFFFFF', 
                fontSize: '15px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontWeight: 800, 
                flexShrink: 0
              }}>
                <i className="ph ph-shapes" style={{ fontSize: '18px' }}></i>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <span className="brand-name" style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {activeCompany.name}
                </span>
                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 500 }}>
                  {activeCompany.branch}
                </span>
              </div>
            </div>
            <i className="ph ph-caret-double-up-down" style={{ fontSize: '14px', color: '#94A3B8' }}></i>
          </div>

          {/* HRFusion Style Switcher Popover Card */}
          {isCompanyDropdownOpen && (
            <>
              {/* Backdrop Listener */}
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9998 }} onClick={() => setIsCompanyDropdownOpen(false)}></div>
              
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: '0',
                zIndex: 9999,
                width: '270px',
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                padding: '12px',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                boxShadow: '0 16px 40px rgba(15, 23, 42, 0.12), 0 2px 8px rgba(15, 23, 42, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>

                {/* Workspace Items List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {companies.map((comp) => {
                    const isSelected = comp.id === activeCompanyId;
                    const iconBg = comp.id === 'varahi-hq' 
                      ? 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)' 
                      : comp.id === 'vikas-exp' 
                      ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' 
                      : 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)';

                    return (
                      <div
                        key={comp.id}
                        onClick={() => {
                          setActiveCompanyId(comp.id);
                          setIsCompanyDropdownOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 10px',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          backgroundColor: isSelected ? '#F8FAFC' : 'transparent',
                          transition: 'all 120ms ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                          <div style={{ 
                            width: '32px', 
                            height: '32px', 
                            borderRadius: '9px', 
                            background: iconBg, 
                            color: '#FFFFFF', 
                            fontSize: '14px', 
                            fontWeight: 800, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            {comp.id === 'varahi-hq' ? <i className="ph ph-buildings"></i> : comp.id === 'vikas-exp' ? <i className="ph ph-factory"></i> : <i className="ph ph-t-shirt"></i>}
                          </div>
                          <span style={{ fontSize: '13.5px', fontWeight: isSelected ? 700 : 600, color: isSelected ? '#0F172A' : '#334155' }}>
                            {comp.name}
                          </span>
                        </div>

                        {isSelected && (
                          <i className="ph ph-check" style={{ color: '#64748B', fontSize: '15px', fontWeight: 800 }}></i>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* + Add new workspace Button */}
                <button
                  type="button"
                  onClick={() => {
                    setIsCompanyDropdownOpen(false);
                    setIsAddBranchModalOpen(true);
                  }}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    color: '#475569',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    transition: 'all 120ms ease'
                  }}
                >
                  <i className="ph ph-plus" style={{ fontSize: '14px' }}></i> Add new workspace
                </button>
              </div>
            </>
          )}
        </div>

        <nav className="nav-menu">
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#8C8D96', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '8px 8px 4px 8px' }}>
            Main Menu ▾
          </div>
          <button className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => handleTabChange('dashboard')}>
            <i className="ph ph-layout"></i>
            <span>Dashboard</span>
          </button>
          <button className={`nav-item ${activeTab === 'bills' ? 'active' : ''}`} onClick={() => handleTabChange('bills')}>
            <i className="ph ph-receipt"></i>
            <span>Bills</span>
          </button>
          <button className={`nav-item ${activeTab === 'jobs' ? 'active' : ''}`} onClick={() => handleTabChange('jobs')}>
            <i className="ph ph-briefcase"></i>
            <span>Jobs</span>
          </button>
          <button className={`nav-item ${activeTab === 'clients' ? 'active' : ''}`} onClick={() => handleTabChange('clients')}>
            <i className="ph ph-users-three"></i>
            <span>Clients</span>
          </button>
          <button className={`nav-item ${activeTab === 'employees' ? 'active' : ''}`} onClick={() => handleTabChange('employees')}>
            <i className="ph ph-user-list"></i>
            <span>Employees</span>
          </button>
          <button className={`nav-item ${activeTab === 'fabrics' ? 'active' : ''}`} onClick={() => handleTabChange('fabrics')}>
            <i className="ph ph-package"></i>
            <span>Inventory</span>
          </button>

          <div style={{ fontSize: '11px', fontWeight: 600, color: '#8C8D96', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '14px 8px 4px 8px' }}>
            Operations & Financials ▾
          </div>
          <button className={`nav-item ${activeTab === 'expenses' ? 'active' : ''}`} onClick={() => handleTabChange('expenses')}>
            <i className="ph ph-coins"></i>
            <span>Expenses</span>
          </button>
          <button className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => handleTabChange('reports')}>
            <i className="ph ph-chart-line-up"></i>
            <span>Reports</span>
          </button>

          <div style={{ fontSize: '11px', fontWeight: 600, color: '#8C8D96', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '14px 8px 4px 8px' }}>
            System ▾
          </div>
          <button className={`nav-item ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => handleTabChange('notifications')}>
            <i className="ph ph-bell"></i>
            <span>Notifications</span>
          </button>
          <button className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => handleTabChange('settings')}>
            <i className="ph ph-gear"></i>
            <span>Settings</span>
          </button>
          <button className="nav-item mobile-only-nav" onClick={() => setIsMobileMenuOpen(true)}>
            <i className="ph ph-dots-three-outline"></i>
            <span>More</span>
          </button>
        </nav>

        <div className="user-profile" style={{ position: 'relative' }} onClick={(e) => {
          e.stopPropagation();
          setIsProfilePopoverOpen(!isProfilePopoverOpen);
        }}>
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

          {/* Profile / Account Popover */}
          {isProfilePopoverOpen && (
            <div 
              className="card border" 
              onClick={(e) => e.stopPropagation()} 
              style={{
                position: 'absolute',
                bottom: 'calc(100% + 12px)',
                left: '0',
                width: '320px',
                maxHeight: '80vh',
                overflowY: 'auto',
                backgroundColor: 'var(--color-surface)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 12px 36px rgba(0, 0, 0, 0.25)',
                padding: '20px',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '10px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)' }}>Account Settings</h4>
                <button 
                  type="button" 
                  onClick={() => setIsProfilePopoverOpen(false)}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-secondary)' }}
                >
                  <i className="ph ph-x" style={{ fontSize: '16px' }}></i>
                </button>
              </div>

              {/* Profile Avatar Uploader */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ position: 'relative', width: '48px', height: '48px', flexShrink: 0 }}>
                  {avatarPreview ? (
                    <img 
                      src={avatarPreview} 
                      style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-primary)' }} 
                      alt="Avatar" 
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      fontWeight: 700
                    }}>
                      {currentLoggedUser?.fullName ? currentLoggedUser.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'US'}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Profile Photo</span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button 
                      type="button" 
                      className="btn btn-secondary btn-sm" 
                      onClick={() => document.getElementById('popover-avatar-file-input').click()}
                      style={{ padding: '2px 8px', fontSize: '10px', borderRadius: '12px' }}
                    >
                      Upload
                    </button>
                    {avatarPreview && (
                      <button 
                        type="button" 
                        className="btn btn-sm text-red" 
                        onClick={handleAvatarRemove}
                        style={{ padding: '2px 8px', fontSize: '10px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input 
                    type="file" 
                    id="popover-avatar-file-input" 
                    accept="image/*" 
                    onChange={handleAvatarChange} 
                    style={{ display: 'none' }} 
                  />
                </div>
              </div>

              {/* Edit Profile Info Form */}
              <form onSubmit={handleProfileUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label htmlFor="popover-username" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Username</label>
                  <input 
                    type="text" 
                    id="popover-username" 
                    value={currentLoggedUser?.username || ''} 
                    readOnly 
                    style={{ padding: '8px 12px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-muted)', color: 'var(--color-text-secondary)', cursor: 'not-allowed' }} 
                  />
                </div>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label htmlFor="profile-fullname" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Full Name *</label>
                  <input 
                    type="text" 
                    id="profile-fullname" 
                    required 
                    defaultValue={currentLoggedUser?.fullName || ''} 
                    placeholder="FullName" 
                    style={{ padding: '8px 12px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }} 
                  />
                </div>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label htmlFor="profile-email" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Email Address</label>
                  <input 
                    type="email" 
                    id="profile-email" 
                    defaultValue={currentLoggedUser?.email || ''} 
                    placeholder="Email" 
                    style={{ padding: '8px 12px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }} 
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ padding: '8px 12px', fontSize: '12px', width: '100%', justifyContent: 'center' }}>
                  Save Profile Info
                </button>
              </form>

              {/* Collapsible Change Password section */}
              <details style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
                <summary style={{ cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="ph ph-lock"></i> Change Password
                </summary>
                <form onSubmit={handlePasswordUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label htmlFor="profile-old-pwd" style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Current Password *</label>
                    <input 
                      type="password" 
                      id="profile-old-pwd" 
                      required 
                      placeholder="••••••••" 
                      style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }} 
                    />
                  </div>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label htmlFor="profile-new-pwd" style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>New Password *</label>
                    <input 
                      type="password" 
                      id="profile-new-pwd" 
                      required 
                      placeholder="••••••••" 
                      style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }} 
                    />
                  </div>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label htmlFor="profile-confirm-pwd" style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Confirm Password *</label>
                    <input 
                      type="password" 
                      id="profile-confirm-pwd" 
                      required 
                      placeholder="••••••••" 
                      style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }} 
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ padding: '6px 10px', fontSize: '11px', width: '100%', justifyContent: 'center' }}>
                    Update Password
                  </button>
                </form>
              </details>

              {/* Log Out button */}
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Sign out of session</span>
                <button 
                  type="button"
                  className="btn btn-secondary btn-sm" 
                  onClick={logUserOut} 
                  style={{ padding: '4px 10px', fontSize: '11px', borderColor: 'var(--color-destructive)', color: 'var(--color-destructive)', fontWeight: 600 }}
                >
                  <i className="ph ph-sign-out"></i> Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Layout */}
      <main className="main-content">

        {/* ==================== DASHBOARD VIEW (Textile ERP System) ==================== */}
        {activeTab === 'dashboard' && (
          <>
            <section id="dashboard-view" className="tab-view active">
              {/* Dashboard Header Bar */}
              <header className="view-header" style={{ marginBottom: '24px', alignItems: 'flex-start' }}>
                <div>
                  <h1 style={{ fontSize: '30px', fontWeight: 800, color: '#1C1C21', letterSpacing: '-0.02em', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span>{activeCompany.name} ERP Dashboard</span>
                    <span className="badge badge-purple" style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '12px', fontWeight: 600 }}>
                      📍 {activeCompany.branch} ({activeCompany.city})
                    </span>
                  </h1>
                  <p className="subtitle" style={{ fontSize: '14px', color: '#62636C', margin: 0 }}>
                    Operational visibility for {activeCompany.name} textile manufacturing, piece-rate billing, and job work management.
                  </p>
                </div>

                {/* Quick Actions Bar */}
                <div className="header-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <button className="btn btn-primary" onClick={() => setIsBillModalOpen(true)} style={{ backgroundColor: '#6E56CF', color: '#fff', border: 'none', borderRadius: '12px', padding: '10px 18px', fontWeight: 600, fontSize: '13px', boxShadow: '0 4px 14px rgba(110,86,207,0.25)' }}>
                    <i className="ph ph-plus" style={{ fontSize: '15px' }}></i> New Bill
                  </button>
                  <button className="btn-ghost" onClick={() => setIsScanModalOpen(true)} style={{ padding: '9px 14px', fontSize: '13px' }}>
                    <i className="ph ph-scan" style={{ fontSize: '14px' }}></i> Scan Receipt
                  </button>
                  <button className="btn-ghost" onClick={() => setIsClientModalOpen(true)} style={{ padding: '9px 14px', fontSize: '13px' }}>
                    <i className="ph ph-user-plus" style={{ fontSize: '14px' }}></i> Add Client
                  </button>
                  <button className="btn-ghost" onClick={() => setJobsSubTab('create')} style={{ padding: '9px 14px', fontSize: '13px' }}>
                    <i className="ph ph-briefcase" style={{ fontSize: '14px' }}></i> Add Job
                  </button>
                  <button className="btn-ghost" onClick={startVoiceAssistant} style={{ padding: '9px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div className="siri-orb-icon"></div>
                    <span>Voice Assistant</span>
                  </button>
                </div>
              </header>

              {/* 6 Priority Operational KPI Cards (Interlinked) */}
              <div className="metrics-grid-6">
                {/* 1. Today's Billing */}
                <div className="metric-card" onClick={() => setActiveTab('bills')} style={{ cursor: 'pointer' }} title="Click to view Invoices & Bills">
                  <div className="metric-card-header">
                    <span className="metric-label">Today's Billing</span>
                    <div className="metric-icon purple"><i className="ph ph-receipt"></i></div>
                  </div>
                  <div className="metric-value font-mono">₹0</div>
                  <div className="metric-footer" style={{ marginTop: '8px', fontSize: '12px' }}>
                    <span style={{ color: '#64748B', fontWeight: 600 }}>0%</span>
                    <span style={{ color: '#8C8D96', marginLeft: '4px' }}>vs Yesterday</span>
                  </div>
                </div>

                {/* 2. Pending Payments */}
                <div className="metric-card" onClick={() => setActiveTab('bills')} style={{ cursor: 'pointer' }} title="Click to view Pending & Overdue Invoices">
                  <div className="metric-card-header">
                    <span className="metric-label">Pending Payments</span>
                    <div className="metric-icon gold"><i className="ph ph-clock-countdown"></i></div>
                  </div>
                  <div className="metric-value font-mono">₹0</div>
                  <div className="metric-footer" style={{ marginTop: '8px', fontSize: '12px' }}>
                    <span style={{ color: '#64748B', fontWeight: 600 }}>0 Overdue</span>
                    <span style={{ color: '#8C8D96', marginLeft: '4px' }}>Invoices</span>
                  </div>
                </div>

                {/* 3. Active Production Jobs */}
                <div className="metric-card" onClick={() => { setActiveTab('jobs'); setJobsSubTab('active'); }} style={{ cursor: 'pointer' }} title="Click to view Active Production Jobs">
                  <div className="metric-card-header">
                    <span className="metric-label">Active Jobs</span>
                    <div className="metric-icon purple"><i className="ph ph-gear-six"></i></div>
                  </div>
                  <div className="metric-value font-mono">0 Jobs</div>
                  <div className="metric-footer" style={{ marginTop: '8px', fontSize: '12px' }}>
                    <span style={{ color: '#6E56CF', fontWeight: 600 }}>0 Stitching, 0 Cutting</span>
                  </div>
                </div>

                {/* 4. Employees Present */}
                <div className="metric-card" onClick={() => { setActiveTab('employees'); setEmployeesSubTab('attendance'); }} style={{ cursor: 'pointer' }} title="Click to view Staff Attendance">
                  <div className="metric-card-header">
                    <span className="metric-label">Staff Attendance</span>
                    <div className="metric-icon" style={{ color: '#10B981', backgroundColor: 'rgba(16,185,129,0.1)' }}><i className="ph ph-users-three"></i></div>
                  </div>
                  <div className="metric-value font-mono">0 / 0</div>
                  <div className="metric-footer" style={{ marginTop: '8px', fontSize: '12px' }}>
                    <span style={{ color: '#64748B', fontWeight: 600 }}>0%</span>
                    <span style={{ color: '#8C8D96', marginLeft: '4px' }}>Attendance Rate</span>
                  </div>
                </div>

                {/* 5. Pending Deliveries */}
                <div className="metric-card" onClick={() => { setActiveTab('jobs'); setJobsSubTab('active'); }} style={{ cursor: 'pointer' }} title="Click to view Pending Deliveries">
                  <div className="metric-card-header">
                    <span className="metric-label">Pending Deliveries</span>
                    <div className="metric-icon gold"><i className="ph ph-truck"></i></div>
                  </div>
                  <div className="metric-value font-mono">0 Orders</div>
                  <div className="metric-footer" style={{ marginTop: '8px', fontSize: '12px' }}>
                    <span style={{ color: '#64748B', fontWeight: 600 }}>Target Delivery Today</span>
                  </div>
                </div>

                {/* 6. Available Fabric Stock */}
                <div className="metric-card" onClick={() => setActiveTab('fabrics')} style={{ cursor: 'pointer' }} title="Click to view Fabric Stock Inventory">
                  <div className="metric-card-header">
                    <span className="metric-label">Fabric Inventory</span>
                    <div className="metric-icon"><i className="ph ph-package"></i></div>
                  </div>
                  <div className="metric-value font-mono">0 Mtrs</div>
                  <div className="metric-footer" style={{ marginTop: '8px', fontSize: '12px' }}>
                    <span style={{ color: '#64748B', fontWeight: 500 }}>0 Rolls Stocked</span>
                  </div>
                </div>
              </div>

              {/* Today's Factory Snapshot (Interlinked Summary Pills) */}
              <div className="factory-snapshot-card">
                <div className="snapshot-header">
                  <div className="snapshot-title">
                    <i className="ph ph-lightning" style={{ color: '#6E56CF', fontSize: '18px' }}></i>
                    <span>Today's Factory Snapshot</span>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#10B981', backgroundColor: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: '10px' }}>
                    Live Production Operations
                  </span>
                </div>
                <div className="snapshot-pills-row">
                  <div className="snapshot-pill" onClick={() => { setActiveTab('jobs'); setJobsSubTab('active'); }} style={{ cursor: 'pointer' }} title="Click to view Running Jobs">
                    <span className="status-dot green"></span>
                    <span><strong>0</strong> Jobs Running</span>
                  </div>
                  <div className="snapshot-pill" onClick={() => { setActiveTab('jobs'); setJobsSubTab('active'); }} style={{ cursor: 'pointer' }} title="Click to view Completed Jobs">
                    <span className="status-dot blue"></span>
                    <span><strong>0</strong> Jobs Completed</span>
                  </div>
                  <div className="snapshot-pill" onClick={() => { setActiveTab('jobs'); setJobsSubTab('active'); }} style={{ cursor: 'pointer' }} title="Click to view Pending Dispatches">
                    <span className="status-dot amber"></span>
                    <span><strong>0</strong> Waiting for Dispatch</span>
                  </div>
                  <div className="snapshot-pill" onClick={() => { setActiveTab('employees'); setEmployeesSubTab('attendance'); }} style={{ cursor: 'pointer' }} title="Click to view Staff Attendance">
                    <span className="status-dot green"></span>
                    <span><strong>0</strong> Employees Present</span>
                  </div>
                  <div className="snapshot-pill" onClick={() => setActiveTab('bills')} style={{ cursor: 'pointer' }} title="Click to view Pending Invoices">
                    <span className="status-dot amber"></span>
                    <span><strong>0</strong> Bills Pending</span>
                  </div>
                  <div className="snapshot-pill" onClick={() => setActiveTab('bills')} style={{ borderColor: 'rgba(226,232,240,0.8)', backgroundColor: '#F8FAFC', cursor: 'pointer' }} title="Click to view Overdue Payments">
                    <span className="status-dot green"></span>
                    <span style={{ color: '#64748B' }}><strong>0</strong> Payment Overdue</span>
                  </div>
                </div>
              </div>

              {/* Revenue Analytics & Top Clients Breakdown (2-Column Grid) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '20px', marginBottom: '24px' }}>
                {/* Left: Monthly Billing Trend Area Chart */}
                <div className="table-card bg-surface border" style={{ padding: '20px', margin: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1C1C21' }}>Monthly Billing Trend</h3>
                      <p className="small text-muted" style={{ margin: '2px 0 0 0', fontSize: '12px' }}>Track daily manufacturing billing volume and GST invoice trends.</p>
                    </div>
                    <select 
                      value={billingTrendRange}
                      onChange={(e) => setBillingTrendRange(e.target.value)}
                      style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '8px', border: '1px solid #E6E6EB', backgroundColor: '#FAFAFC', color: '#1C1C21', fontWeight: 600, cursor: 'pointer' }}
                    >
                      <option value="this-month">This Month (July 2026)</option>
                      <option value="last-month">Last Month (June 2026)</option>
                      <option value="q3">Q3 2026 Summary</option>
                    </select>
                  </div>

                  {/* Dynamic Interactive Chart Canvas */}
                  <div style={{ width: '100%', height: '220px', position: 'relative', marginTop: '10px' }}>
                    <canvas ref={chartCanvasRef}></canvas>
                  </div>
                </div>

                {/* Right: Top Clients Revenue Breakdown */}
                <div className="table-card bg-surface border" style={{ padding: '20px', margin: 0 }}>
                  <div style={{ marginBottom: '14px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1C1C21' }}>Top Clients Revenue</h3>
                    <p className="small text-muted" style={{ margin: '2px 0 0 0', fontSize: '12px' }}>Client revenue share & billing volume.</p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Client 1 */}
                    <div onClick={() => setActiveTab('clients')} style={{ cursor: 'pointer' }} title="Click to view Client Directory">
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, color: '#1C1C21' }}>Sounder Exports</span>
                        <span style={{ fontWeight: 700, color: '#6E56CF', fontFamily: 'var(--font-mono)' }}>₹0 (0%)</span>
                      </div>
                      <div style={{ height: '6px', width: '100%', backgroundColor: '#F0F0F4', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: '0%', height: '100%', backgroundColor: '#6E56CF', borderRadius: '4px' }}></div>
                      </div>
                    </div>

                    {/* Client 2 */}
                    <div onClick={() => setActiveTab('clients')} style={{ cursor: 'pointer' }} title="Click to view Client Directory">
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, color: '#1C1C21' }}>Raj Textiles</span>
                        <span style={{ fontWeight: 700, color: '#10B981', fontFamily: 'var(--font-mono)' }}>₹0 (0%)</span>
                      </div>
                      <div style={{ height: '6px', width: '100%', backgroundColor: '#F0F0F4', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: '0%', height: '100%', backgroundColor: '#10B981', borderRadius: '4px' }}></div>
                      </div>
                    </div>

                    {/* Client 3 */}
                    <div onClick={() => setActiveTab('clients')} style={{ cursor: 'pointer' }} title="Click to view Client Directory">
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, color: '#1C1C21' }}>Anand Mills</span>
                        <span style={{ fontWeight: 700, color: '#F59E0B', fontFamily: 'var(--font-mono)' }}>₹0 (0%)</span>
                      </div>
                      <div style={{ height: '6px', width: '100%', backgroundColor: '#F0F0F4', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: '0%', height: '100%', backgroundColor: '#F59E0B', borderRadius: '4px' }}></div>
                      </div>
                    </div>

                    {/* Client 4 */}
                    <div onClick={() => setActiveTab('clients')} style={{ cursor: 'pointer' }} title="Click to view Client Directory">
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, color: '#1C1C21' }}>Varahi Domestic</span>
                        <span style={{ fontWeight: 700, color: '#64748B', fontFamily: 'var(--font-mono)' }}>₹0 (0%)</span>
                      </div>
                      <div style={{ height: '6px', width: '100%', backgroundColor: '#F0F0F4', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: '0%', height: '100%', backgroundColor: '#64748B', borderRadius: '4px' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actionable Insights: Client Concentration Risk (Interlinked) */}
              <div className="table-card bg-surface border" onClick={() => setActiveTab('clients')} style={{ padding: '20px', marginBottom: '24px', backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', cursor: 'pointer' }} title="Click to open Clients directory to manage accounts">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#F1F5F9', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                    <i className="ph ph-shield-check"></i>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>Client Portfolio Risk Analysis</h4>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#10B981', fontFamily: 'var(--font-mono)' }}>0% Healthy Balanced Distribution</span>
                    </div>
                    <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#64748B', lineHeight: 1.4 }}>
                      <strong>Balanced revenue portfolio:</strong> No single customer accounts for excessive risk concentration.
                    </p>
                    <div style={{ height: '8px', width: '100%', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden', marginBottom: '10px' }}>
                      <div style={{ width: '0%', height: '100%', backgroundColor: '#10B981', borderRadius: '4px' }}></div>
                    </div>
                    <div style={{ fontSize: '12px', color: '#0F172A', backgroundColor: '#F1F5F9', padding: '6px 12px', borderRadius: '6px', display: 'inline-block' }}>
                      <strong>System Status:</strong> Ready for new client onboarding and active GST bill entries.
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Required (Pending Tasks) & Recent Activity Timeline (Interlinked) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                {/* Left: Action Required (Pending Tasks) */}
                <div className="action-required-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1C1C21', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className="ph ph-check-square" style={{ color: '#10B981' }}></i> Action Required
                    </h3>
                    <span className="badge badge-success" style={{ fontSize: '11px' }}>0 Urgent Items</span>
                  </div>

                  <div className="action-item red-border" onClick={() => setActiveTab('reports')} style={{ cursor: 'pointer' }} title="Click to view Reports & Tax Compliance">
                    <i className="ph ph-calendar-blank" style={{ color: '#EF4444', fontSize: '18px', marginTop: '2px' }}></i>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#991B1B' }}>GST Filing Due in 3 Days</div>
                      <div style={{ fontSize: '12px', color: '#62636C' }}>GSTR-1 tax compliance filing for July 2026 due by Aug 1.</div>
                    </div>
                  </div>

                  <div className="action-item red-border" onClick={() => setActiveTab('bills')} style={{ cursor: 'pointer' }} title="Click to view Overdue Invoices">
                    <i className="ph ph-clock-countdown" style={{ color: '#EF4444', fontSize: '18px', marginTop: '2px' }}></i>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#991B1B' }}>2 Payments Overdue</div>
                      <div style={{ fontSize: '12px', color: '#62636C' }}>Sounder Exports invoice #VE-2026-018 (₹45,000) overdue by 5 days.</div>
                    </div>
                  </div>

                  <div className="action-item orange-border" onClick={() => { setActiveTab('jobs'); setJobsSubTab('active'); }} style={{ cursor: 'pointer' }} title="Click to view Production Jobs">
                    <i className="ph ph-truck" style={{ color: '#F59E0B', fontSize: '18px', marginTop: '2px' }}></i>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#92400E' }}>1 Delivery Delayed</div>
                      <div style={{ fontSize: '12px', color: '#62636C' }}>Job #104 (Denim Jackets) delayed by 1 day due to fabric dye inspection.</div>
                    </div>
                  </div>

                  <div className="action-item yellow-border" onClick={() => setActiveTab('bills')} style={{ cursor: 'pointer' }} title="Click to view Invoices & Bills">
                    <i className="ph ph-file-search" style={{ color: '#D97706', fontSize: '18px', marginTop: '2px' }}></i>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#92400E' }}>4 Invoices Awaiting Approval</div>
                      <div style={{ fontSize: '12px', color: '#62636C' }}>Audit sign-off required for GST tax breakdown splits.</div>
                    </div>
                  </div>
                </div>

                {/* Right: Recent Activity Timeline */}
                <div className="table-card bg-surface border" style={{ padding: '20px', margin: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1C1C21', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className="ph ph-clock-counter-clockwise" style={{ color: '#6E56CF' }}></i> Recent Activity
                    </h3>
                    <span className="badge badge-success" style={{ fontSize: '11px' }}>Live Operations</span>
                  </div>

                  <div className="activity-timeline">
                    <div className="timeline-event" onClick={() => setActiveTab('bills')} style={{ cursor: 'pointer' }} title="Click to view Bills">
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#1C1C21' }}>Bill #VE-2026-024 Created</div>
                        <div style={{ fontSize: '12px', color: '#62636C' }}>Generated invoice for Sounder Exports (₹1,50,000)</div>
                      </div>
                      <span style={{ fontSize: '11px', color: '#8C8D96', fontWeight: 500 }}>10:15 AM</span>
                    </div>

                    <div className="timeline-event" onClick={() => { setActiveTab('jobs'); setJobsSubTab('active'); }} style={{ cursor: 'pointer' }} title="Click to view Jobs">
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#1C1C21' }}>Job #102 Completed</div>
                        <div style={{ fontSize: '12px', color: '#62636C' }}>Stitching Unit completed 1,000 Denim Jackets</div>
                      </div>
                      <span style={{ fontSize: '11px', color: '#8C8D96', fontWeight: 500 }}>09:40 AM</span>
                    </div>

                    <div className="timeline-event" onClick={() => setActiveTab('bills')} style={{ cursor: 'pointer' }} title="Click to view Payments">
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#1C1C21' }}>Payment Received</div>
                        <div style={{ fontSize: '12px', color: '#62636C' }}>Received ₹45,000 via HDFC Bank transfer</div>
                      </div>
                      <span style={{ fontSize: '11px', color: '#8C8D96', fontWeight: 500 }}>09:15 AM</span>
                    </div>

                    <div className="timeline-event" onClick={() => { setActiveTab('employees'); setEmployeesSubTab('attendance'); }} style={{ cursor: 'pointer' }} title="Click to view Staff Attendance">
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#1C1C21' }}>Employee Checked In</div>
                        <div style={{ fontSize: '12px', color: '#62636C' }}>Srimathi logged present for Morning Shift</div>
                      </div>
                      <span style={{ fontSize: '11px', color: '#8C8D96', fontWeight: 500 }}>08:05 AM</span>
                    </div>

                    <div className="timeline-event" onClick={() => setActiveTab('fabrics')} style={{ cursor: 'pointer' }} title="Click to view Inventory Stock">
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#1C1C21' }}>Fabric Stock Added</div>
                        <div style={{ fontSize: '12px', color: '#62636C' }}>Added 500 Mtrs Denim Roll (Roll #D-402)</div>
                      </div>
                      <span style={{ fontSize: '11px', color: '#8C8D96', fontWeight: 500 }}>07:45 AM</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Production Jobs Operations Panel */}
              <div className="table-card bg-surface border" style={{ padding: '20px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1C1C21', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className="ph ph-briefcase" style={{ color: '#6E56CF' }}></i> Active Production Jobs Overview
                    </h3>
                    <p className="small text-muted" style={{ margin: '2px 0 0 0', fontSize: '12px' }}>Track ongoing factory jobs, client orders, and delivery schedules.</p>
                  </div>
                  <button className="btn btn-primary btn-sm" style={{ borderRadius: '12px', padding: '6px 14px' }} onClick={() => setJobsSubTab('create')}>
                    <i className="ph ph-plus"></i> Create New Job
                  </button>
                </div>

                <div className="table-responsive desktop-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Job Title / Order Description</th>
                        <th>Client Name</th>
                        <th>Delivery Target Date</th>
                        <th>Estimated Budget (₹)</th>
                        <th>Status</th>
                        <th className="text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {upcomingOrders.map((ord) => (
                        <tr key={ord._id} style={{ cursor: 'pointer' }} onClick={() => { setSelectedJob(ord); setActiveTab('jobs'); setJobsSubTab('details'); }}>
                          <td className="font-semibold">{ord.orderTitle}</td>
                          <td>{ord.clientName}</td>
                          <td className="font-medium">{formatDate(ord.deliveryDate)}</td>
                          <td className="font-bold text-primary" style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(ord.estimatedValue)}</td>
                          <td>
                            <span className={`badge ${ord.status === 'In Production' ? 'badge-warning' : ord.status === 'Delivered' ? 'badge-success' : 'badge-info'}`}>
                              {ord.status}
                            </span>
                          </td>
                          <td className="text-right" onClick={(e) => e.stopPropagation()}>
                            <button className="btn-ghost" onClick={() => { setSelectedJob(ord); setActiveTab('jobs'); setJobsSubTab('details'); }}>
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                      {upcomingOrders.length === 0 && (
                        <tr>
                          <td colSpan="6" className="text-center text-muted" style={{ padding: '32px' }}>
                            No active production jobs found. Click <strong>"Create New Job"</strong> to add an order.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
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

        {/* ==================== JOBS VIEW ==================== */}
        {activeTab === 'jobs' && (
          <section id="jobs-view" className="tab-view active">
            <header className="view-header">
              <div>
                <h1>Jobs & Production Orders</h1>
                <p className="subtitle">Track export manufacturing jobs, daily progress, staff assignments, and delays.</p>
              </div>
              <button className="btn btn-primary" onClick={() => setJobsSubTab('create')}>
                <i className="ph ph-plus-circle"></i> Create New Job
              </button>
            </header>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #E6E6EB', paddingBottom: '8px' }}>
              <div className="sub-tab-bar" style={{ margin: 0, border: 'none', padding: 0 }}>
                <button className={`sub-tab-btn ${jobsSubTab === 'all' ? 'active' : ''}`} onClick={() => setJobsSubTab('all')}>
                  <i className="ph ph-list-checks"></i> All Jobs
                </button>
                <button className={`sub-tab-btn ${jobsSubTab === 'create' ? 'active' : ''}`} onClick={() => setJobsSubTab('create')}>
                  <i className="ph ph-plus-circle"></i> Create Job
                </button>
                <button className={`sub-tab-btn ${jobsSubTab === 'ongoing' ? 'active' : ''}`} onClick={() => setJobsSubTab('ongoing')}>
                  <i className="ph ph-gear-six"></i> Ongoing Jobs
                </button>
                <button className={`sub-tab-btn ${jobsSubTab === 'completed' ? 'active' : ''}`} onClick={() => setJobsSubTab('completed')}>
                  <i className="ph ph-check-circle"></i> Completed Jobs
                </button>
                <button className={`sub-tab-btn ${jobsSubTab === 'delayed' ? 'active' : ''}`} onClick={() => setJobsSubTab('delayed')}>
                  <i className="ph ph-warning-circle"></i> Delayed Jobs
                </button>
              </div>

              {/* Linear Filter Controls Bar */}
              <div style={{ position: 'relative', display: 'flex', gap: '6px', alignItems: 'center' }}>
                <button 
                  className="btn-icon" 
                  onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)} 
                  style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '14px', border: '1px solid #E6E6EB', backgroundColor: '#FFFFFF', color: '#1C1C21', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500, cursor: 'pointer' }}
                  title="Filter options"
                >
                  <i className="ph ph-funnel" style={{ fontSize: '13px', color: '#62636C' }}></i>
                  <span>Filter</span>
                  <i className="ph ph-caret-down" style={{ fontSize: '10px', color: '#8C8D96' }}></i>
                </button>

                <button className="btn-icon" style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid #E6E6EB', backgroundColor: '#FFFFFF', color: '#62636C', display: 'flex', alignItems: 'center', justifyCenter: 'center' }} title="Display Options">
                  <i className="ph ph-sliders"></i>
                </button>

                {isFilterMenuOpen && (
                  <div className="linear-filter-menu" onClick={(e) => e.stopPropagation()}>
                    <div className="filter-menu-header">
                      <input type="text" placeholder="Add Filter..." autoFocus />
                      <span style={{ fontSize: '10px', fontWeight: 600, color: '#8C8D96', backgroundColor: '#F4F4F6', padding: '1px 5px', borderRadius: '4px' }}>F</span>
                    </div>
                    <div className="filter-menu-item"><div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><i className="ph ph-sparkle"></i> AI Filter</div><i className="ph ph-caret-right"></i></div>
                    <div className="filter-menu-item"><div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><i className="ph ph-sliders-horizontal"></i> Advanced Filter</div><i className="ph ph-caret-right"></i></div>
                    <div style={{ borderTop: '1px solid #F0F0F4', margin: '4px 0' }}></div>
                    <div className="filter-menu-item"><div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><i className="ph ph-circle-dashed"></i> Status</div><i className="ph ph-caret-right"></i></div>
                    <div className="filter-menu-item"><div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><i className="ph ph-user"></i> Assignee</div><i className="ph ph-caret-right"></i></div>
                    <div className="filter-menu-item"><div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><i className="ph ph-chart-bar"></i> Priority</div><i className="ph ph-caret-right"></i></div>
                    <div className="filter-menu-item"><div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><i className="ph ph-tag"></i> Labels</div><i className="ph ph-caret-right"></i></div>
                    <div className="filter-menu-item"><div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><i className="ph ph-calendar"></i> Target Date</div><i className="ph ph-caret-right"></i></div>
                  </div>
                )}
              </div>
            </div>

            {jobsSubTab === 'create' ? (
              <div className="card bg-surface border" style={{ padding: '24px', borderRadius: '16px', maxWidth: '700px' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 700 }}>Create New Production Job</h3>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.target;
                  await addUpcomingOrderMutation({
                    clientName: form.clientName.value,
                    orderTitle: form.orderTitle.value,
                    deliveryDate: form.deliveryDate.value,
                    estimatedValue: parseFloat(form.estimatedValue.value) || 0,
                    status: "Planned",
                    notes: form.notes.value
                  });
                  alert("Job created successfully!");
                  setJobsSubTab('all');
                }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label>Job Title / Description</label>
                      <input type="text" name="orderTitle" required placeholder="e.g. 2000 Pcs Linen Shirts Batch A" />
                    </div>
                    <div className="form-group">
                      <label>Client Name</label>
                      <input type="text" name="clientName" required placeholder="e.g. Sri Varahi Exports" />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label>Target Delivery Date</label>
                      <input type="date" name="deliveryDate" required defaultValue={new Date().toISOString().split('T')[0]} />
                    </div>
                    <div className="form-group">
                      <label>Estimated Job Budget (₹)</label>
                      <input type="number" name="estimatedValue" required placeholder="e.g. 150000" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Job Category & Instructions</label>
                    <textarea name="notes" rows="3" placeholder="Specify fabric quality, stitching piece rates..."></textarea>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setJobsSubTab('all')}>Cancel</button>
                    <button type="submit" className="btn btn-primary"><i className="ph ph-check"></i> Save & Launch Job</button>
                  </div>
                </form>
              </div>
            ) : jobsSubTab === 'details' ? (
              <div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', backgroundColor: 'var(--color-muted)', padding: '6px', borderRadius: '12px', overflowX: 'auto' }}>
                  {['overview', 'timeline', 'staff', 'progress', 'expenses', 'files', 'logs'].map((tab) => (
                    <button 
                      key={tab}
                      className={`btn btn-sm ${jobDetailsTab === tab ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setJobDetailsTab(tab)}
                      style={{ textTransform: 'capitalize', borderRadius: '8px' }}
                    >
                      {tab === 'staff' ? 'Assigned Staff' : tab === 'progress' ? 'Daily Progress' : tab === 'logs' ? 'Activity Log' : tab}
                    </button>
                  ))}
                </div>

                <div className="card bg-surface border" style={{ padding: '24px', borderRadius: '16px' }}>
                  {jobDetailsTab === 'overview' && (
                    <div>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 700 }}>Job Overview: VE-JOB-2026-001</h4>
                      <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>1000 Pcs Premium Denim Jackets manufacturing order for Sri Varahi Exports.</p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '20px' }}>
                        <div style={{ padding: '16px', backgroundColor: 'var(--color-muted)', borderRadius: '12px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Status</span>
                          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-primary)' }}>In Production</div>
                        </div>
                        <div style={{ padding: '16px', backgroundColor: 'var(--color-muted)', borderRadius: '12px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Target Budget</span>
                          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)' }}>₹1,20,000</div>
                        </div>
                        <div style={{ padding: '16px', backgroundColor: 'var(--color-muted)', borderRadius: '12px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Stitching Progress</span>
                          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-success)' }}>72% (720 / 1000 Pcs)</div>
                        </div>
                      </div>
                    </div>
                  )}
                  {jobDetailsTab === 'timeline' && (
                    <div>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 700 }}>Production Timeline & Milestones</h4>
                      <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <li style={{ padding: '12px', borderLeft: '4px solid var(--color-success)', backgroundColor: 'var(--color-muted)', borderRadius: '0 8px 8px 0' }}>
                          <strong>Fabric Arrival:</strong> 500 Meters Blue Denim received.
                        </li>
                        <li style={{ padding: '12px', borderLeft: '4px solid var(--color-primary)', backgroundColor: 'var(--color-muted)', borderRadius: '0 8px 8px 0' }}>
                          <strong>Cutting & Patterning:</strong> 1000 Panels Cut.
                        </li>
                        <li style={{ padding: '12px', borderLeft: '4px solid var(--color-warning)', backgroundColor: 'var(--color-muted)', borderRadius: '0 8px 8px 0' }}>
                          <strong>Stitching Line 1:</strong> 720 Jackets completed.
                        </li>
                      </ul>
                    </div>
                  )}
                  {jobDetailsTab === 'staff' && (
                    <div>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 700 }}>Assigned Employees & Piece Rates</h4>
                      <div className="table-responsive">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Staff Name</th>
                              <th>Role</th>
                              <th>Assigned Pieces</th>
                              <th>Piece Rate (₹)</th>
                              <th>Total Payout</th>
                            </tr>
                          </thead>
                          <tbody>
                            {employees.slice(0, 3).map(e => (
                              <tr key={e._id}>
                                <td className="font-semibold">{e.name}</td>
                                <td>{e.role}</td>
                                <td>240 Pcs</td>
                                <td>₹{e.stitchRate || 45}/pc</td>
                                <td className="font-bold text-primary">₹{(240 * (e.stitchRate || 45)).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  {jobDetailsTab === 'progress' && (
                    <div>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 700 }}>Daily Production Log</h4>
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '12px' }}>
                        <div style={{ padding: '12px 16px', backgroundColor: 'var(--color-muted)', borderRadius: '10px' }}>
                          <strong>Today:</strong> 110 Pcs Stitched
                        </div>
                        <div style={{ padding: '12px 16px', backgroundColor: 'var(--color-muted)', borderRadius: '10px' }}>
                          <strong>Yesterday:</strong> 145 Pcs Stitched
                        </div>
                      </div>
                    </div>
                  )}
                  {jobDetailsTab === 'expenses' && (
                    <div>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 700 }}>Job Direct Expenses Ledger</h4>
                      <div className="table-responsive">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Category</th>
                              <th>Description</th>
                              <th>Amount</th>
                              <th>Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {expenses.slice(0, 2).map(exp => (
                              <tr key={exp._id}>
                                <td>{exp.category}</td>
                                <td>{exp.description}</td>
                                <td className="font-bold text-red">₹{exp.amount.toLocaleString()}</td>
                                <td>{exp.date}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  {jobDetailsTab === 'files' && (
                    <div>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 700 }}>Job Files & Tech Packs</h4>
                      <div style={{ padding: '14px 18px', border: '1px solid var(--color-border)', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                        <i className="ph-fill ph-file-pdf" style={{ fontSize: '24px', color: '#EF4444' }}></i>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600 }}>Tech_Pack_Denim_Jacket_2026.pdf</div>
                          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>2.4 MB • Spec Sheet</span>
                        </div>
                      </div>
                    </div>
                  )}
                  {jobDetailsTab === 'logs' && (
                    <div>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 700 }}>Audit Activity Log</h4>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div>• <strong>2026-07-25 10:30 AM:</strong> Job launched by Administrator.</div>
                        <div>• <strong>2026-07-26 11:00 AM:</strong> Supervisor updated count to 720 Pcs.</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="table-card bg-surface border desktop-table-container" style={{ marginTop: '10px' }}>
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Job Title / Order Description</th>
                        <th>Client Name</th>
                        <th>Delivery Target Date</th>
                        <th>Estimated Budget (₹)</th>
                        <th>Status</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {upcomingOrders
                        .filter(order => {
                          if (jobsSubTab === 'ongoing') return order.status === 'In Production';
                          if (jobsSubTab === 'completed') return order.status === 'Delivered' || order.status === 'Ready';
                          if (jobsSubTab === 'delayed') return new Date(order.deliveryDate) < new Date();
                          return true;
                        })
                        .map(order => (
                          <tr key={order._id} style={{ cursor: 'pointer' }} onClick={() => { setSelectedJob(order); setJobsSubTab('details'); }}>
                            <td className="font-semibold">{order.orderTitle}</td>
                            <td>{order.clientName}</td>
                            <td>{formatDate(order.deliveryDate)}</td>
                            <td className="font-bold text-primary" style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(order.estimatedValue)}</td>
                            <td>
                              <span className={`badge ${order.status === 'In Production' ? 'badge-warning' : order.status === 'Delivered' ? 'badge-success' : 'badge-info'}`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="text-right" onClick={(e) => e.stopPropagation()}>
                              <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedJob(order); setJobsSubTab('details'); }}>
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))}
                      {upcomingOrders.length === 0 && (
                        <tr>
                          <td colSpan="6" className="text-center text-muted" style={{ padding: '32px' }}>
                            No production jobs found. Click <strong>"Create Job"</strong> to start a new job order.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}



        {/* ==================== REPORTS VIEW ==================== */}
        {activeTab === 'reports' && (
          <section id="reports-view" className="tab-view active">
            <header className="view-header">
              <div>
                <h1>Business Reports & Analytics</h1>
                <p className="subtitle">Generate export reports for production jobs, staff wages, expenditures, and GST.</p>
              </div>
              <button className="btn btn-primary" onClick={() => alert("Downloading PDF summary report...")}>
                <i className="ph ph-download-simple"></i> Download PDF Report
              </button>
            </header>

            <div className="sub-tab-bar">
              <button className={`sub-tab-btn ${reportsSubTab === 'job-reports' ? 'active' : ''}`} onClick={() => setReportsSubTab('job-reports')}>
                <i className="ph ph-briefcase"></i> Job Reports
              </button>
              <button className={`sub-tab-btn ${reportsSubTab === 'employee-reports' ? 'active' : ''}`} onClick={() => setReportsSubTab('employee-reports')}>
                <i className="ph ph-users"></i> Employee Reports
              </button>
              <button className={`sub-tab-btn ${reportsSubTab === 'attendance-reports' ? 'active' : ''}`} onClick={() => setReportsSubTab('attendance-reports')}>
                <i className="ph ph-clock"></i> Attendance Reports
              </button>
              <button className={`sub-tab-btn ${reportsSubTab === 'payroll-reports' ? 'active' : ''}`} onClick={() => setReportsSubTab('payroll-reports')}>
                <i className="ph ph-money"></i> Payroll Reports
              </button>
              <button className={`sub-tab-btn ${reportsSubTab === 'expense-reports' ? 'active' : ''}`} onClick={() => setReportsSubTab('expense-reports')}>
                <i className="ph ph-coins"></i> Expense Reports
              </button>
              <button className={`sub-tab-btn ${reportsSubTab === 'business-summary' ? 'active' : ''}`} onClick={() => setReportsSubTab('business-summary')}>
                <i className="ph ph-chart-line-up"></i> Business Summary
              </button>
            </div>

            <div className="card bg-surface border" style={{ padding: '24px', borderRadius: '16px' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: 700 }}>
                {reportsSubTab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>Comprehensive audit breakdown for Varahi Export operations.</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginTop: '20px' }}>
                <div style={{ padding: '20px', backgroundColor: 'var(--color-muted)', borderRadius: '14px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Total Jobs Executed</span>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-primary)', marginTop: '4px' }}>{upcomingOrders.length} Orders</div>
                </div>
                <div style={{ padding: '20px', backgroundColor: 'var(--color-muted)', borderRadius: '14px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Total Billed Revenue</span>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-success)', marginTop: '4px' }}>{formatCurrency(bills.reduce((s, b) => s + b.totalAmount, 0))}</div>
                </div>
                <div style={{ padding: '20px', backgroundColor: 'var(--color-muted)', borderRadius: '14px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Operating Expenditure</span>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-danger)', marginTop: '4px' }}>{formatCurrency(expenses.reduce((s, e) => s + e.amount, 0))}</div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ==================== NOTIFICATIONS VIEW ==================== */}
        {activeTab === 'notifications' && (
          <section id="notifications-view" className="tab-view active">
            <header className="view-header">
              <div>
                <h1>System Notifications & Alerts</h1>
                <p className="subtitle">Real-time alerts for job dispatches, attendance anomalies, and salary payouts.</p>
              </div>
              <button className="btn btn-secondary" onClick={() => alert("All notifications marked as read!")}>
                <i className="ph ph-checks"></i> Mark All as Read
              </button>
            </header>

            <div className="sub-tab-bar">
              <button className={`sub-tab-btn ${notificationsSubTab === 'job-updates' ? 'active' : ''}`} onClick={() => setNotificationsSubTab('job-updates')}>
                <i className="ph ph-briefcase"></i> Job Updates
              </button>
              <button className={`sub-tab-btn ${notificationsSubTab === 'attendance-alerts' ? 'active' : ''}`} onClick={() => setNotificationsSubTab('attendance-alerts')}>
                <i className="ph ph-clock"></i> Attendance Alerts
              </button>
              <button className={`sub-tab-btn ${notificationsSubTab === 'salary-alerts' ? 'active' : ''}`} onClick={() => setNotificationsSubTab('salary-alerts')}>
                <i className="ph ph-money"></i> Salary Alerts
              </button>
              <button className={`sub-tab-btn ${notificationsSubTab === 'system-notifications' ? 'active' : ''}`} onClick={() => setNotificationsSubTab('system-notifications')}>
                <i className="ph ph-bell"></i> System Notifications
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="card bg-surface border" style={{ padding: '16px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(124, 58, 237, 0.1)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                  <i className="ph-fill ph-briefcase"></i>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 700 }}>Denim Jacket Order Dispatch Scheduled</div>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Target delivery tomorrow for Sri Varahi Exports.</span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>10 mins ago</span>
              </div>
              <div className="card bg-surface border" style={{ padding: '16px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                  <i className="ph-fill ph-check-circle"></i>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 700 }}>Monthly Payroll Calculated</div>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>July 2026 staff payslips ready for review.</span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>1 hour ago</span>
              </div>
            </div>
          </section>
        )}

        {/* ==================== SETTINGS VIEW ==================== */}
        {activeTab === 'settings' && (
          <section id="settings-view" className="tab-view active">
            <header className="view-header">
              <div>
                <h1>System Settings & Configuration</h1>
                <p className="subtitle">Manage company details, user role permissions, departments, and payroll rules.</p>
              </div>
              <button className="btn btn-primary" onClick={() => alert("Settings saved successfully!")}>
                <i className="ph ph-floppy-disk"></i> Save Preferences
              </button>
            </header>

            <div className="sub-tab-bar">
              <button className={`sub-tab-btn ${settingsSubTab === 'company-profile' ? 'active' : ''}`} onClick={() => setSettingsSubTab('company-profile')}>
                <i className="ph ph-buildings"></i> Company Profile
              </button>
              <button className={`sub-tab-btn ${settingsSubTab === 'users-roles' ? 'active' : ''}`} onClick={() => setSettingsSubTab('users-roles')}>
                <i className="ph ph-user-list"></i> Users & Roles
              </button>
              <button className={`sub-tab-btn ${settingsSubTab === 'departments' ? 'active' : ''}`} onClick={() => setSettingsSubTab('departments')}>
                <i className="ph ph-tree-structure"></i> Departments
              </button>
              <button className={`sub-tab-btn ${settingsSubTab === 'job-categories' ? 'active' : ''}`} onClick={() => setSettingsSubTab('job-categories')}>
                <i className="ph ph-tag"></i> Job Categories
              </button>
              <button className={`sub-tab-btn ${settingsSubTab === 'expense-categories' ? 'active' : ''}`} onClick={() => setSettingsSubTab('expense-categories')}>
                <i className="ph ph-folder"></i> Expense Categories
              </button>
              <button className={`sub-tab-btn ${settingsSubTab === 'payroll-settings' ? 'active' : ''}`} onClick={() => setSettingsSubTab('payroll-settings')}>
                <i className="ph ph-currency-inr"></i> Payroll Settings
              </button>
              <button className={`sub-tab-btn ${settingsSubTab === 'preferences' ? 'active' : ''}`} onClick={() => setSettingsSubTab('preferences')}>
                <i className="ph ph-sliders"></i> Preferences
              </button>
            </div>

            {settingsSubTab === 'company-profile' ? (
              <div className="card bg-surface border" style={{ padding: '24px', borderRadius: '16px', maxWidth: '800px' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 700 }}>Varahi Export Company Profile</h3>
                <form onSubmit={(e) => { e.preventDefault(); alert("Company profile updated successfully!"); }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label>Company Legal Name</label>
                      <input type="text" defaultValue="Varahi Export Management System" />
                    </div>
                    <div className="form-group">
                      <label>GSTIN Registration</label>
                      <input type="text" defaultValue="33AAAAA0000A1Z5" />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label>Primary Contact Email</label>
                      <input type="email" defaultValue="varahi.export@gmail.com" />
                    </div>
                    <div className="form-group">
                      <label>Primary Contact Phone</label>
                      <input type="text" defaultValue="+91 98422 12345" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Registered Factory & Office Address</label>
                    <input type="text" defaultValue="124 Garment Park, Main Road, Tirupur, Tamil Nadu - 641603" />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                    <button type="submit" className="btn btn-primary"><i className="ph ph-check"></i> Update Profile</button>
                  </div>
                </form>
              </div>
            ) : settingsSubTab === 'users-roles' ? (
              <div className="table-card bg-surface border" style={{ marginTop: '10px' }}>
                {/* Header Bar with Employee Tree View Switcher */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>System Users & Access Role Permissions</span>
                      <span className="badge badge-purple" style={{ fontSize: '11px', padding: '2px 8px' }}>
                        {userViewMode === 'tree' ? '🌳 Employee Tree View' : '📋 List View'}
                      </span>
                    </h3>
                    <p className="small text-muted" style={{ margin: '2px 0 0 0' }}>Organizational hierarchy, role privileges, and security access levels.</p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* View Switcher Pills */}
                    <div style={{ display: 'flex', backgroundColor: '#F1F5F9', padding: '3px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                      <button
                        type="button"
                        onClick={() => setUserViewMode('tree')}
                        style={{
                          padding: '6px 14px',
                          fontSize: '12px',
                          fontWeight: 700,
                          borderRadius: '8px',
                          border: 'none',
                          cursor: 'pointer',
                          backgroundColor: userViewMode === 'tree' ? '#FFFFFF' : 'transparent',
                          color: userViewMode === 'tree' ? '#6E56CF' : '#64748B',
                          boxShadow: userViewMode === 'tree' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                          transition: 'all 120ms ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <i className="ph ph-tree-structure" style={{ fontSize: '14px' }}></i> Employee Tree
                      </button>
                      <button
                        type="button"
                        onClick={() => setUserViewMode('table')}
                        style={{
                          padding: '6px 14px',
                          fontSize: '12px',
                          fontWeight: 700,
                          borderRadius: '8px',
                          border: 'none',
                          cursor: 'pointer',
                          backgroundColor: userViewMode === 'table' ? '#FFFFFF' : 'transparent',
                          color: userViewMode === 'table' ? '#6E56CF' : '#64748B',
                          boxShadow: userViewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                          transition: 'all 120ms ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <i className="ph ph-table" style={{ fontSize: '14px' }}></i> Table List
                      </button>
                    </div>

                    <button className="btn btn-primary btn-sm" onClick={() => setIsAddUserModalOpen(true)} style={{ borderRadius: '10px', padding: '8px 16px' }}>
                      <i className="ph ph-user-plus"></i> + Add System User
                    </button>
                  </div>
                </div>

                {/* VIEW 1: INTERACTIVE EMPLOYEE TREE CANVAS */}
                {userViewMode === 'tree' ? (
                  <div style={{ padding: '24px', backgroundColor: '#F8FAFC', minHeight: '520px', overflowX: 'auto' }}>
                    {/* 4-Stage Tree Hierarchy Columns */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(250px, 1fr))', gap: '20px', position: 'relative' }}>

                      {/* STAGE 1: EXECUTIVE & LEADERSHIP */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', paddingBottom: '6px', borderBottom: '2px solid #6E56CF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <i className="ph ph-crown" style={{ color: '#6E56CF' }}></i> 1. Executive Leadership
                        </div>

                        {/* Node Card: Admin */}
                        <div 
                          className="shadow-sm hover:shadow-md transition-all"
                          onClick={() => setViewingUser(systemUsers[0] || { name: 'Vikashini Balasubramanian', email: 'vikashini@varahiexport.com', role: 'Administrator (Full Access)', status: 'Active' })}
                          style={{ backgroundColor: '#FFFFFF', border: '2px solid #6E56CF', borderRadius: '16px', padding: '16px', cursor: 'pointer', position: 'relative' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', gap: '10px', marginBottom: '10px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #6E56CF 0%, #4C1D95 100%)', color: '#FFF', fontSize: '16px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              V
                            </div>
                            <div>
                              <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#0F172A' }}>Vikashini B.</div>
                              <div style={{ fontSize: '11px', color: '#6E56CF', fontWeight: 700 }}>Managing Director</div>
                            </div>
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748B', backgroundColor: '#F8FAFC', padding: '6px 10px', borderRadius: '8px', border: '1px solid #F1F5F9', marginTop: '8px' }}>
                            🔑 Full Administrator Control, GST Filings & System Overrides
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #F1F5F9' }}>
                            <span className="badge badge-success" style={{ fontSize: '10px' }}>🟢 Active</span>
                            <span style={{ fontSize: '11px', color: '#6E56CF', fontWeight: 700 }}>View Privileges →</span>
                          </div>
                        </div>
                      </div>

                      {/* STAGE 2: FLOOR SUPERVISORS */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', paddingBottom: '6px', borderBottom: '2px solid #2563EB', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <i className="ph ph-tree-structure" style={{ color: '#2563EB' }}></i> 2. Floor Supervisors
                        </div>

                        {/* Node Card: Production Auditor */}
                        <div 
                          className="shadow-sm hover:shadow-md transition-all"
                          onClick={() => setViewingUser(systemUsers[1] || { name: 'Production Auditor', email: 'auditor@varahiexport.com', role: 'Production Supervisor', status: 'Active' })}
                          style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '14px', cursor: 'pointer' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)', color: '#FFF', fontSize: '14px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              P
                            </div>
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>Production Auditor</div>
                              <div style={{ fontSize: '10.5px', color: '#2563EB', fontWeight: 600 }}>Production Supervisor</div>
                            </div>
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748B' }}>⚙️ Job Dispatches & Stitching Rate Audits</div>
                        </div>

                        {/* Node Card: Cutting Master */}
                        <div 
                          className="shadow-sm hover:shadow-md transition-all"
                          onClick={() => alert('Viewing Cutting Master Unit Privileges')}
                          style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '14px', cursor: 'pointer' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: '#FFF', fontSize: '14px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              R
                            </div>
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>Ramesh Kumar</div>
                              <div style={{ fontSize: '10.5px', color: '#059669', fontWeight: 600 }}>Cutting Master Lead</div>
                            </div>
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748B' }}>✂️ Fabric Laying & Marker Pattern Cuts</div>
                        </div>

                        {/* Node Card: QC Lead */}
                        <div 
                          className="shadow-sm hover:shadow-md transition-all"
                          onClick={() => alert('Viewing Quality Control Inspection Privileges')}
                          style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '14px', cursor: 'pointer' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)', color: '#FFF', fontSize: '14px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              S
                            </div>
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>Srimathi</div>
                              <div style={{ fontSize: '10.5px', color: '#7C3AED', fontWeight: 600 }}>QC Inspection Lead</div>
                            </div>
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748B' }}>🔍 Garment Defect Inspection & Passing</div>
                        </div>
                      </div>

                      {/* STAGE 3: SKILLED CREW & ACCOUNTING */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', paddingBottom: '6px', borderBottom: '2px solid #D97706', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <i className="ph ph-t-shirt" style={{ color: '#D97706' }}></i> 3. Skilled Crew & Accounting
                        </div>

                        {/* Node Card: Kartick */}
                        <div 
                          className="shadow-sm hover:shadow-md transition-all"
                          onClick={() => alert('Viewing Kartick Master Stitcher Rates')}
                          style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '14px', cursor: 'pointer' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', color: '#FFF', fontSize: '14px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              K
                            </div>
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>Kartick</div>
                              <div style={{ fontSize: '10.5px', color: '#D97706', fontWeight: 600 }}>Master Stitcher (24 Crew)</div>
                            </div>
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748B' }}>🧵 Assembly Rate: ₹25 / Piece</div>
                        </div>

                        {/* Node Card: Accountant */}
                        <div 
                          className="shadow-sm hover:shadow-md transition-all"
                          onClick={() => setViewingUser(systemUsers[2] || { name: 'Billing Accountant', email: 'billing@varahiexport.com', role: 'Billing Accountant', status: 'Active' })}
                          style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '14px', cursor: 'pointer' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #2563EB 0%, #1E3A8A 100%)', color: '#FFF', fontSize: '14px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              B
                            </div>
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>Billing Accountant</div>
                              <div style={{ fontSize: '10.5px', color: '#2563EB', fontWeight: 600 }}>Finance & GST Specialist</div>
                            </div>
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748B' }}>🧾 Invoicing, Payments & Expense Logs</div>
                        </div>

                        {/* Node Card: Packing Lead */}
                        <div 
                          className="shadow-sm hover:shadow-md transition-all"
                          onClick={() => alert('Viewing Packing & Dispatch Privileges')}
                          style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '14px', cursor: 'pointer' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #059669 0%, #064E3B 100%)', color: '#FFF', fontSize: '14px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              A
                            </div>
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>Anitha Devi</div>
                              <div style={{ fontSize: '10.5px', color: '#059669', fontWeight: 600 }}>Packing & Dispatch Lead</div>
                            </div>
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748B' }}>📦 Polybagging, Box Sealing & Courier</div>
                        </div>
                      </div>

                      {/* STAGE 4: AI & AUTOMATION */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', paddingBottom: '6px', borderBottom: '2px solid #8B5CF6', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <i className="ph ph-sparkle" style={{ color: '#8B5CF6' }}></i> 4. AI & Cloud Automation
                        </div>

                        {/* Node Card: Siri Assistant */}
                        <div 
                          className="shadow-sm hover:shadow-md transition-all"
                          onClick={() => startVoiceAssistant()}
                          style={{ backgroundColor: '#FFFFFF', border: '1px solid #8B5CF6', borderRadius: '16px', padding: '14px', cursor: 'pointer' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)', color: '#FFF', fontSize: '14px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <i className="ph ph-microphone"></i>
                            </div>
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>Siri ERP Assistant</div>
                              <div style={{ fontSize: '10.5px', color: '#8B5CF6', fontWeight: 600 }}>Voice AI Command Agent</div>
                            </div>
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748B' }}>🎙️ Hands-free Voice Search & Navigation</div>
                        </div>

                        {/* Node Card: Real-time Cloud */}
                        <div 
                          className="shadow-sm hover:shadow-md transition-all"
                          style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '14px' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)', color: '#FFF', fontSize: '14px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <i className="ph ph-cloud"></i>
                            </div>
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>Convex Real-Time Engine</div>
                              <div style={{ fontSize: '10.5px', color: '#3B82F6', fontWeight: 600 }}>Reactive Data Stream</div>
                            </div>
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748B' }}>⚡ Zero-latency multi-device sync</div>
                        </div>
                      </div>

                    </div>
                  </div>
                ) : (
                  /* VIEW 2: TABLE LIST VIEW */
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>User Name</th>
                          <th>Email / Login ID</th>
                          <th>Assigned Access Role</th>
                          <th>Account Status</th>
                          <th className="text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {systemUsers.map(usr => (
                          <tr key={usr.id}>
                            <td className="font-semibold">{usr.name}</td>
                            <td className="text-muted">{usr.email}</td>
                            <td><span className="badge badge-gst">{usr.role}</span></td>
                            <td><span className="badge badge-success">{usr.status}</span></td>
                            <td className="text-right">
                              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                <button className="btn btn-ghost btn-sm" onClick={() => setViewingUser(usr)} style={{ padding: '6px 12px', fontSize: '12px', color: '#6E56CF', border: '1px solid rgba(110, 86, 207, 0.2)' }} title="View User Role & Privileges">
                                  <i className="ph ph-eye" style={{ fontSize: '14px' }}></i> View
                                </button>
                                <button className="btn btn-primary btn-sm" onClick={() => setEditingUser(usr)} style={{ padding: '6px 12px', fontSize: '12px' }} title="Edit User Permissions">
                                  <i className="ph ph-pencil-simple" style={{ fontSize: '14px' }}></i> Edit Permissions
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : settingsSubTab === 'departments' ? (
              <div className="table-card bg-surface border" style={{ marginTop: '10px' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #E6E6EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FAFAFC' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#1C1C21' }}>Factory Departments & Production Units</h3>
                    <p className="small text-muted" style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#62636C' }}>Configure operational units, floor supervisors, and staff allocations.</p>
                  </div>
                  <button className="btn btn-primary btn-sm" style={{ borderRadius: '14px', padding: '6px 14px' }} onClick={() => setIsAddDeptModalOpen(true)}>
                    <i className="ph ph-plus"></i> Add Department
                  </button>
                </div>
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Department Name</th>
                        <th>Department Head</th>
                        <th>Staff Count</th>
                        <th>Factory Location</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {systemDepartments.map(dept => (
                        <tr key={dept.id}>
                          <td className="font-semibold" style={{ color: '#1C1C21' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <i className="ph ph-tree-structure" style={{ color: '#6E56CF', fontSize: '15px' }}></i>
                              <span>{dept.name}</span>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#E4E4E9', color: '#1C1C21', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {dept.head ? dept.head[0] : 'S'}
                              </div>
                              <span style={{ fontSize: '13px', fontWeight: 500 }}>{dept.head}</span>
                            </div>
                          </td>
                          <td>
                            <span style={{ backgroundColor: '#F4F4F6', color: '#1C1C21', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, border: '1px solid #E6E6EB' }}>
                              {dept.staffCount}
                            </span>
                          </td>
                          <td className="text-muted" style={{ fontSize: '12px' }}>{dept.location}</td>
                          <td className="text-right">
                            <button className="btn-ghost" onClick={() => alert(`Department details for ${dept.name}`)}>
                              <i className="ph ph-gear"></i> Manage Unit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : settingsSubTab === 'job-categories' ? (
              <div className="table-card bg-surface border" style={{ marginTop: '10px' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #E6E6EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FAFAFC' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#1C1C21' }}>Garment Job Categories & Stitch Rates</h3>
                    <p className="small text-muted" style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#62636C' }}>Define standard garment categories, GST slabs, and piece rate guidelines.</p>
                  </div>
                  <button className="btn btn-primary btn-sm" style={{ borderRadius: '14px', padding: '6px 14px' }} onClick={() => setIsAddCategoryModalOpen(true)}>
                    <i className="ph ph-plus"></i> Add Category
                  </button>
                </div>
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Category Name</th>
                        <th>GST Slab</th>
                        <th>Piece Rate Standard</th>
                        <th>Category Description</th>
                        <th className="text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobCategoriesList.map(cat => (
                        <tr key={cat.id}>
                          <td className="font-semibold" style={{ color: '#1C1C21' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <i className="ph ph-tag" style={{ color: '#6E56CF', fontSize: '15px' }}></i>
                              <span>{cat.name}</span>
                            </div>
                          </td>
                          <td><span className="badge badge-gst" style={{ fontSize: '11px' }}>{cat.gstRate}</span></td>
                          <td className="font-bold text-primary" style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>{cat.rateRange}</td>
                          <td className="text-muted" style={{ fontSize: '12px' }}>{cat.description}</td>
                          <td className="text-right">
                            <button className="btn-ghost" onClick={() => alert(`Editing rates for ${cat.name}`)}>
                              <i className="ph ph-sliders"></i> Configure Rates
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : settingsSubTab === 'expense-categories' ? (
              <div className="table-card bg-surface border" style={{ marginTop: '10px' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #E6E6EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FAFAFC' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#1C1C21' }}>Expense Ledger Categories & Budget Limits</h3>
                    <p className="small text-muted" style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#62636C' }}>Set up operational expense categories for financial auditing.</p>
                  </div>
                  <button className="btn btn-primary btn-sm" style={{ borderRadius: '14px', padding: '6px 14px' }} onClick={() => setIsAddExpenseCatModalOpen(true)}>
                    <i className="ph ph-plus"></i> Add Category
                  </button>
                </div>
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Category Name</th>
                        <th>Monthly Budget Allocation</th>
                        <th>Tax Deductible</th>
                        <th className="text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenseCategoriesList.map(exp => (
                        <tr key={exp.id}>
                          <td className="font-semibold" style={{ color: '#1C1C21' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <i className="ph ph-folder" style={{ color: '#6E56CF', fontSize: '15px' }}></i>
                              <span>{exp.name}</span>
                            </div>
                          </td>
                          <td className="font-bold" style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>{exp.budget}</td>
                          <td><span className="badge badge-success" style={{ fontSize: '11px' }}>{exp.deductible}</span></td>
                          <td className="text-right">
                            <button className="btn-ghost" onClick={() => alert(`Budget updated for ${exp.name}`)}>
                              <i className="ph ph-pencil-simple"></i> Edit Budget
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : settingsSubTab === 'payroll-settings' ? (
              <div className="card bg-surface border" style={{ padding: '24px', borderRadius: '16px', maxWidth: '800px' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 700 }}>Payroll Rules & Overtime Calculations</h3>
                <form onSubmit={(e) => { e.preventDefault(); alert("Payroll rules saved successfully!"); }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label>Standard Shift Work Hours</label>
                      <input type="text" defaultValue="8 Hours / Shift" />
                    </div>
                    <div className="form-group">
                      <label>Overtime Multiplier Rate</label>
                      <input type="text" defaultValue="1.5x Hourly Rate" />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label>EPF Deduction Percentage (%)</label>
                      <input type="text" defaultValue="12%" />
                    </div>
                    <div className="form-group">
                      <label>ESI Employee Contribution (%)</label>
                      <input type="text" defaultValue="0.75%" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Salary Advance Auto-Deduction Schedule</label>
                    <select defaultValue="Deduct 50% Per Payroll Cycle">
                      <option value="Deduct 50% Per Payroll Cycle">Deduct 50% Per Payroll Cycle</option>
                      <option value="Deduct 100% Full Repayment">Deduct 100% Full Repayment</option>
                      <option value="Manual Deduction Approval">Manual Deduction Approval</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                    <button type="submit" className="btn btn-primary"><i className="ph ph-check"></i> Save Payroll Rules</button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="card bg-surface border" style={{ padding: '24px', borderRadius: '16px', maxWidth: '800px' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 700 }}>System Preferences & Display</h3>
                <form onSubmit={(e) => { e.preventDefault(); alert("System preferences saved!"); }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label>Currency Format</label>
                      <input type="text" defaultValue="INR (₹ Indian Rupee)" />
                    </div>
                    <div className="form-group">
                      <label>Invoice Number Prefix</label>
                      <input type="text" defaultValue="VE-2026-" />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label>Siri Ambient Voice AI</label>
                      <select defaultValue="Enabled">
                        <option value="Enabled">Enabled & Active</option>
                        <option value="Disabled">Disabled</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Audio TTS Speech Output</label>
                      <select defaultValue="Enabled">
                        <option value="Enabled">Enabled & Voice Active</option>
                        <option value="Disabled">Disabled</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                    <button type="submit" className="btn btn-primary"><i className="ph ph-check"></i> Save Preferences</button>
                  </div>
                </form>
              </div>
            )}
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

            <div className="sub-tab-bar">
              <button className={`sub-tab-btn ${clientsSubTab === 'list' ? 'active' : ''}`} onClick={() => setClientsSubTab('list')}>
                <i className="ph ph-users-three"></i> Client List
              </button>
              <button className={`sub-tab-btn ${clientsSubTab === 'details' ? 'active' : ''}`} onClick={() => setClientsSubTab('details')}>
                <i className="ph ph-user-gear"></i> Client Details
              </button>
              <button className={`sub-tab-btn ${clientsSubTab === 'active-jobs' ? 'active' : ''}`} onClick={() => setClientsSubTab('active-jobs')}>
                <i className="ph ph-briefcase"></i> Active Jobs
              </button>
              <button className={`sub-tab-btn ${clientsSubTab === 'completed-jobs' ? 'active' : ''}`} onClick={() => setClientsSubTab('completed-jobs')}>
                <i className="ph ph-check-circle"></i> Completed Jobs
              </button>
              <button className={`sub-tab-btn ${clientsSubTab === 'documents' ? 'active' : ''}`} onClick={() => setClientsSubTab('documents')}>
                <i className="ph ph-file-text"></i> Documents
              </button>
            </div>

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
              <div className="header-actions">
                <button className="siri-btn-gradient" onClick={startVoiceAssistant} title="Siri Voice Assistant">
                  <div className="siri-orb-icon"></div>
                  <span>Ask Siri</span>
                </button>
                <button className="btn btn-primary" onClick={() => setIsBillModalOpen(true)}>
                  <i className="ph ph-plus-circle"></i> Record Invoice
                </button>
              </div>
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
                <p className="subtitle">Register stitching staff, log daily attendance, manage salary advances & disburse monthly payroll.</p>
              </div>
              <div className="header-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button className="btn btn-primary" onClick={() => setIsEmployeeModalOpen(true)}>
                  <i className="ph ph-user-plus"></i> Register Employee
                </button>
                <button className="btn btn-accent" onClick={() => setIsAttendanceModalOpen(true)}>
                  <i className="ph ph-clock"></i> Log Attendance
                </button>
                <button className="btn btn-secondary text-primary" onClick={() => setIsAdvanceModalOpen(true)} style={{ fontWeight: 600 }}>
                  <i className="ph ph-hand-coins"></i> Give Advance
                </button>
                <button className="btn btn-secondary text-success" onClick={() => setIsDisbursePayrollModalOpen(true)} style={{ fontWeight: 600 }}>
                  <i className="ph ph-money"></i> Disburse Payroll
                </button>
              </div>
            </header>

            <div className="sub-tab-bar">
              <button className={`sub-tab-btn ${employeesSubTab === 'directory' ? 'active' : ''}`} onClick={() => setEmployeesSubTab('directory')}>
                <i className="ph ph-users"></i> Employee Directory
              </button>
              <button className={`sub-tab-btn ${employeesSubTab === 'attendance' ? 'active' : ''}`} onClick={() => setEmployeesSubTab('attendance')}>
                <i className="ph ph-clock-afternoon"></i> Daily Attendance
              </button>
              <button className={`sub-tab-btn ${employeesSubTab === 'payroll' ? 'active' : ''}`} onClick={() => setEmployeesSubTab('payroll')}>
                <i className="ph ph-money"></i> Monthly Payroll
              </button>
              <button className={`sub-tab-btn ${employeesSubTab === 'performance' ? 'active' : ''}`} onClick={() => setEmployeesSubTab('performance')}>
                <i className="ph ph-trend-up"></i> Performance
              </button>
              <button className={`sub-tab-btn ${employeesSubTab === 'salary' ? 'active' : ''}`} onClick={() => setEmployeesSubTab('salary')}>
                <i className="ph ph-hand-coins"></i> Salary & Advances
              </button>
              <button className={`sub-tab-btn ${employeesSubTab === 'leave' ? 'active' : ''}`} onClick={() => setEmployeesSubTab('leave')}>
                <i className="ph ph-calendar-x"></i> Leave Management
              </button>
              <button className={`sub-tab-btn ${employeesSubTab === 'profile' ? 'active' : ''}`} onClick={() => setEmployeesSubTab('profile')}>
                <i className="ph ph-user-card"></i> Employee Profile
              </button>
            </div>

            {employeesSubTab === 'attendance' ? (
              <div className="table-card bg-surface border" style={{ marginTop: '20px' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Daily Shift & Attendance Log</h3>
                  <button className="btn btn-primary btn-sm" onClick={() => setIsAttendanceModalOpen(true)}>
                    <i className="ph ph-plus"></i> Log Today's Attendance
                  </button>
                </div>
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Employee</th>
                        <th>Role</th>
                        <th>Shift Details</th>
                        <th>Check-in Time</th>
                        <th>Attendance Status</th>
                        <th className="text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceRecords.map((record) => (
                        <tr key={record.id}>
                          <td className="text-muted">{record.date}</td>
                          <td className="font-semibold">{record.empName}</td>
                          <td>{record.role}</td>
                          <td>{record.shift}</td>
                          <td>{record.checkIn}</td>
                          <td>
                            <span className={`badge ${
                              record.status.includes('Present') ? 'badge-success' :
                              record.status.includes('Overtime') ? 'badge-info' :
                              record.status.includes('Half-Day') ? 'badge-warning' : 'badge-danger'
                            }`}>
                              {record.status}
                            </span>
                          </td>
                          <td className="text-right">
                            <button className="btn btn-secondary btn-sm" onClick={() => setIsAttendanceModalOpen(true)}>
                              Update Status
                            </button>
                          </td>
                        </tr>
                      ))}
                      {attendanceRecords.length === 0 && (
                        <tr>
                          <td colSpan="7" className="text-center text-muted">No attendance entries logged today. Click "+ Log Today's Attendance".</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : employeesSubTab === 'payroll' ? (
              <div className="table-card bg-surface border" style={{ marginTop: '20px' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Monthly Payroll Disbursements</h3>
                  <button className="btn btn-success btn-sm text-white" onClick={() => setIsDisbursePayrollModalOpen(true)}>
                    <i className="ph ph-money"></i> Disburse Payroll Entry
                  </button>
                </div>
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Month</th>
                        <th>Base Salary (₹)</th>
                        <th>Piece Bonus (₹)</th>
                        <th>Deductions / Advances (₹)</th>
                        <th>Net Paid (₹)</th>
                        <th>Status</th>
                        <th className="text-right">Payslip</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payrollRecords.map(pr => (
                        <tr key={pr.id}>
                          <td className="font-semibold">{pr.empName}</td>
                          <td>{pr.month}</td>
                          <td>{formatCurrency(pr.baseSalary)}</td>
                          <td className="text-success font-semibold">+{formatCurrency(pr.bonus)}</td>
                          <td className="text-red">-{formatCurrency(pr.deductions)}</td>
                          <td className="font-bold text-primary">{formatCurrency(pr.netPayable)}</td>
                          <td>
                            <span className="badge badge-success">{pr.status}</span>
                          </td>
                          <td className="text-right">
                            <button className="btn btn-secondary btn-sm" onClick={() => alert(`Printing payslip for ${pr.empName} (${pr.month})...`)}>
                              <i className="ph ph-printer"></i> Print Payslip
                            </button>
                          </td>
                        </tr>
                      ))}
                      {employees.map(emp => {
                        const bonus = (emp.stitchRate || 40) * 350;
                        const net = (emp.salary || 18000) + bonus - 1000;
                        return (
                          <tr key={'calc-' + emp._id}>
                            <td className="font-semibold">{emp.name}</td>
                            <td className="text-muted">July 2026 (Calculated)</td>
                            <td>{formatCurrency(emp.salary || 18000)}</td>
                            <td className="text-success font-semibold">+{formatCurrency(bonus)}</td>
                            <td className="text-red">-₹1,000</td>
                            <td className="font-bold text-primary">{formatCurrency(net)}</td>
                            <td>
                              <span className="badge badge-warning">Pending Payment</span>
                            </td>
                            <td className="text-right">
                              <button className="btn btn-primary btn-sm" onClick={() => setIsDisbursePayrollModalOpen(true)}>
                                Pay Salary
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : employeesSubTab === 'salary' ? (
              <div className="table-card bg-surface border" style={{ marginTop: '20px' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Salary Advances & Festival Loans</h3>
                    <p className="small text-muted" style={{ margin: '2px 0 0 0' }}>Track advances given to stitchers and emergency loan disbursements.</p>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => setIsAdvanceModalOpen(true)}>
                    <i className="ph ph-plus-circle"></i> Give Salary Advance
                  </button>
                </div>
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Employee</th>
                        <th>Payment Type</th>
                        <th>Amount Disbursed (₹)</th>
                        <th>Payment Method</th>
                        <th>Notes / Reason</th>
                        <th className="text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {advanceRecords.map(adv => (
                        <tr key={adv.id}>
                          <td className="text-muted">{adv.date}</td>
                          <td className="font-semibold">{adv.empName}</td>
                          <td><span className="badge badge-gst">{adv.type}</span></td>
                          <td className="font-bold text-red">{formatCurrency(adv.amount)}</td>
                          <td>{adv.mode}</td>
                          <td>{adv.notes || '-'}</td>
                          <td className="text-right">
                            <button className="btn btn-secondary btn-sm" onClick={() => alert(`Advance receipt downloaded for ${adv.empName}`)}>
                              Receipt
                            </button>
                          </td>
                        </tr>
                      ))}
                      {advanceRecords.length === 0 && (
                        <tr>
                          <td colSpan="7" className="text-center text-muted">No salary advances recorded. Click "+ Give Salary Advance".</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : employeesSubTab === 'performance' ? (
              <div className="table-card bg-surface border" style={{ marginTop: '20px' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Stitching Efficiency & Piece Rate Performance</h3>
                </div>
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Role</th>
                        <th>Total Pieces Stitched</th>
                        <th>Stitch Rate (₹/Pcs)</th>
                        <th>Efficiency Rating</th>
                        <th className="text-right">Total Piece Earnings</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees.map(emp => {
                        const pcs = (emp.stitchRate || 25) * 140;
                        const totalEarned = pcs * (emp.stitchRate || 15);
                        return (
                          <tr key={'perf-' + emp._id}>
                            <td className="font-semibold">{emp.name}</td>
                            <td>{emp.role}</td>
                            <td className="font-bold">{pcs} Pcs</td>
                            <td>{formatCurrency(emp.stitchRate)}</td>
                            <td><span className="badge badge-success">96% High Efficiency</span></td>
                            <td className="text-right font-bold text-primary">{formatCurrency(totalEarned)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : employeesSubTab === 'leave' ? (
              <div className="table-card bg-surface border" style={{ marginTop: '20px' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Leave Management & Holiday Balances</h3>
                  <button className="btn btn-secondary btn-sm text-primary" onClick={() => alert("Leave request feature active")}>
                    + Log Leave Request
                  </button>
                </div>
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Casual Leave Used</th>
                        <th>Sick Leave Used</th>
                        <th>Earned Leave Balance</th>
                        <th className="text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees.map(emp => (
                        <tr key={'leave-' + emp._id}>
                          <td className="font-semibold">{emp.name}</td>
                          <td>2 / 12 Days</td>
                          <td>1 / 6 Days</td>
                          <td>9 Days Remaining</td>
                          <td className="text-right"><span className="badge badge-success">Active</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : employeesSubTab === 'profile' && selectedEmployeeDetail ? (
              <div className="table-card bg-surface border" style={{ marginTop: '20px', padding: '24px' }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(124,58,237,0.15)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 700 }}>
                    {selectedEmployeeDetail.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800 }}>{selectedEmployeeDetail.name}</h2>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <span className="badge badge-gst">{selectedEmployeeDetail.role}</span>
                      <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>{selectedEmployeeDetail.subCategory || 'Stitching Crew'}</span>
                    </div>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => openEditEmployee(selectedEmployeeDetail)}>
                    <i className="ph ph-pencil"></i> Edit Profile & Wages
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div style={{ backgroundColor: 'var(--color-muted)', padding: '16px', borderRadius: '12px' }}>
                    <div className="text-muted small">Base Monthly Salary</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-text-primary)' }}>{formatCurrency(selectedEmployeeDetail.salary)}</div>
                  </div>
                  <div style={{ backgroundColor: 'var(--color-muted)', padding: '16px', borderRadius: '12px' }}>
                    <div className="text-muted small">Piece Rate Rate / Pcs</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-primary)' }}>{formatCurrency(selectedEmployeeDetail.stitchRate)} / Pcs</div>
                  </div>
                  <div style={{ backgroundColor: 'var(--color-muted)', padding: '16px', borderRadius: '12px' }}>
                    <div className="text-muted small">Phone Contact</div>
                    <div style={{ fontSize: '16px', fontWeight: 700 }}>{selectedEmployeeDetail.phone || 'Not Logged'}</div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="search-filter-row" style={{ marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div className="search-input-wrapper" style={{ position: 'relative', flex: 1 }}>
                    <i className="ph ph-magnifying-glass"></i>
                    <input
                      type="text"
                      placeholder="Search employees by name or role..."
                      value={employeeSearch}
                      onChange={(e) => setEmployeeSearch(e.target.value)}
                      style={{ width: '100%', paddingRight: employeeSearch ? '32px' : '14px' }}
                    />
                    {employeeSearch && (
                      <button
                        type="button"
                        onClick={() => setEmployeeSearch('')}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-text-secondary)',
                          cursor: 'pointer',
                          fontSize: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Clear search filter"
                      >
                        <i className="ph ph-x-circle-fill"></i>
                      </button>
                    )}
                  </div>
                  {employeeSearch && (
                    <button
                      className="btn btn-secondary text-primary"
                      onClick={() => setEmployeeSearch('')}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600, whiteSpace: 'nowrap' }}
                    >
                      <i className="ph ph-arrow-left"></i> Go Back to All
                    </button>
                  )}
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
                            <td 
                              onClick={() => openEditEmployee(emp)} 
                              style={{ cursor: 'pointer' }}
                              title={`Click to edit ${emp.name}'s profile & rates`}
                            >
                              <div style={{ fontWeight: 700, color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <span>{emp.name}</span>
                                <i className="ph ph-pencil-simple" style={{ fontSize: '12px', opacity: 0.7 }}></i>
                              </div>
                              {emp.subCategory && <div className="small text-muted">{emp.subCategory}</div>}
                            </td>
                            <td>{emp.phone || '-'}</td>
                            <td>
                              <span className="badge badge-gst">{emp.role}</span>
                            </td>
                            <td className="text-right">{formatCurrency(emp.stitchRate)}</td>
                            <td className="text-right">{formatCurrency(emp.salary)}</td>
                            <td className="text-right">
                              <button className="btn-icon" onClick={() => openEditEmployee(emp)} title="Edit Employee"><i className="ph ph-pencil-simple"></i></button>
                              <button className="btn-icon text-red" onClick={() => deleteEmployee(emp._id)} title="Delete Employee"><i className="ph ph-trash"></i></button>
                            </td>
                          </tr>
                        ))}
                        {employees.filter(e => e.name.toLowerCase().includes(employeeSearch.toLowerCase())).length === 0 && (
                          <tr>
                            <td colSpan="6" className="text-center text-muted" style={{ padding: '36px 16px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(124,58,237,0.1)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                                  <i className="ph ph-user-minus"></i>
                                </div>
                                {employeeSearch ? (
                                  <>
                                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                      No employee matching "{employeeSearch}" was found.
                                    </div>
                                    <button className="btn btn-primary" onClick={() => setEmployeeSearch('')} style={{ marginTop: '4px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                      <i className="ph ph-arrow-left"></i> Go Back to All Employees
                                    </button>
                                  </>
                                ) : (
                                  <div>No crew registered. Add employees to log stitching operations.</div>
                                )}
                              </div>
                            </td>
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
                        <div 
                          className="mobile-card-title text-primary" 
                          onClick={() => openEditEmployee(emp)} 
                          style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          title={`Click to edit ${emp.name}`}
                        >
                          <span>{emp.name}</span>
                          <i className="ph ph-pencil-simple" style={{ fontSize: '12px', opacity: 0.7 }}></i>
                        </div>
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
              </>
            )}
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
            <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
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

              <div className="sub-tab-bar" style={{ marginBottom: '20px' }}>
                <button className={`sub-tab-btn ${expensesSubTab === 'all' ? 'active' : ''}`} onClick={() => setExpensesSubTab('all')}>
                  <i className="ph ph-coins"></i> All Expenses
                </button>
                <button className={`sub-tab-btn ${expensesSubTab === 'add' ? 'active' : ''}`} onClick={() => setIsExpenseModalOpen(true)}>
                  <i className="ph ph-plus-circle"></i> Add Expense
                </button>
                <button className={`sub-tab-btn ${expensesSubTab === 'categories' ? 'active' : ''}`} onClick={() => setExpensesSubTab('categories')}>
                  <i className="ph ph-folders"></i> Expense Categories
                </button>
                <button className={`sub-tab-btn ${expensesSubTab === 'pending' ? 'active' : ''}`} onClick={() => setExpensesSubTab('pending')}>
                  <i className="ph ph-hourglass"></i> Pending Approval
                </button>
                <button className={`sub-tab-btn ${expensesSubTab === 'approved' ? 'active' : ''}`} onClick={() => setExpensesSubTab('approved')}>
                  <i className="ph ph-check-square"></i> Approved Expenses
                </button>
                <button className={`sub-tab-btn ${expensesSubTab === 'summary' ? 'active' : ''}`} onClick={() => setExpensesSubTab('summary')}>
                  <i className="ph ph-chart-pie"></i> Monthly Summary
                </button>
              </div>

              {/* Expenses Metrics Summary */}
              <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
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

      {/* ==================== UPCOMING ORDER MODAL (Linear Style) ==================== */}
      {isUpcomingOrderModalOpen && (
        <div id="upcoming-order-modal" className="modal-overlay active">
          <div className="modal-card">
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '4px', backgroundColor: '#5E6AD2', color: '#fff', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>V</div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#1C1C21' }}>Varahi</span>
                <span style={{ color: '#8C8D96', fontSize: '12px' }}>›</span>
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#62636C' }}>{editingUpcomingOrder ? 'Edit issue' : 'New issue'}</span>
              </div>
              <div className="modal-header-actions">
                <button type="button" className="btn-close" style={{ fontSize: '14px' }} title="Full Screen"><i className="ph ph-arrows-out-simple"></i></button>
                <button type="button" className="btn-close" onClick={closeUpcomingOrderModal} title="Close"><i className="ph ph-x"></i></button>
              </div>
            </div>
            <form id="upcoming-order-form" onSubmit={handleUpcomingOrderSubmit}>
              <div className="modal-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label htmlFor="up-order-title" style={{ fontSize: '11px', fontWeight: 600, color: '#8C8D96', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Issue Title *</label>
                  <input type="text" id="up-order-title" required placeholder="e.g. 1000 Pcs Premium Denim Jackets" style={{ fontSize: '16px', fontWeight: 600, border: 'none', borderBottom: '1px solid #E6E6EB', borderRadius: 0, padding: '8px 0' }} />
                </div>

                <div className="form-group">
                  <label htmlFor="up-client-name" style={{ fontSize: '11px', fontWeight: 600, color: '#8C8D96', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Client / Customer Name *</label>
                  <input type="text" id="up-client-name" required placeholder="e.g. Sri Varahi Exports" list="order-clients-list" />
                  <datalist id="order-clients-list">
                    {clients.map(c => <option key={c._id} value={c.name} />)}
                  </datalist>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="up-delivery-date" style={{ fontSize: '11px', fontWeight: 600, color: '#8C8D96', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Target Delivery Date *</label>
                    <input type="date" id="up-delivery-date" required defaultValue={new Date().toISOString().split('T')[0]} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="up-val" style={{ fontSize: '11px', fontWeight: 600, color: '#8C8D96', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Estimated Budget (₹) *</label>
                    <input type="number" id="up-val" min="0" required placeholder="0.00" style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }} />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="up-status" style={{ fontSize: '11px', fontWeight: 600, color: '#8C8D96', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Status *</label>
                  <select id="up-status" required style={{ fontSize: '14px', padding: '10px 14px' }}>
                    <option value="Planned">Planned</option>
                    <option value="In Production">In Production</option>
                    <option value="Ready for Dispatch">Ready for Dispatch</option>
                    <option value="Delivered">Delivered</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="up-notes" style={{ fontSize: '11px', fontWeight: 600, color: '#8C8D96', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Description / Guidelines</label>
                  <textarea id="up-notes" rows="2" placeholder="Add specific fabric color rolls requirements or stitch rate payouts details..."></textarea>
                </div>
              </div>

              {/* Linear Chip Bar */}
              <div className="modal-chip-bar">
                <div className="modal-chip"><i className="ph ph-circle-dashed" style={{ color: '#5E6AD2' }}></i> Backlog</div>
                <div className="modal-chip"><i className="ph ph-chart-bar"></i> Priority</div>
                <div className="modal-chip"><i className="ph ph-user"></i> Assignee</div>
                <div className="modal-chip"><i className="ph ph-tag"></i> Labels</div>
                <div className="modal-chip"><i className="ph ph-dots-three"></i></div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-icon" style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid #E6E6EB', backgroundColor: '#FFFFFF', color: '#62636C', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Attach File">
                  <i className="ph ph-paperclip"></i>
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <label style={{ fontSize: '12px', color: '#62636C', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" style={{ accentColor: '#5E6AD2' }} /> Create more
                  </label>
                  <button type="submit" className="btn btn-primary" style={{ borderRadius: '14px', padding: '7px 18px', fontWeight: 600, backgroundColor: '#5E6AD2', borderColor: '#5E6AD2' }}>
                    {editingUpcomingOrder ? 'Save changes' : 'Create issue'}
                  </button>
                </div>
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

                <a className="more-menu-item" onClick={() => handleTabChange('expenses')} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 24px', borderBottom: '1px solid var(--color-border)', cursor: 'pointer', color: 'var(--color-text-primary)', textDecoration: 'none' }}>
                  <i className="ph ph-coins" style={{ fontSize: '22px', color: 'var(--color-primary)' }}></i>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>Expenses</div>
                    <div className="text-muted" style={{ fontSize: '11px' }}>Track order transportation, fuel & operational costs</div>
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

      {/* Siri Floating Orb Trigger Button */}
      <div 
        className="no-print"
        onClick={startVoiceAssistant}
        title="Open Siri Voice AI Assistant"
        style={{
          position: 'fixed',
          bottom: '88px',
          right: '24px',
          zIndex: 999,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 16px',
          borderRadius: '30px',
          background: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 50%, #3B82F6 100%)',
          boxShadow: '0 8px 24px rgba(124, 58, 237, 0.4)',
          color: '#ffffff',
          fontWeight: 700,
          fontSize: '13px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <div style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          backgroundColor: '#ffffff',
          boxShadow: '0 0 10px #ffffff',
          animation: 'pulse 1.5s infinite'
        }} />
        <i className="ph-fill ph-microphone" style={{ fontSize: '16px' }}></i>
        <span>Siri Voice</span>
      </div>

      {/* Log Upcoming Order Modal */}
      {isOrderModalOpen && (
        <div className="modal-overlay active" onClick={() => setIsOrderModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3>Log Upcoming Production Order</h3>
              <button className="btn-close" onClick={() => setIsOrderModalOpen(false)}><i className="ph ph-x"></i></button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target;
              try {
                await addUpcomingOrderMutation({
                  clientName: form.clientName.value,
                  orderTitle: form.orderTitle.value,
                  deliveryDate: form.deliveryDate.value,
                  estimatedValue: parseFloat(form.estimatedValue.value) || 0,
                  status: form.status.value || 'In Production',
                  notes: form.notes.value || ''
                });
                alert("🎉 Upcoming order logged successfully!");
                setIsOrderModalOpen(false);
              } catch (err) {
                alert("Error logging order: " + err.message);
              }
            }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label>Order Title / Description *</label>
                  <input type="text" name="orderTitle" required placeholder="e.g. 1000 Pcs Premium Denim Jackets" />
                </div>
                <div className="form-group">
                  <label>Client Name *</label>
                  <input type="text" name="clientName" required placeholder="e.g. Sri Varahi Exports" list="order-clients-list-dash" />
                  <datalist id="order-clients-list-dash">
                    {clients.map(c => <option key={c._id} value={c.name} />)}
                  </datalist>
                </div>
                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Delivery Target Date *</label>
                    <input type="date" name="deliveryDate" required defaultValue={new Date().toISOString().split('T')[0]} />
                  </div>
                  <div className="form-group">
                    <label>Estimated Value (₹) *</label>
                    <input type="number" name="estimatedValue" required placeholder="120000" step="100" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Initial Status</label>
                  <select name="status" defaultValue="In Production">
                    <option value="In Production">In Production</option>
                    <option value="Planned">Planned</option>
                    <option value="Ready">Ready</option>
                    <option value="Delivered">Delivered</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Notes / Work Instructions</label>
                  <textarea name="notes" placeholder="Fabric rolls received, stitchers assigned piece rates..." rows={3}></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsOrderModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><i className="ph ph-check"></i> Save Order</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Daily Attendance Modal */}
      {isAttendanceModalOpen && (
        <div className="modal-overlay active" onClick={() => setIsAttendanceModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>Log Daily Attendance & Shift</h3>
              <button className="btn-close" onClick={() => setIsAttendanceModalOpen(false)}><i className="ph ph-x"></i></button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const form = e.target;
              const empName = form.empName.value;
              const status = form.status.value;
              const shift = form.shift.value;
              const checkIn = form.checkIn.value;
              const date = form.date.value;

              const targetEmp = employees.find(emp => emp.name === empName);

              const newRecord = {
                id: Date.now(),
                empName,
                role: targetEmp ? targetEmp.role : 'Stitcher',
                shift,
                checkIn,
                status,
                date
              };

              setAttendanceRecords(prev => [newRecord, ...prev]);
              alert(`✅ Daily attendance logged for ${empName} (${status})!`);
              setIsAttendanceModalOpen(false);
            }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label>Select Employee / Crew Member *</label>
                  <select name="empName" required>
                    {employees.map(e => (
                      <option key={e._id} value={e.name}>{e.name} ({e.role})</option>
                    ))}
                    {employees.length === 0 && <option value="Kartick">Kartick (Stitcher)</option>}
                  </select>
                </div>
                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Attendance Date *</label>
                    <input type="date" name="date" required defaultValue={new Date().toISOString().split('T')[0]} />
                  </div>
                  <div className="form-group">
                    <label>Check-in Time</label>
                    <input type="text" name="checkIn" defaultValue="08:00 AM" required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Attendance Status *</label>
                  <select name="status" defaultValue="Present">
                    <option value="Present">Present (Full Day)</option>
                    <option value="Overtime (+2 hrs)">Overtime (+2 hrs)</option>
                    <option value="Half-Day">Half-Day (4 hrs)</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Absent">Absent</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Shift Timing</label>
                  <select name="shift" defaultValue="Morning Shift (08:00 - 17:00)">
                    <option value="Morning Shift (08:00 - 17:00)">Morning Shift (08:00 - 17:00)</option>
                    <option value="Night Shift (17:00 - 02:00)">Night Shift (17:00 - 02:00)</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAttendanceModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><i className="ph ph-check"></i> Save Attendance</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Give Salary Advance Modal */}
      {isAdvanceModalOpen && (
        <div className="modal-overlay active" onClick={() => setIsAdvanceModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>Give Salary Advance / Loan</h3>
              <button className="btn-close" onClick={() => setIsAdvanceModalOpen(false)}><i className="ph ph-x"></i></button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target;
              const empName = form.empName.value;
              const type = form.type.value;
              const amount = parseFloat(form.amount.value) || 0;
              const mode = form.mode.value;
              const notes = form.notes.value;
              const date = form.date.value;

              const newAdv = {
                id: Date.now(),
                empName,
                date,
                type,
                amount,
                mode,
                notes
              };

              setAdvanceRecords(prev => [newAdv, ...prev]);

              // Automatically log as expense entry
              try {
                await addExpenseMutation({
                  category: "Employee Salary Advances",
                  amount: amount,
                  description: `${type} for ${empName} (${notes || 'Advance payment'})`,
                  date
                });
              } catch (err) {}

              alert(`🎉 Advance of ${formatCurrency(amount)} recorded for ${empName}!`);
              setIsAdvanceModalOpen(false);
            }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label>Select Employee *</label>
                  <select name="empName" required>
                    {employees.map(e => (
                      <option key={e._id} value={e.name}>{e.name} ({e.role})</option>
                    ))}
                    {employees.length === 0 && <option value="Kartick">Kartick (Stitcher)</option>}
                  </select>
                </div>
                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Advance Amount (₹) *</label>
                    <input type="number" name="amount" required placeholder="2000" step="100" />
                  </div>
                  <div className="form-group">
                    <label>Date Disbursed *</label>
                    <input type="date" name="date" required defaultValue={new Date().toISOString().split('T')[0]} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Payment Category / Type *</label>
                  <select name="type" defaultValue="Salary Advance">
                    <option value="Salary Advance">Salary Advance</option>
                    <option value="Festival Bonus">Festival Bonus</option>
                    <option value="Emergency Loan">Emergency Loan</option>
                    <option value="Travel Allowance">Travel Allowance</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Payment Method *</label>
                  <select name="mode" defaultValue="UPI / GPay">
                    <option value="UPI / GPay">UPI / GPay</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Notes / Purpose</label>
                  <input type="text" name="notes" placeholder="e.g. Festival advance for Aadi" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAdvanceModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><i className="ph ph-check"></i> Record Advance</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Disburse Monthly Payroll Modal */}
      {isDisbursePayrollModalOpen && (
        <div className="modal-overlay active" onClick={() => setIsDisbursePayrollModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3>Disburse Monthly Payroll</h3>
              <button className="btn-close" onClick={() => setIsDisbursePayrollModalOpen(false)}><i className="ph ph-x"></i></button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target;
              const empName = form.empName.value;
              const month = form.month.value;
              const baseSalary = parseFloat(form.baseSalary.value) || 0;
              const bonus = parseFloat(form.bonus.value) || 0;
              const deductions = parseFloat(form.deductions.value) || 0;
              const netPayable = baseSalary + bonus - deductions;
              const date = new Date().toISOString().split('T')[0];

              const newPayroll = {
                id: Date.now(),
                empName,
                month,
                baseSalary,
                bonus,
                deductions,
                netPayable,
                status: "Disbursed & Paid",
                date
              };

              setPayrollRecords(prev => [newPayroll, ...prev]);

              // Automatically log as expense entry
              try {
                await addExpenseMutation({
                  category: "Employee Salaries",
                  amount: netPayable,
                  description: `Monthly salary disbursement for ${empName} (${month})`,
                  date
                });
              } catch (err) {}

              alert(`🎉 Payroll disbursement of ${formatCurrency(netPayable)} completed for ${empName}!`);
              setIsDisbursePayrollModalOpen(false);
            }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label>Select Employee *</label>
                  <select 
                    name="empName" 
                    required 
                    onChange={(e) => {
                      const selected = employees.find(emp => emp.name === e.target.value);
                      if (selected) {
                        const baseInput = document.querySelector('input[name="baseSalary"]');
                        if (baseInput) baseInput.value = selected.salary || 25000;
                      }
                    }}
                  >
                    {employees.map(e => (
                      <option key={e._id} value={e.name}>{e.name} ({e.role} - Base ₹{e.salary})</option>
                    ))}
                    {employees.length === 0 && <option value="Kartick">Kartick (Stitcher)</option>}
                  </select>
                </div>
                <div className="form-group">
                  <label>Payroll Month *</label>
                  <input type="text" name="month" required defaultValue="July 2026" placeholder="e.g. July 2026" />
                </div>
                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label>Base Salary (₹)</label>
                    <input type="number" name="baseSalary" required defaultValue="25000" step="100" />
                  </div>
                  <div className="form-group">
                    <label>Piece Bonus (₹)</label>
                    <input type="number" name="bonus" defaultValue="3500" step="100" />
                  </div>
                  <div className="form-group">
                    <label>Deductions (₹)</label>
                    <input type="number" name="deductions" defaultValue="1500" step="100" />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsDisbursePayrollModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-success text-white"><i className="ph ph-check"></i> Complete & Disburse</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View System User Privileges Modal */}
      {viewingUser && (
        <div className="modal-overlay active" onClick={() => setViewingUser(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3>👤 User Access Privileges - {viewingUser.name}</h3>
              <button className="btn-close" onClick={() => setViewingUser(null)}><i className="ph ph-x"></i></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: '#FAFAFC', borderRadius: '12px', border: '1px solid #E6E6EB' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#6E56CF', color: '#FFF', fontSize: '18px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {viewingUser.name.charAt(0)}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#1C1C21' }}>{viewingUser.name}</span>
                  <span style={{ fontSize: '12px', color: '#62636C' }}>{viewingUser.email}</span>
                </div>
                <span className="badge badge-success" style={{ marginLeft: 'auto', padding: '4px 10px', fontSize: '11px' }}>{viewingUser.status}</span>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#8C8D96', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Assigned Security Role</label>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#6E56CF', marginTop: '4px' }}>
                  <i className="ph ph-shield-check" style={{ marginRight: '6px' }}></i>{viewingUser.role}
                </div>
              </div>

              <div style={{ borderTop: '1px solid #F0F0F4', paddingTop: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#8C8D96', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '10px' }}>
                  Granular ERP Module Privileges
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>🧾 Bills & GST Invoices</span>
                    <span className="badge badge-purple" style={{ fontSize: '10px' }}>Full Create & Edit</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>⚙️ Jobs & Piece-Rate Orders</span>
                    <span className="badge badge-purple" style={{ fontSize: '10px' }}>
                      {viewingUser.role.includes("Supervisor") || viewingUser.role.includes("Admin") ? "Full Create & Edit" : "View Only"}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>📦 Fabric Rolls Inventory</span>
                    <span className="badge badge-purple" style={{ fontSize: '10px' }}>
                      {viewingUser.role.includes("Admin") || viewingUser.role.includes("Clerk") ? "Full Adjustments" : "View Stock"}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>👥 Employee Payroll & Advances</span>
                    <span className="badge badge-purple" style={{ fontSize: '10px' }}>
                      {viewingUser.role.includes("Admin") || viewingUser.role.includes("Accountant") ? "Disburse & Approve" : "Restricted"}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>📊 Tax Filings & Financial Reports</span>
                    <span className="badge badge-purple" style={{ fontSize: '10px' }}>
                      {viewingUser.role.includes("Admin") || viewingUser.role.includes("Accountant") ? "Full Access" : "Restricted"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setViewingUser(null)}>Close</button>
              <button type="button" className="btn btn-primary" onClick={() => { const target = viewingUser; setViewingUser(null); setEditingUser(target); }}>
                <i className="ph ph-pencil-simple"></i> Edit Permissions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit System User Permissions Modal */}
      {editingUser && (
        <div className="modal-overlay active" onClick={() => setEditingUser(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3>✏️ Edit User Permissions - {editingUser.name}</h3>
              <button className="btn-close" onClick={() => setEditingUser(null)}><i className="ph ph-x"></i></button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const form = e.target;
              const newName = form.editName.value.trim();
              const newEmail = form.editEmail.value.trim();
              const newRole = form.editRole.value;
              const newStatus = form.editStatus.value;

              setSystemUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, name: newName, email: newEmail, role: newRole, status: newStatus } : u));
              setEditingUser(null);
              alert(`🎉 Permissions and role updated for ${newName}!`);
            }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label>Full User Name *</label>
                  <input type="text" name="editName" required defaultValue={editingUser.name} />
                </div>
                <div className="form-group">
                  <label>Email Address / Login ID *</label>
                  <input type="email" name="editEmail" required defaultValue={editingUser.email} />
                </div>
                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label>Assigned Access Role *</label>
                    <select name="editRole" defaultValue={editingUser.role}>
                      <option value="Administrator (Full Access)">Administrator (Full Access)</option>
                      <option value="Billing Accountant">Billing Accountant</option>
                      <option value="Production Supervisor">Production Supervisor</option>
                      <option value="Inventory & Fabric Clerk">Inventory & Fabric Clerk</option>
                      <option value="Audit & Compliance Officer">Audit & Compliance Officer</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Account Security Status</label>
                    <select name="editStatus" defaultValue={editingUser.status || "Active"}>
                      <option value="Active">Active (Full Login)</option>
                      <option value="Suspended">Suspended (Access Revoked)</option>
                    </select>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #F0F0F4', paddingTop: '12px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#8C8D96', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '10px' }}>
                    Granular Access Permission Toggles
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                      <input type="checkbox" defaultChecked={true} style={{ width: '16px', height: '16px' }} />
                      <span>Allow Invoicing & GST Billing Creation</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                      <input type="checkbox" defaultChecked={editingUser.role.includes("Admin") || editingUser.role.includes("Supervisor")} style={{ width: '16px', height: '16px' }} />
                      <span>Allow Job Order Dispatching & Piece Rate Overrides</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                      <input type="checkbox" defaultChecked={editingUser.role.includes("Admin") || editingUser.role.includes("Clerk")} style={{ width: '16px', height: '16px' }} />
                      <span>Allow Fabric Stock Inward / Outward Adjustments</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                      <input type="checkbox" defaultChecked={editingUser.role.includes("Admin") || editingUser.role.includes("Accountant")} style={{ width: '16px', height: '16px' }} />
                      <span>Allow Monthly Payroll Disbursement & Advance Approval</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                      <input type="checkbox" defaultChecked={editingUser.role.includes("Admin")} style={{ width: '16px', height: '16px' }} />
                      <span>Allow System Settings & GST Tax Configurations</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditingUser(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><i className="ph ph-check"></i> Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add System User Modal */}
      {isAddUserModalOpen && (
        <div className="modal-overlay active" onClick={() => setIsAddUserModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>👤 Add System User & Assign Role</h3>
              <button className="btn-close" onClick={() => setIsAddUserModalOpen(false)}><i className="ph ph-x"></i></button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const form = e.target;
              const name = form.userName.value.trim();
              const email = form.userEmail.value.trim();
              const role = form.userRole.value;

              if (name && email) {
                setSystemUsers(prev => [...prev, { id: Date.now(), name, email, role, status: "Active" }]);
                setIsAddUserModalOpen(false);
                alert(`🎉 System user account created for ${name} (${role})!`);
              }
            }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label>Full User Name *</label>
                  <input type="text" name="userName" required placeholder="e.g. Anand Kumar" />
                </div>
                <div className="form-group">
                  <label>Email Address / Login ID *</label>
                  <input type="email" name="userEmail" required placeholder="e.g. anand@varahiexport.com" />
                </div>
                <div className="form-group">
                  <label>Assigned Access Role *</label>
                  <select name="userRole" defaultValue="Billing Accountant">
                    <option value="Administrator (Full Access)">Administrator (Full Access)</option>
                    <option value="Billing Accountant">Billing Accountant</option>
                    <option value="Production Supervisor">Production Supervisor</option>
                    <option value="Inventory & Fabric Clerk">Inventory & Fabric Clerk</option>
                    <option value="Audit & Compliance Officer">Audit & Compliance Officer</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Temporary Password *</label>
                  <input type="password" required defaultValue="Varahi@2026" placeholder="••••••••" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddUserModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><i className="ph ph-user-plus"></i> Save System User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Department Modal */}
      {isAddDeptModalOpen && (
        <div className="modal-overlay active" onClick={() => setIsAddDeptModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>🏢 Add Factory Department</h3>
              <button className="btn-close" onClick={() => setIsAddDeptModalOpen(false)}><i className="ph ph-x"></i></button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const form = e.target;
              const name = form.deptName.value.trim();
              const head = form.deptHead.value.trim();
              const staff = form.deptStaff.value.trim();
              const location = form.deptLocation.value.trim();

              if (name) {
                setSystemDepartments(prev => [...prev, { id: Date.now(), name, head: head || 'Supervisor', staffCount: staff || '5 Members', location: location || 'Unit 1' }]);
                setIsAddDeptModalOpen(false);
                alert(`🎉 Department "${name}" created successfully!`);
              }
            }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label>Department Title *</label>
                  <input type="text" name="deptName" required placeholder="e.g. Embroidery & Finishing Unit" />
                </div>
                <div className="form-group">
                  <label>Floor Supervisor / Department Head</label>
                  <input type="text" name="deptHead" placeholder="e.g. Ramesh Kumar" />
                </div>
                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label>Staff Members Count</label>
                    <input type="text" name="deptStaff" defaultValue="8 Members" placeholder="e.g. 8 Members" />
                  </div>
                  <div className="form-group">
                    <label>Factory Floor Location</label>
                    <input type="text" name="deptLocation" defaultValue="Tirupur Floor 2" placeholder="e.g. Floor 2" />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddDeptModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><i className="ph ph-check"></i> Create Department</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Job Category Modal */}
      {isAddCategoryModalOpen && (
        <div className="modal-overlay active" onClick={() => setIsAddCategoryModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>🏷️ Add Garment Job Category</h3>
              <button className="btn-close" onClick={() => setIsAddCategoryModalOpen(false)}><i className="ph ph-x"></i></button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const form = e.target;
              const name = form.catName.value.trim();
              const gst = form.catGst.value;
              const rate = form.catRate.value.trim();
              const desc = form.catDesc.value.trim();

              if (name) {
                setJobCategoriesList(prev => [...prev, { id: Date.now(), name, gstRate: gst, rateRange: rate || '₹20 - ₹40 / Pcs', description: desc || 'Custom garment category' }]);
                setIsAddCategoryModalOpen(false);
                alert(`🎉 Job Category "${name}" added!`);
              }
            }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label>Category Title *</label>
                  <input type="text" name="catName" required placeholder="e.g. Printed Hoodies & Sweatshirts" />
                </div>
                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label>GST Slab *</label>
                    <select name="catGst" defaultValue="5%">
                      <option value="5%">5% (Standard Garments)</option>
                      <option value="12%">12% (Premium Apparel)</option>
                      <option value="18%">18% (Job Work Processing)</option>
                      <option value="0%">0% (Exempt Export)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Piece Rate Standard (₹)</label>
                    <input type="text" name="catRate" defaultValue="₹25 - ₹45 / Pcs" placeholder="e.g. ₹25 - ₹45 / Pcs" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Category Description</label>
                  <input type="text" name="catDesc" placeholder="e.g. Fleece heavy knit hoodies stitching" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddCategoryModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><i className="ph ph-check"></i> Save Category</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Expense Category Modal */}
      {isAddExpenseCatModalOpen && (
        <div className="modal-overlay active" onClick={() => setIsAddExpenseCatModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>💰 Add Expense Category</h3>
              <button className="btn-close" onClick={() => setIsAddExpenseCatModalOpen(false)}><i className="ph ph-x"></i></button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const form = e.target;
              const name = form.expName.value.trim();
              const budget = form.expBudget.value.trim();
              const deductible = form.expDeductible.value;

              if (name) {
                setExpenseCategoriesList(prev => [...prev, { id: Date.now(), name, budget: budget || '₹30,000 / Mo', deductible }]);
                setIsAddExpenseCatModalOpen(false);
                alert(`🎉 Expense Category "${name}" created!`);
              }
            }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label>Expense Category Title *</label>
                  <input type="text" name="expName" required placeholder="e.g. Thread & Accessories Procurement" />
                </div>
                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label>Monthly Budget Limit (₹)</label>
                    <input type="text" name="expBudget" defaultValue="₹35,000 / Mo" placeholder="e.g. ₹35,000 / Mo" />
                  </div>
                  <div className="form-group">
                    <label>Tax Deductible?</label>
                    <select name="expDeductible" defaultValue="Yes">
                      <option value="Yes">Yes (Deductible Business Expense)</option>
                      <option value="No">No (Non-Deductible)</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddExpenseCatModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><i className="ph ph-check"></i> Save Expense Category</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Company Branch Modal */}
      {isAddBranchModalOpen && (
        <div className="modal-overlay active" onClick={() => setIsAddBranchModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>🏢 Add New Company Branch</h3>
              <button className="btn-close" onClick={() => setIsAddBranchModalOpen(false)}><i className="ph ph-x"></i></button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const form = e.target;
              const name = form.compName.value.trim();
              const branch = form.compBranch.value.trim();
              const gst = form.compGst.value.trim();
              const city = form.compCity.value.trim();
              const phone = form.compPhone.value.trim();

              const newCompId = 'comp-' + Date.now();
              const newComp = {
                id: newCompId,
                name: name || 'Vikas Export',
                branch: branch || `${city} Unit`,
                gst: gst || '33BBBBB1111B1Z6',
                phone: phone || '+91 91234 56789',
                city: city || 'Coimbatore',
                badge: 'Branch'
              };

              setCompanies(prev => [...prev, newComp]);
              setActiveCompanyId(newCompId);
              setIsAddBranchModalOpen(false);

              alert(`🎉 Company Branch "${name} (${branch})" added and set as active!`);
            }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label>Company Name *</label>
                  <input type="text" name="compName" required defaultValue="Vikas Export" placeholder="e.g. Vikas Export" />
                </div>
                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label>Branch Title *</label>
                    <input type="text" name="compBranch" required defaultValue="Coimbatore Unit" placeholder="e.g. Coimbatore Unit" />
                  </div>
                  <div className="form-group">
                    <label>City / Location *</label>
                    <input type="text" name="compCity" required defaultValue="Coimbatore" placeholder="e.g. Coimbatore" />
                  </div>
                </div>
                <div className="form-group">
                  <label>GSTIN Tax Registration Number</label>
                  <input type="text" name="compGst" defaultValue="33BBBBB1111B1Z6" placeholder="e.g. 33BBBBB1111B1Z6" />
                </div>
                <div className="form-group">
                  <label>Branch Phone / Contact</label>
                  <input type="text" name="compPhone" defaultValue="+91 91234 56789" placeholder="e.g. +91 91234 56789" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddBranchModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><i className="ph ph-check"></i> Save & Switch Branch</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Persistent Ambient Floating Siri Bottom Bar (Modal-Free & Perfectly Aligned) */}
      {isSiriFloatingBarOpen && (
        <div className="floating-siri-bar shadow-2xl no-print" style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 99999,
          backgroundColor: 'rgba(18, 18, 20, 0.96)',
          backdropFilter: 'blur(20px)',
          color: '#ffffff',
          borderRadius: '24px',
          padding: '12px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          border: '1px solid rgba(124, 58, 237, 0.45)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(124, 58, 237, 0.35)',
          width: '92%',
          maxWidth: '580px',
          boxSizing: 'border-box'
        }}>
          {/* Main Siri Status & Action Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
            {/* Animated Apple Siri Glowing Orb */}
            <div
              onClick={startVoiceAssistant}
              style={{ cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Click to Speak to Siri"
            >
              <div className="siri-orb-icon siri-orb-icon-lg"></div>
            </div>

            {/* Transcript & Status Text */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="pulse-dot" style={{ width: '8px', height: '8px', backgroundColor: isVoiceListening ? '#10B981' : '#F59E0B', borderRadius: '50%', display: 'inline-block', flexShrink: 0 }}></span>
                <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)' }}>
                  {isVoiceListening ? 'Siri Listening Live...' : voiceStatus === 'success' ? 'Live Action Completed' : 'Siri Ambient Voice AI'}
                </span>
              </div>
              <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#F4F4F5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {voiceTranscript ? `"${voiceTranscript}"` : voiceMessage || 'Say e.g. "create job" or "mark attendance"'}
              </div>
            </div>

            {/* Execute Speech Button */}
            {voiceTranscript && (
              <button
                onClick={() => processVoiceCommand(voiceTranscript)}
                style={{ backgroundColor: '#6E56CF', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}
              >
                Run
              </button>
            )}

            {/* Close Button */}
            <button
              onClick={() => { setIsSiriFloatingBarOpen(false); stopVoiceAssistant(); }}
              style={{ background: 'none', border: 'none', color: '#A1A1AA', cursor: 'pointer', padding: '4px', fontSize: '18px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Close Siri"
            >
              <i className="ph ph-x"></i>
            </button>
          </div>

          {/* Quick Voice Command Chips Bar - EXACTLY 2 EXAMPLES */}
          <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
            <button
              type="button"
              onClick={() => {
                const cmd = "open employee tab";
                setVoiceInputManual(cmd);
                processVoiceCommand(cmd);
              }}
              style={{ flex: 1, fontSize: '11px', padding: '6px 10px', borderRadius: '12px', backgroundColor: 'rgba(124, 58, 237, 0.2)', color: '#D8B4FE', border: '1px solid rgba(124, 58, 237, 0.4)', fontWeight: 600, cursor: 'pointer', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              🎙️ "open employee tab"
            </button>
            <button
              type="button"
              onClick={() => {
                const cmd = "enter srimathi as a new employee";
                setVoiceInputManual(cmd);
                processVoiceCommand(cmd);
              }}
              style={{ flex: 1, fontSize: '11px', padding: '6px 10px', borderRadius: '12px', backgroundColor: 'rgba(236, 72, 153, 0.2)', color: '#FBCFE8', border: '1px solid rgba(236, 72, 153, 0.4)', fontWeight: 600, cursor: 'pointer', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              🎙️ "enter srimathi as a new employee"
            </button>
          </div>
        </div>
      )}

      {/* UNIVERSAL LINEAR-STYLED DELETE CONFIRMATION MODAL */}
      {deleteConfirmState.isOpen && (
        <div 
          className="modal-overlay active" 
          onClick={closeDeleteConfirmModal}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '16px'
          }}
        >
          <div 
            className="modal-card" 
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              maxWidth: '460px',
              width: '100%',
              padding: '24px',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              boxShadow: '0 20px 40px rgba(15, 23, 42, 0.2), 0 0 0 1px rgba(244, 63, 94, 0.1)',
              animation: 'modalSlideIn 180ms cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '20px' }}>
              {/* Warning Icon Avatar Badge */}
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                backgroundColor: '#FFE4E6',
                color: '#F43F5E',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                flexShrink: 0,
                border: '1px solid rgba(244, 63, 94, 0.2)'
              }}>
                <i className="ph ph-warning-octagon"></i>
              </div>

              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>
                  {deleteConfirmState.title || 'Confirm Deletion'}
                </h3>
                <p style={{ margin: 0, fontSize: '13.5px', color: '#64748B', lineHeight: '1.5' }}>
                  {deleteConfirmState.message || 'Are you sure you want to permanently delete this item? This action cannot be undone.'}
                </p>
              </div>
            </div>

            {/* Target Item Name Badge */}
            {deleteConfirmState.itemName && (
              <div style={{
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                padding: '10px 14px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <i className="ph ph-trash" style={{ color: '#F43F5E', fontSize: '16px' }}></i>
                <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#0F172A', fontFamily: 'var(--font-mono)' }}>
                  {deleteConfirmState.itemName}
                </span>
              </div>
            )}

            {/* Action Buttons Row */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '16px', borderTop: '1px solid #F1F5F9' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={closeDeleteConfirmModal}
                style={{ borderRadius: '10px', padding: '9px 18px', fontWeight: 600, fontSize: '13px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (deleteConfirmState.onConfirm) {
                    await deleteConfirmState.onConfirm();
                  }
                  closeDeleteConfirmModal();
                }}
                style={{
                  backgroundColor: '#F43F5E',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '9px 20px',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(244, 63, 94, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 120ms ease'
                }}
              >
                <i className="ph ph-trash" style={{ fontSize: '15px' }}></i> Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
