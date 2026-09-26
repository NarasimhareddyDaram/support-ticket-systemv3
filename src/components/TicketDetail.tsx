import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Ticket, TicketComment, PublicProfile, TicketStatus } from '@/lib/supabase';
import { STATUS_META, STATUS_ORDER, PRIORITY_META, formatDate, timeAgo } from '@/lib/ui';
import { useAuth } from '@/lib/auth';
import { Send, Loader2, ArrowLeft, Clock, Flag, CheckCircle2, XCircle } from 'lucide-react';

export default function TicketDetail({
  ticket,
  onBack,
  onTicketUpdated,
}: {
  ticket: Ticket;
  onBack: () => void;
  onTicketUpdated: (t: Ticket) => void;
}) {
  const { profile } = useAuth();
  const isAgent = profile?.role === 'agent';
  const isOwner = ticket.user_id === profile?.id;

  const [comments, setComments] = useState<TicketComment[]>([]);
  const [authors, setAuthors] = useState<Record<string, PublicProfile>>({});
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [loadingComments, setLoadingComments] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const ticketOwnerName = authors[ticket.user_id]?.display_name ?? (isOwner ? profile?.display_name : null) ?? 'Unknown';

  useEffect(() => {
    (async () => {
      setLoadingComments(true);
      const { data, error: fetchError } = await supabase
        .from('ticket_comments')
        .select('id, ticket_id, user_id, body, created_at')
        .eq('ticket_id', ticket.id)
        .order('created_at', { ascending: true });

      if (fetchError || !data) {
        console.error('comments fetch failed', fetchError);
        setLoadingComments(false);
        return;
      }
      setComments(data as TicketComment[]);

      const commentIds = (data as TicketComment[]).map((c) => c.user_id);
      const uniqueIds = [...new Set([ticket.user_id, ...commentIds])];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, display_name, role')
        .in('id', uniqueIds);
      if (profilesData) {
        const map: Record<string, PublicProfile> = {};
        (profilesData as PublicProfile[]).forEach((p) => { map[p.id] = p; });
        setAuthors(map);
      }
      setLoadingComments(false);
    })();
  }, [ticket.id]);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments.length]);

  const sendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    setError(null);

    const { data, error: insertError } = await supabase
      .from('ticket_comments')
      .insert({ ticket_id: ticket.id, body: body.trim() })
      .select('id, ticket_id, user_id, body, created_at')
      .maybeSingle();

    setBusy(false);

    if (insertError || !data) {
      console.error('comment failed', insertError);
      setError('Could not send your message. Please try again.');
      return;
    }

    setComments((prev) => [...prev, data as TicketComment]);
    if (profile && !authors[profile.id]) {
      setAuthors((prev) => ({ ...prev, [profile.id]: { id: profile.id, display_name: profile.display_name, role: profile.role } }));
    }
    setBody('');
  };

  const updateStatus = async (status: TicketStatus) => {
    const { data, error: updateError } = await supabase
      .from('tickets')
      .update({ status })
      .eq('id', ticket.id)
      .select('id, user_id, subject, description, priority, status, assigned_to, created_at, updated_at')
      .maybeSingle();

    if (updateError || !data) {
      console.error('status update failed', updateError);
      return;
    }
    onTicketUpdated(data as Ticket);
  };

  const assignToMe = async () => {
    if (!profile) return;
    const { data, error: updateError } = await supabase
      .from('tickets')
      .update({ assigned_to: profile.id, status: ticket.status === 'open' ? 'in_progress' : ticket.status })
      .eq('id', ticket.id)
      .select('id, user_id, subject, description, priority, status, assigned_to, created_at, updated_at')
      .maybeSingle();

    if (updateError || !data) {
      console.error('assign failed', updateError);
      return;
    }
    onTicketUpdated(data as Ticket);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-slate-200 bg-white px-4 sm:px-6 py-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-3">
          <ArrowLeft className="w-4 h-4" /> Back to tickets
        </button>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight truncate">{ticket.subject}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_META[ticket.status].badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_META[ticket.status].dot}`} />
                {STATUS_META[ticket.status].label}
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${PRIORITY_META[ticket.priority].badge}`}>
                <Flag className="w-3 h-3" /> {PRIORITY_META[ticket.priority].label}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                <Clock className="w-3 h-3" /> Updated {timeAgo(ticket.updated_at)}
              </span>
            </div>
          </div>

          {isAgent && (
            <div className="flex flex-wrap gap-1.5">
              {STATUS_ORDER.map((s) => (
                <button
                  key={s}
                  onClick={() => updateStatus(s)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    ticket.status === s
                      ? STATUS_META[s].badge + ' ring-1 ring-current'
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {STATUS_META[s].label}
                </button>
              ))}
            </div>
          )}
        </div>

        {isAgent && (
          <div className="mt-3">
            <button
              onClick={assignToMe}
              disabled={ticket.assigned_to === profile?.id}
              className="text-xs font-medium text-emerald-600 hover:text-emerald-700 disabled:text-slate-400 disabled:cursor-default transition-colors"
            >
              {ticket.assigned_to === profile?.id ? 'Assigned to you' : 'Assign to me →'}
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-5">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5">
          <div className="flex items-center gap-2.5 mb-3">
            <Avatar name={ticketOwnerName} />
            <div>
              <p className="text-sm font-medium text-slate-900">{ticketOwnerName}</p>
              <p className="text-xs text-slate-400">{formatDate(ticket.created_at)}</p>
            </div>
            <span className="ml-auto text-xs text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded-full">Original request</span>
          </div>
          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
        </div>

        {loadingComments ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm">
            No replies yet. {isOwner ? 'Agents will respond here soon.' : 'Reply to start the conversation.'}
          </div>
        ) : (
          comments.map((c) => {
            const author = authors[c.user_id];
            const isMine = c.user_id === profile?.id;
            const authorIsAgent = author?.role === 'agent';
            return (
              <div key={c.id} className={`flex gap-3 ${isMine ? 'flex-row-reverse' : ''}`}>
                <Avatar name={author?.display_name} />
                <div className={`max-w-[80%] ${isMine ? 'items-end' : ''}`}>
                  <div className={`flex items-center gap-2 mb-1 ${isMine ? 'justify-end' : ''}`}>
                    <span className="text-sm font-medium text-slate-900">{author?.display_name ?? 'Unknown'}</span>
                    {authorIsAgent && (
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                        Agent
                      </span>
                    )}
                    <span className="text-xs text-slate-400">{timeAgo(c.created_at)}</span>
                  </div>
                  <div className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${
                    isMine
                      ? 'bg-slate-900 text-white rounded-tr-sm'
                      : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm'
                  }`}>
                    {c.body}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={commentsEndRef} />
      </div>

      <div className="border-t border-slate-200 bg-white px-4 sm:px-6 py-4">
        {ticket.status === 'closed' || ticket.status === 'resolved' ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            {ticket.status === 'closed' ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            This ticket is {STATUS_META[ticket.status].label.toLowerCase()}. {isOwner && 'You can still reply if needed.'}
          </div>
        ) : (
          <form onSubmit={sendComment} className="flex items-end gap-3">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendComment(e); } }}
              rows={1}
              placeholder="Write a reply…"
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-colors resize-none max-h-32"
            />
            <button
              type="submit"
              disabled={busy || !body.trim()}
              className="flex items-center justify-center w-11 h-11 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white transition-colors flex-shrink-0"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        )}
        {error && <div className="text-sm text-rose-600 mt-2">{error}</div>}
      </div>
    </div>
  );
}

function Avatar({ name }: { name?: string }) {
  const initials = (name ?? '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-xs font-semibold text-slate-600 flex-shrink-0">
      {initials}
    </div>
  );
}
