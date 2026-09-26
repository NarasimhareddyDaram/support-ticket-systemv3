import { useMemo, useState } from 'react';
import type { Ticket } from '@/lib/supabase';
import { STATUS_META, PRIORITY_META, timeAgo } from '@/lib/ui';
import { Search, Inbox, ChevronRight } from 'lucide-react';

type FilterStatus = 'all' | 'open' | 'in_progress' | 'resolved' | 'closed';

export default function TicketList({
  tickets,
  onSelect,
  selectedId,
  isAgent,
}: {
  tickets: Ticket[];
  onSelect: (t: Ticket) => void;
  selectedId: string | null;
  isAgent: boolean;
}) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterStatus>('all');

  const filtered = useMemo(() => {
    return tickets
      .filter((t) => filter === 'all' || t.status === filter)
      .filter((t) => t.subject.toLowerCase().includes(query.toLowerCase()) || t.description.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }, [tickets, query, filter]);

  const counts = useMemo(() => {
    const c: Record<FilterStatus, number> = { all: tickets.length, open: 0, in_progress: 0, resolved: 0, closed: 0 };
    tickets.forEach((t) => { c[t.status as FilterStatus] = (c[t.status as FilterStatus] || 0) + 1; });
    return c;
  }, [tickets]);

  const tabs: { key: FilterStatus; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'open', label: 'Open' },
    { key: 'in_progress', label: 'Active' },
    { key: 'resolved', label: 'Resolved' },
    { key: 'closed', label: 'Closed' },
  ];

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      <div className="px-4 sm:px-5 pt-4 pb-3 border-b border-slate-100">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">
          {isAgent ? 'All tickets' : 'Your tickets'}
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tickets…"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-colors"
          />
        </div>
        <div className="flex gap-1 mt-3 overflow-x-auto -mx-1 px-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                filter === tab.key
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {tab.label}
              {counts[tab.key] > 0 && (
                <span className={`text-[10px] ${filter === tab.key ? 'text-slate-300' : 'text-slate-400'}`}>
                  {counts[tab.key]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <Inbox className="w-8 h-8 text-slate-300 mb-2" />
            <p className="text-sm text-slate-400">{query ? 'No tickets match your search.' : 'No tickets here yet.'}</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.map((t) => (
              <li key={t.id}>
                <button
                  onClick={() => onSelect(t)}
                  className={`w-full text-left px-4 sm:px-5 py-4 hover:bg-slate-50 transition-colors group ${
                    selectedId === t.id ? 'bg-emerald-50/60 hover:bg-emerald-50/60' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium truncate ${selectedId === t.id ? 'text-emerald-900' : 'text-slate-900'}`}>
                        {t.subject}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{t.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${STATUS_META[t.status].badge}`}>
                          <span className={`w-1 h-1 rounded-full ${STATUS_META[t.status].dot}`} />
                          {STATUS_META[t.status].label}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${PRIORITY_META[t.priority].badge}`}>
                          {PRIORITY_META[t.priority].label}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className="text-[11px] text-slate-400 whitespace-nowrap">{timeAgo(t.updated_at)}</span>
                      <ChevronRight className={`w-4 h-4 transition-colors ${selectedId === t.id ? 'text-emerald-500' : 'text-slate-300 group-hover:text-slate-400'}`} />
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
