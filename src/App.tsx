import { AuthProvider, useAuth } from '@/lib/auth';
import AuthPage from '@/pages/AuthPage';
import Dashboard from '@/pages/Dashboard';
import { LifeBuoy, Loader2 } from 'lucide-react';

function Gate() {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center">
          <LifeBuoy className="w-6 h-6 text-white" />
        </div>
        <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
      </div>
    );
  }

  if (!profile) return <AuthPage />;
  return <Dashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}
