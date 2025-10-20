import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, X } from 'lucide-react';
import Button from '../ui/Button';
import useChatStore from '../../store/useChatStore';
import useAuthStore from '../../store/useAuthStore';
import { getOtherUser } from '../../utils/helpers';
// Network handled via store actions
import { getSocket } from '../../services/socket';
import { SOCKET_EVENTS } from '../../config/constants';
import toast from 'react-hot-toast';

const MessageInput = () => {
  const { selectedChat } = useChatStore();
  const createInviteAsync = useChatStore((s) => s.createInviteAsync);
  const sendMessageAsync = useChatStore((s) => s.sendMessageAsync);
  const user = useAuthStore((state) => state.user);
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); // 0-100 aggregate progress
  const [previews, setPreviews] = useState([]); // [{ url, type, name, size }]
  const [typing, setTyping] = useState(false);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const socket = getSocket();

  const handleTyping = (e) => {
    setMessage(e.target.value);

    if (!typing) {
      setTyping(true);
      socket.emit(SOCKET_EVENTS.TYPING, selectedChat._id);
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit(SOCKET_EVENTS.STOP_TYPING, selectedChat._id);
      setTyping(false);
    }, 1000);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const MAX = 20 * 1024 * 1024; // 20MB
    const valid = [];
    let skipped = 0;
    for (const f of files) {
      if (f.size <= MAX) valid.push(f);
      else skipped++;
    }
    if (skipped > 0) {
      toast.error(`${skipped} file(s) exceeded 20MB and were skipped`);
    }
    if (valid.length) setAttachments([...attachments, ...valid]);
  };

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  // Build object URLs for previews and clean up when attachments change
  useEffect(() => {
    const next = attachments.map((file) => ({
      url: URL.createObjectURL(file),
      type: file.type,
      name: file.name,
      size: file.size,
    }));
    setPreviews(next);
    return () => {
      next.forEach((p) => URL.revokeObjectURL(p.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attachments]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!message.trim() && attachments.length === 0) return;

    setLoading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('content', message);
      formData.append('chatId', selectedChat._id);

      const MAX = 20 * 1024 * 1024;
      let appended = 0;
      let skipped = 0;
      attachments.forEach((file) => {
        if (file.size <= MAX) {
          formData.append('attachments', file);
          appended++;
        } else {
          skipped++;
        }
      });
      if (skipped > 0) {
        toast.error(`${skipped} file(s) exceeded 20MB and were skipped`);
      }
      if (!message.trim() && appended === 0) {
        toast.error('All selected files exceed 20MB');
        return;
      }

      const { data } = await sendMessageAsync({
        chatId: selectedChat._id,
        content: message,
        attachments,
        onUploadProgress: (evt) => {
          if (!evt.total) return;
          const percent = Math.round((evt.loaded * 100) / evt.total);
          setUploadProgress(percent);
        },
      });

      if (data.success) {
        socket.emit(SOCKET_EVENTS.NEW_MESSAGE, data.data);
        setMessage('');
        setAttachments([]);
        setPreviews([]);
        setUploadProgress(0);
        socket.emit(SOCKET_EVENTS.STOP_TYPING, selectedChat._id);
      }
    } catch (error) {
      const code = error?.response?.data?.code;
      const requiresInvite = error?.response?.data?.requiresInvite;
      if (code === 'PRIVATE_USER' && requiresInvite && selectedChat && !selectedChat.isGroupChat) {
        const target = getOtherUser(selectedChat, user?._id);
        if (target && window.confirm('This user is private. Send a message request?')) {
          try {
            await createInviteAsync({ type: 'message', to: target._id });
            toast.success('Invite sent');
          } catch {
            toast.error('Failed to send invite');
          }
        }
      } else {
        toast.error('Failed to send message');
      }
    } finally {
      setLoading(false);
    }
  };

  // Defensive: hide input if user has blocked the other participant in a DM
  const otherUser = selectedChat && !selectedChat.isGroupChat ? getOtherUser(selectedChat, user?._id) : null;
  const blocked = !!(otherUser && (user?.blockedUsers || []).some((id) => id === otherUser._id || id?._id === otherUser._id));
  if (!selectedChat || (!selectedChat.isGroupChat && blocked)) return null;

  return (
    <div className="p-3 bg-panel border-t border-default">
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="overflow-x-auto overflow-y-hidden scrollbar-hide mb-3 pb-2 -mx-1 px-1">
          <div className="inline-flex gap-3">
          {previews.map((p, index) => {
            const isImage = p.type?.startsWith('image/');
            return (
              <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden bg-header flex items-center justify-center flex-shrink-0">
                {isImage ? (
                  <img src={p.url} alt={p.name} className="object-cover w-full h-full" />
                ) : (
                  <div className="p-2 text-center">
                    <Paperclip className="w-5 h-5 mx-auto text-secondary" />
                    <div className="text-[10px] mt-1 line-clamp-2 text-secondary">{p.name}</div>
                  </div>
                )}
                {/* Remove button */}
                <button
                  onClick={() => removeAttachment(index)}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5"
                  title="Remove"
                >
                  <X className="w-3 h-3" />
                </button>
                {/* Upload progress overlay for the whole request */}
                {loading && (
                  <div className="absolute inset-0 bg-black/30 flex items-end">
                    <div className="w-full h-1.5 bg-black/20">
                      <div className="h-1.5 bg-blue-500" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          </div>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 rounded-full hover-surface transition-colors"
        >
          <Paperclip className="w-5 h-5 text-secondary" />
        </button>

        <div className="flex-1 bg-header rounded-lg flex items-center px-3">
         <input
  type="text"
  value={message}
  onChange={handleTyping}
  onKeyDown={handleKeyPress}
  placeholder="Type a message"
  className="flex-1 py-2.5 bg-transparent outline-none text-sm chat-input"
  style={{ color: 'var(--text-primary)' }}
/>
          <button
            type="button"
            className="p-1 rounded-full hover-surface transition-colors"
          >
            <Smile className="w-5 h-5 text-secondary" />
          </button>
        </div>

        <button
          type="submit"
          disabled={loading || (!message.trim() && attachments.length === 0)}
          className="p-2.5 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed btn-primary"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span className="text-xs">{uploadProgress}%</span>
            </div>
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
