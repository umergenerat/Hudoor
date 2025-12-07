
import { AttendanceStatus, ClassGroup, Language, Student, TranslationDictionary } from './types';

export const TRANSLATIONS: TranslationDictionary = {
  dashboard: {
    [Language.AR]: 'لوحة التحكم',
    [Language.EN]: 'Dashboard',
    [Language.FR]: 'Tableau de bord'
  },
  attendance: {
    [Language.AR]: 'تسجيل الحضور',
    [Language.EN]: 'Attendance',
    [Language.FR]: 'Présence'
  },
  ocrUpload: {
    [Language.AR]: 'مسح ضوئي (OCR)',
    [Language.EN]: 'OCR Scan',
    [Language.FR]: 'Scan OCR'
  },
  students: {
    [Language.AR]: 'الطلاب',
    [Language.EN]: 'Students',
    [Language.FR]: 'Étudiants'
  },
  settings: {
    [Language.AR]: 'الإعدادات',
    [Language.EN]: 'Settings',
    [Language.FR]: 'Paramètres'
  },
  totalStudents: {
    [Language.AR]: 'إجمالي الطلاب',
    [Language.EN]: 'Total Students',
    [Language.FR]: 'Total Étudiants'
  },
  attendanceRate: {
    [Language.AR]: 'نسبة الحضور',
    [Language.EN]: 'Attendance Rate',
    [Language.FR]: 'Taux de présence'
  },
  lostTime: {
    [Language.AR]: 'وقت تعليمي مفقود (دقيقة)',
    [Language.EN]: 'Lost Instructional Time (min)',
    [Language.FR]: 'Temps d\'instruction perdu (min)'
  },
  riskAlert: {
    [Language.AR]: 'مؤشر التغيب المزمن',
    [Language.EN]: 'Chronic Absenteeism',
    [Language.FR]: 'Absentéisme chronique'
  },
  submit: {
    [Language.AR]: 'حفظ البيانات',
    [Language.EN]: 'Submit Data',
    [Language.FR]: 'Soumettre'
  },
  uploadImage: {
    [Language.AR]: 'رفع ورقة الحضور',
    [Language.EN]: 'Upload Attendance Sheet',
    [Language.FR]: 'Télécharger la feuille de présence'
  },
  analyzing: {
    [Language.AR]: 'جاري التحليل بالذكاء الاصطناعي...',
    [Language.EN]: 'Analyzing with AI...',
    [Language.FR]: 'Analyse par IA...'
  },
  present: {
    [Language.AR]: 'حاضر',
    [Language.EN]: 'Present',
    [Language.FR]: 'Présent'
  },
  absent: {
    [Language.AR]: 'غائب',
    [Language.EN]: 'Absent',
    [Language.FR]: 'Absent'
  },
  late: {
    [Language.AR]: 'متأخر',
    [Language.EN]: 'Late',
    [Language.FR]: 'En retard'
  },
  excused: {
    [Language.AR]: 'معذور',
    [Language.EN]: 'Excused',
    [Language.FR]: 'Excusé'
  },
  // Settings & Profile
  adminProfile: {
    [Language.AR]: 'ملف المتصرف التربوي',
    [Language.EN]: 'Administrator Profile',
    [Language.FR]: 'Profil Administrateur'
  },
  adminRoleDescription: {
    [Language.AR]: 'معلومات المسؤول عن النظام',
    [Language.EN]: 'System Administrator Information',
    [Language.FR]: 'Informations sur l\'administrateur du système'
  },
  fullName: {
    [Language.AR]: 'الاسم الكامل',
    [Language.EN]: 'Full Name',
    [Language.FR]: 'Nom complet'
  },
  jobTitle: {
    [Language.AR]: 'الصفة',
    [Language.EN]: 'Job Title',
    [Language.FR]: 'Titre du poste'
  },
  generalSettings: {
    [Language.AR]: 'الإعدادات العامة',
    [Language.EN]: 'General Settings',
    [Language.FR]: 'Paramètres généraux'
  },
  schoolName: {
    [Language.AR]: 'اسم المؤسسة',
    [Language.EN]: 'School Name',
    [Language.FR]: 'Nom de l\'établissement'
  },
  lateThreshold: {
    [Language.AR]: 'حد التأخير (دقائق)',
    [Language.EN]: 'Late Threshold',
    [Language.FR]: 'Seuil de retard'
  },
  notifications: {
    [Language.AR]: 'الإشعارات',
    [Language.EN]: 'Notifications',
    [Language.FR]: 'Notifications'
  },
  emailAlerts: {
    [Language.AR]: 'تنبيهات البريد الإلكتروني',
    [Language.EN]: 'Email Alerts',
    [Language.FR]: 'Alertes par e-mail'
  },
  emailAlertsDesc: {
    [Language.AR]: 'استلام ملخص يومي للغياب',
    [Language.EN]: 'Receive daily absence summary',
    [Language.FR]: 'Recevoir un résumé quotidien des absences'
  },
  smsAlerts: {
    [Language.AR]: 'رسائل SMS',
    [Language.EN]: 'SMS Alerts',
    [Language.FR]: 'Alertes SMS'
  },
  smsAlertsDesc: {
    [Language.AR]: 'إشعار فوري لأولياء الأمور',
    [Language.EN]: 'Instant notification to parents',
    [Language.FR]: 'Notification instantanée aux parents'
  },
  saveChanges: {
    [Language.AR]: 'حفظ التغييرات',
    [Language.EN]: 'Save Changes',
    [Language.FR]: 'Enregistrer les modifications'
  },
  footerBy: {
    [Language.AR]: 'عمر ايت لوتو',
    [Language.EN]: 'Aomar Ait Loutou',
    [Language.FR]: 'Aomar Ait Loutou'
  },
  // Data Management & Session
  dataManagement: {
    [Language.AR]: 'إدارة البيانات واللوائح',
    [Language.EN]: 'Data & Roster Management',
    [Language.FR]: 'Gestion des données et listes'
  },
  uploadClassList: {
    [Language.AR]: 'تحميل اللوائح (Excel, CSV, PDF, صور)',
    [Language.EN]: 'Upload Rosters (Excel, CSV, PDF, Images)',
    [Language.FR]: 'Importer listes (Excel, CSV, PDF, Images)'
  },
  csvFormatInfo: {
    [Language.AR]: 'يقبل ملفات Excel و CSV و PDF. سيتم عرض البيانات لمراجعتها وتعديل أرقام الهواتف قبل الحفظ.',
    [Language.EN]: 'Accepts Excel, CSV, and PDF. Data will be shown for review and phone number editing before saving.',
    [Language.FR]: 'Accepte Excel, CSV et PDF. Les données seront affichées pour examen et édition des numéros de téléphone avant la sauvegarde.'
  },
  sessionDetails: {
    [Language.AR]: 'تفاصيل الحصة',
    [Language.EN]: 'Session Details',
    [Language.FR]: 'Détails de la séance'
  },
  subject: {
    [Language.AR]: 'المادة',
    [Language.EN]: 'Subject',
    [Language.FR]: 'Matière'
  },
  selectClass: {
    [Language.AR]: 'اختر القسم',
    [Language.EN]: 'Select Class',
    [Language.FR]: 'Sélectionner la classe'
  },
  date: {
    [Language.AR]: 'التاريخ',
    [Language.EN]: 'Date',
    [Language.FR]: 'Date'
  },
  timeSlot: {
    [Language.AR]: 'الحيز الزمني',
    [Language.EN]: 'Time Slot',
    [Language.FR]: 'Créneau horaire'
  },
  startTime: {
    [Language.AR]: 'من',
    [Language.EN]: 'From',
    [Language.FR]: 'De'
  },
  endTime: {
    [Language.AR]: 'إلى',
    [Language.EN]: 'To',
    [Language.FR]: 'À'
  },
  importingData: {
    [Language.AR]: 'جاري استيراد ومعالجة البيانات...',
    [Language.EN]: 'Importing and processing data...',
    [Language.FR]: 'Importation et traitement des données...'
  },
  recordsSaved: {
    [Language.AR]: 'تم حفظ السجلات بنجاح',
    [Language.EN]: 'Records saved successfully',
    [Language.FR]: 'Enregistrements sauvegardés avec succès'
  },
  reviewData: {
    [Language.AR]: 'مراجعة وتعديل البيانات',
    [Language.EN]: 'Review & Edit Data',
    [Language.FR]: 'Réviser et modifier les données'
  },
  parentPhone: {
    [Language.AR]: 'هاتف الولي',
    [Language.EN]: 'Parent Phone',
    [Language.FR]: 'Tél. Parents'
  },
  confirmImport: {
    [Language.AR]: 'تأكيد وحفظ القائمة',
    [Language.EN]: 'Confirm & Save List',
    [Language.FR]: 'Confirmer et enregistrer la liste'
  },
  cancelImport: {
    [Language.AR]: 'إلغاء',
    [Language.EN]: 'Cancel',
    [Language.FR]: 'Annuler'
  },
  filterStudents: {
    [Language.AR]: 'بحث (الاسم، الرمز، الهاتف)...',
    [Language.EN]: 'Search (Name, Code, Phone)...',
    [Language.FR]: 'Recherche (Nom, Code, Tél)...'
  },
  // New Translations for Academic Configuration
  academicConfig: {
    [Language.AR]: 'التهيئة البيداغوجية',
    [Language.EN]: 'Academic Configuration',
    [Language.FR]: 'Configuration Académique'
  },
  manageClasses: {
    [Language.AR]: 'إدارة الأقسام',
    [Language.EN]: 'Manage Classes',
    [Language.FR]: 'Gérer les Classes'
  },
  manageSubjects: {
    [Language.AR]: 'إدارة المواد',
    [Language.EN]: 'Manage Subjects',
    [Language.FR]: 'Gérer les Matières'
  },
  addClass: {
    [Language.AR]: 'إضافة قسم',
    [Language.EN]: 'Add Class',
    [Language.FR]: 'Ajouter Classe'
  },
  addSubject: {
    [Language.AR]: 'إضافة مادة',
    [Language.EN]: 'Add Subject',
    [Language.FR]: 'Ajouter Matière'
  },
  subjectName: {
    [Language.AR]: 'اسم المادة',
    [Language.EN]: 'Subject Name',
    [Language.FR]: 'Nom de la matière'
  },
  selectSubject: {
    [Language.AR]: 'اختر المادة',
    [Language.EN]: 'Select Subject',
    [Language.FR]: 'Sélectionner Matière'
  },
  className: {
    [Language.AR]: 'اسم القسم',
    [Language.EN]: 'Class Name',
    [Language.FR]: 'Nom de la classe'
  },
  gradeLevel: {
    [Language.AR]: 'المستوى',
    [Language.EN]: 'Grade',
    [Language.FR]: 'Niveau'
  },
  // API Config
  apiConfig: {
    [Language.AR]: 'إعدادات مفتاح API (Google Gemini)',
    [Language.EN]: 'API Key Configuration (Google Gemini)',
    [Language.FR]: 'Configuration de la clé API (Google Gemini)'
  },
  apiKeyLabel: {
    [Language.AR]: 'أدخل مفتاح API الخاص بك',
    [Language.EN]: 'Enter your API Key',
    [Language.FR]: 'Entrez votre clé API'
  },
  apiKeyPlaceholder: {
    [Language.AR]: 'ألصق المفتاح هنا...',
    [Language.EN]: 'Paste your key here...',
    [Language.FR]: 'Collez votre clé ici...'
  },
  saveKey: {
    [Language.AR]: 'اعتماد المفتاح',
    [Language.EN]: 'Save Key',
    [Language.FR]: 'Enregistrer la clé'
  },
  removeKey: {
    [Language.AR]: 'حذف / إلغاء',
    [Language.EN]: 'Remove Key',
    [Language.FR]: 'Supprimer la clé'
  },
  keySaved: {
    [Language.AR]: 'تم حفظ مفتاح API بنجاح',
    [Language.EN]: 'API Key saved successfully',
    [Language.FR]: 'Clé API enregistrée avec succès'
  },
  addStudent: {
    [Language.AR]: 'إضافة تلميذ يدويًا',
    [Language.EN]: 'Add Student Manually',
    [Language.FR]: 'Ajouter un étudiant'
  },
  addManualRecord: {
    [Language.AR]: 'إضافة سجل يدوي',
    [Language.EN]: 'Add Manual Record',
    [Language.FR]: 'Ajouter un enregistrement'
  },
  // User Management
  userManagement: {
    [Language.AR]: 'إدارة المستخدمين',
    [Language.EN]: 'User Management',
    [Language.FR]: 'Gestion des utilisateurs'
  },
  addUser: {
    [Language.AR]: 'إضافة مستخدم (أستاذ/إداري)',
    [Language.EN]: 'Add User (Teacher/Admin)',
    [Language.FR]: 'Ajouter utilisateur'
  },
  role: {
    [Language.AR]: 'الدور',
    [Language.EN]: 'Role',
    [Language.FR]: 'Rôle'
  },
  admin: {
    [Language.AR]: 'مدير / مسؤول',
    [Language.EN]: 'Admin',
    [Language.FR]: 'Admin'
  },
  teacher: {
    [Language.AR]: 'أستاذ / مكون',
    [Language.EN]: 'Teacher / Trainer',
    [Language.FR]: 'Enseignant'
  },
  assignedClasses: {
    [Language.AR]: 'الأقسام المسندة',
    [Language.EN]: 'Assigned Classes',
    [Language.FR]: 'Classes attribuées'
  },
  assignedSubjects: {
    [Language.AR]: 'المواد المسندة',
    [Language.EN]: 'Assigned Subjects',
    [Language.FR]: 'Matières attribuées'
  },
  email: {
    [Language.AR]: 'البريد الإلكتروني',
    [Language.EN]: 'Email',
    [Language.FR]: 'Email'
  },
  password: {
    [Language.AR]: 'كلمة المرور',
    [Language.EN]: 'Password',
    [Language.FR]: 'Mot de passe'
  },
  permissionsInfo: {
    [Language.AR]: 'سيتمكن هذا المستخدم فقط من تسجيل الحضور للأقسام والمواد المحددة أدناه.',
    [Language.EN]: 'This user will only be able to mark attendance for the classes and subjects selected below.',
    [Language.FR]: 'Cet utilisateur ne pourra marquer la présence que pour les classes et matières sélectionnées ci-dessous.'
  },
  // Account Security
  accountSettings: {
    [Language.AR]: 'إعدادات الحساب',
    [Language.EN]: 'Account Settings',
    [Language.FR]: 'Paramètres du compte'
  },
  changePassword: {
    [Language.AR]: 'تغيير كلمة المرور',
    [Language.EN]: 'Change Password',
    [Language.FR]: 'Changer le mot de passe'
  },
  newPassword: {
    [Language.AR]: 'كلمة المرور الجديدة',
    [Language.EN]: 'New Password',
    [Language.FR]: 'Nouveau mot de passe'
  },
  confirmPassword: {
    [Language.AR]: 'تأكيد كلمة المرور',
    [Language.EN]: 'Confirm Password',
    [Language.FR]: 'Confirmer le mot de passe'
  },
  profileUpdated: {
    [Language.AR]: 'تم تحديث الملف الشخصي بنجاح',
    [Language.EN]: 'Profile updated successfully',
    [Language.FR]: 'Profil mis à jour avec succès'
  },
  passwordMismatch: {
    [Language.AR]: 'كلمة المرور غير متطابقة',
    [Language.EN]: 'Passwords do not match',
    [Language.FR]: 'Les mots de passe ne correspondent pas'
  }
};

