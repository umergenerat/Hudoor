
import React, { useState, useEffect, useMemo } from 'react';
import { Save, Clock, CheckCircle, XCircle, AlertCircle, Calendar, BookOpen, AlertTriangle, Users, UserCheck, UserX, Trash2, RefreshCw } from 'lucide-react';
import { Student, AttendanceRecord, AttendanceStatus, Language, ClassGroup } from '../types';
import { TRANSLATIONS } from '../constants';

interface AttendanceSheetProps {
  students: Student[];
  classes: ClassGroup[];
  subjects: string[];
  existingHistory: AttendanceRecord[];
  lang: Language;
  onSaveAttendance: (records: AttendanceRecord[]) => void;
  onDeleteSession: (classId: string, date: string) => void;
}

const AttendanceSheet: React.FC<AttendanceSheetProps> = ({ students, classes, subjects, existingHistory, lang, onSaveAttendance, onDeleteSession }) => {
  const t = (key: string) => TRANSLATIONS[key][lang];
  const dir = lang === Language.AR ? 'rtl' : 'ltr';

  // Selection State
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState<string>('08:00');
  const [endTime, setEndTime] = useState<string>('09:00');

  // Calculate duration in minutes
  const sessionDuration = useMemo(() => {
    if (!startTime || !endTime) return 60;
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const duration = endMinutes - startMinutes;
    return duration > 0 ? duration : 60; // Default to 60 if negative/invalid
  }, [startTime, endTime]);

  // Filter students based on selection - MEMOIZED
  const filteredStudents = useMemo(() => {
    return selectedClassId 
      ? students.filter(s => s.classId === selectedClassId)
      : [];
  }, [students, selectedClassId]);

  const [records, setRecords] = useState<Record<string, AttendanceRecord>>({});
  const [saved, setSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // --- EFFECT: Load Existing Data ---
  // Added existingHistory to dependency to force refresh when parent deletes records
  useEffect(() => {
    if (!selectedClassId || !date) {
        setRecords({});
        setIsEditing(false);
        return;
    }

    // Identify which students belong to this class
    const classStudentIds = new Set(students.filter(s => s.classId === selectedClassId).map(s => s.id));
    
    // Find history that matches date and these students
    const relevantRecords = existingHistory.filter(r => r.date === date && classStudentIds.has(r.studentId));

    if (relevantRecords.length > 0) {
        setIsEditing(true);
        const recordMap: Record<string, AttendanceRecord> = {};
        relevantRecords.forEach(r => {
            recordMap[r.studentId] = r;
        });
        setRecords(recordMap);
    } else {
        setIsEditing(false);
        setRecords({}); 
    }
  }, [date, selectedClassId, existingHistory, students]); 


  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setRecords(prev => ({
      ...prev,
      [studentId]: {
        id: prev[studentId]?.id || Math.random().toString(36),
        studentId,
        date: date,
        status,
        source: 'manual',
        minutesLate: status === AttendanceStatus.LATE ? (prev[studentId]?.minutesLate || 15) : 0,
        subject: subject, // Keep current subject
        sessionDuration: sessionDuration // Keep current duration
      }
    }));
    setSaved(false);
  };

  const handleMinutesChange = (studentId: string, minutes: number) => {
    setRecords(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        minutesLate: minutes
      }
    }));
  };

  const handleMarkAll = (status: AttendanceStatus) => {
      const newRecords = { ...records };
      filteredStudents.forEach(s => {
          newRecords[s.id] = {
            id: newRecords[s.id]?.id || Math.random().toString(36),
            studentId: s.id,
            date: date,
            status: status,
            source: 'manual',
            minutesLate: status === AttendanceStatus.LATE ? 15 : 0,
            subject: subject,
            sessionDuration: sessionDuration
          };
      });
      setRecords(newRecords);
      setSaved(false);
  };

  const handleDeleteClick = () => {
    setShowConfirm(true);
  };

  const confirmDelete = () => {
    if (isEditing) {
        onDeleteSession(selectedClassId, date);
    } 
    setRecords({});
    setIsEditing(false);
    setShowConfirm(false);
    setSaved(false);
  };

  const handleSubmit = () => {
    if (!selectedClassId || !subject) {
      alert(lang === Language.AR ? 'المرجو اختيار القسم والمادة' : 'Please select class and subject');
      return;
    }

    const submissionRecords: AttendanceRecord[] = filteredStudents.map(student => {
      const existingRecord = records[student.id];
      // Default to PRESENT if no interaction
      const status = existingRecord?.status || AttendanceStatus.PRESENT;
      
      return {
        id: existingRecord?.id || Math.random().toString(36),
        studentId: student.id,
        date: date,
        status: status,
        source: 'manual',
        minutesLate: status === AttendanceStatus.LATE ? (existingRecord?.minutesLate || 15) : 0,
        notes: existingRecord?.notes || '',
        subject: subject,
        sessionDuration: sessionDuration
      };
    });

    onSaveAttendance(submissionRecords);
    
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      
      {/* Session Details Form */}
      <div className="bg-white rounded-xl shadow border border-slate-200 p-4 md:p-6" dir={dir}>
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Clock className="text-primary" size={24} />
                </div>
                <h3 className="font-bold text-xl text-slate-900">{t('sessionDetails')}</h3>
            </div>
            {isEditing && (
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-800 rounded-full text-sm font-bold border border-amber-200 shadow-sm animate-pulse w-fit">
                    <AlertTriangle size={16} />
                    {lang === Language.AR ? 'وضع التعديل' : 'Editing Mode'}
                </div>
            )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">{t('selectClass')}</label>
            <select 
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-slate-900 font-semibold shadow-sm"
            >
              <option value="">-- {t('selectClass')} --</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
             <label className="block text-sm font-bold text-slate-800 mb-2">{t('subject')}</label>
             <div className="relative">
               <BookOpen className="absolute top-3.5 left-3 text-slate-400 w-5 h-5 rtl:left-auto rtl:right-3 pointer-events-none" />
               <select 
                 value={subject}
                 onChange={(e) => setSubject(e.target.value)}
                 className={`w-full ${dir === 'ltr' ? 'pl-10' : 'pr-10'} px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-slate-900 font-semibold shadow-sm`}
               >
                 <option value="">-- {t('selectSubject')} --</option>
                 {subjects.map(sub => (
                   <option key={sub} value={sub}>{sub}</option>
                 ))}
               </select>
             </div>
          </div>

          <div>
             <label className="block text-sm font-bold text-slate-800 mb-2">{t('date')}</label>
             <input 
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-slate-900 font-bold shadow-sm"
             />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">{t('timeSlot')}</label>
            <div className="flex items-center gap-3">
              <input 
                type="time" 
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-3 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 shadow-sm"
              />
              <span className="text-slate-400 font-bold">-</span>
              <input 
                type="time" 
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-3 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 shadow-sm"
              />
            </div>
             <p className="text-[10px] text-slate-400 mt-1 font-mono text-right">{sessionDuration} mins</p>
          </div>
        </div>
      </div>

      {/* Attendance List */}
      <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden" dir={dir}>
        <div className="p-4 md:p-6 border-b border-slate-200 flex flex-col xl:flex-row justify-between items-center gap-4 bg-slate-50 sticky top-0 z-20">
          <div className="w-full md:w-auto">
             <h2 className="text-xl font-extrabold text-slate-900">{t('attendance')}</h2>
             {selectedClassId ? (
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">{filteredStudents.length} {t('students')}</span> 
                  <span className="text-slate-300">•</span>
                  <span className="text-xs font-bold text-slate-800 bg-slate-200 px-2 py-1 rounded">{subject || "No Subject"}</span>
                </div>
             ) : (
               <p className="text-amber-700 font-medium text-sm mt-1 flex items-center gap-2">
                 <AlertCircle size={14} />
                 {t('selectClass')}
               </p>
             )}
          </div>

          {selectedClassId && (
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto justify-center">
                 {/* Mark All Buttons */}
                 <div className="flex bg-slate-100 rounded-lg p-1 gap-1 border border-slate-200 w-full sm:w-auto">
                    <button 
                        type="button"
                        onClick={() => handleMarkAll(AttendanceStatus.PRESENT)} 
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-extrabold text-white bg-green-600 hover:bg-green-700 transition-colors shadow-sm"
                    >
                        <UserCheck size={18} />
                        <span className="hidden md:inline">{lang === Language.AR ? 'الكل حاضر' : 'All Present'}</span>
                    </button>
                    <button 
                        type="button"
                        onClick={() => handleMarkAll(AttendanceStatus.ABSENT)} 
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-extrabold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm"
                    >
                        <UserX size={18} />
                        <span className="hidden md:inline">{lang === Language.AR ? 'الكل غائب' : 'All Absent'}</span>
                    </button>
                 </div>
                 
                 <div className="h-8 w-px bg-slate-300 mx-1 hidden sm:block"></div>
                 
                 <div className="flex gap-2 w-full sm:w-auto">
                    <button 
                        type="button"
                        onClick={handleDeleteClick}
                        className={`p-3 md:p-2.5 rounded-lg border transition-all font-bold flex-1 sm:flex-none flex justify-center ${
                            isEditing 
                            ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-600 hover:text-white' 
                            : 'text-slate-500 hover:text-red-600 hover:bg-red-50 border-slate-300 hover:border-red-200'
                        }`}
                        title={isEditing ? (lang === Language.AR ? 'حذف السجل نهائياً' : 'Delete Record Permanently') : (lang === Language.AR ? 'مسح البيانات' : 'Reset/Clear')}
                    >
                        <Trash2 size={20} />
                    </button>

                    <button 
                        type="button"
                        onClick={handleSubmit}
                        disabled={!selectedClassId}
                        className="flex-1 sm:flex-none bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 font-bold"
                    >
                        <Save size={20} />
                        <span>{saved ? t('recordsSaved') : t('submit')}</span>
                    </button>
                 </div>
            </div>
          )}
        </div>

        {selectedClassId ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead className="bg-slate-100 text-slate-700 font-extrabold text-sm uppercase tracking-wide border-b border-slate-200">
                <tr>
                  <th className={`p-4 md:p-5 w-1/3 min-w-[200px] ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>{t('students')}</th>
                  <th className="p-4 md:p-5 text-center min-w-[280px]">Attendance Status</th>
                  <th className="p-4 md:p-5 text-center w-24 hidden sm:table-cell">{t('riskAlert')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredStudents.length > 0 ? filteredStudents.map(student => {
                  const record = records[student.id];
                  const currentStatus = record?.status || AttendanceStatus.PRESENT; 
                  
                  return (
                    <tr key={student.id} className={`transition-colors duration-150 ${currentStatus === AttendanceStatus.ABSENT ? 'bg-red-50' : 'bg-white hover:bg-slate-50'}`}>
                      {/* Student Info */}
                      <td className={`p-4 md:p-5 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                        <div className="flex items-center gap-3 md:gap-4">
                          <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-base md:text-lg font-bold shadow-sm border-2 ${
                              student.riskScore > 50 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-50 border-slate-200 text-slate-600'
                          }`}>
                            {student.firstName[0]}{student.lastName[0]}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 text-sm md:text-base">{student.firstName} {student.lastName}</div>
                            <div className="text-xs text-slate-500 font-bold font-mono mt-0.5">{student.studentCode}</div>
                          </div>
                        </div>
                      </td>
                      
                      {/* Status Segmented Control */}
                      <td className="p-4 md:p-5">
                          <div className="flex items-center justify-center gap-2 md:gap-4">
                            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 shadow-inner w-full max-w-md">
                                {[
                                    { s: AttendanceStatus.PRESENT, label: t('present'), color: 'bg-green-600', icon: CheckCircle },
                                    { s: AttendanceStatus.ABSENT, label: t('absent'), color: 'bg-red-600', icon: XCircle },
                                    { s: AttendanceStatus.LATE, label: t('late'), color: 'bg-yellow-500', icon: Clock },
                                    { s: AttendanceStatus.EXCUSED, label: t('excused'), color: 'bg-blue-500', icon: AlertCircle },
                                ].map((option) => {
                                    const isActive = currentStatus === option.s;
                                    return (
                                        <button
                                            key={option.s}
                                            type="button"
                                            onClick={() => handleStatusChange(student.id, option.s)}
                                            className={`flex-1 flex flex-col items-center justify-center gap-1 py-1.5 md:py-2 px-1 md:px-2 rounded-md text-[10px] md:text-sm font-bold transition-all duration-200 ${
                                                isActive 
                                                ? `${option.color} text-white shadow-md transform scale-105 z-10` 
                                                : 'text-slate-500 hover:bg-white hover:text-slate-700 hover:shadow-sm'
                                            }`}
                                        >
                                            <option.icon size={16} className="mb-0.5 md:mb-0" />
                                            <span className="hidden md:inline">{option.label}</span>
                                            <span className="md:hidden text-[9px] uppercase">{option.s.substring(0,3)}</span>
                                        </button>
                                    );
                                })}
                            </div>
                            
                            {/* Dynamic Late Input */}
                            {currentStatus === AttendanceStatus.LATE && (
                                <div className="hidden md:flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                                    <input 
                                        type="number" 
                                        min="1"
                                        value={record?.minutesLate || 15}
                                        onChange={(e) => handleMinutesChange(student.id, parseInt(e.target.value) || 0)}
                                        className="w-16 px-2 py-2 border-2 border-yellow-400 rounded-lg text-center font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-yellow-200 bg-yellow-50"
                                    />
                                    <span className="text-xs font-bold text-slate-500">min</span>
                                </div>
                            )}
                          </div>
                          {/* Mobile Only Late Input */}
                          {currentStatus === AttendanceStatus.LATE && (
                             <div className="md:hidden mt-2 flex justify-center items-center gap-2">
                                <span className="text-xs font-bold text-slate-500">Late (min):</span>
                                <input 
                                    type="number" 
                                    min="1"
                                    value={record?.minutesLate || 15}
                                    onChange={(e) => handleMinutesChange(student.id, parseInt(e.target.value) || 0)}
                                    className="w-16 px-2 py-1 border border-yellow-400 rounded-lg text-center font-bold text-slate-800 bg-yellow-50 text-sm"
                                />
                             </div>
                          )}
                      </td>
                      
                      {/* Risk Score */}
                      <td className="p-4 md:p-5 text-center align-middle hidden sm:table-cell">
                        {student.riskScore > 0 ? (
                          <div className="flex flex-col items-center justify-center">
                            <div className="relative w-12 h-12 flex items-center justify-center">
                                <svg className="transform -rotate-90 w-12 h-12">
                                    <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-100" />
                                    <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="4" fill="transparent" 
                                        strokeDasharray={113}
                                        strokeDashoffset={113 - (113 * student.riskScore) / 100}
                                        className={student.riskScore > 50 ? 'text-red-500' : 'text-amber-500'}
                                    />
                                </svg>
                                <span className={`absolute text-[10px] font-extrabold ${student.riskScore > 50 ? 'text-red-700' : 'text-amber-700'}`}>
                                    {student.riskScore}%
                                </span>
                            </div>
                          </div>
                        ) : (
                            <span className="text-slate-300">-</span>
                        )}
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={3} className="p-16 text-center text-slate-500">
                      <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                      <p className="font-bold text-lg">No students found in this class.</p>
                      <p className="text-sm text-slate-400">Add students via Settings or OCR to get started.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 md:p-20 text-center text-slate-500 bg-slate-50">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-sm border border-slate-200">
                <Calendar className="w-8 h-8 md:w-10 md:h-10 text-primary" />
            </div>
            <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-2">{t('selectClass')}</h3>
            <p className="text-sm md:text-base font-medium text-slate-500">Please select a class and subject above to start tracking attendance.</p>
          </div>
        )}

        {saved && (
          <div className="bg-green-700 text-white p-4 text-center text-base font-bold animate-in slide-in-from-bottom-5 fixed bottom-0 left-0 md:left-64 right-0 shadow-lg z-30 md:absolute md:w-full">
             {t('recordsSaved')}
          </div>
        )}
      </div>

      {/* Confirmation Modal for Session Delete */}
      {showConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" style={{ margin: 0 }}>
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 transform scale-100 animate-in zoom-in-95 duration-200" dir={dir}>
                <div className="bg-red-50 p-6 flex items-start gap-4 border-b border-red-100">
                    <div className="bg-red-100 p-2 rounded-full text-red-600"><AlertTriangle size={24} /></div>
                    <div>
                        <h3 className="text-lg font-extrabold text-red-900">{isEditing ? (lang === Language.AR ? 'حذف سجل الحضور' : 'Delete Attendance Record') : (lang === Language.AR ? 'إفراغ النموذج' : 'Clear Form')}</h3>
                        <p className="text-sm text-red-700 mt-1 font-medium">
                            {isEditing 
                                ? (lang === Language.AR ? 'هل أنت متأكد من حذف هذا السجل نهائياً؟ لا يمكن التراجع عن هذا الإجراء.' : 'Are you sure you want to permanently delete this record? This cannot be undone.')
                                : (lang === Language.AR ? 'هل أنت متأكد من إفراغ النموذج؟' : 'Are you sure you want to clear the form?')}
                        </p>
                    </div>
                </div>
                <div className="p-4 bg-white flex justify-end gap-3">
                    <button 
                        onClick={() => setShowConfirm(false)}
                        className="px-5 py-2.5 bg-white text-slate-700 font-bold border border-slate-300 rounded-lg hover:bg-slate-50 active:scale-95 transition-all"
                    >
                        {lang === Language.AR ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button 
                        onClick={confirmDelete}
                        className="px-5 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 active:scale-95 shadow-md shadow-red-200 transition-all"
                    >
                        {lang === Language.AR ? 'نعم، تابع' : 'Yes, Proceed'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceSheet;