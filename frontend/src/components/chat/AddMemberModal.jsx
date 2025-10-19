import React, { useEffect, useMemo, useState } from 'react';
import Avatar from '../ui/Avatar';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../config/constants';
import toast from 'react-hot-toast';

export default function AddMemberModal({ open, onClose, chat }) {
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(t);
  }, [search, open]);

  const fetchUsers = async () => {
    if (!open) return;
    setLoading(true);
    try {
      let res;
      const q = search.trim();
      if (q.length > 0) {
        res = await api.get(`${API_ENDPOINTS.SEARCH_USERS}?query=${encodeURIComponent(q)}`);
      } else {
        res = await api.get(API_ENDPOINTS.GET_USERS);
      }
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      const existingIds = new Set((chat?.users || []).map((u) => u._id));
      setUsers(list.filter((u) => !existingIds.has(u._id)));
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (userId) => {
    setSelected((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const canSubmit = useMemo(() => selected.length > 0, [selected.length]);

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      const ids = [...selected];
      for (const id of ids) {
        // Add one by one to leverage existing endpoint and validations
        await api.put(API_ENDPOINTS.ADD_TO_GROUP, { chatId: chat._id, userId: id });
      }
      window.dispatchEvent(new Event('refresh-chats'));
      toast.success('Member(s) added');
      onClose?.(true);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to add members');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!open) {
      setSearch('');
      setUsers([]);
      setSelected([]);
      setSubmitting(false);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={() => onClose?.(false)} />
      <div className="relative z-10 w-full max-w-lg bg-panel border border-default rounded-2xl shadow-xl overflow-hidden">
        <div className="px-5 py-4 bg-header border-b border-default">
          <h3 className="text-base font-semibold text-primary text-center">Add members</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users"
              className="input-field w-full"
              autoFocus
            />
          </div>

          <div className="max-h-72 overflow-y-auto border border-default rounded-lg">
            {loading ? (
              <div className="py-6 text-center text-secondary text-sm">Searching...</div>
            ) : users.length === 0 ? (
              <div className="py-6 text-center text-secondary text-sm">No users</div>
            ) : (
              users.map((u) => {
                const checked = selected.includes(u._id);
                return (
                  <label key={u._id} className="flex items-center gap-3 p-3 border-b border-default cursor-pointer hover-surface last:border-b-0">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSelect(u._id)}
                      className="accent-blue-600"
                    />
                    <Avatar src={u.avatar?.url} alt={u.name} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-primary truncate">{u.name || u.email}</p>
                      <p className="text-xs text-secondary truncate">{u.email}</p>
                    </div>
                  </label>
                );
              })
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={() => onClose?.(false)} className="px-4 py-2 rounded-md hover-surface text-sm">Cancel</button>
            <button type="submit" disabled={!canSubmit || submitting} className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm disabled:opacity-60">
              {submitting ? 'Adding...' : 'Add selected'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
