
import React, { useState, useMemo, useEffect } from 'react';
import { Save, User, Bell, School, FileSpreadsheet, Upload, Download, Loader2, AlertCircle, Edit2, Trash2, Check, X, Search, BookOpen, Plus, List, AlertTriangle, Phone, MessageSquare, MessageCircle, Clock, Key, Eye, EyeOff, Users, Shield, Lock } from 'lucide-react';
import { Language, Student, ClassGroup, AppSettings, User as AppUser, UserRole } from '../types';
import { TRANSLATIONS } from '../constants';
import { parseStudentList } from '../services/geminiService';
import { authService } from '../services/authService';
import { dataService } from '../services/dataService';

interface SettingsProps {
  lang: Language;
  students: Student[];
  classes: ClassGroup[];
  subjects: string[];
  appSettings: AppSettings;
  users?: AppUser[];
  currentUser?: AppUser | null;
  onUpdateStudents: (students: Student[]) => void;
  onUpdateClasses: (classes: ClassGroup[]) => void;
  onUpdateSubjects: (subjects: string[]) => void;
  onUpdateAppSettings: (settings: AppSettings) => void;
  onUpdateUsers?: (users: AppUser[]) => void;
}

// Utility to resize image
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

const Settings: React.FC<SettingsProps> = ({
  lang, students, classes, subjects, appSettings, users = [], currentUser,
  onUpdateStudents, onUpdateClasses, onUpdateSubjects, onUpdateAppSettings, onUpdateUsers
}) => {
  const t = (key: string) => TRANSLATIONS[key][lang] || key;
  const dir = lang === Language.AR ? 'rtl' : 'ltr';

  // General Settings State
  const [localSettings, setLocalSettings] = useState<AppSettings>(appSettings);
  const [saved, setSaved] = useState(false);

  // API Key State
  const [apiKeyInput, setApiKeyInput] = useState(appSettings.apiKey || '');
  const [showApiKey, setShowApiKey] = useState(false);

  // Profile Settings State
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileConfirm, setProfileConfirm] = useState('');
  const [showProfilePassword, setShowProfilePassword] = useState(false);

  // Initialize profile form with current user data
  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.name);
      setProfileEmail(currentUser.email);
      setProfilePassword(currentUser.password);
      setProfileConfirm(currentUser.password);
    }
  }, [currentUser]);

  // Data Management State
  const [isImporting, setIsImporting] = useState(false);
  const [manageMode, setManageMode] = useState<'import' | 'registry' | 'users'>('registry');

  // User Management State
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUser, setNewUser] = useState<Partial<AppUser>>({
    name: '', email: '', password: '', role: 'teacher', assignedClassIds: [], assignedSubjects: []
  });

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });

  // Review Import State
  const [reviewMode, setReviewMode] = useState(false);
  const [importedStudents, setImportedStudents] = useState<Student[]>([]);
  const [importedClasses, setImportedClasses] = useState<ClassGroup[]>([]);
  const [isConfirmingImport, setIsConfirmingImport] = useState(false);
  const [filterText, setFilterText] = useState('');

  // Registry Management State
  const [registrySearch, setRegistrySearch] = useState('');
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [tempStudentData, setTempStudentData] = useState<Student | null>(null);

  // Add Student Manually State
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [newStudent, setNewStudent] = useState<Partial<Student>>({
    firstName: '', lastName: '', studentCode: '', classId: '', parentPhone: ''
  });

  // Academic Config State
  const [newClassName, setNewClassName] = useState('');
  const [newClassGrade, setNewClassGrade] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newSubjectHours, setNewSubjectHours] = useState<string>('30');

  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [tempClassData, setTempClassData] = useState<ClassGroup | null>(null);

  const [editingSubjectOriginal, setEditingSubjectOriginal] = useState<string | null>(null);
  const [tempSubjectName, setTempSubjectName] = useState<string>('');
  const [tempSubjectHours, setTempSubjectHours] = useState<number>(30);


  // --- Helper: Open Confirm Modal ---
  const openConfirm = (title: string, message: string, action: () => void) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        action();
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // --- Handlers ---

  const handleSaveGeneralSettings = () => {
    onUpdateAppSettings(localSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleSaveApiKey = () => {
    const updated = { ...localSettings, apiKey: apiKeyInput };
    setLocalSettings(updated);
    onUpdateAppSettings(updated);
    alert(t('keySaved'));
  };

  const handleRemoveApiKey = () => {
    setApiKeyInput('');
    const updated = { ...localSettings, apiKey: '' };
    setLocalSettings(updated);
    onUpdateAppSettings(updated);
  };

  // --- Profile Handler ---
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const handleSaveProfile = async () => {
    if (!currentUser) return;

    if (profilePassword !== profileConfirm) {
      alert(t('passwordMismatch'));
      return;
    }

    if (!profileName.trim() || !profileEmail.trim()) {
      alert('All fields are required');
      return;
    }

    setIsSavingProfile(true);
    try {
      // Update password in Supabase Auth if changed
      if (profilePassword && profilePassword.length >= 6) {
        await authService.updatePassword(profilePassword);
      }

      // Update profile (name and email)
      await authService.updateProfile(currentUser.id, {
        name: profileName !== currentUser.name ? profileName : undefined,
        email: profileEmail !== currentUser.email ? profileEmail : undefined
      });

      // Update local users list if callback exists
      if (onUpdateUsers) {
        const updatedUsers = users.map(u => {
          if (u.id === currentUser.id) {
            return { ...u, name: profileName, email: profileEmail };
          }
          return u;
        });
        onUpdateUsers(updatedUsers);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      alert(lang === Language.AR ? 'تم حفظ التغييرات بنجاح!' : 'Changes saved successfully!');
    } catch (error: any) {
      console.error('Profile save error:', error);
      alert(lang === Language.AR ? `خطأ في الحفظ: ${error.message}` : `Save error: ${error.message}`);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // --- User Management Handlers ---
  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      alert('Name, Email and Password are required');
      return;
    }

    try {
      if (lang === Language.AR) {
        alert("جاري إنشاء المستخدم... قد يستغرق هذا بضع ثوانٍ.");
      } else {
        alert("Creating user... This may take a few seconds.");
      }

      const createdUser = await authService.createUser({
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role as UserRole || 'teacher',
        assignedClassIds: newUser.assignedClassIds || [],
        assignedSubjects: newUser.assignedSubjects || []
      });

      if (createdUser && onUpdateUsers) {
        // Refresh the user list
        const allUsers = await authService.getAllUsers();
        onUpdateUsers(allUsers);
        alert(lang === Language.AR ? 'تم إضافة المستخدم بنجاح' : 'User added successfully');
      }

      setIsAddingUser(false);
      setNewUser({ name: '', email: '', password: '', role: 'teacher', assignedClassIds: [], assignedSubjects: [] });
    } catch (error: any) {
      console.error("Error creating user:", error);
      alert(lang === Language.AR ? `فشل إنشاء المستخدم: ${error.message}` : `Failed to create user: ${error.message}`);
    }
  };

  const handleDeleteUser = (id: string) => {
    if (!onUpdateUsers) return;
    if (currentUser?.id === id) {
      alert("You cannot delete your own account.");
      return;
    }
    openConfirm(
      "Delete User",
      "Are you sure you want to delete this user?",
      async () => {
        try {
          await authService.deleteUser(id);
          if (onUpdateUsers) {
            onUpdateUsers(users.filter(u => u.id !== id));
          }
          alert(lang === Language.AR ? 'تم حذف المستخدم' : 'User deleted');
        } catch (error) {
          console.error("Error deleting user:", error);
          alert(lang === Language.AR ? 'خطأ في حذف المستخدم' : 'Error deleting user');
        }
      }
    );
  };

  const toggleClassAssignment = (classId: string) => {
    setNewUser(prev => {
      const current = prev.assignedClassIds || [];
      if (current.includes(classId)) {
        return { ...prev, assignedClassIds: current.filter(id => id !== classId) };
      } else {
        return { ...prev, assignedClassIds: [...current, classId] };
      }
    });
  };

  const toggleSubjectAssignment = (subject: string) => {
    setNewUser(prev => {
      const current = prev.assignedSubjects || [];
      if (current.includes(subject)) {
        return { ...prev, assignedSubjects: current.filter(s => s !== subject) };
      } else {
        return { ...prev, assignedSubjects: [...current, subject] };
      }
    });
  };

  // --- Academic Handlers (Classes) ---

  const handleAddClass = async () => {
    if (!newClassName.trim()) return;
    try {
      const addedClass = await dataService.addClass({
        name: newClassName.trim(),
        grade: newClassGrade.trim() || 'General'
      });
      onUpdateClasses([...classes, addedClass]);
      setNewClassName('');
      setNewClassGrade('');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error adding class:", error);
      alert(lang === Language.AR ? 'خطأ في إضافة القسم' : 'Error adding class');
    }
  };

  const handleEditClass = (cls: ClassGroup) => {
    setEditingClassId(cls.id);
    setTempClassData({ ...cls });
  };

  const handleCancelClassEdit = () => {
    setEditingClassId(null);
    setTempClassData(null);
  };

  const handleSaveClassEdit = async () => {
    if (!tempClassData) return;
    try {
      await dataService.updateClass(tempClassData.id, {
        name: tempClassData.name,
        grade: tempClassData.grade
      });
      const updatedClasses = classes.map(c => c.id === tempClassData.id ? tempClassData : c);
      onUpdateClasses(updatedClasses);
      setEditingClassId(null);
      setTempClassData(null);
    } catch (error) {
      console.error("Error updating class:", error);
      alert(lang === Language.AR ? 'خطأ في تحديث القسم' : 'Error updating class');
    }
  };

  const handleDeleteClass = (id: string) => {
    const assignedStudentsCount = students.filter(s => s.classId === id).length;
    let message = lang === Language.AR
      ? 'هل أنت متأكد من حذف هذا القسم؟'
      : 'Are you sure you want to delete this class?';

    if (assignedStudentsCount > 0) {
      message += lang === Language.AR
        ? ` يوجد ${assignedStudentsCount} تلميذ مسجل في هذا القسم.`
        : ` There are ${assignedStudentsCount} students assigned to this class.`;
    }

    openConfirm(
      lang === Language.AR ? 'حذف القسم' : 'Delete Class',
      message,
      () => {
        dataService.deleteClass(id)
          .then(() => onUpdateClasses(classes.filter(c => c.id !== id)))
          .catch(err => {
            console.error(err);
            alert(lang === Language.AR ? 'خطأ في حذف القسم' : 'Error deleting class');
          });
      }
    );
  };

  // --- Academic Handlers (Subjects) ---

  const handleAddSubject = async () => {
    if (!newSubject.trim()) return;
    const name = newSubject.trim();
    if (subjects.includes(name)) return;

    try {
      // Add to database
      await dataService.addSubject(name);

      // Update local state
      onUpdateSubjects([...subjects, name]);

      // Add to config (hours)
      const hours = parseInt(newSubjectHours) || 30;
      const newConfigs = { ...localSettings.subjectConfigs, [name]: hours };
      setLocalSettings(prev => ({ ...prev, subjectConfigs: newConfigs }));
      // Immediately trigger save for settings to keep subjectConfigs in sync
      onUpdateAppSettings({ ...localSettings, subjectConfigs: newConfigs });

      setNewSubject('');
      setNewSubjectHours('30');
    } catch (error) {
      console.error("Error adding subject:", error);
      alert(lang === Language.AR ? 'خطأ في إضافة المادة' : 'Error adding subject');
    }
  };

  const handleEditSubject = (subject: string) => {
    setEditingSubjectOriginal(subject);
    setTempSubjectName(subject);
    setTempSubjectHours(localSettings.subjectConfigs?.[subject] || 30);
  };

  const handleCancelSubjectEdit = () => {
    setEditingSubjectOriginal(null);
    setTempSubjectName('');
  };

  const handleSaveSubjectEdit = async () => {
    if (!editingSubjectOriginal || !tempSubjectName.trim()) return;

    const newName = tempSubjectName.trim();

    try {
      // Update in database if name changed
      if (newName !== editingSubjectOriginal) {
        await dataService.updateSubject(editingSubjectOriginal, newName);
      }

      // Update Name List
      const updatedSubjects = subjects.map(s => s === editingSubjectOriginal ? newName : s);
      onUpdateSubjects(updatedSubjects);

      // Update Hours Config (Remove old key, add new key)
      const newConfigs = { ...localSettings.subjectConfigs };
      if (newName !== editingSubjectOriginal) {
        delete newConfigs[editingSubjectOriginal];
      }
      newConfigs[newName] = tempSubjectHours;
      setLocalSettings(prev => ({ ...prev, subjectConfigs: newConfigs }));
      onUpdateAppSettings({ ...localSettings, subjectConfigs: newConfigs });

      setEditingSubjectOriginal(null);
      setTempSubjectName('');
    } catch (error) {
      console.error("Error updating subject:", error);
      alert(lang === Language.AR ? 'خطأ في تحديث المادة' : 'Error updating subject');
    }
  };

  const handleDeleteSubject = (subject: string) => {
    openConfirm(
      lang === Language.AR ? 'حذف المادة' : 'Delete Subject',
      lang === Language.AR ? 'هل أنت متأكد من حذف هذه المادة؟' : 'Are you sure you want to delete this subject?',
      async () => {
        try {
          // Delete from database
          await dataService.deleteSubject(subject);

          // Update local state
          onUpdateSubjects(subjects.filter(s => s !== subject));
          const newConfigs = { ...localSettings.subjectConfigs };
          delete newConfigs[subject];
          setLocalSettings(prev => ({ ...prev, subjectConfigs: newConfigs }));
          onUpdateAppSettings({ ...localSettings, subjectConfigs: newConfigs });
        } catch (error) {
          console.error("Error deleting subject:", error);
          alert(lang === Language.AR ? 'خطأ في حذف المادة' : 'Error deleting subject');
        }
      }
    );
  };

  // --- Registry (Existing Students) Handlers ---

  const handleEditStudent = (student: Student) => {
    setEditingStudentId(student.id);
    setTempStudentData({ ...student });
  };

  const handleCancelEdit = () => {
    setEditingStudentId(null);
    setTempStudentData(null);
  };

  const handleSaveStudentEdit = async () => {
    if (!tempStudentData) return;
    try {
      await dataService.updateStudent(tempStudentData.id, tempStudentData);
      const updatedStudents = students.map(s => s.id === tempStudentData.id ? tempStudentData : s);
      onUpdateStudents(updatedStudents);
      setEditingStudentId(null);
      setTempStudentData(null);
    } catch (error) {
      console.error("Error updating student:", error);
      alert(lang === Language.AR ? 'خطأ في تحديث بيانات الطالب' : 'Error updating student');
    }
  };

  const handleDeleteStudent = (id: string) => {
    openConfirm(
      lang === Language.AR ? 'حذف طالب' : 'Delete Student',
      lang === Language.AR ? 'هل أنت متأكد من حذف هذا الطالب نهائياً من السجل؟' : 'Are you sure you want to permanently delete this student?',
      () => {
        dataService.deleteStudent(id)
          .then(() => onUpdateStudents(students.filter(s => s.id !== id)))
          .catch(err => {
            console.error(err);
            alert(lang === Language.AR ? 'خطأ في حذف الطالب' : 'Error deleting student');
          });
      }
    );
  };

  const handleAddNewStudent = async () => {
    if (!newStudent.firstName?.trim() || !newStudent.lastName?.trim() || !newStudent.classId) {
      alert(lang === Language.AR ? 'يرجى ملء جميع الحقول الضرورية' : 'Please fill all required fields');
      return;
    }

    try {
      const addedStudent = await dataService.addStudent({
        firstName: newStudent.firstName!.trim(),
        lastName: newStudent.lastName!.trim(),
        studentCode: newStudent.studentCode?.trim() || `ST-${Math.floor(Math.random() * 10000)}`,
        classId: newStudent.classId!,
        parentPhone: newStudent.parentPhone?.trim(),
        riskScore: 0,
        absenceCount: 0
      });

      onUpdateStudents([...students, addedStudent]);
      setIsAddingStudent(false);
      setNewStudent({ firstName: '', lastName: '', studentCode: '', classId: '', parentPhone: '' });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Error adding student:", error);
      alert(lang === Language.AR ? 'خطأ في إضافة الطالب' : 'Error adding student');
    }
  };

  const filteredRegistryStudents = useMemo(() => {
    if (!registrySearch) return students;
    const lowerFilter = registrySearch.toLowerCase();
    return students.filter(s =>
      s.firstName.toLowerCase().includes(lowerFilter) ||
      s.lastName.toLowerCase().includes(lowerFilter) ||
      s.studentCode.toLowerCase().includes(lowerFilter)
    );
  }, [students, registrySearch]);

  // --- Import Handlers ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    try {
      if (file.name.endsWith('.csv')) await processCSV(file);
      else if (file.name.match(/\.(xlsx|xls)$/)) await processExcel(file);
      else await processMediaDocument(file);
    } catch (error) {
      console.error(error);
      alert(lang === Language.AR ? 'حدث خطأ (تحقق من مفتاح API)' : 'Error (Check API Key)');
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  const prepareReviewData = (newStudents: Student[], newClasses: ClassGroup[]) => {
    setImportedStudents(newStudents);
    setImportedClasses(newClasses);
    setReviewMode(true);
    setFilterText('');
  };

  const processExcel = async (file: File): Promise<void> => {
    let XLSX;
    try {
      const module = await import('xlsx');
      XLSX = module.default || module;
    } catch (e) {
      console.error("Failed to load xlsx module", e);
      throw new Error("Excel processor failed to load");
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(sheet);
          const parsedStudents: Student[] = [];
          const parsedClassesMap = new Map<string, ClassGroup>();
          jsonData.forEach((row: any) => {
            const firstName = row['FirstName'] || row['First Name'] || row['الاسم'] || row['Prénom'] || 'Unknown';
            const lastName = row['LastName'] || row['Last Name'] || row['النسب'] || row['Nom'] || 'Unknown';
            const code = row['Code'] || row['ID'] || row['رقم'] || '';
            const className = row['Class'] || row['Group'] || row['القسم'] || row['Classe'] || 'General';
            const phone = row['Phone'] || row['Mobile'] || row['الهاتف'] || row['Tél'] || '';

            // Link to class via a normalized temp ID
            const tempClassId = `temp-cls-${className.replace(/\s/g, '-').toLowerCase()}`;
            if (!parsedClassesMap.has(tempClassId)) {
              parsedClassesMap.set(tempClassId, { id: tempClassId, name: className, grade: 'General' });
            }

            parsedStudents.push({
              id: `temp-st-${Math.random().toString(36).substr(2, 9)}`,
              firstName, lastName, studentCode: code, classId: tempClassId, riskScore: 0, absenceCount: 0, parentPhone: phone
            });
          });
          prepareReviewData(parsedStudents, Array.from(parsedClassesMap.values()));
          resolve();
        } catch (err) { reject(err); }
      };
      reader.onerror = reject;
      reader.readAsBinaryString(file);
    });
  };

  const processCSV = (file: File): Promise<void> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const lines = text.split('\n');
        const parsedStudents: Student[] = [];
        const parsedClassesMap = new Map<string, ClassGroup>();
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          const cols = line.split(',').map(s => s.trim());
          const [firstName, lastName, studentCode, className, phone] = cols;
          if (!firstName && !lastName) continue;

          const finalClassName = className || 'General';
          const tempClassId = `temp-cls-${finalClassName.replace(/\s/g, '-').toLowerCase()}`;

          parsedStudents.push({
            id: `temp-st-${Math.random().toString(36).substr(2, 9)}`,
            firstName: firstName || 'Unknown',
            lastName: lastName || 'Unknown',
            studentCode: studentCode || '',
            classId: tempClassId,
            riskScore: 0,
            absenceCount: 0,
            parentPhone: phone || ''
          });

          if (!parsedClassesMap.has(tempClassId)) {
            parsedClassesMap.set(tempClassId, { id: tempClassId, name: finalClassName, grade: 'General' });
          }
        }
        prepareReviewData(parsedStudents, Array.from(parsedClassesMap.values()));
        resolve();
      };
      reader.readAsText(file);
    });
  };

  const processMediaDocument = async (file: File) => {
    let base64Data: string;
    let mimeType: string = file.type;

    if (file.type.startsWith('image/')) {
      try {
        const resizedDataUrl = await resizeImage(file);
        const matches = resizedDataUrl.match(/^data:(.+);base64,(.+)$/);
        if (matches) {
          mimeType = matches[1];
          base64Data = matches[2];
        } else {
          throw new Error("Failed to parse resized image");
        }
      } catch (e) {
        base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }
    } else {
      base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    const data = await parseStudentList(base64Data, mimeType, appSettings.apiKey);

    const className = data.className || 'Imported Class';
    const tempClassId = `temp-cls-${className.replace(/\s/g, '-').toLowerCase()}`;
    const newClass: ClassGroup = { id: tempClassId, name: className, grade: data.grade || 'General' };

    const newStudents: Student[] = data.students.map(s => ({
      id: `temp-st-${Math.random().toString(36).substr(2, 9)}`,
      firstName: s.firstName,
      lastName: s.lastName,
      studentCode: s.studentCode || '',
      classId: tempClassId,
      riskScore: 0,
      absenceCount: 0
    }));
    prepareReviewData(newStudents, [newClass]);
  };

  const handleConfirmImport = async () => {
    if (isConfirmingImport) return;
    setIsConfirmingImport(true);

    try {
      // 1. Get existing classes names map to avoid duplicates
      const existingClassesNames = new Map<string, string>(classes.map(c => [c.name.toLowerCase(), c.id]));

      // 2. Identify new classes to add
      const classesToAdd: Omit<ClassGroup, 'id'>[] = [];
      const classIdMap: Record<string, string> = {}; // tempId -> dbId

      importedClasses.forEach(cls => {
        const lowerName = cls.name.toLowerCase();
        if (existingClassesNames.has(lowerName)) {
          classIdMap[cls.id] = existingClassesNames.get(lowerName) as string;
        } else {
          classesToAdd.push({ name: cls.name, grade: cls.grade });
        }
      });

      // 3. Save new classes to DB
      let finalClasses = [...classes];
      if (classesToAdd.length > 0) {
        const savedClasses = await dataService.bulkAddClasses(classesToAdd);
        savedClasses.forEach(cls => {
          // Map by name since we don't have temp IDs for new ones yet (they were created in the processor)
          // Actually, let's refine this: the processor assigns temp IDs starting with 'cls-'
          const tempCls = importedClasses.find(ic => ic.name === cls.name);
          if (tempCls) classIdMap[tempCls.id] = cls.id;
        });
        finalClasses = [...classes, ...savedClasses];
        onUpdateClasses(finalClasses);
      }

      // 4. Prepare students for persistence
      const studentsToPersist: Omit<Student, 'id'>[] = importedStudents.map(s => {
        const dbClassId = classIdMap[s.classId];
        if (!dbClassId) {
          console.warn(`Class mapping failed for student ${s.firstName} ${s.lastName}. Using first available class or general.`);
        }
        return {
          firstName: s.firstName,
          lastName: s.lastName,
          studentCode: s.studentCode || `ST-${Math.floor(Math.random() * 10000)}`,
          classId: dbClassId || classes[0]?.id || '',
          parentPhone: s.parentPhone || '',
          riskScore: 0,
          absenceCount: 0
        };
      });

      // 5. Save students to DB
      const savedStudents = await dataService.bulkAddStudents(studentsToPersist);
      onUpdateStudents([...students, ...savedStudents]);

      // 6. Cleanup
      setReviewMode(false);
      setImportedStudents([]);
      setImportedClasses([]);
      setManageMode('registry');
      alert(lang === Language.AR ? `تم حفظ البيانات بنجاح: ${savedStudents.length} تلميذ` : `Data saved successfully: ${savedStudents.length} students`);
    } catch (error: any) {
      console.error("Error during import confirmation:", error);
      alert(lang === Language.AR ? `خطأ في حفظ البيانات: ${error.message}` : `Error saving data: ${error.message}`);
    } finally {
      setIsConfirmingImport(false);
    }
  };

  const filteredImportedStudents = useMemo(() => {
    if (!filterText) return importedStudents;
    const lowerFilter = filterText.toLowerCase();
    return importedStudents.filter(s =>
      s.firstName.toLowerCase().includes(lowerFilter) ||
      s.lastName.toLowerCase().includes(lowerFilter) ||
      s.studentCode.toLowerCase().includes(lowerFilter)
    );
  }, [importedStudents, filterText]);

  const handleUpdateImportedStudent = (id: string, field: keyof Student, value: string) => {
    setImportedStudents(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };
  const handleDeleteImportedStudent = (id: string) => {
    setImportedStudents(prev => prev.filter(s => s.id !== id));
  };


  return (
    <div className="space-y-6 animate-fade-in pb-24 md:pb-8" dir={dir}>

      {/* 0. API Key Configuration */}
      <div className="bg-white p-4 md:p-6 rounded-xl shadow border border-slate-200">
        <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-200">
          <div className="bg-emerald-100 p-3 rounded-full"><Key className="w-6 h-6 text-emerald-700" /></div>
          <h3 className="text-xl font-bold text-slate-900">{t('apiConfig')}</h3>
        </div>
        <div className="space-y-4">
          <label className="block text-sm font-bold text-slate-700">{t('apiKeyLabel')}</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showApiKey ? "text" : "password"}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder={t('apiKeyPlaceholder')}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 rtl:right-auto rtl:left-3"
              >
                {showApiKey ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <button onClick={handleSaveApiKey} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-bold shadow-sm transition-colors flex items-center gap-2">
              <Check size={20} />
              <span className="hidden md:inline">{t('saveKey')}</span>
            </button>
            <button onClick={handleRemoveApiKey} className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 px-4 py-3 rounded-lg font-bold shadow-sm transition-colors flex items-center gap-2">
              <Trash2 size={20} />
              <span className="hidden md:inline">{t('removeKey')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 1. Account Settings (For current user) */}
      <div className="bg-white p-4 md:p-6 rounded-xl shadow border border-slate-200">
        <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-200">
          <div className="bg-sky-100 p-3 rounded-full"><Shield className="w-6 h-6 text-sky-700" /></div>
          <h3 className="text-xl font-bold text-slate-900">{t('accountSettings')}</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">{t('fullName')}</label>
            <input
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900 outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">{t('email')}</label>
            <input
              type="email"
              value={profileEmail}
              onChange={(e) => setProfileEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900 outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">{t('newPassword')}</label>
            <div className="relative">
              <input
                type={showProfilePassword ? "text" : "password"}
                value={profilePassword}
                onChange={(e) => setProfilePassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900 outline-none focus:ring-2 focus:ring-sky-500"
              />
              <button
                onClick={() => setShowProfilePassword(!showProfilePassword)}
                className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 rtl:right-auto rtl:left-3"
              >
                {showProfilePassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">{t('confirmPassword')}</label>
            <div className="relative">
              <input
                type={showProfilePassword ? "text" : "password"}
                value={profileConfirm}
                onChange={(e) => setProfileConfirm(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900 outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end pt-6 mt-4">
          <button
            onClick={handleSaveProfile}
            disabled={isSavingProfile}
            className="w-full md:w-auto bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white px-8 py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md font-bold text-sm active:scale-95 disabled:cursor-not-allowed"
          >
            {isSavingProfile ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            <span>{isSavingProfile ? (lang === Language.AR ? 'جاري الحفظ...' : 'Saving...') : t('saveChanges')}</span>
          </button>
        </div>
      </div>

      {/* 2. Academic Configuration */}
      <div className="bg-white p-4 md:p-6 rounded-xl shadow border border-slate-200">
        <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-200">
          <div className="bg-violet-100 p-3 rounded-full"><BookOpen className="w-6 h-6 text-violet-700" /></div>
          <h3 className="text-xl font-bold text-slate-900">{t('academicConfig')}</h3>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Classes */}
          <div>
            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-lg">
              <School size={20} className="text-slate-500" />
              {t('manageClasses')}
            </h4>
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <input type="text" value={newClassName} onChange={(e) => setNewClassName(e.target.value)} placeholder={t('className')} className="flex-1 px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold outline-none focus:ring-2 focus:ring-violet-200" />
              <div className="flex gap-2">
                <input type="text" value={newClassGrade} onChange={(e) => setNewClassGrade(e.target.value)} placeholder={t('gradeLevel')} className="w-24 px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold outline-none focus:ring-2 focus:ring-violet-200" />
                <button onClick={handleAddClass} className="bg-violet-600 hover:bg-violet-700 text-white p-3 rounded-lg transition-colors shadow-sm active:scale-95 flex-shrink-0"><Plus size={20} /></button>
              </div>
            </div>
            {/* List */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {classes.map(cls => (
                <div key={cls.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  {editingClassId === cls.id ? (
                    <div className="flex-1 flex gap-2 mr-2">
                      <input type="text" value={tempClassData?.name} onChange={(e) => setTempClassData(prev => prev ? { ...prev, name: e.target.value } : null)} className="w-full p-1 border rounded text-sm" />
                      <input type="text" value={tempClassData?.grade} onChange={(e) => setTempClassData(prev => prev ? { ...prev, grade: e.target.value } : null)} className="w-20 p-1 border rounded text-sm" />
                    </div>
                  ) : (
                    <div className="flex-1 flex justify-between items-center mr-2">
                      <span className="font-bold text-slate-800">{cls.name}</span>
                      <span className="text-xs bg-slate-200 px-2 py-0.5 rounded font-mono text-slate-600">{cls.grade}</span>
                    </div>
                  )}
                  <div className="flex gap-1">
                    {editingClassId === cls.id ? (
                      <>
                        <button onClick={handleSaveClassEdit} className="p-2 bg-green-100 text-green-700 rounded-md"><Check size={16} /></button>
                        <button onClick={handleCancelClassEdit} className="p-2 bg-slate-200 text-slate-600 rounded-md"><X size={16} /></button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => handleEditClass(cls)} className="p-2 bg-violet-100 text-violet-700 rounded-md"><Edit2 size={16} /></button>
                        <button onClick={() => handleDeleteClass(cls.id)} className="p-2 bg-red-100 text-red-600 rounded-md"><Trash2 size={16} /></button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Subjects */}
          <div>
            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-lg">
              <BookOpen size={20} className="text-slate-500" />
              {t('manageSubjects')}
            </h4>
            <div className="flex gap-2 mb-4">
              <input type="text" value={newSubject} onChange={(e) => setNewSubject(e.target.value)} placeholder={t('subjectName')} className="flex-1 px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold outline-none focus:ring-2 focus:ring-violet-200" />
              <div className="flex items-center bg-slate-50 border border-slate-300 rounded-lg px-2">
                <Clock size={16} className="text-slate-400 mr-1" />
                <input type="number" value={newSubjectHours} onChange={(e) => setNewSubjectHours(e.target.value)} placeholder="Hrs" className="w-12 py-3 bg-transparent text-sm font-bold outline-none text-slate-700" />
              </div>
              <button onClick={handleAddSubject} className="bg-violet-600 hover:bg-violet-700 text-white p-3 rounded-lg transition-colors shadow-sm active:scale-95 flex-shrink-0"><Plus size={20} /></button>
            </div>
            {/* List */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {subjects.map(sub => (
                <div key={sub} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  {editingSubjectOriginal === sub ? (
                    <div className="flex-1 flex gap-2 mr-2">
                      <input type="text" value={tempSubjectName} onChange={(e) => setTempSubjectName(e.target.value)} className="w-full p-1 border rounded text-sm" />
                      <input type="number" value={tempSubjectHours} onChange={(e) => setTempSubjectHours(parseInt(e.target.value))} className="w-16 p-1 border rounded text-sm font-bold" />
                    </div>
                  ) : (
                    <div className="flex-1 flex justify-between items-center mr-2">
                      <span className="font-bold text-slate-800">{sub}</span>
                      <span className="text-xs bg-slate-200 px-2 py-0.5 rounded font-mono text-slate-600 font-bold">{localSettings.subjectConfigs?.[sub] || 30}h</span>
                    </div>
                  )}
                  <div className="flex gap-1">
                    {editingSubjectOriginal === sub ? (
                      <>
                        <button onClick={handleSaveSubjectEdit} className="p-2 bg-green-100 text-green-700 rounded-md"><Check size={16} /></button>
                        <button onClick={handleCancelSubjectEdit} className="p-2 bg-slate-200 text-slate-600 rounded-md"><X size={16} /></button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => handleEditSubject(sub)} className="p-2 bg-violet-100 text-violet-700 rounded-md"><Edit2 size={16} /></button>
                        <button onClick={() => handleDeleteSubject(sub)} className="p-2 bg-red-100 text-red-600 rounded-md"><Trash2 size={16} /></button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Data Management (Import & Registry & Users) */}
      <div className="bg-white p-4 md:p-6 rounded-xl shadow border border-slate-200">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-100 p-3 rounded-full"><FileSpreadsheet className="w-6 h-6 text-indigo-700" /></div>
            <h3 className="text-xl font-bold text-slate-900">{t('dataManagement')}</h3>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-lg w-full md:w-auto overflow-x-auto">
            <button onClick={() => { setManageMode('registry'); setReviewMode(false); }} className={`flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-bold whitespace-nowrap transition-all ${manageMode === 'registry' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><List size={16} className="inline mr-2" /> Registry</button>
            <button onClick={() => setManageMode('import')} className={`flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-bold whitespace-nowrap transition-all ${manageMode === 'import' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Upload size={16} className="inline mr-2" /> Import</button>
            <button onClick={() => setManageMode('users')} className={`flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-bold whitespace-nowrap transition-all ${manageMode === 'users' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Users size={16} className="inline mr-2" /> Users</button>
          </div>
        </div>

        {/* User Management Mode */}
        {manageMode === 'users' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-slate-800">{t('userManagement')}</h4>
              <button onClick={() => setIsAddingUser(!isAddingUser)} className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                <Plus size={16} /> {t('addUser')}
              </button>
            </div>

            {isAddingUser && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 animate-in fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">{t('fullName')}</label>
                    <input type="text" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} className="w-full p-2 border rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">{t('email')}</label>
                    <input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} className="w-full p-2 border rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">{t('password')}</label>
                    <input type="text" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} className="w-full p-2 border rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">{t('role')}</label>
                    <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })} className="w-full p-2 border rounded-lg text-sm">
                      <option value="teacher">{t('teacher')}</option>
                      <option value="admin">{t('admin')}</option>
                    </select>
                  </div>
                </div>

                {newUser.role === 'teacher' && (
                  <div className="mb-4 bg-white p-3 rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-500 mb-2">{t('permissionsInfo')}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="font-bold text-xs mb-1">{t('assignedClasses')}</p>
                        <div className="max-h-32 overflow-y-auto border rounded p-2 bg-slate-50">
                          {classes.map(c => (
                            <label key={c.id} className="flex items-center gap-2 text-sm mb-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={newUser.assignedClassIds?.includes(c.id)}
                                onChange={() => toggleClassAssignment(c.id)}
                              />
                              {c.name}
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="font-bold text-xs mb-1">{t('assignedSubjects')}</p>
                        <div className="max-h-32 overflow-y-auto border rounded p-2 bg-slate-50">
                          {subjects.map(s => (
                            <label key={s} className="flex items-center gap-2 text-sm mb-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={newUser.assignedSubjects?.includes(s)}
                                onChange={() => toggleSubjectAssignment(s)}
                              />
                              {s}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <button onClick={() => setIsAddingUser(false)} className="px-3 py-2 text-slate-600 text-sm font-bold">{t('cancelImport')}</button>
                  <button onClick={handleAddUser} className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold">{t('saveChanges')}</button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {users.map(user => (
                <div key={user.id} className="border border-slate-200 rounded-lg p-3 flex justify-between items-start bg-slate-50">
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="font-bold text-slate-900">{user.name}</h5>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {user.role}
                      </span>
                      {currentUser?.id === user.id && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-green-100 text-green-700">You</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mb-1">{user.email}</p>
                    {user.role === 'teacher' && (
                      <div className="text-[10px] text-slate-500 mt-2">
                        <p>Classes: {user.assignedClassIds.length > 0 ? user.assignedClassIds.map(id => classes.find(c => c.id === id)?.name).join(', ') : 'None'}</p>
                        <p>Subjects: {user.assignedSubjects.length > 0 ? user.assignedSubjects.join(', ') : 'None'}</p>
                      </div>
                    )}
                  </div>
                  <button onClick={() => handleDeleteUser(user.id)} className={`p-1 ${currentUser?.id === user.id ? 'text-slate-300 cursor-not-allowed' : 'text-red-400 hover:text-red-600'}`} disabled={currentUser?.id === user.id}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Import Mode */}
        {manageMode === 'import' && (
          <>
            {reviewMode ? (
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                  <input type="text" value={filterText} onChange={(e) => setFilterText(e.target.value)} placeholder={t('filterStudents')} className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold outline-none" />
                  <div className="flex gap-2 w-full md:w-auto">
                    <button onClick={() => setReviewMode(false)} className="px-5 py-3 text-slate-700 bg-white border border-slate-300 rounded-lg font-bold w-1/2 md:w-auto">{t('cancelImport')}</button>
                    <button onClick={handleConfirmImport} className="px-5 py-3 bg-indigo-600 text-white rounded-lg font-bold w-1/2 md:w-auto">{t('confirmImport')}</button>
                  </div>
                </div>
                {/* Simplified List for Import Review */}
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {filteredImportedStudents.map((student) => (
                    <div key={student.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row gap-3 items-center">
                      <div className="flex-1 w-full grid grid-cols-2 gap-2">
                        <input type="text" value={`${student.firstName} ${student.lastName}`} onChange={(e) => { const [first, ...rest] = e.target.value.split(' '); handleUpdateImportedStudent(student.id, 'firstName', first); handleUpdateImportedStudent(student.id, 'lastName', rest.join(' ')); }} className="p-2 border rounded text-sm font-bold" placeholder="Name" />
                        <input type="text" value={student.studentCode} onChange={(e) => handleUpdateImportedStudent(student.id, 'studentCode', e.target.value)} className="p-2 border rounded text-sm" placeholder="Code" />
                      </div>
                      <button onClick={() => handleDeleteImportedStudent(student.id)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 size={20} /></button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center relative ${isImporting ? 'bg-slate-50 border-indigo-200' : 'border-slate-300 hover:bg-slate-50'}`}>
                  {isImporting ? (
                    <div className="flex flex-col items-center"><Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" /><p className="text-indigo-600 font-bold">{t('importingData')}</p></div>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 text-slate-400 mb-4" />
                      <h4 className="font-bold text-slate-900 mb-2 text-lg">{t('uploadClassList')}</h4>
                      <p className="text-sm text-slate-500 mb-6 max-w-md font-medium">{t('csvFormatInfo')}</p>
                      <input type="file" accept=".xlsx, .xls, .csv, .pdf, image/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                      <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold pointer-events-none">Browse Files</button>
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Registry Mode */}
        {manageMode === 'registry' && (
          <div className="space-y-4">
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute top-3.5 left-3 text-slate-400 w-5 h-5 rtl:left-auto rtl:right-3" />
                <input type="text" value={registrySearch} onChange={(e) => setRegistrySearch(e.target.value)} placeholder={t('filterStudents')} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold outline-none rtl:pl-4 rtl:pr-10" />
              </div>
              <button onClick={() => setIsAddingStudent(!isAddingStudent)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 rounded-lg flex items-center justify-center shadow-sm transition-colors">
                <Plus size={24} />
              </button>
            </div>

            {/* Add Student Form */}
            {isAddingStudent && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-4 animate-in slide-in-from-top-4">
                <h4 className="font-bold text-indigo-900 mb-3">{t('addStudent')}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <input type="text" value={newStudent.firstName} onChange={(e) => setNewStudent({ ...newStudent, firstName: e.target.value })} className="p-2 border border-indigo-200 rounded text-sm" placeholder={lang === Language.AR ? 'الاسم الشخصي' : 'First Name'} />
                  <input type="text" value={newStudent.lastName} onChange={(e) => setNewStudent({ ...newStudent, lastName: e.target.value })} className="p-2 border border-indigo-200 rounded text-sm" placeholder={lang === Language.AR ? 'الاسم العائلي' : 'Last Name'} />
                  <input type="text" value={newStudent.studentCode} onChange={(e) => setNewStudent({ ...newStudent, studentCode: e.target.value })} className="p-2 border border-indigo-200 rounded text-sm font-mono" placeholder="Code (ID)" />
                  <select value={newStudent.classId} onChange={(e) => setNewStudent({ ...newStudent, classId: e.target.value })} className="p-2 border border-indigo-200 rounded text-sm">
                    <option value="">-- {t('selectClass')} --</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <input type="text" value={newStudent.parentPhone} onChange={(e) => setNewStudent({ ...newStudent, parentPhone: e.target.value })} className="p-2 border border-indigo-200 rounded text-sm sm:col-span-2" placeholder={t('parentPhone')} />
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setIsAddingStudent(false)} className="px-4 py-2 text-slate-600 bg-white border border-slate-200 rounded-lg font-bold text-sm">{t('cancelImport')}</button>
                  <button onClick={handleAddNewStudent} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm shadow-sm">{t('saveChanges')}</button>
                </div>
              </div>
            )}

            {/* Mobile-Friendly Registry List (Cards) */}
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {filteredRegistryStudents.length > 0 ? filteredRegistryStudents.map(student => {
                const isEditing = editingStudentId === student.id;
                const data = isEditing && tempStudentData ? tempStudentData : student;

                // Construct the automated message
                const currentDate = new Date().toLocaleDateString(lang === Language.AR ? 'ar-MA' : 'en-GB');
                const schoolName = appSettings.schoolName || (lang === Language.AR ? "المؤسسة" : "School");
                const studentName = `${student.firstName} ${student.lastName}`;

                let messageText = '';
                if (lang === Language.AR) {
                  messageText = `السلام عليكم، نحيطكم علماً بتغيب التلميذ: ${studentName}، بتاريخ: ${currentDate}، المرجو التواصل مع الإدارة. المؤسسة: ${schoolName}`;
                } else if (lang === Language.FR) {
                  messageText = `Bonjour, nous vous informons que l'élève ${studentName} est marqué absent le ${currentDate}. Veuillez contacter l'administration. École : ${schoolName}`;
                } else {
                  messageText = `Hello, we wish to inform you that student ${studentName} was marked absent on ${currentDate}. Please contact the administration. School: ${schoolName}`;
                }

                return (
                  <div key={student.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                    {isEditing ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        <input type="text" value={`${data.firstName} ${data.lastName}`} onChange={(e) => { const [first, ...rest] = e.target.value.split(' '); setTempStudentData({ ...data, firstName: first, lastName: rest.join(' ') }); }} className="p-2 border border-indigo-300 rounded font-bold text-slate-900" placeholder="Full Name" />
                        <input type="text" value={data.studentCode} onChange={(e) => setTempStudentData({ ...data, studentCode: e.target.value })} className="p-2 border border-indigo-300 rounded font-mono" placeholder="Code" />
                        <select value={data.classId} onChange={(e) => setTempStudentData({ ...data, classId: e.target.value })} className="p-2 border border-indigo-300 rounded">
                          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <input type="text" value={data.parentPhone || ''} onChange={(e) => setTempStudentData({ ...data, parentPhone: e.target.value })} className="p-2 border border-indigo-300 rounded" placeholder="Phone" />
                      </div>
                    ) : (
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h5 className="font-extrabold text-slate-800 text-lg">{student.firstName} {student.lastName}</h5>
                          <div className="flex flex-wrap gap-2 mt-1">
                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded font-mono">{student.studentCode}</span>
                            <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded font-bold">{classes.find(c => c.id === student.classId)?.name || 'Unknown Class'}</span>
                          </div>
                          {student.parentPhone && (
                            <div className="flex items-center gap-3 mt-3">
                              <a href={`tel:${student.parentPhone}`} className="text-slate-400 hover:text-green-600 transition-colors bg-slate-50 p-2 rounded-full hover:bg-green-50" title="Call"><Phone size={16} /></a>
                              <a href={`sms:${student.parentPhone}?body=${encodeURIComponent(messageText)}`} className="text-slate-400 hover:text-blue-600 transition-colors bg-slate-50 p-2 rounded-full hover:bg-blue-50" title="SMS"><MessageSquare size={16} /></a>
                              <a href={`https://wa.me/${student.parentPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(messageText)}`} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-emerald-600 transition-colors bg-slate-50 p-2 rounded-full hover:bg-emerald-50" title="WhatsApp"><MessageCircle size={16} /></a>
                              <span className="text-xs font-mono text-slate-400 border-l pl-2 border-slate-200">{student.parentPhone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-slate-100">
                      {isEditing ? (
                        <>
                          <button onClick={handleSaveStudentEdit} className="flex-1 sm:flex-none px-4 py-2 bg-green-600 text-white rounded-lg font-bold flex items-center justify-center gap-2"><Check size={18} /> Save</button>
                          <button onClick={handleCancelEdit} className="flex-1 sm:flex-none px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-bold flex items-center justify-center gap-2"><X size={18} /> Cancel</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => handleEditStudent(student)} className="flex-1 sm:flex-none px-4 py-2 bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"><Edit2 size={18} /> Edit</button>
                          <button onClick={() => handleDeleteStudent(student.id)} className="flex-1 sm:flex-none px-4 py-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-colors active:scale-95 shadow-sm border border-red-100"><Trash2 size={18} /> Delete</button>
                        </>
                      )}
                    </div>
                  </div>
                )
              }) : <div className="p-8 text-center text-slate-500">No students found.</div>}
            </div>
          </div>
        )}
      </div>

      {/* 4. General Settings */}
      <div className="bg-white p-4 md:p-6 rounded-xl shadow border border-slate-200">
        <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-200">
          <div className="bg-blue-100 p-3 rounded-full"><School className="w-6 h-6 text-blue-700" /></div>
          <h3 className="text-xl font-bold text-slate-900">{t('generalSettings')}</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">{t('schoolName')}</label>
            <input
              type="text"
              value={localSettings.schoolName}
              onChange={(e) => setLocalSettings({ ...localSettings, schoolName: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900 outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">{t('lateThreshold')} (min)</label>
            <input
              type="number"
              value={localSettings.lateThreshold}
              onChange={(e) => setLocalSettings({ ...localSettings, lateThreshold: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900 outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* SMS Alerts Toggle */}
          <div className="md:col-span-2 flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg transition-all hover:border-slate-300">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full transition-colors ${localSettings.smsAlerts ? 'bg-primary/10 text-primary' : 'bg-slate-200 text-slate-500'}`}>
                <MessageSquare size={24} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-lg">{t('smsAlerts')}</h4>
                <p className="text-sm text-slate-500 font-medium">{t('smsAlertsDesc')}</p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={localSettings.smsAlerts}
                onChange={(e) => setLocalSettings({ ...localSettings, smsAlerts: e.target.checked })}
              />
              <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary rtl:peer-checked:after:-translate-x-full"></div>
            </label>
          </div>
        </div>
        <div className="flex justify-end pt-8 mt-4"><button onClick={handleSaveGeneralSettings} className="w-full md:w-auto bg-primary hover:bg-teal-800 text-white px-8 py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg font-bold text-lg active:scale-95"><Save size={20} /><span>{t('saveChanges')}</span></button></div>
      </div>

      {/* Toast Notification */}
      {
        saved && (
          <div className="fixed bottom-8 right-8 bg-green-700 text-white px-6 py-4 rounded-lg shadow-xl animate-in slide-in-from-bottom-10 fade-in duration-300 font-bold z-50 flex items-center gap-3">
            <CheckCircle className="text-white" size={24} />
            {lang === Language.AR ? 'تم حفظ التغييرات بنجاح' : 'Settings Saved Successfully'}
          </div>
        )
      }

      {/* Confirmation Modal - Custom Implementation to bypass browser blocks */}
      {
        confirmModal.isOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" style={{ margin: 0 }}>
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 transform scale-100 animate-in zoom-in-95 duration-200" dir={dir}>
              <div className="bg-red-50 p-6 flex items-start gap-4 border-b border-red-100">
                <div className="bg-red-100 p-2 rounded-full text-red-600"><AlertTriangle size={24} /></div>
                <div>
                  <h3 className="text-lg font-extrabold text-red-900">{confirmModal.title}</h3>
                  <p className="text-sm text-red-700 mt-1 font-medium">{confirmModal.message}</p>
                </div>
              </div>
              <div className="p-4 bg-white flex justify-end gap-3">
                <button
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className="px-5 py-2.5 bg-white text-slate-700 font-bold border border-slate-300 rounded-lg hover:bg-slate-50 active:scale-95 transition-all"
                >
                  {lang === Language.AR ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  onClick={confirmModal.onConfirm}
                  className="px-5 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 active:scale-95 shadow-md shadow-red-200 transition-all"
                >
                  {lang === Language.AR ? 'نعم، احذف' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

// Helper component for notification
const CheckCircle = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

export default Settings;
