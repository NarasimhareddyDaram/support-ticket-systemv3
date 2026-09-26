import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { LifeBuoy, Loader2, Mail, Lock, User, ArrowRight } from 'lucide-react';

type Mode = 'signin' | 'signup';

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);

    try {
      if (mode === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName || 'New customer' } },
        });
        if (signUpError) throw signUpError;
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      }
    } catch (cause) {
      console.error('auth failed', cause);
      setError('That email or password did not work. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: "radial-gradient(circle at 25% 30%, rgba(16,185,129,0.25) 0, transparent 50%), radial-gradient(circle at 75% 70%, rgba(59,130,246,0.18) 0, transparent 50%)"
        }} />
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 text-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/90 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <LifeBuoy className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-semibold tracking-tight">Helpdesk</span>
          </div>
          <div className="space-y-6 max-w-md">
            <h1 className="text-4xl xl:text-5xl font-bold leading-tight tracking-tight">
              Support that moves at the speed of your customers.
            </h1>
            <p className="text-slate-300 text-lg leading-relaxed">
              Track requests, chat with agents, and resolve issues — all in one clean, fast workspace built for both customers and support teams.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              {['Real-time updates', 'Role-based access', 'Audit-ready history'].map((f) => (
                <span key={f} className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-slate-200 backdrop-blur-sm">
                  {f}
                </span>
              ))}
            </div>
          </div>
          <p className="text-slate-400 text-sm">Secure, responsive, and ready for production.</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
              <LifeBuoy className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-white">Helpdesk</span>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-slate-950/40 p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                {mode === 'signin' ? 'Welcome back' : 'Create your account'}
              </h2>
              <p className="text-slate-500 mt-1 text-sm">
                {mode === 'signin' ? 'Sign in to manage your support tickets.' : 'Start submitting and tracking support requests.'}
              </p>
            </div>

            <form onSubmit={submit} className="space-y-4">
              {mode === 'signup' && (
                <Field label="Display name" icon={<User className="w-4 h-4" />}>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    className="w-full bg-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none text-sm"
                  />
                </Field>
              )}
              <Field label="Email" icon={<Mail className="w-4 h-4" />}>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full bg-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none text-sm"
                />
              </Field>
              <Field label="Password" icon={<Lock className="w-4 h-4" />}>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none text-sm"
                />
              </Field>

              {error && (
                <div className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-medium rounded-xl px-4 py-3 text-sm transition-colors"
              >
                {busy ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {mode === 'signin' ? 'Sign in' : 'Create account'}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-500">
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); }}
                className="text-emerald-600 hover:text-emerald-700 font-medium"
              >
                {mode === 'signin' ? 'Sign up' : 'Sign in'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-600 mb-1.5">{label}</span>
      <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100 transition-colors">
        <span className="text-slate-400">{icon}</span>
        {children}
      </div>
    </label>
  );
}
