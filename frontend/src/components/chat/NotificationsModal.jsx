import React, { useEffect, useState } from 'react';
import Avatar from '../ui/Avatar';
import { Check, X } from 'lucide-react';
import useChatStore from '../../store/useChatStore';
import { formatLastSeen } from '../../utils/helpers';

export default function NotificationsModal({ open, onClose }) {
  const listPendingInvitesAsync = useChatStore((s) => s.listPendingInvitesAsync);
  const acceptInviteAsync = useChatStore((s) => s.acceptInviteAsync);
  const declineInviteAsync = useChatStore((s) => s.declineInviteAsync);
  const fetchChats = useChatStore((s) => s.fetchChats);
  const createChatAsync = useChatStore((s) => s.createChatAsync);
  const listPendingInvitesSentAsync = useChatStore((s) => s.listPendingInvitesSentAsync);
  const [loading, setLoading] = useState(false);
  const [invites, setInvites] = useState([]);
  const [sentPending, setSentPending] = useState([]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      try {
        const resIn = await listPendingInvitesAsync();
        if (resIn.data?.success) setInvites(resIn.data.data || []);
        const resOut = await listPendingInvitesSentAsync();
        if (resOut.data?.success) setSentPending(resOut.data.data || []);
      } finally {
        setLoading(false);
      }
    })();
  }, [open]);

  const onAccept = async (invite) => {
    try {
      const { data } = await acceptInviteAsync(invite._id);
      if (data?.success) {
        setInvites((prev) => prev.filter((i) => i._id !== invite._id));
        // If it's a message invite, create or access a DM with the inviter
        if (invite.type === 'message' && invite?.from?._id) {
          try {
            await createChatAsync(invite.from._id);
            // Clear local pending marker for this user if present
            try {
              const raw = localStorage.getItem('pendingSentInvites');
              const map = raw ? JSON.parse(raw) : {};
              delete map[invite.from._id];
              localStorage.setItem('pendingSentInvites', JSON.stringify(map));
            } catch {}
            // Clear pending friend marker if exists
            try {
              const pfRaw = localStorage.getItem('pendingFriends');
              const pf = pfRaw ? JSON.parse(pfRaw) : {};
              if (pf[invite.from._id]) {
                delete pf[invite.from._id];
                localStorage.setItem('pendingFriends', JSON.stringify(pf));
              }
            } catch {}
          } catch {}
        }
        fetchChats(true);
        try { window.dispatchEvent(new Event('refresh-chats')); } catch {}
        try { window.dispatchEvent(new Event('pending-invite-updated')); } catch {}
        try { window.dispatchEvent(new Event('pending-friend-updated')); } catch {}
      }
    } catch {}
  };

  const onDecline = async (id) => {
    try {
      const { data } = await declineInviteAsync(id);
      if (data?.success) setInvites((prev) => prev.filter((i) => i._id !== id));
    } catch {}
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md mx-auto bg-panel rounded-2xl border border-default shadow-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-default flex items-center justify-between">
          <h3 className="text-base font-semibold text-primary">Notifications</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
        </div>
        <div className="max-h-[70vh] overflow-auto">
          {loading ? (
            <div className="p-6 text-center text-secondary">Loading...</div>
          ) : (
            <>
              {/* Incoming invites */}
              <div className="px-5 py-2 bg-header border-b border-default">
                <div className="text-xs font-semibold text-secondary">Incoming invites</div>
              </div>
              {invites.length === 0 ? (
                <div className="px-5 py-3 text-sm text-secondary">No pending invites</div>
              ) : (
                invites.map((inv) => (
                  <div key={inv._id} className="px-4 py-3 border-b border-default">
                    <div className="flex items-center gap-3">
                      <Avatar src={inv?.from?.avatar?.url} alt={inv?.from?.name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-primary truncate">{inv?.from?.name || inv?.from?.email || 'User'}</div>
                        <div className="text-xs text-secondary truncate">
                          {inv.type === 'group' ? `Group request${inv?.group?.chatName ? ` • ${inv.group.chatName}` : ''}` : 'Message request'}
                        </div>
                        <div className="text-[11px] text-secondary mt-0.5" title={new Date(inv?.createdAt).toLocaleString()}>
                          {formatLastSeen(inv?.createdAt)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button aria-label="Accept" className="p-1.5 rounded-md hover-surface" onClick={() => onAccept(inv)}>
                          <Check className="w-4 h-4 text-green-600" />
                        </button>
                        <button aria-label="Decline" className="p-1.5 rounded-md hover-surface" onClick={() => onDecline(inv._id)}>
                          <X className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {/* Outgoing (sent) requests still pending */}
              <div className="px-5 py-2 bg-header border-t border-default">
                <div className="text-xs font-semibold text-secondary">Sent requests (pending)</div>
              </div>
              {sentPending.length === 0 ? (
                <div className="px-5 py-3 text-sm text-secondary">No pending sent requests</div>
              ) : (
                sentPending.map((p) => (
                  <div key={p._id} className="px-4 py-3 border-b border-default">
                    <div className="flex items-center gap-3">
                      <Avatar src={p?.to?.avatar?.url} alt={p?.to?.name || p?.to?.email} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-primary truncate">{p?.to?.name || p?.to?.email || 'User'}</div>
                        <div className="text-xs text-secondary truncate">Message request • pending</div>
                        <div className="text-[11px] text-secondary mt-0.5" title={p?.createdAt ? new Date(p.createdAt).toLocaleString() : ''}>
                          {p?.createdAt ? formatLastSeen(p.createdAt) : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