export const MOCK_CLASSES: ClassGroup[] = [
  { id: 'c1', name: 'GE101', grade: '1A' },
  { id: 'c2', name: 'GE102', grade: '1A' },
  { id: 'c3', name: 'AA101', grade: '1A' },
   { id: 'c4', name: 'AA102', grade: '1A' },
  { id: 'c5', name: 'EI101', grade: '1A' },
  { id: 'c6', name: 'RVA101', grade: '1A' },
   { id: 'c7', name: 'MEI101', grade: '1A' },
];

export const MOCK_SUBJECTS: string[] = [
  'English',
  'Arabic',
  'French',
  'Computer Science',
];

export const MOCK_STUDENTS: Student[] = [
  { id: 's1', firstName: 'Ahmed', lastName: 'Ali', studentCode: 'ST001', classId: 'c1', riskScore: 10, absenceCount: 2, parentPhone: '0661123456' },
  { id: 's2', firstName: 'Sarah', lastName: 'Connor', studentCode: 'ST002', classId: 'c1', riskScore: 5, absenceCount: 1, parentPhone: '0661987654' },
  { id: 's3', firstName: 'Jean', lastName: 'Dupont', studentCode: 'ST003', classId: 'c1', riskScore: 85, absenceCount: 12, parentPhone: '0661555555' },
  { id: 's4', firstName: 'Fatima', lastName: 'Zahra', studentCode: 'ST004', classId: 'c1', riskScore: 0, absenceCount: 0, parentPhone: '0661222222' },
  { id: 's5', firstName: 'John', lastName: 'Doe', studentCode: 'ST005', classId: 'c2', riskScore: 40, absenceCount: 5, parentPhone: '0661333333' },
];
