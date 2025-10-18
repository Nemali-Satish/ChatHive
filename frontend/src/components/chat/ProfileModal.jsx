import React, { useState } from 'react';
import { Camera, User, Mail, X, Check } from 'lucide-react';
import Avatar from '../ui/Avatar';
import useAuthStore from '../../store/useAuthStore';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../config/constants';
import toast from 'react-hot-toast';

const ProfileModal = ({ onClose }) => {
  const { user, updateUser } = useAuthStore();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
  });
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data } = await api.put(API_ENDPOINTS.UPDATE_PROFILE, formData);
      if (data.success) {
        updateUser(data.data);
        toast.success('Profile updated successfully');
        onClose();
      }
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('avatar', file);
    
    setAvatarLoading(true);
    try {
      const { data } = await api.put(API_ENDPOINTS.UPDATE_AVATAR, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (data.success) {
        updateUser({ avatar: data.data });
        toast.success('Avatar updated successfully');
      }
    } catch (error) {
      toast.error('Failed to update avatar');
    } finally {
      setAvatarLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-2 sm:p-4 animate-fadeIn" onClick={onClose}>
      <div className="bg-white dark:bg-[#111b21] rounded-2xl sm:rounded-3xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] shadow-2xl overflow-hidden flex flex-col border border-gray-200 dark:border-gray-800 animate-scaleIn" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 px-4 sm:px-8 py-4 sm:py-6">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <h2 className="text-xl sm:text-2xl font-bold text-white pr-10">Profile Settings</h2>
          <p className="text-blue-100 text-xs sm:text-sm mt-1">Manage your account information</p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit}>
            {/* Avatar Section */}
            <div className="flex flex-col items-center py-6 sm:py-8 px-4 sm:px-8 border-b border-gray-200 dark:border-gray-800">
              <div className="relative inline-block">
                {/* Avatar Container */}
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28">
                  <img
                    src={user?.avatar?.url || 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg'}
                    alt={user?.name}
                    className="w-full h-full rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
                  />
                  {avatarLoading && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                
                {/* Camera Button */}
                <label
                  htmlFor="avatar-upload"
                  className="absolute -bottom-1 -right-1 sm:bottom-0 sm:right-0 p-2.5 sm:p-3 bg-blue-600 hover:bg-blue-700 rounded-full cursor-pointer transition-all shadow-lg hover:scale-110 border-3 border-white dark:border-[#111b21]"
                >
                  <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </label>
                
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                  disabled={avatarLoading}
                />
              </div>
              
              <p className="text-xs sm:text-sm text-gray-500 dark:text-[#8696a0] mt-4 sm:mt-5 text-center px-4 max-w-xs">
                Click the camera icon to change your profile picture
              </p>
            </div>
            
            {/* Form Fields */}
            <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
              {/* Name Field */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-[#e9edef] mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your name"
                    className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3.5 border-2 border-gray-200 dark:border-gray-700 dark:bg-[#202c33] dark:text-[#e9edef] rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm sm:text-base"
                    required
                  />
                </div>
              </div>
              
              {/* Email Field (Read-only) */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-[#e9edef] mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="email"
                    value={user?.email}
                    disabled
                    className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3.5 border-2 border-gray-200 dark:border-gray-700 dark:bg-[#202c33] dark:text-[#8696a0] rounded-xl cursor-not-allowed text-sm sm:text-base"
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-[#8696a0] mt-2">
                  Email cannot be changed
                </p>
              </div>
              
              {/* Bio Field */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-[#e9edef] mb-2">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows="3"
                  maxLength="150"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3.5 border-2 border-gray-200 dark:border-gray-700 dark:bg-[#202c33] dark:text-[#e9edef] rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none text-sm sm:text-base"
                  placeholder="Tell us about yourself..."
                />
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 mt-2">
                  <p className="text-xs text-gray-500 dark:text-[#8696a0]">
                    Share a bit about yourself
                  </p>
                  <p className="text-xs font-semibold text-gray-600 dark:text-[#8696a0]">
                    {formData.bio.length}/150
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 p-4 sm:p-6 bg-gray-50 dark:bg-[#202c33] border-t border-gray-200 dark:border-gray-800">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:flex-1 px-4 sm:px-6 py-2.5 sm:py-3.5 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-[#e9edef] rounded-xl font-semibold hover:bg-gray-100 dark:hover:bg-[#2a3942] transition-all text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:flex-1 px-4 sm:px-6 py-2.5 sm:py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
