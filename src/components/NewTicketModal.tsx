import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Ticket, TicketPriority } from '@/lib/supabase';
import { PRIORITY_META, PRIORITY_ORDER } from '@/lib/ui';
import { X, Loader2, Flag } from 'lucide-react';

export default function NewTicketModal({
  userId,
  onClose,
  onCreated,
}: {
  userId: string;
  onClose: () => void;
  onCreated: (t: Ticket) => void;
}) {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const { data, error: insertError } = await supabase
      .from('tickets')
      .insert({ subject, description, priority, user_id: userId })
      .select('id, user_id, subject, description, priority, status, assigned_to, created_at, updated_at')
      .maybeSingle();

    setBusy(false);

    if (insertError || !data) {
      console.error('ticket create failed', insertError);
      setError('Could not create your ticket. Please try again.');
      return;
    }

    onCreated(data as Ticket);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <Flag className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-slate-900">New support ticket</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1.5">Subject</span>
            <input
              required
              minLength={3}
              maxLength={160}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary of the issue"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-colors"
            />
          </label>

          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1.5">Description</span>
            <textarea
              required
              minLength={10}
              maxLength={5000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="Describe the issue in detail. Include steps to reproduce if possible."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-colors resize-none"
            />
          </label>

          <div>
            <span className="block text-xs font-medium text-slate-600 mb-1.5">Priority</span>
            <div className="flex flex-wrap gap-2">
              {PRIORITY_ORDER.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                    priority === p
                      ? PRIORITY_META[p].badge + ' ring-2 ring-offset-1 ring-current'
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {PRIORITY_META[p].label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">{error}</div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-medium rounded-xl px-5 py-2.5 text-sm transition-colors"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              Submit ticket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
