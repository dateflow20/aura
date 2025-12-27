import { supabase } from './supabaseClient';
import { Todo, AuraSettings, UserProfile } from '../types';

// Check if Supabase is properly configured
const isSupabaseConfigured = () => {
    return !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
};

// Get current user ID
const getUserId = async () => {
    if (!isSupabaseConfigured()) return null;

    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
};

// ============= TODOS SYNC =============

export const syncTodosToCloud = async (todos: Todo[]): Promise<boolean> => {
    try {
        if (!isSupabaseConfigured()) return false;

        const userId = await getUserId();
        if (!userId) return false;

        // Delete all existing todos for this user (we'll do a full replace for simplicity)
        await supabase.from('todos').delete().eq('user_id', userId);

        // Insert all current todos
        const todosToSync = todos.map(todo => ({
            id: todo.id,
            user_id: userId,
            goal: todo.goal,
            description: todo.description || null,
            due_date: todo.dueDate || null,
            completed: todo.completed,
            priority: todo.priority,
            voice_note_id: todo.voiceNoteId || null,
            pinned: todo.pinned || false,
            calendar_synced: todo.calendarSynced || false
        }));

        if (todosToSync.length > 0) {
            const { error } = await supabase.from('todos').insert(todosToSync);
            if (error) throw error;
        }

        // Sync todo steps
        for (const todo of todos) {
            if (todo.steps && todo.steps.length > 0) {
                await supabase.from('todo_steps').delete().eq('todo_id', todo.id);

                const stepsToSync = todo.steps.map((step, index) => ({
                    id: step.id,
                    todo_id: todo.id,
                    text: step.text,
                    completed: step.completed,
                    position: index
                }));

                await supabase.from('todo_steps').insert(stepsToSync);
            }
        }

        console.log('✅ Todos synced to cloud');
        return true;
    } catch (error) {
        console.error('❌ Failed to sync todos:', error);
        return false;
    }
};

export const syncTodosFromCloud = async (): Promise<Todo[] | null> => {
    try {
        if (!isSupabaseConfigured()) return null;

        const userId = await getUserId();
        if (!userId) return null;

        // Fetch todos
        const { data: todosData, error: todosError } = await supabase
            .from('todos')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (todosError) throw todosError;
        if (!todosData) return [];

        // Fetch all steps for these todos
        const todoIds = todosData.map(t => t.id);
        const { data: stepsData } = await supabase
            .from('todo_steps')
            .select('*')
            .in('todo_id', todoIds)
            .order('position', { ascending: true });

        // Map to local Todo type
        const todos: Todo[] = todosData.map(todo => ({
            id: todo.id,
            goal: todo.goal,
            description: todo.description || undefined,
            dueDate: todo.due_date || undefined,
            completed: todo.completed,
            priority: todo.priority as 'low' | 'medium' | 'high',
            createdAt: todo.created_at,
            voiceNoteId: todo.voice_note_id || undefined,
            pinned: todo.pinned || false,
            calendarSynced: todo.calendar_synced || false,
            steps: stepsData
                ?.filter(s => s.todo_id === todo.id)
                .map(s => ({
                    id: s.id,
                    text: s.text,
                    completed: s.completed
                })) || []
        }));

        console.log('✅ Todos loaded from cloud');
        return todos;
    } catch (error) {
        console.error('❌ Failed to load todos:', error);
        return null;
    }
};

// ============= SETTINGS SYNC =============

export const syncSettingsToCloud = async (userId: string, settings: AuraSettings): Promise<boolean> => {
    try {
        if (!isSupabaseConfigured()) return false;
        if (!userId || userId === 'undefined') {
            console.warn('⚠️ Cannot sync settings: Invalid user ID');
            return false;
        }

        const { error } = await supabase
            .from('user_settings')
            .upsert({
                user_id: userId,
                language: settings.language,
                language_label: settings.languageLabel,
                voice: settings.voice,
                theme: settings.theme,
                eye_color: settings.eyeColor,
                reminder_minutes: settings.reminderMinutes,
                learning_enabled: settings.learningEnabled,
                noise_suppression: settings.noiseSuppression
            });

        if (error) throw error;
        console.log('✅ Settings synced to cloud');
        return true;
    } catch (error) {
        console.error('❌ Failed to sync settings:', error);
        return false;
    }
};

export const syncSettingsFromCloud = async (userId: string): Promise<AuraSettings | null> => {
    try {
        if (!isSupabaseConfigured()) return null;
        if (!userId || userId === 'undefined') {
            console.warn('⚠️ Cannot sync settings: Invalid user ID');
            return null;
        }

        const { data, error } = await supabase
            .from('user_settings')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) {
            // Ignore "no rows" error - it's expected for new users
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        if (!data) return null;

        const settings: AuraSettings = {
            language: data.language,
            languageLabel: data.language_label,
            voice: data.voice,
            theme: data.theme,
            eyeColor: data.eye_color,
            reminderMinutes: data.reminder_minutes,
            learningEnabled: data.learning_enabled,
            noiseSuppression: data.noise_suppression
        };

        console.log('✅ Settings loaded from cloud');
        return settings;
    } catch (error) {
        console.error('❌ Failed to load settings:', error);
        return null;
    }
};

// ============= PROFILE SYNC =============

export const syncProfileToCloud = async (profile: UserProfile): Promise<boolean> => {
    try {
        if (!isSupabaseConfigured()) return false;

        const userId = await getUserId();
        if (!userId) return false;

        const { error } = await supabase
            .from('profiles')
            .upsert({
                id: userId,
                email: profile.email,
                name: profile.name,
                focus_area: profile.focusArea,
                onboarded: profile.onboarded
            });

        if (error) throw error;
        console.log('✅ Profile synced to cloud');
        return true;
    } catch (error) {
        console.error('❌ Failed to sync profile:', error);
        return false;
    }
};

// ============= AUTO SYNC =============

// Debounce helper
let syncTimeout: NodeJS.Timeout | null = null;

export const debouncedSync = (syncFn: () => Promise<void>, delay = 2000) => {
    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = setTimeout(syncFn, delay);
};
