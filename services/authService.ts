import { supabase } from '../lib/supabase';
import { User, UserRole } from '../types';

export const authService = {
    async getCurrentUser(): Promise<User | null> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (!profile) return null;

        return {
            id: user.id,
            email: user.email || '',
            name: profile.display_name,
            role: profile.role as UserRole,
            assignedClassIds: profile.assigned_class_ids || [],
            assignedSubjects: profile.assigned_subjects || [],
            password: '' // Not stored in profile
        };
    },

    async signIn(email: string, password: string): Promise<User | null> {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;
        if (!data.user) return null;

        return this.getCurrentUser();
    },

    async signUp(email: string, password: string, name: string): Promise<User | null> {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name,
                },
            },
        });

        if (error) throw error;
        if (!data.user) return null;

        return this.getCurrentUser();
    },

    async signOut() {
        await supabase.auth.signOut();
    }
};
