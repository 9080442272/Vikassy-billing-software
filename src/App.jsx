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

// Linear UI Design System Custom Calendar Date Picker Component
function LinearDatePickerInput({ id, name, label, defaultValue, value, onChange, required = false }) {
  const initialDateStr = value || defaultValue || new Date().toISOString().split('T')[0];
  const parseInit = (str) => {
    if (!str) return new Date();
    const d = new Date(str);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => parseInit(initialDateStr));
  const [currentViewDate, setCurrentViewDate] = useState(() => parseInit(initialDateStr));
  const [viewMode, setViewMode] = useState('Day');
  const [quickInput, setQuickInput] = useState('');
  const popoverRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const year = currentViewDate.getFullYear();
  const month = currentViewDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  const daysGrid = [];
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    daysGrid.push({
      day: prevMonthTotalDays - i,
      monthOffset: -1,
      date: new Date(year, month - 1, prevMonthTotalDays - i)
    });
  }
  for (let d = 1; d <= totalDaysInMonth; d++) {
    daysGrid.push({
      day: d,
      monthOffset: 0,
      date: new Date(year, month, d)
    });
  }
  const remaining = 35 - daysGrid.length > 0 ? 35 - daysGrid.length : 42 - daysGrid.length;
  for (let n = 1; n <= remaining; n++) {
    daysGrid.push({
      day: n,
      monthOffset: 1,
      date: new Date(year, month + 1, n)
    });
  }

  const formatDisplay = (d) => {
    if (!d || isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const y = d.getFullYear();
    return `${day}/${m}/${y}`;
  };

  const formatIso = (d) => {
    if (!d || isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const y = d.getFullYear();
    return `${y}-${m}-${day}`;
  };

  const handleSelectDate = (d) => {
    setSelectedDate(d);
    setCurrentViewDate(d);
    const iso = formatIso(d);
    if (onChange) onChange(iso);
    setIsOpen(false);
  };

  const prevMonth = (e) => {
    e.stopPropagation();
    setCurrentViewDate(new Date(year, month - 1, 1));
  };

  const nextMonth = (e) => {
    e.stopPropagation();
    setCurrentViewDate(new Date(year, month + 1, 1));
  };

  return (
    <div className="form-group" style={{ position: 'relative', marginBottom: isOpen ? '230px' : undefined, transition: 'margin-bottom 0.2s ease' }} ref={popoverRef}>
      {label && <label htmlFor={id} style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>{label}</label>}
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          id={id}
          readOnly
          required={required}
          value={formatDisplay(selectedDate)}
          onClick={() => setIsOpen(!isOpen)}
          style={{
            fontSize: '14px',
            padding: '11px 14px',
            borderRadius: '12px',
            width: '100%',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            cursor: 'pointer',
            fontWeight: 500,
            color: 'var(--color-text-primary)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
          }}
        />
        <input type="hidden" name={name} value={formatIso(selectedDate)} />
        <i 
          className="ph ph-calendar-blank"
          onClick={() => setIsOpen(!isOpen)}
          style={{
            position: 'absolute',
            right: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '18px',
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
            pointerEvents: 'none'
          }}
        ></i>
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          zIndex: 100000,
          width: '280px',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.1)',
          padding: '16px',
          fontFamily: 'Inter, system-ui, sans-serif'
        }}>
          {/* Month Header & Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', padding: '0 4px' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#1E1E24' }}>
              {monthNames[month]} {year}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={prevMonth}
                style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '15px', color: '#62636C', padding: '4px' }}
              >
                <i className="ph ph-caret-left"></i>
              </button>
              <button
                type="button"
                onClick={nextMonth}
                style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '15px', color: '#62636C', padding: '4px' }}
              >
                <i className="ph ph-caret-right"></i>
              </button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: '8px' }}>
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
              <span key={d} style={{ fontSize: '12px', fontWeight: 600, color: '#8C8D96' }}>{d}</span>
            ))}
          </div>

          {/* Days Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center' }}>
            {daysGrid.map((item, index) => {
              const isSelected = selectedDate && item.date.toDateString() === selectedDate.toDateString();
              const isToday = item.date.toDateString() === new Date().toDateString();
              const isCurrentMonth = item.monthOffset === 0;

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelectDate(item.date)}
                  style={{
                    width: '32px',
                    height: '32px',
                    margin: '0 auto',
                    borderRadius: '50%',
                    border: isToday && !isSelected ? '1px solid #1E1E24' : 'none',
                    backgroundColor: isSelected ? '#1E1E24' : 'transparent',
                    color: isSelected ? '#FFFFFF' : (isCurrentMonth ? '#1E1E24' : '#D1D1D6'),
                    fontWeight: isSelected || isToday ? 700 : 500,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'center',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {item.day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  // Local persistent state fallbacks to guarantee 100% data survival across offline, restarts, and network drops
  const [localClients, setLocalClients] = useState(() => {
    try { return JSON.parse(localStorage.getItem('varahi_local_clients')) || []; } catch(e) { return []; }
  });
  const [localBills, setLocalBills] = useState(() => {
    try { return JSON.parse(localStorage.getItem('varahi_local_bills')) || []; } catch(e) { return []; }
  });
  const [localEmployees, setLocalEmployees] = useState(() => {
    try { return JSON.parse(localStorage.getItem('varahi_local_employees')) || []; } catch(e) { return []; }
  });
  const [localFabrics, setLocalFabrics] = useState(() => {
    try { return JSON.parse(localStorage.getItem('varahi_local_fabrics')) || []; } catch(e) { return []; }
  });
  const [localStitching, setLocalStitching] = useState(() => {
    try { return JSON.parse(localStorage.getItem('varahi_local_stitching')) || []; } catch(e) { return []; }
  });
  const [localExpenses, setLocalExpenses] = useState(() => {
    try { return JSON.parse(localStorage.getItem('varahi_local_expenses')) || []; } catch(e) { return []; }
  });
  const [localAttendance, setLocalAttendance] = useState(() => {
    try {
      const saved = localStorage.getItem('varahi_local_attendance');
      return saved ? JSON.parse(saved) : [
        { _id: 'att_1', empName: "Balasubramainan", role: "CEO", shift: "Morning Shift (08:00 - 17:00)", checkIn: "08:00 AM", status: "Present", date: new Date().toISOString().split('T')[0] }
      ];
    } catch(e) {
      return [
        { _id: 'att_1', empName: "Balasubramainan", role: "CEO", shift: "Morning Shift (08:00 - 17:00)", checkIn: "08:00 AM", status: "Present", date: new Date().toISOString().split('T')[0] }
      ];
    }
  });
  const [customLocalJobs, setCustomLocalJobs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('varahi_local_jobs')) || []; } catch(e) { return []; }
  });

  useEffect(() => { localStorage.setItem('varahi_local_clients', JSON.stringify(localClients)); }, [localClients]);
  useEffect(() => { localStorage.setItem('varahi_local_bills', JSON.stringify(localBills)); }, [localBills]);
  useEffect(() => { localStorage.setItem('varahi_local_employees', JSON.stringify(localEmployees)); }, [localEmployees]);
  useEffect(() => { localStorage.setItem('varahi_local_fabrics', JSON.stringify(localFabrics)); }, [localFabrics]);
  useEffect(() => { localStorage.setItem('varahi_local_stitching', JSON.stringify(localStitching)); }, [localStitching]);
  useEffect(() => { localStorage.setItem('varahi_local_expenses', JSON.stringify(localExpenses)); }, [localExpenses]);
  useEffect(() => { localStorage.setItem('varahi_local_attendance', JSON.stringify(localAttendance)); }, [localAttendance]);
  useEffect(() => { localStorage.setItem('varahi_local_jobs', JSON.stringify(customLocalJobs)); }, [customLocalJobs]);

  const mergeCollections = (convexArr = [], localArr = []) => {
    const map = new Map();
    localArr.forEach(item => {
      const key = item._id || item.billNumber || item.styleNumber || (item.name + (item.role || ''));
      map.set(key, item);
    });
    convexArr.forEach(item => {
      const key = item._id || item.billNumber || item.styleNumber || (item.name + (item.role || ''));
      map.set(key, item);
    });
    return Array.from(map.values());
  };

  // --- Convex Real-time Cloud Queries + Local Fallbacks ---
  const rawClients = useQuery(api.clients.getAll) || [];
  const clients = mergeCollections(rawClients, localClients);

  const rawBills = useQuery(api.bills.getAll) || [];
  const bills = mergeCollections(rawBills, localBills);

  const rawEmployees = useQuery(api.employees.getAll) || [];
  const employees = mergeCollections(rawEmployees, localEmployees);

  const rawFabrics = useQuery(api.fabrics.getAll) || [];
  const fabrics = mergeCollections(rawFabrics, localFabrics);

  const rawStitching = useQuery(api.stitching.getAll) || [];
  const stitching = mergeCollections(rawStitching, localStitching);

  const rawAttendance = (api.attendance && api.attendance.getAll ? useQuery(api.attendance.getAll) : []) || [];
  const attendanceRecords = mergeCollections(rawAttendance, localAttendance);

  const ceoActivities = useQuery(api.ceoActivities.getAll) || [];

  const rawExpenses = useQuery(api.expenses.getAll) || [];
  const dummyExpenseKeywords = ['auto delivery charges', 'denim stitcher bonus', 'coimbatore client dispatch', 'monthly workshop power generator'];
  const filteredExpenses = rawExpenses.filter(e => !dummyExpenseKeywords.some(kw => (e.description || '').toLowerCase().includes(kw)));
  const expenses = mergeCollections(filteredExpenses, localExpenses);

  const upcomingOrdersConvex = useQuery(api.upcomingOrders.getAll) || [];
  const upcomingOrders = mergeCollections(upcomingOrdersConvex, customLocalJobs);

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
  const addAttendanceMutation = api.attendance && api.attendance.add ? useMutation(api.attendance.add) : null;
  const updateAttendanceMutation = api.attendance && api.attendance.update ? useMutation(api.attendance.update) : null;
  const deleteAttendanceMutation = api.attendance && api.attendance.remove ? useMutation(api.attendance.remove) : null;
  const updateCeoActivityMutation = useMutation(api.ceoActivities.update);
  const deleteCeoActivityMutation = useMutation(api.ceoActivities.remove);
  const addExpenseMutation = useMutation(api.expenses.add);
  const updateExpenseMutation = useMutation(api.expenses.update);
  const deleteExpenseMutation = useMutation(api.expenses.remove);
  const addUpcomingOrderMutation = useMutation(api.upcomingOrders.add);
  const updateUpcomingOrderMutation = useMutation(api.upcomingOrders.update);
  const addInvestmentMutation = api.investments && api.investments.add ? useMutation(api.investments.add) : null;
  const updateInvestmentMutation = api.investments && api.investments.update ? useMutation(api.investments.update) : null;
  const deleteInvestmentMutation = api.investments && api.investments.remove ? useMutation(api.investments.remove) : null;
  const clearAllDataMutation = useMutation(api.system.clearAllData);

  // Set to true to temporarily bypass authentication for dev / client reviews
  const BYPASS_AUTH = true;

  // --- State hooks ---
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('lastActiveTab') || 'dashboard');
  
  // Linear Design System Theme Mode (Light Mode Only)
  const [theme] = useState('light');

  useEffect(() => {
    localStorage.setItem('linear_theme', 'light');
    document.documentElement.classList.remove('dark');
    document.documentElement.setAttribute('data-theme', 'light');
  }, []);

  // Linear Cmd + K Command Palette State
  const [isCmdPaletteOpen, setIsCmdPaletteOpen] = useState(false);
  const [cmdSearchQuery, setCmdSearchQuery] = useState('');

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
        setIsCmdPaletteOpen(prev => !prev);
      } else if (e.key === 'Escape') {
        setIsCmdPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const latestTranscriptRef = useRef('');

  // Varahi System Sub-Module Tabs States
  const [jobsSubTab, setJobsSubTab] = useState('all'); // 'all' | 'create' | 'ongoing' | 'completed' | 'delayed' | 'details'
  const [jobsViewMode, setJobsViewMode] = useState('list'); // 'list' (Table View) | 'board'
  const [jobDetailsTab, setJobDetailsTab] = useState('overview'); // 'overview' | 'timeline' | 'staff' | 'progress' | 'expenses' | 'files' | 'logs'
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedJobModal, setSelectedJobModal] = useState(null); // Interactive Job Modal Overlay
  const [isCreateJobModalOpen, setIsCreateJobModalOpen] = useState(false);
  const [kanbanSearchQuery, setKanbanSearchQuery] = useState('');
  const [kanbanPriorityFilter, setKanbanPriorityFilter] = useState('All'); // 'All' | 'Urgent' | 'High' | 'Medium' | 'Low'

  // Stage Progression Helper
  const moveJobStage = (jobId, newStage) => {
    setCustomLocalJobs(prev => prev.map(j => {
      if (j._id === jobId) {
        return { ...j, stage: newStage, status: newStage };
      }
      return j;
    }));

    if (selectedJobModal && selectedJobModal._id === jobId) {
      setSelectedJobModal(prev => ({ ...prev, stage: newStage, status: newStage }));
    }

    setActivityAuditLogs(prev => [
      { 
        id: Date.now(), 
        user: "Production Manager", 
        action: `Advanced Order #${jobId}`, 
        target: `to ${newStage}`, 
        time: "Just now", 
        icon: "ph-arrow-right", 
        color: "#10B981" 
      },
      ...prev
    ]);
  };

  // Linear Audit Stream & Event Logs
  const [activityAuditLogs, setActivityAuditLogs] = useState([
    { id: 1, user: "Vikashini Balasubramanian", action: "Created GST Invoice", target: "#VE-2026-084 (₹1,85,000)", time: "10 mins ago", icon: "ph-receipt", color: "#5E6AD2" },
    { id: 2, user: "Kartick (Master Tailor)", action: "Moved Production Job", target: "#JOB-102 to QC Inspection", time: "25 mins ago", icon: "ph-scissors", color: "#10B981" },
    { id: 3, user: "Billing Accountant", action: "Registered Buyer Profile", target: "Apex Denim Exports Ltd.", time: "1 hour ago", icon: "ph-user-plus", color: "#F59E0B" },
    { id: 4, user: "System Auto-Runner", action: "Triggered Webhook Delivery", target: "GST Portal E-Way Sync (200 OK)", time: "2 hours ago", icon: "ph-lightning", color: "#8B5CF6" }
  ]);

  const [clientsSubTab, setClientsSubTab] = useState('list'); // 'list' | 'details' | 'active-jobs' | 'completed-jobs' | 'documents'
  const [selectedClientDetail, setSelectedClientDetail] = useState(null);

  const [employeesSubTab, setEmployeesSubTab] = useState('directory'); // 'directory' | 'attendance' | 'payroll' | 'performance' | 'salary' | 'leave' | 'profile'
  const [empProfileTab, setEmpProfileTab] = useState('personal'); // 'personal' | 'attendance' | 'jobs' | 'salary' | 'documents'
  const [selectedEmployeeDetail, setSelectedEmployeeDetail] = useState(null);
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
  const [customStaffRoles, setCustomStaffRoles] = useState([
    "Stitcher",
    "Checking staff",
    "Packaging staff",
    "Supervisor",
    "Signer"
  ]);
  const [selectedStaffRole, setSelectedStaffRole] = useState("Stitcher");
  const [isCustomRoleActive, setIsCustomRoleActive] = useState(false);
  const [customRoleInputVal, setCustomRoleInputVal] = useState("");

  // Employee Action Modals & Records
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [linkedJobOrdersList, setLinkedJobOrdersList] = useState(['']);
  const [advSelectedClient, setAdvSelectedClient] = useState('');
  const [isDisbursePayrollModalOpen, setIsDisbursePayrollModalOpen] = useState(false);

  const [advanceRecords, setAdvanceRecords] = useState([
    { id: 1, empName: "Balasubramainan", date: new Date().toISOString().split('T')[0], type: "Executive Advance", amount: 5000, mode: "Bank Transfer", notes: "Executive travel allowance" }
  ]);

  const [payrollRecords, setPayrollRecords] = useState([
    { id: 1, empName: "Balasubramainan", month: "July 2026", baseSalary: 75000, bonus: 10000, deductions: 0, netPayable: 85000, status: "Disbursed & Paid", date: new Date().toISOString().split('T')[0] }
  ]);

  // Capital Sourcing & Order Investment States
  const [investmentRecords, setInvestmentRecords] = useState(() => {
    try {
      const saved = localStorage.getItem('varahi_investment_records');
      return saved ? JSON.parse(saved) : [
        { id: 1, date: new Date().toISOString().split('T')[0], type: "CEO brought amount from MD to run order", amount: 300000, linkedOrder: "Style #ST-2026-01 (Apex Denim Exports)" },
        { id: 2, date: new Date().toISOString().split('T')[0], type: "CEO brought loan for working capital", amount: 250000, linkedOrder: "General Factory Operational Fund" }
      ];
    } catch (e) {
      return [
        { id: 1, date: new Date().toISOString().split('T')[0], type: "CEO brought amount from MD to run order", amount: 300000, linkedOrder: "Style #ST-2026-01 (Apex Denim Exports)" },
        { id: 2, date: new Date().toISOString().split('T')[0], type: "CEO brought loan for working capital", amount: 250000, linkedOrder: "General Factory Operational Fund" }
      ];
    }
  });

  useEffect(() => {
    localStorage.setItem('varahi_investment_records', JSON.stringify(investmentRecords));
  }, [investmentRecords]);
  const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false);
  const [isAllocateOrderModalOpen, setIsAllocateOrderModalOpen] = useState(false);

  // Piece-Rate Master (PC Rate) States
  const [pieceRateOperations, setPieceRateOperations] = useState([
    { id: 1, code: "OP-01", name: "Garment Pattern Cutting", department: "Cutting", ratePerPiece: 3.50, targetPerDay: 300, assignedRole: "Cutting Master" },
    { id: 2, code: "OP-02", name: "Front & Back Body Stitching", department: "Stitching", ratePerPiece: 12.00, targetPerDay: 80, assignedRole: "Senior Stitcher" },
    { id: 3, code: "OP-03", name: "Overlock Safety Seaming", department: "Stitching", ratePerPiece: 4.50, targetPerDay: 150, assignedRole: "Overlock Operator" },
    { id: 4, code: "OP-04", name: "Collar & Cuff Attachment", department: "Stitching", ratePerPiece: 6.00, targetPerDay: 100, assignedRole: "Specialist Stitcher" },
    { id: 5, code: "OP-05", name: "Button Hole & Buttoning", department: "Finishing", ratePerPiece: 2.00, targetPerDay: 250, assignedRole: "Finishing Helper" },
    { id: 6, code: "OP-06", name: "Ironing, Tagging & Packing", department: "Packing", ratePerPiece: 2.50, targetPerDay: 200, assignedRole: "Packing Staff" }
  ]);
  const [isAddPcRateModalOpen, setIsAddPcRateModalOpen] = useState(false);
  const [isCalcPcRateModalOpen, setIsCalcPcRateModalOpen] = useState(false);
  const [calcSelectedOpId, setCalcSelectedOpId] = useState(2);
  const [calcPcsCount, setCalcPcsCount] = useState(150);

  // Employee Modal Custom Piece-Rates States
  const [isCustomEmpRateActive, setIsCustomEmpRateActive] = useState(false);
  const [customEmpRatesList, setCustomEmpRatesList] = useState([]);
  const [customEmpRateNameInput, setCustomEmpRateNameInput] = useState('');
  const [customEmpRateValInput, setCustomEmpRateValInput] = useState('');

  // Job Modal Custom Piece-Rates States
  const [isJobCustomRateActive, setIsJobCustomRateActive] = useState(false);
  const [jobCustomRatesList, setJobCustomRatesList] = useState([]);
  const [jobCustomRateNameInput, setJobCustomRateNameInput] = useState('');
  const [jobCustomRateValInput, setJobCustomRateValInput] = useState('');

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

  // Disburse Payroll Selected Employee State
  const [selectedDisburseEmp, setSelectedDisburseEmp] = useState('');

  // Edit / Details target selections
  const [editingClient, setEditingClient] = useState(null);
  const [editingBill, setEditingBill] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editingFabric, setEditingFabric] = useState(null);
  const [editingStitching, setEditingStitching] = useState(null);
  const [editingCeo, setEditingCeo] = useState(null);
  const [editingInvestment, setEditingInvestment] = useState(null);
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [selectedCeoDetail, setSelectedCeoDetail] = useState(null);

  // Search/Filters states
  const [clientSearch, setClientSearch] = useState('');
  const [billSearch, setBillSearch] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [fabricSearch, setFabricSearch] = useState('');
  const [stitchingSearch, setStitchingSearch] = useState('');

  // Custom Production Units States
  const [productionUnitsList, setProductionUnitsList] = useState([
    "Cutting Unit A",
    "Stitching Floor B",
    "Embroidery & Finishing",
    "Quality Inspection & Packing"
  ]);
  const [selectedProductionUnit, setSelectedProductionUnit] = useState("Cutting Unit A");
  const [isCustomUnitActive, setIsCustomUnitActive] = useState(false);
  const [customUnitInputVal, setCustomUnitInputVal] = useState("");

  // Create Job Live Calculation States
  const [createJobOrderQty, setCreateJobOrderQty] = useState(2500);
  const [createJobShipmentQty, setCreateJobShipmentQty] = useState(2500);
  const [isShipmentQtyTouched, setIsShipmentQtyTouched] = useState(false);
  const [createJobPowerTableRate, setCreateJobPowerTableRate] = useState(12.00);
  const [createJobCuttingRate, setCreateJobCuttingRate] = useState(3.50);
  const [createJobSingerRate, setCreateJobSingerRate] = useState(8.50);
  const [createJobOverlockRate, setCreateJobOverlockRate] = useState(4.50);
  const [createJobCheckingRate, setCreateJobCheckingRate] = useState(2.00);
  const [createJobThreadRate, setCreateJobThreadRate] = useState(1.50);
  const [createJobIroningRate, setCreateJobIroningRate] = useState(3.00);
  const [createJobPackingRate, setCreateJobPackingRate] = useState(2.50);
  const [editingJobOrder, setEditingJobOrder] = useState(null);

  // Garment Combo & Color Specifications States
  const [createJobComboType, setCreateJobComboType] = useState('2-Piece Combo (Top & Pant)');
  const [activeComboRateTab, setActiveComboRateTab] = useState(0);
  const [createJobCombos, setCreateJobCombos] = useState([
    { partName: 'Top', color: 'Navy Blue', pcsCount: 2500, powerTableRate: 12.00, cuttingRate: 3.50, singerRate: 8.50, overlockRate: 4.50, checkingRate: 2.00, threadRate: 1.50, ironingRate: 3.00, packingRate: 2.50 },
    { partName: 'Pant', color: 'Black', pcsCount: 2500, powerTableRate: 10.00, cuttingRate: 2.75, singerRate: 7.00, overlockRate: 4.00, checkingRate: 1.75, threadRate: 1.25, ironingRate: 2.50, packingRate: 2.00 }
  ]);

  const handleComboTypeChange = (type) => {
    setCreateJobComboType(type);
    setActiveComboRateTab(0);
    const defaultQty = parseInt(createJobOrderQty, 10) || 1250;
    let nextCombos = [];
    if (type === '2-Piece Combo (Top & Pant)') {
      nextCombos = [
        { partName: 'Top', color: 'Navy Blue', pcsCount: defaultQty, powerTableRate: 12.00, cuttingRate: 3.50, singerRate: 8.50, overlockRate: 4.50, checkingRate: 2.00, threadRate: 1.50, ironingRate: 3.00, packingRate: 2.50 },
        { partName: 'Pant', color: 'Black', pcsCount: defaultQty, powerTableRate: 10.00, cuttingRate: 2.75, singerRate: 7.00, overlockRate: 4.00, checkingRate: 1.75, threadRate: 1.25, ironingRate: 2.50, packingRate: 2.00 }
      ];
    } else if (type === 'Single Garment') {
      nextCombos = [
        { partName: 'Garment / Top', color: 'Royal Blue', pcsCount: defaultQty * 2, powerTableRate: 12.00, cuttingRate: 3.50, singerRate: 8.50, overlockRate: 4.50, checkingRate: 2.00, threadRate: 1.50, ironingRate: 3.00, packingRate: 2.50 }
      ];
    } else if (type === '3-Piece Set (Top, Pant, Dupatta)') {
      nextCombos = [
        { partName: 'Top', color: 'Crimson Red', pcsCount: defaultQty, powerTableRate: 12.00, cuttingRate: 3.50, singerRate: 8.50, overlockRate: 4.50, checkingRate: 2.00, threadRate: 1.50, ironingRate: 3.00, packingRate: 2.50 },
        { partName: 'Pant', color: 'Golden Yellow', pcsCount: defaultQty, powerTableRate: 10.00, cuttingRate: 2.75, singerRate: 7.00, overlockRate: 4.00, checkingRate: 1.75, threadRate: 1.25, ironingRate: 2.50, packingRate: 2.00 },
        { partName: 'Dupatta / Outer', color: 'Crimson Red', pcsCount: defaultQty, powerTableRate: 5.00, cuttingRate: 1.50, singerRate: 4.00, overlockRate: 2.00, checkingRate: 1.00, threadRate: 1.00, ironingRate: 1.50, packingRate: 1.00 }
      ];
    } else if (type === 'Custom Combo Set') {
      nextCombos = [
        { partName: 'Item 1', color: 'Multicolor', pcsCount: defaultQty, powerTableRate: 12.00, cuttingRate: 3.50, singerRate: 8.50, overlockRate: 4.50, checkingRate: 2.00, threadRate: 1.50, ironingRate: 3.00, packingRate: 2.50 }
      ];
    }
    setCreateJobCombos(nextCombos);
    const totalPcs = nextCombos.reduce((sum, c) => sum + (parseInt(c.pcsCount, 10) || 0), 0);
    setCreateJobOrderQty(totalPcs);
    if (!isShipmentQtyTouched) setCreateJobShipmentQty(totalPcs);
  };

  const handleAddComboPart = () => {
    const defaultQty = 620;
    setCreateJobCombos(prev => {
      const nextCombos = [...prev, { partName: `Part ${prev.length + 1}`, color: 'Navy Blue', pcsCount: defaultQty, powerTableRate: 12.00, cuttingRate: 3.50, singerRate: 8.50, overlockRate: 4.50, checkingRate: 2.00, threadRate: 1.50, ironingRate: 3.00, packingRate: 2.50 }];
      const totalPcs = nextCombos.reduce((sum, c) => sum + (parseInt(c.pcsCount, 10) || 0), 0);
      setCreateJobOrderQty(totalPcs);
      if (!isShipmentQtyTouched) setCreateJobShipmentQty(totalPcs);
      return nextCombos;
    });
  };

  const handleRemoveComboPart = (index) => {
    setCreateJobCombos(prev => {
      const nextCombos = prev.filter((_, i) => i !== index);
      const totalPcs = nextCombos.reduce((sum, c) => sum + (parseInt(c.pcsCount, 10) || 0), 0);
      setCreateJobOrderQty(totalPcs);
      if (!isShipmentQtyTouched) setCreateJobShipmentQty(totalPcs);
      return nextCombos;
    });
    setActiveComboRateTab(0);
  };

  const handleComboPartChange = (index, field, value) => {
    setCreateJobCombos(prev => {
      const nextCombos = prev.map((item, i) => i === index ? { ...item, [field]: value } : item);
      if (field === 'pcsCount') {
        const totalPcs = nextCombos.reduce((sum, c) => sum + (parseInt(c.pcsCount, 10) || 0), 0);
        setCreateJobOrderQty(totalPcs);
        if (!isShipmentQtyTouched) setCreateJobShipmentQty(totalPcs);
      }
      return nextCombos;
    });
  };

  const handleCopyRatesToAllCombos = (sourceComboIndex) => {
    const sourceCombo = createJobCombos[sourceComboIndex];
    if (!sourceCombo) return;

    setCreateJobCombos(prev => prev.map((item, idx) => {
      if (idx === sourceComboIndex) return item;
      return {
        ...item,
        powerTableRate: sourceCombo.powerTableRate,
        cuttingRate: sourceCombo.cuttingRate,
        singerRate: sourceCombo.singerRate,
        overlockRate: sourceCombo.overlockRate,
        checkingRate: sourceCombo.checkingRate,
        threadRate: sourceCombo.threadRate,
        ironingRate: sourceCombo.ironingRate,
        packingRate: sourceCombo.packingRate,
        customRates: (sourceCombo.customRates || []).map(r => ({ ...r }))
      };
    }));
  };

  const handleAddCustomRateToCombo = (comboIndex) => {
    setCreateJobCombos(prev => prev.map((item, i) => {
      if (i !== comboIndex) return item;
      const currentCustom = item.customRates || [];
      return {
        ...item,
        customRates: [...currentCustom, { name: `Custom Operation ${currentCustom.length + 1}`, val: 2.0 }]
      };
    }));
  };

  const handleRemoveCustomRateFromCombo = (comboIndex, rateIdx) => {
    setCreateJobCombos(prev => prev.map((item, i) => {
      if (i !== comboIndex) return item;
      return {
        ...item,
        customRates: (item.customRates || []).filter((_, rIdx) => rIdx !== rateIdx)
      };
    }));
  };

  const handleUpdateCustomRateInCombo = (comboIndex, rateIdx, field, val) => {
    setCreateJobCombos(prev => prev.map((item, i) => {
      if (i !== comboIndex) return item;
      return {
        ...item,
        customRates: (item.customRates || []).map((r, rIdx) => rIdx === rateIdx ? { ...r, [field]: val } : r)
      };
    }));
  };

  const openCreateJobModal = () => {
    setEditingJobOrder(null);
    setCreateJobOrderQty(2500);
    setCreateJobShipmentQty(2500);
    setIsShipmentQtyTouched(false);
    setCreateJobPowerTableRate(12.00);
    setCreateJobCuttingRate(3.50);
    setCreateJobSingerRate(8.50);
    setCreateJobOverlockRate(4.50);
    setCreateJobCheckingRate(2.00);
    setCreateJobThreadRate(1.50);
    setCreateJobIroningRate(3.00);
    setCreateJobPackingRate(2.50);
    setCreateJobComboType('2-Piece Combo (Top & Pant)');
    setActiveComboRateTab(0);
    setCreateJobCombos([
      { partName: 'Top', color: 'Navy Blue', pcsCount: 2500, powerTableRate: 12.00, cuttingRate: 3.50, singerRate: 8.50, overlockRate: 4.50, checkingRate: 2.00, threadRate: 1.50, ironingRate: 3.00, packingRate: 2.50 },
      { partName: 'Pant', color: 'Black', pcsCount: 2500, powerTableRate: 10.00, cuttingRate: 2.75, singerRate: 7.00, overlockRate: 4.00, checkingRate: 1.75, threadRate: 1.25, ironingRate: 2.50, packingRate: 2.00 }
    ]);
    setIsCreateJobModalOpen(true);
  };

  const openViewEditJobModal = (job) => {
    setEditingJobOrder(job);
    const initialQty = job.orderQty || job.quantity || 2500;
    setCreateJobOrderQty(initialQty);
    setCreateJobShipmentQty(job.shipmentQty || initialQty);
    setIsShipmentQtyTouched(true);
    setActiveComboRateTab(0);
    if (job.powerTableRate !== undefined) setCreateJobPowerTableRate(job.powerTableRate);
    if (job.cuttingRate !== undefined) setCreateJobCuttingRate(job.cuttingRate);
    if (job.singerRate !== undefined) setCreateJobSingerRate(job.singerRate);
    if (job.overlockRate !== undefined) setCreateJobOverlockRate(job.overlockRate);
    if (job.checkingRate !== undefined) setCreateJobCheckingRate(job.checkingRate);
    if (job.threadRate !== undefined) setCreateJobThreadRate(job.threadRate);
    if (job.ironingRate !== undefined) setCreateJobIroningRate(job.ironingRate);
    if (job.packingRate !== undefined) setCreateJobPackingRate(job.packingRate);
    if (job.comboType) setCreateJobComboType(job.comboType);
    if (job.combos && Array.isArray(job.combos)) {
      setCreateJobCombos(job.combos.map(c => ({
        ...c,
        pcsCount: c.pcsCount || initialQty,
        powerTableRate: c.powerTableRate !== undefined ? c.powerTableRate : 12.00,
        cuttingRate: c.cuttingRate !== undefined ? c.cuttingRate : 3.50,
        singerRate: c.singerRate !== undefined ? c.singerRate : 8.50,
        overlockRate: c.overlockRate !== undefined ? c.overlockRate : 4.50,
        checkingRate: c.checkingRate !== undefined ? c.checkingRate : 2.00,
        threadRate: c.threadRate !== undefined ? c.threadRate : 1.50,
        ironingRate: c.ironingRate !== undefined ? c.ironingRate : 3.00,
        packingRate: c.packingRate !== undefined ? c.packingRate : 2.50
      })));
    } else {
      setCreateJobComboType('2-Piece Combo (Top & Pant)');
      setCreateJobCombos([
        { partName: 'Top', color: 'Navy Blue', pcsCount: initialQty, powerTableRate: 12.00, cuttingRate: 3.50, singerRate: 8.50, overlockRate: 4.50, checkingRate: 2.00, threadRate: 1.50, ironingRate: 3.00, packingRate: 2.50 },
        { partName: 'Pant', color: 'Black', pcsCount: initialQty, powerTableRate: 10.00, cuttingRate: 2.75, singerRate: 7.00, overlockRate: 4.00, checkingRate: 1.75, threadRate: 1.25, ironingRate: 2.50, packingRate: 2.00 }
      ]);
    }
    setIsCreateJobModalOpen(true);
  };

  // --- Invoice creation state values ---
  const [billClient, setBillClient] = useState('');
  const [billNumber, setBillNumber] = useState('');
  const [billDate, setBillDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [billWithGst, setBillWithGst] = useState(true);
  const [billSubtotal, setBillSubtotal] = useState('');
  const [billShipmentQty, setBillShipmentQty] = useState('2500');
  const [billGstAmount, setBillGstAmount] = useState('');
  const [billDiscount, setBillDiscount] = useState('0');
  const [billGrandTotal, setBillGrandTotal] = useState('0');
  const [billAttachmentData, setBillAttachmentData] = useState(null);
  const [billAttachmentName, setBillAttachmentName] = useState('');
  const [billPaymentStatus, setBillPaymentStatus] = useState('Paid'); // 'Paid' (Payment Received) | 'Pending' (Payment Pending)

  const handleClientSelectForInvoice = (clientId) => {
    setBillClient(clientId);
    const clientObj = clients.find(c => c._id === clientId);
    if (!clientObj) return;

    // Search for matching job order in upcomingOrders
    const matchedJob = upcomingOrders.find(job => 
      job.clientName === clientObj.name || 
      (clientObj.companyName && job.clientName === clientObj.companyName) ||
      job.clientName?.toLowerCase() === clientObj.name?.toLowerCase()
    );

    if (matchedJob) {
      if (matchedJob.shipmentQty || matchedJob.quantity || matchedJob.orderQty) {
        setBillShipmentQty((matchedJob.shipmentQty || matchedJob.quantity || matchedJob.orderQty).toString());
      }
      if (matchedJob.estimatedValue > 0) {
        const subtotalVal = matchedJob.estimatedValue;
        setBillSubtotal(subtotalVal.toString());
        
        const gstVal = billWithGst ? Math.round(subtotalVal * 0.05) : 0;
        setBillGstAmount(gstVal.toString());
        setBillGrandTotal((subtotalVal + gstVal - (parseFloat(billDiscount) || 0)).toString());
      }
    }
  };
  const [selectedFabricId, setSelectedFabricId] = useState('');
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [customExpenseCategories, setCustomExpenseCategories] = useState([
    "Transportation (Auto)",
    "Petrol / Fuel",
    "Employee Salaries",
    "Materials & Fabrics",
    "Operations / Power",
    "Others / Overheads"
  ]);
  const [selectedExpenseCat, setSelectedExpenseCat] = useState("Transportation (Auto)");
  const [isCustomExpenseCatActive, setIsCustomExpenseCatActive] = useState(false);
  const [customExpenseCatInputVal, setCustomExpenseCatInputVal] = useState('');
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
    heading: '',
    subheading: '',
    itemName: '',
    impactType: '', // 'bill' | 'client' | 'employee' | 'fabric' | 'job' | 'expense' | 'database'
    impactAmount: '', // e.g. "- ₹45,000" or "- 1 Invoice"
    impactList: [],
    onConfirm: null
  });

  const requestDeleteConfirmation = ({
    heading = 'Are you sure you want to delete this?',
    subheading = 'This item will be permanently removed from your accounting software.',
    itemName = '',
    impactType = 'item',
    impactAmount = '',
    impactList = [],
    onConfirm
  }) => {
    setDeleteConfirmState({
      isOpen: true,
      heading,
      subheading,
      itemName,
      impactType,
      impactAmount,
      impactList,
      onConfirm
    });
  };

  const closeDeleteConfirmModal = () => {
    setDeleteConfirmState({
      isOpen: false,
      heading: '',
      subheading: '',
      itemName: '',
      impactType: '',
      impactAmount: '',
      impactList: [],
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
    const clientData = {
      name: document.getElementById('client-name').value.trim(),
      companyName: document.getElementById('client-company').value.trim(),
      email: document.getElementById('client-email').value.trim(),
      phone: document.getElementById('client-phone').value.trim(),
      gstin: document.getElementById('client-gstin').value.trim(),
      address: document.getElementById('client-address').value.trim()
    };

    if (editingClient) {
      const updatedClient = { ...editingClient, ...clientData };
      setLocalClients(prev => prev.map(c => c._id === editingClient._id ? updatedClient : c));
      try {
        await updateClientMutation({
          id: editingClient._id,
          ...clientData,
          createdAt: editingClient.createdAt
        });
      } catch (err) {
        console.warn("Convex update client fallback:", err);
      }
    } else {
      const newClient = { _id: 'client_' + Date.now(), ...clientData, createdAt: new Date().toISOString() };
      setLocalClients(prev => [newClient, ...prev]);
      try {
        await addClientMutation(clientData);
      } catch (err) {
        console.warn("Convex add client fallback:", err);
      }
    }
    closeClientModal();
  };

  const deleteClient = (id, clientObj) => {
    const clientName = typeof clientObj === 'object' ? clientObj.name : clientObj || '';
    
    requestDeleteConfirmation({
      heading: 'Are you sure you want to delete this client?',
      subheading: 'Deleting this buyer profile will remove them from your active client directory.',
      itemName: clientName || 'Client Account',
      impactType: 'client',
      impactAmount: '- 1 Client Profile',
      impactList: [
        '📁 Client profile removed from quick billing directory.',
        '📊 Existing historical invoices will remain saved for GST auditing.'
      ],
      onConfirm: async () => {
        setLocalClients(prev => prev.filter(c => c._id !== id));
        try {
          await deleteClientMutation({ id });
        } catch (err) {
          console.warn("Convex delete client fallback:", err);
        }
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
      return;
    }

    const parsedShipmentQty = parseInt(billShipmentQty, 10) || 2500;
    const billData = {
      clientId: billClient,
      billNumber,
      date: billDate,
      billType: billWithGst ? 'with-gst' : 'without-gst',
      shipmentQty: parsedShipmentQty,
      items: [{
        name: billWithGst ? "Fabric Stitching & Checking Summary" : "Fabric Production Services (Tax-exempt)",
        price: parseFloat(billSubtotal),
        qty: parsedShipmentQty,
        gstRate: billWithGst ? 5 : 0,
        gstAmount: parseFloat(billGstAmount) || 0,
        total: parseFloat(billGrandTotal)
      }],
      discount: parseFloat(billDiscount) || 0,
      subtotal: parseFloat(billSubtotal),
      totalGst: parseFloat(billGstAmount) || 0,
      totalAmount: parseFloat(billGrandTotal),
      paymentStatus: billPaymentStatus,
      status: billPaymentStatus,
      fileData: billAttachmentData || undefined,
      fileName: billAttachmentName || undefined
    };

    if (editingBill) {
      const updatedBill = { ...editingBill, ...billData };
      setLocalBills(prev => prev.map(b => b._id === editingBill._id ? updatedBill : b));
      try {
        await updateBillMutation({
          id: editingBill._id,
          ...billData,
          createdAt: editingBill.createdAt
        });
      } catch (err) {
        console.warn("Convex update bill fallback:", err);
      }
    } else {
      const newBill = { _id: 'bill_' + Date.now(), ...billData, createdAt: new Date().toISOString() };
      setLocalBills(prev => [newBill, ...prev]);
      try {
        await addBillMutation(billData);
      } catch (err) {
        console.warn("Convex add bill fallback:", err);
      }
    }
    closeBillModal();
  };

  const toggleBillPaymentStatus = async (bill) => {
    if (!bill) return;
    const currentStatus = bill.paymentStatus || bill.status || 'Pending';
    const newStatus = currentStatus === 'Paid' ? 'Pending' : 'Paid';

    setLocalBills(prev => prev.map(b => b._id === bill._id ? { ...b, paymentStatus: newStatus, status: newStatus } : b));
    if (viewingInvoice && viewingInvoice._id === bill._id) {
      setViewingInvoice(prev => ({ ...prev, paymentStatus: newStatus, status: newStatus }));
    }

    try {
      if (updateBillMutation) {
        await updateBillMutation({
          id: bill._id,
          clientId: bill.clientId,
          billNumber: bill.billNumber,
          date: bill.date,
          billType: bill.billType,
          items: bill.items,
          discount: bill.discount,
          subtotal: bill.subtotal,
          totalGst: bill.totalGst,
          totalAmount: bill.totalAmount,
          paymentStatus: newStatus,
          status: newStatus,
          shipmentQty: bill.shipmentQty,
          fileData: bill.fileData,
          fileName: bill.fileName,
          createdAt: bill.createdAt
        });
      }
    } catch (err) {
      console.warn("Convex status toggle fallback:", err);
    }

    setActivityAuditLogs(prev => [
      {
        id: Date.now(),
        user: "Billing Accountant",
        action: newStatus === 'Paid' ? "Payment Received" : "Payment Marked Pending",
        target: `Invoice #${bill.billNumber} (${formatCurrency(bill.totalAmount)})`,
        time: "Just now",
        icon: newStatus === 'Paid' ? "ph-check-circle" : "ph-clock-countdown",
        color: newStatus === 'Paid' ? "#10B981" : "#F59E0B"
      },
      ...prev
    ]);
  };

  const deleteBill = (id, billObj) => {
    const billNum = typeof billObj === 'object' ? billObj.billNumber : billObj || '';
    const amount = typeof billObj === 'object' ? formatCurrency(billObj.totalAmount) : '';
    
    requestDeleteConfirmation({
      heading: 'Are you sure you want to delete this invoice?',
      subheading: 'Deleting this invoice will permanently remove it from your accounting ledger and update your financial reports.',
      itemName: billNum ? `Invoice #${billNum}` : 'Invoice Record',
      impactType: 'bill',
      impactAmount: amount ? `- ${amount}` : '- 1 Invoice',
      impactList: [
        '📉 Dashboard Total Billing will decrease automatically.',
        '🧾 Invoice record will be removed from GSTR-1 Tax reports.',
        '👤 Client outstanding balance ledger will be updated.'
      ],
      onConfirm: async () => {
        setLocalBills(prev => prev.filter(b => b._id !== id));
        try {
          await deleteBillMutation({ id });
        } catch (err) {
          console.warn("Convex delete bill fallback:", err);
        }
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
    setBillShipmentQty((b.shipmentQty || b.items?.[0]?.qty || 2500).toString());
    setBillGstAmount(b.totalGst.toString());
    setBillDiscount(b.discount.toString());
    setBillGrandTotal(b.totalAmount.toString());
    setBillPaymentStatus(b.paymentStatus || b.status || 'Paid');
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
    setBillShipmentQty('2500');
    setBillGstAmount('');
    setBillDiscount('0');
    setBillGrandTotal('0');
    setBillPaymentStatus('Paid');
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
    
    let role = selectedStaffRole;
    const roleElem = document.getElementById('employee-role');
    const customRoleElem = document.getElementById('employee-custom-role-input');

    if (isCustomRoleActive || (roleElem && roleElem.value === 'ADD_CUSTOM')) {
      if (customRoleElem && customRoleElem.value.trim()) {
        role = customRoleElem.value.trim();
        if (!customStaffRoles.includes(role)) {
          setCustomStaffRoles(prev => [...prev, role]);
        }
      }
    } else if (roleElem && roleElem.value) {
      role = roleElem.value;
    }

    const subCategory = document.getElementById('employee-subcategory')?.value.trim() || '';
    const stitchRate = parseFloat(document.getElementById('employee-stitch-rate')?.value) || 0;
    const cuttingRate = parseFloat(document.getElementById('employee-cutting-rate')?.value) || 0;
    const singerRate = parseFloat(document.getElementById('employee-singer-rate')?.value) || 0;
    const overlockRate = parseFloat(document.getElementById('employee-overlock-rate')?.value) || 0;
    const salary = parseFloat(document.getElementById('employee-salary')?.value) || 0;

    const payload = {
      name, phone, role, subCategory, stitchRate, cuttingRate, singerRate, overlockRate, salary,
      customRates: customEmpRatesList
    };

    if (editingEmployee) {
      const updatedEmp = { ...editingEmployee, ...payload };
      setLocalEmployees(prev => prev.map(emp => emp._id === editingEmployee._id ? updatedEmp : emp));
      try {
        await updateEmployeeMutation({
          id: editingEmployee._id,
          ...payload,
          createdAt: editingEmployee.createdAt
        });
      } catch (err) {
        console.warn("Convex update emp fallback:", err);
      }
    } else {
      const newEmp = { _id: 'emp_' + Date.now(), ...payload, createdAt: new Date().toISOString() };
      setLocalEmployees(prev => [newEmp, ...prev]);
      try {
        await addEmployeeMutation(payload);
      } catch (err) {
        console.warn("Convex add emp fallback:", err);
      }
    }
    closeEmployeeModal();
  };

  const deleteEmployee = (id, empObj) => {
    const empTitle = typeof empObj === 'object' ? `${empObj.name} (${empObj.role})` : empObj || '';
    
    requestDeleteConfirmation({
      heading: 'Are you sure you want to delete this employee?',
      subheading: 'Deleting this staff record will remove them from directory & attendance records.',
      itemName: empTitle || 'Employee Record',
      impactType: 'employee',
      impactAmount: '- 1 Staff Member',
      impactList: [
        '👥 Total Staff count on Dashboard will minus 1 Employee.',
        '📅 Attendance logs & weekly payout history will be unlinked.'
      ],
      onConfirm: async () => {
        setLocalEmployees(prev => prev.filter(e => e._id !== id));
        try {
          await deleteEmployeeMutation({ id });
        } catch (err) {
          console.warn("Convex delete emp fallback:", err);
        }
      }
    });
  };

  const deleteAttendanceRecord = (record) => {
    if (!record) return;
    const empName = record.empName || 'Employee';
    const date = record.date || 'Attendance Log';

    requestDeleteConfirmation({
      heading: `Are you sure you want to delete attendance for ${empName}?`,
      subheading: `Deleting this shift attendance record (${date}) will remove it from daily logs and attendance reports.`,
      itemName: `${empName} - ${date}`,
      impactType: 'item',
      impactAmount: '- 1 Attendance Log',
      impactList: [
        '📅 Daily attendance log table will be updated.',
        '📊 Shift hour calculations will be recalculated.'
      ],
      onConfirm: async () => {
        const idToRemove = record._id || record.id;
        setLocalAttendance(prev => prev.filter(r => (r._id || r.id) !== idToRemove));
        try {
          if (deleteAttendanceMutation && record._id && !record._id.startsWith('att_')) {
            await deleteAttendanceMutation({ id: record._id });
          }
        } catch (err) {
          console.warn("Convex delete attendance fallback:", err);
        }
      }
    });
  };

  const openEditInvestment = (rec) => {
    setEditingInvestment(rec);
    setIsInvestmentModalOpen(true);
  };

  const deleteInvestmentRecord = (rec) => {
    if (!rec) return;
    const cat = rec.type || 'Capital Investment';
    const amountStr = formatCurrency(rec.amount || 0);

    requestDeleteConfirmation({
      heading: `Are you sure you want to delete this capital investment entry?`,
      subheading: `Deleting this entry (${cat}) will adjust your order investment ledger balance.`,
      itemName: `${cat} (${amountStr})`,
      impactType: 'item',
      impactAmount: `- ${amountStr}`,
      impactList: [
        '🏦 Order Investment Ledger total will decrease automatically.',
        '📊 Financial report capital balances will be updated.'
      ],
      onConfirm: async () => {
        const idToRemove = rec._id || rec.id;
        setInvestmentRecords(prev => prev.filter(r => (r._id || r.id) !== idToRemove));
        try {
          if (deleteInvestmentMutation && rec._id && !rec._id.startsWith('inv_')) {
            await deleteInvestmentMutation({ id: rec._id });
          }
        } catch (err) {
          console.warn("Convex delete investment fallback:", err);
        }
      }
    });
  };

  const openEditEmployee = (emp) => {
    setEditingEmployee(emp);
    setIsEmployeeModalOpen(true);
    if (emp.role && !customStaffRoles.includes(emp.role)) {
      setCustomStaffRoles(prev => [...prev, emp.role]);
    }
    setSelectedStaffRole(emp.role || 'Stitcher');
    setIsCustomRoleActive(false);
    if (emp.customRates) setCustomEmpRatesList(emp.customRates);
    setTimeout(() => {
      if (document.getElementById('employee-name')) document.getElementById('employee-name').value = emp.name;
      if (document.getElementById('employee-phone')) document.getElementById('employee-phone').value = emp.phone || '';
      if (document.getElementById('employee-role')) document.getElementById('employee-role').value = emp.role || 'Stitcher';
      if (document.getElementById('employee-subcategory')) document.getElementById('employee-subcategory').value = emp.subCategory || '';
      if (document.getElementById('employee-stitch-rate')) document.getElementById('employee-stitch-rate').value = emp.stitchRate || 12;
      if (document.getElementById('employee-cutting-rate')) document.getElementById('employee-cutting-rate').value = emp.cuttingRate || 3.5;
      if (document.getElementById('employee-singer-rate')) document.getElementById('employee-singer-rate').value = emp.singerRate || 8.5;
      if (document.getElementById('employee-overlock-rate')) document.getElementById('employee-overlock-rate').value = emp.overlockRate || 4.5;
      if (document.getElementById('employee-salary')) document.getElementById('employee-salary').value = emp.salary || 0;
    }, 50);
  };

  const closeEmployeeModal = () => {
    setIsEmployeeModalOpen(false);
    setEditingEmployee(null);
    setIsCustomRoleActive(false);
    setCustomRoleInputVal("");
  };

  // Fabric Rolls CRUD
  const handleFabricSubmit = async (e) => {
    e.preventDefault();
    const fabricData = {
      fabricType: document.getElementById('fabric-type').value.trim(),
      quantityReceived: parseFloat(document.getElementById('fabric-qty').value) || 0,
      color: document.getElementById('fabric-color').value.trim(),
      receivedDate: document.getElementById('fabric-date').value,
      supplier: document.getElementById('fabric-supplier').value.trim(),
      status: document.getElementById('fabric-status').value
    };

    if (editingFabric) {
      const updatedFab = { ...editingFabric, ...fabricData };
      setLocalFabrics(prev => prev.map(f => f._id === editingFabric._id ? updatedFab : f));
      try {
        await updateFabricMutation({
          id: editingFabric._id,
          ...fabricData,
          createdAt: editingFabric.createdAt
        });
      } catch (err) {
        console.warn("Convex update fabric fallback:", err);
      }
    } else {
      const newFab = { _id: 'fab_' + Date.now(), ...fabricData, createdAt: new Date().toISOString() };
      setLocalFabrics(prev => [newFab, ...prev]);
      try {
        await addFabricMutation(fabricData);
      } catch (err) {
        console.warn("Convex add fabric fallback:", err);
      }
    }
    closeFabricModal();
  };

  const deleteFabric = (id, fabricObj) => {
    const rollNum = typeof fabricObj === 'object' ? `${fabricObj.fabricType} (${fabricObj.quantityReceived} Mtrs)` : fabricObj || '';
    const meters = typeof fabricObj === 'object' ? `${fabricObj.quantityReceived} Mtrs` : '';
    
    requestDeleteConfirmation({
      heading: 'Are you sure you want to delete this fabric roll?',
      subheading: 'Deleting this roll will remove it from warehouse stock and fabric consumption tracking.',
      itemName: rollNum || 'Fabric Stock Roll',
      impactType: 'fabric',
      impactAmount: meters ? `- ${meters}` : '- 1 Stock Roll',
      impactList: [
        '📉 Available Fabric Stock on Dashboard will minus this quantity.',
        '📦 Warehouse roll inventory ledger will be updated.'
      ],
      onConfirm: async () => {
        setLocalFabrics(prev => prev.filter(f => f._id !== id));
        try {
          await deleteFabricMutation({ id });
        } catch (err) {
          console.warn("Convex delete fabric fallback:", err);
        }
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
      } else {
        await addCeoActivityMutation({ date, focusArea, hoursSpent, productivityLevel, description, isCritical });
      }
      closeCeoModal();
    } catch (err) {
      console.error("Error saving CEO log:", err);
    }
  };

  const deleteCeoActivity = (id, logObj) => {
    const title = typeof logObj === 'object' ? logObj.focusArea : logObj || '';
    
    requestDeleteConfirmation({
      heading: 'Are you sure you want to delete this log entry?',
      subheading: 'Deleting this accomplishment log will remove it from your management history.',
      itemName: title || 'Accomplishment Log',
      impactType: 'item',
      impactAmount: '- 1 Log Entry',
      impactList: [
        '📊 Operational summary log hours will be updated.'
      ],
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
    const dateInput = document.getElementById('expense-date');
    const date = dateInput ? dateInput.value : new Date().toISOString().split('T')[0];
    
    let category = selectedExpenseCat;
    if (isCustomExpenseCatActive || category === 'ADD_CUSTOM') {
      const customInput = document.getElementById('expense-custom-category-input');
      if (customInput && customInput.value.trim()) {
        category = customInput.value.trim();
        if (!customExpenseCategories.includes(category)) {
          setCustomExpenseCategories(prev => [...prev, category]);
        }
      }
    }

    const expenseData = {
      date,
      category,
      amount: parseFloat(document.getElementById('expense-amount').value) || 0,
      description: document.getElementById('expense-desc').value.trim(),
      billId: document.getElementById('expense-bill-id').value || undefined
    };

    if (editingExpense) {
      const updatedExp = { ...editingExpense, ...expenseData };
      setLocalExpenses(prev => prev.map(exp => exp._id === editingExpense._id ? updatedExp : exp));
      try {
        await updateExpenseMutation({
          id: editingExpense._id,
          ...expenseData,
          createdAt: editingExpense.createdAt
        });
      } catch (err) {
        console.warn("Convex update expense fallback:", err);
      }
    } else {
      const newExp = { _id: 'exp_' + Date.now(), ...expenseData, createdAt: new Date().toISOString() };
      setLocalExpenses(prev => [newExp, ...prev]);
      try {
        await addExpenseMutation(expenseData);
      } catch (err) {
        console.warn("Convex add expense fallback:", err);
      }
    }
    closeExpenseModal();
  };

  const deleteExpense = (id, expObj) => {
    const cat = typeof expObj === 'object' ? expObj.category : expObj || '';
    const amount = typeof expObj === 'object' ? formatCurrency(expObj.amount) : '';
    
    requestDeleteConfirmation({
      heading: 'Are you sure you want to delete this expense record?',
      subheading: 'Deleting this cost entry will recalculate your operational expenses and profit margin analysis.',
      itemName: cat ? `${cat} Expense` : 'Expense Entry',
      impactType: 'expense',
      impactAmount: amount ? `- ${amount}` : '- 1 Expense Log',
      impactList: [
        '📈 Dashboard Total Overhead Expenses will minus this amount.',
        '📊 Net Profit Margin calculation will automatically recalculate.'
      ],
      onConfirm: async () => {
        setLocalExpenses(prev => prev.filter(e => e._id !== id));
        try {
          await deleteExpenseMutation({ id });
        } catch (err) {
          console.warn("Convex delete expense fallback:", err);
        }
      }
    });
  };

  const openEditExpense = (exp) => {
    setEditingExpense(exp);
    setIsExpenseModalOpen(true);
    if (!customExpenseCategories.includes(exp.category)) {
      setCustomExpenseCategories(prev => [...prev, exp.category]);
    }
    setSelectedExpenseCat(exp.category);
    setIsCustomExpenseCatActive(false);
    setTimeout(() => {
      if (document.getElementById('expense-date')) document.getElementById('expense-date').value = exp.date;
      if (document.getElementById('expense-amount')) document.getElementById('expense-amount').value = exp.amount;
      if (document.getElementById('expense-desc')) document.getElementById('expense-desc').value = exp.description;
      if (document.getElementById('expense-bill-id')) document.getElementById('expense-bill-id').value = exp.billId || "";
    }, 50);
  };

  const closeExpenseModal = () => {
    setIsExpenseModalOpen(false);
    setEditingExpense(null);
    setIsCustomExpenseCatActive(false);
    setCustomExpenseCatInputVal('');
  };

  // Upcoming Orders CRUD
  const handleUpcomingOrderSubmit = async (e) => {
    e.preventDefault();
    const clientName = document.getElementById('up-client-name').value.trim();
    const matchingClient = clients.find(c => c.name.toLowerCase() === clientName.toLowerCase());
    
    const orderData = {
      clientId: matchingClient ? matchingClient._id : undefined,
      clientName: clientName,
      orderTitle: document.getElementById('up-order-title').value.trim(),
      deliveryDate: document.getElementById('up-delivery-date').value,
      estimatedValue: parseFloat(document.getElementById('up-val').value) || 0,
      status: document.getElementById('up-status').value,
      notes: document.getElementById('up-notes').value.trim()
    };

    if (editingUpcomingOrder) {
      const updatedJob = { ...editingUpcomingOrder, ...orderData };
      setCustomLocalJobs(prev => prev.map(j => j._id === editingUpcomingOrder._id ? updatedJob : j));
      try {
        await updateUpcomingOrderMutation({
          id: editingUpcomingOrder._id,
          ...orderData,
          createdAt: editingUpcomingOrder.createdAt
        });
      } catch (err) {
        console.warn("Convex update order fallback:", err);
      }
    } else {
      const newJob = { _id: 'job_' + Date.now(), ...orderData, createdAt: new Date().toISOString() };
      setCustomLocalJobs(prev => [newJob, ...prev]);
      try {
        await addUpcomingOrderMutation(orderData);
      } catch (err) {
        console.warn("Convex add order fallback:", err);
      }
    }
    closeUpcomingOrderModal();
  };

  const deleteUpcomingOrder = (id, orderObj) => {
    const title = typeof orderObj === 'object' ? orderObj.orderTitle : orderObj || '';
    
    requestDeleteConfirmation({
      heading: 'Are you sure you want to cancel and delete this job order?',
      subheading: 'Deleting this order will remove it permanently from Kanban columns, progress sprints, and reports.',
      itemName: title || 'Production Job Order',
      impactType: 'job',
      impactAmount: '- 1 Production Job',
      impactList: [
        '📉 Active Production Jobs count on Kanban board will minus 1 Job.',
        '✂️ Fabric roll allocations and piece-rate assignments will be cleared.'
      ],
      onConfirm: async () => {
        setCustomLocalJobs(prev => prev.filter(j => j._id !== id));
        try {
          await deleteUpcomingOrderMutation({ id });
        } catch (err) {}
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

  const deleteStitching = (id, jobObj) => {
    const jobTitle = typeof jobObj === 'object' ? `${jobObj.piecesStitched} Pcs Assembly` : jobObj || '';
    
    requestDeleteConfirmation({
      heading: 'Are you sure you want to delete this production job?',
      subheading: 'Deleting this stitching assignment will remove it from active floor work orders.',
      itemName: jobTitle || 'Production Job',
      impactType: 'job',
      impactAmount: '- 1 Active Job',
      impactList: [
        '📉 Active Production Jobs on Dashboard will minus 1 Job.',
        '🧵 Fabric roll allocation and piece-rate payout will be updated.'
      ],
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
          <button className={`nav-item ${activeTab === 'clients' ? 'active' : ''}`} onClick={() => handleTabChange('clients')}>
            <i className="ph ph-users-three"></i>
            <span>Clients</span>
          </button>
          <button className={`nav-item ${activeTab === 'jobs' ? 'active' : ''}`} onClick={() => handleTabChange('jobs')}>
            <i className="ph ph-briefcase"></i>
            <span>Jobs</span>
          </button>
          <button className={`nav-item ${activeTab === 'employees' ? 'active' : ''}`} onClick={() => handleTabChange('employees')}>
            <i className="ph ph-user-list"></i>
            <span>Employees</span>
          </button>
          <button className={`nav-item ${activeTab === 'bills' ? 'active' : ''}`} onClick={() => handleTabChange('bills')}>
            <i className="ph ph-receipt"></i>
            <span>Invoice</span>
          </button>

          <div style={{ fontSize: '11px', fontWeight: 600, color: '#8C8D96', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '14px 8px 4px 8px' }}>
            Operations & Financials ▾
          </div>
          <button className={`nav-item ${activeTab === 'expenses' ? 'active' : ''}`} onClick={() => handleTabChange('expenses')}>
            <i className="ph ph-coins"></i>
            <span>Capital & Investment</span>
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

        {/* Linear Top Bar Header */}
        <header className="linear-top-header">
          <div className="linear-header-left">
            <button className="linear-cmd-launcher" onClick={() => setIsCmdPaletteOpen(true)}>
              <i className="ph ph-magnifying-glass"></i>
              <span>Search commands or jump to...</span>
              <kbd className="linear-kbd" style={{ marginLeft: 'auto' }}>⌘K</kbd>
            </button>
          </div>

          <div className="linear-header-right">
          </div>
        </header>

        {/* ==================== DASHBOARD VIEW (Textile ERP System) ==================== */}
        {activeTab === 'dashboard' && (() => {
          // Live Dynamic Metrics computed across all app collections
          const totalInvoicedRevenue = bills.reduce((sum, b) => sum + (parseFloat(b.totalAmount) || parseFloat(b.grandTotal) || parseFloat(b.subtotal) || 0), 0);
          const pendingInvoices = bills.filter(b => b.paymentStatus !== 'Paid' && b.status !== 'Paid');
          const totalPendingAmount = pendingInvoices.reduce((sum, b) => sum + (parseFloat(b.totalAmount) || parseFloat(b.grandTotal) || parseFloat(b.subtotal) || 0), 0);
          const paidInvoices = bills.filter(b => b.paymentStatus === 'Paid' || b.status === 'Paid');
          const totalPaidAmount = paidInvoices.reduce((sum, b) => sum + (parseFloat(b.totalAmount) || parseFloat(b.grandTotal) || parseFloat(b.subtotal) || 0), 0);

          const totalExpensesSum = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
          const totalCapitalSourced = investmentRecords.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);

          const lowStockFabrics = fabrics.filter(f => (parseFloat(f.quantityReceived) || 0) < 500 || f.status === 'Low Stock');
          const totalFabricMeters = fabrics.reduce((sum, f) => sum + (parseFloat(f.quantityReceived) || 0), 0);

          const totalJobsCount = upcomingOrders.length;
          const activeJobsList = upcomingOrders.filter(o => o.status === 'In Production' || o.status === 'In Progress' || o.stage !== 'Completed');
          const completedJobsList = upcomingOrders.filter(o => o.status === 'Delivered' || o.status === 'Completed' || o.stage === 'Completed');
          const pendingJobsList = upcomingOrders.filter(o => o.status === 'Pending' || o.stage === 'Backlog & Cutting');

          const totalEmployeesCount = employees.length;
          const totalClientsCount = clients.length;

          const collectionRate = totalInvoicedRevenue > 0 ? Math.round((totalPaidAmount / totalInvoicedRevenue) * 100) : 100;
          const profitMarginVal = totalInvoicedRevenue - totalExpensesSum;

          // Compute Client Revenue Share
          const clientRevMap = {};
          clients.forEach(c => { if (c.name) clientRevMap[c.name] = 0; });
          bills.forEach(b => {
            const cName = b.clientName || b.client;
            if (cName) clientRevMap[cName] = (clientRevMap[cName] || 0) + (parseFloat(b.totalAmount) || 0);
          });
          upcomingOrders.forEach(j => {
            if (j.clientName && (!clientRevMap[j.clientName] || clientRevMap[j.clientName] === 0)) {
              clientRevMap[j.clientName] = j.estimatedValue || 0;
            }
          });

          const clientRevList = Object.entries(clientRevMap).map(([name, val]) => ({ name, val }));
          const totalClientRevSum = clientRevList.reduce((s, c) => s + c.val, 0) || 1;

          return (
            <>
              <section id="dashboard-view" className="tab-view active" style={{ padding: '0 4px 40px 4px' }}>
                
                {/* ==================== 1. TOP NAVIGATION HEADER ==================== */}
                <div style={{
                  display: 'flex',
                  justify: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px',
                  marginBottom: '24px',
                  padding: '16px 20px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                }}>
                  {/* Left: Welcome & Business Switcher */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      backgroundColor: '#EEF2FF',
                      color: '#4F46E5',
                      display: 'flex',
                      alignItems: 'center',
                      justify: 'center',
                      fontSize: '22px',
                      fontWeight: 800
                    }}>
                      🏢
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px', fontWeight: 800, color: '#111827' }}>Welcome back, Vikashini B.</span>
                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', backgroundColor: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' }}>
                          LIVE ONLINE
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{activeCompany.name}</span>
                        <span>•</span>
                        <span style={{ color: '#4F46E5', fontWeight: 600 }}>📍 {activeCompany.branch} ({activeCompany.city})</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Empty */}
                </div>

                {/* ==================== 2. HERO KPI SECTION (4 Cards Grid) ==================== */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                  
                  {/* KPI 1: Today's Sales */}
                  <div style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '14px',
                    border: '1px solid #E5E7EB',
                    padding: '20px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                    transition: 'all 0.2s ease'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#6B7280' }}>Today's Sales</span>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                        <i className="ph ph-trend-up"></i>
                      </div>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>
                      {formatCurrency(Math.round(totalInvoicedRevenue / 28 || 185000))}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                      <span style={{ color: '#10B981', fontWeight: 700, backgroundColor: '#ECFDF5', padding: '2px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                        <i className="ph ph-arrow-up-right"></i> +12.4%
                      </span>
                      <span style={{ color: '#9CA3AF' }}>vs yesterday</span>
                    </div>
                  </div>

                  {/* KPI 2: Monthly Revenue */}
                  <div onClick={() => setActiveTab('bills')} style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '14px',
                    border: '1px solid #E5E7EB',
                    padding: '20px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#6B7280' }}>Monthly Revenue</span>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                        <i className="ph ph-receipt"></i>
                      </div>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>
                      {formatCurrency(totalInvoicedRevenue)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                      <span style={{ color: '#4F46E5', fontWeight: 700, backgroundColor: '#EEF2FF', padding: '2px 8px', borderRadius: '6px' }}>
                        +18.6% vs last month
                      </span>
                      <span style={{ color: '#9CA3AF' }}>({bills.length} Bills)</span>
                    </div>
                  </div>

                  {/* KPI 3: Pending Payments */}
                  <div onClick={() => setActiveTab('bills')} style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '14px',
                    border: '1px solid #E5E7EB',
                    padding: '20px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#6B7280' }}>Pending Payments</span>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                        <i className="ph ph-clock-countdown"></i>
                      </div>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>
                      {formatCurrency(totalPendingAmount)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                      <span style={{ color: '#D97706', fontWeight: 700, backgroundColor: '#FEF3C7', padding: '2px 8px', borderRadius: '6px' }}>
                        {pendingInvoices.length} Unpaid Invoices
                      </span>
                      <span style={{ color: '#9CA3AF' }}>Overdue</span>
                    </div>
                  </div>

                </div>

                {/* ==================== 3. MAIN CONTENT SPLIT (70% LEFT / 30% RIGHT SIDEBAR) ==================== */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', alignItems: 'start' }}>
                  
                  {/* LEFT COLUMN (70%) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    {/* 1. Revenue Analytics Section */}
                    <div style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '16px',
                      border: '1px solid #E5E7EB',
                      padding: '24px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#111827' }}>Revenue Analytics & Financial Growth</h3>
                          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6B7280' }}>Real-time line chart tracking revenue, expenses, and net margins.</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#F3F4F6', padding: '4px', borderRadius: '10px' }}>
                          <button 
                            type="button" 
                            onClick={() => setBillingTrendRange('this-month')} 
                            style={{
                              padding: '6px 14px',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: 700,
                              border: 'none',
                              backgroundColor: billingTrendRange === 'this-month' ? '#FFFFFF' : 'transparent',
                              color: billingTrendRange === 'this-month' ? '#4F46E5' : '#4B5563',
                              boxShadow: billingTrendRange === 'this-month' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                              cursor: 'pointer'
                            }}
                          >
                            Daily
                          </button>
                          <button 
                            type="button" 
                            onClick={() => setBillingTrendRange('last-month')} 
                            style={{
                              padding: '6px 14px',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: 700,
                              border: 'none',
                              backgroundColor: billingTrendRange === 'last-month' ? '#FFFFFF' : 'transparent',
                              color: billingTrendRange === 'last-month' ? '#4F46E5' : '#4B5563',
                              boxShadow: billingTrendRange === 'last-month' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                              cursor: 'pointer'
                            }}
                          >
                            Weekly
                          </button>
                          <button 
                            type="button" 
                            onClick={() => setBillingTrendRange('q3')} 
                            style={{
                              padding: '6px 14px',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: 700,
                              border: 'none',
                              backgroundColor: billingTrendRange === 'q3' ? '#FFFFFF' : 'transparent',
                              color: billingTrendRange === 'q3' ? '#4F46E5' : '#4B5563',
                              boxShadow: billingTrendRange === 'q3' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                              cursor: 'pointer'
                            }}
                          >
                            Monthly
                          </button>
                        </div>
                      </div>

                      {/* Quick Metrics Badges Bar */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px', padding: '14px', backgroundColor: '#F9FAFB', borderRadius: '12px', border: '1px solid #F3F4F6' }}>
                        <div>
                          <span style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '2px' }}>Total Invoiced Revenue</span>
                          <span style={{ fontSize: '16px', fontWeight: 800, color: '#4F46E5', fontFamily: 'var(--font-mono)' }}>{formatCurrency(totalInvoicedRevenue)}</span>
                        </div>
                        <div>
                          <span style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '2px' }}>Operational Expenses</span>
                          <span style={{ fontSize: '16px', fontWeight: 800, color: '#EF4444', fontFamily: 'var(--font-mono)' }}>{formatCurrency(totalExpensesSum)}</span>
                        </div>
                        <div>
                          <span style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '2px' }}>Net Profit Margin</span>
                          <span style={{ fontSize: '16px', fontWeight: 800, color: '#10B981', fontFamily: 'var(--font-mono)' }}>{formatCurrency(profitMarginVal)}</span>
                        </div>
                      </div>

                      {/* Canvas Line Chart */}
                      <div style={{ width: '100%', height: '240px', position: 'relative' }}>
                        <canvas ref={chartCanvasRef}></canvas>
                      </div>
                    </div>

                    {/* 2. Sales & Buyer Performance Overview */}
                    <div style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '16px',
                      border: '1px solid #E5E7EB',
                      padding: '24px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                    }}>
                      <div style={{ marginBottom: '16px' }}>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#111827' }}>Sales Overview & Top Buyer Performance</h3>
                        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6B7280' }}>Revenue distribution across registered corporate clients & buyers.</p>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        {clientRevList.slice(0, 4).map((c, idx) => {
                          const percent = Math.min(100, Math.round((c.val / totalClientRevSum) * 100)) || 25;
                          const palette = ['#4F46E5', '#10B981', '#F59E0B', '#6366F1'];
                          return (
                            <div key={idx} onClick={() => setActiveTab('clients')} style={{ backgroundColor: '#F9FAFB', padding: '14px 16px', borderRadius: '12px', border: '1px solid #F3F4F6', cursor: 'pointer' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <span style={{ fontWeight: 700, fontSize: '14px', color: '#111827' }}>{c.name}</span>
                                <span style={{ fontSize: '13px', fontWeight: 800, color: palette[idx % palette.length], fontFamily: 'var(--font-mono)' }}>
                                  {c.val > 0 ? formatCurrency(c.val) : 'Active Buyer'}
                                </span>
                              </div>
                              <div style={{ height: '8px', width: '100%', backgroundColor: '#E5E7EB', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ width: `${percent}%`, height: '100%', backgroundColor: palette[idx % palette.length], borderRadius: '4px' }}></div>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#6B7280', marginTop: '6px' }}>
                                <span>Share of Total Billing</span>
                                <span style={{ fontWeight: 700 }}>{percent}%</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>

                  {/* RIGHT SIDEBAR (30%) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    {/* 1. Quick Actions Card */}
                    <div style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '16px',
                      border: '1px solid #E5E7EB',
                      padding: '20px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                    }}>
                      <h4 style={{ margin: '0 0 14px 0', fontSize: '15px', fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <i className="ph ph-lightning" style={{ color: '#4F46E5' }}></i> Quick Actions
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <button onClick={() => { setEditingBill(null); setIsBillModalOpen(true); }} style={{ padding: '12px 10px', borderRadius: '10px', border: '1px solid #E5E7EB', backgroundColor: '#FAFAFC', color: '#111827', fontSize: '12.5px', fontWeight: 700, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: 'all 0.15s ease' }}>
                          <i className="ph ph-receipt" style={{ fontSize: '20px', color: '#4F46E5' }}></i>
                          <span>+ New Invoice</span>
                        </button>
                        <button onClick={() => { setEditingClient(null); setIsClientModalOpen(true); }} style={{ padding: '12px 10px', borderRadius: '10px', border: '1px solid #E5E7EB', backgroundColor: '#FAFAFC', color: '#111827', fontSize: '12.5px', fontWeight: 700, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: 'all 0.15s ease' }}>
                          <i className="ph ph-user-plus" style={{ fontSize: '20px', color: '#10B981' }}></i>
                          <span>+ Add Customer</span>
                        </button>
                        <button onClick={() => { setEditingFabric(null); setIsFabricModalOpen(true); }} style={{ padding: '12px 10px', borderRadius: '10px', border: '1px solid #E5E7EB', backgroundColor: '#FAFAFC', color: '#111827', fontSize: '12.5px', fontWeight: 700, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: 'all 0.15s ease' }}>
                          <i className="ph ph-package" style={{ fontSize: '20px', color: '#9333EA' }}></i>
                          <span>+ Purchase / Fabric</span>
                        </button>
                        <button onClick={openCreateJobModal} style={{ padding: '12px 10px', borderRadius: '10px', border: '1px solid #E5E7EB', backgroundColor: '#FAFAFC', color: '#111827', fontSize: '12.5px', fontWeight: 700, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: 'all 0.15s ease' }}>
                          <i className="ph ph-gear-six" style={{ fontSize: '20px', color: '#F59E0B' }}></i>
                          <span>+ Add Product Job</span>
                        </button>
                        <button onClick={() => { setEditingExpense(null); setIsExpenseModalOpen(true); }} style={{ padding: '12px 10px', borderRadius: '10px', border: '1px solid #E5E7EB', backgroundColor: '#FAFAFC', color: '#111827', fontSize: '12.5px', fontWeight: 700, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: 'all 0.15s ease' }}>
                          <i className="ph ph-wallet" style={{ fontSize: '20px', color: '#EF4444' }}></i>
                          <span>+ Record Expense</span>
                        </button>
                        <button onClick={() => setIsInvestmentModalOpen(true)} style={{ padding: '12px 10px', borderRadius: '10px', border: '1px solid #E5E7EB', backgroundColor: '#FAFAFC', color: '#111827', fontSize: '12.5px', fontWeight: 700, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: 'all 0.15s ease' }}>
                          <i className="ph ph-bank" style={{ fontSize: '20px', color: '#2563EB' }}></i>
                          <span>+ Log Capital</span>
                        </button>
                      </div>
                    </div>

                    {/* 2. Outstanding Payments Card */}
                    <div style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '16px',
                      border: '1px solid #E5E7EB',
                      padding: '20px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                    }}>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <i className="ph ph-clock-countdown" style={{ color: '#D97706' }}></i> Outstanding Payments
                      </h4>
                      <div style={{ backgroundColor: '#FEF3C7', padding: '14px', borderRadius: '12px', border: '1px solid #FDE68A', marginBottom: '12px' }}>
                        <div style={{ fontSize: '12px', color: '#B45309', fontWeight: 700, textTransform: 'uppercase' }}>Total Uncollected Receivables</div>
                        <div style={{ fontSize: '22px', fontWeight: 800, color: '#92400E', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                          {formatCurrency(totalPendingAmount)}
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: '#4B5563', padding: '6px 0', borderBottom: '1px solid #F3F4F6' }}>
                        <span>Due Today</span>
                        <strong style={{ color: '#111827' }}>{formatCurrency(Math.round(totalPendingAmount * 0.4))}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: '#4B5563', padding: '6px 0' }}>
                        <span>Overdue (30+ Days)</span>
                        <strong style={{ color: '#EF4444' }}>{formatCurrency(Math.round(totalPendingAmount * 0.6))}</strong>
                      </div>
                    </div>

                  </div>

                </div>

                {/* ==================== FULL WIDTH RECENT TAX INVOICES TABLE ==================== */}
                <div style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid #E5E7EB',
                  padding: '24px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  marginTop: '24px',
                  width: '100%'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#111827' }}>Recent Tax Invoices & Sales Billing</h3>
                      <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6B7280' }}>Latest GST billing entries and quick payment settlement actions.</p>
                    </div>
                    <button className="btn btn-primary btn-sm" style={{ padding: '8px 16px', borderRadius: '10px', fontWeight: 700 }} onClick={() => { setEditingBill(null); setIsBillModalOpen(true); }}>
                      <i className="ph ph-plus"></i> New Invoice
                    </button>
                  </div>

                  <div className="table-responsive" style={{ width: '100%' }}>
                    <table className="data-table" style={{ width: '100%' }}>
                      <thead>
                        <tr>
                          <th>Invoice No</th>
                          <th>Customer Name</th>
                          <th>Date</th>
                          <th className="text-right">Shipment Qty</th>
                          <th className="text-right">Grand Total (₹)</th>
                          <th className="text-center">Status</th>
                          <th className="text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bills.slice(0, 5).map(b => {
                          const c = clients.find(cl => cl._id === b.clientId);
                          const isPaid = (b.paymentStatus === 'Paid' || b.status === 'Paid');
                          return (
                            <tr key={b._id}>
                              <td className="font-semibold text-primary">{b.billNumber}</td>
                              <td className="font-medium">{c ? c.name : 'Corporate Client'}</td>
                              <td className="text-muted">{formatDate(b.date)}</td>
                              <td className="text-right font-medium">{(b.shipmentQty || b.items?.[0]?.qty || 2500).toLocaleString()} Pcs</td>
                              <td className="text-right font-bold text-green" style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(b.totalAmount)}</td>
                              <td className="text-center">
                                <span 
                                  onClick={() => toggleBillPaymentStatus(b)} 
                                  style={{ 
                                    padding: '4px 10px', 
                                    borderRadius: '12px', 
                                    fontSize: '11px', 
                                    fontWeight: 700, 
                                    cursor: 'pointer',
                                    backgroundColor: isPaid ? '#ECFDF5' : '#FEF3C7',
                                    color: isPaid ? '#059669' : '#D97706',
                                    border: isPaid ? '1px solid #A7F3D0' : '1px solid #FDE68A'
                                  }}
                                >
                                  {isPaid ? '✓ Paid' : '⏳ Pending'}
                                </span>
                              </td>
                              <td className="text-right" onClick={(e) => e.stopPropagation()}>
                                <button className="btn btn-secondary btn-sm" onClick={() => { setViewingInvoice(b); setIsInvoiceViewOpen(true); }} style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '8px' }}>
                                  <i className="ph ph-eye"></i> View
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        {bills.length === 0 && (
                          <tr>
                            <td colSpan="7" className="text-center text-muted" style={{ padding: '24px' }}>
                              No invoices generated yet. Click "+ New Invoice" to record sales billing.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Floating Chatbot Widget on Home Screen */}

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
              </section>
            </>
          );
        })()}

        {/* ==================== JOBS VIEW ==================== */}
        {activeTab === 'jobs' && (
          <section id="jobs-view" className="tab-view active">
            <header className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
              <div>
                <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 800 }}>Jobs & Production Orders</h1>
                <p className="subtitle" style={{ margin: '4px 0 0 0', color: 'var(--color-text-secondary)' }}>Track export manufacturing jobs, daily progress, staff assignments, and delays.</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button 
                  className="btn btn-primary" 
                  onClick={openCreateJobModal}
                  style={{ padding: '10px 20px', fontSize: '13.5px', fontWeight: 800, borderRadius: '12px', boxShadow: '0 4px 14px rgba(94, 106, 210, 0.35)', display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                >
                  <i className="ph ph-plus-circle" style={{ fontSize: '18px' }}></i> Create New Job Order
                </button>
              </div>
            </header>

            {jobsViewMode === 'board' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Weekly Production Cycle Sprint Card */}

                {/* Weekly Production Cycle Sprint Card */}
                {(() => {
                  const filteredJobs = upcomingOrders.filter(o => {
                    const matchesSearch = !kanbanSearchQuery || 
                      (o.orderTitle && o.orderTitle.toLowerCase().includes(kanbanSearchQuery.toLowerCase())) ||
                      (o.clientName && o.clientName.toLowerCase().includes(kanbanSearchQuery.toLowerCase())) ||
                      (o.product && o.product.toLowerCase().includes(kanbanSearchQuery.toLowerCase()));
                    const matchesPriority = kanbanPriorityFilter === 'All' || o.priority === kanbanPriorityFilter;
                    return matchesSearch && matchesPriority;
                  });

                  // Calculate Weighted Completion Progress %
                  const totalCount = filteredJobs.length;
                  const completedCount = filteredJobs.filter(o => o.stage === 'Completed / Delivered' || o.status === 'Delivered').length;
                  const packedCount = filteredJobs.filter(o => o.stage === 'Packing & Ready' || o.status === 'Ready').length;
                  const qcCount = filteredJobs.filter(o => o.stage === 'QC Inspection' || o.status === 'QC Inspection').length;
                  const stitchingCount = filteredJobs.filter(o => o.stage === 'Stitching Assembly' || o.status === 'In Production').length;
                  
                  const progressPct = totalCount > 0 
                    ? Math.round(((completedCount * 1.0 + packedCount * 0.8 + qcCount * 0.6 + stitchingCount * 0.4) / totalCount) * 100)
                    : 0;

                  return (
                    <div className="cycle-progress-card">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', width: '100%' }}>
                        
                        {/* Left Side: Target Icon + Title + Velocity Badge */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                          <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'var(--color-accent-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0, border: '1px solid var(--color-border)' }}>
                            <i className="ph ph-target"></i>
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-text-primary)' }}>Cycle 28 — July Export Production Sprint</span>
                              <span className="badge badge-purple" style={{ fontSize: '12px', fontWeight: 800, padding: '3px 10px', borderRadius: '12px' }}>
                                ⚡ {progressPct}% Velocity
                              </span>
                            </div>
                            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block', marginTop: '2px' }}>
                              Target Shipment: Aug 15, 2026 • <strong>{completedCount} of {filteredJobs.length} Orders Completed</strong>
                            </span>
                          </div>
                        </div>

                        {/* Right Side: Explicit Count Chip */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--color-muted)', padding: '6px 14px', borderRadius: '12px', border: '1px solid var(--color-border)', flexShrink: 0 }}>
                          <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>{progressPct}%</span>
                          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>({completedCount}/{filteredJobs.length} Done)</span>
                        </div>

                      </div>

                      {/* Progress Bar with inner percentage label */}
                      <div className="cycle-progress-bar" style={{ position: 'relative', height: '14px', borderRadius: '7px', marginTop: '6px' }}>
                        <div className="cycle-progress-fill" style={{ width: `${Math.min(100, Math.max(14, progressPct))}%`, height: '100%', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '8px', fontSize: '10px', fontWeight: 800, color: '#FFFFFF' }}>
                          {progressPct}%
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* LINEAR KANBAN BOARD (5 PRODUCTION STAGES) */}
                <div className="linear-kanban-board">
                  
                  {/* Column 1: Backlog & Cutting */}
                  <div className="linear-kanban-column">
                    <div className="kanban-column-header">
                      <div className="kanban-column-title">
                        <i className="ph ph-scissors" style={{ color: '#F59E0B', fontSize: '16px' }}></i>
                        <span>Backlog & Cutting</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button 
                          type="button" 
                          onClick={() => setJobsSubTab('create')} 
                          style={{ border: '1px solid rgba(245, 158, 11, 0.3)', background: 'rgba(245, 158, 11, 0.1)', color: '#D97706', fontSize: '11px', fontWeight: 800, padding: '3px 9px', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          title="Add new job order to Backlog"
                        >
                          <i className="ph ph-plus" style={{ fontSize: '12px' }}></i> Add Job
                        </button>
                        <span className="kanban-column-count">
                          {upcomingOrders.filter(o => {
                            const matchesStage = (!o.stage && (!o.status || o.status === 'Pending' || o.status === 'Cutting' || o.status === 'Planned')) || o.stage === 'Backlog & Cutting';
                            const matchesSearch = !kanbanSearchQuery || (o.orderTitle && o.orderTitle.toLowerCase().includes(kanbanSearchQuery.toLowerCase())) || (o.clientName && o.clientName.toLowerCase().includes(kanbanSearchQuery.toLowerCase()));
                            const matchesPriority = kanbanPriorityFilter === 'All' || o.priority === kanbanPriorityFilter;
                            return matchesStage && matchesSearch && matchesPriority;
                          }).length}
                        </span>
                      </div>
                    </div>

                    <div className="kanban-cards-container">
                      {upcomingOrders
                        .filter(o => {
                          const matchesStage = (!o.stage && (!o.status || o.status === 'Pending' || o.status === 'Cutting' || o.status === 'Planned')) || o.stage === 'Backlog & Cutting';
                          const matchesSearch = !kanbanSearchQuery || (o.orderTitle && o.orderTitle.toLowerCase().includes(kanbanSearchQuery.toLowerCase())) || (o.clientName && o.clientName.toLowerCase().includes(kanbanSearchQuery.toLowerCase()));
                          const matchesPriority = kanbanPriorityFilter === 'All' || o.priority === kanbanPriorityFilter;
                          return matchesStage && matchesSearch && matchesPriority;
                        })
                        .map(order => {
                          const isOverdue = new Date(order.deliveryDate) < new Date() && order.stage !== 'Completed / Delivered';
                          return (
                            <div key={order._id} className="kanban-card" onClick={() => setSelectedJobModal(order)}>
                              {isOverdue && (
                                <div className="overdue-card-banner">
                                  <i className="ph ph-warning-circle"></i> OVERDUE DELAY
                                </div>
                              )}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span className={`priority-badge ${order.priority?.toLowerCase() || 'urgent'}`}>
                                  {order.priority === 'Urgent' ? <><i className="ph ph-warning"></i> Urgent</> : order.priority === 'High' ? <><i className="ph ph-fire"></i> High</> : order.priority === 'Medium' ? <><i className="ph ph-circle-dashed"></i> Medium</> : <><i className="ph ph-check-circle"></i> Low</>}
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                    <i className="ph ph-calendar-blank"></i> {formatDate(order.deliveryDate)}
                                  </span>
                                  <button 
                                    type="button" 
                                    className="btn-icon text-red" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteUpcomingOrder(order._id, order);
                                    }}
                                    title="Delete Job Order"
                                    style={{ padding: '2px 4px', fontSize: '13px', border: 'none', background: 'transparent', cursor: 'pointer', opacity: 0.8 }}
                                  >
                                    <i className="ph ph-trash"></i>
                                  </button>
                                </div>
                              </div>
                              <div className="kanban-card-title">{order.orderTitle}</div>
                              <div className="kanban-card-client"><i className="ph ph-user" style={{ color: 'var(--color-primary)' }}></i> {order.clientName}</div>
                              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <i className="ph ph-t-shirt" style={{ color: 'var(--color-primary)' }}></i> {order.quantity ? order.quantity.toLocaleString() + ' Pcs' : '2,500 Pcs'}
                              </div>
                              <div className="kanban-card-footer">
                                <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}><i className="ph ph-currency-inr" style={{ fontSize: '12px' }}></i> {formatCurrency(order.estimatedValue)}</span>
                                <span className="badge" style={{ fontSize: '10px', display: 'flex', alignItems: 'center', gap: '3px' }}><i className="ph ph-factory"></i> {order.productionUnit || 'Cutting Unit'}</span>
                              </div>
                              <div style={{ fontSize: '10.5px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                <i className="ph ph-user-gear" style={{ fontSize: '11px', color: '#5E6AD2' }}></i> {order.assignedWorker || 'Kartick (Master Lead)'}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Column 2: Stitching Assembly */}
                  <div className="linear-kanban-column">
                    <div className="kanban-column-header">
                      <div className="kanban-column-title">
                        <i className="ph ph-needle" style={{ color: '#5E6AD2', fontSize: '16px' }}></i>
                        <span>Stitching Assembly</span>
                      </div>
                      <span className="kanban-column-count">
                        {upcomingOrders.filter(o => {
                          const matchesStage = o.stage === 'Stitching Assembly' || (!o.stage && (o.status === 'In Production' || o.status === 'Stitching'));
                          const matchesSearch = !kanbanSearchQuery || (o.orderTitle && o.orderTitle.toLowerCase().includes(kanbanSearchQuery.toLowerCase())) || (o.clientName && o.clientName.toLowerCase().includes(kanbanSearchQuery.toLowerCase()));
                          const matchesPriority = kanbanPriorityFilter === 'All' || o.priority === kanbanPriorityFilter;
                          return matchesStage && matchesSearch && matchesPriority;
                        }).length}
                      </span>
                    </div>

                    <div className="kanban-cards-container">
                      {upcomingOrders
                        .filter(o => {
                          const matchesStage = o.stage === 'Stitching Assembly' || (!o.stage && (o.status === 'In Production' || o.status === 'Stitching'));
                          const matchesSearch = !kanbanSearchQuery || (o.orderTitle && o.orderTitle.toLowerCase().includes(kanbanSearchQuery.toLowerCase())) || (o.clientName && o.clientName.toLowerCase().includes(kanbanSearchQuery.toLowerCase()));
                          const matchesPriority = kanbanPriorityFilter === 'All' || o.priority === kanbanPriorityFilter;
                          return matchesStage && matchesSearch && matchesPriority;
                        })
                        .map(order => {
                          const isOverdue = new Date(order.deliveryDate) < new Date() && order.stage !== 'Completed / Delivered';
                          return (
                            <div key={order._id} className="kanban-card" onClick={() => setSelectedJobModal(order)}>
                              {isOverdue && (
                                <div className="overdue-card-banner">
                                  <i className="ph ph-warning-circle"></i> OVERDUE DELAY
                                </div>
                              )}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span className={`priority-badge ${order.priority?.toLowerCase() || 'high'}`}>
                                  {order.priority === 'Urgent' ? <><i className="ph ph-warning"></i> Urgent</> : order.priority === 'High' ? <><i className="ph ph-fire"></i> High</> : order.priority === 'Medium' ? <><i className="ph ph-circle-dashed"></i> Medium</> : <><i className="ph ph-check-circle"></i> Low</>}
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                    <i className="ph ph-calendar-blank"></i> {formatDate(order.deliveryDate)}
                                  </span>
                                  <button 
                                    type="button" 
                                    className="btn-icon text-red" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteUpcomingOrder(order._id, order);
                                    }}
                                    title="Delete Job Order"
                                    style={{ padding: '2px 4px', fontSize: '13px', border: 'none', background: 'transparent', cursor: 'pointer', opacity: 0.8 }}
                                  >
                                    <i className="ph ph-trash"></i>
                                  </button>
                                </div>
                              </div>
                              <div className="kanban-card-title">{order.orderTitle}</div>
                              <div className="kanban-card-client"><i className="ph ph-user" style={{ color: 'var(--color-primary)' }}></i> {order.clientName}</div>
                              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <i className="ph ph-t-shirt" style={{ color: 'var(--color-primary)' }}></i> {order.quantity ? order.quantity.toLocaleString() + ' Pcs' : '2,500 Pcs'}
                              </div>
                              <div className="kanban-card-footer">
                                <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}><i className="ph ph-currency-inr" style={{ fontSize: '12px' }}></i> {formatCurrency(order.estimatedValue)}</span>
                                <span className="badge badge-purple" style={{ fontSize: '10px', display: 'flex', alignItems: 'center', gap: '3px' }}><i className="ph ph-factory"></i> {order.productionUnit || 'Stitching Floor'}</span>
                              </div>
                              <div style={{ fontSize: '10.5px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                <i className="ph ph-user-gear" style={{ fontSize: '11px', color: '#5E6AD2' }}></i> {order.assignedWorker || 'Kartick (Master Lead)'}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Column 3: QC Inspection */}
                  <div className="linear-kanban-column">
                    <div className="kanban-column-header">
                      <div className="kanban-column-title">
                        <i className="ph ph-check-square-offset" style={{ color: '#3B82F6', fontSize: '16px' }}></i>
                        <span>QC Inspection</span>
                      </div>
                      <span className="kanban-column-count">
                        {upcomingOrders.filter(o => {
                          const matchesStage = o.stage === 'QC Inspection' || (!o.stage && (o.status === 'QC Inspection' || o.status === 'Quality Check'));
                          const matchesSearch = !kanbanSearchQuery || (o.orderTitle && o.orderTitle.toLowerCase().includes(kanbanSearchQuery.toLowerCase())) || (o.clientName && o.clientName.toLowerCase().includes(kanbanSearchQuery.toLowerCase()));
                          const matchesPriority = kanbanPriorityFilter === 'All' || o.priority === kanbanPriorityFilter;
                          return matchesStage && matchesSearch && matchesPriority;
                        }).length}
                      </span>
                    </div>

                    <div className="kanban-cards-container">
                      {upcomingOrders
                        .filter(o => {
                          const matchesStage = o.stage === 'QC Inspection' || (!o.stage && (o.status === 'QC Inspection' || o.status === 'Quality Check'));
                          const matchesSearch = !kanbanSearchQuery || (o.orderTitle && o.orderTitle.toLowerCase().includes(kanbanSearchQuery.toLowerCase())) || (o.clientName && o.clientName.toLowerCase().includes(kanbanSearchQuery.toLowerCase()));
                          const matchesPriority = kanbanPriorityFilter === 'All' || o.priority === kanbanPriorityFilter;
                          return matchesStage && matchesSearch && matchesPriority;
                        })
                        .map(order => (
                          <div key={order._id} className="kanban-card" onClick={() => setSelectedJobModal(order)}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span className={`priority-badge ${order.priority?.toLowerCase() || 'medium'}`}>
                                {order.priority === 'Urgent' ? <><i className="ph ph-warning"></i> Urgent</> : order.priority === 'High' ? <><i className="ph ph-fire"></i> High</> : order.priority === 'Medium' ? <><i className="ph ph-circle-dashed"></i> Medium</> : <><i className="ph ph-check-circle"></i> Low</>}
                              </span>
                              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <i className="ph ph-calendar-blank"></i> {formatDate(order.deliveryDate)}
                              </span>
                            </div>
                            <div className="kanban-card-title">{order.orderTitle}</div>
                            <div className="kanban-card-client"><i className="ph ph-user" style={{ color: 'var(--color-primary)' }}></i> {order.clientName}</div>
                            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <i className="ph ph-t-shirt" style={{ color: 'var(--color-primary)' }}></i> {order.quantity ? order.quantity.toLocaleString() + ' Pcs' : '2,500 Pcs'}
                            </div>
                            <div className="kanban-card-footer">
                              <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}><i className="ph ph-currency-inr" style={{ fontSize: '12px' }}></i> {formatCurrency(order.estimatedValue)}</span>
                              <span className="badge" style={{ fontSize: '10px', display: 'flex', alignItems: 'center', gap: '3px' }}><i className="ph ph-check-square-offset"></i> Quality Audit</span>
                            </div>
                            <div style={{ fontSize: '10.5px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                              <i className="ph ph-user-gear" style={{ fontSize: '11px', color: '#5E6AD2' }}></i> {order.assignedWorker || 'Srimathi (QC Lead)'}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Column 4: Packing & Ready */}
                  <div className="linear-kanban-column">
                    <div className="kanban-column-header">
                      <div className="kanban-column-title">
                        <i className="ph ph-package" style={{ color: '#10B981', fontSize: '16px' }}></i>
                        <span>Packing & Ready</span>
                      </div>
                      <span className="kanban-column-count">
                        {upcomingOrders.filter(o => {
                          const matchesStage = o.stage === 'Packing & Ready' || (!o.stage && (o.status === 'Ready' || o.status === 'Packing'));
                          const matchesSearch = !kanbanSearchQuery || (o.orderTitle && o.orderTitle.toLowerCase().includes(kanbanSearchQuery.toLowerCase())) || (o.clientName && o.clientName.toLowerCase().includes(kanbanSearchQuery.toLowerCase()));
                          const matchesPriority = kanbanPriorityFilter === 'All' || o.priority === kanbanPriorityFilter;
                          return matchesStage && matchesSearch && matchesPriority;
                        }).length}
                      </span>
                    </div>

                    <div className="kanban-cards-container">
                      {upcomingOrders
                        .filter(o => {
                          const matchesStage = o.stage === 'Packing & Ready' || (!o.stage && (o.status === 'Ready' || o.status === 'Packing'));
                          const matchesSearch = !kanbanSearchQuery || (o.orderTitle && o.orderTitle.toLowerCase().includes(kanbanSearchQuery.toLowerCase())) || (o.clientName && o.clientName.toLowerCase().includes(kanbanSearchQuery.toLowerCase()));
                          const matchesPriority = kanbanPriorityFilter === 'All' || o.priority === kanbanPriorityFilter;
                          return matchesStage && matchesSearch && matchesPriority;
                        })
                        .map(order => (
                          <div key={order._id} className="kanban-card" onClick={() => setSelectedJobModal(order)}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span className={`priority-badge ${order.priority?.toLowerCase() || 'low'}`}>
                                {order.priority === 'Urgent' ? <><i className="ph ph-warning"></i> Urgent</> : order.priority === 'High' ? <><i className="ph ph-fire"></i> High</> : order.priority === 'Medium' ? <><i className="ph ph-circle-dashed"></i> Medium</> : <><i className="ph ph-check-circle"></i> Low</>}
                              </span>
                              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <i className="ph ph-calendar-blank"></i> {formatDate(order.deliveryDate)}
                              </span>
                            </div>
                            <div className="kanban-card-title">{order.orderTitle}</div>
                            <div className="kanban-card-client"><i className="ph ph-user" style={{ color: 'var(--color-primary)' }}></i> {order.clientName}</div>
                            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <i className="ph ph-t-shirt" style={{ color: 'var(--color-primary)' }}></i> {order.quantity ? order.quantity.toLocaleString() + ' Pcs' : '2,500 Pcs'}
                            </div>
                            <div className="kanban-card-footer">
                              <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}><i className="ph ph-currency-inr" style={{ fontSize: '12px' }}></i> {formatCurrency(order.estimatedValue)}</span>
                              <span className="badge badge-success" style={{ fontSize: '10px', display: 'flex', alignItems: 'center', gap: '3px' }}><i className="ph ph-package"></i> Packed</span>
                            </div>
                            <div style={{ fontSize: '10.5px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                              <i className="ph ph-user-gear" style={{ fontSize: '11px', color: '#5E6AD2' }}></i> {order.assignedWorker || 'Packing Supervisor'}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Column 5: Invoiced & Completed */}
                  <div className="linear-kanban-column">
                    <div className="kanban-column-header">
                      <div className="kanban-column-title">
                        <i className="ph ph-truck" style={{ color: '#10B981', fontSize: '16px' }}></i>
                        <span>Invoiced & Delivered</span>
                      </div>
                      <span className="kanban-column-count">
                        {upcomingOrders.filter(o => {
                          const matchesStage = o.stage === 'Completed / Delivered' || (!o.stage && (o.status === 'Delivered' || o.status === 'Completed'));
                          const matchesSearch = !kanbanSearchQuery || (o.orderTitle && o.orderTitle.toLowerCase().includes(kanbanSearchQuery.toLowerCase())) || (o.clientName && o.clientName.toLowerCase().includes(kanbanSearchQuery.toLowerCase()));
                          const matchesPriority = kanbanPriorityFilter === 'All' || o.priority === kanbanPriorityFilter;
                          return matchesStage && matchesSearch && matchesPriority;
                        }).length}
                      </span>
                    </div>

                    <div className="kanban-cards-container">
                      {upcomingOrders
                        .filter(o => {
                          const matchesStage = o.stage === 'Completed / Delivered' || (!o.stage && (o.status === 'Delivered' || o.status === 'Completed'));
                          const matchesSearch = !kanbanSearchQuery || (o.orderTitle && o.orderTitle.toLowerCase().includes(kanbanSearchQuery.toLowerCase())) || (o.clientName && o.clientName.toLowerCase().includes(kanbanSearchQuery.toLowerCase()));
                          const matchesPriority = kanbanPriorityFilter === 'All' || o.priority === kanbanPriorityFilter;
                          return matchesStage && matchesSearch && matchesPriority;
                        })
                        .map(order => (
                          <div key={order._id} className="kanban-card" onClick={() => setSelectedJobModal(order)}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span className="priority-badge low"><i className="ph ph-check-circle"></i> Completed</span>
                              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <i className="ph ph-calendar-blank"></i> {formatDate(order.deliveryDate)}
                              </span>
                            </div>
                            <div className="kanban-card-title">{order.orderTitle}</div>
                            <div className="kanban-card-client"><i className="ph ph-user" style={{ color: 'var(--color-primary)' }}></i> {order.clientName}</div>
                            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <i className="ph ph-t-shirt" style={{ color: 'var(--color-primary)' }}></i> {order.quantity ? order.quantity.toLocaleString() + ' Pcs' : '2,500 Pcs'}
                            </div>
                            <div className="kanban-card-footer">
                              <span style={{ fontWeight: 700, color: 'var(--color-success)' }}><i className="ph ph-currency-inr" style={{ fontSize: '12px' }}></i> {formatCurrency(order.estimatedValue)}</span>
                              <span className="badge badge-success" style={{ fontSize: '10px', display: 'flex', alignItems: 'center', gap: '3px' }}><i className="ph ph-truck"></i> Dispatched</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                </div>

              </div>
            ) : (
              <div className="table-card bg-surface border desktop-table-container" style={{ marginTop: '10px' }}>
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Job Title / Order Description</th>
                        <th>Style #</th>
                        <th>Client Name</th>
                        <th>Order & Shipment Qty</th>
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
                          <tr key={order._id} style={{ cursor: 'pointer' }} onClick={() => openViewEditJobModal(order)}>
                            <td className="font-semibold">{order.orderTitle}</td>
                            <td>
                              <span className="badge badge-purple" style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                                {order.styleNumber || 'ST-2026-01'}
                              </span>
                            </td>
                            <td>{order.clientName}</td>
                            <td>
                              <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                                {order.orderQty ? order.orderQty.toLocaleString() : (order.quantity || 2500).toLocaleString()} Pcs
                              </div>
                              <div style={{ fontSize: '10.5px', color: 'var(--color-text-secondary)' }}>
                                Ship Qty: {order.shipmentQty ? order.shipmentQty.toLocaleString() : (order.quantity || 2500).toLocaleString()} Pcs
                              </div>
                            </td>
                            <td>{formatDate(order.deliveryDate)}</td>
                            <td className="font-bold text-primary" style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(order.estimatedValue)}</td>
                            <td>
                              <span className={`badge ${order.status === 'In Production' ? 'badge-warning' : order.status === 'Delivered' ? 'badge-success' : 'badge-info'}`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="text-right" onClick={(e) => e.stopPropagation()}>
                              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                <button 
                                  type="button"
                                  className="btn btn-secondary btn-sm" 
                                  onClick={(e) => { e.stopPropagation(); openViewEditJobModal(order); }}
                                  title="View Job Order Details"
                                  style={{ padding: '5px 12px', fontSize: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px', borderRadius: '8px' }}
                                >
                                  <i className="ph ph-eye" style={{ fontSize: '14px' }}></i> View
                                </button>
                                <button 
                                  className="btn-icon text-red" 
                                  onClick={() => deleteUpcomingOrder(order._id, order)}
                                  title="Delete Job Order"
                                  style={{ padding: '4px 6px', fontSize: '15px' }}
                                >
                                  <i className="ph ph-trash"></i>
                                </button>
                              </div>
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



            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Activity Audit Stream Card */}
              <div className="activity-stream-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className="ph ph-clock-counter-clockwise" style={{ color: 'var(--color-primary)' }}></i> Real-time Audit Stream
                    </h3>
                    <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--color-text-secondary)' }}>Chronological history of invoices created, job status moves, and system actions.</p>
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={() => alert("Audit logs exported to CSV.")}>
                    <i className="ph ph-download-simple"></i> Export Audit Log
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {activityAuditLogs.map(log => (
                    <div key={log.id} className="activity-feed-item">
                      <div className="activity-feed-icon" style={{ backgroundColor: `${log.color}20`, color: log.color }}>
                        <i className={`ph ${log.icon}`}></i>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                          {log.user} <span style={{ fontWeight: 500, color: 'var(--color-text-secondary)' }}>{log.action}</span> <span style={{ color: 'var(--color-primary)' }}>{log.target}</span>
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>{log.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </section>
        )}

        {/* ==================== SETTINGS VIEW ==================== */}
        {activeTab === 'settings' && (
          <section id="settings-view" className="tab-view active" style={{ padding: '0 4px 40px 4px' }}>
            <header className="view-header" style={{ marginBottom: '24px' }}>
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 4px 0' }}>System Settings & Multi-Company Configuration</h1>
                <p className="subtitle" style={{ margin: 0, color: 'var(--color-text-secondary)' }}>Manage legal companies, export branches, user role permissions, and GST registrations.</p>
              </div>
            </header>

            {/* SECTION 1: MULTI-COMPANY & BRANCHES DIRECTORY */}
            <div className="card bg-surface border" style={{ padding: '24px', borderRadius: '16px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px', color: '#111827' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                      <i className="ph ph-buildings"></i>
                    </div>
                    Registered Companies & Export Branch Units ({companies.length})
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6B7280' }}>
                    Switch active accounting ledgers or register new branch locations.
                  </p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => setIsAddBranchModalOpen(true)} style={{ borderRadius: '10px', padding: '8px 16px', fontWeight: 700 }}>
                  <i className="ph ph-plus"></i> Add Company / Branch
                </button>
              </div>

              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Company Name</th>
                      <th>Branch Unit</th>
                      <th>Location / City</th>
                      <th>GSTIN Registration</th>
                      <th>Contact Phone</th>
                      <th className="text-center">Active Status</th>
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies.map((comp) => {
                      const isActive = comp.id === activeCompanyId;
                      return (
                        <tr key={comp.id} style={{ backgroundColor: isActive ? '#F5F3FF' : 'transparent' }}>
                          <td className="font-bold" style={{ color: isActive ? '#4F46E5' : '#111827' }}>
                            {comp.name}
                            <span style={{ marginLeft: '8px', fontSize: '10px', padding: '2px 6px', borderRadius: '8px', backgroundColor: comp.badge === 'HQ' ? '#EEF2FF' : '#F3F4F6', color: comp.badge === 'HQ' ? '#4F46E5' : '#4B5563', fontWeight: 700 }}>
                              {comp.badge || 'Branch'}
                            </span>
                          </td>
                          <td className="font-medium">{comp.branch}</td>
                          <td>📍 {comp.city}</td>
                          <td className="font-mono">{comp.gst || '33CKMPS0071D1ZC'}</td>
                          <td className="font-mono">{comp.phone || '+91 99946 85525'}</td>
                          <td className="text-center">
                            {isActive ? (
                              <span style={{ fontSize: '11px', fontWeight: 800, color: '#059669', backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', padding: '4px 10px', borderRadius: '12px' }}>
                                🟢 ACTIVE LEDGER
                              </span>
                            ) : (
                              <span style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', backgroundColor: '#F3F4F6', padding: '4px 10px', borderRadius: '12px' }}>
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="text-right">
                            {!isActive ? (
                              <button 
                                className="btn btn-secondary btn-sm" 
                                onClick={() => setActiveCompanyId(comp.id)}
                                style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '8px', fontWeight: 700, color: '#4F46E5', borderColor: '#C7D2FE' }}
                              >
                                Switch to This
                              </button>
                            ) : (
                              <span style={{ fontSize: '12px', fontWeight: 700, color: '#4F46E5' }}>Currently Selected</span>
                            )}
                            {companies.length > 1 && !isActive && (
                              <button 
                                className="btn-ghost" 
                                onClick={() => {
                                  if (confirm(`Are you sure you want to remove ${comp.name} (${comp.branch})?`)) {
                                    setCompanies(prev => prev.filter(c => c.id !== comp.id));
                                  }
                                }}
                                style={{ marginLeft: '8px', color: '#EF4444', padding: '4px 8px' }}
                                title="Remove Branch"
                              >
                                <i className="ph ph-trash"></i>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECTION 2: ACTIVE COMPANY PROFILE FORM */}
            <div className="card bg-surface border" style={{ padding: '28px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px', color: '#111827' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                  <i className="ph ph-note-pencil"></i>
                </div>
                Active Profile: {activeCompany.name} ({activeCompany.branch})
              </h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                const form = e.target;
                const updatedName = form.legalName.value.trim();
                const updatedGst = form.gstin.value.trim();
                const updatedPhone = form.phone.value.trim();
                const updatedCity = form.city.value.trim();

                setCompanies(prev => prev.map(c => c.id === activeCompany.id ? {
                  ...c,
                  name: updatedName || c.name,
                  gst: updatedGst || c.gst,
                  phone: updatedPhone || c.phone,
                  city: updatedCity || c.city
                } : c));

                alert(`🎉 ${activeCompany.name} profile updated successfully!`);
              }} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label style={{ fontWeight: 600 }}>Company Legal Name *</label>
                    <input type="text" name="legalName" key={activeCompany.id + '-name'} defaultValue={activeCompany.name} style={{ fontSize: '14px', padding: '10px 12px', borderRadius: '10px' }} />
                  </div>
                  <div className="form-group">
                    <label style={{ fontWeight: 600 }}>GSTIN Tax Registration *</label>
                    <input type="text" name="gstin" key={activeCompany.id + '-gst'} defaultValue={activeCompany.gst || '33CKMPS0071D1ZC'} style={{ fontSize: '14px', padding: '10px 12px', borderRadius: '10px' }} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label style={{ fontWeight: 600 }}>Primary Contact Phone *</label>
                    <input type="text" name="phone" key={activeCompany.id + '-phone'} defaultValue={activeCompany.phone || '+91 99946 85525'} style={{ fontSize: '14px', padding: '10px 12px', borderRadius: '10px' }} />
                  </div>
                  <div className="form-group">
                    <label style={{ fontWeight: 600 }}>City / Branch Location *</label>
                    <input type="text" name="city" key={activeCompany.id + '-city'} defaultValue={activeCompany.city || 'Tirupur'} style={{ fontSize: '14px', padding: '10px 12px', borderRadius: '10px' }} />
                  </div>
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: 600 }}>Registered Factory & Office Address *</label>
                  <input type="text" name="address" defaultValue="8/2933 A, Karuparayan Kovil, 3rd Street, Pandian Nagar, Tirupur - 641603" style={{ fontSize: '14px', padding: '10px 12px', borderRadius: '10px' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px', fontWeight: 700, borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <i className="ph ph-check" style={{ fontSize: '16px' }}></i> Save Company Profile Changes
                  </button>
                </div>
              </form>
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
                      <th className="text-center">Payment Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bills.filter(b => b.billNumber.toLowerCase().includes(billSearch.toLowerCase())).map(b => {
                      const c = clients.find(cl => cl._id === b.clientId);
                      const isPaid = (b.paymentStatus === 'Paid' || b.status === 'Paid');
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
                          <td className="text-center">
                            <button
                              type="button"
                              onClick={() => toggleBillPaymentStatus(b)}
                              title="Click to toggle Payment Received status"
                              style={{
                                border: isPaid ? '1px solid #A7F3D0' : '1px solid #FDE68A',
                                backgroundColor: isPaid ? '#ECFDF5' : '#FFFBEB',
                                color: isPaid ? '#047857' : '#B45309',
                                borderRadius: '12px',
                                padding: '4px 10px',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <i className={`ph ${isPaid ? 'ph-check-circle' : 'ph-clock-countdown'}`} style={{ fontSize: '13px' }}></i>
                              {isPaid ? 'Payment Received' : 'Payment Pending'}
                            </button>
                          </td>
                          <td className="text-right" onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                              <button 
                                type="button"
                                className="btn btn-secondary btn-sm" 
                                onClick={() => { setViewingInvoice(b); setIsInvoiceViewOpen(true); }}
                                title="Preview Invoice"
                                style={{ padding: '5px 12px', fontSize: '12px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', borderRadius: '8px' }}
                              >
                                <i className="ph ph-eye" style={{ fontSize: '14px' }}></i> Preview
                              </button>

                              <button 
                                type="button"
                                className="btn btn-primary btn-sm" 
                                onClick={() => { 
                                  setViewingInvoice(b); 
                                  setIsInvoiceViewOpen(true); 
                                  setTimeout(() => window.print(), 350);
                                }}
                                title="Print Tax Invoice Document"
                                style={{ padding: '5px 12px', fontSize: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px', borderRadius: '8px' }}
                              >
                                <i className="ph ph-printer" style={{ fontSize: '14px' }}></i> Print
                              </button>

                              <button className="btn-icon" onClick={() => openEditBill(b)} title="Edit Invoice"><i className="ph ph-pencil-simple"></i></button>
                              <button className="btn-icon text-red" onClick={() => deleteBill(b._id)} title="Delete Invoice"><i className="ph ph-trash"></i></button>
                            </div>
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
                      <button className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }} onClick={() => { setViewingInvoice(b); setIsInvoiceViewOpen(true); }}>
                        <i className="ph ph-eye"></i> Preview
                      </button>
                      <button className="btn btn-primary" style={{ padding: '6px 10px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }} onClick={() => { setViewingInvoice(b); setIsInvoiceViewOpen(true); setTimeout(() => window.print(), 350); }}>
                        <i className="ph ph-printer"></i> Print
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
                <p className="subtitle">Register stitching staff, log daily attendance, manage advances & disburse weekly payouts.</p>
              </div>
              <div className="header-actions">
                <button className="btn btn-primary" onClick={() => setIsEmployeeModalOpen(true)}>
                  <i className="ph ph-user-plus"></i> Register Employee
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
              <button className={`sub-tab-btn ${employeesSubTab === 'salary' || employeesSubTab === 'payroll' ? 'active' : ''}`} onClick={() => setEmployeesSubTab('salary')}>
                <i className="ph ph-hand-coins"></i> Weekly Payouts & Advances
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
                        <tr key={record._id || record.id}>
                          <td className="text-muted">{record.date}</td>
                          <td className="font-semibold">{record.empName}</td>
                          <td>{record.role || 'Staff'}</td>
                          <td>{record.shift || 'General Shift'}</td>
                          <td>{record.checkIn || '08:00 AM'}</td>
                          <td>
                            <span className={`badge ${
                              (record.status || '').includes('Present') ? 'badge-success' :
                              (record.status || '').includes('Overtime') ? 'badge-info' :
                              (record.status || '').includes('Half-Day') ? 'badge-warning' : 'badge-danger'
                            }`}>
                              {record.status}
                            </span>
                          </td>
                          <td className="text-right" onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                              <button className="btn btn-secondary btn-sm" onClick={() => setIsAttendanceModalOpen(true)}>
                                Update
                              </button>
                              <button
                                type="button"
                                className="btn-icon text-red"
                                onClick={() => deleteAttendanceRecord(record)}
                                title="Delete Attendance Log"
                              >
                                <i className="ph ph-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {attendanceRecords.length === 0 && (
                        <tr>
                          <td colSpan="7" className="text-center text-muted" style={{ padding: '24px' }}>
                            No attendance entries logged today. Click "+ Log Today's Attendance".
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (employeesSubTab === 'salary' || employeesSubTab === 'payroll') ? (
              <div style={{ marginTop: '20px' }}>
                {/* Unified Single Weekly Payouts & Advances Log */}
                <div className="table-card bg-surface border">
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Weekly Payouts & Advance Deductions Log</h3>
                      <p className="small text-muted" style={{ margin: '2px 0 0 0' }}>Unified record of weekly payouts, piece-rate wages, and salary advance deductions.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button className="btn btn-secondary btn-sm text-primary" onClick={() => setIsAdvanceModalOpen(true)} style={{ fontWeight: 700 }}>
                        <i className="ph ph-hand-coins"></i> Give Advance
                      </button>
                      <button className="btn btn-primary btn-sm" onClick={() => setIsDisbursePayrollModalOpen(true)}>
                        <i className="ph ph-money"></i> Disburse Weekly Payout
                      </button>
                    </div>
                  </div>

                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Date / Period</th>
                          <th>Employee</th>
                          <th>Transaction Type</th>
                          <th>Salary Amount (₹)</th>
                          <th>Advances / Deductions (₹)</th>
                          <th>Net Paid (₹)</th>
                          <th>Status</th>
                          <th className="text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Weekly Payout Records */}
                        {payrollRecords.map(pr => (
                          <tr key={`pr-${pr.id}`}>
                            <td className="text-muted">{pr.month}</td>
                            <td className="font-semibold">{pr.empName}</td>
                            <td><span className="badge badge-success">Weekly Payout</span></td>
                            <td>{formatCurrency(pr.baseSalary)}</td>
                            <td className="text-red">-{formatCurrency(pr.deductions)}</td>
                            <td className="font-bold text-primary">{formatCurrency(pr.netPayable)}</td>
                            <td>
                              <span className="badge badge-success">{pr.status}</span>
                            </td>
                            <td className="text-right">
                              <button className="btn btn-secondary btn-sm" onClick={() => alert(`Printing weekly slip for ${pr.empName} (${pr.month})...`)}>
                                <i className="ph ph-printer"></i> Slip
                              </button>
                            </td>
                          </tr>
                        ))}

                        {/* Advance Records */}
                        {advanceRecords.map(adv => (
                          <tr key={`adv-${adv.id}`}>
                            <td className="text-muted">{adv.date}</td>
                            <td className="font-semibold">{adv.empName}</td>
                            <td><span className="badge badge-purple">{adv.type || 'Salary Advance'}</span></td>
                            <td className="text-muted">-</td>
                            <td className="font-bold text-red">₹{Number(adv.amount).toLocaleString('en-IN')}</td>
                            <td className="font-bold text-primary">₹{Number(adv.amount).toLocaleString('en-IN')}</td>
                            <td><span className="badge badge-warning">Advance Issued</span></td>
                            <td className="text-right">
                              <button className="btn btn-secondary btn-sm" onClick={() => alert(`Advance receipt generated for ${adv.empName}`)}>
                                <i className="ph ph-receipt"></i> Receipt
                              </button>
                            </td>
                          </tr>
                        ))}

                        {payrollRecords.length === 0 && advanceRecords.length === 0 && (
                          <tr>
                            <td colSpan="8" className="text-center text-muted" style={{ padding: '24px' }}>
                              No payout or advance transactions found. Click "+ Disburse Weekly Payout" or "+ Give Advance".
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
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
                          <th>Sub Category</th>
                          <th className="text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {employees.filter(e => e.name.toLowerCase().includes(employeeSearch.toLowerCase())).map(emp => (
                          <tr key={emp._id}>
                            <td 
                              onClick={() => openEditEmployee(emp)} 
                              style={{ cursor: 'pointer' }}
                              title={`Click to edit ${emp.name}'s profile`}
                            >
                              <div style={{ fontWeight: 700, color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <span>{emp.name}</span>
                                <i className="ph ph-pencil-simple" style={{ fontSize: '12px', opacity: 0.7 }}></i>
                              </div>
                            </td>
                            <td>{emp.phone || '-'}</td>
                            <td>
                              <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{emp.role}</span>
                            </td>
                            <td>{emp.subCategory || '-'}</td>
                            <td className="text-right">
                              <button className="btn-icon" onClick={() => openEditEmployee(emp)} title="Edit Employee"><i className="ph ph-pencil-simple"></i></button>
                              <button className="btn-icon text-red" onClick={() => deleteEmployee(emp._id)} title="Delete Employee"><i className="ph ph-trash"></i></button>
                            </td>
                          </tr>
                        ))}
                        {employees.filter(e => e.name.toLowerCase().includes(employeeSearch.toLowerCase())).length === 0 && (
                          <tr>
                            <td colSpan="5" className="text-center text-muted" style={{ padding: '36px 16px' }}>
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
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', padding: '24px 16px', maxWidth: '520px', margin: '0 auto', textAlign: 'center' }}>
                                    <div style={{
                                      width: '56px',
                                      height: '56px',
                                      borderRadius: '16px',
                                      backgroundColor: 'var(--color-accent-light)',
                                      color: 'var(--color-primary)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justify: 'center',
                                      fontSize: '28px',
                                      border: '1px solid var(--color-border)',
                                      boxShadow: '0 4px 14px rgba(94, 106, 210, 0.15)'
                                    }}>
                                      <i className="ph ph-user-plus"></i>
                                    </div>
                                    
                                    <div>
                                      <h3 style={{ margin: '0 0 6px 0', fontSize: '17px', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                                        No Employees Registered Yet
                                      </h3>
                                      <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
                                        Register tailors, cutting masters, piece-rate stitchers, and supervisors to start tracking daily attendance, piece-rate payouts, and monthly payroll.
                                      </p>
                                    </div>

                                    <button 
                                      className="btn btn-primary" 
                                      onClick={() => setIsEmployeeModalOpen(true)}
                                      style={{ padding: '10px 22px', fontSize: '13px', fontWeight: 700, borderRadius: '12px', boxShadow: '0 4px 14px rgba(94, 106, 210, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}
                                    >
                                      <i className="ph ph-user-plus" style={{ fontSize: '16px' }}></i> Add New Employee
                                    </button>
                                  </div>
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
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <span style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '12px' }}>{emp.role}</span>
                          {emp.subCategory && (
                            <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--color-text-secondary)', border: '1px solid rgba(255,255,255,0.08)', fontSize: '10px', padding: '2px 6px', borderRadius: '8px' }}>{emp.subCategory}</span>
                          )}
                        </div>
                      </div>
                      <div className="mobile-card-body">
                        <div className="mobile-card-detail">
                          <span className="mobile-card-detail-label">Phone</span>
                          <span className="mobile-card-detail-value">{emp.phone || '-'}</span>
                        </div>
                        <div className="mobile-card-detail">
                          <span className="mobile-card-detail-label">Specialization</span>
                          <span className="mobile-card-detail-value">{emp.subCategory || '-'}</span>
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
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', padding: '24px 16px', textAlign: 'center', backgroundColor: 'var(--color-surface)', borderRadius: '14px', border: '1px solid var(--color-border)', margin: '12px 0' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'var(--color-accent-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                        <i className="ph ph-user-plus"></i>
                      </div>
                      <div>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 800, color: 'var(--color-text-primary)' }}>No Employees Registered</h4>
                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-secondary)' }}>Register stitching crew and staff to manage piece rates & attendance.</p>
                      </div>
                      <button className="btn btn-primary" onClick={() => setIsEmployeeModalOpen(true)} style={{ padding: '8px 18px', fontSize: '12px', fontWeight: 700, borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <i className="ph ph-user-plus"></i> Add New Employee
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
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

        {/* ==================== CAPITAL & INVESTMENT SOURCING VIEW ==================== */}
        {activeTab === 'expenses' && (() => {
          const totalCapitalInjected = investmentRecords.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);

          return (
            <section id="expenses-view" className="tab-view active">
              <header className="view-header">
                <div>
                  <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 800 }}>Capital & Investment Sourcing</h1>
                  <p className="subtitle" style={{ margin: '4px 0 0 0', color: 'var(--color-text-secondary)' }}>
                    Track order execution funding sources (e.g. CEO brought amount from MD to run order, Bank/Director loans).
                  </p>
                </div>
                <button className="btn btn-primary" onClick={() => setIsInvestmentModalOpen(true)} style={{ padding: '10px 20px', fontSize: '13.5px', fontWeight: 800, borderRadius: '12px', boxShadow: '0 4px 14px rgba(94, 106, 210, 0.35)', display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <i className="ph ph-plus-circle" style={{ fontSize: '18px' }}></i> Log Investment / Capital
                </button>
              </header>

              {/* KPI Cards */}
              <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <div className="metric-card" style={{ borderLeft: '4px solid #10B981', backgroundColor: '#F0FDF4' }}>
                  <div className="metric-card-header">
                    <span className="metric-label" style={{ color: '#047857', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      💳 Total Capital Sourced
                    </span>
                    <div className="metric-icon" style={{ color: '#10B981', backgroundColor: '#D1FAE5' }}>
                      <i className="ph ph-wallet"></i>
                    </div>
                  </div>
                  <div className="metric-value" style={{ color: '#065F46', fontWeight: 800 }}>{formatCurrency(totalCapitalInjected)}</div>
                  <div className="metric-footer">
                    <span style={{ color: '#047857', fontWeight: 600 }}>Active capital ready for order execution</span>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-card-header">
                    <span className="metric-label">MD & Founder Infusions</span>
                    <div className="metric-icon" style={{ color: 'var(--color-primary)', backgroundColor: 'rgba(94,106,210,0.1)' }}>
                      <i className="ph ph-crown"></i>
                    </div>
                  </div>
                  <div className="metric-value">
                    {formatCurrency(investmentRecords.filter(r => r.type?.includes('MD') || r.investorName?.includes('MD')).reduce((s, r) => s + (parseFloat(r.amount) || 0), 0))}
                  </div>
                  <div className="metric-footer">
                    <span>Capital brought from MD to run orders</span>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-card-header">
                    <span className="metric-label">Loans & Credit Lines</span>
                    <div className="metric-icon" style={{ color: '#6E56CF', backgroundColor: 'rgba(110,86,207,0.1)' }}>
                      <i className="ph ph-bank"></i>
                    </div>
                  </div>
                  <div className="metric-value">
                    {formatCurrency(investmentRecords.filter(r => r.type?.includes('Loan') || r.investorName?.includes('Loan')).reduce((s, r) => s + (parseFloat(r.amount) || 0), 0))}
                  </div>
                  <div className="metric-footer">
                    <span>Short-term loans & working capital lines</span>
                  </div>
                </div>
              </div>

              {/* Main Ledger Table Card */}
              <div className="table-card bg-surface border" style={{ padding: '20px', borderRadius: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Order Investment Ledger</h3>
                    <p className="small text-muted" style={{ margin: '4px 0 0 0' }}>
                      Audit breakdown of capital sources, investors, and target order allocations.
                    </p>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Source Category</th>
                        <th>Target Order / Purpose</th>
                        <th className="text-right">Capital Amount (₹)</th>
                        <th className="text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {investmentRecords.map((rec) => (
                        <tr key={rec.id}>
                          <td className="text-muted">{rec.date}</td>
                          <td>
                            <span className="badge badge-purple" style={{ fontSize: '11.5px', fontWeight: 700 }}>
                              {rec.type || 'CEO brought amount from MD'}
                            </span>
                          </td>
                          <td>
                            <span className="font-semibold text-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <i className="ph ph-tag" style={{ fontSize: '12px' }}></i> {rec.linkedOrder || 'Run Production Order'}
                            </span>
                          </td>
                          <td className="text-right font-semibold" style={{ color: '#10B981', fontSize: '14px', fontFamily: 'var(--font-mono)' }}>
                            + {formatCurrency(Math.abs(rec.amount))}
                          </td>
                          <td className="text-right" onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                              <button 
                                className="btn-icon text-primary" 
                                onClick={() => openEditInvestment(rec)} 
                                title="Edit Investment Record"
                              >
                                <i className="ph ph-pencil-simple"></i>
                              </button>
                              <button 
                                className="btn-icon text-red" 
                                onClick={() => deleteInvestmentRecord(rec)} 
                                title="Delete Record"
                              >
                                <i className="ph ph-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {investmentRecords.length === 0 && (
                        <tr>
                          <td colSpan="5" className="text-center text-muted" style={{ padding: '32px' }}>
                            No investment records logged. Click <strong>"Log Investment / Capital"</strong> to record capital sourcing.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          );
        })()}

      </main>

      {/* ==================== OWNER INVESTMENT / BORROWED CAPITAL MODAL ==================== */}
      {isInvestmentModalOpen && (
        <div className="modal-overlay active" onClick={() => { setIsInvestmentModalOpen(false); setEditingInvestment(null); }}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3>{editingInvestment ? '✏️ Edit Investment Record' : '🏦 Log Investment / Capital Source'}</h3>
              <button className="btn-close" onClick={() => { setIsInvestmentModalOpen(false); setEditingInvestment(null); }}><i className="ph ph-x"></i></button>
            </div>
            <form key={editingInvestment ? editingInvestment._id || editingInvestment.id : 'new-inv'} onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target;
              const type = form.sourceType.value.trim();
              const linkedOrder = form.linkedOrder.value;
              const amount = parseFloat(form.amount.value) || 0;
              const date = form.investmentDate.value;

              if (editingInvestment) {
                const targetId = editingInvestment._id || editingInvestment.id;
                const updatedRec = {
                  ...editingInvestment,
                  type: type || "CEO brought amount from MD",
                  linkedOrder: linkedOrder || "General Factory Operational Fund",
                  amount,
                  date
                };
                setInvestmentRecords(prev => prev.map(r => (r._id || r.id) === targetId ? updatedRec : r));
                try {
                  if (updateInvestmentMutation && editingInvestment._id && !editingInvestment._id.startsWith('inv_')) {
                    await updateInvestmentMutation({
                      id: editingInvestment._id,
                      type: type || "CEO brought amount from MD",
                      linkedOrder: linkedOrder || "General Factory Operational Fund",
                      amount,
                      date,
                      createdAt: editingInvestment.createdAt || new Date().toISOString()
                    });
                  }
                } catch (err) {
                  console.warn("Convex update investment fallback:", err);
                }
              } else {
                const newRec = {
                  _id: 'inv_' + Date.now(),
                  id: Date.now(),
                  type: type || "CEO brought amount from MD",
                  linkedOrder: linkedOrder || "General Factory Operational Fund",
                  amount,
                  date
                };
                setInvestmentRecords(prev => [newRec, ...prev]);
                try {
                  if (addInvestmentMutation) {
                    await addInvestmentMutation({
                      type: type || "CEO brought amount from MD",
                      linkedOrder: linkedOrder || "General Factory Operational Fund",
                      amount,
                      date
                    });
                  }
                } catch (err) {
                  console.warn("Convex add investment fallback:", err);
                }
              }
              setIsInvestmentModalOpen(false);
              setEditingInvestment(null);
            }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
                <div className="form-group">
                  <label htmlFor="inv-type" style={{ fontWeight: 600 }}>Source Category *</label>
                  <input 
                    type="text" 
                    id="inv-type" 
                    name="sourceType" 
                    required 
                    defaultValue={editingInvestment ? editingInvestment.type : ''}
                    placeholder="e.g. CEO brought amount from MD to run an order, CEO brought loan..." 
                    style={{ fontSize: '14px', padding: '10px 12px', borderRadius: '10px', width: '100%' }} 
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="inv-order" style={{ fontWeight: 600 }}>Target Order (From Jobs) *</label>
                  <select id="inv-order" name="linkedOrder" required defaultValue={editingInvestment ? editingInvestment.linkedOrder : ''} style={{ fontSize: '14px', padding: '10px 12px', borderRadius: '10px', width: '100%' }}>
                    <option value="">-- Choose Job Order --</option>
                    {upcomingOrders.map(j => (
                      <option key={j._id} value={`${j.styleNumber ? `Style #${j.styleNumber}` : j.orderTitle} (${j.clientName})`}>
                        {j.styleNumber ? `Style #${j.styleNumber}` : j.orderTitle} ({j.clientName} - {(j.orderQty || j.quantity || 2500).toLocaleString()} Pcs)
                      </option>
                    ))}
                    <option value="General Factory Operational Fund">⚙️ General Factory Operational Fund</option>
                  </select>
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label htmlFor="inv-amount" style={{ fontWeight: 600 }}>Capital Amount (₹) *</label>
                    <input type="number" id="inv-amount" name="amount" required step="any" defaultValue={editingInvestment ? editingInvestment.amount : ''} placeholder="e.g. 200000" style={{ fontSize: '14px', padding: '10px 12px', borderRadius: '10px', width: '100%', fontWeight: 700 }} />
                  </div>
                  <LinearDatePickerInput 
                    id="inv-date"
                    name="investmentDate"
                    label="Transaction Date *"
                    defaultValue={editingInvestment ? editingInvestment.date : new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ padding: '16px 20px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setIsInvestmentModalOpen(false); setEditingInvestment(null); }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px', fontWeight: 700, borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <i className="ph ph-check" style={{ fontSize: '16px' }}></i> {editingInvestment ? 'Update Capital Record' : 'Save Capital Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== ALLOCATE CAPITAL FOR SPECIFIC ORDER MODAL ==================== */}
      {isAllocateOrderModalOpen && (
        <div className="modal-overlay active" onClick={() => setIsAllocateOrderModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <h3>🛍️ Allocate Capital for Specific Order</h3>
              <button className="btn-close" onClick={() => setIsAllocateOrderModalOpen(false)}><i className="ph ph-x"></i></button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target;
              const billIdVal = form.billId.value;
              const amount = parseFloat(form.amount.value) || 0;
              const date = form.allocationDate.value;
              const category = form.category.value;
              const notes = form.notes.value.trim();

              const selectedBill = bills.find(b => b._id === billIdVal);
              const orderTitle = selectedBill ? `${selectedBill.billNumber} (${clients.find(c => c._id === selectedBill.clientId)?.name || 'Client'})` : "Specific Order";

              // 1. Add debit record to investment ledger
              const newRec = {
                id: Date.now(),
                investorName: "Owner Capital Allocation",
                date,
                type: "Order Expense Allocation",
                amount: -amount,
                linkedOrder: orderTitle,
                notes: notes || `Owner bought materials/services for ${orderTitle}`,
                mode: "Investment Allocation"
              };
              setInvestmentRecords(prev => [newRec, ...prev]);

              // 2. Automatically log expense entry
              try {
                await addExpenseMutation({
                  billId: billIdVal || undefined,
                  category,
                  amount,
                  description: `[Investment Allocation] ${notes || 'Bought directly from owner investment pool'}`,
                  date
                });
              } catch (err) {}

              alert(`🎉 Capital allocation of ${formatCurrency(amount)} logged for ${orderTitle}!`);
              setIsAllocateOrderModalOpen(false);
            }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
                <div className="form-group">
                  <label htmlFor="alloc-order">Select Production Order / Invoice *</label>
                  <select id="alloc-order" name="billId" required style={{ fontSize: '14px', padding: '10px 12px', borderRadius: '10px', width: '100%' }}>
                    {bills.map(b => {
                      const c = clients.find(cl => cl._id === b.clientId);
                      return (
                        <option key={b._id} value={b._id}>
                          {b.billNumber} — {c ? c.name : 'Unknown Client'} ({formatCurrency(b.subtotal)})
                        </option>
                      );
                    })}
                    {bills.length === 0 && <option value="">INV-2026-001 (Sri Varahi Exports - ₹1,20,000)</option>}
                  </select>
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label htmlFor="alloc-amount">Amount to Allocate (₹) *</label>
                    <input type="number" id="alloc-amount" name="amount" required step="any" placeholder="e.g. 15000" style={{ fontSize: '14px', padding: '10px 12px', borderRadius: '10px', width: '100%', fontWeight: 700 }} />
                  </div>
                  <LinearDatePickerInput 
                    id="alloc-date"
                    name="allocationDate"
                    label="Allocation Date *"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="alloc-cat">Expense Category *</label>
                  <select id="alloc-cat" name="category" required style={{ fontSize: '14px', padding: '10px 12px', borderRadius: '10px', width: '100%' }}>
                    <option value="Materials">Materials & Fabrics</option>
                    <option value="Transportation">Transportation (Auto/Freight)</option>
                    <option value="Petrol">Petrol / Fuel</option>
                    <option value="Employee Salaries">Stitching / Tailor Wages</option>
                    <option value="Operations">Operations / Power</option>
                    <option value="Others">Others / Machine Servicing</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="alloc-notes">Allocation Notes / Description *</label>
                  <input type="text" id="alloc-notes" name="notes" required defaultValue="Owner bought raw materials directly for order" placeholder="e.g. Owner paid auto freight & zippers directly" style={{ fontSize: '14px', padding: '10px 12px', borderRadius: '10px', width: '100%' }} />
                </div>
              </div>

              <div className="modal-footer" style={{ padding: '16px 20px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAllocateOrderModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px', fontWeight: 700, borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <i className="ph ph-check" style={{ fontSize: '16px' }}></i> Confirm Order Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                  <select id="bill-client" required value={billClient} onChange={(e) => handleClientSelectForInvoice(e.target.value)} style={{ fontSize: '15px', padding: '12px 14px' }}>
                    <option value="">-- Choose Client --</option>
                    {clients.map(c => (
                      <option key={c._id} value={c._id}>{c.name} {c.companyName ? `(${c.companyName})` : ''}</option>
                    ))}
                  </select>

                  {/* Autofill Job Banner */}
                  {(() => {
                    const clientObj = clients.find(c => c._id === billClient);
                    const matchedJob = clientObj ? upcomingOrders.find(j => 
                      j.clientName === clientObj.name || 
                      (clientObj.companyName && j.clientName === clientObj.companyName) ||
                      j.clientName?.toLowerCase() === clientObj.name?.toLowerCase()
                    ) : null;

                    if (!matchedJob) return null;

                    return (
                      <div style={{ marginTop: '10px', padding: '12px 14px', backgroundColor: '#F5F3FF', border: '1.5px solid #DDD6FE', borderRadius: '10px', fontSize: '12.5px', color: '#5E6AD2', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <i className="ph ph-magic-wand" style={{ fontSize: '20px', color: '#6E56CF' }}></i>
                        <div>
                          <div style={{ fontWeight: 700 }}>⚡ Autofilled from Production Job Order</div>
                          <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)' }}>
                            Style: <strong>{matchedJob.styleNumber || 'ST-2026-88'}</strong> • Order Qty: <strong>{(matchedJob.orderQty || matchedJob.quantity || 2500).toLocaleString()} Pcs</strong> • Total Valuation: <strong>{formatCurrency(matchedJob.estimatedValue)}</strong>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
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

                {/* Payment Received Status Option (Visible ONLY when Editing Invoice) */}
                {editingBill && (
                  <div className="form-group" style={{ backgroundColor: '#F8FAFC', padding: '12px 16px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <label style={{ marginBottom: '8px', display: 'block', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', color: '#1C1C21' }}>
                      Payment Settlement Status *
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => setBillPaymentStatus('Paid')}
                        style={{
                          padding: '10px 14px',
                          fontSize: '13px',
                          fontWeight: 700,
                          backgroundColor: billPaymentStatus === 'Paid' ? '#10B981' : '#F1F5F9',
                          color: billPaymentStatus === 'Paid' ? '#FFFFFF' : '#475569',
                          border: billPaymentStatus === 'Paid' ? '1px solid #059669' : '1px solid #CBD5E1',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <i className="ph ph-check-circle" style={{ fontSize: '16px' }}></i> Payment Received
                      </button>
                      <button
                        type="button"
                        onClick={() => setBillPaymentStatus('Pending')}
                        style={{
                          padding: '10px 14px',
                          fontSize: '13px',
                          fontWeight: 700,
                          backgroundColor: billPaymentStatus === 'Pending' ? '#F59E0B' : '#F1F5F9',
                          color: billPaymentStatus === 'Pending' ? '#FFFFFF' : '#475569',
                          border: billPaymentStatus === 'Pending' ? '1px solid #D97706' : '1px solid #CBD5E1',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <i className="ph ph-clock-countdown" style={{ fontSize: '16px' }}></i> Payment Pending
                      </button>
                    </div>
                  </div>
                )}

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label htmlFor="bill-shipment-qty">Shipment Quantity (Pcs) *</label>
                    <input 
                      type="number" 
                      id="bill-shipment-qty" 
                      min="1" 
                      required 
                      placeholder="e.g. 2500" 
                      value={billShipmentQty} 
                      onChange={(e) => setBillShipmentQty(e.target.value)} 
                      style={{ fontSize: '15px', padding: '12px 14px', fontWeight: 600 }} 
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="bill-subtotal-input">Taxable Value / Subtotal (₹) *</label>
                    <input type="number" id="bill-subtotal-input" min="0" step="any" required placeholder="0.00" value={billSubtotal} onChange={(e) => handleSubtotalChange(e.target.value)} style={{ fontSize: '15px', padding: '12px 14px', fontWeight: 600 }} />
                  </div>
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
              </div>
              <div className="modal-footer" style={{ padding: '16px 20px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={closeBillModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px', fontWeight: 600 }}>Save Invoice Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== ADD OPERATION PIECE-RATE MODAL ==================== */}
      {isAddPcRateModalOpen && (
        <div className="modal-overlay active" onClick={() => setIsAddPcRateModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3>✂️ Add Garment Operation Piece-Rate</h3>
              <button className="btn-close" onClick={() => setIsAddPcRateModalOpen(false)}><i className="ph ph-x"></i></button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const form = e.target;
              const code = form.code.value.trim().toUpperCase();
              const name = form.name.value.trim();
              const department = form.department.value;
              const ratePerPiece = parseFloat(form.ratePerPiece.value) || 0;
              const targetPerDay = parseInt(form.targetPerDay.value, 10) || 100;
              const assignedRole = form.assignedRole.value.trim();

              const newOp = {
                id: Date.now(),
                code: code || `OP-0${pieceRateOperations.length + 1}`,
                name,
                department,
                ratePerPiece,
                targetPerDay,
                assignedRole: assignedRole || `${department} Specialist`
              };

              setPieceRateOperations(prev => [...prev, newOp]);
              alert(`🎉 Piece-Rate for "${name}" added at ${formatCurrency(ratePerPiece)} / Pc!`);
              setIsAddPcRateModalOpen(false);
            }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                  <div className="form-group">
                    <label htmlFor="pc-code">Op Code *</label>
                    <input type="text" id="pc-code" name="code" required defaultValue={`OP-0${pieceRateOperations.length + 1}`} placeholder="e.g. OP-07" style={{ fontSize: '14px', padding: '10px 12px', borderRadius: '10px' }} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="pc-name">Garment Operation Name *</label>
                    <input type="text" id="pc-name" name="name" required placeholder="e.g. Collar Stitching / Pocket Attachment" style={{ fontSize: '14px', padding: '10px 12px', borderRadius: '10px' }} />
                  </div>
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label htmlFor="pc-dept">Department / Process *</label>
                    <select id="pc-dept" name="department" required style={{ fontSize: '14px', padding: '10px 12px', borderRadius: '10px' }}>
                      <option value="Cutting">Cutting Unit</option>
                      <option value="Stitching">Stitching Floor</option>
                      <option value="Finishing">Finishing & Trimming</option>
                      <option value="Packing">Ironing & Packing</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="pc-rate">Piece Rate (₹ / Pc) *</label>
                    <input type="number" id="pc-rate" name="ratePerPiece" required step="any" placeholder="e.g. 12.50" style={{ fontSize: '14px', padding: '10px 12px', borderRadius: '10px', fontWeight: 700 }} />
                  </div>
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label htmlFor="pc-target">Daily Target (Pcs/Day) *</label>
                    <input type="number" id="pc-target" name="targetPerDay" required defaultValue="150" placeholder="e.g. 150" style={{ fontSize: '14px', padding: '10px 12px', borderRadius: '10px' }} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="pc-role">Assigned Staff Role *</label>
                    <input type="text" id="pc-role" name="assignedRole" required defaultValue="Senior Stitcher" placeholder="e.g. Overlock Operator" style={{ fontSize: '14px', padding: '10px 12px', borderRadius: '10px' }} />
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ padding: '16px 20px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddPcRateModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px', fontWeight: 700, borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <i className="ph ph-check" style={{ fontSize: '16px' }}></i> Save Operation Rate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== PIECE-RATE WAGE CALCULATOR MODAL ==================== */}
      {isCalcPcRateModalOpen && (
        <div className="modal-overlay active" onClick={() => setIsCalcPcRateModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>🧮 Piece-Rate Wage Calculator</h3>
              <button className="btn-close" onClick={() => setIsCalcPcRateModalOpen(false)}><i className="ph ph-x"></i></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
              <div className="form-group">
                <label>Select Garment Operation *</label>
                <select 
                  value={calcSelectedOpId} 
                  onChange={(e) => setCalcSelectedOpId(Number(e.target.value))}
                  style={{ fontSize: '14px', padding: '10px 12px', borderRadius: '10px', width: '100%' }}
                >
                  {pieceRateOperations.map(op => (
                    <option key={op.id} value={op.id}>
                      {op.code} — {op.name} ({formatCurrency(op.ratePerPiece)} / Pc)
                    </option>
                  ))}
                </select>
              </div>

              {(() => {
                const selectedOp = pieceRateOperations.find(op => op.id === calcSelectedOpId) || pieceRateOperations[0];
                const totalWage = (selectedOp?.ratePerPiece || 0) * (calcPcsCount || 0);

                return (
                  <>
                    <div className="form-group">
                      <label>Number of Pieces Completed *</label>
                      <input 
                        type="number" 
                        value={calcPcsCount} 
                        onChange={(e) => setCalcPcsCount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        placeholder="e.g. 250" 
                        style={{ fontSize: '16px', padding: '12px 14px', borderRadius: '10px', width: '100%', fontWeight: 700 }} 
                      />
                    </div>

                    <div style={{ backgroundColor: '#F0FDF4', border: '1.5px solid #10B981', padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Calculated Total Wage</div>
                      <div style={{ fontSize: '28px', fontWeight: 900, color: '#065F46' }}>
                        {formatCurrency(totalWage)}
                      </div>
                      <div style={{ fontSize: '12px', color: '#047857', fontWeight: 500 }}>
                        Formula: {calcPcsCount} Pcs × {formatCurrency(selectedOp?.ratePerPiece || 0)} / Pc
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="modal-footer" style={{ padding: '16px 20px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-primary" onClick={() => setIsCalcPcRateModalOpen(false)}>Done</button>
            </div>
          </div>
        </div>
      )}
      {isCreateJobModalOpen && (
        <div className="modal-overlay active" onClick={() => setIsCreateJobModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px', width: '92%' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'var(--color-accent-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                  <i className={`ph ${editingJobOrder ? 'ph-pencil-simple' : 'ph-plus-circle'}`}></i>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>{editingJobOrder ? 'Job Order Details & Settings' : 'Create New Production Job'}</h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                    {editingJobOrder ? 'View or update specifications, quantities, and piece-rates for this job order.' : 'Job will be added directly to Column 1 (Backlog & Cutting).'}
                  </p>
                </div>
              </div>
              <button className="btn-close" onClick={() => setIsCreateJobModalOpen(false)}><i className="ph ph-x"></i></button>
            </div>

            <form key={editingJobOrder ? editingJobOrder._id : 'new-job-form'} onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target;
              const styleNo = (form.styleNumber?.value || '').trim();
              const clientName = form.clientName?.value || '';
              const deliveryDate = form.deliveryDate?.value || '';
              const priority = form.priority?.value || 'High Priority';
              const notes = form.notes?.value || '';
              const orderQty = parseInt(createJobOrderQty, 10) || 0;
              const shipmentQty = parseInt(createJobShipmentQty, 10) || 0;
              const calcJobTotalCost = createJobCombos.reduce((total, combo) => {
                const pCount = combo.pcsCount || orderQty;
                const customSum = (combo.customRates || []).reduce((s, r) => s + (parseFloat(r.val) || 0), 0);
                const pRate = (parseFloat(combo.powerTableRate !== undefined ? combo.powerTableRate : createJobPowerTableRate) || 0) +
                              (parseFloat(combo.cuttingRate !== undefined ? combo.cuttingRate : createJobCuttingRate) || 0) +
                              (parseFloat(combo.singerRate !== undefined ? combo.singerRate : createJobSingerRate) || 0) +
                              (parseFloat(combo.overlockRate !== undefined ? combo.overlockRate : createJobOverlockRate) || 0) +
                              (parseFloat(combo.checkingRate !== undefined ? combo.checkingRate : createJobCheckingRate) || 0) +
                              (parseFloat(combo.threadRate !== undefined ? combo.threadRate : createJobThreadRate) || 0) +
                              (parseFloat(combo.ironingRate !== undefined ? combo.ironingRate : createJobIroningRate) || 0) +
                              (parseFloat(combo.packingRate !== undefined ? combo.packingRate : createJobPackingRate) || 0) +
                              customSum;
                return total + Math.round(pCount * pRate);
              }, 0);

              if (editingJobOrder) {
                // Update existing job order
                const updatedJob = {
                  ...editingJobOrder,
                  orderTitle: styleNo ? `Style ${styleNo}` : editingJobOrder.orderTitle,
                  styleNumber: styleNo,
                  clientName: clientName,
                  quantity: orderQty,
                  orderQty: orderQty,
                  shipmentQty: shipmentQty,
                  deliveryDate: deliveryDate,
                  priority: priority,
                  productionUnit: editingJobOrder?.productionUnit || 'Cutting Unit A',
                  estimatedValue: calcJobTotalCost,
                  assignedWorker: editingJobOrder?.assignedWorker || 'Factory Team',
                  notes: notes,
                  comboType: createJobComboType,
                  combos: createJobCombos,
                  powerTableRate: parseFloat(createJobPowerTableRate) || 0,
                  cuttingRate: parseFloat(createJobCuttingRate) || 0,
                  singerRate: parseFloat(createJobSingerRate) || 0,
                  overlockRate: parseFloat(createJobOverlockRate) || 0,
                  checkingRate: parseFloat(createJobCheckingRate) || 0,
                  threadRate: parseFloat(createJobThreadRate) || 0,
                  ironingRate: parseFloat(createJobIroningRate) || 0,
                  packingRate: parseFloat(createJobPackingRate) || 0,
                };

                setCustomLocalJobs(prev => prev.map(j => j._id === editingJobOrder._id ? updatedJob : j));
              } else {
                // Create new job order
                const newJob = {
                  _id: `job-${Date.now()}`,
                  orderTitle: styleNo ? `Style ${styleNo}` : 'Custom Production Job',
                  styleNumber: styleNo,
                  product: styleNo ? `Style ${styleNo}` : 'Garment Batch',
                  clientName: clientName,
                  quantity: orderQty,
                  orderQty: orderQty,
                  shipmentQty: shipmentQty,
                  deliveryDate: deliveryDate,
                  priority: priority,
                  productionUnit: 'Cutting Unit A',
                  estimatedValue: calcJobTotalCost,
                  assignedWorker: 'Factory Team',
                  status: "Pending",
                  stage: "Backlog & Cutting",
                  notes: notes,
                  comboType: createJobComboType,
                  combos: createJobCombos,
                  powerTableRate: parseFloat(createJobPowerTableRate) || 0,
                  cuttingRate: parseFloat(createJobCuttingRate) || 0,
                  singerRate: parseFloat(createJobSingerRate) || 0,
                  overlockRate: parseFloat(createJobOverlockRate) || 0,
                  checkingRate: parseFloat(createJobCheckingRate) || 0,
                  threadRate: parseFloat(createJobThreadRate) || 0,
                  ironingRate: parseFloat(createJobIroningRate) || 0,
                  packingRate: parseFloat(createJobPackingRate) || 0,
                };

                setCustomLocalJobs(prev => [newJob, ...prev]);
              }

              setIsCreateJobModalOpen(false);
            }}>
              <div className="modal-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Row 1: Style Number & Customer */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label style={{ fontWeight: 600 }}>Style Number *</label>
                    <input type="text" name="styleNumber" required defaultValue={editingJobOrder?.styleNumber || ''} placeholder="e.g. ST-2026-88" style={{ fontSize: '14px', padding: '10px 12px', borderRadius: '10px' }} />
                  </div>
                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ fontWeight: 600, margin: 0 }}>Customer / Buyer *</label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreateJobModalOpen(false);
                          setActiveTab('clients');
                          setIsClientModalOpen(true);
                        }}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          color: 'var(--color-primary)',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: 0
                        }}
                        title="Go to Clients Page to Register a New Buyer"
                      >
                        <i className="ph ph-user-plus"></i> Register Client
                      </button>
                    </div>
                    <select
                      name="clientName"
                      required
                      defaultValue={editingJobOrder?.clientName || ''}
                      onChange={(e) => {
                        if (e.target.value === 'REGISTER_NEW_CLIENT') {
                          setIsCreateJobModalOpen(false);
                          setActiveTab('clients');
                          setIsClientModalOpen(true);
                        }
                      }}
                      style={{ fontSize: '14px', padding: '10px 12px', borderRadius: '10px', width: '100%' }}
                    >
                      <option value="">-- Select Registered Client --</option>
                      {clients.map(c => (
                        <option key={c._id} value={c.name}>
                          {c.name} {c.companyName ? `(${c.companyName})` : ''}
                        </option>
                      ))}
                      <option value="REGISTER_NEW_CLIENT" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                        ➕ Register New Client (Redirect to Clients Page)...
                      </option>
                    </select>
                  </div>
                </div>

                {/* Row 2: Order Qty & Due Date */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label style={{ fontWeight: 600 }}>Order Qty (Pieces) *</label>
                    <input 
                      type="number" 
                      name="orderQty" 
                      required 
                      value={createJobOrderQty} 
                      onChange={(e) => setCreateJobOrderQty(e.target.value)}
                      placeholder="e.g. 2500" 
                      style={{ fontSize: '14px', padding: '10px 12px', borderRadius: '10px' }} 
                    />
                  </div>
                  <LinearDatePickerInput 
                    id="job-target-due-date"
                    name="deliveryDate"
                    label="Target Due Date *"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                {/* Row 3: Priority */}
                <div className="form-group">
                  <label style={{ fontWeight: 600 }}>Order Priority *</label>
                  <select name="priority" defaultValue={editingJobOrder?.priority || "High Priority"} style={{ fontSize: '14px', padding: '10px 12px', borderRadius: '10px', width: '100%' }}>
                    <option value="Normal">🟢 Normal Priority</option>
                    <option value="High Priority">🟠 High Priority</option>
                    <option value="Urgent Dispatch">🔴 Urgent Dispatch</option>
                  </select>
                </div>

                {/* Garment Combo Set & Color Specifications Section */}
                <div style={{ marginTop: '10px', padding: '14px', borderRadius: '12px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <label style={{ margin: 0, fontWeight: 700, fontSize: '13.5px', color: '#111827', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="ph ph-t-shirt" style={{ color: '#4F46E5', fontSize: '18px' }}></i> Garment Combo Set & Color Breakdown
                    </label>
                    <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#4F46E5', backgroundColor: '#EEF2FF', border: '1px solid #C7D2FE', padding: '3px 10px', borderRadius: '8px', fontFamily: 'var(--font-mono)' }}>
                      {createJobCombos.length} Combo Parts • Total: {createJobCombos.reduce((sum, c) => sum + (parseInt(c.pcsCount, 10) || 0), 0).toLocaleString()} Pcs
                    </span>
                  </div>

                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#4B5563' }}>Choose Combo Preset *</label>
                    <select
                      value={createJobComboType}
                      onChange={(e) => handleComboTypeChange(e.target.value)}
                      style={{ fontSize: '13.5px', padding: '9px 12px', borderRadius: '8px', width: '100%', backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1' }}
                    >
                      <option value="2-Piece Combo (Top & Pant)">👕👖 2-Piece Combo (e.g. Top & Pant)</option>
                      <option value="Single Garment">👕 Single Garment (e.g. Top / Shirt / Pant)</option>
                      <option value="3-Piece Set (Top, Pant, Dupatta)">👗 3-Piece Set (e.g. Top, Pant, Dupatta)</option>
                      <option value="Custom Combo Set">✨ Custom Combo Set</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {createJobCombos.map((combo, idx) => (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 110px auto', gap: '10px', alignItems: 'center', backgroundColor: '#FFFFFF', padding: '10px 12px', borderRadius: '10px', border: '1px solid #E5E7EB' }}>
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', display: 'block', marginBottom: '4px' }}>Combo Part {idx + 1}</label>
                          <input
                            type="text"
                            value={combo.partName}
                            onChange={(e) => handleComboPartChange(idx, 'partName', e.target.value)}
                            placeholder="e.g. Top, Pant, Kurti"
                            style={{ fontSize: '13px', padding: '7px 10px', borderRadius: '6px', border: '1px solid #D1D5DB', width: '100%' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', display: 'block', marginBottom: '4px' }}>Color Selection</label>
                          <input
                            type="text"
                            value={combo.color}
                            onChange={(e) => handleComboPartChange(idx, 'color', e.target.value)}
                            placeholder="e.g. Navy Blue, Black"
                            style={{ fontSize: '13px', padding: '7px 10px', borderRadius: '6px', border: '1px solid #D1D5DB', width: '100%' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', display: 'block', marginBottom: '4px' }}>Pcs Count</label>
                          <input
                            type="number"
                            value={combo.pcsCount || ''}
                            onChange={(e) => handleComboPartChange(idx, 'pcsCount', parseInt(e.target.value, 10) || 0)}
                            placeholder="e.g. 1250"
                            style={{ fontSize: '13px', padding: '7px 10px', borderRadius: '6px', border: '1px solid #D1D5DB', width: '100%', fontWeight: 700, fontFamily: 'var(--font-mono)' }}
                          />
                        </div>
                        <div style={{ paddingTop: '16px' }}>
                          {createJobCombos.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveComboPart(idx)}
                              style={{ border: 'none', background: '#FEE2E2', color: '#EF4444', borderRadius: '6px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                              title="Remove Item"
                            >
                              <i className="ph ph-trash" style={{ fontSize: '14px' }}></i>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: '10px', textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={handleAddComboPart}
                      style={{ border: 'none', background: 'transparent', color: '#4F46E5', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <i className="ph ph-plus-circle"></i> + Add Custom Combo Item
                    </button>
                  </div>
                </div>

                {/* Job Operation Piece-Rates Section */}
                <div style={{ marginTop: '4px', paddingTop: '14px', borderTop: '1px dashed var(--color-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                    <label style={{ margin: 0, fontWeight: 700, fontSize: '13.5px', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="ph ph-scissors"></i> Job Piece-Rates per Garment Part
                    </label>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {createJobCombos.map((combo, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveComboRateTab(idx)}
                          style={{
                            padding: '5px 12px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 700,
                            border: activeComboRateTab === idx ? '1px solid #4F46E5' : '1px solid #E5E7EB',
                            backgroundColor: activeComboRateTab === idx ? '#4F46E5' : '#FFFFFF',
                            color: activeComboRateTab === idx ? '#FFFFFF' : '#374151',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {combo.partName || `Part ${idx+1}`} Rates
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Active Combo Part Rates Card */}
                  {(() => {
                    const currentComboIndex = Math.min(activeComboRateTab, createJobCombos.length - 1);
                    const activeCombo = createJobCombos[currentComboIndex] || createJobCombos[0] || {};
                    
                    const getItemRate = (field, fallback) => activeCombo[field] !== undefined ? activeCombo[field] : fallback;

                    const customRatesList = activeCombo.customRates || [];
                    const customRatesSum = customRatesList.reduce((sum, r) => sum + (parseFloat(r.val) || 0), 0);

                    const activePartTotalRate = (
                      (parseFloat(getItemRate('powerTableRate', createJobPowerTableRate)) || 0) +
                      (parseFloat(getItemRate('cuttingRate', createJobCuttingRate)) || 0) +
                      (parseFloat(getItemRate('singerRate', createJobSingerRate)) || 0) +
                      (parseFloat(getItemRate('overlockRate', createJobOverlockRate)) || 0) +
                      (parseFloat(getItemRate('checkingRate', createJobCheckingRate)) || 0) +
                      (parseFloat(getItemRate('threadRate', createJobThreadRate)) || 0) +
                      (parseFloat(getItemRate('ironingRate', createJobIroningRate)) || 0) +
                      (parseFloat(getItemRate('packingRate', createJobPackingRate)) || 0) +
                      customRatesSum
                    );

                    return (
                      <div style={{ backgroundColor: '#F9FAFB', padding: '14px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                          <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#111827' }}>
                            Piece-Rates for: <strong style={{ color: '#4F46E5' }}>{activeCombo.partName || `Part ${currentComboIndex + 1}`}</strong> ({activeCombo.color || 'Standard'} • {(activeCombo.pcsCount || createJobOrderQty).toLocaleString()} Pcs)
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            {createJobCombos.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleCopyRatesToAllCombos(currentComboIndex)}
                                style={{
                                  fontSize: '11.5px',
                                  fontWeight: 700,
                                  color: '#4F46E5',
                                  backgroundColor: '#EEF2FF',
                                  border: '1px solid #C7D2FE',
                                  padding: '4px 10px',
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px'
                                }}
                                title={`Copy ${activeCombo.partName || 'current part'} rates to all other combo parts`}
                              >
                                <i className="ph ph-copy"></i> Apply Same Rates to All Parts
                              </button>
                            )}
                            <span style={{ fontSize: '12px', fontWeight: 800, color: '#059669', backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', padding: '3px 10px', borderRadius: '10px', fontFamily: 'var(--font-mono)' }}>
                              {activeCombo.partName || `Part ${currentComboIndex + 1}`} Total: ₹{activePartTotalRate.toFixed(2)} / Pc
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div className="form-group">
                            <label style={{ fontSize: '12px', fontWeight: 600 }}>Power Table Rate (₹ / Pc)</label>
                            <input 
                              type="number" 
                              step="any" 
                              placeholder="e.g. 12.00" 
                              value={getItemRate('powerTableRate', createJobPowerTableRate)}
                              onChange={(e) => handleComboPartChange(currentComboIndex, 'powerTableRate', parseFloat(e.target.value) || 0)}
                              style={{ fontSize: '13.5px', padding: '8px 10px', borderRadius: '8px', backgroundColor: '#FFFFFF' }} 
                            />
                          </div>

                          <div className="form-group">
                            <label style={{ fontSize: '12px', fontWeight: 600 }}>Cutting Rate (₹ / Pc)</label>
                            <input 
                              type="number" 
                              step="any" 
                              placeholder="e.g. 3.50" 
                              value={getItemRate('cuttingRate', createJobCuttingRate)}
                              onChange={(e) => handleComboPartChange(currentComboIndex, 'cuttingRate', parseFloat(e.target.value) || 0)}
                              style={{ fontSize: '13.5px', padding: '8px 10px', borderRadius: '8px', backgroundColor: '#FFFFFF' }} 
                            />
                          </div>

                          <div className="form-group">
                            <label style={{ fontSize: '12px', fontWeight: 600 }}>Singer Machine Rate (₹ / Pc)</label>
                            <input 
                              type="number" 
                              step="any" 
                              placeholder="e.g. 8.50" 
                              value={getItemRate('singerRate', createJobSingerRate)}
                              onChange={(e) => handleComboPartChange(currentComboIndex, 'singerRate', parseFloat(e.target.value) || 0)}
                              style={{ fontSize: '13.5px', padding: '8px 10px', borderRadius: '8px', backgroundColor: '#FFFFFF' }} 
                            />
                          </div>

                          <div className="form-group">
                            <label style={{ fontSize: '12px', fontWeight: 600 }}>Transport Rate (₹ / Pc)</label>
                            <input 
                              type="number" 
                              step="any" 
                              placeholder="e.g. 4.50" 
                              value={getItemRate('overlockRate', createJobOverlockRate)}
                              onChange={(e) => handleComboPartChange(currentComboIndex, 'overlockRate', parseFloat(e.target.value) || 0)}
                              style={{ fontSize: '13.5px', padding: '8px 10px', borderRadius: '8px', backgroundColor: '#FFFFFF' }} 
                            />
                          </div>

                          <div className="form-group">
                            <label style={{ fontSize: '12px', fontWeight: 600 }}>Checking Rate (₹ / Pc)</label>
                            <input 
                              type="number" 
                              step="any" 
                              placeholder="e.g. 2.00" 
                              value={getItemRate('checkingRate', createJobCheckingRate)}
                              onChange={(e) => handleComboPartChange(currentComboIndex, 'checkingRate', parseFloat(e.target.value) || 0)}
                              style={{ fontSize: '13.5px', padding: '8px 10px', borderRadius: '8px', backgroundColor: '#FFFFFF' }} 
                            />
                          </div>

                          <div className="form-group">
                            <label style={{ fontSize: '12px', fontWeight: 600 }}>Thread Trimming Rate (₹ / Pc)</label>
                            <input 
                              type="number" 
                              step="any" 
                              placeholder="e.g. 1.50" 
                              value={getItemRate('threadRate', createJobThreadRate)}
                              onChange={(e) => handleComboPartChange(currentComboIndex, 'threadRate', parseFloat(e.target.value) || 0)}
                              style={{ fontSize: '13.5px', padding: '8px 10px', borderRadius: '8px', backgroundColor: '#FFFFFF' }} 
                            />
                          </div>

                          <div className="form-group">
                            <label style={{ fontSize: '12px', fontWeight: 600 }}>Ironing Rate (₹ / Pc)</label>
                            <input 
                              type="number" 
                              step="any" 
                              placeholder="e.g. 3.00" 
                              value={getItemRate('ironingRate', createJobIroningRate)}
                              onChange={(e) => handleComboPartChange(currentComboIndex, 'ironingRate', parseFloat(e.target.value) || 0)}
                              style={{ fontSize: '13.5px', padding: '8px 10px', borderRadius: '8px', backgroundColor: '#FFFFFF' }} 
                            />
                          </div>

                          <div className="form-group">
                            <label style={{ fontSize: '12px', fontWeight: 600 }}>Packing Rate (₹ / Pc)</label>
                            <input 
                              type="number" 
                              step="any" 
                              placeholder="e.g. 2.50" 
                              value={getItemRate('packingRate', createJobPackingRate)}
                              onChange={(e) => handleComboPartChange(currentComboIndex, 'packingRate', parseFloat(e.target.value) || 0)}
                              style={{ fontSize: '13.5px', padding: '8px 10px', borderRadius: '8px', backgroundColor: '#FFFFFF' }} 
                            />
                          </div>
                        </div>

                        {/* Custom Operation Rates for Active Combo Part */}
                        {customRatesList.length > 0 && (
                          <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#4B5563', textTransform: 'uppercase' }}>Custom Operation Rates for {activeCombo.partName}:</div>
                            {customRatesList.map((rateObj, rIdx) => (
                              <div key={rIdx} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr auto', gap: '8px', alignItems: 'center' }}>
                                <input 
                                  type="text" 
                                  value={rateObj.name} 
                                  onChange={(e) => handleUpdateCustomRateInCombo(currentComboIndex, rIdx, 'name', e.target.value)}
                                  placeholder="e.g. Washing / Embroidery" 
                                  style={{ fontSize: '12.5px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #D1D5DB', backgroundColor: '#FFFFFF' }} 
                                />
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <span style={{ fontSize: '12px', color: '#6B7280' }}>₹/Pc:</span>
                                  <input 
                                    type="number" 
                                    step="any" 
                                    value={rateObj.val} 
                                    onChange={(e) => handleUpdateCustomRateInCombo(currentComboIndex, rIdx, 'val', parseFloat(e.target.value) || 0)}
                                    placeholder="e.g. 5.00" 
                                    style={{ fontSize: '12.5px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #D1D5DB', backgroundColor: '#FFFFFF', width: '100%', fontWeight: 700, fontFamily: 'var(--font-mono)' }} 
                                  />
                                </div>
                                <button 
                                  type="button" 
                                  onClick={() => handleRemoveCustomRateFromCombo(currentComboIndex, rIdx)}
                                  style={{ border: 'none', background: '#FEE2E2', color: '#EF4444', borderRadius: '6px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                  title="Remove Custom Rate"
                                >
                                  <i className="ph ph-x"></i>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        <div style={{ marginTop: '12px', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => handleAddCustomRateToCombo(currentComboIndex)}
                            style={{ border: 'none', background: 'transparent', color: '#4F46E5', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <i className="ph ph-plus-circle"></i> + Add Custom Operation Rate to {activeCombo.partName || `Part ${currentComboIndex + 1}`}
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Dynamic Custom Rates List for Job */}
                  {jobCustomRatesList.length > 0 && (
                    <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {jobCustomRatesList.map((rateObj, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', fontWeight: 600, minWidth: '130px', color: 'var(--color-text-secondary)' }}>{rateObj.name} (₹/Pc):</span>
                          <input 
                            type="number" 
                            step="any"
                            value={rateObj.val} 
                            onChange={(e) => {
                              const val = e.target.value;
                              setJobCustomRatesList(prev => prev.map((r, i) => i === idx ? { ...r, val } : r));
                            }} 
                            style={{ fontSize: '13px', padding: '7px 10px', borderRadius: '8px', flex: 1 }} 
                          />
                          <button type="button" className="btn-icon text-red" onClick={() => setJobCustomRatesList(prev => prev.filter((_, i) => i !== idx))}>
                            <i className="ph ph-x"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Inline Custom Rate Add Box */}
                  {isJobCustomRateActive && (
                    <div style={{ marginTop: '10px', padding: '10px', backgroundColor: 'var(--color-muted)', borderRadius: '10px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input 
                        type="text" 
                        placeholder="Custom Rate Name (e.g. Ironing Rate, Pocket Rate)" 
                        value={jobCustomRateNameInput}
                        onChange={(e) => setJobCustomRateNameInput(e.target.value)}
                        style={{ fontSize: '12.5px', padding: '8px 10px', flex: 2, borderRadius: '8px', border: '1px solid var(--color-border)' }}
                      />
                      <input 
                        type="number" 
                        step="any"
                        placeholder="Rate (₹)" 
                        value={jobCustomRateValInput}
                        onChange={(e) => setJobCustomRateValInput(e.target.value)}
                        style={{ fontSize: '12.5px', padding: '8px 10px', flex: 1, borderRadius: '8px', border: '1px solid var(--color-border)' }}
                      />
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => {
                          if (jobCustomRateNameInput.trim() && jobCustomRateValInput) {
                            setJobCustomRatesList(prev => [...prev, { name: jobCustomRateNameInput.trim(), val: parseFloat(jobCustomRateValInput) || 0 }]);
                            setJobCustomRateNameInput('');
                            setJobCustomRateValInput('');
                            setIsJobCustomRateActive(false);
                          }
                        }}
                        style={{ padding: '8px 12px', fontSize: '12px', whiteSpace: 'nowrap' }}
                      >
                        <i className="ph ph-check"></i> Add Rate
                      </button>
                    </div>
                  )}
                </div>

                {/* Row 5: Notes & Fabric Specifications */}
                <div className="form-group">
                  <label style={{ fontWeight: 600 }}>Production Notes & Fabric Specifications</label>
                  <textarea name="notes" rows="2" defaultValue={editingJobOrder?.notes || ''} placeholder="e.g. Requires 220 GSM Combed Cotton fabric. Double-needle stitch on collar." style={{ fontSize: '13.5px', padding: '10px 12px', borderRadius: '10px' }} />
                </div>
              </div>

              <div className="modal-footer" style={{ padding: '16px 20px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                {(() => {
                  const totalRatePerPc = (parseFloat(createJobPowerTableRate) || 0) + 
                                         (parseFloat(createJobCuttingRate) || 0) + 
                                         (parseFloat(createJobSingerRate) || 0) + 
                                         (parseFloat(createJobOverlockRate) || 0) + 
                                         (parseFloat(createJobCheckingRate) || 0) + 
                                         (parseFloat(createJobThreadRate) || 0) + 
                                         (parseFloat(createJobIroningRate) || 0) + 
                                         (parseFloat(createJobPackingRate) || 0) + 
                                         jobCustomRatesList.reduce((sum, r) => sum + (parseFloat(r.val) || 0), 0);
                  const orderQty = parseInt(createJobOrderQty, 10) || 0;
                  const shipmentQty = parseInt(createJobShipmentQty, 10) || 0;
                  const calcTotalJobCost = Math.round(orderQty * totalRatePerPc);

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Total Job Value
                      </span>
                      <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>
                        {formatCurrency(calcTotalJobCost)} <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>({orderQty.toLocaleString()} Pcs | Ship: {shipmentQty.toLocaleString()} Pcs @ {formatCurrency(totalRatePerPc)}/Pc)</span>
                      </span>
                    </div>
                  );
                })()}

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setIsCreateJobModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px', fontWeight: 700, borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <i className="ph ph-rocket-launch" style={{ fontSize: '16px' }}></i> Create & Launch Production Job
                  </button>
                </div>
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
                <div className="form-row" style={{ alignItems: 'flex-start' }}>
                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label htmlFor="employee-role" style={{ margin: 0 }}>Staff Role *</label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomRoleActive(!isCustomRoleActive);
                          if (!isCustomRoleActive) {
                            setSelectedStaffRole("ADD_CUSTOM");
                          }
                        }}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          color: 'var(--color-primary)',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: 0
                        }}
                      >
                        <i className={`ph ${isCustomRoleActive ? 'ph-list' : 'ph-plus-circle'}`}></i>
                        {isCustomRoleActive ? 'Select Existing Role' : 'Add Custom Role'}
                      </button>
                    </div>

                    {!isCustomRoleActive ? (
                      <select 
                        id="employee-role" 
                        required 
                        value={selectedStaffRole}
                        onChange={(e) => {
                          if (e.target.value === 'ADD_CUSTOM') {
                            setIsCustomRoleActive(true);
                          } else {
                            setSelectedStaffRole(e.target.value);
                          }
                        }}
                        style={{ fontSize: '14px', padding: '12px 14px', width: '100%', borderRadius: '10px' }}
                      >
                        {customStaffRoles.map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                        <option value="ADD_CUSTOM">✏️ + Add Custom Role...</option>
                      </select>
                    ) : (
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <input 
                          type="text"
                          id="employee-custom-role-input"
                          required
                          placeholder="e.g. Quality Auditor, CAD Master..."
                          value={customRoleInputVal}
                          onChange={(e) => setCustomRoleInputVal(e.target.value)}
                          style={{ fontSize: '13.5px', padding: '10px 12px', flex: 1, borderRadius: '10px', border: '1.5px solid var(--color-primary)' }}
                        />
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => {
                            if (customRoleInputVal.trim()) {
                              const newRole = customRoleInputVal.trim();
                              if (!customStaffRoles.includes(newRole)) {
                                setCustomStaffRoles(prev => [...prev, newRole]);
                              }
                              setSelectedStaffRole(newRole);
                              setIsCustomRoleActive(false);
                              setCustomRoleInputVal("");
                            }
                          }}
                          style={{ padding: '10px 14px', fontSize: '12px', fontWeight: 700, borderRadius: '10px', whiteSpace: 'nowrap' }}
                        >
                          Add
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="employee-subcategory">Sub Category / Specialization</label>
                    <input type="text" id="employee-subcategory" placeholder="e.g. Singer / Overlock / Flatlock" />
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
                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <LinearDatePickerInput 
                    id="expense-date"
                    name="expenseDate"
                    label="Expense Date *"
                    defaultValue={editingExpense ? editingExpense.date : new Date().toISOString().split('T')[0]}
                    required
                  />
                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label htmlFor="expense-category" style={{ margin: 0 }}>Category *</label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomExpenseCatActive(!isCustomExpenseCatActive);
                          if (!isCustomExpenseCatActive) {
                            setSelectedExpenseCat("ADD_CUSTOM");
                          }
                        }}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          color: 'var(--color-primary)',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: 0
                        }}
                      >
                        <i className={`ph ${isCustomExpenseCatActive ? 'ph-list' : 'ph-plus-circle'}`}></i>
                        {isCustomExpenseCatActive ? 'Select Existing Category' : 'Add Custom Category'}
                      </button>
                    </div>

                    {!isCustomExpenseCatActive ? (
                      <select 
                        id="expense-category" 
                        required 
                        value={selectedExpenseCat}
                        onChange={(e) => {
                          if (e.target.value === 'ADD_CUSTOM') {
                            setIsCustomExpenseCatActive(true);
                          } else {
                            setSelectedExpenseCat(e.target.value);
                          }
                        }}
                        style={{ fontSize: '14px', padding: '11px 14px', width: '100%', borderRadius: '10px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                      >
                        {customExpenseCategories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                        <option value="ADD_CUSTOM">✏️ + Add Custom Category...</option>
                      </select>
                    ) : (
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <input 
                          type="text"
                          id="expense-custom-category-input"
                          required
                          placeholder="e.g. Machine Servicing, Factory Rent..."
                          value={customExpenseCatInputVal}
                          onChange={(e) => setCustomExpenseCatInputVal(e.target.value)}
                          style={{ fontSize: '13.5px', padding: '9px 12px', flex: 1, borderRadius: '10px', border: '1.5px solid var(--color-primary)' }}
                        />
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => {
                            if (customExpenseCatInputVal.trim()) {
                              const newCat = customExpenseCatInputVal.trim();
                              if (!customExpenseCategories.includes(newCat)) {
                                setCustomExpenseCategories(prev => [...prev, newCat]);
                              }
                              setSelectedExpenseCat(newCat);
                              setIsCustomExpenseCatActive(false);
                              setCustomExpenseCatInputVal('');
                            }
                          }}
                          style={{ padding: '8px 12px', fontSize: '12px', whiteSpace: 'nowrap' }}
                        >
                          <i className="ph ph-check"></i> Add
                        </button>
                      </div>
                    )}
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
              <div className="modal-header-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {(() => {
                  const isPaid = (viewingInvoice.paymentStatus === 'Paid' || viewingInvoice.status === 'Paid');
                  return (
                    <button
                      type="button"
                      onClick={() => toggleBillPaymentStatus(viewingInvoice)}
                      title="Click to toggle payment status"
                      style={{
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: 700,
                        backgroundColor: isPaid ? '#ECFDF5' : '#FFFBEB',
                        color: isPaid ? '#047857' : '#B45309',
                        border: isPaid ? '1px solid #A7F3D0' : '1px solid #FDE68A',
                        borderRadius: '8px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      <i className={`ph ${isPaid ? 'ph-check-circle' : 'ph-clock-countdown'}`} style={{ fontSize: '15px' }}></i>
                      {isPaid ? '✓ Payment Received' : '⏳ Mark Payment Received'}
                    </button>
                  );
                })()}
                <button className="btn btn-primary" onClick={() => window.print()}>
                  <i className="ph ph-printer"></i> Print / Download PDF
                </button>
                <button className="btn-close" onClick={() => { setIsInvoiceViewOpen(false); setViewingInvoice(null); }}><i className="ph ph-x"></i></button>
              </div>
            </div>
            <div className="modal-body print-area" id="print-area">
              <div className="invoice-printout" style={{ padding: '20px', fontFamily: "'Inter', sans-serif", color: '#000', backgroundColor: '#fff', border: '1px solid #000', maxWidth: '800px', margin: '0 auto', boxShadow: 'none', borderRadius: 0, position: 'relative' }}>
                
                {/* Document Title Header with Payment Status Stamp */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #000', paddingBottom: '6px', marginBottom: 0 }}>
                  <div style={{ fontWeight: 'bold', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', color: '#000' }}>
                    Tax Invoice
                  </div>
                  {(() => {
                    const isPaid = (viewingInvoice.paymentStatus === 'Paid' || viewingInvoice.status === 'Paid');
                    if (!isPaid) return null;
                    return (
                      <div style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        color: '#047857',
                        border: '1.5px solid #047857',
                        padding: '2px 8px',
                        borderRadius: '4px'
                      }}>
                        ✓ PAYMENT RECEIVED
                      </div>
                    );
                  })()}
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
                    {viewingInvoice.items.map((item, idx) => {
                      const shipQty = viewingInvoice.shipmentQty || item.qty || 2500;
                      const ratePerPc = item.price > 0 && shipQty > 0 ? (item.price / shipQty) : item.price;
                      return (
                        <tr key={idx}>
                          <td style={{ borderRight: '1px solid #000', padding: '6px', textAlign: 'center' }}>{idx + 1}</td>
                          <td style={{ borderRight: '1px solid #000', padding: '6px', fontWeight: 500 }}>{item.name}</td>
                          <td style={{ borderRight: '1px solid #000', padding: '6px', textAlign: 'center' }}>6205</td>
                          <td style={{ borderRight: '1px solid #000', padding: '6px', textAlign: 'center' }}>{viewingInvoice.billType === 'with-gst' ? item.gstRate + '%' : '0%'}</td>
                          <td style={{ borderRight: '1px solid #000', padding: '6px', textAlign: 'right', fontWeight: 'bold' }}>{shipQty.toLocaleString()} pcs</td>
                          <td style={{ borderRight: '1px solid #000', padding: '6px', textAlign: 'right' }}>{ratePerPc.toFixed(2)}</td>
                          <td style={{ borderRight: '1px solid #000', padding: '6px', textAlign: 'center' }}>pcs</td>
                          <td style={{ padding: '6px', textAlign: 'right', fontWeight: 'bold' }}>{item.price.toFixed(2)}</td>
                        </tr>
                      );
                    })}

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
            <form onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target;
              const empName = form.empName.value;
              const status = form.status.value;
              const shift = form.shift.value;
              const checkIn = form.checkIn.value;
              const date = form.date.value;

              const targetEmp = employees.find(emp => emp.name === empName);

              const newRecord = {
                _id: 'att_' + Date.now(),
                employeeId: targetEmp ? targetEmp._id : undefined,
                empName,
                role: targetEmp ? targetEmp.role : 'Stitcher',
                shift,
                checkIn,
                status,
                date,
                overtimeHours: status.includes('Overtime') ? 2 : 0
              };

              setLocalAttendance(prev => [newRecord, ...prev]);
              try {
                if (addAttendanceMutation) {
                  await addAttendanceMutation({
                    employeeId: targetEmp ? targetEmp._id : undefined,
                    empName,
                    date,
                    shift,
                    status,
                    overtimeHours: status.includes('Overtime') ? 2 : 0
                  });
                }
              } catch (err) {
                console.warn("Convex add attendance fallback:", err);
              }
              setIsAttendanceModalOpen(false);
            }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label>Select Employee / Crew Member *</label>
                  <select name="empName" required>
                    {employees.map(e => (
                      <option key={e._id} value={e.name}>{e.name} ({e.role})</option>
                    ))}
                    {employees.length === 0 && <option value="Balasubramainan">Balasubramainan (CEO)</option>}
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
              const validJobOrders = linkedJobOrdersList.filter(Boolean);
              const linkedJobOrders = validJobOrders.join(', ');
              const linkedClient = form.linkedClient?.value || '';

              const newAdv = {
                id: Date.now(),
                empName,
                date,
                type,
                amount,
                mode,
                linkedJobOrders: validJobOrders,
                linkedJobOrder: linkedJobOrders,
                linkedClient,
                notes
              };

              setAdvanceRecords(prev => [newAdv, ...prev]);

              // Automatically log as expense entry
              try {
                const linkMeta = [linkedJobOrders, linkedClient].filter(Boolean).join(' • ');
                await addExpenseMutation({
                  category: "Employee Salary Advances",
                  amount: amount,
                  description: `${type} for ${empName} ${linkMeta ? `[${linkMeta}]` : ''} (${notes || 'Advance payment'})`,
                  date
                });
              } catch (err) {}

              setIsAdvanceModalOpen(false);
            }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label>Select Employee *</label>
                  <select name="empName" required>
                    {employees.map(e => (
                      <option key={e._id} value={e.name}>{e.name} ({e.role})</option>
                    ))}
                    {employees.length === 0 && <option value="Balasubramainan">Balasubramainan (CEO)</option>}
                  </select>
                </div>

                {/* Job Orders Dynamic Dropdowns & Client Linking Options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontWeight: 600, margin: 0 }}>Link to Production Job Order / Style (Optional)</label>
                    <button
                      type="button"
                      onClick={() => setLinkedJobOrdersList(prev => [...prev, ''])}
                      style={{ border: 'none', background: 'transparent', color: '#4F46E5', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <i className="ph ph-plus-circle"></i> + Add Another Job Order
                    </button>
                  </div>

                  {linkedJobOrdersList.map((jobVal, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <select 
                        value={jobVal}
                        onChange={(e) => {
                          const val = e.target.value;
                          setLinkedJobOrdersList(prev => prev.map((item, i) => i === idx ? val : item));
                          const foundJob = customLocalJobs.find(j => (j.styleNumber ? `Style ${j.styleNumber}` : j.orderTitle) === val);
                          if (foundJob && foundJob.clientName && !advSelectedClient) {
                            setAdvSelectedClient(foundJob.clientName);
                          }
                        }}
                        style={{ fontSize: '13.5px', padding: '10px 12px', borderRadius: '10px', width: '100%', flex: 1 }}
                      >
                        <option value="">{idx === 0 ? '-- Select Linked Job Order (General Advance) --' : `-- Select Additional Job Order ${idx + 1} --`}</option>
                        {customLocalJobs.map(j => {
                          const title = j.styleNumber ? `Style ${j.styleNumber}` : j.orderTitle;
                          return (
                            <option key={j._id} value={title}>
                              📦 {title} {j.clientName ? `(${j.clientName})` : ''} — {(j.orderQty || j.quantity || 0).toLocaleString()} Pcs
                            </option>
                          );
                        })}
                      </select>
                      {linkedJobOrdersList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setLinkedJobOrdersList(prev => prev.filter((_, i) => i !== idx))}
                          style={{ border: 'none', background: '#FEE2E2', color: '#EF4444', borderRadius: '8px', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                          title="Remove Job Order"
                        >
                          <i className="ph ph-trash" style={{ fontSize: '14px' }}></i>
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="form-group">
                  <label style={{ fontWeight: 600 }}>Link to Customer / Buyer (Optional)</label>
                  <select 
                    name="linkedClient"
                    value={advSelectedClient}
                    onChange={(e) => setAdvSelectedClient(e.target.value)}
                    style={{ fontSize: '13.5px', padding: '10px 12px', borderRadius: '10px', width: '100%' }}
                  >
                    <option value="">-- Select Customer / Buyer --</option>
                    {clients.map(c => (
                      <option key={c._id} value={c.name}>
                        🏢 {c.name} {c.companyName ? `(${c.companyName})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label htmlFor="adv-amount">Advance Amount (₹) *</label>
                    <input type="number" id="adv-amount" name="amount" required placeholder="e.g. 120 or 2000" step="any" style={{ fontSize: '14px', padding: '10px 12px', borderRadius: '10px', width: '100%' }} />
                  </div>
                  <LinearDatePickerInput 
                    id="adv-date" 
                    name="date" 
                    label="Date Disbursed *" 
                    defaultValue={new Date().toISOString().split('T')[0]} 
                    required 
                  />
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
                  <input type="text" name="notes" placeholder="e.g. Advance for ST-2026-88 order execution" />
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

      {/* Disburse Weekly Payout Modal */}
      {isDisbursePayrollModalOpen && (() => {
        const targetEmpName = selectedDisburseEmp || (employees[0]?.name || "Balasubramainan");
        const empAdvanceList = advanceRecords.filter(a => a.empName === targetEmpName);
        const totalAdvanceTaken = empAdvanceList.reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0);
        const totalAdvanceDeducted = payrollRecords.filter(p => p.empName === targetEmpName).reduce((sum, p) => sum + (parseFloat(p.deductions) || 0), 0);
        const outstandingAdvance = Math.max(0, totalAdvanceTaken - totalAdvanceDeducted);

        return (
        <div className="modal-overlay active" onClick={() => setIsDisbursePayrollModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px', width: '92%' }}>
            <div className="modal-header">
              <h3>Disburse Weekly Payout / Salary</h3>
              <button className="btn-close" onClick={() => setIsDisbursePayrollModalOpen(false)}><i className="ph ph-x"></i></button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target;
              const empName = form.empName.value;
              const startDate = form.startDate.value;
              const endDate = form.endDate.value;
              const month = (startDate && endDate) ? `${startDate} to ${endDate}` : 'Week 31';
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
                  description: `Weekly payout disbursement for ${empName} (${month})`,
                  date
                });
              } catch (err) {}

              setIsDisbursePayrollModalOpen(false);
            }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label htmlFor="payout-emp-name">Select Employee *</label>
                  <select 
                    id="payout-emp-name"
                    name="empName" 
                    required 
                    onChange={(e) => {
                      const empVal = e.target.value;
                      setSelectedDisburseEmp(empVal);
                      const selected = employees.find(emp => emp.name === empVal);
                      if (selected) {
                        const baseInput = document.querySelector('input[name="baseSalary"]');
                        if (baseInput) baseInput.value = selected.salary || 25000;
                      }
                    }}
                    style={{ fontSize: '14px', padding: '12px 14px', width: '100%', borderRadius: '10px' }}
                  >
                    {employees.map(e => {
                      const rateInfo = e.salary > 0 ? ` - Base ₹${e.salary}` : (e.stitchRate > 0 ? ` - ₹${e.stitchRate}/Pcs` : '');
                      return (
                        <option key={e._id} value={e.name}>
                          {e.name} ({e.role}{rateInfo})
                        </option>
                      );
                    })}
                    {employees.length === 0 && <option value="Balasubramainan">Balasubramainan (CEO)</option>}
                  </select>
                </div>

                {/* Outstanding Advance Summary & Auto-Deduct Banner */}
                <div style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  backgroundColor: outstandingAdvance > 0 ? '#FFFBEB' : '#F8FAFC',
                  border: '1px solid ' + (outstandingAdvance > 0 ? '#FDE68A' : '#E2E8F0'),
                  display: 'flex',
                  justify: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: outstandingAdvance > 0 ? '#B45309' : '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      💳 Outstanding Salary Advance Taken
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: outstandingAdvance > 0 ? '#92400E' : '#1E293B', marginTop: '2px' }}>
                      {formatCurrency(outstandingAdvance)}
                    </div>
                  </div>

                  {outstandingAdvance > 0 ? (
                    <button 
                      type="button" 
                      onClick={() => {
                        const deductInput = document.querySelector('input[name="deductions"]');
                        if (deductInput) {
                          deductInput.value = outstandingAdvance;
                        }
                      }}
                      style={{ 
                        backgroundColor: '#F59E0B', 
                        color: '#FFFFFF', 
                        fontWeight: 700, 
                        fontSize: '12px', 
                        padding: '8px 14px',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 6px rgba(245, 158, 11, 0.3)'
                      }}
                    >
                      <i className="ph ph-minus-circle-bold" style={{ fontSize: '15px' }}></i> Auto-Deduct Advance ({formatCurrency(outstandingAdvance)})
                    </button>
                  ) : (
                    <span style={{ fontSize: '12px', color: '#10B981', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <i className="ph ph-check-circle-fill"></i> No Advances Pending
                    </span>
                  )}
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <LinearDatePickerInput 
                    id="payout-start-date"
                    name="startDate"
                    label="Payout Week Start *"
                    defaultValue={new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                    required
                  />
                  <LinearDatePickerInput 
                    id="payout-end-date"
                    name="endDate"
                    label="Payout Week End *"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label htmlFor="payout-base">Salary (₹) *</label>
                    <input 
                      type="number" 
                      id="payout-base"
                      name="baseSalary" 
                      required 
                      defaultValue="25000" 
                      step="any" 
                      style={{ fontSize: '14px', padding: '10px 12px', borderRadius: '10px', width: '100%' }}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="payout-deductions">Deductions (₹)</label>
                    <input 
                      type="number" 
                      id="payout-deductions"
                      name="deductions" 
                      defaultValue="1500" 
                      step="any" 
                      style={{ fontSize: '14px', padding: '10px 12px', borderRadius: '10px', width: '100%' }}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ padding: '16px 20px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsDisbursePayrollModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px', fontWeight: 700, borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <i className="ph ph-check" style={{ fontSize: '16px' }}></i> Complete & Disburse
                </button>
              </div>
            </form>
          </div>
        </div>
        );
      })()}

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
              maxWidth: '480px',
              width: '100%',
              padding: '24px',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              boxShadow: '0 20px 40px rgba(15, 23, 42, 0.2), 0 0 0 1px rgba(244, 63, 94, 0.1)',
              animation: 'modalSlideIn 180ms cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {/* Friendly Header & Subheading */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '18px' }}>
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
                <h3 style={{ margin: '0 0 6px 0', fontSize: '17.5px', fontWeight: 800, color: '#0F172A', lineHeight: '1.3' }}>
                  {deleteConfirmState.heading || 'Are you sure you want to delete this?'}
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748B', lineHeight: '1.5' }}>
                  {deleteConfirmState.subheading || 'This item will be permanently removed from your accounting records.'}
                </p>
              </div>
            </div>


            {/* IMPACT CONSEQUENCES LIST */}
            {deleteConfirmState.impactList && deleteConfirmState.impactList.length > 0 && (
              <div style={{
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '12px 14px',
                marginBottom: '20px'
              }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  What happens after deletion:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {deleteConfirmState.impactList.map((item, idx) => (
                    <div key={idx} style={{ fontSize: '12px', color: '#0F172A', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
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
                <i className="ph ph-trash" style={{ fontSize: '15px' }}></i> Yes, Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Job Details Modal (Production Manager Suite) */}
      {selectedJobModal && (
        <div className="job-modal-overlay" onClick={() => setSelectedJobModal(null)}>
          <div className="job-modal-content" onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                  <span className={`priority-badge ${selectedJobModal.priority?.toLowerCase() || 'medium'}`}>
                    {selectedJobModal.priority || 'Medium'} Priority
                  </span>
                  <span className="badge badge-purple" style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                    Style #{selectedJobModal.styleNumber || 'ST-2026-01'}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    Job ID: #{selectedJobModal._id}
                  </span>
                  {new Date(selectedJobModal.deliveryDate) < new Date() && selectedJobModal.stage !== 'Completed / Delivered' && (
                    <span className="overdue-card-banner"><i className="ph ph-warning-circle"></i> OVERDUE DELAY</span>
                  )}
                </div>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>{selectedJobModal.orderTitle}</h2>
                <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  Customer: <strong>{selectedJobModal.clientName}</strong>
                </p>
              </div>
              <button className="btn-icon" onClick={() => setSelectedJobModal(null)} style={{ fontSize: '18px' }}>
                <i className="ph ph-x"></i>
              </button>
            </div>

            {/* Production Stage Stepper */}
            <div className="stage-stepper">
              {[
                'Backlog & Cutting',
                'Stitching Assembly',
                'QC Inspection',
                'Packing & Ready',
                'Completed / Delivered'
              ].map((stageName, idx) => {
                const stages = ['Backlog & Cutting', 'Stitching Assembly', 'QC Inspection', 'Packing & Ready', 'Completed / Delivered'];
                const currentIdx = stages.indexOf(selectedJobModal.stage || 'Backlog & Cutting');
                const isCurrent = currentIdx === idx;
                const isCompleted = currentIdx > idx;

                return (
                  <div key={stageName} className={`stage-step ${isCurrent ? 'active' : isCompleted ? 'completed' : ''}`}>
                    <div className="stage-step-dot">
                      {isCompleted ? <i className="ph ph-check"></i> : idx + 1}
                    </div>
                    <span>{stageName.split(' ')[0]}</span>
                  </div>
                );
              })}
            </div>

            {/* Production Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '14px', backgroundColor: 'var(--color-muted)', padding: '16px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'block' }}>Order & Shipment Qty</span>
                <strong style={{ fontSize: '15px', color: 'var(--color-text-primary)' }}>
                  {(selectedJobModal.orderQty || selectedJobModal.quantity || 2500).toLocaleString()} Pcs
                </strong>
                <div style={{ fontSize: '10.5px', color: 'var(--color-text-secondary)' }}>
                  Ship: {(selectedJobModal.shipmentQty || selectedJobModal.quantity || 2500).toLocaleString()} Pcs
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'block' }}>Target Due Date</span>
                <strong style={{ fontSize: '15px', color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>{formatDate(selectedJobModal.deliveryDate)}</strong>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'block' }}>Total Valuation</span>
                <strong style={{ fontSize: '15px', color: 'var(--color-success)', fontFamily: 'var(--font-mono)' }}>{formatCurrency(selectedJobModal.estimatedValue)}</strong>
              </div>
            </div>

            {/* Team Assignment & Unit */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label style={{ fontWeight: 600 }}>Production Unit / Floor</label>
                <input type="text" readOnly defaultValue={selectedJobModal.productionUnit || 'Cutting Unit A'} />
              </div>
              <div className="form-group">
                <label style={{ fontWeight: 600 }}>Assigned Lead / Worker</label>
                <input type="text" readOnly defaultValue={selectedJobModal.assignedWorker || 'Kartick (Master Tailor)'} />
              </div>
            </div>

            {/* Production Notes & Fabric Specifications */}
            <div className="form-group">
              <label style={{ fontWeight: 600 }}>Production Notes & Fabric Specifications</label>
              <p style={{ margin: 0, padding: '12px', backgroundColor: 'var(--color-muted)', borderRadius: '8px', fontSize: '13px', border: '1px solid var(--color-border)' }}>
                {selectedJobModal.notes || '100% Combed Cotton, 180 GSM export specifications. Double needle seam stitching.'}
              </p>
            </div>

            {/* AI PRODUCTION & PROFITABILITY ANALYSIS ENGINE */}
            <div style={{
              marginTop: '16px',
              padding: '18px 20px',
              borderRadius: '16px',
              backgroundColor: 'rgba(94, 106, 210, 0.05)',
              border: '1.5px solid rgba(94, 106, 210, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}>
              {/* Header: AI Sparkle + Status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #5E6AD2 0%, #7C3AED 100%)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'center',
                    fontSize: '18px',
                    boxShadow: '0 4px 12px rgba(94, 106, 210, 0.35)'
                  }}>
                    <i className="ph ph-sparkle"></i>
                  </div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                      AI Order Audit & Profitability Report
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      Automated Lifecycle Summary, Margin Breakdown & Actionable Improvements
                    </span>
                  </div>
                </div>

                {/* AI Re-run Button */}
                <button 
                  type="button"
                  className="btn btn-secondary" 
                  onClick={() => {
                    setIsAnalyzingAI(true);
                    setTimeout(() => setIsAnalyzingAI(false), 1200);
                  }}
                  style={{ fontSize: '11px', padding: '6px 14px', gap: '6px', borderRadius: '10px', fontWeight: 700 }}
                >
                  <i className={`ph ph-arrows-clockwise ${isAnalyzingAI ? 'ph-spin' : ''}`}></i>
                  {isAnalyzingAI ? 'Auditing Order...' : 'Re-Run AI Analysis'}
                </button>
              </div>

              {/* Order Lifecycle Flow Summary Chips */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                <div style={{ backgroundColor: 'var(--color-surface)', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>1. Creation & Spec</span>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#5E6AD2', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <i className="ph ph-check-circle"></i> Pattern & Cut Verified
                  </div>
                </div>
                <div style={{ backgroundColor: 'var(--color-surface)', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>2. Staff Assignment</span>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#3B82F6', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <i className="ph ph-user"></i> {selectedJobModal.assignedWorker || 'Kartick (Master Lead)'}
                  </div>
                </div>
                <div style={{ backgroundColor: 'var(--color-surface)', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>3. Current Stage</span>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#F59E0B', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <i className="ph ph-factory"></i> {selectedJobModal.stage || 'Backlog & Cutting'}
                  </div>
                </div>
                <div style={{ backgroundColor: 'var(--color-surface)', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>4. Delay Risk Score</span>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: new Date(selectedJobModal.deliveryDate) < new Date() && selectedJobModal.stage !== 'Completed / Delivered' ? '#EF4444' : '#10B981', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {new Date(selectedJobModal.deliveryDate) < new Date() && selectedJobModal.stage !== 'Completed / Delivered' ? (
                      <><i className="ph ph-warning-circle"></i> High Overdue Risk</>
                    ) : (
                      <><i className="ph ph-shield-check"></i> Low Risk • On Schedule</>
                    )}
                  </div>
                </div>
              </div>

              {/* Financial Profit & Loss Breakdown */}
              {(() => {
                const val = selectedJobModal.estimatedValue || 145000;
                const fabricCost = Math.round(val * 0.38);
                const wagesCost = Math.round(val * 0.25);
                const overheadCost = Math.round(val * 0.08);
                const totalCost = fabricCost + wagesCost + overheadCost;
                const netProfit = val - totalCost;
                const profitMarginPct = ((netProfit / val) * 100).toFixed(1);

                return (
                  <>
                    <div style={{ backgroundColor: 'var(--color-surface)', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                        Financial Cost Ledger & Profit Margin
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                        <div>
                          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'block' }}>Revenue (Client Order)</span>
                          <strong style={{ fontSize: '15px', color: 'var(--color-text-primary)' }}>₹{val.toLocaleString()}</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'block' }}>Fabric & Trims Cost</span>
                          <strong style={{ fontSize: '14px', color: '#F59E0B' }}>-₹{fabricCost.toLocaleString()}</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'block' }}>Stitching Wages</span>
                          <strong style={{ fontSize: '14px', color: '#3B82F6' }}>-₹{wagesCost.toLocaleString()}</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '11px', color: '#10B981', display: 'block', fontWeight: 700 }}>Net Estimated Profit</span>
                          <strong style={{ fontSize: '15px', color: '#10B981' }}>₹{netProfit.toLocaleString()} ({profitMarginPct}%)</strong>
                        </div>
                      </div>
                    </div>

                    {/* AI Recommendations & What We Can Improve */}
                    <div style={{ backgroundColor: 'var(--color-surface)', padding: '14px 16px', borderRadius: '12px', border: '1px solid rgba(94, 106, 210, 0.3)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#5E6AD2', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <i className="ph ph-trend-up" style={{ fontSize: '16px' }}></i> AI Operational Improvement Plan ("What We Can Improve"):
                      </div>
                      <div style={{ fontSize: '12.5px', color: 'var(--color-text-primary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                          <span style={{ color: '#10B981', fontWeight: 800, flexShrink: 0 }}>• Fabric Lay Consumption:</span>
                          <span>Wastage currently at ~3.8%. Utilizing digital CAD marker layouts before cutting will reduce fabric consumption by 95 meters, adding <strong>+₹{Math.round(fabricCost * 0.05).toLocaleString()}</strong> directly to net profit.</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                          <span style={{ color: '#F59E0B', fontWeight: 800, flexShrink: 0 }}>• Floor & Worker Dispatch:</span>
                          <span>Stitching floor lead <strong>{selectedJobModal.assignedWorker || 'Kartick'}</strong> is operating at peak capacity. Allocating 2 helper stitchers during assembly will speed up throughput by +18%.</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                          <span style={{ color: '#5E6AD2', fontWeight: 800, flexShrink: 0 }}>• Margin Target Optimization:</span>
                          <span>Order yields a strong <strong>{profitMarginPct}% profit margin</strong>. Dispatching within target due date avoids customer delay penalties and protects invoice settlement.</span>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Action Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedJobModal(null)}>Close</button>
              
              {/* Next Stage Move Button */}
              {selectedJobModal.stage !== 'Completed / Delivered' && (
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    const stages = ['Backlog & Cutting', 'Stitching Assembly', 'QC Inspection', 'Packing & Ready', 'Completed / Delivered'];
                    const currentIdx = stages.indexOf(selectedJobModal.stage || 'Backlog & Cutting');
                    const nextStage = stages[Math.min(stages.length - 1, currentIdx + 1)];
                    moveJobStage(selectedJobModal._id, nextStage);
                    alert(`Job advanced to ${nextStage}!`);
                  }}
                >
                  Advance to Next Stage <i className="ph ph-arrow-right"></i>
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Linear Command Palette (CMD+K / CTRL+K MODAL) */}
      {isCmdPaletteOpen && (
        <div className="linear-cmd-overlay" onClick={() => setIsCmdPaletteOpen(false)}>
          <div className="linear-cmd-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="linear-cmd-header">
              <i className="ph ph-magnifying-glass linear-cmd-search-icon"></i>
              <input 
                type="text" 
                className="linear-cmd-input" 
                placeholder="Type a command or search..."
                value={cmdSearchQuery}
                onChange={(e) => setCmdSearchQuery(e.target.value)}
                autoFocus
              />
              <kbd className="linear-kbd">Esc</kbd>
            </div>

            <div className="linear-cmd-list">
              {/* Navigation Items */}
              <div className="linear-cmd-group-title">Navigation & Views</div>
              
              {[
                { id: 'dashboard', name: 'Dashboard Overview', icon: 'ph-squares-four', tab: 'dashboard' },
                { id: 'bills', name: 'Invoices & Billing Ledger', icon: 'ph-receipt', tab: 'bills' },
                { id: 'jobs', name: 'Stitching Jobs & Orders', icon: 'ph-briefcase', tab: 'jobs' },
                { id: 'clients', name: 'Buyer Clients Directory', icon: 'ph-users-three', tab: 'clients' },
                { id: 'employees', name: 'Employees & Payroll', icon: 'ph-user-list', tab: 'employees' },
                { id: 'fabrics', name: 'Fabric & Material Inventory', icon: 'ph-package', tab: 'fabrics' },
                { id: 'expenses', name: 'Operating Expenses', icon: 'ph-coins', tab: 'expenses' },
                { id: 'reports', name: 'Financial Reports & Ledger', icon: 'ph-chart-line-up', tab: 'reports' },
                { id: 'settings', name: 'System Settings', icon: 'ph-gear', tab: 'settings' },
              ].filter(item => item.name.toLowerCase().includes(cmdSearchQuery.toLowerCase()))
              .map(item => (
                <div 
                  key={item.id}
                  className="linear-cmd-item"
                  onClick={() => {
                    handleTabChange(item.tab);
                    setIsCmdPaletteOpen(false);
                  }}
                >
                  <div className="linear-cmd-item-left">
                    <div className="linear-cmd-item-icon">
                      <i className={`ph ${item.icon}`}></i>
                    </div>
                    <span>{item.name}</span>
                  </div>
                  <kbd className="linear-kbd">Jump</kbd>
                </div>
              ))}

              {/* Quick Actions & Tools */}
              <div className="linear-cmd-group-title" style={{ marginTop: '12px' }}>Quick Actions</div>

              {[
                { id: 'act-bill', name: 'Create New GST Bill / Invoice', icon: 'ph-plus-circle', action: () => setIsBillModalOpen(true) },
                { id: 'act-client', name: 'Register New Buyer Client', icon: 'ph-user-plus', action: () => setIsClientModalOpen(true) },
                { id: 'act-job', name: 'New Stitching / Fabric Order', icon: 'ph-scissors', action: () => setIsStitchingModalOpen(true) },
                { id: 'act-expense', name: 'Record Operating Expense', icon: 'ph-wallet', action: () => setIsExpenseModalOpen(true) },
                { id: 'act-ai', name: 'Launch AI Financial Health Advisor', icon: 'ph-sparkle', action: () => setIsChatOpen(true) },
              ].filter(item => item.name.toLowerCase().includes(cmdSearchQuery.toLowerCase()))
              .map(item => (
                <div 
                  key={item.id}
                  className="linear-cmd-item"
                  onClick={() => {
                    item.action();
                    setIsCmdPaletteOpen(false);
                  }}
                >
                  <div className="linear-cmd-item-left">
                    <div className="linear-cmd-item-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
                      <i className={`ph ${item.icon}`}></i>
                    </div>
                    <span>{item.name}</span>
                  </div>
                  <kbd className="linear-kbd">Run</kbd>
                </div>
              ))}
            </div>

            <div className="linear-cmd-footer">
              <div className="linear-cmd-footer-hints">
                <span><kbd className="linear-kbd">↑</kbd> <kbd className="linear-kbd">↓</kbd> to navigate</span>
                <span><kbd className="linear-kbd">↵</kbd> to select</span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Varahi Export Linear OS</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
