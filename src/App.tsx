import React, { useState, useEffect, useRef } from 'react';
import { Briefcase, BookOpen, Coffee, Clock, RotateCcw, LayoutDashboard, Settings, Plus, CheckCircle2, Circle, Image as ImageIcon, Target, Wallet, GraduationCap, Calculator, Trash2, Play, Pause, Archive } from 'lucide-react';

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
    // For IDR default, a larger initial default value (e.g. 5,000,000) makes more sense than 500
    return saved ? JSON.parse(saved) : 5000000;
  });

  const [currentSavings, setCurrentSavings] = useState<number>(() => {
    const saved = localStorage.getItem('shiftly_currentSavings');
    return saved ? JSON.parse(saved) : 0;
  });

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

  const alarmRef = useRef<HTMLAudioElement | null>(null);

  // Ephemeral UI State
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [showSettings, setShowSettings] = useState(false);
  
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('Medium');

  const [newWishlistName, setNewWishlistName] = useState('');
  const [newWishlistPrice, setNewWishlistPrice] = useState('');
  const [newWishlistImage, setNewWishlistImage] = useState('');

  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseCredits, setNewCourseCredits] = useState<number>(3);
  const [newCourseScore, setNewCourseScore] = useState<string>('');

  // --- PERSISTENCE LOGIC ---
  useEffect(() => { localStorage.setItem('shiftly_mode', currentMode); }, [currentMode]);
  useEffect(() => { localStorage.setItem('shiftly_autoMode', JSON.stringify(isAutoMode)); }, [isAutoMode]);
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
        
        // Logic: Weekends are mostly Free Mode, Weekdays have distinct blocks
        if (day !== 0 && day !== 6) { // Mon-Fri
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

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle.trim(),
      category: currentMode,
      priority: newTaskPriority,
      completed: false
    };
    setTasks([...tasks, newTask]);
    setNewTaskTitle('');
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const addWishlistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWishlistName.trim() || !newWishlistPrice) return;
    
    const price = parseFloat(newWishlistPrice);
    if (isNaN(price) || price < 0) return;

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
  };
  
  const deleteWishlistItem = (id: string) => {
    setWishlist(wishlist.filter(w => w.id !== id));
  };

  const addCourse = (e: React.FormEvent) => {
    e.preventDefault();
    const score = parseFloat(newCourseScore);
    if (!newCourseName.trim() || newCourseCredits < 1 || isNaN(score) || score < 0 || score > 4) return;

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
  };

  const deleteCourse = (id: string) => {
    setCourses(courses.filter(c => c.id !== id));
  };

  const handleArchiveCompleted = () => {
    setTasks(tasks.map(t => 
      (t.category === currentMode && t.completed) ? { ...t, archived: true } : t
    ));
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

            {/* Auto Mode Status CTA */}
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2">
                <span className="text-xs font-medium opacity-80 uppercase tracking-wider">
                  Auto-Sync {isAutoMode ? 'ON' : 'OFF'}
                </span>
                <span className="relative flex h-2 w-2">
                  {isAutoMode && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${theme.accent.replace('bg-', 'bg-')}`}></span>}
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${isAutoMode ? theme.accent : 'bg-gray-400'}`}></span>
                </span>
              </div>
              
              {/* Explicit Toggle */}
              <button
                onClick={() => setIsAutoMode(!isAutoMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent ${theme.focusRing} ${
                  isAutoMode ? theme.accent : 'bg-gray-400/50 dark:bg-gray-600'
                }`}
                title="Toggle Auto-Sync"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isAutoMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header Section */}
        <div className="mb-6 flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-end justify-between">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2 transition-colors duration-700">
              Good {
                currentTime.getHours() < 12 ? 'Morning' : 
                currentTime.getHours() < 18 ? 'Afternoon' : 'Evening'
              }.
            </h2>
            <p className="opacity-70 text-lg flex items-center">
              Currently prioritizing <strong className={`mx-2 ${theme.accentText} transition-colors duration-700`}>{theme.label}</strong> tasks.
            </p>
          </div>
          
          <div className="flex space-x-3">
             <button 
                onClick={() => setShowSettings(!showSettings)}
                className={`p-3 rounded-xl border transition-colors duration-700 ${theme.border} ${theme.surface} hover:opacity-80`}
                title="Toggle Schedule Settings"
             >
                <Settings className={`w-5 h-5 transition-colors ${showSettings ? theme.accentText : 'opacity-70'}`} />
             </button>
          </div>
        </div>

        {/* Schedule Settings Panel */}
        {showSettings && (
          <div className={`mb-8 p-6 rounded-2xl border transition-all duration-500 overflow-hidden shadow-sm ${theme.surface} ${theme.border}`}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className={`w-5 h-5 ${theme.accentText}`} />
              Schedule Settings
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="flex flex-col gap-3">
                <label className="text-sm font-medium opacity-80 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" /> Work Mode Hours
                </label>
                <div className="flex items-center gap-3">
                  <input type="number" min="0" max="23" value={schedule.workStart} onChange={e => setSchedule({...schedule, workStart: Number(e.target.value)})} className={`w-20 transition-colors border ${theme.border} ${theme.inputBg} rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:border-[transparent] ${theme.focusRing}`} />
                  <span className="opacity-50">to</span>
                  <input type="number" min="0" max="23" value={schedule.workEnd} onChange={e => setSchedule({...schedule, workEnd: Number(e.target.value)})} className={`w-20 transition-colors border ${theme.border} ${theme.inputBg} rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:border-[transparent] ${theme.focusRing}`} />
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <label className="text-sm font-medium opacity-80 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" /> Study Mode Hours
                </label>
                <div className="flex items-center gap-3">
                  <input type="number" min="0" max="23" value={schedule.studyStart} onChange={e => setSchedule({...schedule, studyStart: Number(e.target.value)})} className={`w-20 transition-colors border ${theme.border} ${theme.inputBg} rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:border-[transparent] ${theme.focusRing}`} />
                  <span className="opacity-50">to</span>
                  <input type="number" min="0" max="23" value={schedule.studyEnd} onChange={e => setSchedule({...schedule, studyEnd: Number(e.target.value)})} className={`w-20 transition-colors border ${theme.border} ${theme.inputBg} rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:border-[transparent] ${theme.focusRing}`} />
                </div>
              </div>
            </div>
            <p className="text-xs opacity-50 mt-5 flex items-center gap-2 border-t pt-4 border-[inherit]">
              <Coffee className="w-4 h-4" /> Free Mode applies automatically to weekends and any unassigned hours.
            </p>
          </div>
        )}

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
                className={`flex-1 transition-colors border ${theme.border} ${theme.inputBg} rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:border-[transparent] ${theme.focusRing}`}
              />
              <div className="flex gap-3">
                <select 
                  value={newTaskPriority}
                  onChange={e => setNewTaskPriority(e.target.value as Priority)}
                  className={`border transition-colors ${theme.border} ${theme.inputBg} rounded-xl px-3 py-2.5 text-sm focus:outline-none`}
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
                <button 
                  type="submit" 
                  className={`px-5 py-2.5 rounded-xl text-white font-medium transition-all hover:opacity-90 hover:scale-[1.02] flex items-center justify-center ${theme.accent} shadow-md`}
                >
                  <Plus className="w-5 h-5" />
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
                    <span className={`flex-1 text-sm font-medium transition-all duration-300 ${task.completed ? 'line-through opacity-70' : ''}`}>
                      {task.title}
                    </span>
                    <button 
                      onClick={() => setTasks(tasks.filter(t => t.id !== task.id))}
                      className="p-1.5 opacity-0 group-hover:opacity-40 hover:!opacity-100 hover:text-red-500 transition-all rounded-md flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <span className={`text-[10px] flex-shrink-0 uppercase tracking-wider font-bold px-2.5 py-1 rounded-md transition-opacity duration-300 ${PRIORITY_BADGES[task.priority]} ${task.completed ? 'opacity-40' : ''}`}>
                      {task.priority}
                    </span>
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
                  <button 
                    type="submit" 
                    className={`px-3 py-2 rounded-lg text-white font-medium transition-all hover:opacity-90 flex items-center justify-center ${theme.accent} shadow-md`}
                  >
                    <Plus className="w-4 h-4" />
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
                        <button 
                          onClick={() => deleteWishlistItem(item.id)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 opacity-0 group-hover:opacity-40 hover:!opacity-100 hover:text-red-500 transition-all rounded-md"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : currentMode === 'study' ? (
            <div className="col-span-1 flex flex-col gap-6">
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
                  <button 
                    type="submit" 
                    className={`px-3 py-2 rounded-lg text-white font-medium transition-all hover:opacity-90 flex items-center justify-center ${theme.accent} shadow-md`}
                  >
                    <Plus className="w-4 h-4" />
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
                          <button 
                            onClick={() => deleteCourse(course.id)}
                            className="p-1.5 opacity-0 group-hover:opacity-40 hover:!opacity-100 hover:text-red-500 transition-all rounded-md"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

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
          </div>
          ) : (
            <div className={`col-span-1 rounded-2xl border p-6 flex flex-col transition-all duration-700 shadow-sm ${theme.surface} ${theme.border}`}>
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
              <div className="mt-8 flex-1 flex flex-col items-center justify-center">
                <Coffee className={`w-8 h-8 mb-4 opacity-20 ${theme.accentText}`} />
                <p className="text-sm opacity-50 text-center font-medium">
                  Enjoy your break time.
                </p>
              </div>
            </div>
          )}

        </div>
      </main>

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
