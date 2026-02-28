import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserRole, Branch } from '../types';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
    userRole: UserRole | null;
    loggedInBranchId: string | null;
    login: (role: UserRole, branchId?: string) => void;
    logout: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
    user: {
        id?: string;
        name: string;
        email: string;
        avatar?: string;
    } | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [userRole, setUserRole] = useState<UserRole | null>(() => {
        return localStorage.getItem('userRole') as UserRole || null;
    });
    const [loggedInBranchId, setLoggedInBranchId] = useState<string | null>(() => {
        return localStorage.getItem('loggedInBranchId') || null;
    });
    const [isLoading, setIsLoading] = useState(true);
    const [sbUser, setSbUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<any>(null);

    // Sync Auth State with Supabase
    useEffect(() => {
        // 1. Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setSbUser(session.user);
                fetchProfile(session.user.id);
            } else {
                // Keep local state if session is null
                setIsLoading(false);
            }
        });

        // 2. Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (session?.user) {
                setSbUser(session.user);
                fetchProfile(session.user.id);
            } else if (event === 'SIGNED_OUT') {
                // Only clear if explicitly signed out
                setUserRole(null);
                setLoggedInBranchId(null);
                setProfile(null);
                localStorage.removeItem('userRole');
                localStorage.removeItem('loggedInBranchId');
                setIsLoading(false);
            } else {
                // For other events (like INITIAL_SESSION with null), don't wipe local role
                setSbUser(null);
                setIsLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (uid: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', uid)
                .single();

            if (data) {
                setProfile(data);
                setUserRole(data.role as UserRole);
                setLoggedInBranchId(data.branch_id);
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Derived User Object (Supabase aware)
    const user = sbUser ? {
        id: sbUser.id,
        name: profile?.name || sbUser.email?.split('@')[0] || 'User',
        email: sbUser.email || '',
        avatar: profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.name || 'User'}&background=random`
    } : null;

    const login = (role: UserRole, branchId?: string) => {
        // Real session handling via Supabase is asynchronous, 
        // but for demo mode/local state, we persist to localStorage.
        setUserRole(role);
        localStorage.setItem('userRole', role);
        if (branchId) {
            setLoggedInBranchId(branchId);
            localStorage.setItem('loggedInBranchId', branchId);
        }
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUserRole(null);
        setLoggedInBranchId(null);
        setProfile(null);
        localStorage.removeItem('userRole');
        localStorage.removeItem('loggedInBranchId');
    };

    return (
        <AuthContext.Provider value={{
            userRole,
            loggedInBranchId,
            login,
            logout,
            isAuthenticated: !!sbUser || !!userRole,
            isLoading,
            user
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
