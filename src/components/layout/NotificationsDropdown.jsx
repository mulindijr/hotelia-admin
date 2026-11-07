import React, { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { notificationsApi } from '../../api/notifications';

// Pull a readable message out of Laravel's free-form notification `data` payload
const describe = (n) => {
  const d = n.data || {};
  return {
    title: d.title || d.subject || (n.type ? n.type.split('\\').pop().replace(/([a-z])([A-Z])/g, '$1 $2') : 'Notification'),
    body: d.message || d.body || d.description || '',
  };
};

const NotificationsDropdown = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getNotifications(1),
    refetchInterval: 60000,
  });

  // Supports both { data: [...] } and { data: { data: [...] } } envelopes
  const list = Array.isArray(data?.data) ? data.data : (data?.data?.data || []);
  const unreadCount = list.filter((n) => !n.read_at).length;

  const readMutation = useMutation({
    mutationFn: (id) => notificationsApi.markAsRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const readAllMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="cursor-pointer text-zinc-500 hover:text-zinc-900 relative p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-zinc-900"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-zinc-200 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-100">
            <span className="text-sm font-semibold text-zinc-900">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={() => readAllMutation.mutate()}
                disabled={readAllMutation.isPending}
                className="text-xs text-zinc-600 hover:text-zinc-900 flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto divide-y divide-zinc-100">
            {isLoading ? (
              <p className="px-4 py-6 text-xs text-zinc-400 text-center">Loading...</p>
            ) : list.length === 0 ? (
              <p className="px-4 py-6 text-xs text-zinc-500 text-center">You're all caught up.</p>
            ) : (
              list.map((n) => {
                const { title, body } = describe(n);
                return (
                  <button
                    key={n.id}
                    onClick={() => !n.read_at && readMutation.mutate(n.id)}
                    className={`w-full text-left px-4 py-3 hover:bg-zinc-50 flex gap-2 ${n.read_at ? '' : 'bg-zinc-50/60'}`}
                  >
                    <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.read_at ? 'bg-transparent' : 'bg-red-500'}`} />
                    <span className="min-w-0">
                      <span className={`block text-sm ${n.read_at ? 'text-zinc-600' : 'font-medium text-zinc-900'}`}>{title}</span>
                      {body && <span className="block text-xs text-zinc-500 line-clamp-2">{body}</span>}
                      {n.created_at && (
                        <span className="block text-[11px] text-zinc-400 mt-0.5">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsDropdown;

