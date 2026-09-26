import type { TicketStatus, TicketPriority } from '@/lib/supabase';

export const STATUS_META: Record<TicketStatus, { label: string; dot: string; badge: string }> = {
  open: { label: 'Open', dot: 'bg-sky-500', badge: 'bg-sky-50 text-sky-700 border-sky-200' },
  in_progress: { label: 'In Progress', dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  resolved: { label: 'Resolved', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  closed: { label: 'Closed', dot: 'bg-slate-400', badge: 'bg-slate-100 text-slate-600 border-slate-200' },
};

export const PRIORITY_META: Record<TicketPriority, { label: string; badge: string }> = {
  low: { label: 'Low', badge: 'bg-slate-100 text-slate-600 border-slate-200' },
  medium: { label: 'Medium', badge: 'bg-sky-50 text-sky-700 border-sky-200' },
  high: { label: 'High', badge: 'bg-orange-50 text-orange-700 border-orange-200' },
  urgent: { label: 'Urgent', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export const STATUS_ORDER: TicketStatus[] = ['open', 'in_progress', 'resolved', 'closed'];
export const PRIORITY_ORDER: TicketPriority[] = ['low', 'medium', 'high', 'urgent'];

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}
