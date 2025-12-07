
import React, { useState, useRef } from 'react';
import { UploadCloud, FileImage, Check, AlertTriangle, Loader2, ArrowRight, Save, XCircle, BookOpen, Clock, PlusCircle } from 'lucide-react';
import { Language, Student, ClassGroup, AttendanceRecord, AttendanceStatus, AppSettings } from '../types';
import { TRANSLATIONS } from '../constants';
import { analyzeAttendanceImage, ParsedAttendanceItem } from '../services/geminiService';

interface OCRUploadProps {
  lang: Language;
  students: Student[];
  classes: ClassGroup[];
  subjects?: string[]; 
  apiKey?: string; // Add API Key
  onSaveToSystem: (records: AttendanceRecord[]) => void;
}

// Utility to resize image to avoid 500 errors from large payloads
const resizeImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_SIZE = 1024;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        // Compress to JPEG 85%
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const OCRUpload: React.FC<OCRUploadProps> = ({ lang, students, classes, subjects = [], apiKey, onSaveToSystem }) => {
  const t = (key: string) => TRANSLATIONS[key][lang];
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<ParsedAttendanceItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Matching State
  const [matchedRecords, setMatchedRecords] = useState<{parsed: ParsedAttendanceItem, studentId: string | null}[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // New States for Subject and Duration
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [sessionDuration, setSessionDuration] = useState<number>(60);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setResults([]);
      setMatchedRecords([]);
      setError(null);
      setPreview(null);

      try {
        if (selectedFile.type.startsWith('image/')) {
            const resizedDataUrl = await resizeImage(selectedFile);
            setPreview(resizedDataUrl);
        } else {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(selectedFile);
        }
      } catch (err) {
        console.error("Error processing image preview", err);
        setError("Could not process image file.");
      }
    }
  };

  const handleAnalyze = async () => {
    if (!preview) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      // Extract mime type and base64 data from Data URL
      // Format: data:image/jpeg;base64,.....
      const matches = preview.match(/^data:(.+);base64,(.+)$/);
      if (!matches) throw new Error("Invalid image data");

      const mimeType = matches[1];
      const base64Data = matches[2];

      const data = await analyzeAttendanceImage(base64Data, mimeType, apiKey);
      setResults(data);
      
      // Attempt Smart Matching
      const matched = data.map(item => {
        // Simple fuzzy match: check if first name and last name are included
        const nameParts = item.studentName.toLowerCase().split(' ');
        const found = students.find(s => {
           const fullName = (s.firstName + ' ' + s.lastName).toLowerCase();
           return nameParts.every(part => fullName.includes(part));
        });
        return { parsed: item, studentId: found ? found.id : null };
      });
      setMatchedRecords(matched);

    } catch (err) {
      console.error(err);
      setError("Failed to analyze image. Please ensure the image is clear and check your API Key in Settings.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleManualMatch = (index: number, studentId: string) => {
    const newMatches = [...matchedRecords];
    newMatches[index].studentId = studentId;
    setMatchedRecords(newMatches);
  };
  
  // New function to add a row manually
  const handleAddManualRow = () => {
      setMatchedRecords([
          { 
              parsed: { studentName: "Manual Entry", status: "present" }, 
              studentId: null 
          },
          ...matchedRecords
      ]);
  };
  
  // New function to remove a row
  const handleRemoveRow = (index: number) => {
      const newMatches = matchedRecords.filter((_, i) => i !== index);
      setMatchedRecords(newMatches);
  };

  const handleConfirmSave = () => {
    const validRecords: AttendanceRecord[] = matchedRecords
      .filter(m => m.studentId !== null)
      .map(m => ({
        id: Math.random().toString(36),
        studentId: m.studentId!,
        date: selectedDate,
        status: m.parsed.status as AttendanceStatus,
        minutesLate: m.parsed.minutesLate || 0,
        notes: m.parsed.notes,
        source: 'ocr',
        subject: selectedSubject || undefined,
        sessionDuration: sessionDuration
      }));

    if (validRecords.length === 0) {
      alert("No students matched. Please select students manually.");
      return;
    }

    onSaveToSystem(validRecords);
    alert(`${validRecords.length} records saved successfully!`);
    setResults([]);
    setMatchedRecords([]);
    setFile(null);
    setPreview(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
      {/* Upload Column */}
      <div className="flex flex-col gap-6">
         <div className="bg-white p-6 rounded-xl shadow border border-slate-200">
            <h3 className="font-bold text-lg text-slate-900 mb-4">{t('uploadImage')}</h3>
            <div 
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all h-64 ${file ? 'border-primary bg-teal-50/20' : 'border-slate-300 hover:border-primary hover:bg-slate-50'}`}
            >
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange} 
            />
            {preview ? (
                <div className="relative w-full h-full">
                    <img src={preview} alt="Preview" className="w-full h-full object-contain rounded-lg shadow-sm" />
                    <button onClick={(e) => {e.stopPropagation(); setFile(null); setPreview(null);}} className="absolute top-0 right-0 bg-red-600 text-white rounded-full p-1 m-2 shadow-md hover:bg-red-700">
                        <XCircle size={20} />
                    </button>
                </div>
            ) : (
                <>
                <div className="bg-blue-100 p-4 rounded-full mb-3">
                    <UploadCloud className="w-8 h-8 text-blue-700" />
                </div>
                <p className="text-slate-700 font-bold text-lg">Click to upload photo</p>
                <p className="text-slate-500 text-sm mt-1 font-medium">Attendance sheets, handwritten lists</p>
                </>
            )}
            </div>

            <button
            onClick={handleAnalyze}
            disabled={!file || !preview || isAnalyzing}
            className="w-full mt-4 bg-primary disabled:bg-slate-300 disabled:text-slate-500 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-teal-800 transition-all shadow-lg shadow-teal-900/10 active:scale-95"
            >
            {isAnalyzing ? <Loader2 className="animate-spin" /> : <FileImage size={20} />}
            {isAnalyzing ? t('analyzing') : 'Analyze Sheet'}
            </button>
            
            {error && (
            <div className="mt-4 bg-red-50 text-red-700 p-4 rounded-lg flex items-center gap-2 text-sm border border-red-200 font-bold">
                <AlertTriangle size={18} />
                {error}
            </div>
            )}
         </div>

         {/* Configuration for Import */}
         {matchedRecords.length > 0 && (
             <div className="bg-white p-6 rounded-xl shadow border border-slate-200 space-y-4">
                <h4 className="font-bold text-slate-900 border-b pb-2">Session Configuration</h4>
                
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">Select Date:</label>
                  <input 
                      type="date" 
                      value={selectedDate} 
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none font-bold text-slate-900" 
                  />
                </div>

                <div>
                   <label className="block text-sm font-bold text-slate-800 mb-2">Subject:</label>
                   <div className="relative">
                      <BookOpen className="absolute top-3.5 left-3 text-slate-400 w-5 h-5 rtl:left-auto rtl:right-3 pointer-events-none" />
                      <select 
                         value={selectedSubject}
                         onChange={(e) => setSelectedSubject(e.target.value)}
                         className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-slate-900 font-semibold rtl:pl-4 rtl:pr-10"
                       >
                         <option value="">-- General / No Subject --</option>
                         {subjects.map(sub => (
                           <option key={sub} value={sub}>{sub}</option>
                         ))}
                       </select>
                   </div>
                </div>

                <div>
                   <label className="block text-sm font-bold text-slate-800 mb-2">Duration (minutes):</label>
                   <div className="relative">
                      <Clock className="absolute top-3.5 left-3 text-slate-400 w-5 h-5 rtl:left-auto rtl:right-3 pointer-events-none" />
                      <input 
                        type="number" 
                        value={sessionDuration}
                        onChange={(e) => setSessionDuration(parseInt(e.target.value) || 60)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-slate-900 font-semibold rtl:pl-4 rtl:pr-10"
                      />
                   </div>
                </div>
             </div>
         )}
      </div>

      {/* Results Column */}
      <div className="bg-white rounded-xl shadow border border-slate-200 flex flex-col h-full min-h-[500px] overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-900 text-lg">Review & Match</h3>
            <div className="flex items-center gap-2">
                <button onClick={handleAddManualRow} className="text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-full shadow-sm hover:bg-indigo-100 flex items-center gap-1 transition-colors">
                    <PlusCircle size={14} />
                    {t('addManualRecord')}
                </button>
                <span className="text-xs font-bold bg-white border border-slate-300 px-3 py-1.5 rounded-full text-slate-700 shadow-sm">
                    {matchedRecords.length}
                </span>
            </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {matchedRecords.length === 0 && !isAnalyzing ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-slate-50/50">
              <div className="bg-slate-100 p-5 rounded-full mb-4">
                  <ArrowRight size={32} className="text-slate-300" />
              </div>
              <p className="font-bold text-slate-700 text-lg">No data yet</p>
              <p className="text-sm font-medium text-slate-500">Upload an image and analyze to match students automatically.</p>
              <button onClick={handleAddManualRow} className="mt-4 text-sm font-bold text-indigo-600 hover:text-indigo-800 underline">
                Or add entries manually here
              </button>
            </div>
          ) : (
            matchedRecords.map((item, idx) => (
              <div key={idx} className={`flex flex-col gap-3 p-4 rounded-lg border-2 transition-all relative ${item.studentId ? 'bg-white border-slate-200' : 'bg-red-50 border-red-200 shadow-sm'}`}>
                <button onClick={() => handleRemoveRow(idx)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500">
                    <XCircle size={16} />
                </button>
                
                {/* OCR Result */}
                <div className="flex items-center justify-between pr-6">
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider bg-slate-100 px-1.5 py-0.5 rounded">OCR</span>
                        <input 
                            type="text" 
                            value={item.parsed.studentName} 
                            onChange={(e) => {
                                const newM = [...matchedRecords];
                                newM[idx].parsed.studentName = e.target.value;
                                setMatchedRecords(newM);
                            }}
                            className="font-extrabold text-slate-900 text-base bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none"
                        />
                    </div>
                    <select 
                        value={item.parsed.status}
                        onChange={(e) => {
                            const newM = [...matchedRecords];
                            newM[idx].parsed.status = e.target.value as AttendanceStatus;
                            setMatchedRecords(newM);
                        }}
                        className={`text-xs font-extrabold uppercase tracking-wide border rounded px-1 py-0.5 cursor-pointer outline-none ${
                        item.parsed.status === 'present' ? 'bg-green-100 text-green-800 border-green-200' :
                        item.parsed.status === 'absent' ? 'bg-red-100 text-red-800 border-red-200' :
                        'bg-yellow-100 text-yellow-800 border-yellow-200'
                    }`}>
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                        <option value="late">Late</option>
                        <option value="excused">Excused</option>
                    </select>
                </div>

                {/* Match Selector */}
                <div className="flex items-center gap-3">
                    <ArrowRight size={16} className="text-slate-400 transform rotate-90 md:rotate-0" />
                    <select 
                        value={item.studentId || ''} 
                        onChange={(e) => handleManualMatch(idx, e.target.value)}
                        className={`flex-1 text-sm py-2 px-3 rounded-lg border-2 focus:outline-none focus:ring-2 font-semibold ${item.studentId ? 'border-slate-300 bg-slate-50 text-slate-800' : 'border-red-300 bg-white ring-2 ring-red-100 text-red-700'}`}
                    >
                        <option value="">-- Manual Match Required --</option>
                        {students.map(s => (
                            <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.studentCode})</option>
                        ))}
                    </select>
                </div>
              </div>
            ))
          )}
          {isAnalyzing && (
            <div className="space-y-4 p-4">
               {[1,2,3].map(i => (
                 <div key={i} className="flex gap-4">
                     <div className="h-12 w-12 bg-slate-100 rounded-lg animate-pulse"></div>
                     <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-100 rounded animate-pulse w-3/4"></div>
                        <div className="h-4 bg-slate-100 rounded animate-pulse w-1/2"></div>
                     </div>
                 </div>
               ))}
            </div>
          )}
        </div>
        
        {matchedRecords.length > 0 && (
          <div className="p-4 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
             <button 
                onClick={handleConfirmSave}
                className="w-full bg-slate-900 text-white py-3.5 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors shadow-lg"
             >
               <Save size={20} />
               Merge into Attendance Log
             </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OCRUpload;