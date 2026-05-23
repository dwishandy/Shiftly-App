import { initAuth, googleSignIn, getAccessToken, logout } from './auth';

import React, { useState, useEffect, useRef } from 'react';
import { Briefcase, BookOpen, Coffee, Clock, RotateCcw, LayoutDashboard, Settings, Plus, CheckCircle2, Circle, Image as ImageIcon, Target, Wallet, GraduationCap, Calculator, Trash2, Play, Pause, Archive, Music, Edit2, Calendar, X } from 'lucide-react';

type PersonaMode = 'work' | 'study' | 'free';
type Priority = 'High' | 'Medium' | 'Low';
type CurrencyCode = 'IDR' | 'USD' | 'EUR' | 'JPY' | 'SGD' | 'MYR';

interface Task {
  id: string;
  title: string;
  category: PersonaMode;
  priority: Priority;
  completed: boolean;
  archived?: boolean;
  deadline?: string;
}

interface WishlistItem {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
}

interface Course {
  id: string;
  name: string;
  credits: number;
  numericScore: number;
}

interface QuickLink {
  id: string;
  label: string;
  url: string;
}

interface ScheduleConfig {
  workStart: number;
  workEnd: number;
  studyStart: number;
  studyEnd: number;
}

// Constants for Theme configurations
const THEMES = {
  work: {
    bg: 'bg-slate-950',
    text: 'text-slate-200',
    surface: 'bg-slate-900',
    border: 'border-slate-800',
    activeBtn: 'bg-slate-700 text-white shadow-md',
    inactiveBtn: 'text-slate-400 hover:bg-slate-800 hover:text-slate-200',
    accent: 'bg-blue-600',
    accentText: 'text-blue-400',
    inputBg: 'bg-slate-800/50 focus:bg-slate-800',
    itemBg: 'bg-slate-800/40 hover:bg-slate-800/60',
    focusRing: 'focus:ring-blue-500',
    icon: Briefcase,
    label: 'Work Mode'
  },
  study: {
    bg: 'bg-indigo-950',
    text: 'text-indigo-100',
    surface: 'bg-indigo-900/40',
    border: 'border-indigo-800/50',
    activeBtn: 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20',
    inactiveBtn: 'text-indigo-300 hover:bg-indigo-800/50 hover:text-indigo-100',
    accent: 'bg-violet-500',
    accentText: 'text-violet-300',
    inputBg: 'bg-indigo-900/30 focus:bg-indigo-900/50',
    itemBg: 'bg-indigo-900/30 hover:bg-indigo-900/50',
    focusRing: 'focus:ring-violet-500',
    icon: BookOpen,
    label: 'Study Mode'
  },
  free: {
    bg: 'bg-[#fafaf9]', // Warm off-white
    text: 'text-[#2c3d30]', // Deep sage
    surface: 'bg-white',
    border: 'border-[#e4e7e4]', // Soft sage border
    activeBtn: 'bg-[#8fae96] text-white shadow-sm', // Sage green
    inactiveBtn: 'text-[#6b8271] hover:bg-[#f0f4f1] hover:text-[#2c3d30]',
    accent: 'bg-[#e0bba1]', // Warm pastel accent
    accentText: 'text-[#d6a587]',
    inputBg: 'bg-[#f0f4f1]/50 focus:bg-[#f0f4f1]',
    itemBg: 'bg-[#f0f4f1]/50 hover:bg-[#f0f4f1]',
    focusRing: 'focus:ring-[#8fae96]',
    icon: Coffee,
    label: 'Free Mode'
  }
};

const PRIORITY_WEIGHTS: Record<Priority, number> = {
  High: 3,
  Medium: 2,
  Low: 1
};

const PRIORITY_BADGES = {
  High: 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/20',
  Medium: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20',
  Low: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
};

const getLetterGrade = (score: number) => {
  if (score >= 4.0) return 'A';
  if (score >= 3.7) return 'A-';
  if (score >= 3.3) return 'B+';
  if (score >= 3.0) return 'B';
  if (score >= 2.7) return 'B-';
  if (score >= 2.3) return 'C+';
  if (score >= 2.0) return 'C';
  if (score >= 1.7) return 'C-';
  if (score >= 1.0) return 'D';
  return 'E';
};

const CURRENCY_LOCALES: Record<CurrencyCode, string> = {
  IDR: 'id-ID',
  USD: 'en-US',
  EUR: 'de-DE',
  JPY: 'ja-JP',
  SGD: 'en-SG',
  MYR: 'ms-MY'
};

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  IDR: 'Rp',
  USD: '$',
  EUR: '€',
  JPY: '¥',
  SGD: 'S$',
  MYR: 'RM'
};

const formatCurrency = (amount: number, code: CurrencyCode) => {
  return new Intl.NumberFormat(CURRENCY_LOCALES[code], {
    style: 'currency',
    currency: code,
    minimumFractionDigits: code === 'IDR' || code === 'JPY' ? 0 : 2,
    maximumFractionDigits: code === 'IDR' || code === 'JPY' ? 0 : 2
  }).format(amount);
};

