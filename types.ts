
export enum Language {
  AR = 'ar',
  EN = 'en',
  FR = 'fr'
}

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
  EXCUSED = 'excused'
}

export type UserRole = 'admin' | 'teacher';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // Stored locally for this PWA demo
  role: UserRole;
  assignedClassIds: string[]; // IDs of classes this teacher can manage
  assignedSubjects: string[]; // Names of subjects this teacher can teach
}

export interface AuthConfig {
  isAuthenticated: boolean;
  currentUser: User | null;
}

export interface AppSettings {
  schoolName: string;
  lateThreshold: number;
  emailAlerts: boolean;
  smsAlerts: boolean;
  subjectConfigs?: Record<string, number>; // Map subject name to Total Expected Hours
  apiKey?: string; // Google Gemini API Key
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  studentCode: string;
  classId: string;
  riskScore: number; // 0-100
  absenceCount: number;
  parentPhone?: string; // Added for contact
}

export interface ClassGroup {
  id: string;
  name: string;
  grade: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string; // ISO Date
  status: AttendanceStatus;
  minutesLate?: number;
  notes?: string;
  source: 'manual' | 'ocr';
  subject?: string; // Associated Subject
  sessionDuration?: number; // Duration in minutes
}

export interface DashboardMetrics {
  totalStudents: number;
  dailyAttendanceRate: number;
  chronicAbsenteeism: number; // Percentage of students missing > 10%
  lostInstructionalTime: number; // Total minutes lost this week
}

export interface TranslationDictionary {
  [key: string]: {
    [Language.AR]: string;
    [Language.EN]: string;
    [Language.FR]: string;
  }
}
