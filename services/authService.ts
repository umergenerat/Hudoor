import { supabase } from '../lib/supabase';
import { createClient } from '@supabase/supabase-js';
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
        if (!data.user) throw new Error('Authentication failed: No user returned');

        const currentUser = await this.getCurrentUser();
        if (!currentUser) {
            throw new Error('User authenticated but profile not found. Please ensure the trigger created your profile in the profiles table.');
        }

        return currentUser;
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
    },

    async updatePassword(newPassword: string): Promise<void> {
        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });
        if (error) throw error;
    },

    async updateProfile(userId: string, updates: { name?: string; email?: string }): Promise<void> {
        // Update email in Auth if changed
        if (updates.email) {
            const { error: authError } = await supabase.auth.updateUser({
                email: updates.email
            });
            if (authError) throw authError;
        }

        // Update display_name in profiles table
        if (updates.name) {
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ display_name: updates.name, updated_at: new Date().toISOString() })
                .eq('id', userId);
            if (profileError) throw profileError;
        }
    },

    // --- Admin User Management ---

    async getAllUsers(): Promise<User[]> {
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select('*');

        if (error) throw error;

        // Currently we can't fetch emails for other users easily without Service Role
        // But for this demo, we can assume we only have access to profile data
        // Or we rely on what we can get.
        // NOTE: Profiles does NOT store email by default in our schema, but we can assume
        // the admin sees the name and role.
        // If we really need email, we should have added it to profiles table via the trigger.
        // For now, return what we have.
        // WAIT: The trigger COALESCE(new.raw_user_meta_data->>'full_name', new.email) might put email in display_name if name is missing.

        return profiles.map(p => ({
            id: p.id,
            name: p.display_name,
            email: '', // Hidden for security/privacy if not in profile
            role: p.role as UserRole,
            assignedClassIds: p.assigned_class_ids || [],
            assignedSubjects: p.assigned_subjects || [],
            password: ''
        }));
    },

    async createUser(user: Partial<User>): Promise<User | null> {
        // 1. Create a temporary client to avoid signing out the Admin
        const tempClient = createClient(
            import.meta.env.VITE_SUPABASE_URL,
            import.meta.env.VITE_SUPABASE_ANON_KEY,
            {
                auth: {
                    persistSession: false, // Do not persist this session
                    autoRefreshToken: false,
                    detectSessionInUrl: false
                }
            }
        );

        // 2. Sign up the new user
        const { data, error } = await tempClient.auth.signUp({
            email: user.email!,
            password: user.password!,
            options: {
                data: {
                    full_name: user.name,
                }
            }
        });

        if (error) throw error;
        if (!data.user) return null;

        // 3. Update the profile with Role and Assignments (using Admin client)
        // because the new user might not have permission to set their own role to 'admin'
        // or assign classes immediately if RLS blocks it.
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                role: user.role,
                assigned_class_ids: user.assignedClassIds,
                assigned_subjects: user.assignedSubjects
            })
            .eq('id', data.user.id);

        if (updateError) {
            console.error("User created but failed to update profile:", updateError);
            throw updateError;
        }

        return {
            id: data.user.id,
            name: user.name!,
            email: user.email!,
            role: user.role!,
            assignedClassIds: user.assignedClassIds || [],
            assignedSubjects: user.assignedSubjects || [],
            password: ''
        };
    },

    async updateOtherUserProfile(id: string, updates: Partial<User>): Promise<void> {
        const dbUpdates: any = {};
        if (updates.name) dbUpdates.display_name = updates.name;
        if (updates.role) dbUpdates.role = updates.role;
        if (updates.assignedClassIds) dbUpdates.assigned_class_ids = updates.assignedClassIds;
        if (updates.assignedSubjects) dbUpdates.assigned_subjects = updates.assignedSubjects;

        if (Object.keys(dbUpdates).length > 0) {
            const { error } = await supabase
                .from('profiles')
                .update(dbUpdates)
                .eq('id', id);
            if (error) throw error;
        }
    },

    async deleteUser(id: string): Promise<void> {
        // We can only delete from profiles from the client side (if policy allows).
        // Deleting from auth.users requires Service Role.
        // This effectively "bans" the user from the app perspective as their profile is gone.
        // They might still be able to "login" to Auth, but getCurrentUser will fail
        // because it checks for profile existence:
        // "if (!profile) return null;"

        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
