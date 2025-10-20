import React, { useState, useEffect } from 'react';
import { X, Search, UserPlus, Loader2 } from 'lucide-react';
import useChatStore from '../../store/useChatStore';
import Avatar from '../ui/Avatar';
import Loader from '../ui/Loader';
import toast from 'react-hot-toast';

const SearchUsers = ({ onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creatingChat, setCreatingChat] = useState(null);
  const searchUsersAsync = useChatStore((s) => s.searchUsersAsync);
  const createChatAsync = useChatStore((s) => s.createChatAsync);
  const { setSelectedChat, addChat } = useChatStore();

  useEffect(() => {
    if (searchQuery.trim()) {
      const timer = setTimeout(() => {
        searchUsers();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setUsers([]);
    }
  }, [searchQuery]);

  const searchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await searchUsersAsync(searchQuery);
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      toast.error('Failed to search users');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = async (userId) => {
    setCreatingChat(userId);
    try {
      const response = await createChatAsync(userId);
      
      if (response.data.success) {
        addChat(response.data.data);
        setSelectedChat(response.data.data);
        toast.success('Chat opened');
        onClose();
      } else {
        toast.error(response.data.message || 'Failed to create chat');
      }
    } catch (error) {
      console.error('Create chat error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to create chat';
      toast.error(errorMsg);
    } finally {
      setCreatingChat(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={onClose}>
      <div className="bg-white dark:bg-[#111b21] rounded-2xl w-full max-w-lg shadow-2xl border border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#202c33]">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">New Chat</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 dark:hover:bg-[#2a3942] rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-[#aebac1]" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-6 pb-4 bg-white dark:bg-[#111b21]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2a3942] text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              autoFocus
            />
          </div>
        </div>

        {/* Results */}
        <div className="px-6 pb-6 max-h-[400px] overflow-y-auto bg-white dark:bg-[#111b21]">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader />
            </div>
          ) : users.length > 0 ? (
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-[#2a3942] rounded-xl cursor-pointer transition-all group border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                  onClick={() => handleSelectUser(user._id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar src={user.avatar?.url} alt={user.name} size="lg" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
                      <p className="text-sm text-gray-500 dark:text-[#8696a0] truncate">{user.email}</p>
                      {user.bio && (
                        <p className="text-xs text-gray-400 dark:text-[#8696a0] truncate mt-1">{user.bio}</p>
                      )}
                    </div>
                  </div>
                  {creatingChat === user._id ? (
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  ) : (
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-full group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                      <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : searchQuery.trim() ? (
            <div className="text-center py-12">
              <div className="bg-gray-100 dark:bg-[#2a3942] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-gray-600 dark:text-[#e9edef] font-medium">No users found</p>
              <p className="text-sm text-gray-400 dark:text-[#8696a0] mt-1">Try searching with a different name or email</p>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-blue-50 dark:bg-blue-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-gray-600 dark:text-[#e9edef] font-medium">Search for friends</p>
              <p className="text-sm text-gray-400 dark:text-[#8696a0] mt-1">Start typing to find users by name or email</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchUsers;
