
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, FileText, Settings as SettingsIcon, Menu, X, Globe, Download, LogOut } from 'lucide-react';
import Dashboard from './components/Dashboard';
import AttendanceSheet from './components/AttendanceSheet';
import OCRUpload from './components/OCRUpload';
import Settings from './components/Settings';
import Login from './components/Login';
import { Language, Student, ClassGroup, AttendanceRecord, AttendanceStatus, AppSettings, AuthConfig, User } from './types';
import { TRANSLATIONS, MOCK_STUDENTS, MOCK_CLASSES, MOCK_SUBJECTS } from './constants';

// --- Custom Hook for Persistence ---
function useStickyState<T>(defaultValue: T, key: string): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stickyValue = window.localStorage.getItem(key);
      return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
    } catch (error) {
      console.warn(`Error parsing localStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, value]);

  return [value, setValue];
}

type View = 'dashboard' | 'attendance' | 'ocr' | 'settings';

const DEFAULT_SETTINGS: AppSettings = {
  schoolName: "ISTA-TATA",
  lateThreshold: 15,
  emailAlerts: true,
  smsAlerts: false,
  subjectConfigs: {}
};

// Default Admin User
const DEFAULT_ADMIN: User = {
    id: 'admin-1',
    name: 'Directeur',
    email: 'admin@ISTA.Tata.ma',
    password: 'admin',
    role: 'admin',
    assignedClassIds: [],
    assignedSubjects: []
};

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthConfig>({ isAuthenticated: false, currentUser: null });
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [lang, setLang] = useState<Language>(Language.EN);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // --- Global Persistent State ---
  const [students, setStudents] = useStickyState<Student[]>(MOCK_STUDENTS, 'hudoor_students');
  const [classes, setClasses] = useStickyState<ClassGroup[]>(MOCK_CLASSES, 'hudoor_classes');
  const [subjects, setSubjects] = useStickyState<string[]>(MOCK_SUBJECTS, 'hudoor_subjects');
  const [attendanceHistory, setAttendanceHistory] = useStickyState<AttendanceRecord[]>([], 'hudoor_history');
  const [appSettings, setAppSettings] = useStickyState<AppSettings>(DEFAULT_SETTINGS, 'hudoor_settings');
  
  // Users Management State
  const [users, setUsers] = useStickyState<User[]>([DEFAULT_ADMIN], 'hudoor_users');

  // PWA Install Event Listener
  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  // Ensure there's always an admin
  useEffect(() => {
     if (!users.some(u => u.role === 'admin')) {
         setUsers(prev => [...prev, DEFAULT_ADMIN]);
     }
  }, [users, setUsers]);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        setDeferredPrompt(null);
      });
    }
  };

  // Direction handling
  const dir = lang === Language.AR ? 'rtl' : 'ltr';

  // --- Login Handler ---
  const handleLogin = (user: User) => {
      setAuth({ isAuthenticated: true, currentUser: user });
  };

  const handleLogout = () => {
      setAuth({ isAuthenticated: false, currentUser: null });
      setCurrentView('dashboard');
  };

  // --- Core Logic ---

  // Save or Update Attendance (Smart Merge)
  const handleSaveAttendance = (newRecords: AttendanceRecord[]) => {
    setAttendanceHistory(prev => {
      // Create a map of existing records for fast lookup (Date + StudentID)
      // We filter out records that are being replaced/updated
      const remainingRecords = prev.filter(p => 
        !newRecords.some(n => n.studentId === p.studentId && n.date === p.date)
      );
      
      // Merge old remaining records with new/updated records
      const updatedHistory = [...remainingRecords, ...newRecords];
      
      // Update student statistics immediately for UI responsiveness
      updateStudentStats(updatedHistory);
      
      return updatedHistory;
    });
  };
  
  // Delete Session (Cleanly remove records)
  const handleDeleteSession = (classId: string, date: string) => {
    // Identify students in this class to remove their records for this date
    const classStudentIds = new Set(students.filter(s => s.classId === classId).map(s => s.id));
    
    setAttendanceHistory(prev => {
      const updatedHistory = prev.filter(r => !(r.date === date && classStudentIds.has(r.studentId)));
      // Defer stats update to ensure we have the new history
      setTimeout(() => updateStudentStats(updatedHistory), 0);
      return updatedHistory;
    });
  };

  // Recalculate Risk Scores and Absence Counts
  const updateStudentStats = (history: AttendanceRecord[]) => {
    const stats: Record<string, { absent: number, total: number }> = {};
    
    history.forEach(rec => {
      if (!stats[rec.studentId]) stats[rec.studentId] = { absent: 0, total: 0 };
      stats[rec.studentId].total += 1;
      if (rec.status === AttendanceStatus.ABSENT) {
        stats[rec.studentId].absent += 1;
      }
    });

    setStudents(prevStudents => prevStudents.map(s => {
      const sStats = stats[s.id] || { absent: 0, total: 0 };
      // Simple Risk Algorithm: (Absences / Total Days) * 100, heavily weighted
      // Or just raw count for simplicity in this demo
      const risk = sStats.total > 0 ? (sStats.absent / sStats.total) * 100 : 0;
      
      return {
        ...s,
        absenceCount: sStats.absent,
        riskScore: Math.min(100, Math.round(risk))
      };
    }));
  };

  // Reset System (For Debugging/Demo) - Admin Only
  const handleResetSystem = () => {
    if(confirm("Are you sure? This will wipe all data including students, settings and logs.")) {
      localStorage.clear();
      window.location.reload();
    }
  };
  
  // --- If Not Authenticated, Show Login ---
  if (!auth.isAuthenticated) {
      return (
        <div dir={dir} className={lang === Language.AR ? 'font-cairo' : 'font-sans'}>
           <Login onLogin={handleLogin} users={users} />
           <div className="fixed bottom-4 left-4 z-50 flex gap-2">
                <button onClick={() => setLang(Language.EN)} className={`text-xs px-2 py-1 bg-white/50 rounded ${lang===Language.EN?'font-bold':''}`}>EN</button>
                <button onClick={() => setLang(Language.FR)} className={`text-xs px-2 py-1 bg-white/50 rounded ${lang===Language.FR?'font-bold':''}`}>FR</button>
                <button onClick={() => setLang(Language.AR)} className={`text-xs px-2 py-1 bg-white/50 rounded ${lang===Language.AR?'font-bold':''}`}>AR</button>
           </div>
        </div>
      );
  }

  const NavItem = ({ view, icon: Icon, label }: { view: View; icon: any; label: string }) => (
    <button
      onClick={() => {
        setCurrentView(view);
        setMobileMenuOpen(false);
      }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
        currentView === view 
          ? 'bg-teal-800 text-white font-bold shadow-md border-r-4 border-teal-300' 
          : 'text-teal-100 hover:bg-teal-800/50 hover:text-white font-medium'
      }`}
    >
      <Icon size={20} className={currentView === view ? 'text-teal-300' : ''} />
      <span>{label}</span>
    </button>
  );
  
  const isAdmin = auth.currentUser?.role === 'admin';

  return (
    <div dir={dir} className={`min-h-screen bg-slate-100 flex flex-col md:flex-row ${lang === Language.AR ? 'font-cairo' : 'font-sans'}`}>
      
      {/* Sidebar - Desktop */}
      <aside className={`hidden md:flex flex-col w-64 bg-primary text-white p-4 fixed h-full z-20 transition-all shadow-2xl ${dir === 'rtl' ? 'right-0' : 'left-0'}`}>
        <div className="flex items-center gap-3 px-2 mb-10 mt-4">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary font-bold text-2xl shadow-inner">H</div>
          <div>
            <h1 className="text-xl font-bold tracking-tight leading-none text-white">Hudoor AI</h1>
            <span className="text-xs text-teal-200 opacity-90 font-medium">Smart Education</span>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <NavItem view="dashboard" icon={LayoutDashboard} label={TRANSLATIONS.dashboard[lang]} />
          <NavItem view="attendance" icon={Users} label={TRANSLATIONS.attendance[lang]} />
          <NavItem view="ocr" icon={FileText} label={TRANSLATIONS.ocrUpload[lang]} />
        </nav>

        <div className="pt-4 border-t border-teal-600 space-y-2">
           <div className="px-4 py-2">
              <p className="text-xs text-teal-200 uppercase font-bold tracking-wider mb-2 opacity-90">System</p>
              <div className="flex gap-2 bg-black/20 p-1 rounded-lg">
                <button onClick={() => setLang(Language.EN)} className={`flex-1 py-1 text-xs font-bold rounded transition-all ${lang === Language.EN ? 'bg-white text-primary shadow' : 'text-teal-100 hover:bg-white/10'}`}>EN</button>
                <button onClick={() => setLang(Language.FR)} className={`flex-1 py-1 text-xs font-bold rounded transition-all ${lang === Language.FR ? 'bg-white text-primary shadow' : 'text-teal-100 hover:bg-white/10'}`}>FR</button>
                <button onClick={() => setLang(Language.AR)} className={`flex-1 py-1 text-xs font-bold rounded transition-all ${lang === Language.AR ? 'bg-white text-primary shadow' : 'text-teal-100 hover:bg-white/10'}`}>AR</button>
              </div>
           </div>
           
           {isAdmin && (
               <button 
                 onClick={() => setCurrentView('settings')}
                 className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium ${currentView === 'settings' ? 'bg-teal-800 text-white' : 'text-teal-100 hover:text-white hover:bg-teal-800/30'}`}
               >
                <SettingsIcon size={20} />
                <span>{TRANSLATIONS.settings[lang]}</span>
              </button>
           )}
           
           <button 
             onClick={handleLogout}
             className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium text-red-200 hover:bg-red-900/30 hover:text-white mt-2"
           >
            <LogOut size={20} />
            <span>Logout</span>
           </button>
          
          {/* New Developer Signature in Sidebar */}
          <div className="pt-6 mt-2 text-center border-t border-teal-700/50">
             <p className="text-[10px] text-teal-300 font-medium opacity-70 mb-1">Developed by</p>
             <p className="text-sm text-white font-bold tracking-wide">Aomar Ait Loutou</p>
             <p className="text-xs text-teal-100 font-bold font-cairo mt-0.5">عمر ايت لوتو</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 flex flex-col transition-all duration-300 ${dir === 'rtl' ? 'md:mr-64' : 'md:ml-64'}`}>
        
        {/* Header - Mobile Only */}
        <header className="md:hidden bg-primary text-white p-4 flex justify-between items-center sticky top-0 z-30 shadow-md">
           <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-primary font-bold">H</div>
             <span className="font-bold">Hudoor AI</span>
           </div>
           <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
             {mobileMenuOpen ? <X /> : <Menu />}
           </button>
        </header>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-20 bg-primary pt-20 px-4 space-y-4 animate-in slide-in-from-top-10 flex flex-col h-full">
            <NavItem view="dashboard" icon={LayoutDashboard} label={TRANSLATIONS.dashboard[lang]} />
            <NavItem view="attendance" icon={Users} label={TRANSLATIONS.attendance[lang]} />
            <NavItem view="ocr" icon={FileText} label={TRANSLATIONS.ocrUpload[lang]} />
            {isAdmin && <NavItem view="settings" icon={SettingsIcon} label={TRANSLATIONS.settings[lang]} />}
            
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-200 hover:bg-red-900/30 font-bold">
                <LogOut size={20} /> Logout
            </button>

            <div className="mt-8 flex gap-4 justify-center">
                <button onClick={() => {setLang(Language.EN); setMobileMenuOpen(false);}} className="text-white border border-white/30 px-3 py-1 rounded">English</button>
                <button onClick={() => {setLang(Language.AR); setMobileMenuOpen(false);}} className="text-white border border-white/30 px-3 py-1 rounded">العربية</button>
            </div>
            
            <div className="mt-auto pb-8 text-center border-t border-teal-700/30 pt-4">
                 <p className="text-xs text-teal-300">Developed by</p>
                 <p className="text-white font-bold">Aomar Ait Loutou</p>
            </div>
          </div>
        )}

        <div className="p-6 md:p-8 max-w-7xl mx-auto flex-1 w-full">
          <header className="mb-8 flex justify-between items-end">
            <div>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {currentView === 'dashboard' && TRANSLATIONS.dashboard[lang]}
                {currentView === 'attendance' && TRANSLATIONS.attendance[lang]}
                {currentView === 'ocr' && TRANSLATIONS.ocrUpload[lang]}
                {currentView === 'settings' && TRANSLATIONS.settings[lang]}
              </h2>
              <p className="text-slate-600 mt-2 font-medium text-lg flex items-center gap-2">
                 <span>{appSettings.schoolName || (lang === Language.AR ? "لوحة الإدارة التربوية الذكية" : "Smart Educational Management Dashboard")}</span>
                 {auth.currentUser && (
                     <span className="text-xs bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full border border-teal-200">
                         {auth.currentUser.name} ({auth.currentUser.role === 'admin' ? (lang===Language.AR?'مدير':'Admin') : (lang===Language.AR?'أستاذ':'Teacher')})
                     </span>
                 )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {deferredPrompt && (
                  <button 
                    onClick={handleInstallClick}
                    className="hidden md:flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg font-bold shadow-md hover:bg-slate-800 transition-all animate-pulse"
                  >
                    <Download size={18} />
                    {lang === Language.AR ? 'تثبيت التطبيق' : 'Install App'}
                  </button>
              )}
              <span className="hidden md:inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-300 text-sm font-bold text-slate-700 shadow-sm">
                <Globe size={16} className="text-primary" />
                {lang === Language.EN ? "English" : lang === Language.FR ? "Français" : "العربية"}
              </span>
            </div>
          </header>

          <div className="animate-fade-in">
            {currentView === 'dashboard' && (
              <Dashboard 
                lang={lang} 
                students={students} 
                attendanceHistory={attendanceHistory}
                appSettings={appSettings}
              />
            )}
            
            {currentView === 'attendance' && (
              <AttendanceSheet 
                lang={lang} 
                students={students} 
                classes={isAdmin ? classes : classes.filter(c => auth.currentUser?.assignedClassIds.includes(c.id))} 
                subjects={isAdmin ? subjects : subjects.filter(s => auth.currentUser?.assignedSubjects.includes(s))} 
                existingHistory={attendanceHistory}
                onSaveAttendance={handleSaveAttendance}
                onDeleteSession={handleDeleteSession}
              />
            )}
            
            {currentView === 'ocr' && (
              <OCRUpload 
                lang={lang} 
                students={students} 
                classes={isAdmin ? classes : classes.filter(c => auth.currentUser?.assignedClassIds.includes(c.id))}
                subjects={isAdmin ? subjects : subjects.filter(s => auth.currentUser?.assignedSubjects.includes(s))}
                apiKey={appSettings.apiKey}
                onSaveToSystem={handleSaveAttendance}
              />
            )}
            
            {currentView === 'settings' && isAdmin && (
              <Settings 
                lang={lang} 
                students={students} 
                classes={classes} 
                subjects={subjects}
                appSettings={appSettings}
                users={users} 
                currentUser={auth.currentUser} // Pass current logged in user
                onUpdateStudents={setStudents} 
                onUpdateClasses={setClasses} 
                onUpdateSubjects={setSubjects}
                onUpdateAppSettings={setAppSettings}
                onUpdateUsers={(updatedUsers) => {
                    setUsers(updatedUsers);
                    // Check if current logged in user was updated
                    if (auth.currentUser) {
                        const updatedCurrentUser = updatedUsers.find(u => u.id === auth.currentUser!.id);
                        if (updatedCurrentUser) {
                            setAuth(prev => ({ ...prev, currentUser: updatedCurrentUser }));
                        }
                    }
                }}
              />
            )}
          </div>
        </div>
        
        {/* Footer */}
        <footer className="py-8 border-t border-slate-300 bg-white mt-auto shadow-inner">
          <div className="max-w-7xl mx-auto px-6 md:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm font-semibold text-slate-600">
              © {new Date().getFullYear()} {appSettings.schoolName}
            </p>
            {isAdmin && (
                <button onClick={handleResetSystem} className="text-xs font-semibold text-red-400 hover:text-red-600 underline">
                Reset System Data
                </button>
            )}
          </div>
        </footer>
      </main>
    </div>
  );
};

export default App;
