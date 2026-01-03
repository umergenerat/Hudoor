import { supabase } from '../lib/supabase';
import { ClassGroup, Student, AttendanceRecord } from '../types';

export const dataService = {
    // Classes
    async getClasses(): Promise<ClassGroup[]> {
        const { data, error } = await supabase
            .from('classes')
            .select('*')
            .order('name');

        if (error) throw error;
        return data || [];
    },

    async addClass(classData: Omit<ClassGroup, 'id'>): Promise<ClassGroup> {
        const { data, error } = await supabase
            .from('classes')
            .insert([classData])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Students
    async getStudents(classId?: string): Promise<Student[]> {
        let query = supabase.from('students').select('*');
        if (classId) {
            query = query.eq('class_id', classId);
        }

        const { data, error } = await query;
        if (error) throw error;

        return (data || []).map(s => ({
            id: s.id,
            firstName: s.first_name,
            lastName: s.last_name,
            studentCode: s.student_code,
            classId: s.class_id,
            riskScore: s.risk_score,
            absenceCount: s.absence_count,
            parentPhone: s.parent_phone
        }));
    },

    async addStudent(student: Omit<Student, 'id'>): Promise<Student> {
        const dbStudent = {
            first_name: student.firstName,
            last_name: student.lastName,
            student_code: student.studentCode,
            class_id: student.classId,
            parent_phone: student.parentPhone,
            risk_score: student.riskScore,
            absence_count: student.absenceCount
        };

        const { data, error } = await supabase
            .from('students')
            .insert([dbStudent])
            .select()
            .single();

        if (error) throw error;
        return {
            id: data.id,
            firstName: data.first_name,
            lastName: data.last_name,
            studentCode: data.student_code,
            classId: data.class_id,
            riskScore: data.risk_score,
            absenceCount: data.absence_count,
            parentPhone: data.parent_phone
        } as Student;
    },

    // Attendance
    async saveAttendanceRecords(records: Omit<AttendanceRecord, 'id'>[]): Promise<void> {
        const dbRecords = records.map(r => ({
            student_id: r.studentId,
            date: r.date,
            status: r.status,
            minutes_late: r.minutesLate || 0,
            notes: r.notes,
            source: r.source,
            subject: r.subject,
            session_duration: r.sessionDuration
        }));

        const { error } = await supabase
            .from('attendance_records')
            .insert(dbRecords);

        if (error) throw error;
    }
};
