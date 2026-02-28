import React, { useState } from 'react';
import { UserRole, Branch } from '../types';
import { ShieldCheck, Store, UtensilsCrossed, ChefHat, User, Lock, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LoginScreenProps {
  branches: Branch[];
  onLogin: (role: UserRole, branchId?: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ branches, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const cleanEmail = email.trim();
    const cleanPass = password.trim();

    // REQUESTED CREDENTIALS: superadmin@foodbot.com / superadmin
    // MAPPING: Allow "superadmin" username to map to this email for convenience
    let targetEmail = cleanEmail;
    let targetPassword = cleanPass;

    if (cleanEmail.toLowerCase() === 'superadmin') {
      targetEmail = 'superadmin@foodbot.com';
    }

    console.log(`[Auth] Attempting login for: ${targetEmail}`);

    // 1. Attempt Supabase Auth
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: targetEmail,
      password: targetPassword,
    });

    if (!authError && data.user) {
      console.log('[Auth] Login Successful via Supabase');
      setIsLoading(false);
      return;
    }

    // 2. Superadmin Auto-Provisioning (Specific Request)
    // Trigger if specific credentials are used but failed standard login (likely user doesn't exist yet)
    if (targetEmail.toLowerCase() === 'superadmin@foodbot.com' && targetPassword === 'superadmin') {
      console.log('[Auth] Attempting Superadmin Auto-Provisioning for specific request...');

      // A. Try Sign Up
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: targetEmail,
        password: targetPassword,
      });

      if (signUpError) {
        console.error('[Auth] SignUp Failed:', signUpError);
        // Only show error if it's NOT "User already registered" (which would mean password was wrong in step 1)
        if (!signUpError.message.includes('registered')) {
          setError(`Setup Error: ${signUpError.message}`);
          setIsLoading(false);
          return;
        } else {
          // If registered but failed step 1, it means WRONG PASSWORD for existing user
          setError('Invalid password for existing Superadmin account.');
          setIsLoading(false);
          return;
        }
      }

      const user = signUpData.user || (authError ? null : data.user);

      if (user) {
        console.log('[Auth] Superadmin User/Session acquired. Assigning GLOBAL role...');

        // B. FORCE Role to Main Admin in DB
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: user.id,
          email: targetEmail,
          role: UserRole.MAIN_ADMIN,
          full_name: 'Global Super Admin',
          updated_at: new Date().toISOString()
        });

        if (profileError) {
          console.error('[Auth] Failed to set Superadmin role:', profileError);
        } else {
          console.log('[Auth] Role assigned: MAIN_ADMIN');
        }

        // C. If active session, done.
        if (signUpData.session) {
          console.log('[Auth] Session active. Done.');
          setIsLoading(false);
          return;
        }

        // D. Retry Sign In (Double check)
        const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
          email: targetEmail,
          password: targetPassword
        });

        if (!retryError && retryData.session) {
          setIsLoading(false);
          return;
        }
      }
    }

    if (cleanEmail === 'staff' && cleanPass === 'staff') {
      onLogin(UserRole.STAFF, branches[0]?.id);
      setIsLoading(false);
      return;
    }

    // 3. Display Error
    setError(authError?.message || 'Invalid credentials. Please try again.');
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center relative overflow-hidden font-sans">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] mix-blend-screen animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[120px] mix-blend-screen"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 contrast-150 brightness-50"></div>
      </div>

      <div className="z-10 w-full max-w-lg px-6">
        {/* Logo Section */}
        <div className="text-center mb-10 group">
          <div className="inline-flex relative">
            <div className="absolute inset-0 bg-primary blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 p-5 rounded-[2.5rem] shadow-2xl mb-6 transform group-hover:rotate-6 transition-transform duration-500">
              <UtensilsCrossed className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tight mb-2 font-display uppercase tracking-widest">
            Food <span className="text-primary">Boot</span>
          </h1>
          <p className="text-slate-400 font-medium tracking-wide">Enterprise Restaurant Management OS</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-10 rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Account Identity / Email</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="superadmin@foodbot.com"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary/40 transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Security Key</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="superadmin"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary/40 transition-all font-medium"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-bold animate-shake">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              disabled={isLoading || !email || !password}
              className="w-full group relative py-4 bg-primary text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:bg-sky-500 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
            >
              <div className="relative z-10 flex items-center justify-center gap-3">
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>Authenticate</span>
                    <ShieldCheck className="w-5 h-5" />
                  </>
                )}
              </div>
            </button>
          </form>

          {/* Quick Info */}
          <div className="mt-10 pt-8 border-t border-white/5 grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">System Status</span>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[11px] font-bold text-slate-400 capitalize">Online</span>
              </div>
            </div>
            <div className="flex items-center gap-2 justify-end text-primary">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-[10px] font-black uppercase tracking-widest">Supabase Connected</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-slate-600 text-xs font-semibold tracking-wide flex items-center justify-center gap-2">
          <ChefHat className="w-4 h-4" />
          Powered by FOOD BOOT Enterprise Node
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;