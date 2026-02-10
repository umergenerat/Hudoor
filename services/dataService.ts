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

    async updateClass(id: string, updates: Partial<ClassGroup>): Promise<void> {
        const { error } = await supabase
            .from('classes')
            .update(updates)
            .eq('id', id);

        if (error) throw error;
    },

    async deleteClass(id: string): Promise<void> {
        const { error } = await supabase
            .from('classes')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async bulkAddClasses(classes: Omit<ClassGroup, 'id'>[]): Promise<ClassGroup[]> {
        const { data, error } = await supabase
            .from('classes')
            .insert(classes)
            .select();

        if (error) throw error;
        return data || [];
    },

    async getClassesByNames(names: string[]): Promise<ClassGroup[]> {
        const { data, error } = await supabase
            .from('classes')
            .select('*')
            .in('name', names);

        if (error) throw error;
        return data || [];
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


            parentPhone: s.parent_phone,
            nationalId: s.national_id,
            firstNameAr: s.first_name_ar,
            lastNameAr: s.last_name_ar,
            gender: s.gender,
            trainingLevel: s.training_level,
            trainingType: s.training_type,
            stream: s.stream,
            cef: s.cef
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

            absence_count: student.absenceCount,
            national_id: student.nationalId,
            first_name_ar: student.firstNameAr,
            last_name_ar: student.lastNameAr,
            gender: student.gender,
            training_level: student.trainingLevel,
            training_type: student.trainingType,
            stream: student.stream,
            cef: student.cef
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
            riskScore: data.risk_score,
            absenceCount: data.absence_count,
            parentPhone: data.parent_phone,
            nationalId: data.national_id,
            firstNameAr: data.first_name_ar,
            lastNameAr: data.last_name_ar,
            gender: data.gender,
            trainingLevel: data.training_level,
            trainingType: data.training_type,
            stream: data.stream,
            cef: data.cef
        } as Student;
    },

    async updateStudent(id: string, student: Partial<Student>): Promise<void> {
        const updates: any = {};
        if (student.firstName) updates.first_name = student.firstName;
        if (student.lastName) updates.last_name = student.lastName;
        if (student.studentCode) updates.student_code = student.studentCode;
        if (student.classId) updates.class_id = student.classId;
        if (student.parentPhone) updates.parent_phone = student.parentPhone;
        if (student.riskScore !== undefined) updates.risk_score = student.riskScore;
        if (student.absenceCount !== undefined) updates.absence_count = student.absenceCount;
        if (student.nationalId) updates.national_id = student.nationalId;
        if (student.firstNameAr) updates.first_name_ar = student.firstNameAr;
        if (student.lastNameAr) updates.last_name_ar = student.lastNameAr;
        if (student.gender) updates.gender = student.gender;
        if (student.trainingLevel) updates.training_level = student.trainingLevel;
        if (student.trainingType) updates.training_type = student.trainingType;
        if (student.stream) updates.stream = student.stream;
        if (student.cef) updates.cef = student.cef;

        const { error } = await supabase
            .from('students')
            .update(updates)
            .eq('id', id);

        if (error) throw error;
    },

    async bulkAddStudents(students: Omit<Student, 'id'>[]): Promise<Student[]> {
        const dbStudents = students.map(s => ({
            first_name: s.firstName,
            last_name: s.lastName,
            student_code: s.studentCode,
            class_id: s.classId,
            parent_phone: s.parentPhone,
            risk_score: s.riskScore || 0,

            absence_count: s.absenceCount || 0,
            national_id: s.nationalId,
            first_name_ar: s.firstNameAr,
            last_name_ar: s.lastNameAr,
            gender: s.gender,
            training_level: s.trainingLevel,
            training_type: s.trainingType,
            stream: s.stream,
            cef: s.cef
        }));

        const { data, error } = await supabase
            .from('students')
            .insert(dbStudents)
            .select();

        if (error) throw error;
        return (data || []).map(s => ({
            id: s.id,
            firstName: s.first_name,
            lastName: s.last_name,
            studentCode: s.student_code,
            classId: s.class_id,
            riskScore: s.risk_score,
            absenceCount: s.absence_count,


            parentPhone: s.parent_phone,
            nationalId: s.national_id,
            firstNameAr: s.first_name_ar,
            lastNameAr: s.last_name_ar,
            gender: s.gender,
            trainingLevel: s.training_level,
            trainingType: s.training_type,
            stream: s.stream,
            cef: s.cef
        }));
    },

    async deleteStudent(id: string): Promise<void> {
        const { error } = await supabase
            .from('students')
            .delete()
            .eq('id', id);

        if (error) throw error;
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
    },

    // Subjects
    async getSubjects(): Promise<string[]> {
        const { data, error } = await supabase
            .from('subjects')
            .select('name')
            .order('name');

        if (error) throw error;
        return (data || []).map(s => s.name);
    },

    async addSubject(name: string): Promise<void> {
        const { error } = await supabase
            .from('subjects')
            .insert([{ name }]);

        if (error) throw error;
    },

    async updateSubject(oldName: string, newName: string): Promise<void> {
        const { error } = await supabase
            .from('subjects')
            .update({ name: newName })
            .eq('name', oldName);

        if (error) throw error;
    },

    async deleteSubject(name: string): Promise<void> {
        const { error } = await supabase
            .from('subjects')
            .delete()
            .eq('name', name);

        if (error) throw error;
    }
};
