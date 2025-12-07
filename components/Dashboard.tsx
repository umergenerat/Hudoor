
import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { Users, Clock, AlertTriangle, Calendar, X, TrendingUp, Phone, MessageSquare, MessageCircle, AlertCircle } from 'lucide-react';
import { Language, DashboardMetrics, Student, AttendanceRecord, AttendanceStatus, AppSettings } from '../types';
import { TRANSLATIONS } from '../constants';

interface DashboardProps {
  lang: Language;
  students: Student[];
  attendanceHistory: AttendanceRecord[];
  appSettings?: AppSettings;
}

const Dashboard: React.FC<DashboardProps> = ({ lang, students, attendanceHistory, appSettings }) => {
  const t = (key: string) => TRANSLATIONS[key][lang];
  const dir = lang === Language.AR ? 'rtl' : 'ltr';
  
  // Student Detail Modal State
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const { history, metrics, riskStudents } = useMemo(() => {
    // 1. Process History for Charts
    const groupedByDate: Record<string, { date: string; present: number; absent: number; late: number; total: number }> = {};

    attendanceHistory.forEach(record => {
      const date = record.date;
      if (!groupedByDate[date]) {
        groupedByDate[date] = { date, present: 0, absent: 0, late: 0, total: 0 };
      }
      
      groupedByDate[date].total += 1;
      
      if (record.status === AttendanceStatus.PRESENT) groupedByDate[date].present += 1;
      else if (record.status === AttendanceStatus.ABSENT) groupedByDate[date].absent += 1;
      else if (record.status === AttendanceStatus.LATE) groupedByDate[date].late += 1;
      else if (record.status === AttendanceStatus.EXCUSED) groupedByDate[date].absent += 1; 
    });

    const historyData = Object.values(groupedByDate).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const formattedHistory = historyData.map(item => ({
      ...item,
      name: new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
    }));

    // 2. Calculate Metrics
    const totalRecords = attendanceHistory.length;
    let totalPresent = 0;
    let totalLateMinutes = 0;
    let totalAbsences = 0;

    const studentStats: Record<string, { total: number; absent: number }> = {};
    students.forEach(s => studentStats[s.id] = { total: 0, absent: 0 });

    attendanceHistory.forEach(record => {
      if (record.status === AttendanceStatus.PRESENT || record.status === AttendanceStatus.LATE) {
        totalPresent++;
      }
      if (record.status === AttendanceStatus.LATE) {
        totalLateMinutes += (record.minutesLate || 0);
      }
      if (record.status === AttendanceStatus.ABSENT) {
        totalAbsences++;
        totalLateMinutes += (record.sessionDuration || 60); 
      }
      if (studentStats[record.studentId]) {
        studentStats[record.studentId].total += 1;
        if (record.status === AttendanceStatus.ABSENT) studentStats[record.studentId].absent += 1;
      }
    });

    const attendanceRate = totalRecords > 0 ? (totalPresent / totalRecords) * 100 : 0;
    
    // Calculate Risk
    const highRiskList: Student[] = [];
    let activeStudentsCount = 0;
    
    Object.keys(studentStats).forEach(id => {
      const stats = studentStats[id];
      if (stats.total > 0) {
        activeStudentsCount++;
        const rate = stats.absent / stats.total;
        if (rate > 0.1) {
            const student = students.find(s => s.id === id);
            if(student) highRiskList.push(student);
        }
      }
    });

    const chronicAbsenteeismRate = activeStudentsCount > 0 ? (highRiskList.length / activeStudentsCount) * 100 : 0;

    return {
      history: formattedHistory,
      riskStudents: highRiskList,
      metrics: {
        totalStudents: students.length,
        dailyAttendanceRate: parseFloat(attendanceRate.toFixed(1)),
        chronicAbsenteeism: parseFloat(chronicAbsenteeismRate.toFixed(1)),
        lostInstructionalTime: totalLateMinutes
      }
    };
  }, [students, attendanceHistory]);

  const Card = ({ title, value, icon: Icon, color, subtext }: any) => (
    <div className="bg-white p-6 rounded-xl shadow border border-slate-200 flex items-center justify-between transition-all hover:shadow-lg hover:border-slate-300">
      <div>
        <p className="text-slate-600 text-sm font-bold uppercase tracking-wider">{title}</p>
        <h3 className="text-3xl font-extrabold text-slate-900 mt-2">{value}</h3>
        {subtext && <p className="text-xs text-slate-500 mt-1 font-semibold">{subtext}</p>}
      </div>
      <div className={`p-4 rounded-xl shadow-inner ${color} bg-opacity-10`}>
        <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
      </div>
    </div>
  );

  // Student Detail Modal Content
  const renderStudentDetail = () => {
    if (!selectedStudent) return null;
    
    // Get student specific history
    const studentHistory = attendanceHistory.filter(h => h.studentId === selectedStudent.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Calculate Subject Breakdown
    const subjectStats: Record<string, { totalRecords: number, absentRecords: number, lostMinutes: number }> = {};
    
    studentHistory.forEach(rec => {
        const subj = rec.subject || 'General';
        if (!subjectStats[subj]) subjectStats[subj] = { totalRecords: 0, absentRecords: 0, lostMinutes: 0 };
        
        subjectStats[subj].totalRecords += 1;
        
        if (rec.status === AttendanceStatus.ABSENT) {
            subjectStats[subj].absentRecords += 1;
            subjectStats[subj].lostMinutes += (rec.sessionDuration || 60);
        } else if (rec.status === AttendanceStatus.LATE) {
            subjectStats[subj].lostMinutes += (rec.minutesLate || 0);
        }
    });

    // Construct the automated message
    const currentDate = new Date().toLocaleDateString(lang === Language.AR ? 'ar-MA' : 'en-GB');
    const schoolName = appSettings?.schoolName || (lang === Language.AR ? "المؤسسة" : "School");
    const studentName = `${selectedStudent.firstName} ${selectedStudent.lastName}`;
    
    let messageText = '';
    if (lang === Language.AR) {
        messageText = `السلام عليكم، نحيطكم علماً بتغيب التلميذ: ${studentName}، بتاريخ: ${currentDate}، المرجو التواصل مع الإدارة. المؤسسة: ${schoolName}`;
    } else if (lang === Language.FR) {
            messageText = `Bonjour, nous vous informons que l'élève ${studentName} est marqué absent le ${currentDate}. Veuillez contacter l'administration. École : ${schoolName}`;
    } else {
            messageText = `Hello, we wish to inform you that student ${studentName} was marked absent on ${currentDate}. Please contact the administration. School: ${schoolName}`;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]" dir={dir}>
                <div className="bg-primary p-6 text-white flex justify-between items-start shadow-md shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold">{selectedStudent.firstName} {selectedStudent.lastName}</h2>
                        <p className="opacity-90 font-mono mt-1 font-medium">{selectedStudent.studentCode}</p>
                    </div>
                    <button onClick={() => setSelectedStudent(null)} className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors text-white">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* Contact & Status Card */}
                        <div className="space-y-4">
                            <h4 className="font-bold text-slate-900 border-b border-slate-200 pb-2 text-lg">Contact Info</h4>
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-3 text-slate-700 font-medium">
                                    <Phone size={18} className="text-slate-400" />
                                    <span className="font-bold text-lg">{selectedStudent.parentPhone || "No phone registered"}</span>
                                </div>
                                {selectedStudent.parentPhone && (
                                    <div className="grid grid-cols-3 gap-2 mt-2">
                                        <a href={`tel:${selectedStudent.parentPhone}`} className="flex flex-col items-center justify-center gap-1 p-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors font-bold text-xs border border-green-200 text-center">
                                            <Phone size={18} /> Call
                                        </a>
                                        <a href={`sms:${selectedStudent.parentPhone}?body=${encodeURIComponent(messageText)}`} className="flex flex-col items-center justify-center gap-1 p-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-bold text-xs border border-blue-200 text-center">
                                            <MessageSquare size={18} /> SMS
                                        </a>
                                        <a href={`https://wa.me/${selectedStudent.parentPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(messageText)}`} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center gap-1 p-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors font-bold text-xs border border-emerald-200 text-center">
                                            <MessageCircle size={18} /> WhatsApp
                                        </a>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-3 text-slate-700 mt-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                                <AlertTriangle size={18} className={selectedStudent.riskScore > 50 ? "text-red-600" : "text-amber-500"} />
                                <span className="font-bold">Risk Score: {selectedStudent.riskScore}%</span>
                            </div>
                        </div>

                        {/* Lost Instructional Time Table */}
                        <div>
                             <h4 className="font-bold text-slate-900 border-b border-slate-200 pb-2 mb-3 text-lg flex items-center gap-2">
                                <Clock size={18} className="text-rose-600" />
                                {lang === Language.AR ? 'فقدان الزمن المدرسي (حسب المادة)' : 'Lost Instructional Time'}
                             </h4>
                             <div className="overflow-x-auto rounded-lg border border-slate-200">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-xs">
                                        <tr>
                                            <th className="p-2 border-b">{lang === Language.AR ? 'المادة' : 'Subject'}</th>
                                            <th className="p-2 border-b text-center">{lang === Language.AR ? 'الغلاف الزمني' : 'Total Hrs'}</th>
                                            <th className="p-2 border-b text-center">{lang === Language.AR ? 'فقد' : 'Lost'}</th>
                                            <th className="p-2 border-b text-center">%</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {Object.entries(subjectStats).length > 0 ? Object.entries(subjectStats).map(([sub, stats]) => {
                                            const totalExpectedHours = appSettings?.subjectConfigs?.[sub] || 0;
                                            const lostHours = (stats.lostMinutes / 60).toFixed(1);
                                            // Calculate % based on Syllabus Total if available, else standard rate relative to 100% attendance (not ideal, better to show N/A if no total)
                                            let percentage = 0;
                                            let percentageDisplay = '-';
                                            
                                            if (totalExpectedHours > 0) {
                                                percentage = (stats.lostMinutes / (totalExpectedHours * 60)) * 100;
                                                percentageDisplay = `${percentage.toFixed(1)}%`;
                                            }

                                            return (
                                                <tr key={sub} className="bg-white">
                                                    <td className="p-2 font-bold text-slate-800 border-r">{sub}</td>
                                                    <td className="p-2 text-center text-slate-500">{totalExpectedHours > 0 ? totalExpectedHours : '-'}</td>
                                                    <td className="p-2 text-center font-mono text-rose-600 font-bold">{lostHours}h</td>
                                                    <td className={`p-2 text-center font-bold ${percentage > 10 ? 'text-red-600 bg-red-50' : 'text-slate-600'}`}>
                                                        {percentageDisplay}
                                                    </td>
                                                </tr>
                                            );
                                        }) : (
                                            <tr><td colSpan={4} className="p-3 text-center text-slate-500 italic">No attendance data yet.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                             </div>
                             <p className="text-[10px] text-slate-400 mt-2 italic">
                                * % is calculated based on Total Expected Hours set in Settings.
                             </p>
                        </div>
                    </div>
                    
                    {/* Recent History */}
                    <div>
                        <h4 className="font-bold text-slate-900 border-b border-slate-200 pb-2 mb-3 text-lg">Recent Activity</h4>
                        <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                            {studentHistory.length > 0 ? studentHistory.map(rec => (
                                <div key={rec.id} className="flex justify-between items-center text-sm p-3 bg-slate-50 rounded-lg border border-slate-200">
                                    <div className="flex gap-2">
                                        <span className="text-slate-700 font-mono font-bold">{rec.date}</span>
                                        <span className="text-slate-500 font-bold">| {rec.subject || 'General'}</span>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold border ${
                                        rec.status === AttendanceStatus.PRESENT ? 'bg-green-50 text-green-700 border-green-200' :
                                        rec.status === AttendanceStatus.ABSENT ? 'bg-red-50 text-red-700 border-red-200' :
                                        'bg-yellow-50 text-yellow-700 border-yellow-200'
                                    }`}>{rec.status}</span>
                                </div>
                            )) : (
                                <p className="text-slate-500 text-sm italic font-medium">No records found.</p>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
                    <button onClick={() => setSelectedStudent(null)} className="px-5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-700 font-bold hover:bg-slate-100 hover:text-slate-900 shadow-sm transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10" dir={dir}>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card 
          title={t('totalStudents')} 
          value={metrics.totalStudents} 
          icon={Users} 
          color="text-teal-700 bg-teal-100" 
        />
        <Card 
          title={t('attendanceRate')} 
          value={`${metrics.dailyAttendanceRate}%`} 
          subtext={lang === Language.AR ? 'المعدل العام' : 'Overall Rate'}
          icon={TrendingUp} 
          color="text-emerald-700 bg-emerald-100" 
        />
        <Card 
          title={t('lostTime')} 
          value={metrics.lostInstructionalTime.toLocaleString()} 
          subtext={lang === Language.AR ? 'دقائق (تقديري)' : 'Minutes (Est.)'}
          icon={Clock} 
          color="text-amber-700 bg-amber-100" 
        />
        <Card 
          title={t('riskAlert')} 
          value={`${metrics.chronicAbsenteeism}%`} 
          subtext="Chronic Absenteeism > 10%"
          icon={AlertTriangle} 
          color="text-rose-700 bg-rose-100" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart (Takes up 2 cols) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow border border-slate-200 h-[400px]">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
             <TrendingUp size={24} className="text-primary" />
             {lang === Language.AR ? 'تحليل البيانات' : 'Analytics & Trends'}
          </h3>
          {history.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f766e" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#0f766e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" />
                <XAxis dataKey="name" stroke="#475569" tick={{fontSize: 12, fontWeight: 600}} dy={10} />
                <YAxis stroke="#475569" tick={{fontSize: 12, fontWeight: 600}} domain={[0, 'auto']} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="present" stroke="#0f766e" strokeWidth={3} fillOpacity={1} fill="url(#colorPresent)" name={lang === Language.AR ? 'حضور' : 'Present'} />
                <Area type="monotone" dataKey="absent" stroke="#be123c" strokeWidth={2} fillOpacity={0.1} strokeDasharray="5 5" name={lang === Language.AR ? 'غياب' : 'Absent'} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
             <div className="h-full flex flex-col items-center justify-center text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                <Calendar size={48} className="mb-3 text-slate-300" />
                <p className="font-semibold">{lang === Language.AR ? 'لا توجد بيانات كافية للتحليل' : 'No sufficient data for analysis'}</p>
             </div>
          )}
        </div>

        {/* Risk List (Takes up 1 col) - Pedagogical Feature */}
        <div className="bg-white p-6 rounded-xl shadow border border-slate-200 h-[400px] flex flex-col">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
             <AlertTriangle size={24} className="text-rose-600" />
             {lang === Language.AR ? 'الطلاب الأكثر عرضة للخطر' : 'At-Risk Students'}
          </h3>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
             {riskStudents.length > 0 ? riskStudents.map(student => (
                 <div 
                   key={student.id} 
                   onClick={() => setSelectedStudent(student)}
                   className="flex items-center justify-between p-4 bg-rose-50 rounded-lg border border-rose-100 cursor-pointer hover:bg-rose-100 hover:border-rose-200 transition-all shadow-sm group"
                 >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white text-rose-700 font-bold flex items-center justify-center text-sm shadow-sm border border-rose-100">
                            {student.firstName[0]}
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-900">{student.firstName} {student.lastName}</p>
                            <p className="text-xs text-rose-700 font-bold flex items-center gap-1">
                                {student.absenceCount} Absences
                                {student.parentPhone && <Phone size={10} className="ml-1" />}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-xs font-extrabold text-rose-800 bg-white px-2 py-1 rounded-full shadow-sm border border-rose-100 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                            {student.riskScore}%
                        </span>
                    </div>
                 </div>
             )) : (
                 <div className="h-full flex items-center justify-center text-slate-500 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    <p className="text-sm font-semibold p-4">Great job! No students are currently flagged as high risk.</p>
                 </div>
             )}
          </div>
        </div>
      </div>
      
      {/* Student Detail Modal */}
      {selectedStudent && renderStudentDetail()}
    </div>
  );
};

export default Dashboard;
