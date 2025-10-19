import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../config/constants';
import toast from 'react-hot-toast';
import Avatar from '../ui/Avatar';

export default function EditGroupModal({ open, onClose, chat }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);

  useEffect(() => {
    if (open && chat) {
      setName(chat.chatName || '');
      setDescription(chat.description || '');
      setAvatarFile(null);
    }
    if (!open) {
      setSubmitting(false);
    }
  }, [open, chat]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (submitting) return;
    const payload = { chatId: chat._id, name: name.trim(), description: description.trim() };
    if (!payload.name && !payload.description && !avatarFile) return onClose?.(false);
    setSubmitting(true);
    try {
      let updatedChat = chat;
      if (payload.name || payload.description) {
        const { data } = await api.put(API_ENDPOINTS.GROUP_INFO_UPDATE, payload);
        if (!data?.success) throw new Error('Failed to update group info');
        updatedChat = data.data;
      }
      if (avatarFile) {
        const fd = new FormData();
        fd.append('avatar', avatarFile);
        fd.append('chatId', chat._id);
        const { data: up } = await api.put(API_ENDPOINTS.UPDATE_GROUP_AVATAR, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        if (!up?.success) throw new Error('Failed to update avatar');
        updatedChat = { ...updatedChat, groupAvatar: up.data };
      }
      toast.success('Group updated');
      onClose?.(updatedChat);
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || 'Update failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={() => onClose?.(false)} />
      <div className="relative z-10 w-full max-w-md bg-panel border border-default rounded-2xl shadow-xl overflow-hidden">
        <div className="px-5 py-4 bg-header border-b border-default">
          <h3 className="text-base font-semibold text-primary">Edit group</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div className="flex justify-center">
            <label className="relative cursor-pointer">
              <Avatar src={avatarFile ? URL.createObjectURL(avatarFile) : chat?.groupAvatar?.url} alt="Group icon" size="xl" />
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} />
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[11px] text-secondary bg-header px-2 py-0.5 rounded-md border border-default">Change</span>
            </label>
          </div>
          <div>
            <label className="block text-sm text-secondary mb-1">Group name</label>
            <input className="input-field w-full" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
          </div>
          <div>
            <label className="block text-sm text-secondary mb-1">Description</label>
            <input className="input-field w-full" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
          </div>
          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={() => onClose?.(false)} className="px-4 py-2 rounded-md hover-surface text-sm">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm disabled:opacity-60">
              {submitting ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
