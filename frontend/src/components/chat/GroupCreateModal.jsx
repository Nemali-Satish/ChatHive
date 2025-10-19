import React, { useEffect, useMemo, useState } from 'react';
import Avatar from '../ui/Avatar';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../config/constants';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/useAuthStore';
import useChatStore from '../../store/useChatStore';

export default function GroupCreateModal({ open, onClose }) {
  const me = useAuthStore((s) => s.user);
  const { addChat, setSelectedChat } = useChatStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState([]); // array of userIds
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
      setUsers(list.filter((u) => u?._id !== me?._id));
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

  const canSubmit = useMemo(() => name.trim().length > 0 && selected.length >= 1, [name, selected.length]);

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      // Create group
      const payload = { name: name.trim(), users: JSON.stringify(selected) };
      const { data } = await api.post(API_ENDPOINTS.CREATE_GROUP, payload);
      if (!data?.success) throw new Error('Failed to create group');
      let group = data.data;

      // Optional: set description via info endpoint if provided
      if (description.trim().length > 0) {
        try {
          const infoRes = await api.put(API_ENDPOINTS.GROUP_INFO_UPDATE, { chatId: group._id, description: description.trim() });
          if (infoRes.data?.success) group = infoRes.data.data;
        } catch {}
      }

      // Optional: upload avatar
      if (avatarFile) {
        try {
          const fd = new FormData();
          fd.append('avatar', avatarFile);
          fd.append('chatId', group._id);
          const up = await api.put(API_ENDPOINTS.UPDATE_GROUP_AVATAR, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
          if (up.data?.success) {
            group = { ...group, groupAvatar: up.data.data };
          }
        } catch {}
      }

      addChat(group);
      setSelectedChat(group);
      window.dispatchEvent(new Event('refresh-chats'));
      toast.success('Group created');
      onClose?.();
      // reset
      setName('');
      setDescription('');
      setAvatarFile(null);
      setSearch('');
      setSelected([]);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to create group');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-panel border border-default rounded-2xl shadow-xl overflow-hidden">
        <div className="px-5 py-4 bg-header border-b border-default">
          <h3 className="text-base font-semibold text-primary text-center">Create group</h3>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Center icon preview */}
          <div className="flex justify-center">
            <label className="relative cursor-pointer">
              <Avatar src={avatarFile ? URL.createObjectURL(avatarFile) : undefined} alt="Group icon" size="xl" />
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} />
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[11px] text-secondary bg-header px-2 py-0.5 rounded-md border border-default">Upload</span>
            </label>
          </div>

          <div>
            <label className="block text-sm text-secondary mb-1">Group name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field w-full"
              placeholder="e.g. Project Alpha"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-secondary mb-1">Description (optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field w-full"
              placeholder="Short description"
            />
          </div>

          <div>
            <label className="block text-sm text-secondary mb-2">Add members (select at least 1)</label>
            <div className="relative mb-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users"
                className="input-field w-full"
              />
            </div>

            <div className="max-h-56 overflow-y-auto border border-default rounded-lg">
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
                        <p className="text-xs text-secondary truncate">{u.bio || 'Hey there! I am using ChatHive'}</p>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md hover-surface text-sm">Cancel</button>
            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm disabled:opacity-60"
            >
              {submitting ? 'Creating...' : 'Create group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
