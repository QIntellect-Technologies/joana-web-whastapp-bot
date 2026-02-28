import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const useActivityTracker = () => {
    const { user } = useAuth();

    useEffect(() => {
        if (!user) return;

        const trackActivity = async () => {
            const now = new Date();
            const todayStr = now.toISOString().split('T')[0];
            const STORAGE_KEY = `last_visit_${user.id}`;
            const lastVisit = localStorage.getItem(STORAGE_KEY);

            const updates: any = {
                last_interaction: now.toISOString()
            };

            // If first visit of the day, increment visit count
            if (lastVisit !== todayStr) {
                // Increment visit_count atomically using rpc or just fetch-update
                // Since rpc might not exist, we'll do fetch-update safely or ignore race condition for now
                // Ideally: supabase.rpc('increment_visit_count', { user_id: user.id })

                // For now, let's just fetch current and update. 
                // Note: In high traffic, RPC is better.
                const { data } = await supabase
                    .from('customers')
                    .select('visit_count')
                    .eq('id', user.id)
                    .single();

                if (data) {
                    updates.visit_count = (data.visit_count || 0) + 1;
                } else {
                    updates.visit_count = 1;
                }

                localStorage.setItem(STORAGE_KEY, todayStr);
            }

            // Update DB
            await supabase
                .from('customers')
                .update(updates)
                .eq('id', user.id);

            // Also update profile last_login if needed
            await supabase
                .from('profiles')
                .update({ last_login: now.toISOString() })
                .eq('id', user.id);
        };

        trackActivity();

        // Optional: Track interaction events (clicks) - simpler version just on mount/session start

    }, [user?.id]); // Only run when user changes (login)
};