const getSpotifyEmbedUrl = (url: string) => {
  if (!url) return '';
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === 'open.spotify.com') {
      const parts = urlObj.pathname.split('/').filter(Boolean);
      if (parts.length >= 2 && parts[0] !== 'embed') {
        const type = parts[0];
        const id = parts[1];
        return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`;
      } else if (parts[0] === 'embed') {
        return url;
      }
    }
    return url;
  } catch (e) {
    return '';
  }
};

const isDeadlinePassedOrToday = (deadline?: string) => {
  if (!deadline) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // If it's just 'YYYY-MM-DD', append time. If it has 'T', parse as is.
  const dateString = deadline.includes('T') ? deadline : deadline + 'T00:00:00';
  const dlDate = new Date(dateString);
  return dlDate.getTime() <= today.getTime();
};

export default function App() {
  // --- STATE MANAGEMENT ---
  // Load initial state from LocalStorage or fallback to defaults
  
  const [currentMode, setCurrentMode] = useState<PersonaMode>(() => {
    const saved = localStorage.getItem('shiftly_mode');
    return (saved as PersonaMode) || 'free';
  });

  const [isAutoMode, setIsAutoMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('shiftly_autoMode');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [schedule, setSchedule] = useState<ScheduleConfig>(() => {
    const saved = localStorage.getItem('shiftly_schedule');
    return saved ? JSON.parse(saved) : {
      workStart: 8,
      workEnd: 17,
      studyStart: 17,
      studyEnd: 22
    };
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('shiftly_tasks');
    return saved ? JSON.parse(saved) : [];
  });

  const [wishlist, setWishlist] = useState<WishlistItem[]>(() => {
    const saved = localStorage.getItem('shiftly_wishlist');
    return saved ? JSON.parse(saved) : [];
  });

  const [monthlySavings, setMonthlySavings] = useState<number>(() => {
    const saved = localStorage.getItem('shiftly_savings');
    return saved ? JSON.parse(saved) : 5000000;
  });

  const [currentSavings, setCurrentSavings] = useState<number>(() => {
    const saved = localStorage.getItem('shiftly_currentSavings');
    return saved ? JSON.parse(saved) : 0;
  });

  const [quickLinks, setQuickLinks] = useState<Record<PersonaMode, QuickLink[]>>(() => {
    const saved = localStorage.getItem('shiftly_quicklinks');
    return saved ? JSON.parse(saved) : { work: [], study: [], free: [] };
  });

  const [showAddLink, setShowAddLink] = useState(false);
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  const [courses, setCourses] = useState<Course[]>(() => {
    const saved = localStorage.getItem('shiftly_courses');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((c: any) => ({
          ...c,
          numericScore: c.numericScore !== undefined ? c.numericScore : (c.gradeWeight || 0)
        }));
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [currency, setCurrency] = useState<CurrencyCode>(() => {
    const saved = localStorage.getItem('shiftly_currency');
    return (saved as CurrencyCode) || 'IDR';
  });

  const [timeLeft, setTimeLeft] = useState<number>(() => {
    const saved = localStorage.getItem('shiftly_timeLeft');
    const customFocus = localStorage.getItem('shiftly_customFocusDuration');
    const initMin = customFocus ? parseInt(customFocus, 10) : 25;
    return saved !== null ? parseInt(saved, 10) : initMin * 60;
  });
  const [timerStatus, setTimerStatus] = useState<'idle' | 'running' | 'paused'>('idle');
  const [timerMode, setTimerMode] = useState<'focus' | 'break'>('focus');

  const [customFocusDuration, setCustomFocusDuration] = useState<number>(() => {
    const saved = localStorage.getItem('shiftly_customFocusDuration');
    return saved !== null ? parseInt(saved, 10) : 25;
  });
  
  const [customBreakDuration, setCustomBreakDuration] = useState<number>(() => {
    const saved = localStorage.getItem('shiftly_customBreakDuration');
    return saved !== null ? parseInt(saved, 10) : 5;
  });

  const [spotifyUrl, setSpotifyUrl] = useState<string>(() => {
    const saved = localStorage.getItem('shiftly_spotifyUrl');
    return saved !== null ? saved : 'https://open.spotify.com/playlist/37i9dQZF1DWWQRwui0ExPn';
  });

  const alarmRef = useRef<HTMLAudioElement | null>(null);

  // Ephemeral UI State
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    initAuth(
      () => setCalendarConnected(true),
      () => setCalendarConnected(false)
    );
  }, []);

  const handleConnectCalendar = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setCalendarConnected(true);
      }
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleDisconnectCalendar = async () => {
    await logout();
    setCalendarConnected(false);
  };

  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  const [showSettings, setShowSettings] = useState(false);
  
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('Medium');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');
  const [editTaskId, setEditTaskId] = useState<string | null>(null);

  const [newWishlistName, setNewWishlistName] = useState('');
  const [newWishlistPrice, setNewWishlistPrice] = useState('');
  const [newWishlistImage, setNewWishlistImage] = useState('');
  const [editWishlistId, setEditWishlistId] = useState<string | null>(null);

  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseCredits, setNewCourseCredits] = useState<number>(3);
  const [newCourseScore, setNewCourseScore] = useState<string>('');
  const [editCourseId, setEditCourseId] = useState<string | null>(null);

  // --- PERSISTENCE LOGIC ---
  useEffect(() => { localStorage.setItem('shiftly_mode', currentMode); }, [currentMode]);
  useEffect(() => { localStorage.setItem('shiftly_autoMode', JSON.stringify(isAutoMode)); }, [isAutoMode]);
  useEffect(() => { localStorage.setItem('shiftly_quicklinks', JSON.stringify(quickLinks)); }, [quickLinks]);
  useEffect(() => { localStorage.setItem('shiftly_schedule', JSON.stringify(schedule)); }, [schedule]);
  useEffect(() => { localStorage.setItem('shiftly_tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('shiftly_wishlist', JSON.stringify(wishlist)); }, [wishlist]);
  useEffect(() => { localStorage.setItem('shiftly_savings', JSON.stringify(monthlySavings)); }, [monthlySavings]);
  useEffect(() => { localStorage.setItem('shiftly_currentSavings', JSON.stringify(currentSavings)); }, [currentSavings]);
  useEffect(() => { localStorage.setItem('shiftly_courses', JSON.stringify(courses)); }, [courses]);
  useEffect(() => { localStorage.setItem('shiftly_currency', currency); }, [currency]);
  useEffect(() => { localStorage.setItem('shiftly_timeLeft', timeLeft.toString()); }, [timeLeft]);
  useEffect(() => { localStorage.setItem('shiftly_customFocusDuration', customFocusDuration.toString()); }, [customFocusDuration]);
  useEffect(() => { localStorage.setItem('shiftly_customBreakDuration', customBreakDuration.toString()); }, [customBreakDuration]);
  useEffect(() => { localStorage.setItem('shiftly_spotifyUrl', spotifyUrl); }, [spotifyUrl]);

  // --- POMODORO TIMER LOGIC ---
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerStatus === 'running' && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerStatus === 'running') {
      setTimerStatus('idle');
      if (!alarmRef.current) {
        alarmRef.current = new Audio('https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg');
      }
      alarmRef.current.currentTime = 0;
      alarmRef.current.play().catch(e => console.log('Alarm play blocked', e));
    }
    return () => clearInterval(interval);
  }, [timerStatus, timeLeft]);

  const stopAlarm = () => {
    if (alarmRef.current) {
      alarmRef.current.pause();
      alarmRef.current.currentTime = 0;
    }
  };

  const handleStartTimer = (mode: 'focus' | 'break') => {
    stopAlarm();
    setTimerMode(mode);
    setTimeLeft((mode === 'focus' ? customFocusDuration : customBreakDuration) * 60);
    setTimerStatus('idle');
  };

  const handleResetTimer = () => {
    stopAlarm();
    setTimerStatus('idle');
    setTimeLeft((timerMode === 'focus' ? customFocusDuration : customBreakDuration) * 60);
  };

  const handleToggleTimer = () => {
    if (timerStatus === 'idle') stopAlarm();
    setTimerStatus(timerStatus === 'running' ? 'paused' : 'running');
  };

  // --- TIME & AUTO-SWITCHER LOGIC ---
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      if (isAutoMode) {
        const hour = now.getHours();
        const day = now.getDay();
        
        let targetMode: PersonaMode = 'free';
        
        if (day !== 0 && day !== 6) { 
          if (hour >= schedule.workStart && hour < schedule.workEnd) {
            targetMode = 'work';
          } else if (hour >= schedule.studyStart && hour < schedule.studyEnd) {
            targetMode = 'study';
          } else {
            targetMode = 'free';
          }
        }
        
        if (targetMode !== currentMode) {
          setCurrentMode(targetMode);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isAutoMode, currentMode, schedule]);

  // --- HANDLERS ---
  const handleManualSwitch = (mode: PersonaMode) => {
    setCurrentMode(mode);
    setIsAutoMode(false);
  };

  // Task Handlers
  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    if (editTaskId) {
      setTasks(tasks.map(t => t.id === editTaskId ? {
        ...t,
        title: newTaskTitle.trim(),
        priority: newTaskPriority,
        deadline: newTaskDeadline || undefined
      } : t));
      cancelEditTask();
    } else {
      const newTask: Task = {
        id: Date.now().toString(),
        title: newTaskTitle.trim(),
        category: currentMode,
        priority: newTaskPriority,
        completed: false,
        deadline: newTaskDeadline || undefined
      };
      setTasks([...tasks, newTask]);

      // Calendar sync logic
      if (newTaskDeadline && (currentMode === 'work' || currentMode === 'study') && calendarConnected) {
        try {
          const accessToken = await getAccessToken();
          if (accessToken) {
            // Construct start and end as all-day events if no time is provided,
            // but since it's type="datetime-local" we format it as ISO string
            const startDateTime = new Date(newTaskDeadline);
            const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // +1 hour
            
            await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                summary: `[Shiftly] ${newTaskTitle.trim()}`,
                description: `Created via Shiftly in ${currentMode} mode`,
                start: { dateTime: startDateTime.toISOString() },
                end: { dateTime: endDateTime.toISOString() }
              })
            });
          }
        } catch (err) {
          console.error("Failed to sync to calendar", err);
        }
      }

      setNewTaskTitle('');
      setNewTaskDeadline('');
    }
  };

  const handleEditTask = (task: Task) => {
    setEditTaskId(task.id);
    setNewTaskTitle(task.title);
    setNewTaskPriority(task.priority);
    setNewTaskDeadline(task.deadline || '');
  };

  const cancelEditTask = () => {
    setEditTaskId(null);
    setNewTaskTitle('');
    setNewTaskPriority('Medium');
    setNewTaskDeadline('');
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };
  
  const handleArchiveCompleted = () => {
    setTasks(tasks.map(t => 
      (t.category === currentMode && t.completed) ? { ...t, archived: true } : t
    ));
  };

  // Wishlist Handlers
  const addWishlistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWishlistName.trim() || !newWishlistPrice) return;
    
    const price = parseFloat(newWishlistPrice);
    if (isNaN(price) || price < 0) return;

    if (editWishlistId) {
      setWishlist(wishlist.map(w => w.id === editWishlistId ? {
        ...w,
        name: newWishlistName.trim(),
        price,
        imageUrl: newWishlistImage.trim() || undefined
      } : w));
      cancelEditWishlist();
    } else {
      const newItem: WishlistItem = {
        id: Date.now().toString(),
        name: newWishlistName.trim(),
        price,
        imageUrl: newWishlistImage.trim() || undefined
      };
      setWishlist([...wishlist, newItem]);
      setNewWishlistName('');
      setNewWishlistPrice('');
      setNewWishlistImage('');
    }
  };

  const handleEditWishlist = (item: WishlistItem) => {
    setEditWishlistId(item.id);
    setNewWishlistName(item.name);
    setNewWishlistPrice(item.price.toString());
    setNewWishlistImage(item.imageUrl || '');
  };

  const cancelEditWishlist = () => {
    setEditWishlistId(null);
    setNewWishlistName('');
    setNewWishlistPrice('');
    setNewWishlistImage('');
  };
  
  const deleteWishlistItem = (id: string) => {
    setWishlist(wishlist.filter(w => w.id !== id));
  };

  // Course Handlers
  const addCourse = (e: React.FormEvent) => {
    e.preventDefault();
    const score = parseFloat(newCourseScore);
    if (!newCourseName.trim() || newCourseCredits < 1 || isNaN(score) || score < 0 || score > 4) return;

    if (editCourseId) {
      setCourses(courses.map(c => c.id === editCourseId ? {
        ...c,
        name: newCourseName.trim(),
        credits: newCourseCredits,
        numericScore: score
      } : c));
      cancelEditCourse();
    } else {
      const newCourse: Course = {
        id: Date.now().toString(),
        name: newCourseName.trim(),
        credits: newCourseCredits,
        numericScore: score
      };
      setCourses([...courses, newCourse]);
      setNewCourseName('');
      setNewCourseCredits(3);
      setNewCourseScore('');
    }
  };

  const handleEditCourse = (course: Course) => {
    setEditCourseId(course.id);
    setNewCourseName(course.name);
    setNewCourseCredits(course.credits);
    setNewCourseScore(course.numericScore.toString());
  };

  const cancelEditCourse = () => {
    setEditCourseId(null);
    setNewCourseName('');
    setNewCourseCredits(3);
    setNewCourseScore('');
  };

  const deleteCourse = (id: string) => {
    setCourses(courses.filter(c => c.id !== id));
  };

  const handleAddQuickLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLinkLabel.trim() || !newLinkUrl.trim()) return;
    const newLink: QuickLink = {
      id: Date.now().toString(),
      label: newLinkLabel.trim(),
      url: newLinkUrl.trim().startsWith('http') ? newLinkUrl.trim() : `https://${newLinkUrl.trim()}`
    };
    
    setQuickLinks(prev => ({
      ...prev,
      [currentMode]: [...(prev[currentMode] || []), newLink].slice(0, 3)
    }));
    setNewLinkLabel('');
    setNewLinkUrl('');
    setShowAddLink(false);
  };

  const deleteQuickLink = (id: string) => {
    setQuickLinks(prev => ({
      ...prev,
      [currentMode]: (prev[currentMode] || []).filter(link => link.id !== id)
    }));
  };


  // --- RENDER HELPERS ---
  const theme = THEMES[currentMode];
  const CurrentIcon = theme.icon;

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const filteredAndSortedTasks = tasks
    .filter(t => t.category === currentMode && !t.archived)
    .sort((a, b) => {
      if (a.completed && !b.completed) return 1;
      if (!a.completed && b.completed) return -1;
      return PRIORITY_WEIGHTS[b.priority] - PRIORITY_WEIGHTS[a.priority];
    });

  // Calculate GPA
  const totalCredits = courses.reduce((sum, course) => sum + course.credits, 0);
  const totalPoints = courses.reduce((sum, course) => sum + (course.numericScore * course.credits), 0);
  const gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
  const numGpa = parseFloat(gpa);

  let gpaColorClass = 'text-gray-400';
  if (totalCredits > 0) {
    if (numGpa >= 3.5) gpaColorClass = 'text-emerald-500';
    else if (numGpa >= 3.0) gpaColorClass = 'text-amber-500';
    else if (numGpa >= 2.0) gpaColorClass = 'text-orange-500';
    else gpaColorClass = 'text-red-500';
  }

  const hasCompletedTasks = filteredAndSortedTasks.some(t => t.completed);

  return (
    // Main Container - Global Transitions
    <div className={`min-h-screen w-full transition-colors duration-700 ease-in-out ${theme.bg} ${theme.text} font-sans selection:bg-black/10`}>
      
      {/* Top Navigation Bar */}
      <nav className={`sticky top-0 z-10 backdrop-blur-md border-b transition-colors duration-700 ${theme.border} ${theme.surface.replace('bg-', 'bg-').replace('/40', '/80')} supports-[backdrop-filter]:bg-opacity-60`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo/Brand */}
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-xl transition-colors duration-700 ${theme.surface} ${theme.border} border`}>
                <CurrentIcon className={`w-6 h-6 ${theme.accentText} transition-colors duration-700`} />
              </div>
              <div>
                <h1 className="font-semibold text-xl tracking-tight flex items-center space-x-1.5">
                  <span>Shiftly</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${theme.accent} transition-colors duration-700`} />
                </h1>
                <p className={`text-xs font-mono opacity-60 flex items-center space-x-1`}>
                  <Clock className="w-3 h-3" />
                  <span>{formatTime(currentTime)}</span>
                </p>
              </div>
            </div>

            {/* Persona Switcher Group */}
            <div className={`hidden md:flex items-center p-1 rounded-full border transition-colors duration-700 ${theme.border} ${theme.surface}`}>
              {(Object.keys(THEMES) as PersonaMode[]).map((mode) => {
                const MIcon = THEMES[mode].icon;
                return (
                  <button
                    key={mode}
                    onClick={() => handleManualSwitch(mode)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300
                      ${currentMode === mode ? theme.activeBtn : theme.inactiveBtn}`}
                  >
                    <MIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">{THEMES[mode].label}</span>
                  </button>
                );
              })}
            </div>

            {/* Global Settings */}
            <div className="flex items-center">
              <button 
                onClick={() => setShowSettings(true)}
                className={`p-2.5 rounded-full border transition-colors duration-700 hover:scale-105 shadow-sm ${theme.border} ${theme.surface}`}
                title="Open Settings Menu"
              >
                <Settings className={`w-5 h-5 ${theme.text}`} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Header Section */}
        <div className="mb-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-2">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight transition-colors duration-700">
                Good {
                  currentTime.getHours() < 12 ? 'Morning' : 
                  currentTime.getHours() < 18 ? 'Afternoon' : 'Evening'
                }.
              </h2>
              {/* Quick Links */}
              <div className="flex items-center gap-2">
                {(quickLinks[currentMode] || []).map(link => (
                  <div key={link.id} className="relative group">
                    <a 
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center justify-center w-9 h-9 rounded-full text-[11px] font-bold uppercase transition-all duration-300 border ${theme.border} bg-transparent group-hover:border-[transparent] group-hover:shadow-md group-hover:-translate-y-0.5 overflow-hidden`}
                      title={link.url}
                    >
                      <span className="absolute inset-0 bg-black/5 dark:bg-white/5 transition-opacity group-hover:opacity-0" />
                      <span className={`absolute inset-0 ${theme.accent} opacity-0 group-hover:opacity-100 transition-opacity`} />
                      <span className={`relative z-10 transition-colors ${theme.accentText} group-hover:text-white`}>
                        {link.label.substring(0, 4)}
                      </span>
                    </a>
                    <button
                      onClick={() => deleteQuickLink(link.id)}
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-sm"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
                {(quickLinks[currentMode] || []).length < 3 && (
                  <button 
                    onClick={() => setShowAddLink(true)}
                    title="Add Quick Link"
                    className="flex items-center justify-center w-9 h-9 rounded-full text-xs transition-all duration-300 border border-dashed border-gray-400/50 opacity-60 hover:opacity-100 hover:scale-105"
                  >
                     <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <p className="opacity-70 text-lg flex items-center">
              Currently prioritizing <strong className={`mx-2 ${theme.accentText} transition-colors duration-700`}>{theme.label}</strong> tasks.
            </p>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Module - Task Manager */}
          <div className={`col-span-1 lg:col-span-2 rounded-2xl border p-6 flex flex-col transition-all duration-700 shadow-sm ${theme.surface} ${theme.border} min-h-[400px]`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <CurrentIcon className={`w-5 h-5 ${theme.accentText} transition-colors duration-700`} />
                Active Tasks
              </h3>
              <div className="flex items-center gap-3">
                {hasCompletedTasks && (
                  <button 
                    onClick={handleArchiveCompleted}
                    className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 px-3 py-1.5 rounded-full transition-colors"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>Archive Done</span>
                  </button>
                )}
                <span className={`text-xs font-medium px-3 py-1 rounded-full border transition-colors duration-700 opacity-80 ${theme.border}`}>
                  {filteredAndSortedTasks.length} {filteredAndSortedTasks.length === 1 ? 'Task' : 'Tasks'}
                </span>
              </div>
            </div>

            {/* Task Input Form */}
            <form onSubmit={addTask} className="flex flex-col sm:flex-row gap-3 mb-6">
              <input 
                type="text"
                placeholder={`Add a task for ${theme.label}...`}
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                className={`flex-1 min-w-[200px] transition-colors border ${theme.border} ${theme.inputBg} rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:border-[transparent] ${theme.focusRing}`}
              />
              <div className="flex flex-col sm:flex-row gap-3">
                {(currentMode === 'work' || currentMode === 'study') && (
                  <input 
                    type="datetime-local"
                    value={newTaskDeadline}
                    onChange={e => setNewTaskDeadline(e.target.value)}
                    className={`border transition-colors ${theme.border} ${theme.inputBg} rounded-xl px-3 py-2.5 text-sm focus:outline-none text-slate-500`}
                    title="Deadline (Syncs to Calendar if connected)"
                  />
                )}
                <select 
                  value={newTaskPriority}
                  onChange={e => setNewTaskPriority(e.target.value as Priority)}
                  className={`border transition-colors ${theme.border} ${theme.inputBg} rounded-xl px-3 py-2.5 text-sm focus:outline-none`}
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
                {editTaskId && (
                  <button 
                    type="button" 
                    onClick={cancelEditTask}
                    className={`px-4 py-2.5 rounded-xl font-medium transition-all hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center border ${theme.border} bg-transparent`}
                  >
                   Cancel
                  </button>
                )}
                <button 
                  type="submit" 
                  className={`px-5 py-2.5 rounded-xl text-white font-medium transition-all hover:opacity-90 hover:scale-[1.02] flex items-center justify-center ${theme.accent} shadow-md`}
                >
                  {editTaskId ? <CheckCircle2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </button>
              </div>
            </form>

            {/* Task List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredAndSortedTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full opacity-40 space-y-4 py-12">
                  <CheckCircle2 className={`w-12 h-12 ${theme.accentText} opacity-50`} />
                  <p className="text-sm font-medium">All clear for {theme.label}!</p>
                </div>
              ) : (
                filteredAndSortedTasks.map(task => (
                  <div 
                    key={task.id} 
                    className={`group flex items-center gap-4 p-3.5 rounded-xl border transition-all duration-300 ${theme.border} ${theme.itemBg} ${task.completed ? 'opacity-50 grayscale' : 'hover:-translate-y-0.5'}`}
                  >
                    <button 
                      type="button"
                      onClick={() => toggleTask(task.id)}
                      className={`flex-shrink-0 transition-all duration-300 ${task.completed ? theme.accentText : 'opacity-30 hover:opacity-100 hover:scale-110'}`}
                    >
                      {task.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                    </button>
                    
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <span className={`text-sm font-medium transition-all duration-300 truncate ${task.completed ? 'line-through opacity-70' : ''}`}>
                        {task.title}
                      </span>
                      {task.deadline && (
                        <span className={`text-[10px] font-medium mt-1 flex items-center gap-1 ${task.completed ? 'opacity-60' : isDeadlinePassedOrToday(task.deadline) ? 'text-red-500 font-bold' : 'opacity-70'}`}>
                           <Calendar className="w-3 h-3" /> {task.deadline.replace('T', ' ')}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-md transition-opacity duration-300 ${PRIORITY_BADGES[task.priority]} ${task.completed ? 'opacity-40' : ''}`}>
                        {task.priority}
                      </span>
                      <button 
                        type="button"
                        onClick={() => handleEditTask(task)}
                        className="p-1.5 opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-all rounded-md"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        type="button"
                        onClick={() => setTasks(tasks.filter(t => t.id !== task.id))}
                        className="p-1.5 opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:text-red-500 transition-all rounded-md"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Side Module - Dynamic */}
          {currentMode === 'work' ? (
            <div className={`col-span-1 rounded-2xl border p-6 flex flex-col transition-all duration-700 shadow-sm ${theme.surface} ${theme.border} min-h-[400px]`}>
              <h3 className="text-xl font-semibold flex items-center gap-2 mb-6">
                <Target className={`w-5 h-5 ${theme.accentText} transition-colors duration-700`} />
                Wishlist Goals
              </h3>
              
              <div className={`mb-6 p-4 border rounded-xl transition-colors duration-700 ${theme.border} ${theme.inputBg.split(' ')[0]}`}>
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
                  <label className="text-xs font-semibold uppercase tracking-wider opacity-70 flex items-center gap-2">
                    <Wallet className="w-4 h-4" /> Savings Context
                  </label>
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value as CurrencyCode)}
                    className={`border transition-colors ${theme.border} ${theme.surface} rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-1 ${theme.focusRing}`}
                  >
                    {(Object.keys(CURRENCY_LOCALES) as CurrencyCode[]).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <span className="text-sm font-semibold opacity-50">{CURRENCY_SYMBOLS[currency]}</span>
                    </div>
                    <input 
                      type="number"
                      min="0"
                      value={currentSavings === 0 ? '' : currentSavings} 
                      onChange={e => {
                        const val = Number(e.target.value);
                        if (val >= 0) setCurrentSavings(val);
                      }}
                      className={`w-full transition-colors border ${theme.border} ${theme.surface} rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:border-[transparent] ${theme.focusRing}`}
                      placeholder="Current balance..."
                      title="Current Savings Balance"
                    />
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <span className="text-sm font-semibold opacity-50">{CURRENCY_SYMBOLS[currency]}</span>
                    </div>
                    <input 
                      type="number"
                      min="0"
                      value={monthlySavings === 0 ? '' : monthlySavings} 
                      onChange={e => {
                        const val = Number(e.target.value);
                        if (val >= 0) setMonthlySavings(val);
                      }}
                      className={`w-full transition-colors border ${theme.border} ${theme.surface} rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:border-[transparent] ${theme.focusRing}`}
                      placeholder="Monthly added..."
                      title="Monthly Savings Budget"
                    />
                  </div>
                </div>
              </div>

              {/* Add Wishlist Form */}
              <form onSubmit={addWishlistItem} className="flex flex-col gap-3 mb-6">
                <div className="flex items-center justify-between">
                  {editWishlistId && <span className="text-xs font-medium text-emerald-500 mb-1">Editing Goal</span>}
                </div>
                <input 
                  type="text"
                  placeholder="Goal name..."
                  value={newWishlistName}
                  onChange={e => setNewWishlistName(e.target.value)}
                  className={`w-full transition-colors border ${theme.border} ${theme.inputBg} rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:border-[transparent] ${theme.focusRing}`}
                />
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <span className="text-sm font-semibold opacity-50">{CURRENCY_SYMBOLS[currency]}</span>
                    </div>
                    <input 
                      type="number"
                      min="0"
                      placeholder="Price"
                      value={newWishlistPrice}
                      onChange={e => setNewWishlistPrice(e.target.value)}
                      className={`w-full transition-colors border ${theme.border} ${theme.inputBg} rounded-lg pl-10 pr-2 py-2 text-sm focus:outline-none focus:ring-1 focus:border-[transparent] ${theme.focusRing}`}
                    />
                  </div>
                  <input 
                    type="text"
                    placeholder="Image URL..."
                    value={newWishlistImage}
                    onChange={e => setNewWishlistImage(e.target.value)}
                    className={`flex-1 transition-colors border ${theme.border} ${theme.inputBg} rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:border-[transparent] ${theme.focusRing}`}
                  />
                  {editWishlistId && (
                    <button 
                      type="button" 
                      onClick={cancelEditWishlist}
                      className={`px-3 py-2 rounded-lg font-medium transition-all hover:bg-black/5 flex items-center justify-center border ${theme.border}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <button 
                    type="submit" 
                    className={`px-3 py-2 rounded-lg text-white font-medium transition-all hover:opacity-90 flex items-center justify-center ${theme.accent} shadow-md`}
                  >
                    {editWishlistId ? <CheckCircle2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </button>
                </div>
              </form>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {wishlist.length === 0 ? (
                  <div className="flex flex-col items-center justify-center opacity-40 py-8">
                    <Target className={`w-8 h-8 mb-3 opacity-50 ${theme.accentText}`} />
                    <p className="text-xs text-center">Set your first financial goal to stay motivated!</p>
                  </div>
                ) : (
                  wishlist.map(item => {
                    const remainingAmount = item.price - currentSavings;
                    let goalText = '';
                    if (remainingAmount <= 0) {
                      goalText = 'Achieved! 🎉';
                    } else {
                      const monthsToAchieve = monthlySavings > 0 ? (remainingAmount / monthlySavings).toFixed(1) : '∞';
                      goalText = `Goal: ${monthsToAchieve} Months`;
                    }
                    return (
                      <div key={item.id} className={`group flex gap-3 p-3 rounded-xl border transition-colors duration-300 ${theme.border} ${theme.itemBg} relative`}>
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-black/10 dark:bg-white/10 flex-shrink-0 flex items-center justify-center">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-5 h-5 opacity-30" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center pr-6">
                          <h4 className="text-sm font-semibold truncate leading-tight mb-1">{item.name}</h4>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-mono font-medium ${theme.accentText}`}>
                              {formatCurrency(item.price, currency)}
                            </span>
                          </div>
                          <div className="text-[10px] uppercase font-bold tracking-wider opacity-60">
                            {goalText}
                          </div>
                        </div>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleEditWishlist(item)}
                            className="p-1.5 opacity-60 hover:opacity-100 transition-all rounded-md"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => deleteWishlistItem(item.id)}
                            className="p-1.5 opacity-60 hover:opacity-100 hover:text-red-500 transition-all rounded-md"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : currentMode === 'study' ? (
            <div className="col-span-1 flex flex-col gap-6">
              {/* Pomodoro Timer for Study Mode */}
              <div className={`rounded-2xl border p-6 flex flex-col transition-all duration-700 shadow-sm ${theme.surface} ${theme.border}`}>
                <h3 className="text-xl font-semibold flex items-center gap-2 mb-4">
                  <Clock className={`w-5 h-5 ${theme.accentText}`} />
                  Focus Timer
                </h3>
                <div className="flex justify-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold opacity-70">Focus (m)</label>
                    <input type="number" min="1" max="120" value={customFocusDuration} onChange={e => {
                      const val = Number(e.target.value);
                      if (val > 0) setCustomFocusDuration(val);
                    }} className={`w-16 transition-colors border ${theme.border} ${theme.inputBg} rounded-lg px-2 py-1 text-sm focus:outline-none`} />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold opacity-70">Break (m)</label>
                    <input type="number" min="1" max="60" value={customBreakDuration} onChange={e => {
                      const val = Number(e.target.value);
                      if (val > 0) setCustomBreakDuration(val);
                    }} className={`w-16 transition-colors border ${theme.border} ${theme.inputBg} rounded-lg px-2 py-1 text-sm focus:outline-none`} />
                  </div>
                </div>
                <div className="flex justify-center gap-4 mb-6">
                  <button 
                    onClick={() => handleStartTimer('focus')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${timerMode === 'focus' ? theme.activeBtn : theme.inactiveBtn}`}
                  >
                    Focus ({customFocusDuration}m)
                  </button>
                  <button 
                    onClick={() => handleStartTimer('break')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${timerMode === 'break' ? theme.activeBtn : theme.inactiveBtn}`}
                  >
                    Break ({customBreakDuration}m)
                  </button>
                </div>
                <div className="flex items-center justify-center mb-6">
                  <div className={`text-5xl font-bold font-mono tracking-tighter ${theme.accentText}`}>
                    {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
                  </div>
                </div>
                <div className="flex justify-center gap-3 mb-6">
                  <button 
                    onClick={handleToggleTimer}
                    className={`p-3 rounded-full text-white transition-all hover:scale-105 shadow-md flex items-center justify-center w-12 h-12 ${theme.accent}`}
                  >
                    {timerStatus === 'running' ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
                  </button>
                  <button 
                    onClick={handleResetTimer}
                    className={`p-3 rounded-full transition-all hover:bg-black/10 dark:hover:bg-white/10 w-12 h-12 flex items-center justify-center flex-shrink-0 ${theme.text}`}
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className={`rounded-2xl border p-6 flex flex-col transition-all duration-700 shadow-sm ${theme.surface} ${theme.border}`}>
                <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <GraduationCap className={`w-5 h-5 ${theme.accentText} transition-colors duration-700`} />
                  GPA Tracker
                </h3>
                <div className={`text-right ${gpaColorClass} transition-colors duration-300`}>
                  <div className="text-2xl font-bold font-mono tracking-tight leading-none">{gpa}</div>
                  <div className="text-[10px] uppercase tracking-widest opacity-80 font-semibold mt-1">Current GPA</div>
                </div>
              </div>

              {/* Add Course Form */}
              <form onSubmit={addCourse} className="flex flex-col gap-3 mb-6">
                {editCourseId && <span className="text-xs font-medium text-emerald-500">Editing Course</span>}
                <input 
                  type="text"
                  placeholder="Course name (e.g. Calculus I)..."
                  value={newCourseName}
                  onChange={e => setNewCourseName(e.target.value)}
                  className={`w-full transition-colors border ${theme.border} ${theme.inputBg} rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:border-[transparent] ${theme.focusRing}`}
                />
                <div className="flex gap-2">
                  <select 
                    value={newCourseCredits}
                    onChange={e => setNewCourseCredits(Number(e.target.value))}
                    className={`flex-1 transition-colors border ${theme.border} ${theme.inputBg} rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:border-[transparent] ${theme.focusRing}`}
                  >
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <option key={num} value={num}>{num} {num === 1 ? 'Credit' : 'Credits'}</option>
                    ))}
                  </select>
                  <input 
                    type="number"
                    min="0"
                    max="4"
                    step="0.01"
                    placeholder="Course GPA / Score"
                    value={newCourseScore}
                    onChange={e => setNewCourseScore(e.target.value)}
                    className={`flex-1 transition-colors border ${theme.border} ${theme.inputBg} rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:border-[transparent] ${theme.focusRing}`}
                  />
                  {editCourseId && (
                    <button 
                      type="button" 
                      onClick={cancelEditCourse}
                      className={`px-3 py-2 rounded-lg font-medium transition-all hover:bg-black/5 flex items-center justify-center border ${theme.border}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <button 
                    type="submit" 
                    className={`px-3 py-2 rounded-lg text-white font-medium transition-all hover:opacity-90 flex items-center justify-center ${theme.accent} shadow-md`}
                  >
                    {editCourseId ? <CheckCircle2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </button>
                </div>
              </form>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {courses.length === 0 ? (
                  <div className="flex flex-col items-center justify-center opacity-40 py-8">
                    <Calculator className={`w-8 h-8 mb-3 opacity-50 ${theme.accentText}`} />
                    <p className="text-xs text-center">Add your current courses to start tracking GPA.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {courses.map(course => (
                      <div key={course.id} className={`group flex items-center justify-between p-3 rounded-xl border transition-colors duration-300 ${theme.border} ${theme.itemBg}`}>
                        <div className="flex-1 min-w-0 pr-3">
                          <h4 className="text-sm font-semibold truncate leading-tight mb-1">{course.name}</h4>
                          <div className="flex items-center gap-2 opacity-70">
                            <span className="text-[10px] uppercase font-bold tracking-wider">{course.credits} {course.credits === 1 ? 'Credit' : 'Credits'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-center bg-black/5 dark:bg-white/5 rounded-lg px-3 py-1">
                            <span className={`block text-sm font-bold ${theme.accentText}`}>{getLetterGrade(course.numericScore)}</span>
                            <span className="block text-[9px] font-mono opacity-50">{course.numericScore.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => handleEditCourse(course)}
                              className="p-1.5 opacity-60 hover:opacity-100 transition-all rounded-md"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => deleteCourse(course.id)}
                              className="p-1.5 opacity-60 hover:opacity-100 hover:text-red-500 transition-all rounded-md"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Spotify Player widget */}
            <div className={`rounded-2xl border p-6 flex flex-col transition-all duration-700 shadow-sm ${theme.surface} ${theme.border}`}>
              <h3 className="text-xl font-semibold flex items-center gap-2 mb-4">
                <Music className={`w-5 h-5 ${theme.accentText}`} />
                Study Beats
              </h3>
              <input 
                type="url"
                placeholder="Paste Spotify Playlist URL..."
                value={spotifyUrl}
                onChange={e => setSpotifyUrl(e.target.value)}
                className={`w-full mb-4 transition-colors border ${theme.border} ${theme.inputBg} rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:border-[transparent] ${theme.focusRing}`}
              />
              <div className="w-full rounded-xl overflow-hidden bg-black/5 dark:bg-white/5">
                {getSpotifyEmbedUrl(spotifyUrl) ? (
                  <iframe 
                    style={{ borderRadius: '12px', background: 'transparent' }} 
                    src={getSpotifyEmbedUrl(spotifyUrl)} 
                    width="100%" 
                    height="152" 
                    frameBorder="0" 
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                    loading="lazy"
                  ></iframe>
                ) : (
                  <div className="h-[152px] flex items-center justify-center opacity-50 text-sm font-medium">
                    Invalid Spotify URL
                  </div>
                )}
              </div>
            </div>

          </div>
          ) : (
            <div className="col-span-1 flex flex-col gap-6">
              <div className={`rounded-2xl border p-6 flex flex-col transition-all duration-700 shadow-sm ${theme.surface} ${theme.border}`}>
                <h3 className="text-xl font-semibold flex items-center gap-2 mb-4">
                  <Clock className={`w-5 h-5 ${theme.accentText}`} />
                  Free Time Timer
                </h3>
                <div className="flex justify-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold opacity-70">Focus (m)</label>
                    <input type="number" min="1" max="120" value={customFocusDuration} onChange={e => {
                      const val = Number(e.target.value);
                      if (val > 0) setCustomFocusDuration(val);
                    }} className={`w-16 transition-colors border ${theme.border} ${theme.inputBg} rounded-lg px-2 py-1 text-sm focus:outline-none`} />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold opacity-70">Break (m)</label>
                    <input type="number" min="1" max="60" value={customBreakDuration} onChange={e => {
                      const val = Number(e.target.value);
                      if (val > 0) setCustomBreakDuration(val);
                    }} className={`w-16 transition-colors border ${theme.border} ${theme.inputBg} rounded-lg px-2 py-1 text-sm focus:outline-none`} />
                  </div>
                </div>
                <div className="flex justify-center gap-4 mb-6">
                  <button 
                    onClick={() => handleStartTimer('focus')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${timerMode === 'focus' ? theme.activeBtn : theme.inactiveBtn}`}
                  >
                    Focus ({customFocusDuration}m)
                  </button>
                  <button 
                    onClick={() => handleStartTimer('break')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${timerMode === 'break' ? theme.activeBtn : theme.inactiveBtn}`}
                  >
                    Break ({customBreakDuration}m)
                  </button>
                </div>
                <div className="flex items-center justify-center mb-6">
                  <div className={`text-5xl font-bold font-mono tracking-tighter ${theme.accentText}`}>
                    {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
                  </div>
                </div>
                <div className="flex justify-center gap-3 mb-6">
                  <button 
                    onClick={handleToggleTimer}
                    className={`p-3 rounded-full text-white transition-all hover:scale-105 shadow-md flex items-center justify-center w-12 h-12 ${theme.accent}`}
                  >
                    {timerStatus === 'running' ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
                  </button>
                  <button 
                    onClick={handleResetTimer}
                    className={`p-3 rounded-full transition-all hover:bg-black/10 dark:hover:bg-white/10 w-12 h-12 flex items-center justify-center flex-shrink-0 ${theme.text}`}
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                </div>
                <div className="mt-8 flex flex-col items-center justify-center">
                  <Coffee className={`w-8 h-8 mb-4 opacity-20 ${theme.accentText}`} />
                  <p className="text-sm opacity-50 text-center font-medium">
                    Enjoy your break time.
                  </p>
                </div>
              </div>

              {/* Spotify Player widget */}
              <div className={`rounded-2xl border p-6 flex flex-col transition-all duration-700 shadow-sm ${theme.surface} ${theme.border}`}>
                <h3 className="text-xl font-semibold flex items-center gap-2 mb-4">
                  <Music className={`w-5 h-5 ${theme.accentText}`} />
                  Spotify Player
                </h3>
                <input 
                  type="url"
                  placeholder="Paste Spotify Playlist URL..."
                  value={spotifyUrl}
                  onChange={e => setSpotifyUrl(e.target.value)}
                  className={`w-full mb-4 transition-colors border ${theme.border} ${theme.inputBg} rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:border-[transparent] ${theme.focusRing}`}
                />
                <div className="w-full rounded-xl overflow-hidden bg-black/5 dark:bg-white/5">
                  {getSpotifyEmbedUrl(spotifyUrl) ? (
                    <iframe 
                      style={{ borderRadius: '12px', background: 'transparent' }} 
                      src={getSpotifyEmbedUrl(spotifyUrl)} 
                      width="100%" 
                      height="152" 
                      frameBorder="0" 
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                      loading="lazy"
                    ></iframe>
                  ) : (
                    <div className="h-[152px] flex items-center justify-center opacity-50 text-sm font-medium">
                      Invalid Spotify URL
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>
      </main>

      {/* Side Panel for Settings */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowSettings(false)} />
          <div className={`relative w-full max-w-sm h-full shadow-2xl flex flex-col transition-all duration-300 ${theme.surface} ${theme.text}`}>
            <div className={`p-6 border-b ${theme.border} flex items-center justify-between`}>
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Settings className="w-5 h-5" /> Settings
              </h3>
              <button onClick={() => setShowSettings(false)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto space-y-8">
              <div className="space-y-4">
                <h4 className="text-sm font-semibold uppercase tracking-wider opacity-70">Automation</h4>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Auto-Sync Persona Mode</span>
                  <button
                    onClick={() => setIsAutoMode(!isAutoMode)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent ${theme.focusRing} ${
                      isAutoMode ? theme.accent : 'bg-gray-400/50 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isAutoMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-xs opacity-60">Automatically switches between Work, Study, and Free mode based on your schedule.</p>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-semibold uppercase tracking-wider opacity-70">Schedule Hours</h4>
                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Briefcase className="w-4 h-4" /> Work Mode
                    </label>
                    <div className="flex items-center gap-2">
                      <input type="number" min="0" max="23" value={schedule.workStart} onChange={e => setSchedule({...schedule, workStart: Number(e.target.value)})} className={`w-full text-center transition-colors border ${theme.border} ${theme.inputBg} rounded-lg px-3 py-2 text-sm focus:outline-none`} />
                      <span className="opacity-50 text-sm">to</span>
                      <input type="number" min="0" max="23" value={schedule.workEnd} onChange={e => setSchedule({...schedule, workEnd: Number(e.target.value)})} className={`w-full text-center transition-colors border ${theme.border} ${theme.inputBg} rounded-lg px-3 py-2 text-sm focus:outline-none`} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <BookOpen className="w-4 h-4" /> Study Mode
                    </label>
                    <div className="flex items-center gap-2">
                      <input type="number" min="0" max="23" value={schedule.studyStart} onChange={e => setSchedule({...schedule, studyStart: Number(e.target.value)})} className={`w-full text-center transition-colors border ${theme.border} ${theme.inputBg} rounded-lg px-3 py-2 text-sm focus:outline-none`} />
                      <span className="opacity-50 text-sm">to</span>
                      <input type="number" min="0" max="23" value={schedule.studyEnd} onChange={e => setSchedule({...schedule, studyEnd: Number(e.target.value)})} className={`w-full text-center transition-colors border ${theme.border} ${theme.inputBg} rounded-lg px-3 py-2 text-sm focus:outline-none`} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-semibold uppercase tracking-wider opacity-70">Integrations</h4>
                <div className="flex flex-col gap-3">
                  {!calendarConnected ? (
                    <button
                      onClick={handleConnectCalendar}
                      disabled={isLoggingIn}
                      className="gsi-material-button text-left flex items-center bg-white dark:bg-black text-black dark:text-white border px-4 py-2 rounded-lg font-medium shadow-sm w-full transition hover:bg-gray-50 dark:hover:bg-gray-900"
                    >
                      <div className="mr-3">
                        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5" style={{display: "block"}}>
                          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                          <path fill="none" d="M0 0h48v48H0z"></path>
                        </svg>
                      </div>
                      <span>{isLoggingIn ? 'Connecting...' : 'Connect Google Calendar'}</span>
                    </button>
                  ) : (
                    <div className="flex flex-col gap-2">
                       <span className="text-sm font-medium text-emerald-500">✓ Google Calendar Connected</span>
                       <button onClick={handleDisconnectCalendar} className={`w-full text-left flex items-center justify-center transition-colors border ${theme.border} ${theme.surface} hover:bg-black/5 dark:hover:bg-white/5 rounded-lg px-3 py-2 text-sm font-medium`}>Disconnect Calendar</button>
                    </div>
                  )}
                  <p className="text-xs opacity-60">Sync your deadlines to Google Calendar automatically when adding active tasks.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Link Add Modal */}
      {showAddLink && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowAddLink(false)} />
          <div className={`relative p-6 rounded-2xl border shadow-2xl w-full max-w-xs transition-all duration-300 ${theme.surface} ${theme.border} ${theme.text}`}>
            <h3 className="text-sm font-semibold mb-4">Add Quick Link</h3>
            <form onSubmit={handleAddQuickLink} className="flex flex-col gap-3">
              <input 
                type="text"
                placeholder="Label (e.g. ZM)"
                maxLength={4}
                value={newLinkLabel}
                onChange={e => setNewLinkLabel(e.target.value)}
                className={`w-full transition-colors border ${theme.border} ${theme.inputBg} rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 ${theme.focusRing}`}
                autoFocus
              />
              <input 
                type="url"
                placeholder="https://..."
                value={newLinkUrl}
                onChange={e => setNewLinkUrl(e.target.value)}
                className={`w-full transition-colors border ${theme.border} ${theme.inputBg} rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 ${theme.focusRing}`}
              />
              <div className="flex gap-2 mt-2">
                <button 
                  type="button"
                  onClick={() => setShowAddLink(false)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border ${theme.border} hover:bg-black/5 dark:hover:bg-white/5 transition-colors`}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className={`flex-1 px-3 py-2 rounded-lg text-sm text-white font-medium shadow-md transition-opacity hover:opacity-90 ${theme.accent}`}
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 pt-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm font-medium text-slate-500">
          <div>
            &copy; 2026 Shiftly. Work Hard, Study Smart, Live Free.
          </div>
          <div>
            <a 
              href="https://instagram.com/firshandydwi" 
              target="_blank" 
              rel="noopener noreferrer"
              className="relative group flex items-center justify-center transition-all"
            >
              <span className="opacity-100 group-hover:opacity-0 transition-opacity duration-300">Vibe Code by @firshandydwi</span>
              <span className={`absolute opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${theme.accentText}`}>Vibe Code by @firshandydwi</span>
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}
