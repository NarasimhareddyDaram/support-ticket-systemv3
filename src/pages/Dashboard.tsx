import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Ticket } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import TicketList from '@/components/TicketList';
import TicketDetail from '@/components/TicketDetail';
import NewTicketModal from '@/components/NewTicketModal';
import { Plus, LifeBuoy, LogOut, Sparkles, Headphones, Inbox, Loader2 } from 'lucide-react';

export default function Dashboard() {
  const { profile, signOut } = useAuth();
  const isAgent = profile?.role === 'agent';

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showListMobile, setShowListMobile] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      let query = supabase.from('tickets').select('id, user_id, subject, description, priority, status, assigned_to, created_at, updated_at');
      if (!isAgent) {
        query = query.eq('user_id', profile?.id);
      }
      const { data, error } = await query.order('updated_at', { ascending: false });
      if (error) {
        console.error('tickets fetch failed', error);
      } else if (data) {
        setTickets(data as Ticket[]);
      }
      setLoading(false);
    })();
  }, [profile, isAgent]);

  const handleCreated = (t: Ticket) => {
    setTickets((prev) => [t, ...prev]);
    setShowModal(false);
    setSelected(t);
    setShowListMobile(false);
  };

  const handleTicketUpdated = (updated: Ticket) => {
    setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()));
    setSelected(updated);
  };

  const stats = (() => {
    const open = tickets.filter((t) => t.status === 'open').length;
    const active = tickets.filter((t) => t.status === 'in_progress').length;
    const resolved = tickets.filter((t) => t.status === 'resolved').length;
    return { open, active, resolved, total: tickets.length };
  })();

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      <header className="bg-white border-b border-slate-200 flex-shrink-0">
        <div className="flex items-center justify-between px-4 sm:px-6 h-14">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
              <LifeBuoy className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-base font-semibold text-slate-900 tracking-tight">Helpdesk</span>
            <span className={`ml-2 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${
              isAgent ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-sky-700 bg-sky-50 border-sky-200'
            }`}>
              {isAgent ? 'Agent' : 'Customer'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm text-slate-500">{profile?.display_name}</span>
            <button onClick={signOut} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
              <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className={`${selected && !showListMobile ? 'hidden md:flex' : 'flex'} flex-col flex-1 md:flex-initial md:w-96 lg:w-[420px]`}>
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 bg-white border-b border-slate-200">
            <div className="flex gap-4 text-xs">
              <Stat label="Open" value={stats.open} color="text-sky-600" />
              <Stat label="Active" value={stats.active} color="text-amber-600" />
              <Stat label="Resolved" value={stats.resolved} color="text-emerald-600" />
            </div>
            {!isAgent && (
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg px-3 py-2 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> New
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
            </div>
          ) : tickets.length === 0 ? (
            <EmptyState isAgent={isAgent} onCreate={() => setShowModal(true)} />
          ) : (
            <TicketList
              tickets={tickets}
              onSelect={(t) => { setSelected(t); setShowListMobile(false); }}
              selectedId={selected?.id ?? null}
              isAgent={isAgent}
            />
          )}
        </div>

        <div className={`${selected && !showListMobile ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-slate-50 min-w-0`}>
          {selected ? (
            <TicketDetail
              ticket={selected}
              onBack={() => { setShowListMobile(true); setSelected(null); }}
              onTicketUpdated={handleTicketUpdated}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
              <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-4 shadow-sm">
                {isAgent ? <Headphones className="w-7 h-7 text-slate-400" /> : <Inbox className="w-7 h-7 text-slate-400" />}
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                {isAgent ? 'Select a ticket to respond' : 'Select a ticket to view details'}
              </h3>
              <p className="text-sm text-slate-400 mt-1 max-w-sm">
                {isAgent
                  ? 'Choose a ticket from the list to read the conversation and update its status.'
                  : 'Pick a ticket from the list, or create a new one to get help from our team.'}
              </p>
              {!isAgent && (
                <button
                  onClick={() => setShowModal(true)}
                  className="mt-5 flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-xl px-4 py-2.5 transition-colors"
                >
                  <Plus className="w-4 h-4" /> New ticket
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {showModal && profile && (
        <NewTicketModal userId={profile.id} onClose={() => setShowModal(false)} onCreated={handleCreated} />
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className={`text-sm font-bold ${color}`}>{value}</span>
      <span className="text-[10px] text-slate-400 uppercase tracking-wide">{label}</span>
    </div>
  );
}

function EmptyState({ isAgent, onCreate }: { isAgent: boolean; onCreate: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-12">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <Sparkles className="w-7 h-7 text-slate-400" />
      </div>
      <h3 className="text-base font-semibold text-slate-900">
        {isAgent ? 'No tickets yet' : 'No tickets yet'}
      </h3>
      <p className="text-sm text-slate-400 mt-1 max-w-xs">
        {isAgent
          ? 'When customers submit tickets, they will appear here for you to handle.'
          : 'Create your first support ticket and our team will get right on it.'}
      </p>
      {!isAgent && (
        <button
          onClick={onCreate}
          className="mt-5 flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-xl px-4 py-2.5 transition-colors"
        >
          <Plus className="w-4 h-4" /> Create ticket
        </button>
      )}
    </div>
  );
}
